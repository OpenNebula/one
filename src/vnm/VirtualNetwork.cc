/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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
#include "AddressRange.h"
#include "PoolObjectAuth.h"

#include "NebulaLog.h"

#include "AuthManager.h"
#include "ClusterPool.h"

#include "NebulaUtil.h"

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

VirtualNetwork::~VirtualNetwork()
{
    delete obj_template;
}

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

int VirtualNetwork::insert(SqlDB * db, string& error_str)
{
    vector<VectorAttribute *> ars;
    ostringstream       ose;

    string sg_str, vis;

    int rc, num_ars;

    //--------------------------------------------------------------------------
    // VirtualNetwork Attributes from the template
    //--------------------------------------------------------------------------

    // ------------ NAME ----------------------

    erase_template_attribute("NAME",name);

    if (name.empty())
    {
        goto error_name;
    }

    // ------------ VN_MAD --------------------

    erase_template_attribute("VN_MAD", vn_mad);

    if (vn_mad.empty())
    {
        goto error_vn_mad;
    }

    add_template_attribute("VN_MAD", vn_mad);

    // ------------ PHYDEV --------------------

    erase_template_attribute("PHYDEV", phydev);

    add_template_attribute("PHYDEV", phydev);

    // ---- VLAN_ID if not set allocated in VirtualNetworkPool, if needed -----

    if (PoolObjectSQL::get_template_attribute("VLAN_ID", vis) && !vis.empty())
    {
        erase_template_attribute("VLAN_ID", vlan_id);

        add_template_attribute("VLAN_ID", vlan_id);

        remove_template_attribute("AUTOMATIC_VLAN_ID");

        vlan_id_automatic = false;
    }
    else
    {
        erase_template_attribute("AUTOMATIC_VLAN_ID", vlan_id_automatic);
    }

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

    //--------------------------------------------------------------------------
    // Insert the Virtual Network
    //--------------------------------------------------------------------------

    if ( insert_replace(db, false, error_str) != 0 )
    {
        goto error_db;
    }

    return 0;

error_name:
    ose << "No NAME in template for Virtual Network.";
    goto error_common;

error_vn_mad:
    ose << "No VN_MAD in template for Virtual Network.";
    goto error_common;

error_bridge:
    ose << "BRIDGE or PHY_DEV have to be set in Virtual Network template.";
    goto error_common;

error_db:
error_ar:
    ose << error_str;

error_common:
    error_str = ose.str();
    NebulaLog::log("VNM", Log::ERROR, ose);
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

    if (!vlan_id_automatic)
    {
        erase_template_attribute("VLAN_ID", vlan_id);
        add_template_attribute("VLAN_ID", vlan_id);
    }
    else
    {
        remove_template_attribute("VLAN_ID");
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
        <<          other_u     << ","
        <<          parent_vid  << ")";

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

/* ************************************************************************** */
/* Virtual Network :: Misc                                                    */
/* ************************************************************************** */

string& VirtualNetwork::to_xml(string& xml) const
{
    const vector<int> empty;

    return to_xml_extended(xml,false, empty, empty, empty);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& VirtualNetwork::to_xml_extended(string& xml, const vector<int>& vms,
        const vector<int>& vnets, const vector<int>& vrs) const
{
    return to_xml_extended(xml,true, vms, vnets, vrs);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& VirtualNetwork::to_xml_extended(string& xml, bool extended,
    const vector<int>& vms, const vector<int>& vnets,
    const vector<int>& vrs) const
{
    ostringstream   os;

    string clusters_xml;
    string vrouters_xml;
    string template_xml;
    string leases_xml;
    string perm_str;

    int int_vlan_id_automatic = vlan_id_automatic ? 1 : 0;

    os <<
        "<VNET>" <<
            "<ID>"     << oid      << "</ID>"    <<
            "<UID>"    << uid      << "</UID>"   <<
            "<GID>"    << gid      << "</GID>"   <<
            "<UNAME>"  << uname    << "</UNAME>" <<
            "<GNAME>"  << gname    << "</GNAME>" <<
            "<NAME>"   << name     << "</NAME>"  <<
            perms_to_xml(perm_str) <<
            Clusterable::to_xml(clusters_xml)    <<
            "<BRIDGE>" << one_util::escape_xml(bridge) << "</BRIDGE>";

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

    os << "<VLAN_ID_AUTOMATIC>" << int_vlan_id_automatic <<"</VLAN_ID_AUTOMATIC>";

    if (ar_pool.external_ipam() == 0)
    {
        os << "<USED_LEASES>-</USED_LEASES>";
    } 
    else 
    {
        os << "<USED_LEASES>"<< ar_pool.get_used_addr() << "</USED_LEASES>";
    }

    os << vrouters.to_xml(vrouters_xml);

    os << obj_template->to_xml(template_xml);

    os << ar_pool.to_xml(leases_xml, extended, vms, vnets, vrs);

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

    // Permissions
    rc += perms_from_xml();

    xpath(vn_mad, "/VNET/VN_MAD", "");
    xpath(phydev, "/VNET/PHYDEV", "");
    xpath(vlan_id,"/VNET/VLAN_ID","");
    xpath(parent_vid,"/VNET/PARENT_NETWORK_ID",-1);
    xpath(int_vlan_id_automatic,"/VNET/VLAN_ID_AUTOMATIC",0);

    vlan_id_automatic = int_vlan_id_automatic;

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
        VectorAttribute *       nic,
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

    for (it = inherit_attrs.begin(); it != inherit_attrs.end(); it++)
    {
        PoolObjectSQL::get_template_attribute((*it).c_str(), inherit_val);

        if (!inherit_val.empty())
        {
            nic->replace(*it, inherit_val);
        }
    }

    //--------------------------------------------------------------------------
    //  Get the lease from the Virtual Network
    //--------------------------------------------------------------------------
    int rc;

    string ip  = nic->vector_value("IP");
    string mac = nic->vector_value("MAC");

    if (!ip.empty())
    {
        rc = allocate_by_ip(PoolObjectSQL::VM, vid, ip, nic, inherit_attrs);
    }
    else if (!mac.empty())
    {
        rc = allocate_by_mac(PoolObjectSQL::VM, vid, mac, nic, inherit_attrs);
    }
    else
    {
        rc = allocate_addr(PoolObjectSQL::VM, vid, nic, inherit_attrs);
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
        VectorAttribute *       nic,
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
        string ip  = nic->vector_value("IP");
        string mac = nic->vector_value("MAC");

        if (!ip.empty())
        {
            rc = allocate_by_ip(PoolObjectSQL::VROUTER, vrid, ip, nic, inherit_attrs);
        }
        else if (!mac.empty())
        {
            rc = allocate_by_mac(PoolObjectSQL::VROUTER, vrid, mac, nic, inherit_attrs);
        }
        else
        {
            rc = allocate_addr(PoolObjectSQL::VROUTER, vrid, nic, inherit_attrs);
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
    string  mac = lease->vector_value("MAC");

    if (ip.empty() && mac.empty())
    {
        error_msg = "Missing MAC or IP.";
        return -1;
    }

    if (lease->vector_value("AR_ID", ar_id) != 0) //No AR_ID hold all addresses
    {
        if (!mac.empty())
        {
            rc = ar_pool.hold_by_mac(mac);
        }
        else if (!ip.empty())
        {
            rc = ar_pool.hold_by_ip(ip);
        }
    }
    else
    {
        if (!mac.empty())
        {
            rc = ar_pool.hold_by_mac(ar_id, mac);
        }
        else if (!ip.empty())
        {
            rc = ar_pool.hold_by_ip(ar_id, ip);
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
    string  mac = lease->vector_value("MAC");

    if (ip.empty() && mac.empty())
    {
        error_msg = "Missing MAC or IP.";
        return -1;
    }

    if (lease->vector_value("AR_ID", ar_id) != 0) //No AR_ID free all addresses
    {
        if (!mac.empty())
        {
            ar_pool.free_addr(PoolObjectSQL::VM, -1, mac);
        }
        else if (!ip.empty())
        {
            ar_pool.free_addr_by_ip(PoolObjectSQL::VM, -1, ip);
        }
    }
    else
    {
        if (!mac.empty())
        {
            ar_pool.free_addr(ar_id, PoolObjectSQL::VM, -1, mac);
        }
        else if (!ip.empty())
        {
            ar_pool.free_addr_by_ip(ar_id, PoolObjectSQL::VM, -1, ip);
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualNetwork::get_template_attribute(const char * name,
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

int VirtualNetwork::get_template_attribute(const char * name, int& value,
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

bool VirtualNetwork::is_reservation() const
{
    return parent_vid != -1;
}
