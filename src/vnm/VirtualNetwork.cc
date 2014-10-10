/* -------------------------------------------------------------------------- */
/* Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        */
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
                               int                      _cluster_id,
                               const string&            _cluster_name,
                               VirtualNetworkTemplate * _vn_template):
            PoolObjectSQL(-1,NET,"",_uid,_gid,_uname,_gname,table),
            Clusterable(_cluster_id, _cluster_name),
            bridge(""),
            parent_vid(_pvid)
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
        "oid, name, body, uid, gid, owner_u, group_u, other_u, cid, pid";

const char * VirtualNetwork::db_bootstrap = "CREATE TABLE IF NOT EXISTS"
    " network_pool (oid INTEGER PRIMARY KEY, name VARCHAR(128),"
    " body MEDIUMTEXT, uid INTEGER, gid INTEGER,"
    " owner_u INTEGER, group_u INTEGER, other_u INTEGER,"
    " cid INTEGER, pid INTEGER, UNIQUE(name,uid))";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::insert(SqlDB * db, string& error_str)
{
    vector<Attribute *> ars;
    ostringstream       ose;

    bool b_vlan;

    //--------------------------------------------------------------------------
    // VirtualNetwork Attributes from the template
    //--------------------------------------------------------------------------

    // ------------ NAME ----------------------

    erase_template_attribute("NAME",name);

    if (name.empty())
    {
        goto error_name;
    }

    // ------------ PHYDEV --------------------

    erase_template_attribute("PHYDEV", phydev);

    add_template_attribute("PHYDEV", phydev);

    // ------------ VLAN_ID -------------------

    erase_template_attribute("VLAN_ID", vlan_id);

    add_template_attribute("VLAN_ID", vlan_id);

    // ------------ VLAN ----------------------

    erase_template_attribute("VLAN", b_vlan);

    if (b_vlan || !phydev.empty())
    {
        vlan = 1;
        add_template_attribute("VLAN", "YES");
    }
    else
    {
        vlan = 0;
        add_template_attribute("VLAN", "NO");
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

    remove_template_attribute("AR", ars);

    if (add_var(ars, error_str) != 0)
    {
        goto error_ar;
    }

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

error_bridge:
    ose << "No BRIDGE in template for Virtual Network.";
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

int VirtualNetwork::replace_template(
        const string& tmpl_str, bool keep_restricted, string& error_str)
{
    string new_bridge;
    bool   b_vlan;

    /* ---------------------------------------------------------------------- */
    /* Parse & Update VirtualNetwork Template                                 */
    /* ---------------------------------------------------------------------- */

    Template * new_tmpl  = new VirtualNetworkTemplate;

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

    if (keep_restricted && is_reservation())
    {
        new_tmpl->remove_restricted();

        if (obj_template != 0)
        {
            obj_template->remove_all_except_restricted();

            string aux_error;
            new_tmpl->merge(obj_template, aux_error);
        }
    }

    delete obj_template;

    obj_template = new_tmpl;

    /* ---------------------------------------------------------------------- */
    /* Update Configuration Attributes (class & template)                     */
    /*  - PHYDEV                                                              */
    /*  - VLAN_ID                                                             */
    /*  - VLAN                                                                */
    /*  - BRIDGE                                                              */
    /* ---------------------------------------------------------------------- */
    erase_template_attribute("PHYDEV", phydev);

    add_template_attribute("PHYDEV", phydev);

    erase_template_attribute("VLAN_ID", vlan_id);

    add_template_attribute("VLAN_ID", vlan_id);

    erase_template_attribute("VLAN", b_vlan);

    if (b_vlan || !phydev.empty())
    {
        vlan = 1;
        add_template_attribute("VLAN", "YES");
    }
    else
    {
        vlan = 0;
        add_template_attribute("VLAN", "NO");
    }

    erase_template_attribute("BRIDGE",new_bridge);

    if (!new_bridge.empty())
    {
        bridge = new_bridge;
    }

    add_template_attribute("BRIDGE", bridge);

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
        <<          cluster_id  << ","
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

    return to_xml_extended(xml,false, empty, empty);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& VirtualNetwork::to_xml_extended(string& xml, const vector<int>& vms,
        const vector<int>& vnets) const
{
    return to_xml_extended(xml,true, vms, vnets);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& VirtualNetwork::to_xml_extended(string& xml, bool extended,
    const vector<int>& vms, const vector<int>& vnets) const
{
    ostringstream   os;

    string template_xml;
    string leases_xml;
    string perm_str;

    os <<
        "<VNET>" <<
            "<ID>"        << oid       << "</ID>"        <<
            "<UID>"       << uid       << "</UID>"       <<
            "<GID>"       << gid       << "</GID>"       <<
            "<UNAME>"     << uname     << "</UNAME>"     <<
            "<GNAME>"     << gname     << "</GNAME>"     <<
            "<NAME>"      << name      << "</NAME>"      <<
            perms_to_xml(perm_str)     <<
            "<CLUSTER_ID>"<< cluster_id<< "</CLUSTER_ID>"<<
            "<CLUSTER>"   << cluster   << "</CLUSTER>"   <<
            "<BRIDGE>"    << bridge    << "</BRIDGE>"    <<
            "<VLAN>"      << vlan      << "</VLAN>";

    if (parent_vid != -1)
    {
        os << "<PARENT_NETWORK_ID>" << parent_vid << "</PARENT_NETWORK_ID>";
    }
    else
    {
        os << "<PARENT_NETWORK_ID/>";
    }

    if (!phydev.empty())
    {
        os << "<PHYDEV><![CDATA[" << phydev << "]]></PHYDEV>";
    }
    else
    {
        os << "<PHYDEV/>";
    }

    if (!vlan_id.empty())
    {
        os << "<VLAN_ID><![CDATA[" << vlan_id << "]]></VLAN_ID>";
    }
    else
    {
        os << "<VLAN_ID/>";
    }
    os  << "<USED_LEASES>"<< ar_pool.get_used_addr() << "</USED_LEASES>";

    os  << obj_template->to_xml(template_xml);

    os  << ar_pool.to_xml(leases_xml, extended, vms, vnets);

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

    // Initialize the internal XML object
    update_from_str(xml_str);

    // Get class base attributes
    rc += xpath(oid,       "/VNET/ID", -1);
    rc += xpath(uid,       "/VNET/UID", -1);
    rc += xpath(gid,       "/VNET/GID", -1);
    rc += xpath(uname,     "/VNET/UNAME", "not_found");
    rc += xpath(gname,     "/VNET/GNAME", "not_found");
    rc += xpath(name,      "/VNET/NAME", "not_found");
    rc += xpath(bridge,    "/VNET/BRIDGE", "not_found");
    rc += xpath(vlan,      "/VNET/VLAN", 0);
    rc += xpath(cluster_id,"/VNET/CLUSTER_ID", -1);
    rc += xpath(cluster,   "/VNET/CLUSTER", "not_found");

    // Permissions
    rc += perms_from_xml();

    xpath(phydev, "/VNET/PHYDEV", "");
    xpath(vlan_id,"/VNET/VLAN_ID","");
    xpath(parent_vid,"/VNET/PARENT_NETWORK_ID",-1);

    // Virtual Network template
    ObjectXML::get_nodes("/VNET/TEMPLATE", content);

    if (content.empty())
    {
        return -1;
    }

    rc += obj_template->from_xml_node(content[0]);

    ObjectXML::free_nodes(content);
    content.clear();

    // Address Range Pool
    ObjectXML::get_nodes("/VNET/AR_POOL", content);

    if (content.empty())
    {
        return -1;
    }

    // Virtual Network template
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
    vector<string>::const_iterator it;

    set<int>    nic_sgroups;
    string      st_sgroups;
    int         ar_id;

    //--------------------------------------------------------------------------
    //  Set default values from the Virtual Network
    //--------------------------------------------------------------------------

    nic->replace("NETWORK", name);
    nic->replace("NETWORK_ID", oid);
    nic->replace("BRIDGE", bridge);

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
        nic->replace("CLUSTER_ID", get_cluster_id());
    }

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
        rc = allocate_by_ip(vid, ip, nic, inherit_attrs);
    }
    else if (!mac.empty())
    {
        rc = allocate_by_mac(vid, mac, nic, inherit_attrs);
    }
    else
    {
        rc = allocate_addr(vid, nic, inherit_attrs);
    }

    //--------------------------------------------------------------------------
    //  Copy the security group IDs
    //--------------------------------------------------------------------------

    one_util::split(nic->vector_value("SECURITY_GROUPS"), ',', nic_sgroups);

    obj_template->get("SECURITY_GROUPS", st_sgroups);

    set<int> vnet_sgroups;
    one_util::split(st_sgroups, ',', vnet_sgroups);

    nic_sgroups.insert(vnet_sgroups.begin(), vnet_sgroups.end());

    if (nic->vector_value("AR_ID", ar_id) == 0)
    {
        ar_pool.get_attribute("SECURITY_GROUPS", st_sgroups, ar_id);

        set<int> ar_sgroups;
        one_util::split(st_sgroups, ',', ar_sgroups);

        nic_sgroups.insert(ar_sgroups.begin(), ar_sgroups.end());
    }

    nic->replace("SECURITY_GROUPS", one_util::join(nic_sgroups.begin(), nic_sgroups.end(), ','));

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

int VirtualNetwork::add_var(vector<Attribute *> &var, string& error_msg)
{
    for (vector<Attribute *>::iterator it=var.begin(); it!=var.end(); it++)
    {
        VectorAttribute * oar = dynamic_cast<VectorAttribute *>(*it);

        if (oar == 0)
        {
            error_msg = "Invalid format for address range";
            return -1;
        }

        VectorAttribute * ar = oar->clone();

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
    vector<Attribute *> var;

    if (ars_tmpl->get("AR", var) <= 0)
    {
        return 0;
    }

    const VectorAttribute * ar = dynamic_cast<const VectorAttribute *>(var[0]);

    if (ar == 0)
    {
        error_msg = "Wrong AR definition";
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
    vector<Attribute *> tmp_ars;

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
    vector<const Attribute *> vleases;
    const VectorAttribute *   lease = 0;

    if (leases_template->get("LEASES", vleases) <= 0)
    {
        error_msg = "Empty lease description.";
        return -1;
    }

   lease = dynamic_cast<const VectorAttribute *>(vleases[0]);

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

    vector<const Attribute *> vleases;
    const VectorAttribute *   lease = 0;

    if (leases_template->get("LEASES", vleases) <= 0)
    {
        error_msg = "Empty lease description.";
        return -1;
    }

   lease = dynamic_cast<const VectorAttribute *>(vleases[0]);

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

int VirtualNetwork::reserve_addr(VirtualNetwork *rvnet,
    unsigned int rsize, string& error_str)
{
    AddressRange *rar = rvnet->allocate_ar();

    if (ar_pool.reserve_addr(rvnet->get_oid(), rsize, rar) != 0)
    {
        error_str = "Not enough free addresses in an address range";

        delete rar;

        return -1;
    }

    if (rvnet->add_ar(rar) != 0)
    {
        error_str = "Could not add the address range to the netwok";

        delete rar;

        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::reserve_addr(VirtualNetwork *rvnet,
    unsigned int rsize, unsigned int ar_id, string& error_str)
{
    AddressRange *rar = rvnet->allocate_ar();

    if (ar_pool.reserve_addr(rvnet->get_oid(), rsize, ar_id, rar) != 0)
    {
        ostringstream oss;

        oss << "Not enough free addresses in address range " << ar_id
            << ", or it does not exist";

        error_str = oss.str();

        delete rar;

        return -1;
    }

    if (rvnet->add_ar(rar) != 0)
    {
        error_str = "Could not add the address range to the netwok";

        delete rar;

        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::reserve_addr_by_ip(VirtualNetwork *rvnet,
    unsigned int rsize, unsigned int ar_id, const string& ip, string& error_str)
{
    AddressRange *rar = rvnet->allocate_ar();

    if (ar_pool.reserve_addr_by_ip(rvnet->get_oid(),rsize,ar_id,ip,rar)!=0)
    {
        ostringstream oss;

        oss << "Not enough free addresses in address range " << ar_id
            << ", or it does not exist";

        error_str = oss.str();

        delete rar;

        return -1;
    }

    if (rvnet->add_ar(rar) != 0)
    {
        error_str = "Could not add the address range to the netwok";

        delete rar;

        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetwork::reserve_addr_by_mac(VirtualNetwork *rvnet,
    unsigned int rsize, unsigned int ar_id, const string& mac, string& error_str)
{
    AddressRange *rar = rvnet->allocate_ar();

    if (ar_pool.reserve_addr_by_mac(rvnet->get_oid(),rsize,ar_id,mac,rar)!=0)
    {
        ostringstream oss;

        oss << "Not enough free addresses in address range " << ar_id
            << ", or it does not exist";

        error_str = oss.str();

        delete rar;

        return -1;
    }

    if (rvnet->add_ar(rar) != 0)
    {
        error_str = "Could not add the address range to the netwok";

        delete rar;

        return -1;
    }

    return 0;
}

bool VirtualNetwork::is_reservation() const
{
    return parent_vid != -1;
}
