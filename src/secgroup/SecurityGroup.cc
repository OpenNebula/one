/* ------------------------------------------------------------------------ */
/* Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs      */
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

#include "SecurityGroup.h"

/* ------------------------------------------------------------------------ */

const char * SecurityGroup::table = "secgroup_pool";

const char * SecurityGroup::db_names =
        "oid, name, body, uid, gid, owner_u, group_u, other_u";

const char * SecurityGroup::db_bootstrap = "CREATE TABLE IF NOT EXISTS secgroup_pool ("
    "oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, "
    "gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, "
    "UNIQUE(name,uid))";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

SecurityGroup::SecurityGroup(
        int             _uid,
        int             _gid,
        const string&   _uname,
        const string&   _gname,
        int             _umask,
        Template*       sgroup_template):
        PoolObjectSQL(-1, SECGROUP, "", _uid,_gid,_uname,_gname,table)
{
    if (sgroup_template != 0)
    {
        obj_template = sgroup_template;
    }
    else
    {
        obj_template = new Template;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

SecurityGroup::~SecurityGroup()
{
    delete obj_template;
};

/* ************************************************************************ */
/* SecurityGroup :: Database Access Functions                               */
/* ************************************************************************ */

int SecurityGroup::insert(SqlDB *db, string& error_str)
{
    erase_template_attribute("NAME",name);

    if (name.empty())
    {
        goto error_name;
    }

    if ( insert_replace(db, false, error_str) != 0 )
    {
        goto error_db;
    }

    return 0;

error_name:
    error_str = "No NAME in template for Security Group.";
    goto error_common;

error_db:
error_common:
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SecurityGroup::insert_replace(SqlDB *db, bool replace, string& error_str)
{
    ostringstream   oss;

    int    rc;
    string xml_body;

    char * sql_name;
    char * sql_xml;

    // Update the security group

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

    error_str = "Error transforming the Security Group to XML.";

    goto error_common;

error_body:
    db->free_str(sql_name);
    goto error_generic;

error_name:
    goto error_generic;

error_generic:
    error_str = "Error inserting Security Group in DB.";
error_common:
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& SecurityGroup::to_xml(string& xml) const
{
    ostringstream   oss;
    string          template_xml;
    string          perms_xml;

    oss <<
    "<SECURITY_GROUP>"    <<
        "<ID>"      << oid      << "</ID>"          <<
        "<UID>"     << uid      << "</UID>"         <<
        "<GID>"     << gid      << "</GID>"         <<
        "<UNAME>"   << uname    << "</UNAME>"       <<
        "<GNAME>"   << gname    << "</GNAME>"       <<
        "<NAME>"    << name     << "</NAME>"        <<
        perms_to_xml(perms_xml)                                   <<
        obj_template->to_xml(template_xml) <<
    "</SECURITY_GROUP>";

    xml = oss.str();

    return xml;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int SecurityGroup::from_xml(const string& xml)
{
    vector<xmlNodePtr> content;
    int rc = 0;

    // Initialize the internal XML object
    update_from_str(xml);

    // Get class base attributes
    rc += xpath(oid,    "/SECURITY_GROUP/ID",   -1);
    rc += xpath(uid,    "/SECURITY_GROUP/UID",  -1);
    rc += xpath(gid,    "/SECURITY_GROUP/GID",  -1);
    rc += xpath(uname,  "/SECURITY_GROUP/UNAME","not_found");
    rc += xpath(gname,  "/SECURITY_GROUP/GNAME","not_found");
    rc += xpath(name,   "/SECURITY_GROUP/NAME", "not_found");

    // Permissions
    rc += perms_from_xml();

    // Get associated classes
    ObjectXML::get_nodes("/SECURITY_GROUP/TEMPLATE", content);

    if (content.empty())
    {
        return -1;
    }

    // Template contents
    rc += obj_template->from_xml_node(content[0]);

    ObjectXML::free_nodes(content);
    content.clear();

    if (rc != 0)
    {
        return -1;
    }

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */
