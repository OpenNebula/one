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

#include <limits.h>
#include <string.h>

#include <iostream>
#include <sstream>

#include "Group.h"

const char * Group::table = "group_pool";

const char * Group::db_names =
        "oid, name, body, uid, gid, owner_u, group_u, other_u";

const char * Group::db_bootstrap = "CREATE TABLE IF NOT EXISTS group_pool ("
    "oid INTEGER PRIMARY KEY, name VARCHAR(128), body TEXT, uid INTEGER, "
    "gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, "
    "UNIQUE(name))";

/* ************************************************************************ */
/* Group :: Database Access Functions                                       */
/* ************************************************************************ */

int Group::insert_replace(SqlDB *db, bool replace, string& error_str)
{
    ostringstream   oss;

    int    rc;
    string xml_body;

    char * sql_name;
    char * sql_xml;

    // Set oneadmin as the owner
    set_user(0,"");

    // Set the Group ID as the group it belongs to
    set_group(oid, name);

    // Update the Group

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

    error_str = "Error transforming the Group to XML.";

    goto error_common;

error_body:
    db->free_str(sql_name);
    goto error_generic;

error_name:
    goto error_generic;

error_generic:
    error_str = "Error inserting Group in DB.";
error_common:
    return -1;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

string& Group::to_xml(string& xml) const
{
    ostringstream   oss;
    string          collection_xml;
    string          quota_xml;

    ObjectCollection::to_xml(collection_xml);
    
    quota.to_xml(quota_xml);

    oss <<
    "<GROUP>"    <<
        "<ID>"   << oid  << "</ID>"   <<
        "<NAME>" << name << "</NAME>" <<
        collection_xml <<
        quota_xml <<
    "</GROUP>";

    xml = oss.str();

    return xml;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Group::from_xml(const string& xml)
{
    int rc = 0;
    vector<xmlNodePtr> content;

    // Initialize the internal XML object
    update_from_str(xml);

    // Get class base attributes
    rc += xpath(oid, "/GROUP/ID",   -1);
    rc += xpath(name,"/GROUP/NAME", "not_found");

    // Set oneadmin as the owner
    set_user(0,"");

    // Set the Group ID as the group it belongs to
    set_group(oid, name);

    // Get associated classes
    ObjectXML::get_nodes("/GROUP/USERS", content);

    if (content.empty())
    {
        return -1;
    }

    // Set of IDs
    rc += ObjectCollection::from_xml_node(content[0]);

    ObjectXML::free_nodes(content);

    rc += quota.from_xml(this); 

    if (rc != 0)
    {
        return -1;
    }

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

