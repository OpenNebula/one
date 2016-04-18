/* ------------------------------------------------------------------------ */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems              */
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
#include "GroupPool.h"
#include "NebulaLog.h"
#include "Nebula.h"

const char * Datastore::table = "datastore_pool";

const char * Datastore::db_names =
        "oid, name, body, uid, gid, owner_u, group_u, other_u";

const char * Datastore::db_bootstrap =
    "CREATE TABLE IF NOT EXISTS datastore_pool ("
    "oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, "
    "gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER)";

/* ************************************************************************ */
/* Datastore :: Constructor/Destructor                                      */
/* ************************************************************************ */

Datastore::Datastore(
        int                 uid,
        int                 gid,
        const string&       uname,
        const string&       gname,
        int                 umask,
        DatastoreTemplate*  ds_template,
        const set<int>      &cluster_ids):
            PoolObjectSQL(-1,DATASTORE,"",uid,gid,uname,gname,table),
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
    if (ds_template != 0)
    {
        obj_template = ds_template;
    }
    else
    {
        obj_template = new DatastoreTemplate;
    }

    set_umask(umask);

    group_u = 1;
}

Datastore::~Datastore()
{
    delete obj_template;
};

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
        VectorAttribute *       disk,
        const vector<string>&   inherit_attrs)
{
    ostringstream oss;
    string st;
    string inherit_val;
    string current_val;

    vector<string>::const_iterator it;

    oss << oid;

    disk->replace("DATASTORE",    get_name());
    disk->replace("DATASTORE_ID", oss.str());
    disk->replace("TM_MAD",       get_tm_mad());

    set<int> cluster_ids = get_cluster_ids();

    disk->replace("CLUSTER_ID", one_util::join(cluster_ids, ','));

    get_template_attribute("CLONE_TARGET", st);

    if(!st.empty())
    {
        disk->replace("CLONE_TARGET", st);
    }

    get_template_attribute("LN_TARGET", st);

    if(!st.empty())
    {
        disk->replace("LN_TARGET", st);
    }

    for (it = inherit_attrs.begin(); it != inherit_attrs.end(); it++)
    {
        current_val = disk->vector_value((*it).c_str());
        get_template_attribute((*it).c_str(), inherit_val);

        if ( current_val.empty() && !inherit_val.empty() )
        {
            disk->replace(*it, inherit_val);
        }
    }

    if (VirtualMachine::is_volatile(disk))
    {
        disk->replace("DISK_TYPE", Image::disk_type_to_str(get_disk_type()));
    }
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

int Datastore::set_ds_mad(std::string &mad, std::string &error_str)
{
    const VectorAttribute* vatt;
    std::vector <std::string> vrequired_attrs;

    int    rc;
    std::string required_attrs, required_attr, value;

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

    for ( std::vector<std::string>::const_iterator it = vrequired_attrs.begin();
         it != vrequired_attrs.end(); it++ )
    {
        required_attr = *it;

        required_attr = one_util::trim(required_attr);
        one_util::toupper(required_attr);

        get_template_attribute(required_attr.c_str(), value);

        if ( value.empty() )
        {
            goto error_required;
        }
    }

    return 0;

error_conf:
    oss << "DS_MAD named \"" << mad << "\" is not defined in oned.conf";
    goto error_common;

error_required:
    oss << "Datastore template is missing the \"" << required_attr
        << "\" attribute or it's empty.";

error_common:
    error_str = oss.str();
    return -1;
}

/* -------------------------------------------------------------------------- */

int Datastore::set_tm_mad(string &tm_mad, string &error_str)
{
    const VectorAttribute* vatt;

    string st;

    ostringstream oss;

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
    else
    {
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

        remove_template_attribute("SHARED");
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
                    break;

                case Image::GLUSTER:
                case Image::SHEEPDOG:
                case Image::BLOCK:
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
            break;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */

int Datastore::insert(SqlDB *db, string& error_str)
{
    string s_disk_type;
    string s_ds_type;
    string datastore_location;

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

    if ( tm_mad.empty() == true )
    {
        goto error_empty_tm;
    }

    if (set_tm_mad(tm_mad, error_str) != 0)
    {
        goto error_common;
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

    if ( tm_mad.empty() == true )
    {
        goto error_empty_tm;
    }

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

error_empty_tm:
    error_str = "No TM_MAD in template.";
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

    if ( replace )
    {
        oss << "REPLACE";
    }
    else
    {
        oss << "INSERT";
    }

    // Construct the SQL statement to Insert or Replace

    oss <<" INTO "<<table <<" ("<< db_names <<") VALUES ("
        <<          oid                 << ","
        << "'" <<   sql_name            << "',"
        << "'" <<   sql_xml             << "',"
        <<          uid                 << ","
        <<          gid                 << ","
        <<          owner_u             << ","
        <<          group_u             << ","
        <<          other_u             << ")";

    rc = db->exec(oss);

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
    string new_base_path;

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

    /* ---------------------------------------------------------------------- */
    /* Set the TYPE of the Datastore (class & template)                       */
    /* ---------------------------------------------------------------------- */

    if ( oid == DatastorePool::SYSTEM_DS_ID )
    {
        type = SYSTEM_DS;
    }
    else
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

    if ( !new_tm_mad.empty() )
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

bool Datastore::get_avail_mb(long long &avail)
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

bool Datastore::is_persistent_only()
{
    int rc;
    bool persistent_only = false;

    const VectorAttribute* vatt;

    rc = Nebula::instance().get_ds_conf_attribute(ds_mad, vatt);

    if ( rc != 0 )
    {
        // No DS_MAD_CONF is available for this DS_MAD.
        // Assuming this DS is not PERSISTENT_ONLY
        return false;
    }

    vatt->vector_value("PERSISTENT_ONLY", persistent_only);

    return persistent_only;
};
