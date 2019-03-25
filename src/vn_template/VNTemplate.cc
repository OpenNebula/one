/* ------------------------------------------------------------------------ */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems              */
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

#include "VNTemplate.h"
#include "VirtualNetwork.h"

/* ************************************************************************ */
/* VNTemplate :: Constructor/Destructor                                     */
/* ************************************************************************ */

VNTemplate::VNTemplate(int id,
                       int _uid,
                       int _gid,
                       const string& _uname,
                       const string& _gname,
                       int umask,
                       VirtualNetworkTemplate * _template_contents):
        PoolObjectSQL(id,VNTEMPLATE,"",_uid,_gid,_uname,_gname,table),
        regtime(time(0))
{
    if (_template_contents != 0)
    {
        obj_template = _template_contents;
    }
    else
    {
        obj_template = new VirtualNetworkTemplate;
    }

    set_umask(umask);
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

VNTemplate::~VNTemplate(){};

/* ************************************************************************ */
/* VNTemplate :: Database Access Functions                                  */
/* ************************************************************************ */

const char * VNTemplate::table = "vn_template_pool";

const char * VNTemplate::db_names =
        "oid, name, body, uid, gid, owner_u, group_u, other_u";

const char * VNTemplate::db_bootstrap =
    "CREATE TABLE IF NOT EXISTS vn_template_pool (oid INTEGER PRIMARY KEY, "
    "name VARCHAR(128), body MEDIUMTEXT, uid INTEGER, gid INTEGER, "
    "owner_u INTEGER, group_u INTEGER, other_u INTEGER)";

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int VNTemplate::insert(SqlDB *db, string& error_str)
{
    string vn_mad, phydev, bridge, auto_id_str, vlan_id, auto_outer_str, outer_id;
    bool auto_id = false, auto_outer = false;
    int rc;

    // ---------------------------------------------------------------------
    // Check always mandatory attributes
    // ---------------------------------------------------------------------
    erase_template_attribute("NAME", name);

    get_template_attribute("VN_MAD", vn_mad);

    if (vn_mad.empty())
    {
        goto error_vnmad;
    }

    get_template_attribute("PHYDEV", phydev);
    get_template_attribute("BRIDGE", bridge);
    get_template_attribute("AUTOMATIC_VLAN_ID", auto_id_str);

    if (auto_id_str == "YES")
    {
        auto_id = true;
    }

    get_template_attribute("VLAN_ID", vlan_id);
    get_template_attribute("AUTOMATIC_OUTER_VLAN_ID", auto_outer_str);

    if (auto_outer_str == "YES")
    {
        auto_outer = true;
    }

    get_template_attribute("OUTER_VLAN_ID", outer_id);

    rc = VirtualNetwork::parse_phydev_vlans(obj_template, vn_mad, phydev, bridge, auto_id, vlan_id, auto_outer, outer_id, error_str);

    if (rc == -1)
    {
        return -1;
    }

    // ------------------------------------------------------------------------
    // Insert the Template
    // ------------------------------------------------------------------------
    return insert_replace(db, false, error_str);

error_vnmad:
    error_str = "Error inserting Template in DB. VN_MAD is mandatory";

    return -1;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int VNTemplate::insert_replace(SqlDB *db, bool replace, string& error_str)
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

    rc = db->exec_wr(oss);

    db->free_str(sql_name);
    db->free_str(sql_xml);

    return rc;

error_xml:
    db->free_str(sql_name);
    db->free_str(sql_xml);

    error_str = "Error transforming the Template to XML.";

    goto error_common;

error_body:
    db->free_str(sql_name);
    goto error_generic;

error_name:
    goto error_generic;

error_generic:
    error_str = "Error inserting Template in DB.";
error_common:
    return -1;
}

/* ************************************************************************ */
/* VNTemplate :: Misc                                                       */
/* ************************************************************************ */

string& VNTemplate::to_xml(string& xml) const
{
    ostringstream   oss;
    string          template_xml;
    string          perm_str;
    string          lock_str;

    oss << "<VNTEMPLATE>"
            << "<ID>"       << oid        << "</ID>"
            << "<UID>"      << uid        << "</UID>"
            << "<GID>"      << gid        << "</GID>"
            << "<UNAME>"    << uname      << "</UNAME>"
            << "<GNAME>"    << gname      << "</GNAME>"
            << "<NAME>"     << name       << "</NAME>"
            << lock_db_to_xml(lock_str)
            << perms_to_xml(perm_str)
            << "<REGTIME>"  << regtime    << "</REGTIME>"
            << obj_template->to_xml(template_xml)
        << "</VNTEMPLATE>";

    xml = oss.str();

    return xml;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int VNTemplate::from_xml(const string& xml)
{
    vector<xmlNodePtr> content;
    int rc = 0;

    // Initialize the internal XML object
    update_from_str(xml);

    // Get class base attributes
    rc += xpath(oid,        "/VNTEMPLATE/ID",      -1);
    rc += xpath(uid,        "/VNTEMPLATE/UID",     -1);
    rc += xpath(gid,        "/VNTEMPLATE/GID",     -1);
    rc += xpath(uname,      "/VNTEMPLATE/UNAME",   "not_found");
    rc += xpath(gname,      "/VNTEMPLATE/GNAME",   "not_found");
    rc += xpath(name,       "/VNTEMPLATE/NAME",    "not_found");
    rc += xpath<time_t>(regtime, "/VNTEMPLATE/REGTIME", 0);

    rc += lock_db_from_xml();
    // Permissions
    rc += perms_from_xml();

    // Get associated classes
    ObjectXML::get_nodes("/VNTEMPLATE/TEMPLATE", content);

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

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */
