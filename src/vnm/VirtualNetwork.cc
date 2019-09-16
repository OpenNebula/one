/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

#include "VirtualMachineNic.h"
#include "VirtualNetwork.h"
#include "VirtualNetworkPool.h"
#include "VirtualNetworkTemplate.h"
#include "AddressRange.h"
#include "PoolObjectAuth.h"

#include "NebulaLog.h"

#include "AuthManager.h"
#include "ClusterPool.h"

#include "NebulaUtil.h"

#include "Nebula.h"

#define TO_UPPER(S) transform(S.begin(),S.end(),S.begin(),(int(*)(int))toupper)

/* ************************************************************************** */
/* Virtual Network :: Constructor/Destructor                                  */
/* ************************************************************************** */

VirtualNetwork::VirtualNetwork(int                      _uid,
                               int                      _gid,
                               const string&            _uname,
                               const string&            _gname,
                               int                      _umask,
                               int                      _pvid,
                               const set<int>           &_cluster_ids,
                               VirtualNetworkTemplate * _vn_template):
            PoolObjectSQL(-1,NET,"",_uid,_gid,_uname,_gname,table),
            Clusterable(_cluster_ids),
            bridge(""),
            vlan_id_automatic(false),
            outer_vlan_id_automatic(false),
            parent_vid(_pvid),
            vrouters("VROUTERS")
{
    if (_vn_template != 0)
    {
        obj_template = _vn_template;
    }
    else
    {
        obj_template = new VirtualNetworkTemplate;
    }

    set_umask(_umask);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualNetwork::get_permissions(PoolObjectAuth& auths)
{
    PoolObjectSQL::get_permissions(auths);

    if (parent_vid != -1)
    {
        auths.disable_cluster_acl = true;
        auths.disable_all_acl     = true;
    }
}

/* ************************************************************************** */
/* Virtual Network :: Database Access Functions                               */
/* ************************************************************************** */

const char * VirtualNetwork::table    = "network_pool";

const char * VirtualNetwork::db_names =
        "oid, name, body, uid, gid, owner_u, group_u, other_u, pid";

const char * VirtualNetwork::db_bootstrap = "CREATE TABLE IF NOT EXISTS"
    " network_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128),"
    " body MEDIUMTEXT, uid INTEGER, gid INTEGER,"
    " owner_u INTEGER, group_u INTEGER, other_u INTEGER,"
    " pid INTEGER, UNIQUE(name,uid))";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualNetwork::parse_vlan_id(const char * id_name, const char * auto_name,
        string& id, bool& auto_id)
{
    string vis;

    if ( PoolObjectSQL::get_template_attribute(id_name, vis) && !vis.empty() )
    {
        erase_template_attribute(id_name, id);

        add_template_attribute(id_name, id);

        remove_template_attribute(auto_name);

        auto_id = false;
    }
    else
    {
        erase_template_attribute(auto_name, auto_id);
    }
}

//-------------------------------------------------------------------------------
//-------------------------------------------------------------------------------
/*
LIST OF MANDATORY ARGUMENTS FOR NETWORK DEFINITION

+----------------+---------+--------+--------------------------+----------------+
|    Driver      | PHYDEV  | BRIDGE |         VLAN_ID          |      OTHER     |
+----------------+---------+--------+--------------------------+----------------+
| vcenter        | no      | yes    | no                       | VCENTER_NET_REF|
| dummy          | no      | yes    | no                       |                |
| bridge         | no      | no     | no                       |                |
| ebtables       | no      | no     | no                       |                |
| fw             | no      | no     | no                       |                |
| 802.1q         | yes     | no     | yes or AUTOMATIC         |                |
| vxlan          | yes     | no     | yes or AUTOMATIC         |                |
| ovswitch       | no      | no     | yes or AUTOMATIC         |                |
| ovswitch_vxlan | yes     | no     | OUTER or AUTOMATIC_OUTER |                |
+----------------+---------+--------+--------------------------+----------------+
*/
int VirtualNetwork::parse_phydev_vlans(const Template* tmpl, const string& vn_mad, const string& phydev,
                                       const string& bridge, const bool auto_id, const string& vlan_id,
                                       const bool auto_outer, const string& outer_id, string& estr)
{
    bool check_phydev = false;
    bool check_bridge = false;
    bool check_vlan   = false;
    bool check_outer  = false;

    switch (VirtualNetwork::str_to_driver(vn_mad))
    {
        case VirtualNetwork::DUMMY:
            check_bridge = true;
            break;

        case VirtualNetwork::VXLAN:
        case VirtualNetwork::VLAN:
            check_phydev = true;
            check_vlan   = true;
            break;

        case VirtualNetwork::OVSWITCH_VXLAN:
            check_outer  = true;

        case VirtualNetwork::BRIDGE:
        case VirtualNetwork::VCENTER:
        case VirtualNetwork::OVSWITCH:
        case VirtualNetwork::EBTABLES:
        case VirtualNetwork::FW:
            break;

        case VirtualNetwork::NONE:
            return 0;
    }

    if ( check_phydev && phydev.empty())
    {
        estr = "PHYDEV is mandatory for driver " + vn_mad;
        return -1;
    }

    if ( check_bridge && bridge.empty())
    {
        estr = "BRIDGE is mandatory for driver " + vn_mad;
        return -1;
    }

    if ( check_vlan && !auto_id && vlan_id.empty() )
    {
        estr = "VLAN_ID (or AUTOMATIC_VLAN_ID) is mandatory for driver " + vn_mad;
        return -1;
    }

    if ( check_outer && !auto_outer && outer_id.empty() )
    {
        estr = "OUTER_VLAN_ID (or AUTOMATIC) is mandatory for driver " + vn_mad;
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::insert(SqlDB * db, string& error_str)
{
    vector<VectorAttribute *> ars;
    ostringstream       ose;

    string sg_str, vis;

    string value;
    string name;
    string prefix;

    int rc, num_ars;

    ostringstream oss;

    // ------------------------------------------------------------------------
    // Set a name if the VN has not got one (and is created via template)
    // ------------------------------------------------------------------------

    obj_template->get("TEMPLATE_ID", value);
    obj_template->erase("TEMPLATE_ID");

    if (!value.empty())
    {
        obj_template->add("TEMPLATE_ID", value);
    }

    obj_template->get("NAME",name);
    obj_template->erase("NAME");

    obj_template->get("TEMPLATE_NAME", prefix);
    obj_template->erase("TEMPLATE_NAME");

    if (prefix.empty() && name.empty())
    {
        goto error_name;
    }

    if (name.empty() == true)
    {
        oss.str("");
        oss << prefix << "-" << oid;
        name = oss.str();
    }

    if ( !PoolObjectSQL::name_is_valid(name, error_str) )
    {
        goto error_name;
    }

    this->name = name;

    //--------------------------------------------------------------------------
    // VirtualNetwork Attributes from the template
    // NAME
    // VN_MAD
    // PHYDEV
    // BRIDGE
    // VLAN_ID / AUTOMATIC_VLAN_ID
    // OUTER_VLAN_ID / AUTOMATIC_OUTER_VLAN_ID
    //
    // Note: VLAN_IDs if not set will be allocated in VirtualNetworkPool
    //--------------------------------------------------------------------------

    erase_template_attribute("VN_MAD", vn_mad);

    if (vn_mad.empty())
    {
        goto error_vn_mad;
    }

    add_template_attribute("VN_MAD", vn_mad);

    erase_template_attribute("PHYDEV", phydev);

    add_template_attribute("PHYDEV", phydev);

    erase_template_attribute("BRIDGE",bridge);

    parse_vlan_id("VLAN_ID", "AUTOMATIC_VLAN_ID", vlan_id, vlan_id_automatic);

    parse_vlan_id("OUTER_VLAN_ID", "AUTOMATIC_OUTER_VLAN_ID", outer_vlan_id,
            outer_vlan_id_automatic);

    // -------------------------------------------------------------------------
    // Check consistency for PHYDEV, BRIDGE and VLAN_IDs based on the driver
    // -------------------------------------------------------------------------
    rc = parse_phydev_vlans(obj_template, vn_mad, phydev, bridge, vlan_id_automatic, vlan_id,
                            outer_vlan_id_automatic, outer_vlan_id, error_str);

    if (rc != 0)
    {
        goto error_parse;
    }

    erase_template_attribute("BRIDGE_TYPE", bridge_type);

    rc = parse_bridge_type(vn_mad, error_str);

    if (rc != 0)
    {
        goto error_common;
    }

    add_template_attribute("BRIDGE_TYPE", bridge_type);

    if (bridge.empty() && bridge_type != "none")
    {
        ostringstream oss;

        oss << "onebr";

        if (!vlan_id.empty())
        {
            oss << "." << vlan_id;
        }
        else
        {
            oss << oid;
        }

        bridge = oss.str();
    }

    add_template_attribute("BRIDGE", bridge);

    //--------------------------------------------------------------------------
    // Get the Address Ranges
    //--------------------------------------------------------------------------

    num_ars = remove_template_attribute("AR", ars);
    rc      = add_var(ars, error_str);

    for (int i=0; i < num_ars; i++)
    {
        delete ars[i];
    }

    if ( rc != 0)
    {
        goto error_ar;
    }

    //--------------------------------------------------------------------------
    // Add default Security Group
    //--------------------------------------------------------------------------

    erase_template_attribute("SECURITY_GROUPS", sg_str);

    if (sg_str.empty())
    {
        sg_str = "0";
    }
    else
    {
        set<int> sgs;

        sg_str.append(",0");

        one_util::split_unique(sg_str, ',', sgs);

        sg_str = one_util::join(sgs.begin(), sgs.end(), ',');
    }

    add_template_attribute("SECURITY_GROUPS", sg_str);

    // Encrypt all the secrets
    encrypt();

    //--------------------------------------------------------------------------
    // Insert the Virtual Network
    //--------------------------------------------------------------------------

    if ( insert_replace(db, false, error_str) != 0 )
    {
        goto error_db;
    }

    return 0;

error_name:
    error_str = "No NAME in template for Virtual Network.";
    goto error_common;

error_vn_mad:
    error_str = "No VN_MAD in template for Virtual Network.";
    goto error_common;

error_parse:
error_db:
error_ar:
error_common:
    NebulaLog::log("VNM", Log::ERROR, error_str);
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::post_update_template(string& error)
{
    string new_bridge;
    string sg_str;

    /* ---------------------------------------------------------------------- */
    /* Update Configuration Attributes (class & template)                     */
    /*  - VN_MAD                                                              */
    /*  - PHYDEV                                                              */
    /*  - VLAN_ID                                                             */
    /*  - BRIDGE                                                              */
    /*  - SECURITY_GROUPS                                                     */
    /* ---------------------------------------------------------------------- */
    erase_template_attribute("VN_MAD", vn_mad);

    add_template_attribute("VN_MAD", vn_mad);

    erase_template_attribute("PHYDEV", phydev);

    add_template_attribute("PHYDEV", phydev);

    remove_template_attribute("AUTOMATIC_VLAN_ID");

    remove_template_attribute("AUTOMATIC_OUTER_VLAN_ID");

    if (!vlan_id_automatic)
    {
        erase_template_attribute("VLAN_ID", vlan_id);
        add_template_attribute("VLAN_ID", vlan_id);
    }
    else
    {
        remove_template_attribute("VLAN_ID");
    }

    if (!outer_vlan_id_automatic)
    {
        erase_template_attribute("OUTER_VLAN_ID", outer_vlan_id);
        add_template_attribute("OUTER_VLAN_ID", outer_vlan_id);
    }
    else
    {
        remove_template_attribute("OUTER_VLAN_ID");
    }

    erase_template_attribute("BRIDGE",new_bridge);

    if (!new_bridge.empty())
    {
        bridge = new_bridge;
    }

    add_template_attribute("BRIDGE", bridge);

    security_groups.clear();

    obj_template->get("SECURITY_GROUPS", sg_str);

    one_util::split_unique(sg_str, ',', security_groups);

    return 0;
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

    // Construct the SQL statement to Insert or Replace
    if(replace)
    {
        oss << "UPDATE " << table << " SET "
            << "name = '"    <<   sql_name    << "', "
            << "body = '"    <<   sql_xml     << "', "
            << "uid = "      <<   uid         << ", "
            << "gid = "      <<   gid         << ", "
            << "owner_u = "  <<   owner_u     << ", "
            << "group_u = "  <<   group_u     << ", "
            << "other_u = "  <<   other_u     << ", "
            << "pid = "      <<   parent_vid
            << " WHERE oid = " << oid;
    }
    else
    {
        oss << "INSERT INTO " << table << " (" << db_names << ") VALUES ("
            <<          oid         << ","
            << "'" <<   sql_name    << "',"
            << "'" <<   sql_xml     << "',"
            <<          uid         << ","
            <<          gid         << ","
            <<          owner_u     << ","
            <<          group_u     << ","
            <<          other_u     << ","
            <<          parent_vid  << ")";
    }

    rc = db->exec_wr(oss);

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

/* ************************************************************************** */
/* Virtual Network :: Misc                                                    */
/* ************************************************************************** */

string& VirtualNetwork::to_xml(string& xml) const
{
    const vector<int> empty;

    return to_xml_extended(xml, false, empty, empty, empty);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& VirtualNetwork::to_xml_extended(string& xml, const vector<int>& vms,
        const vector<int>& vnets, const vector<int>& vrs) const
{
    return to_xml_extended(xml, true, vms, vnets, vrs);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& VirtualNetwork::to_xml_extended(string& xml, bool extended_and_check,
    const vector<int>& vms, const vector<int>& vnets,
    const vector<int>& vrs) const
{
    ostringstream   os;

    vector<int>::const_iterator it;

    string clusters_xml;
    string vrouters_xml;
    string template_xml;
    string leases_xml;
    string perm_str;
    string lock_str;

    int int_vlan_id_automatic = vlan_id_automatic ? 1 : 0;
    int int_outer_vlan_id_automatic = outer_vlan_id_automatic ? 1 : 0;

    os <<
        "<VNET>" <<
            "<ID>"     << oid      << "</ID>"    <<
            "<UID>"    << uid      << "</UID>"   <<
            "<GID>"    << gid      << "</GID>"   <<
            "<UNAME>"  << uname    << "</UNAME>" <<
            "<GNAME>"  << gname    << "</GNAME>" <<
            "<NAME>"   << name     << "</NAME>"  <<
            lock_db_to_xml(lock_str) <<
            perms_to_xml(perm_str) <<
            Clusterable::to_xml(clusters_xml)    <<
            "<BRIDGE>" << one_util::escape_xml(bridge) << "</BRIDGE>"
            "<BRIDGE_TYPE>" << one_util::escape_xml(bridge_type) << "</BRIDGE_TYPE>";

    if (parent_vid != -1)
    {
        os << "<PARENT_NETWORK_ID>" << parent_vid << "</PARENT_NETWORK_ID>";
    }
    else
    {
        os << "<PARENT_NETWORK_ID/>";
    }

    if (!vn_mad.empty())
    {
        os << "<VN_MAD>" << one_util::escape_xml(vn_mad) << "</VN_MAD>";
    }
    else
    {
        os << "<VN_MAD/>";
    }

    if (!phydev.empty())
    {
        os << "<PHYDEV>" << one_util::escape_xml(phydev) << "</PHYDEV>";
    }
    else
    {
        os << "<PHYDEV/>";
    }

    if (!vlan_id.empty())
    {
        os << "<VLAN_ID>" << one_util::escape_xml(vlan_id) << "</VLAN_ID>";
    }
    else
    {
        os << "<VLAN_ID/>";
    }

    if (!outer_vlan_id.empty())
    {
        os << "<OUTER_VLAN_ID>" << one_util::escape_xml(outer_vlan_id)
           << "</OUTER_VLAN_ID>";
    }
    else
    {
        os << "<OUTER_VLAN_ID/>";
    }

    os << "<VLAN_ID_AUTOMATIC>" << int_vlan_id_automatic <<"</VLAN_ID_AUTOMATIC>";

    os << "<OUTER_VLAN_ID_AUTOMATIC>" << int_outer_vlan_id_automatic
       << "</OUTER_VLAN_ID_AUTOMATIC>";

    os << "<USED_LEASES>"<< ar_pool.get_used_addr() << "</USED_LEASES>";

    if (((vrs.size() == 1) && vrs[0] == -1) || !extended_and_check)
    {
        os << vrouters.to_xml(vrouters_xml);
    }
    else
    {
        os << "<VROUTERS>";

        for (it = vrs.begin(); it != vrs.end(); it++)
        {
            if (vrouters.contains(*it))
            {
                os << "<ID>" << *it << "</ID>";
            }
        }

        os << "</VROUTERS>";
    }

    os << obj_template->to_xml(template_xml);

    os << ar_pool.to_xml(leases_xml, extended_and_check, vms, vnets, vrs);

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

    int int_vlan_id_automatic;
    int int_outer_vlan_id_automatic;

    // Initialize the internal XML object
    update_from_str(xml_str);

    // Get class base attributes
    rc += xpath(oid,    "/VNET/ID",  -1);
    rc += xpath(uid,    "/VNET/UID", -1);
    rc += xpath(gid,    "/VNET/GID", -1);
    rc += xpath(uname,  "/VNET/UNAME", "not_found");
    rc += xpath(gname,  "/VNET/GNAME", "not_found");
    rc += xpath(name,   "/VNET/NAME",  "not_found");
    rc += xpath(bridge, "/VNET/BRIDGE","not_found");

    rc += lock_db_from_xml();

    // Permissions
    rc += perms_from_xml();

    xpath(vn_mad, "/VNET/VN_MAD", "");
    xpath(phydev, "/VNET/PHYDEV", "");
    xpath(bridge_type, "/VNET/BRIDGE_TYPE", "");

    xpath(vlan_id, "/VNET/VLAN_ID", "");
    xpath(outer_vlan_id, "/VNET/OUTER_VLAN_ID", "");

    xpath(int_vlan_id_automatic, "/VNET/VLAN_ID_AUTOMATIC", 0);
    xpath(int_outer_vlan_id_automatic, "/VNET/OUTER_VLAN_ID_AUTOMATIC", 0);

    xpath(parent_vid,"/VNET/PARENT_NETWORK_ID",-1);

    vlan_id_automatic = int_vlan_id_automatic;
    outer_vlan_id_automatic = int_outer_vlan_id_automatic;

    // Set of cluster IDs
    rc += Clusterable::from_xml(this, "/VNET/");

    // VRouter IDs
    rc += vrouters.from_xml(this, "/VNET/");

    // Virtual Network template
    ObjectXML::get_nodes("/VNET/TEMPLATE", content);

    if (content.empty())
    {
        return -1;
    }

    rc += obj_template->from_xml_node(content[0]);

    ObjectXML::free_nodes(content);
    content.clear();

    //Security groups internal attribute (from /VNET/TEMPLATE/SECURITY_GROUPS)
    string sg_str;

    obj_template->get("SECURITY_GROUPS", sg_str);

    one_util::split_unique(sg_str, ',', security_groups);

    // Address Range Pool
    ObjectXML::get_nodes("/VNET/AR_POOL", content);

    if (content.empty())
    {
        return -1;
    }

    // Address Ranges of the Virtual Network
    rc += ar_pool.from_xml_node(content[0]);

    ObjectXML::free_nodes(content);

    if (rc != 0)
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::nic_attribute(
        VirtualMachineNic *     nic,
        int                     vid,
        const vector<string>&   inherit_attrs)
{
    string inherit_val;
    string target;

    ostringstream oss;

    vector<string>::const_iterator it;

    set<int> nic_sgs;
    int      ar_id;

    //--------------------------------------------------------------------------
    //  Set default values from the Virtual Network
    //--------------------------------------------------------------------------

    nic->replace("NETWORK", name);
    nic->replace("NETWORK_ID", oid);
    nic->replace("BRIDGE", bridge);

    if (!vn_mad.empty())
    {
        nic->replace("VN_MAD", vn_mad);
    }

    if (!phydev.empty())
    {
        nic->replace("PHYDEV", phydev);
    }

    if (!vlan_id.empty())
    {
        nic->replace("VLAN_ID", vlan_id);
    }

    if (!outer_vlan_id.empty())
    {
        nic->replace("OUTER_VLAN_ID", outer_vlan_id);
    }

    if (parent_vid != -1)
    {
        nic->replace("PARENT_NETWORK_ID", parent_vid);
    }

    target = nic->vector_value("TARGET");

    if (target.empty())
    {
        oss << "one-" << vid << "-" << nic->vector_value("NIC_ID");
        nic->replace("TARGET", oss.str());
    }

    set<int> cluster_ids = get_cluster_ids();

    nic->replace("CLUSTER_ID", one_util::join(cluster_ids, ','));


    if (!bridge_type.empty())
    {
        nic->replace("BRIDGE_TYPE", bridge_type);
    }

    for (it = inherit_attrs.begin(); it != inherit_attrs.end(); it++)
    {
        PoolObjectSQL::get_template_attribute(*it, inherit_val);

        if (!inherit_val.empty())
        {
            nic->replace(*it, inherit_val);
        }
    }

    //--------------------------------------------------------------------------
    //  Get the lease from the Virtual Network
    //--------------------------------------------------------------------------
    int rc;

    string ip6 = nic->vector_value("IP6");
    string ip  = nic->vector_value("IP");
    string mac = nic->vector_value("MAC");

    int ip_ne  = ip.empty() ? 0 : 1;
    int ip6_ne = ip6.empty() ? 0 : 1;
    int mac_ne = mac.empty() ? 0 : 1;

    if ( ip_ne + ip6_ne + mac_ne > 1 )
    {
        return -1;
    }

    if (ip_ne == 1)
    {
        rc = allocate_by_ip(PoolObjectSQL::VM, vid, ip, nic->vector_attribute(),
                inherit_attrs);
    }
    else if (ip6_ne == 1)
    {
        rc = allocate_by_ip6(PoolObjectSQL::VM, vid, ip6, nic->vector_attribute(),
                inherit_attrs);
    }
    else if (mac_ne == 1)
    {
        rc = allocate_by_mac(PoolObjectSQL::VM, vid,mac,nic->vector_attribute(),
                inherit_attrs);
    }
    else
    {
        rc = allocate_addr(PoolObjectSQL::VM, vid, nic->vector_attribute(),
                inherit_attrs);
    }

    //--------------------------------------------------------------------------
    //  Copy the security group IDs
    //--------------------------------------------------------------------------

    one_util::split_unique(nic->vector_value("SECURITY_GROUPS"), ',', nic_sgs);

    nic_sgs.insert(security_groups.begin(), security_groups.end());

    if (nic->vector_value("AR_ID", ar_id) == 0)
    {
        const set<int> ar_sgs = ar_pool.get_security_groups(ar_id);

        nic_sgs.insert(ar_sgs.begin(), ar_sgs.end());
    }

    nic->replace("SECURITY_GROUPS",
        one_util::join(nic_sgs.begin(), nic_sgs.end(), ','));

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::vrouter_nic_attribute(
        VirtualMachineNic *     nic,
        int                     vrid,
        const vector<string>&   inherit_attrs)
{
    int     rc = 0;
    bool    floating;
    vector<string>::const_iterator it;

    //--------------------------------------------------------------------------
    //  Set default values from the Virtual Network
    //--------------------------------------------------------------------------

    nic->replace("NETWORK", name);
    nic->replace("NETWORK_ID", oid);

    //--------------------------------------------------------------------------
    //  Get the lease from the Virtual Network
    //--------------------------------------------------------------------------
    nic->vector_value("FLOATING_IP", floating);

    if (floating)
    {
        string ip6 = nic->vector_value("IP6");
        string ip  = nic->vector_value("IP");
        string mac = nic->vector_value("MAC");

        int ip_ne  = ip.empty() ? 0 : 1;
        int ip6_ne = ip6.empty() ? 0 : 1;
        int mac_ne = mac.empty() ? 0 : 1;

        if ( ip_ne + ip6_ne + mac_ne > 1 )
        {
            return -1;
        }

        if (ip_ne == 1)
        {
            rc = allocate_by_ip(PoolObjectSQL::VROUTER, vrid, ip,
                    nic->vector_attribute(), inherit_attrs);
        }
        else if (ip6_ne == 1)
        {
            rc = allocate_by_ip6(PoolObjectSQL::VROUTER, vrid, ip6,
                    nic->vector_attribute(), inherit_attrs);
        }
        else if (mac_ne == 1)
        {
            rc = allocate_by_mac(PoolObjectSQL::VROUTER, vrid, mac,
                    nic->vector_attribute(), inherit_attrs);
        }
        else
        {
            rc = allocate_addr(PoolObjectSQL::VROUTER, vrid,
                    nic->vector_attribute(), inherit_attrs);
        }
    }

    if (rc == 0)
    {
        vrouters.add(vrid);
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualNetwork::process_security_rule(
        VectorAttribute *        rule,
        vector<VectorAttribute*> &new_rules)
{
    ar_pool.process_security_rule(rule, new_rules);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::add_var(vector<VectorAttribute *> &var, string& error_msg)
{
    for (vector<VectorAttribute *>::iterator it=var.begin(); it!=var.end(); it++)
    {
        VectorAttribute * ar = (*it)->clone();

        if (ar_pool.from_vattr(ar, error_msg) != 0)
        {
            delete ar;
            return -1;
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */

int VirtualNetwork::add_ar(VirtualNetworkTemplate * ars_tmpl, string& error_msg)
{
    const VectorAttribute * ar = ars_tmpl->get("AR");

    if ( ar == 0 )
    {
        error_msg = "Wrong AR definition. AR vector attribute is missing.";
        return -1;
    }

    VectorAttribute * nar = ar->clone();

    if (ar_pool.from_vattr(nar, error_msg) != 0)
    {
        delete nar;
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::update_ar(
        VirtualNetworkTemplate* ars_tmpl,
        bool                    keep_restricted,
        string&                 error_msg)
{
    vector<VectorAttribute *> tmp_ars;

    if(ars_tmpl->get("AR", tmp_ars) == 0)
    {
        error_msg = "Wrong AR definition. AR vector attribute is missing.";
        return -1;
    }

    keep_restricted = keep_restricted && is_reservation();

    return ar_pool.update_ar(tmp_ars, keep_restricted, error_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::rm_ar(unsigned int ar_id, string& error_msg)
{
    return ar_pool.rm_ar(ar_id, error_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::rm_ars(string& error_msg)
{
    return ar_pool.rm_ars(error_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::hold_leases(VirtualNetworkTemplate * leases_template,
                                string&                  error_msg)
{
    const VectorAttribute * lease = leases_template->get("LEASES");

    if ( lease == 0 )
    {
        error_msg = "Empty lease description.";
        return -1;
    }

    int rc = -1;

    unsigned int ar_id;

    string  ip  = lease->vector_value("IP");
    string  ip6 = lease->vector_value("IP6");
    string  mac = lease->vector_value("MAC");

    int ip_ne  = ip.empty() ? 0 : 1;
    int ip6_ne = ip6.empty() ? 0 : 1;
    int mac_ne = mac.empty() ? 0 : 1;

    int attr_ne = ip_ne + ip6_ne + mac_ne;

    if ( attr_ne == 0 )
    {
        error_msg = "Missing MAC, IP or IP6.";
        return -1;
    }
    else if ( attr_ne > 1 )
    {
        error_msg = "Only one attribute MAC, IP or IP6 can be set.";
        return -1;
    }

    if (lease->vector_value("AR_ID", ar_id) != 0) //No AR_ID hold all addresses
    {
        if (mac_ne == 1)
        {
            rc = ar_pool.hold_by_mac(mac);
        }
        else if (ip_ne == 1)
        {
            rc = ar_pool.hold_by_ip(ip);
        }
        else if (ip6_ne == 1)
        {
            rc = ar_pool.hold_by_ip6(ip6);
        }
    }
    else
    {
        if (mac_ne == 1)
        {
            rc = ar_pool.hold_by_mac(ar_id, mac);
        }
        else if (ip_ne == 1)
        {
            rc = ar_pool.hold_by_ip(ar_id, ip);
        }
        else if (ip6_ne == 1)
        {
            rc = ar_pool.hold_by_ip6(ar_id, ip6);
        }
    }

    if (rc!=0)
    {
        error_msg = "Address is not part of the address range or in use.";
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::free_leases(VirtualNetworkTemplate * leases_template,
                                string&                  error_msg)
{
    const VectorAttribute * lease = leases_template->get("LEASES");

    if ( lease == 0 )
    {
        error_msg = "Empty lease description.";
        return -1;
    }

    unsigned int ar_id;

    string  ip  = lease->vector_value("IP");
    string  ip6 = lease->vector_value("IP6");
    string  mac = lease->vector_value("MAC");

    int ip_ne  = ip.empty() ? 0 : 1;
    int ip6_ne = ip6.empty() ? 0 : 1;
    int mac_ne = mac.empty() ? 0 : 1;

    int attr_ne = ip_ne + ip6_ne + mac_ne;

    if ( attr_ne == 0 )
    {
        error_msg = "Missing MAC, IP or IP6.";
        return -1;
    }
    else if ( attr_ne > 1 )
    {
        error_msg = "Only one attribute MAC, IP or IP6 can be set.";
        return -1;
    }

    if (lease->vector_value("AR_ID", ar_id) != 0) //No AR_ID free all addresses
    {
        if ( mac_ne == 1 )
        {
            ar_pool.free_addr(PoolObjectSQL::VM, -1, mac);
        }
        else if ( ip_ne == 1 )
        {
            ar_pool.free_addr_by_ip(PoolObjectSQL::VM, -1, ip);
        }
        else if ( ip6_ne == 1 )
        {
            ar_pool.free_addr_by_ip6(PoolObjectSQL::VM, -1, ip6);
        }
    }
    else
    {
        if ( mac_ne == 1 )
        {
            ar_pool.free_addr(ar_id, PoolObjectSQL::VM, -1, mac);
        }
        else if ( ip_ne == 1 )
        {
            ar_pool.free_addr_by_ip(ar_id, PoolObjectSQL::VM, -1, ip);
        }
        else if ( ip6_ne == 1 )
        {
            ar_pool.free_addr_by_ip6(ar_id, PoolObjectSQL::VM, -1, ip6);
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualNetwork::get_template_attribute(const string& name,
    string& value, int ar_id) const
{
    ar_pool.get_attribute(name, value, ar_id);

    if (value.empty())
    {
        PoolObjectSQL::get_template_attribute(name, value);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::get_template_attribute(const string& name, int& value,
    int ar_id) const
{
    int rc = ar_pool.get_attribute(name, value, ar_id);

    if (rc != 0)
    {
        if (PoolObjectSQL::get_template_attribute(name, value) == false)
        {
            rc = -1;
        }
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::reserve_addr(int rid, unsigned int rsize, AddressRange *rar,
    string& error_str)
{
    if (ar_pool.reserve_addr(rid, rsize, rar) != 0)
    {
        error_str = "Not enough free addresses in an address range";

        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::reserve_addr(int rid, unsigned int rsize, unsigned int ar_id,
        AddressRange *rar, string& error_str)
{
    if (ar_pool.reserve_addr(rid, rsize, ar_id, rar) != 0)
    {
        ostringstream oss;

        oss << "Not enough free addresses in address range " << ar_id
            << ", or it does not exist";

        error_str = oss.str();

        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::reserve_addr_by_ip(int rid, unsigned int rsize,
        unsigned int ar_id, const string& ip, AddressRange *rar, string& error_str)
{
    if (ar_pool.reserve_addr_by_ip(rid, rsize, ar_id, ip, rar)!=0)
    {
        ostringstream oss;

        oss << "Not enough free addresses in address range " << ar_id
            << ", or it does not exist";

        error_str = oss.str();

        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::reserve_addr_by_ip6(int rid, unsigned int rsize,
        unsigned int ar_id, const string& ip, AddressRange *rar, string& error_str)
{
    if (ar_pool.reserve_addr_by_ip6(rid, rsize, ar_id, ip, rar)!=0)
    {
        ostringstream oss;

        oss << "Not enough free addresses in address range " << ar_id
            << ", or it does not exist";

        error_str = oss.str();

        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::reserve_addr_by_mac(int rid, unsigned int rsize,
        unsigned int ar_id, const string& mac, AddressRange *rar, string& error_str)
{
    if (ar_pool.reserve_addr_by_mac(rid, rsize, ar_id, mac, rar)!=0)
    {
        ostringstream oss;

        oss << "Not enough free addresses in address range " << ar_id
            << ", or it does not exist";

        error_str = oss.str();

        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool VirtualNetwork::is_reservation() const
{
    return parent_vid != -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualNetwork::get_security_groups(set<int> & sgs)
{
    std::set<int>::const_iterator it;

    for (it = security_groups.begin(); it != security_groups.end(); it++)
    {
        sgs.insert(*it);
    }

    ar_pool.get_all_security_groups(sgs);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::parse_bridge_type(const string &vn_mad, string &error_str)
{
    const VectorAttribute* vatt;
    std::string br_type;

    ostringstream oss;

    if ( Nebula::instance().get_vn_conf_attribute(vn_mad, vatt) != 0 )
    {
        goto error_conf;
    }

    if ( vatt->vector_value("BRIDGE_TYPE", br_type) == -1)
    {
        goto error;
    }
    else
    {
        if (str_to_bridge_type(br_type) == UNDEFINED)
        {
            goto error;
        }

        bridge_type = br_type;
    }

    return 0;

error_conf:
    oss << "VN_MAD named \"" << vn_mad << "\" is not defined in oned.conf";
    goto error_common;

error:
    oss << "Attribute bridge type in VN_MAD_CONF for "
        << vn_mad << " is missing or has wrong value in oned.conf";

error_common:
    error_str = oss.str();
    return -1;
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualNetwork::encrypt()
{
    std::string one_key;
    Nebula::instance().get_configuration_attribute("ONE_KEY", one_key);

    obj_template->encrypt(one_key);
    ar_pool.encrypt(one_key);
}

void VirtualNetwork::decrypt()
{
    std::string one_key;
    Nebula::instance().get_configuration_attribute("ONE_KEY", one_key);

    obj_template->decrypt(one_key);
    ar_pool.decrypt(one_key);
}


