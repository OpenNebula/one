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

#include "VirtualRouter.h"

/* ************************************************************************ */
/* VirtualRouter :: Constructor/Destructor                                  */
/* ************************************************************************ */

VirtualRouter::VirtualRouter(   int             id,
                                int             _uid,
                                int             _gid,
                                const string&   _uname,
                                const string&   _gname,
                                int             _umask,
                                Template * _template_contents):
        PoolObjectSQL(id,VROUTER,"",_uid,_gid,_uname,_gname,table),
        vmid(-1)
{
    if (_template_contents != 0)
    {
        obj_template = _template_contents;
    }
    else
    {
        obj_template = new Template;
    }

    set_umask(_umask);
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

VirtualRouter::~VirtualRouter()
{
    delete obj_template;
}

/* ************************************************************************ */
/* VirtualRouter :: Database Access Functions                                    */
/* ************************************************************************ */

const char * VirtualRouter::table = "vrouter_pool";

const char * VirtualRouter::db_names =
        "oid, name, body, uid, gid, owner_u, group_u, other_u";

const char * VirtualRouter::db_bootstrap =
    "CREATE TABLE IF NOT EXISTS vrouter_pool (oid INTEGER PRIMARY KEY, "
    "name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, "
    "owner_u INTEGER, group_u INTEGER, other_u INTEGER)";

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int VirtualRouter::insert(SqlDB *db, string& error_str)
{
    int             rc;
    ostringstream   oss;

    // ---------------------------------------------------------------------
    // Check default attributes
    // ---------------------------------------------------------------------

    erase_template_attribute("NAME", name);

    if ( name.empty() == true )
    {
        oss << "vrouter-" << oid;
        name = oss.str();
    }
    else if ( name.length() > 128 )
    {
        error_str = "NAME is too long; max length is 128 chars.";
        return -1;
    }

    // ------------------------------------------------------------------------
    // Insert the VirtualRouter
    // ------------------------------------------------------------------------

    rc = insert_replace(db, false, error_str);

    return rc;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int VirtualRouter::insert_replace(SqlDB *db, bool replace, string& error_str)
{
    ostringstream   oss;

    int    rc;
    string xml_body;

    char * sql_name;
    char * sql_xml;

   // Update the Object

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

    oss <<" INTO " << table <<" ("<< db_names <<") VALUES ("
        <<            oid        << ","
        << "'"     << sql_name   << "',"
        << "'"     << sql_xml    << "',"
        <<            uid        << ","
        <<            gid        << ","
        <<            owner_u    << ","
        <<            group_u    << ","
        <<            other_u    << ")";

    rc = db->exec(oss);

    db->free_str(sql_name);
    db->free_str(sql_xml);

    return rc;

error_xml:
    db->free_str(sql_name);
    db->free_str(sql_xml);

    error_str = "Error transforming the VirtualRouter to XML.";

    goto error_common;

error_body:
    db->free_str(sql_name);
    goto error_generic;

error_name:
    goto error_generic;

error_generic:
    error_str = "Error inserting VirtualRouter in DB.";
error_common:
    return -1;
}

/* ************************************************************************ */
/* VirtualRouter :: Misc                                                         */
/* ************************************************************************ */

string& VirtualRouter::to_xml(string& xml) const
{
    ostringstream   oss;
    string          template_xml;
    string          perm_str;

    oss << "<VROUTER>"
            << "<ID>"       << oid        << "</ID>"
            << "<UID>"      << uid        << "</UID>"
            << "<GID>"      << gid        << "</GID>"
            << "<UNAME>"    << uname      << "</UNAME>"
            << "<GNAME>"    << gname      << "</GNAME>"
            << "<NAME>"     << name       << "</NAME>"
            << "<VMID>"     << vmid       << "</VMID>"
            << perms_to_xml(perm_str)
            << obj_template->to_xml(template_xml)
        << "</VROUTER>";

    xml = oss.str();

    return xml;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int VirtualRouter::from_xml(const string& xml)
{
    vector<xmlNodePtr> content;
    int rc = 0;

    // Initialize the internal XML object
    update_from_str(xml);

    // Get class base attributes
    rc += xpath(oid,        "/VROUTER/ID",      -1);
    rc += xpath(uid,        "/VROUTER/UID",     -1);
    rc += xpath(gid,        "/VROUTER/GID",     -1);
    rc += xpath(uname,      "/VROUTER/UNAME",   "not_found");
    rc += xpath(gname,      "/VROUTER/GNAME",   "not_found");
    rc += xpath(name,       "/VROUTER/NAME",    "not_found");
    rc += xpath(vmid,       "/VROUTER/VMID",    -1);

    // Permissions
    rc += perms_from_xml();

    // Get associated classes
    ObjectXML::get_nodes("/VROUTER/TEMPLATE", content);

    if (content.empty())
    {
        return -1;
    }

    // Template contents
    rc += obj_template->from_xml_node(content[0]);

    ObjectXML::free_nodes(content);

    if (rc != 0)
    {
        return -1;
    }

    return 0;
}
