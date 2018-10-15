/* ------------------------------------------------------------------------ */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems              */
/*                                                                          */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may  */
/* not use this file except in compliance with the License. You may obtain  */
/* a copy of the License at                                                 */
/*                                                                          */
/* http://www.apache.org/licenses/LICENSE-2.0                               */
/*                                                                          */
/* Unless required by applicable law or agreed to in writing, software      */
/* distributed under the License is distributed on an "AS IS" BASIS,        */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. */
/* See the License for the specific language governing permissions and      */
/* limitations under the License.                                           */
/* ------------------------------------------------------------------------ */

#include <limits.h>
#include <string.h>

#include <iostream>
#include <sstream>
#include <openssl/evp.h>
#include <iomanip>

#include "Image.h"
#include "ImagePool.h"

#include "AuthManager.h"
#include "UserPool.h"
#include "NebulaUtil.h"
#include "LifeCycleManager.h"
#include "Nebula.h"

#define TO_UPPER(S) transform(S.begin(),S.end(),S.begin(),(int(*)(int))toupper)

/* ************************************************************************ */
/* Image :: Constructor/Destructor                                          */
/* ************************************************************************ */

Image::Image(int             _uid,
             int             _gid,
             const string&   _uname,
             const string&   _gname,
             int             _umask,
             ImageTemplate * _image_template):
        PoolObjectSQL(-1,IMAGE,"",_uid,_gid,_uname,_gname,table),
        type(OS),
        disk_type(FILE),
        regtime(time(0)),
        source(""),
        path(""),
        fs_type(""),
        size_mb(0),
        state(INIT),
        running_vms(0),
        cloning_ops(0),
        cloning_id(-1),
        ds_id(-1),
        ds_name(""),
        vm_collection("VMS"),
        img_clone_collection("CLONES"),
        app_clone_collection("APP_CLONES"),
        snapshots(-1, false),
        target_snapshot(-1)
    {
        if (_image_template != 0)
        {
            obj_template = _image_template;
        }
        else
        {
            obj_template = new ImageTemplate;
        }

        set_umask(_umask);
    }

Image::~Image(){};

/* ************************************************************************ */
/* Image :: Database Access Functions                                       */
/* ************************************************************************ */

const char * Image::table = "image_pool";

const char * Image::db_names =
        "oid, name, body, uid, gid, owner_u, group_u, other_u";

