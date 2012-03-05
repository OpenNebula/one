/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */


#include "VirtualNetwork.h"
#include "VirtualNetworkPool.h"
#include "VirtualNetworkTemplate.h"

#include "NebulaLog.h"
#include "RangedLeases.h"
#include "FixedLeases.h"

#include "AuthManager.h"
#include "ClusterPool.h"

#define TO_UPPER(S) transform(S.begin(),S.end(),S.begin(),(int(*)(int))toupper)

/* ************************************************************************** */
/* Virtual Network :: Constructor/Destructor                                  */
/* ************************************************************************** */

VirtualNetwork::VirtualNetwork(int                      _uid,
                               int                      _gid,
                               const string&            _uname,
                               const string&            _gname,
                               int                      _cluster_id,
                               const string&            _cluster_name,
                               VirtualNetworkTemplate * _vn_template):
            PoolObjectSQL(-1,NET,"",_uid,_gid,_uname,_gname,table),
            Clusterable(_cluster_id, _cluster_name),
            bridge(""),
            type(UNINITIALIZED),
            leases(0)
{
    if (_vn_template != 0)
    {
        obj_template = _vn_template;
    }
    else
    {
        obj_template = new VirtualNetworkTemplate;
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VirtualNetwork::~VirtualNetwork()
{
    if (leases != 0)
    {
        delete leases;
    }

    if (obj_template != 0)
    {
        delete obj_template;
    }
}

/* ************************************************************************** */
/* Virtual Network :: Database Access Functions                               */
/* ************************************************************************** */

const char * VirtualNetwork::table        = "network_pool";

const char * VirtualNetwork::db_names =
        "oid, name, body, uid, gid, owner_u, group_u, other_u";

const char * VirtualNetwork::db_bootstrap = "CREATE TABLE IF NOT EXISTS"
    " network_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128),"
    " body TEXT, uid INTEGER, gid INTEGER, "
    "owner_u INTEGER, group_u INTEGER, other_u INTEGER, UNIQUE(name,uid))";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::select(SqlDB * db)
{
    int             rc;

    rc = PoolObjectSQL::select(db);

    if ( rc != 0 )
    {
        return rc;
    }

    return select_leases(db);
}

/* -------------------------------------------------------------------------- */

int VirtualNetwork::select(SqlDB * db, const string& name, int uid)
{
    int             rc;

    rc = PoolObjectSQL::select(db,name,uid);

    if ( rc != 0 )
    {
        return rc;
    }

    return select_leases(db);
}

/* -------------------------------------------------------------------------- */

int VirtualNetwork::select_leases(SqlDB * db)
{
    ostringstream   oss;
    ostringstream   ose;

    string          network_address;

    unsigned int mac_prefix   = VirtualNetworkPool::mac_prefix();

    //Get the leases
    if (type == RANGED)
    {
        leases = new RangedLeases(db,
                                  oid,
                                  mac_prefix,
                                  ip_start,
                                  ip_end);
    }
    else if(type == FIXED)
    {
        leases = new  FixedLeases(db,
                                  oid,
                                  mac_prefix);
    }
    else
    {
        goto error_type;
    }

    if (leases == 0)
    {
        goto error_leases;
    }

    return leases->select(db);


error_leases:
    ose << "Error getting Virtual Network leases nid: " << oid;
    goto error_common;

error_type:
    ose << "Wrong type of Virtual Network: " << type;
    goto error_common;

error_common:
    NebulaLog::log("VNM", Log::ERROR, ose);
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::insert(SqlDB * db, string& error_str)
{
    ostringstream   ose;
    int             rc;

    string          vlan_attr;
    string          s_type;
    string          ranged_error_str;

    unsigned int mac_prefix   = VirtualNetworkPool::mac_prefix();

    //--------------------------------------------------------------------------
    // VirtualNetwork Attributes from the template
    //--------------------------------------------------------------------------

    // ------------ TYPE ----------------------
    erase_template_attribute("TYPE",s_type);

    TO_UPPER(s_type);

    if (s_type == "RANGED")
    {
        type = VirtualNetwork::RANGED;
    }
    else if ( s_type == "FIXED")
    {
        type = VirtualNetwork::FIXED;
    }
    else if ( s_type.empty() )
    {
        goto error_type_defined;
    }
    else
    {
        goto error_wrong_type;
    }

    // ------------ NAME ----------------------

    erase_template_attribute("NAME",name);

    if (name.empty())
    {
        goto error_name;
    }

    // ------------ PHYDEV --------------------

    erase_template_attribute("PHYDEV",phydev);

    // ------------ VLAN_ID -------------------

    erase_template_attribute("VLAN_ID",vlan_id);

    // ------------ VLAN ----------------------

    erase_template_attribute("VLAN", vlan_attr);

    TO_UPPER(vlan_attr);

    vlan = (vlan_attr == "YES") || (vlan_attr.empty() && !phydev.empty());

    // ------------ BRIDGE --------------------

    erase_template_attribute("BRIDGE",bridge);

    if (bridge.empty())
    {
        if (phydev.empty())
        {
            goto error_bridge;
        }
        else
        {
            ostringstream oss;

            oss << "onebr" << oid;
 
            bridge = oss.str();
        }
    }

    //--------------------------------------------------------------------------
    // Get the leases
    //--------------------------------------------------------------------------
    if (type == VirtualNetwork::RANGED)
    {

        int rc;

        rc = RangedLeases::process_template(this, ip_start, ip_end,
                ranged_error_str);

        if ( rc != 0 )
        {
            goto error_ranged;
        }

        leases = new RangedLeases(db,
                                  oid,
                                  mac_prefix,
                                  ip_start,
                                  ip_end);
    }
    else // VirtualNetwork::FIXED
    {
        vector<const Attribute *>   vector_leases;

        get_template_attribute("LEASES",vector_leases);

        leases = new FixedLeases(db,
                                 oid,
                                 mac_prefix,
                                 vector_leases);

        remove_template_attribute("LEASES");
    }

    if (leases == 0)
    {
        goto error_null_leases;
    }

    //--------------------------------------------------------------------------
    // Insert the Virtual Network
    //--------------------------------------------------------------------------
    rc = insert_replace(db, false, error_str);

    if ( rc != 0 )
    {
        goto error_update;
    }

    return 0;

error_type_defined:
    ose << "No TYPE in template for Virtual Network.";
    goto error_common;

error_wrong_type:
    ose << "Wrong type \""<< s_type <<"\" in template for Virtual Network.";
    goto error_common;

error_name:
    ose << "No NAME in template for Virtual Network.";
    goto error_common;

error_bridge:
    ose << "No BRIDGE in template for Virtual Network.";
    goto error_common;

error_update:
    ose << error_str;
    goto error_common;

error_ranged:
    ose << ranged_error_str;
    goto error_common;

error_null_leases:
    ose << "Error getting Virtual Network leases.";

error_common:
    error_str = ose.str();
    NebulaLog::log("VNM", Log::ERROR, ose);
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::insert_replace(SqlDB *db, bool replace, string& error_str)
{
    ostringstream   oss;
    int             rc;


    string xml_body;

    char * sql_name;
    char * sql_xml;


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

    // Construct the SQL statement to Insert or Replace
    if(replace)
    {
        oss << "REPLACE";
    }
    else
    {
        oss << "INSERT";
    }

    oss << " INTO " << table << " (" << db_names << ") VALUES ("
        <<          oid         << ","
        << "'" <<   sql_name    << "',"
        << "'" <<   sql_xml     << "',"
        <<          uid         << ","
        <<          gid         << ","
        <<          owner_u     << ","
        <<          group_u     << ","
        <<          other_u     << ")";

    rc = db->exec(oss);

    db->free_str(sql_name);
    db->free_str(sql_xml);

    return rc;

error_xml:
    db->free_str(sql_name);
    db->free_str(sql_xml);

    error_str = "Error transforming the Virtual Network to XML.";

    goto error_common;

error_body:
    db->free_str(sql_name);
    goto error_generic;

error_name:
    goto error_generic;

error_generic:
    error_str = "Error inserting Virtual Network in DB.";
error_common:
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::drop(SqlDB * db)
{
    int rc;

    rc = PoolObjectSQL::drop(db);

    if ( rc == 0 && leases != 0 )
    {
        rc += leases->drop(db);
    }

    return rc;
}

/* ************************************************************************** */
/* Virtual Network :: Misc                                                    */
/* ************************************************************************** */

string& VirtualNetwork::to_xml(string& xml) const
{
    return to_xml_extended(xml,false);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& VirtualNetwork::to_xml_extended(string& xml) const
{
    return to_xml_extended(xml,true);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& VirtualNetwork::to_xml_extended(string& xml, bool extended) const
{
    ostringstream   os;

    string template_xml;
    string leases_xml;
    string perm_str;

    // Total leases is the number of used leases.
    int total_leases = 0;

    if (leases != 0)
    {
        total_leases = leases->n_used;
    }

    os <<
        "<VNET>" <<
            "<ID>"          << oid          << "</ID>"          <<
            "<UID>"         << uid          << "</UID>"         <<
            "<GID>"         << gid          << "</GID>"         <<
            "<UNAME>"       << uname        << "</UNAME>"       <<
            "<GNAME>"       << gname        << "</GNAME>"       <<
            "<NAME>"        << name         << "</NAME>"        <<
            perms_to_xml(perm_str)          <<
            "<CLUSTER_ID>"  << cluster_id   << "</CLUSTER_ID>"  <<
            "<CLUSTER>"     << cluster      << "</CLUSTER>"     <<
            "<TYPE>"        << type         << "</TYPE>"  <<
            "<BRIDGE>"      << bridge       << "</BRIDGE>"<<
            "<VLAN>"        << vlan         << "</VLAN>";

    if (!phydev.empty())
    {
        os << "<PHYDEV>" << phydev << "</PHYDEV>";
    }
    else
    {
        os << "<PHYDEV/>";
    }

    if (!vlan_id.empty())
    {
        os << "<VLAN_ID>" << vlan_id << "</VLAN_ID>";
    }
    else
    {
        os << "<VLAN_ID/>";
    }

    if ( type == RANGED )
    {
        string st_ip_start;
        string st_ip_end;

        Leases::Lease::ip_to_string(ip_start, st_ip_start);
        Leases::Lease::ip_to_string(ip_end,   st_ip_end);

        os <<
            "<RANGE>" <<
                "<IP_START>" << st_ip_start << "</IP_START>" <<
                "<IP_END>"   << st_ip_end   << "</IP_END>"   <<
            "</RANGE>";
    }

    os  <<  "<TOTAL_LEASES>"<< total_leases << "</TOTAL_LEASES>"<<
            obj_template->to_xml(template_xml);

    if (extended)
    {
        if (leases != 0)
        {
            os <<   "<LEASES>"                  <<
                    leases->to_xml(leases_xml)     <<
                    "</LEASES>";
        }
        else
        {
            os << "<LEASES/>";
        }
    }

    os << "</VNET>";

    xml = os.str();

    return xml;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::from_xml(const string &xml_str)
{
    vector<xmlNodePtr> content;

    int rc = 0;
    int int_type;

    // Initialize the internal XML object
    update_from_str(xml_str);

    // Get class base attributes
    rc += xpath(oid,        "/VNET/ID",     -1);
    rc += xpath(uid,        "/VNET/UID",    -1);
    rc += xpath(gid,        "/VNET/GID",    -1);
    rc += xpath(uname,      "/VNET/UNAME",  "not_found");
    rc += xpath(gname,      "/VNET/GNAME",  "not_found");
    rc += xpath(name,       "/VNET/NAME",   "not_found");
    rc += xpath(int_type,   "/VNET/TYPE",   -1);
    rc += xpath(bridge,     "/VNET/BRIDGE", "not_found");
    rc += xpath(vlan,       "/VNET/VLAN",   0);

    rc += xpath(cluster_id, "/VNET/CLUSTER_ID", -1);
    rc += xpath(cluster,    "/VNET/CLUSTER",    "not_found");

    // Permissions
    rc += perms_from_xml();

    xpath(phydev,  "/VNET/PHYDEV", "");
    xpath(vlan_id, "/VNET/VLAN_ID","");

    type = static_cast<NetworkType>(int_type);

    // Get associated classes
    ObjectXML::get_nodes("/VNET/TEMPLATE", content);

    if (content.empty())
    {
        return -1;
    }

    // Virtual Network template
    rc += obj_template->from_xml_node(content[0]);

    ObjectXML::free_nodes(content);

    // Ranged Leases
    if (type == RANGED)
    {
        string st_ip_start;
        string st_ip_end;

        rc += xpath(st_ip_start,    "/VNET/RANGE/IP_START", "0");
        rc += xpath(st_ip_end,      "/VNET/RANGE/IP_END",   "0");

        Leases::Lease::ip_to_number(st_ip_start, ip_start);
        Leases::Lease::ip_to_number(st_ip_end,   ip_end);
    }

    if (rc != 0)
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::nic_attribute(VectorAttribute *nic, int vid)
{
    int rc;

    string  ip;
    string  mac;

    ostringstream  oss;

    ip    = nic->vector_value("IP");
    oss << oid;

    //--------------------------------------------------------------------------
    //                       GET NETWORK LEASE
    //--------------------------------------------------------------------------

    if (ip.empty())
    {
        rc = leases->get(vid,ip,mac);
    }
    else
    {
        rc = leases->set(vid,ip,mac);
    }

    if ( rc != 0 )
    {
        return -1;
    }

    //--------------------------------------------------------------------------
    //                       NEW NIC ATTRIBUTES
    //--------------------------------------------------------------------------

    nic->replace("NETWORK"   ,name);
    nic->replace("NETWORK_ID",oss.str());
    nic->replace("BRIDGE"    ,bridge);
    nic->replace("MAC"       ,mac);
    nic->replace("IP"        ,ip);

    if ( vlan == 1 )
    {
        nic->replace("VLAN", "YES");
    }
    else
    {
        nic->replace("VLAN", "NO");
    }

    if (!phydev.empty())
    {
        nic->replace("PHYDEV", phydev);
    }

    if (!vlan_id.empty())
    {
        nic->replace("VLAN_ID", vlan_id);
    }

    if ( get_cluster_id() != ClusterPool::NONE_CLUSTER_ID )
    {
        oss.str("");
        oss << get_cluster_id();

        nic->replace("CLUSTER_ID", oss.str());
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::add_leases(VirtualNetworkTemplate * leases_template,
                               string&                  error_msg)
{
    vector<const Attribute *> vector_leases;

    leases_template->get("LEASES", vector_leases);

    return leases->add_leases(vector_leases, error_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::remove_leases(VirtualNetworkTemplate * leases_template,
                                  string&                  error_msg)
{
    vector<const Attribute *> vector_leases;

    leases_template->get("LEASES", vector_leases);

    return leases->remove_leases(vector_leases, error_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::hold_leases(VirtualNetworkTemplate * leases_template,
                                string&                  error_msg)
{
    vector<const Attribute *> vector_leases;

    leases_template->get("LEASES", vector_leases);

    return leases->hold_leases(vector_leases, error_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::free_leases(VirtualNetworkTemplate * leases_template,
                                  string&                  error_msg)
{
    vector<const Attribute *> vector_leases;

    leases_template->get("LEASES", vector_leases);

    return leases->free_leases(vector_leases, error_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
