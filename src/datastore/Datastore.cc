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
        "oid, name, body, uid, gid, owner_u, group_u, other_u, cid";

const char * Datastore::db_bootstrap =
    "CREATE TABLE IF NOT EXISTS datastore_pool ("
    "oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, "
    "gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, "
    "cid INTEGER)";

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
        int                 cluster_id,
        const string&       cluster_name):
            PoolObjectSQL(-1,DATASTORE,"",uid,gid,uname,gname,table),
            ObjectCollection("IMAGES"),
            Clusterable(cluster_id, cluster_name),
            ds_mad(""),
            tm_mad(""),
            base_path(""),
            type(IMAGE_DS),
            total_mb(0),
            free_mb(0),
            used_mb(0),
            state(READY)
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

    vector<string>::const_iterator it;

    oss << oid;

    disk->replace("DATASTORE",    get_name());
    disk->replace("DATASTORE_ID", oss.str());
    disk->replace("TM_MAD",       get_tm_mad());

    if ( get_cluster_id() != ClusterPool::NONE_CLUSTER_ID )
    {
        oss.str("");
        oss << get_cluster_id();

        disk->replace("CLUSTER_ID", oss.str());
    }

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
        get_template_attribute((*it).c_str(), inherit_val);

        if (!inherit_val.empty())
        {
            disk->replace(*it, inherit_val);
        }
    }

    //Initialize TYPE for volatile disks
    if (disk->vector_value("TYPE").empty())
    {
        disk->replace("TYPE", Image::disk_type_to_str(get_disk_type()));
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

int Datastore::set_tm_mad(string &tm_mad, string &error_str)
{
    const VectorAttribute* vatt;

    int    rc;
    string st;

    ostringstream oss;

    rc = Nebula::instance().get_tm_conf_attribute(tm_mad, vatt);

    if (rc != 0)
    {
        oss << "TM_MAD named \"" << tm_mad << "\" is not defined in oned.conf";

        error_str = oss.str();

        return -1;
    }

    if (type == SYSTEM_DS)
    {
        bool shared_type;

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

error:
    oss << "Attribute shared, ln_target or clone_target in TM_MAD_CONF for "
        << tm_mad << " is missing or has wrong value in oned.conf";

    error_str = oss.str();

    return -1;
}

int Datastore::insert(SqlDB *db, string& error_str)
{
    int           rc;
    ostringstream oss;
    string        s_disk_type;
    string        s_ds_type;
    string        datastore_location;

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

    get_template_attribute("TM_MAD", tm_mad);

    if ( tm_mad.empty() == true )
    {
        goto error_empty_tm;
    }

    if (set_tm_mad(tm_mad, error_str) != 0)
    {
        goto error_common;
    }

    erase_template_attribute("BASE_PATH", base_path);

    if (base_path.empty() == true )
    {
        Nebula& nd = Nebula::instance();
        nd.get_configuration_attribute("DATASTORE_BASE_PATH", base_path);
    }

    if ( base_path.at(base_path.size()-1) != '/' )
    {
        base_path += "/";
    }

    add_template_attribute("BASE_PATH", base_path);

    oss << base_path << oid;

    base_path = oss.str();

    erase_template_attribute("DISK_TYPE", s_disk_type);

    disk_type = Image::FILE;

    if ( type == IMAGE_DS )
    {
        if (!s_disk_type.empty())
        {
            disk_type = Image::str_to_disk_type(s_disk_type);

            switch(disk_type)
            {
                case Image::NONE:
                    goto error_disk_type;
                    break;
                case Image::RBD_CDROM:
                case Image::SHEEPDOG_CDROM:
                case Image::GLUSTER_CDROM:
                    goto error_invalid_disk_type;
                    break;
                default:
                    break;
            }
        }

        add_template_attribute("DISK_TYPE", Image::disk_type_to_str(disk_type));
    }

    if ( tm_mad.empty() == true )
    {
        goto error_empty_tm;
    }
    //--------------------------------------------------------------------------
    // Insert the Datastore
    //--------------------------------------------------------------------------

    rc = insert_replace(db, false, error_str);

    return rc;

error_exclusive:
    error_str = "SYSTEM datastores cannot have DS_MAD defined.";
    goto error_common;

error_ds:
    error_str = "No DS_MAD in template.";
    goto error_common;

error_empty_tm:
    error_str = "No TM_MAD in template.";
    goto error_common;

error_disk_type:
    error_str = "Unknown DISK_TYPE in template.";
    goto error_common;

error_invalid_disk_type:
    error_str = "Invalid DISK_TYPE in template.";
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
        <<          other_u             << ","
        <<          cluster_id          << ")";


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
    string          collection_xml;
    string          template_xml;
    string          perms_xml;

    ObjectCollection::to_xml(collection_xml);

    oss <<
    "<DATASTORE>"               <<
        "<ID>"                  << oid          << "</ID>"          <<
        "<UID>"                 << uid          << "</UID>"         <<
        "<GID>"                 << gid          << "</GID>"         <<
        "<UNAME>"               << uname        << "</UNAME>"       <<
        "<GNAME>"               << gname        << "</GNAME>"       <<
        "<NAME>"                << name         << "</NAME>"        <<
        perms_to_xml(perms_xml) <<
        "<DS_MAD><![CDATA["     << ds_mad       << "]]></DS_MAD>"   <<
        "<TM_MAD><![CDATA["     << tm_mad       << "]]></TM_MAD>"   <<
        "<BASE_PATH><![CDATA["  << base_path    << "]]></BASE_PATH>"<<
        "<TYPE>"                << type         << "</TYPE>"        <<
        "<DISK_TYPE>"           << disk_type    << "</DISK_TYPE>"   <<
        "<STATE>"               << state        << "</STATE>"       <<
        "<CLUSTER_ID>"          << cluster_id   << "</CLUSTER_ID>"  <<
        "<CLUSTER>"             << cluster      << "</CLUSTER>"     <<
        "<TOTAL_MB>"            << total_mb     << "</TOTAL_MB>"    <<
        "<FREE_MB>"             << free_mb      << "</FREE_MB>"     <<
        "<USED_MB>"             << used_mb      << "</USED_MB>"     <<
        collection_xml          <<
        obj_template->to_xml(template_xml)                  <<
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
    rc += xpath(base_path,    "/DATASTORE/BASE_PATH", "not_found");
    rc += xpath(int_ds_type,  "/DATASTORE/TYPE",      -1);
    rc += xpath(int_disk_type,"/DATASTORE/DISK_TYPE", -1);
    rc += xpath(int_state,    "/DATASTORE/STATE",     0);

    rc += xpath(cluster_id, "/DATASTORE/CLUSTER_ID", -1);
    rc += xpath(cluster,    "/DATASTORE/CLUSTER",    "not_found");

    rc += xpath(total_mb, "/DATASTORE/TOTAL_MB", 0);
    rc += xpath(free_mb,  "/DATASTORE/FREE_MB",  0);
    rc += xpath(used_mb,  "/DATASTORE/USED_MB",  0);

    // Permissions
    rc += perms_from_xml();

    disk_type = static_cast<Image::DiskType>(int_disk_type);
    type      = static_cast<Datastore::DatastoreType>(int_ds_type);
    state     = static_cast<DatastoreState>(int_state);

    // Get associated classes
    ObjectXML::get_nodes("/DATASTORE/IMAGES", content);

    if (content.empty())
    {
        return -1;
    }

    // Set of IDs
    rc += ObjectCollection::from_xml_node(content[0]);

    ObjectXML::free_nodes(content);
    content.clear();

    // Get associated classes
    ObjectXML::get_nodes("/DATASTORE/TEMPLATE", content);

    if (content.empty())
    {
        return -1;
    }

    rc += obj_template->from_xml_node(content[0]);

    ObjectXML::free_nodes(content);

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
    string new_disk_type_st;
    string new_base_path;

    Image::DiskType new_disk_type;

    DatastoreType old_ds_type;
    DatastoreType new_ds_type;

    /* ---------------------------------------------------------------------- */
    /* Set the TYPE of the Datastore (class & template)                       */
    /* ---------------------------------------------------------------------- */

    old_ds_type = type;

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
            type = old_ds_type;

            return -1;
        }

        tm_mad = new_tm_mad;
    }
    else
    {
        replace_template_attribute("TM_MAD", tm_mad);
    }

    /* ---------------------------------------------------------------------- */
    /* Set the DISK_TYPE (class & template)                                   */
    /* ---------------------------------------------------------------------- */

    erase_template_attribute("DISK_TYPE", new_disk_type_st);

    if ( type == IMAGE_DS )
    {
        if (!new_disk_type_st.empty())
        {
            new_disk_type = Image::str_to_disk_type(new_disk_type_st);

            if (new_disk_type != Image::NONE)
            {
                disk_type = new_disk_type;
            }
        }

        add_template_attribute("DISK_TYPE", Image::disk_type_to_str(disk_type));
    }
    else
    {
        disk_type = Image::FILE;
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
    /* Set the BASE_PATH of the Datastore (class & template)                  */
    /* ---------------------------------------------------------------------- */

    erase_template_attribute("BASE_PATH", new_base_path);

    if ( !new_base_path.empty())
    {
        ostringstream oss;

        if ( new_base_path.at(new_base_path.size()-1) != '/' )
        {
            new_base_path += "/";
        }

        add_template_attribute("BASE_PATH", new_base_path);

        oss << new_base_path << oid;

        base_path = oss.str();
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