const char * Image::db_bootstrap = "CREATE TABLE IF NOT EXISTS image_pool ("
    "oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, "
    "gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, "
    "UNIQUE(name,uid) )";

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Image::insert(SqlDB *db, string& error_str)
{
    int rc;

    string type_attr;
    string persistent_attr;
    string dev_prefix;
    string size_attr;
    string tm_mad;

    istringstream iss;
    ostringstream oss;

    // ---------------------------------------------------------------------
    // Check default image attributes
    // ---------------------------------------------------------------------

    // ------------ NAME --------------------

    erase_template_attribute("NAME", name);

    // ------------ TYPE --------------------

    erase_template_attribute("TYPE", type_attr);

    if ( type_attr.empty() == true )
    {
        type_attr = ImagePool::default_type();
    }

    if (set_type(type_attr, error_str) != 0)
    {
        goto error_common;
    }

    // ------------ PERSISTENT & PREFIX --------------------

    erase_template_attribute("PERSISTENT", persistent_attr);

    switch (type)
    {
        case OS:
        case DATABLOCK:
        case CDROM:
            TO_UPPER(persistent_attr);
            persistent_img = (persistent_attr == "YES");

            get_template_attribute("DEV_PREFIX", dev_prefix);

            if( dev_prefix.empty() )
            {
                if (type == CDROM)
                {
                    dev_prefix = ImagePool::default_cdrom_dev_prefix();
                }
                else
                {
                    dev_prefix = ImagePool::default_dev_prefix();
                }

                SingleAttribute * dev_att =
                        new SingleAttribute("DEV_PREFIX", dev_prefix);

                obj_template->set(dev_att);
            }
        break;

        case KERNEL: // Files are always non-persistent with no dev_prefix
        case RAMDISK:
        case CONTEXT:
            persistent_img = false;
            erase_template_attribute("DEV_PREFIX", dev_prefix);
        break;
    }

    // ------------ SIZE --------------------

    erase_template_attribute("SIZE", size_attr);

    iss.str(size_attr);
    iss >> size_mb;

    // ------------ PATH & SOURCE --------------------

    erase_template_attribute("PATH", path);
    erase_template_attribute("SOURCE", source);
    erase_template_attribute("FSTYPE", fs_type);
    erase_template_attribute("TM_MAD", tm_mad);

    if (!is_saving())
    {
        if ( source.empty() && path.empty() && type != DATABLOCK && type != OS)
        {
            goto error_no_path;
        }
        else if ( !source.empty() && !path.empty() )
        {
            goto error_path_and_source;
        }

        if ( path.empty() && type == Image::DATABLOCK )
        {
            if ( fs_type.empty() )
            {
                string driver;

                fs_type = "raw"; //Default

                get_template_attribute("DRIVER", driver);

                one_util::tolower(driver);

                if (driver == "qcow2" || (driver.empty() &&  tm_mad == "qcow2"))
                {
                    fs_type = "qcow2";
                }
            }
        }
        else
        {
            fs_type = "";
        }
    }
    else
    {
        fs_type = "save_as";
    }

    state = LOCKED; //LOCKED till the ImageManager copies it to the Repository
    lock_db(-1,-1, PoolObjectSQL::LockStates::ST_USE);

    //--------------------------------------------------------------------------
    // Insert the Image
    //--------------------------------------------------------------------------

    rc = insert_replace(db, false, error_str);

    return rc;

error_no_path:
    error_str = "No PATH nor SOURCE in template.";
    goto error_common;

error_path_and_source:
    error_str = "Template malformed, PATH and SOURCE are mutually exclusive.";
    goto error_common;

error_common:
    NebulaLog::log("IMG", Log::ERROR, error_str);
    return -1;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Image::update(SqlDB *db)
{
    string error_str;
    return insert_replace(db, true, error_str);
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Image::insert_replace(SqlDB *db, bool replace, string& error_str)
{
    ostringstream   oss;

    int    rc;

    string xml_body;

    char * sql_name;
    char * sql_xml;

    // Update the Image

    sql_name = db->escape_str(name.c_str());

    if ( sql_name == 0 )
    {
        goto error_name;
    }

    sql_xml = db->escape_str(to_xml(xml_body).c_str());

    if ( sql_xml == 0 )
    {
        goto error_body;
    }

    if ( validate_xml(sql_xml) != 0 )
    {
        goto error_xml;
    }

    if(replace)
    {
        oss << "REPLACE";
    }
    else
    {
        oss << "INSERT";
    }

    // Construct the SQL statement to Insert or Replace

    oss <<" INTO "<< table <<" ("<< db_names <<") VALUES ("
        <<          oid             << ","
        << "'" <<   sql_name        << "',"
        << "'" <<   sql_xml         << "',"
        <<          uid             << ","
        <<          gid             << ","
        <<          owner_u         << ","
        <<          group_u         << ","
        <<          other_u         << ")";

    rc = db->exec_wr(oss);

    db->free_str(sql_name);
    db->free_str(sql_xml);

    return rc;

error_xml:
    db->free_str(sql_name);
    db->free_str(sql_xml);

    error_str = "Error transforming the Image to XML.";

    goto error_common;

error_body:
    db->free_str(sql_name);
    goto error_generic;

error_name:
    goto error_generic;

error_generic:
    error_str = "Error inserting Image in DB.";
error_common:
    return -1;
}

/* ************************************************************************ */
/* Image :: Misc                                                             */
/* ************************************************************************ */

string& Image::to_xml(string& xml) const
{
    string        template_xml;
    string        perms_xml;
    ostringstream oss;
    string        vm_collection_xml;
    string        clone_collection_xml;
    string        app_clone_collection_xml;
    string        snapshots_xml;
    string        lock_str;

    oss <<
        "<IMAGE>" <<
            "<ID>"             << oid             << "</ID>"          <<
            "<UID>"            << uid             << "</UID>"         <<
            "<GID>"            << gid             << "</GID>"         <<
            "<UNAME>"          << uname           << "</UNAME>"       <<
            "<GNAME>"          << gname           << "</GNAME>"       <<
            "<NAME>"           << name            << "</NAME>"        <<
            lock_db_to_xml(lock_str)                                  <<
            perms_to_xml(perms_xml)                                   <<
            "<TYPE>"           << type            << "</TYPE>"        <<
            "<DISK_TYPE>"      << disk_type       << "</DISK_TYPE>"   <<
            "<PERSISTENT>"     << persistent_img  << "</PERSISTENT>"  <<
            "<REGTIME>"        << regtime         << "</REGTIME>"     <<
            "<SOURCE>"         << one_util::escape_xml(source) << "</SOURCE>" <<
            "<PATH>"           << one_util::escape_xml(path)   << "</PATH>"   <<
            "<FSTYPE>"         << one_util::escape_xml(fs_type)<< "</FSTYPE>" <<
            "<SIZE>"           << size_mb         << "</SIZE>"        <<
            "<STATE>"          << state           << "</STATE>"       <<
            "<RUNNING_VMS>"    << running_vms     << "</RUNNING_VMS>" <<
            "<CLONING_OPS>"    << cloning_ops     << "</CLONING_OPS>" <<
            "<CLONING_ID>"     << cloning_id      << "</CLONING_ID>"  <<
            "<TARGET_SNAPSHOT>"<< target_snapshot << "</TARGET_SNAPSHOT>"<<
            "<DATASTORE_ID>"   << ds_id           << "</DATASTORE_ID>"<<
            "<DATASTORE>"      << ds_name         << "</DATASTORE>"   <<
            vm_collection.to_xml(vm_collection_xml)                   <<
            img_clone_collection.to_xml(clone_collection_xml)         <<
            app_clone_collection.to_xml(app_clone_collection_xml)     <<
            obj_template->to_xml(template_xml)                        <<
            snapshots.to_xml(snapshots_xml)                           <<
        "</IMAGE>";

    xml = oss.str();

    return xml;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Image::from_xml(const string& xml)
{
    vector<xmlNodePtr> content;
    int int_state;
    int int_type;
    int int_disk_type;

    int rc = 0;

    // Initialize the internal XML object
    update_from_str(xml);

    // Get class base attributes
    rc += xpath(oid,    "/IMAGE/ID",  -1);
    rc += xpath(uid,    "/IMAGE/UID", -1);
    rc += xpath(gid,    "/IMAGE/GID", -1);

    rc += xpath(uname,  "/IMAGE/UNAME", "not_found");
    rc += xpath(gname,  "/IMAGE/GNAME", "not_found");

    rc += xpath(name,   "/IMAGE/NAME", "not_found");

    rc += xpath(int_type,       "/IMAGE/TYPE",      0);
    rc += xpath(int_disk_type,  "/IMAGE/DISK_TYPE", 0);
    rc += xpath(persistent_img, "/IMAGE/PERSISTENT",0);
    rc += xpath<time_t>(regtime,"/IMAGE/REGTIME",   0);

    rc += xpath<long long>(size_mb, "/IMAGE/SIZE", 0);

    rc += xpath(source,     "/IMAGE/SOURCE",     "not_found");
    rc += xpath(int_state,  "/IMAGE/STATE",      0);
    rc += xpath(running_vms,"/IMAGE/RUNNING_VMS",-1);
    rc += xpath(cloning_ops,"/IMAGE/CLONING_OPS",-1);
    rc += xpath(cloning_id, "/IMAGE/CLONING_ID", -1);

    rc += xpath(target_snapshot, "/IMAGE/TARGET_SNAPSHOT", -1);

    rc += xpath(ds_id,          "/IMAGE/DATASTORE_ID",  -1);
    rc += xpath(ds_name,        "/IMAGE/DATASTORE",     "not_found");

    rc += lock_db_from_xml();
    // Permissions
    rc += perms_from_xml();

    //Optional image attributes
    xpath(path,"/IMAGE/PATH", "");
    xpath(fs_type,"/IMAGE/FSTYPE","");

    type      = static_cast<ImageType>(int_type);
    disk_type = static_cast<DiskType>(int_disk_type);
    state     = static_cast<ImageState>(int_state);

    // Get associated classes
    ObjectXML::get_nodes("/IMAGE/TEMPLATE", content);

    if (content.empty())
    {
        return -1;
    }

    rc += obj_template->from_xml_node(content[0]);

    ObjectXML::free_nodes(content);

    content.clear();

    rc += vm_collection.from_xml(this, "/IMAGE/");
    rc += img_clone_collection.from_xml(this, "/IMAGE/");
    rc += app_clone_collection.from_xml(this, "/IMAGE/");

    ObjectXML::get_nodes("/IMAGE/SNAPSHOTS", content);

    if (!content.empty())
    {
        rc += snapshots.from_xml_node(content[0]);

        ObjectXML::free_nodes(content);
        content.clear();
    }

    if (rc != 0)
    {
        return -1;
    }

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

void Image::disk_attribute(VirtualMachineDisk *    disk,
                           ImageType&              img_type,
                           string&                 dev_prefix,
                           const vector<string>&   inherit_attrs)
{
    string target;
    string driver;
    string disk_attr_type;
    string inherit_val;

    bool ro;

    vector<string>::const_iterator it;

    img_type   = type;
    target     = disk->vector_value("TARGET");
    driver     = disk->vector_value("DRIVER");
    dev_prefix = disk->vector_value("DEV_PREFIX");

    long long snap_size;

    string template_target;
    string template_driver;
    string template_ptype;
    string template_size;

    get_template_attribute("TARGET", template_target);
    get_template_attribute("DRIVER", template_driver);
    get_template_attribute("PERSISTENT_TYPE", template_ptype);

    TO_UPPER(template_ptype);

    //---------------------------------------------------------------------------
    //                       DEV_PREFIX ATTRIBUTE
    //---------------------------------------------------------------------------
    if ( dev_prefix.empty() ) //DEV_PEFIX not in DISK, check for it in IMAGE
    {
        get_template_attribute("DEV_PREFIX", dev_prefix);

        if (dev_prefix.empty())//Removed from image template, get it again
        {
            if ( type == CDROM )
            {
                dev_prefix = ImagePool::default_cdrom_dev_prefix();
            }
            else
            {
                dev_prefix = ImagePool::default_dev_prefix();
            }
        }

        disk->replace("DEV_PREFIX", dev_prefix);
    }

    //--------------------------------------------------------------------------
    //                       BASE DISK ATTRIBUTES
    //--------------------------------------------------------------------------
    disk->replace("IMAGE", name);
    disk->replace("IMAGE_ID", oid);
    disk->replace("SOURCE", source);
    disk->replace("ORIGINAL_SIZE", size_mb);

    if ( disk->vector_value("SIZE").empty() )
    {
        disk->replace("SIZE", size_mb);
    }

    snap_size = snapshots.get_total_size();
    disk->replace("DISK_SNAPSHOT_TOTAL_SIZE", snap_size);

    if (driver.empty() && !template_driver.empty())//DRIVER in Image,not in DISK
    {
        disk->replace("DRIVER",template_driver);
    }

    disk->replace("IMAGE_STATE", state);

    //--------------------------------------------------------------------------
    //  READONLY, CLONE & SAVE attributes
    //--------------------------------------------------------------------------
    if ( type == CDROM || template_ptype == "IMMUTABLE" )
    {
        disk->replace("SAVE", "NO");
        disk->replace("CLONE", "NO");
        disk->replace("READONLY", "YES");
    }
    else
    {
        if ( disk->vector_value("READONLY", ro) != 0 )
        {
            if ( get_template_attribute("READONLY", ro) )
            {
                disk->replace("READONLY", ro);
            }
            else
            {
                disk->replace("READONLY", false);
            }
        }

        if ( persistent_img )
        {
            disk->replace("PERSISTENT", "YES");
            disk->replace("CLONE", "NO");
            disk->replace("SAVE", "YES");
        }
        else
        {
            disk->replace("CLONE", "YES");
            disk->replace("SAVE", "NO");
        }
    }

    //Image is being copied/cloned
    if ( state == Image::LOCKED_USED || state == Image::LOCKED_USED_PERS 
            || state == Image::LOCKED )
    {
        disk->replace("CLONING", "YES");
    }
    else
    {
        disk->remove("CLONING");
    }

    //--------------------------------------------------------------------------
    //   TYPE attribute
    //--------------------------------------------------------------------------
    switch(type)
    {
        case OS:
        case DATABLOCK:
            disk_attr_type = disk_type_to_str(disk_type);
            break;

        case CDROM: //Always use CDROM type for these ones
            DiskType new_disk_type;

            switch(disk_type)
            {
                case RBD:
                    new_disk_type = RBD_CDROM;
                    break;

                case SHEEPDOG:
                    new_disk_type = SHEEPDOG_CDROM;
                    break;

                case GLUSTER:
                    new_disk_type = GLUSTER_CDROM;
                    break;

                default:
                    new_disk_type = CD_ROM;
            }

            disk_attr_type = disk_type_to_str(new_disk_type);
            break;

        default: //Other file types should not be never a DISK
            break;
    }

    disk->replace("TYPE", disk_attr_type);

    //--------------------------------------------------------------------------
    //   TARGET attribute
    //--------------------------------------------------------------------------
    // TARGET defined in the Image template, but not in the DISK attribute
    if ( target.empty() && !template_target.empty() )
    {
        disk->replace("TARGET", template_target);
    }

    for (it = inherit_attrs.begin(); it != inherit_attrs.end(); it++)
    {
        get_template_attribute((*it).c_str(), inherit_val);

        if (!inherit_val.empty())
        {
            disk->replace(*it, inherit_val);
        }
    }
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Image::set_type(string& _type, string& error)
{
    int rc = 0;

    TO_UPPER(_type);

    if ((_type != "OS" && _type != "DATABLOCK") && (snapshots.size() > 0))
    {
        error = "Image with snapshots can be only of type OS or DATABLOCK";
        return -1;
    }

    if ( _type == "OS" )
    {
        type = OS;
    }
    else if ( _type == "CDROM" )
    {
        type = CDROM;
    }
    else if ( _type == "DATABLOCK" )
    {
        type = DATABLOCK;
    }
    else if ( _type == "KERNEL" )
    {
        type = KERNEL;
    }
    else if ( _type == "RAMDISK" )
    {
        type = RAMDISK;
    }
    else if ( _type == "CONTEXT" )
    {
        type = CONTEXT;
    }
    else
    {
        error = "Unknown type " + type;
        rc = -1;
    }

    return rc;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

ImageTemplate * Image::clone_template(const string& new_name) const
{

    ImageTemplate * tmpl = new ImageTemplate(
            *(static_cast<ImageTemplate *>(obj_template)));

    tmpl->replace("NAME",   new_name);
    tmpl->replace("TYPE",   type_to_str(type));
    tmpl->replace("PATH",   source);
    tmpl->replace("FSTYPE", fs_type);
    tmpl->replace("SIZE",   size_mb);

    if ( is_persistent() )
    {
        tmpl->replace("PERSISTENT", "YES");
    }
    else
    {
        tmpl->replace("PERSISTENT", "NO");
    }

    return tmpl;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

Image::ImageType Image::str_to_type(string& str_type)
{
    Image::ImageType it = OS;

    if (str_type.empty())
    {
        str_type = ImagePool::default_type();
    }

    TO_UPPER(str_type);

    if ( str_type == "OS" )
    {
        it = OS;
    }
    else if ( str_type == "CDROM" )
    {
        it = CDROM;
    }
    else if ( str_type == "DATABLOCK" )
    {
        it = DATABLOCK;
    }
    else if ( str_type == "KERNEL" )
    {
        it = KERNEL;
    }
    else if ( str_type == "RAMDISK" )
    {
        it = RAMDISK;
    }
    else if ( str_type == "CONTEXT" )
    {
        it = CONTEXT;
    }

    return it;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

Image::DiskType Image::str_to_disk_type(string& s_disk_type)
{
    Image::DiskType type = NONE;

    one_util::toupper(s_disk_type);

    if (s_disk_type == "FILE")
    {
        type = Image::FILE;
    }
    else if (s_disk_type == "BLOCK")
    {
        type = Image::BLOCK;
    }
    else if (s_disk_type == "ISCSI")
    {
        type = Image::ISCSI;
    }
    else if (s_disk_type == "CDROM")
    {
        type = Image::CD_ROM;
    }
    else if (s_disk_type == "RBD")
    {
        type = Image::RBD;
    }
    else if (s_disk_type == "SHEEPDOG")
    {
        type = Image::SHEEPDOG;
    }
    else if (s_disk_type == "GLUSTER")
    {
        type = Image::GLUSTER;
    }

    return type;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

void Image::set_state(ImageState _state)
{
    if (_state == ERROR && (state == LOCKED_USED || state == LOCKED_USED_PERS))
    {
        LifeCycleManager* lcm = Nebula::instance().get_lcm();
        const set<int>& vms   = vm_collection.get_collection();

        for(set<int>::iterator i = vms.begin(); i != vms.end(); i++)
        {
            lcm->trigger(LCMAction::DISK_LOCK_FAILURE, *i);
        }
    } else if( _state == LOCKED)
    {
        lock_db(-1,-1, PoolObjectSQL::LockStates::ST_USE);
    }
    if (_state != LOCKED )
    {
        unlock_db(-1,-1);
    }

    state = _state;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

void Image::set_state_unlock()
{
    LifeCycleManager* lcm = Nebula::instance().get_lcm();

    bool vms_notify = false;

    switch (state) {
        case LOCKED:
            unlock_db(-1,-1);
            set_state(READY);
            break;

        case LOCKED_USED:
            set_state(USED);
            vms_notify = true;
            break;

        case Image::LOCKED_USED_PERS:
            set_state(USED_PERS);
            vms_notify = true;
            break;

        case Image::ERROR:
            if (running_vms == 0)
            {
                set_state(READY);
            }
            else
            {
                if(is_persistent())
                {
                    set_state(USED_PERS);
                }
                else
                {
                    set_state(USED);
                }

                vms_notify = true;
            }
            break;

        default:
            break;
    }

    if ( vms_notify )
    {
        const set<int>& vms = vm_collection.get_collection();

        for(set<int>::iterator i = vms.begin(); i != vms.end(); i++)
        {
            lcm->trigger(LCMAction::DISK_LOCK_SUCCESS, *i);
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool Image::test_set_persistent(Template * image_template, int uid, int gid,
        bool is_allocate)
{
    Nebula&  nd = Nebula::instance();

    string per_oned;
    string conf_name;

    bool persistent  = false;
    bool tmpl_persis = false;

    if ( is_allocate )
    {
        conf_name = "DEFAULT_IMAGE_PERSISTENT_NEW";
    }
    else
    {
        conf_name = "DEFAULT_IMAGE_PERSISTENT";
    }

    bool has_persistent = image_template->get("PERSISTENT", tmpl_persis);

    // Get default persistent value from user, group or oned.conf
    // If no default value found the use PERSISTENT from image template
    int rc = nd.get_configuration_attribute(uid, gid, conf_name, per_oned);

    if ( rc == 0 )
    {
        if ( per_oned.empty() )
        {
            persistent = tmpl_persis;
        }
        else if (one_util::toupper(per_oned) == "YES")
        {
            persistent = true;
        }
    }
    else
    {
        persistent = tmpl_persis;
    }

    // Honor template persistent value for ne.image.allocate
    if (is_allocate && has_persistent)
    {
        persistent = tmpl_persis;
    }

    image_template->replace("PERSISTENT", persistent);

    return persistent;
}

