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

#include "Vdc.h"

/* ------------------------------------------------------------------------ */

const char * Vdc::table = "vdc_pool";

const char * Vdc::db_names =
        "oid, name, body, uid, gid, owner_u, group_u, other_u";

const char * Vdc::db_bootstrap = "CREATE TABLE IF NOT EXISTS vdc_pool ("
    "oid INTEGER PRIMARY KEY, name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, "
    "gid INTEGER, owner_u INTEGER, group_u INTEGER, other_u INTEGER, "
    "UNIQUE(name))";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Vdc::Vdc(int id, Template* vdc_template):
        PoolObjectSQL(id, VDC, "", -1, -1, "", "", table)
{
    if (vdc_template != 0)
    {
        obj_template = vdc_template;
    }
    else
    {
        obj_template = new Template;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Vdc::~Vdc()
{
    delete obj_template;
};

/* ************************************************************************ */
/* Vdc :: Database Access Functions                                         */
/* ************************************************************************ */

int Vdc::insert(SqlDB *db, string& error_str)
{
    int    rc;

    ostringstream oss;

    // ---------------------------------------------------------------------
    // Check default attributes
    // ---------------------------------------------------------------------

    erase_template_attribute("NAME", name);

    if ( name.empty() )
    {
        oss << "vdc-" << oid;
        name = oss.str();
    }

    // ------------------------------------------------------------------------
    // Insert the Vdc
    // ------------------------------------------------------------------------

    rc = insert_replace(db, false, error_str);

    return rc;

error_common:
    NebulaLog::log("VDC", Log::ERROR, error_str);
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Vdc::insert_replace(SqlDB *db, bool replace, string& error_str)
{
    ostringstream   oss;

    int    rc;
    string xml_body;

    char * sql_name;
    char * sql_xml;

    // Set oneadmin as the owner and group it belongs to
    set_user(0,"");
    set_group(0,"");

    // Update the vdc

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

    error_str = "Error transforming the VDC to XML.";

    goto error_common;

error_body:
    db->free_str(sql_name);
    goto error_generic;

error_name:
    goto error_generic;

error_generic:
    error_str = "Error inserting VDC in DB.";
error_common:
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& Vdc::to_xml(string& xml) const
{
    ostringstream   oss;
    string          template_xml;

    oss <<
    "<VDC>"    <<
        "<ID>"   << oid  << "</ID>"   <<
        "<NAME>" << name << "</NAME>" <<
        obj_template->to_xml(template_xml) <<
    "</VDC>";

    xml = oss.str();

    return xml;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int Vdc::from_xml(const string& xml)
{
    vector<xmlNodePtr> content;
    int rc = 0;

    // Initialize the internal XML object
    update_from_str(xml);

    // Get class base attributes
    rc += xpath(oid, "/VDC/ID",   -1);
    rc += xpath(name,"/VDC/NAME", "not_found");

    // Get associated classes
    ObjectXML::get_nodes("/VDC/TEMPLATE", content);

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
