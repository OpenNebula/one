/* ------------------------------------------------------------------------ */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems              */
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
#include "OneDB.h"

using namespace std;

/* ************************************************************************ */
/* VNTemplate :: Constructor/Destructor                                     */
/* ************************************************************************ */

VNTemplate::VNTemplate(int id,
                       int _uid,
                       int _gid,
                       const string& _uname,
                       const string& _gname,
                       int umask,
                       unique_ptr<VirtualNetworkTemplate> _template_contents):
    PoolObjectSQL(id, VNTEMPLATE, "", _uid, _gid, _uname, _gname, one_db::vn_template_table),
    regtime(time(0))
{
    if (_template_contents)
    {
        obj_template = move(_template_contents);
    }
    else
    {
        obj_template = make_unique<VirtualNetworkTemplate>();
    }

    set_umask(umask);
}

/* ************************************************************************ */
/* VNTemplate :: Database Access Functions                                  */
/* ************************************************************************ */

int VNTemplate::insert(SqlDB *db, string& error_str)
{
    string vn_mad, phydev, bridge, vlan_id, outer_id;
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
    get_template_attribute("AUTOMATIC_VLAN_ID", auto_id);

    get_template_attribute("VLAN_ID", vlan_id);
    get_template_attribute("AUTOMATIC_OUTER_VLAN_ID", auto_outer);

    get_template_attribute("OUTER_VLAN_ID", outer_id);

    rc = VirtualNetwork::parse_phydev_vlans(obj_template.get(), vn_mad, phydev,
                                            bridge, auto_id, vlan_id, auto_outer, outer_id, error_str);

    if (rc == -1)
    {
        return -1;
    }

    encrypt();

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

    sql_name = db->escape_str(name);

    if ( sql_name == 0 )
    {
        goto error_name;
    }

    sql_xml = db->escape_str(to_xml(xml_body));

    if ( sql_xml == 0 )
    {
        goto error_body;
    }

    if ( validate_xml(sql_xml) != 0 )
    {
        goto error_xml;
    }

    if (replace)
    {
        oss << "UPDATE " << one_db::vn_template_table << " SET "
            << "name = '"    << sql_name   << "', "
            << "body = '"    << sql_xml    << "', "
            << "uid = "      << uid        << ", "
            << "gid = "      << gid        << ", "
            << "owner_u = "  << owner_u    << ", "
            << "group_u = "  << group_u    << ", "
            << "other_u = "  << other_u
            << " WHERE oid = " << oid;
    }
    else
    {
        oss << "INSERT INTO " << one_db::vn_template_table
            << " (" << one_db::vn_template_db_names << ") VALUES ("
            <<            oid        << ","
            << "'"     << sql_name   << "',"
            << "'"     << sql_xml    << "',"
            <<            uid        << ","
            <<            gid        << ","
            <<            owner_u    << ","
            <<            group_u    << ","
            <<            other_u    << ")";
    }
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

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int VNTemplate::bootstrap(SqlDB * db)
{
    ostringstream oss(one_db::vn_template_db_bootstrap);

    return db->exec_local_wr(oss);
};

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
