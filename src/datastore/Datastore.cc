/* ------------------------------------------------------------------------ */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems              */
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

#include "Datastore.h"
#include "DatastorePool.h"
#include "GroupPool.h"
#include "NebulaLog.h"
#include "Nebula.h"
#include "VirtualMachineDisk.h"
#include "OneDB.h"

using namespace std;

/* ************************************************************************ */
/* Datastore :: Constructor/Destructor                                      */
/* ************************************************************************ */

Datastore::Datastore(
        int                 uid,
        int                 gid,
        const string&       uname,
        const string&       gname,
        int                 umask,
        unique_ptr<DatastoreTemplate>  ds_template,
        const set<int>      &cluster_ids):
            PoolObjectSQL(-1,DATASTORE,"",uid,gid,uname,gname,one_db::ds_table),
            Clusterable(cluster_ids),
            ds_mad(""),
            tm_mad(""),
            base_path(""),
            type(IMAGE_DS),
            disk_type(Image::FILE),
            total_mb(0),
            free_mb(0),
            used_mb(0),
            state(READY),
            images("IMAGES")
{
    if (ds_template)
    {
        obj_template = move(ds_template);
    }
    else
    {
        obj_template = make_unique<DatastoreTemplate>();
    }

    set_umask(umask);

    group_u = 1;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Datastore::enable(bool enable, string& error_str)
{
    if (type != SYSTEM_DS)
    {
        error_str = "Only SYSTEM_DS can be disabled or enabled";
        return -1;
    }


    if (enable)
    {
        state = READY;
    }
    else
    {
        state = DISABLED;
    }

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

void Datastore::disk_attribute(
        VirtualMachineDisk *    disk,
        const vector<string>&   inherit_attrs)
{
    string st, tm_mad_system;
    string inherit_val;

    disk->replace("DATASTORE", get_name());
    disk->replace("DATASTORE_ID", oid);
    disk->replace("TM_MAD", get_tm_mad());

    const set<int>& cluster_ids = get_cluster_ids();

    disk->replace("CLUSTER_ID", one_util::join(cluster_ids, ','));

    tm_mad_system = disk->get_tm_mad_system();

    if (!tm_mad_system.empty())
    {
        tm_mad_system = one_util::trim(tm_mad_system);
        one_util::toupper(tm_mad_system);
    }

    if (!tm_mad_system.empty())
    {
        get_template_attribute("CLONE_TARGET_" + tm_mad_system, st);

        if (st.empty())
        {
            get_template_attribute("CLONE_TARGET", st);
        }
    }
    else
    {
        get_template_attribute("CLONE_TARGET", st);
    }

    if(!st.empty() && disk->vector_value("CLONE_TARGET").empty())
    {
        disk->replace("CLONE_TARGET", st);
    }

    if (!tm_mad_system.empty())
    {
        get_template_attribute("LN_TARGET_" + tm_mad_system, st);

        if (st.empty())
        {
            get_template_attribute("LN_TARGET", st);
        }
    }
    else
    {
        get_template_attribute("LN_TARGET", st);
    }

    if(!st.empty() && disk->vector_value("LN_TARGET").empty())
    {
        disk->replace("LN_TARGET", st);
    }

    for (const auto& inherit : inherit_attrs)
    {
        if (auto va = PoolObjectSQL::get_template_attribute(inherit))
        {
            // Vector attribute, inherit all its values
            const auto& values = va->value();

            for (const auto& val : values)
            {
                string current_val = disk->vector_value(val.first);

                if (current_val.empty() && !val.second.empty())
                {
                    disk->replace(val.first, val.second);
                }
            }
        }
        else
        {
            // Simple attribute, inherit value
            string current_val = disk->vector_value(inherit);
            PoolObjectSQL::get_template_attribute(inherit, inherit_val);

            if (current_val.empty() && !inherit_val.empty())
            {
                disk->replace(inherit, inherit_val);
            }
        }
    }

    if (!tm_mad_system.empty())
    {
        get_template_attribute("DISK_TYPE_" + tm_mad_system, st);

        if (!st.empty())
        {
            disk->set_types(st);
        }
    }
    else if (disk->is_volatile() && disk->vector_value("DISK_TYPE").empty())
    {
        disk->replace("DISK_TYPE", Image::disk_type_to_str(get_disk_type()));
    }

    /* Set DRIVER & FORMAT for volatile disks, precedence:
     *  1. TM_MAD_CONF/DRIVER in oned.conf
     *  2. DRIVER in system DS template
     *  3. DRIVER in DISK
     *  4. Default set to "raw"
     */

    string type_disk = disk->vector_value("TYPE");

    one_util::toupper(type_disk);

    if (type_disk!= "CDROM" && disk->is_volatile())
    {
        string driver = get_ds_driver();

        if (type_disk == "FS") /* Volatile Datablock */
        {
            if (!driver.empty()) /* DRIVER in TM_MAD_CONF or DS Template */
            {
                disk->replace("DRIVER", driver);
                disk->replace("FORMAT", driver);
            }
            else if (!disk->vector_value("FORMAT").empty()) /* DRIVER in DISK */
            {
                disk->replace("DRIVER", disk->vector_value("FORMAT"));
            }
            else /* Default for volatiles */
            {
                disk->replace("DRIVER", "raw");
                disk->replace("FORMAT", "raw");
            }
        }
        else /* SWAP */
        {
            disk->replace("DRIVER", "raw");
            disk->replace("FORMAT", "raw");
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string Datastore::get_ds_driver()
{
    string driver = "";
    const VectorAttribute* vatt;

    int rc = Nebula::instance().get_tm_conf_attribute(get_tm_mad(), vatt);

    if ( rc == 0 )
    {
        vatt->vector_value("DRIVER", driver);
    }

    if (driver.empty())
    {
        get_template_attribute("DRIVER", driver);
    }

    return driver;
}

/* ************************************************************************ */
/* Datastore :: Database Access Functions                                   */
/* ************************************************************************ */

Datastore::DatastoreType Datastore::str_to_type(string& str_type)
{
    Datastore::DatastoreType dst = IMAGE_DS;

    if (str_type.empty())
    {
        return dst;
    }

    one_util::toupper(str_type);

    if ( str_type == "IMAGE_DS" )
    {
        dst = IMAGE_DS;
    }
    else if ( str_type == "SYSTEM_DS" )
    {
        dst = SYSTEM_DS;
    }
    else if ( str_type == "FILE_DS" )
    {
        dst = FILE_DS;
    }
    else if ( str_type == "BACKUP_DS" )
    {
        dst = BACKUP_DS;
    }

    return dst;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static int check_tm_target_type(string& tm_tt)
{
    if (tm_tt.empty())
    {
        return -1;
    }

    one_util::toupper(tm_tt);

    if ((tm_tt != "NONE") && (tm_tt != "SELF") && (tm_tt != "SYSTEM"))
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */

int Datastore::set_ds_mad(const std::string &mad, std::string &error_str)
{
    const VectorAttribute* vatt;
    std::vector <std::string> vrequired_attrs;

    int    rc;
    std::string required_attrs, value;

    std::ostringstream oss;

    if ( type == SYSTEM_DS ) //No ds_mad for SYSTEM_DS
    {
        return 0;
    }

    rc = Nebula::instance().get_ds_conf_attribute(mad, vatt);

    if ( rc != 0 )
    {
        goto error_conf;
    }

    rc = vatt->vector_value("REQUIRED_ATTRS", required_attrs);

    if ( rc == -1 ) //No required attributes
    {
        return 0;
    }

    vrequired_attrs = one_util::split(required_attrs, ',');

    for ( auto& required_attr : vrequired_attrs )
    {
        required_attr = one_util::trim(required_attr);
        one_util::toupper(required_attr);

        get_template_attribute(required_attr, value);

        if ( value.empty() )
        {
            oss << "Datastore template is missing the \"" << required_attr
                << "\" attribute or it's empty.";
            goto error_common;
        }
    }

    return 0;

error_conf:
    oss << "DS_MAD named \"" << mad << "\" is not defined in oned.conf";
    goto error_common;

error_common:
    error_str = oss.str();
    return -1;
}

/* -------------------------------------------------------------------------- */

int Datastore::set_tm_mad(const string &tm_mad, string &error_str)
{
    const VectorAttribute* vatt;

    std::vector<std::string> modes;

    ostringstream oss;

    string orph;

    if (tm_mad.empty())
    {
        error_str = "No TM_MAD in template.";
        return -1;
    }

    if ( Nebula::instance().get_tm_conf_attribute(tm_mad, vatt) != 0 )
    {
        goto error_conf;
    }

    if (type == SYSTEM_DS)
    {
        bool shared_type;
        bool ds_migrate;

        if (vatt->vector_value("SHARED", shared_type) == -1)
        {
            goto error;
        }

        if (shared_type)
        {
            replace_template_attribute("SHARED", "YES");
        }
        else
        {
            replace_template_attribute("SHARED", "NO");
        }

        if (vatt->vector_value("DS_MIGRATE", ds_migrate) == -1)
        {
            ds_migrate = true;
        }

        if (ds_migrate)
        {
            replace_template_attribute("DS_MIGRATE", "YES");
        }
        else
        {
            replace_template_attribute("DS_MIGRATE", "NO");
        }

        remove_template_attribute("LN_TARGET");
        remove_template_attribute("CLONE_TARGET");
    }
    else if (type != BACKUP_DS)
    {
        string st = vatt->vector_value("TM_MAD_SYSTEM");

        if (!st.empty())
        {
            replace_template_attribute("TM_MAD_SYSTEM", st);

            modes = one_util::split(st, ',', true);

            for (const auto &mode : modes)
            {
                string tm = one_util::trim(mode);
                one_util::toupper(tm);

                st = vatt->vector_value("LN_TARGET_" + tm);

                if (check_tm_target_type(st) == -1)
                {
                    goto error;
                }

                replace_template_attribute("LN_TARGET_" + tm, st);

                st = vatt->vector_value("CLONE_TARGET_" + tm);

                if (check_tm_target_type(st) == -1)
                {
                    goto error;
                }

                replace_template_attribute("CLONE_TARGET_" + tm, st);

                st = vatt->vector_value("DISK_TYPE_" + tm);

                if (st.empty())
                {
                    goto error;
                }

                replace_template_attribute("DISK_TYPE_" + tm, st);
            }
        }

        st = vatt->vector_value("LN_TARGET");

        if (check_tm_target_type(st) == -1)
        {
            goto error;
        }

        replace_template_attribute("LN_TARGET", st);

        st = vatt->vector_value("CLONE_TARGET");

        if (check_tm_target_type(st) == -1)
        {
            goto error;
        }

        replace_template_attribute("CLONE_TARGET", st);

        st = vatt->vector_value("DRIVER");

        if (!st.empty())
        {
            replace_template_attribute("DRIVER", st);
        }

        st = vatt->vector_value("DISK_TYPE");

        if (!st.empty())
        {
            replace_template_attribute("DISK_TYPE", st);
        }

        remove_template_attribute("SHARED");
    }

    if ( type != BACKUP_DS )
    {
        if ( vatt->vector_value("ALLOW_ORPHANS", orph) == -1 )
        {
            orph = "NO";
        }

        replace_template_attribute("ALLOW_ORPHANS", orph);
    }

    return 0;

error_conf:
    oss << "TM_MAD named \"" << tm_mad << "\" is not defined in oned.conf";
    goto error_common;

error:
    oss << "Attribute shared, ln_target or clone_target in TM_MAD_CONF for "
        << tm_mad << " is missing or has wrong value in oned.conf";

error_common:
    error_str = oss.str();
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Datastore::set_ds_disk_type(string& s_dt, string& error)
{
    if (s_dt.empty())
    {
       disk_type = Image::FILE;
    }
    else
    {
       disk_type = Image::str_to_disk_type(s_dt);
    }

    switch(type)
    {
        case IMAGE_DS:
            switch(disk_type)
            {
                //Valid disk types for Image DS
                case Image::FILE:
                case Image::BLOCK:
                case Image::ISCSI:
                case Image::RBD:
                case Image::GLUSTER:
                case Image::SHEEPDOG:
                    break;

                case Image::CD_ROM:
                case Image::RBD_CDROM:
                case Image::SHEEPDOG_CDROM:
                case Image::GLUSTER_CDROM:
                    error = "Invalid DISK_TYPE for an Image Datastore.";
                    return -1;

                case Image::NONE:
                    error = "Unknown DISK_TYPE in template.";
                    return -1;
            }
            break;

        case SYSTEM_DS:
            switch(disk_type)
            {
                //Valid disk types for System DS
                case Image::FILE:
                case Image::RBD:
                case Image::BLOCK:
                    break;

                case Image::GLUSTER:
                case Image::SHEEPDOG:
                case Image::ISCSI:
                case Image::CD_ROM:
                case Image::RBD_CDROM:
                case Image::SHEEPDOG_CDROM:
                case Image::GLUSTER_CDROM:
                    error = "Invalid DISK_TYPE for a System Datastore.";
                    return -1;

                case Image::NONE:
                    error = "Unknown DISK_TYPE in template.";
                    return -1;
            }
            break;

        case FILE_DS:
        case BACKUP_DS:
            disk_type = Image::FILE;
            break;
    }

    switch(type)
    {
        case IMAGE_DS:
        case SYSTEM_DS:
            add_template_attribute("DISK_TYPE", Image::disk_type_to_str(disk_type));
            break;
        case FILE_DS:
        case BACKUP_DS:
            break;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */

int Datastore::insert(SqlDB *db, string& error_str)
{
    string s_disk_type;
    string s_ds_type;

    string safe_dirs;
    string restricted_dirs;

    ostringstream oss;

    // -------------------------------------------------------------------------
    // Check default datastore attributes
    // -------------------------------------------------------------------------

    erase_template_attribute("NAME", name);//DatastorePool::allocate checks NAME

    get_template_attribute("DS_MAD", ds_mad);
    get_template_attribute("TYPE", s_ds_type);

    type = str_to_type(s_ds_type);

    if ( type == SYSTEM_DS )
    {
        if ( !ds_mad.empty() )
        {
            goto error_exclusive;
        }

        ds_mad = "-";
    }
    else if ( ds_mad.empty() == true )
    {
        goto error_ds;
    }

    if (set_ds_mad(ds_mad, error_str) != 0)
    {
        goto error_common;
    }

    get_template_attribute("TM_MAD", tm_mad);

    if ( type != BACKUP_DS )
    {
        if (set_tm_mad(tm_mad, error_str) != 0)
        {
            goto error_common;
        }
    }
    else
    {
        tm_mad = "-";
    }

    remove_template_attribute("BASE_PATH");

    Nebula::instance().get_ds_location(base_path);

    if ( base_path.at(base_path.size()-1) != '/' )
    {
        base_path += "/";
    }

    oss << base_path << oid;

    base_path = oss.str();

    erase_template_attribute("DISK_TYPE", s_disk_type);

    if (set_ds_disk_type(s_disk_type, error_str) == -1)
    {
        goto error_common;
    }

    //--------------------------------------------------------------------------
    // Set default SAFE_DIRS & RESTRICTED_DIRS if not set
    //--------------------------------------------------------------------------
    get_template_attribute("SAFE_DIRS", safe_dirs);
    get_template_attribute("RESTRICTED_DIRS", restricted_dirs);

    if ( safe_dirs.empty() && restricted_dirs.empty() )
    {
        replace_template_attribute("SAFE_DIRS", "/var/tmp");
        replace_template_attribute("RESTRICTED_DIRS", "/");
    }

    // Encrypt all the secrets
    encrypt();

    //--------------------------------------------------------------------------
    // Insert the Datastore
    //--------------------------------------------------------------------------
    return insert_replace(db, false, error_str);

error_exclusive:
    error_str = "SYSTEM datastores cannot have DS_MAD defined.";
    goto error_common;

error_ds:
    error_str = "No DS_MAD in template.";
    goto error_common;

error_common:
    NebulaLog::log("DATASTORE", Log::ERROR, error_str);
    return -1;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Datastore::insert_replace(SqlDB *db, bool replace, string& error_str)
{
    ostringstream   oss;

    int    rc;
    string xml_body;

    char * sql_name;
    char * sql_xml;

    // Update the Datastore

    sql_name = db->escape_str(name);

    if ( sql_name == 0 )
    {
        goto error_name;
    }

    sql_xml = db->escape_str(to_xml(xml_body));

    if ( sql_xml == 0 )
    {
        goto error_body;
    }

    if ( validate_xml(sql_xml) != 0 )
    {
        goto error_xml;
    }

    if ( replace )
    {
        oss << "UPDATE " << one_db::ds_table << " SET "
            << "name = '"    << sql_name << "', "
            << "body = '"    << sql_xml  << "', "
            << "uid = "      << uid      << ", "
            << "gid = "      << gid      << ", "
            << "owner_u = "  << owner_u  << ", "
            << "group_u = "  << group_u  << ", "
            << "other_u = "  << other_u
            << " WHERE oid = " << oid;
    }
    else
    {
        oss << "INSERT INTO " << one_db::ds_table
            << " ("<< one_db::ds_db_names << ") VALUES ("
            <<          oid                 << ","
            << "'" <<   sql_name            << "',"
            << "'" <<   sql_xml             << "',"
            <<          uid                 << ","
            <<          gid                 << ","
            <<          owner_u             << ","
            <<          group_u             << ","
            <<          other_u             << ")";
    }

    rc = db->exec_wr(oss);

    db->free_str(sql_name);
    db->free_str(sql_xml);

    return rc;

error_xml:
    db->free_str(sql_name);
    db->free_str(sql_xml);

    error_str = "Error transforming the Datastore to XML.";

    goto error_common;

error_body:
    db->free_str(sql_name);
    goto error_generic;

error_name:
    goto error_generic;

error_generic:
    error_str = "Error inserting Datastore in DB.";
error_common:
    return -1;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Datastore::bootstrap(SqlDB * db)
{
    ostringstream oss(one_db::ds_db_bootstrap);

    return db->exec_local_wr(oss);
};

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

string& Datastore::to_xml(string& xml) const
{
    ostringstream   oss;
    string          clusters_xml;
    string          images_xml;
    string          template_xml;
    string          perms_xml;

    oss <<
    "<DATASTORE>"               <<
        "<ID>"                  << oid          << "</ID>"        <<
        "<UID>"                 << uid          << "</UID>"       <<
        "<GID>"                 << gid          << "</GID>"       <<
        "<UNAME>"               << uname        << "</UNAME>"     <<
        "<GNAME>"               << gname        << "</GNAME>"     <<
        "<NAME>"                << name         << "</NAME>"      <<
        perms_to_xml(perms_xml) <<
        "<DS_MAD>"    << one_util::escape_xml(ds_mad)    << "</DS_MAD>"    <<
        "<TM_MAD>"    << one_util::escape_xml(tm_mad)    << "</TM_MAD>"    <<
        "<BASE_PATH>" << one_util::escape_xml(base_path) << "</BASE_PATH>" <<
        "<TYPE>"                << type         << "</TYPE>"      <<
        "<DISK_TYPE>"           << disk_type    << "</DISK_TYPE>" <<
        "<STATE>"               << state        << "</STATE>"     <<
        Clusterable::to_xml(clusters_xml)       <<
        "<TOTAL_MB>"            << total_mb     << "</TOTAL_MB>"  <<
        "<FREE_MB>"             << free_mb      << "</FREE_MB>"   <<
        "<USED_MB>"             << used_mb      << "</USED_MB>"   <<
        images.to_xml(images_xml)               <<
        obj_template->to_xml(template_xml)      <<
    "</DATASTORE>";

    xml = oss.str();

    return xml;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Datastore::from_xml(const string& xml)
{
    int rc = 0;
    int int_disk_type;
    int int_ds_type;
    int int_state;
    vector<xmlNodePtr> content;

    ostringstream oss;

    // Initialize the internal XML object
    update_from_str(xml);

    // Get class base attributes
    rc += xpath(oid,          "/DATASTORE/ID",        -1);
    rc += xpath(uid,          "/DATASTORE/UID",       -1);
    rc += xpath(gid,          "/DATASTORE/GID",       -1);
    rc += xpath(uname,        "/DATASTORE/UNAME",     "not_found");
    rc += xpath(gname,        "/DATASTORE/GNAME",     "not_found");
    rc += xpath(name,         "/DATASTORE/NAME",      "not_found");
    rc += xpath(ds_mad,       "/DATASTORE/DS_MAD",    "not_found");
    rc += xpath(tm_mad,       "/DATASTORE/TM_MAD",    "not_found");
    rc += xpath(int_ds_type,  "/DATASTORE/TYPE",      -1);
    rc += xpath(int_disk_type,"/DATASTORE/DISK_TYPE", -1);
    rc += xpath(int_state,    "/DATASTORE/STATE",     0);

    rc += xpath<long long>(total_mb,"/DATASTORE/TOTAL_MB",0);
    rc += xpath<long long>(free_mb, "/DATASTORE/FREE_MB", 0);
    rc += xpath<long long>(used_mb, "/DATASTORE/USED_MB", 0);

    // Permissions
    rc += perms_from_xml();

    disk_type = static_cast<Image::DiskType>(int_disk_type);
    type      = static_cast<Datastore::DatastoreType>(int_ds_type);
    state     = static_cast<DatastoreState>(int_state);

    // Set of Image IDs
    rc += images.from_xml(this, "/DATASTORE/");

    // Set of cluster IDs
    rc += Clusterable::from_xml(this, "/DATASTORE/");

    // Get associated classes
    ObjectXML::get_nodes("/DATASTORE/TEMPLATE", content);

    if (content.empty())
    {
        return -1;
    }

    rc += obj_template->from_xml_node(content[0]);

    ObjectXML::free_nodes(content);

    Nebula::instance().get_ds_location(base_path);

    if ( base_path.at(base_path.size()-1) != '/' )
    {
        base_path += "/";
    }

    oss << base_path << oid;

    base_path = oss.str();

    if (rc != 0)
    {
        return -1;
    }

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Datastore::post_update_template(string& error_str)
{
    string new_ds_mad;
    string new_tm_mad;
    string s_ds_type;
    string new_disk_type;

    DatastoreType new_ds_type;

    DatastoreType   old_ds_type   = type;
    Image::DiskType old_disk_type = disk_type;
    string          old_tm_mad    = tm_mad;
    string          old_ds_mad    = ds_mad;

    /* ---------------------------------------------------------------------- */
    /* Set the TYPE of the Datastore (class & template)                       */
    /* ---------------------------------------------------------------------- */

    get_template_attribute("TYPE", s_ds_type);

    if (!s_ds_type.empty())
    {
        new_ds_type = str_to_type(s_ds_type);
    }
    else //No TYPE in the new Datastore template
    {
        new_ds_type = type;
    }

    if ( oid == DatastorePool::SYSTEM_DS_ID )
    {
        type = SYSTEM_DS;
    }
    else if ( type != BACKUP_DS ) // Do not change BACKUP DS types
    {
        type = new_ds_type;
    }

    replace_template_attribute("TYPE", type_to_str(type));

    /* ---------------------------------------------------------------------- */
    /* Set the DISK_TYPE (class & template)                                   */
    /* ---------------------------------------------------------------------- */

    erase_template_attribute("DISK_TYPE", new_disk_type);

    if (!new_disk_type.empty())
    {
        if ( set_ds_disk_type(new_disk_type, error_str) == -1 )
        {
            //Rollback variable changes
            type      = old_ds_type;
            disk_type = old_disk_type;

            return -1;
        }
    }

    /* ---------------------------------------------------------------------- */
    /* Set the TM_MAD of the Datastore (class & template)                     */
    /* ---------------------------------------------------------------------- */

    get_template_attribute("TM_MAD", new_tm_mad);

    if (!new_tm_mad.empty() && (type != BACKUP_DS))
    {
        // System DS are monitored by the TM mad, reset information
        if ( type == SYSTEM_DS && new_tm_mad != tm_mad )
        {
            update_monitor(0, 0, 0);
        }

        if (set_tm_mad(new_tm_mad, error_str) != 0)
        {
            type      = old_ds_type;
            disk_type = old_disk_type;

            return -1;
        }

        tm_mad = new_tm_mad;
    }
    else
    {
        replace_template_attribute("TM_MAD", tm_mad);
    }

    /* ---------------------------------------------------------------------- */
    /* Set the DS_MAD of the Datastore (class & template)                     */
    /* ---------------------------------------------------------------------- */

    get_template_attribute("DS_MAD", new_ds_mad);

    if ( type == SYSTEM_DS )
    {
        ds_mad = "-";

        remove_template_attribute("DS_MAD");
    }
    else
    {
        if ( new_ds_mad.empty() )
        {
            replace_template_attribute("DS_MAD", ds_mad);
        }
        else if ( new_ds_mad != ds_mad)
        {
            ds_mad = new_ds_mad;

            // DS are monitored by the DS mad, reset information
            update_monitor(0, 0, 0);
        }
    }

    /* ---------------------------------------------------------------------- */
    /* Verify that the template has the required attributees                  */
    /* ---------------------------------------------------------------------- */

    if ( set_ds_mad(ds_mad, error_str) !=  0 )
    {
        type      = old_ds_type;
        disk_type = old_disk_type;
        tm_mad    = old_tm_mad;
        ds_mad    = old_ds_mad;

        return -1;
    }

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

bool Datastore::get_avail_mb(long long &avail) const
{
    long long   limit_mb;
    long long   free_limited;
    bool        check;

    avail = free_mb;

    if (get_template_attribute("LIMIT_MB", limit_mb))
    {
        free_limited = limit_mb - used_mb;

        if (free_limited < free_mb)
        {
            avail = free_limited;
        }
    }

    if (avail < 0)
    {
        avail = 0;
    }

    if (!get_template_attribute("DATASTORE_CAPACITY_CHECK", check))
    {
        Nebula& nd = Nebula::instance();

        nd.get_configuration_attribute("DATASTORE_CAPACITY_CHECK", check);
    }

    return check;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

template <typename T>
static T ds_conf_value(const string& mad, const string& name, const T& defval)
{
    const VectorAttribute* vatt;

    int rc = Nebula::instance().get_ds_conf_attribute(mad, vatt);

    if ( rc != 0 )
    {
        // No DS_MAD_CONF is available for this DS_MAD.
        return defval;
    }

    T value;

    rc = vatt->vector_value(name, value);

    if ( rc != 0 )
    {
        // Attribute missing in DS_MAD_CONF
        return defval;
    }

    return value;
}

/* -------------------------------------------------------------------------- */

bool Datastore::is_persistent_only() const
{
    return ds_conf_value(ds_mad, "PERSISTENT_ONLY", false);
}

bool Datastore::is_concurrent_forget() const
{
    return ds_conf_value(ds_mad, "CONCURRENT_FORGET", false);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Datastore::get_tm_mad_targets(const string &tm_mad, string& ln_target,
        string& clone_target, string& disk_type) const
{
    if (tm_mad.empty())
    {
        return 0;
    }

    string tm_mad_t = one_util::trim(tm_mad);
    one_util::toupper(tm_mad_t);

    get_template_attribute("CLONE_TARGET_" + tm_mad_t, clone_target);

    if (clone_target.empty())
    {
        return -1;
    }

    get_template_attribute("LN_TARGET_" + tm_mad_t, ln_target);

    if (ln_target.empty())
    {
        return -1;
    }

    get_template_attribute("DISK_TYPE_" + tm_mad_t, disk_type);

    if (disk_type.empty())
    {
        return -1;
    }

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

Image::DiskType Datastore::context_disk_type() const
{
    Image::DiskType ctxt_dt = Image::FILE;
    string          ctxt_dt_s;

    get_template_attribute("CONTEXT_DISK_TYPE", ctxt_dt_s);

    if (!ctxt_dt_s.empty())
    {
        ctxt_dt = Image::str_to_disk_type(ctxt_dt_s);
    }

    switch(ctxt_dt)
    {
        //Valid disk types for context devices
        case Image::FILE:
        case Image::BLOCK:
            return ctxt_dt;

        case Image::NONE:
        case Image::ISCSI:
        case Image::RBD:
        case Image::GLUSTER:
        case Image::SHEEPDOG:
        case Image::CD_ROM:
        case Image::RBD_CDROM:
        case Image::SHEEPDOG_CDROM:
        case Image::GLUSTER_CDROM:
            break;
    }

    return Image::FILE;
}
