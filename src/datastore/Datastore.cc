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

Datastore::Datastore(int                id,
                     DatastoreTemplate* ds_template):
                PoolObjectSQL(id,DATASTORE,"",-1,-1,"","",table),
                ObjectCollection("IMAGES"),
                type(""),
                tm_mad(""),
                base_path("")
{
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

    return 0;
}

/* ************************************************************************ */
/* Datastore :: Database Access Functions                                   */
/* ************************************************************************ */

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Datastore::insert(SqlDB *db, string& error_str)
{
    int rc;

    // ---------------------------------------------------------------------
    // Check default datastore attributes
    // ---------------------------------------------------------------------

    erase_template_attribute("NAME", name);
    // NAME is checked in DatastorePool::allocate

    erase_template_attribute("TYPE", type);

    if ( type.empty() == true )
    {
        goto error_type;
    }

    erase_template_attribute("TM_MAD", tm_mad);

    if ( tm_mad.empty() == true )
    {
        goto error_tm;
    }

    erase_template_attribute("BASE_PATH", base_path);

    if ( base_path.empty() == true )
    {
        goto error_base_path;
    }

    //--------------------------------------------------------------------------
    // Insert the Datastore
    //--------------------------------------------------------------------------

    rc = insert_replace(db, false, error_str);

    return rc;

error_type:
    error_str = "No TYPE in template.";
    goto error_common;

error_tm:
    error_str = "No TM_MAD in template.";
    goto error_common;

error_base_path:
    error_str = "No BASE_PATH in template.";
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

    // Set the owner and group to oneadmin
    set_user(0, "");
    set_group(GroupPool::ONEADMIN_ID, GroupPool::ONEADMIN_NAME);

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

    ObjectCollection::to_xml(collection_xml);

    oss <<
    "<DATASTORE>"    <<
        "<ID>"          << oid          << "</ID>"   <<
        "<NAME>"        << name         << "</NAME>" <<
        "<TYPE>"        << type         << "</TYPE>" <<
        "<TM_MAD>"      << tm_mad       << "</TM_MAD>" <<
        "<BASE_PATH>"   << base_path    << "</BASE_PATH>" <<
        collection_xml <<
    "</DATASTORE>";

    xml = oss.str();

    return xml;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Datastore::from_xml(const string& xml)
{
    int rc = 0;
    vector<xmlNodePtr> content;

    // Initialize the internal XML object
    update_from_str(xml);

    // Get class base attributes
    rc += xpath(oid,        "/DATASTORE/ID",        -1);
    rc += xpath(name,       "/DATASTORE/NAME",      "not_found");
    rc += xpath(type,       "/DATASTORE/TYPE",      "not_found");
    rc += xpath(tm_mad,     "/DATASTORE/TM_MAD",    "not_found");
    rc += xpath(base_path,  "/DATASTORE/BASE_PATH", "not_found");

    // Set the owner and group to oneadmin
    set_user(0, "");
    set_group(GroupPool::ONEADMIN_ID, GroupPool::ONEADMIN_NAME);

    // Get associated classes
    ObjectXML::get_nodes("/DATASTORE/IMAGES", content);

    if (content.empty())
    {
        return -1;
    }

    // Set of IDs
    rc += ObjectCollection::from_xml_node(content[0]);

    ObjectXML::free_nodes(content);

    if (rc != 0)
    {
        return -1;
    }

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

