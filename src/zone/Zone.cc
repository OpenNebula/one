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

#include "Zone.h"

/* ------------------------------------------------------------------------ */

const char * Zone::table = "zone_pool";

const char * Zone::db_names =
        "oid, name, body, uid, gid, owner_u, group_u, other_u";

const char * Zone::db_bootstrap = "CREATE TABLE IF NOT EXISTS zone_pool ("
    "oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, "
    "gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, "
    "UNIQUE(name))";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Zone::Zone(int id, Template* zone_template):
        PoolObjectSQL(id, ZONE, "", -1, -1, "", "", table)
{
    if (zone_template != 0)
    {
        obj_template = zone_template;
    }
    else
    {
        obj_template = new Template;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Zone::~Zone()
{
    delete obj_template;
};

/* ************************************************************************ */
/* Zone :: Database Access Functions                                        */
/* ************************************************************************ */

int Zone::insert(SqlDB *db, string& error_str)
{
    int    rc;
    string endpoint;

    ostringstream oss;

    // ---------------------------------------------------------------------
    // Check default attributes
    // ---------------------------------------------------------------------

    erase_template_attribute("NAME", name);

    if ( name.empty() )
    {
        oss << "zone-" << oid;
        name = oss.str();
    }

    get_template_attribute("ENDPOINT", endpoint);

    if ( endpoint.empty() )
    {
        goto error_endpoint;
    }

    // ------------------------------------------------------------------------
    // Insert the Zone
    // ------------------------------------------------------------------------

    rc = insert_replace(db, false, error_str);

    return rc;

error_endpoint:
    error_str = "ENDPOINT not present in template.";
    goto error_common;

error_common:
    NebulaLog::log("ZONE", Log::ERROR, error_str);
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Zone::insert_replace(SqlDB *db, bool replace, string& error_str)
{
    ostringstream   oss;

    int    rc;
    string xml_body;

    char * sql_name;
    char * sql_xml;

    // Set oneadmin as the owner and group it belongs to
    set_user(0,"");
    set_group(0,"");

    // Update the zone

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

    error_str = "Error transforming the Zone to XML.";

    goto error_common;

error_body:
    db->free_str(sql_name);
    goto error_generic;

error_name:
    goto error_generic;

error_generic:
    error_str = "Error inserting Zone in DB.";
error_common:
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& Zone::to_xml(string& xml) const
{
    ostringstream   oss;
    string          template_xml;

    oss <<
    "<ZONE>"    <<
        "<ID>"   << oid  << "</ID>"   <<
        "<NAME>" << name << "</NAME>" <<
        obj_template->to_xml(template_xml) <<
    "</ZONE>";

    xml = oss.str();

    return xml;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Zone::from_xml(const string& xml)
{
    vector<xmlNodePtr> content;
    int rc = 0;

    // Initialize the internal XML object
    update_from_str(xml);

    // Get class base attributes
    rc += xpath(oid, "/ZONE/ID",   -1);
    rc += xpath(name,"/ZONE/NAME", "not_found");

    // Get associated classes
    ObjectXML::get_nodes("/ZONE/TEMPLATE", content);

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

    // Set oneadmin as the owner and group it belongs to
    set_user(0,"");
    set_group(0,"");

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Zone::replace_template(const string& tmpl_str, string& error_str)
{
    Template * new_tmpl  = get_new_template();

    if ( new_tmpl == 0 )
    {
        error_str = "Cannot allocate a new template";
        return -1;
    }

    if ( new_tmpl->parse_str_or_xml(tmpl_str, error_str) != 0 )
    {
        delete new_tmpl;
        return -1;
    }

    string new_endpoint;
    new_tmpl->get("ENDPOINT", new_endpoint);

    if (new_endpoint.empty())
    {
        new_tmpl->replace("ENDPOINT", "-");
    }

    if ( obj_template != 0 )
    {
        delete obj_template;
    }

    obj_template = new_tmpl;

    return 0;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */
