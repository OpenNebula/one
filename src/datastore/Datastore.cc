/* ------------------------------------------------------------------------ */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)           */
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
    "oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, uid INTEGER, "
    "gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, "
    "UNIQUE(name))";

/* ************************************************************************ */
/* Datastore :: Constructor/Destructor                                      */
/* ************************************************************************ */

Datastore::Datastore(
        int                 uid,
        int                 gid,
        const string&       uname,
        const string&       gname,
        DatastoreTemplate*  ds_template,
        int                 cluster_id,
        const string&       cluster_name):
            PoolObjectSQL(-1,DATASTORE,"",uid,gid,uname,gname,table),
            ObjectCollection("IMAGES"),
            Clusterable(cluster_id, cluster_name),
            ds_mad(""),
            tm_mad(""),
            base_path("")
{
    group_u = 1;

    if (ds_template != 0)
    {
        obj_template = ds_template;
    }
    else
    {
        obj_template = new DatastoreTemplate;
    }
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Datastore::disk_attribute(VectorAttribute * disk)
{
    ostringstream oss;

    oss << oid;

    disk->replace("DATASTORE",      get_name());
    disk->replace("DATASTORE_ID",   oss.str());
    disk->replace("TM_MAD",         get_tm_mad());

    if ( get_cluster_id() != ClusterPool::NONE_CLUSTER_ID )
    {
        oss.str("");
        oss << get_cluster_id();

        disk->replace("CLUSTER_ID", oss.str());
    }

    return 0;
}

/* ************************************************************************ */
/* Datastore :: Database Access Functions                                   */
/* ************************************************************************ */

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Datastore::insert(SqlDB *db, string& error_str)
{
    int           rc;
    ostringstream oss;
    string        s_disk_type;

    Nebula& nd = Nebula::instance();

    // ---------------------------------------------------------------------
    // Check default datastore attributes
    // ---------------------------------------------------------------------

    erase_template_attribute("NAME", name);
    // NAME is checked in DatastorePool::allocate

    get_template_attribute("DS_MAD", ds_mad);

    if ( ds_mad.empty() == true )
    {
        goto error_ds;
    }

    get_template_attribute("TM_MAD", tm_mad);

    if ( tm_mad.empty() == true )
    {
        goto error_tm;
    }

    oss << nd.get_ds_location() << oid;

    base_path = oss.str();

    get_template_attribute("DISK_TYPE", s_disk_type);

    if (s_disk_type == "BLOCK")
    {
        disk_type = Image::BLOCK;
    } 
    else if (s_disk_type == "CDROM")
    {
        disk_type = Image::CD_ROM;
    }
    else
    {
        disk_type = Image::FILE;
    }

    if ( tm_mad.empty() == true )
    {
        goto error_tm;
    }
    //--------------------------------------------------------------------------
    // Insert the Datastore
    //--------------------------------------------------------------------------

    rc = insert_replace(db, false, error_str);

    return rc;

error_ds:
    error_str = "No DS_MAD in template.";
    goto error_common;

error_tm:
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
    string          collection_xml;
    string          template_xml;
    string          perms_xml;

    ObjectCollection::to_xml(collection_xml);

    oss <<
    "<DATASTORE>"    <<
        "<ID>"          << oid          << "</ID>"          <<
        "<UID>"         << uid          << "</UID>"         <<
        "<GID>"         << gid          << "</GID>"         <<
        "<UNAME>"       << uname        << "</UNAME>"       <<
        "<GNAME>"       << gname        << "</GNAME>"       <<
        "<NAME>"        << name         << "</NAME>"        <<
        perms_to_xml(perms_xml)                             <<
        "<DS_MAD>"      << ds_mad       << "</DS_MAD>"      <<
        "<TM_MAD>"      << tm_mad       << "</TM_MAD>"      <<
        "<BASE_PATH>"   << base_path    << "</BASE_PATH>"   <<
        "<DISK_TYPE>"   << disk_type    << "</DISK_TYPE>"   <<
        "<CLUSTER_ID>"  << cluster_id   << "</CLUSTER_ID>"  <<
        "<CLUSTER>"     << cluster      << "</CLUSTER>"     <<
        collection_xml  <<
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
    rc += xpath(int_disk_type,"/DATASTORE/DISK_TYPE", -1);

    rc += xpath(cluster_id, "/DATASTORE/CLUSTER_ID", -1);
    rc += xpath(cluster,    "/DATASTORE/CLUSTER",    "not_found");

    // Permissions
    rc += perms_from_xml();

    disk_type = static_cast<Image::DiskType>(int_disk_type);

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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Datastore::replace_template(const string& tmpl_str, string& error)
{
    string new_ds_mad;
    string new_tm_mad;

    int rc;

    rc = PoolObjectSQL::replace_template(tmpl_str, error);

    if ( rc != 0 )
    {
        return rc;
    }

    get_template_attribute("DS_MAD", new_ds_mad);

    if ( !new_ds_mad.empty() )
    {
        ds_mad = new_ds_mad;
    }
    else
    {
        replace_template_attribute("DS_MAD", ds_mad);
    }

    get_template_attribute("TM_MAD", new_tm_mad);

    if ( !new_tm_mad.empty() )
    {
        tm_mad = new_tm_mad;
    }
    else
    {
        replace_template_attribute("TM_MAD", tm_mad);
    }

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

