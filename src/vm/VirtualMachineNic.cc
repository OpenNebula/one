/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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
#include "NebulaUtil.h"
#include "Nebula.h"
#include "SecurityGroupPool.h"
#include "VirtualNetworkPool.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachineNic::release_network_leases(int vmid)
{
    Nebula& nd = Nebula::instance();
    VirtualNetworkPool* vnpool = nd.get_vnpool();

    int vnid;

    if ( vector_value("NETWORK_ID", vnid) != 0 )
    {
        return -1;
    }

    string mac = vector_value("MAC");

    if (mac.empty())
    {
        return -1;
    }

    auto vn = vnpool->get(vnid);

    if (vn == nullptr)
    {
        return -1;
    }

    int ar_id;

    if (vector_value("AR_ID", ar_id) == 0)
    {
        vn->free_addr(ar_id, PoolObjectSQL::VM, vmid, mac);
    }
    else
    {
        vn->free_addr(PoolObjectSQL::VM, vmid, mac);
    }

    vnpool->update(vn.get());

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineNic::add_security_group(int sg)
{
    set<int> sgs;
    get_security_groups(sgs);

    auto rc = sgs.insert(sg);

    if (rc.second)
    {
        replace("SECURITY_GROUPS", one_util::join(sgs.begin(), sgs.end(), ','));
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineNic::remove_security_group(int sg)
{
    set<int> sgs;
    get_security_groups(sgs);

    auto rc = sgs.erase(sg);

    if (rc)
    {
        replace("SECURITY_GROUPS", one_util::join(sgs.begin(), sgs.end(), ','));
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachineNic::get_uid(int _uid, string& error)
{
    string uid_s;
    string uname;
    int    uid;

    if ( !(uid_s = vector_value("NETWORK_UID")).empty() )
    {
        istringstream is(uid_s);

        is >> uid;

        if( is.fail() )
        {
            error = "Cannot get user in NETWORK_UID";
            return -1;
        }
    }
    else if ( !(uname = vector_value("NETWORK_UNAME")).empty() )
    {
        UserPool * upool = Nebula::instance().get_upool();
        auto user        = upool->get_ro(uname);

        if ( user == nullptr )
        {
            error = "User set in NETWORK_UNAME does not exist";
            return -1;
        }

        uid = user->get_oid();
    }
    else
    {
        uid = _uid;
    }

    return uid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineNic::authorize(PoolObjectSQL::ObjectType ot, int uid,
                                  AuthRequest* ar, bool check_lock)
{
    Nebula& nd = Nebula::instance();

    VirtualNetworkPool * vnpool = nd.get_vnpool();
    SecurityGroupPool *  sgpool = nd.get_secgrouppool();

    set<int> sgroups;

    string net_mode = this->vector_value("NETWORK_MODE");

    if ( one_util::icasecmp(net_mode, "AUTO") )
    {
        return;
    }

    get_security_groups(sgroups);

    vnpool->authorize_nic(ot, this, uid, ar, sgroups, check_lock);

    for (auto sg : sgroups)
    {
        if (auto sgroup = sgpool->get_ro(sg))
        {
            PoolObjectAuth perm;

            sgroup->get_permissions(perm);

            if ( check_lock )
            {
                ar->add_auth(AuthRequest::USE, perm);
            }
            else
            {
                ar->add_auth(AuthRequest::USE_NO_LCK, perm);
            }
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#define XML_NIC_ATTR(Y,X) ( Y << "<" << X << ">" << \
        one_util::escape_xml(vector_value(X)) << "</" << X << ">")

void VirtualMachineNic::to_xml_short(std::ostringstream& oss) const
{
    const string& ip      = vector_value("IP");
    const string& ip6     = vector_value("IP6");
    const string& ip6_ula = vector_value("IP6_ULA");

    const string& ip6_link    = vector_value("IP6_LINK");
    const string& ip6_global  = vector_value("IP6_GLOBAL");
    const string& ip_external = vector_value("EXTERNAL_IP"); /* PROVISION AWS_IPAM */

    const string& reqs = vector_value("SCHED_REQUIREMENTS");
    const string& rank = vector_value("SCHED_RANK");
    const string& mode = vector_value("NETWORK_MODE");

    oss << "<NIC>";

    if (!ip.empty())
    {
        oss << "<IP>" << one_util::escape_xml(ip) << "</IP>";
    }

    if (!ip_external.empty())
    {
        oss << "<EXTERNAL_IP>" << one_util::escape_xml(ip_external) << "</EXTERNAL_IP>";
    }

    if (!ip6.empty())
    {
        oss << "<IP6>" << one_util::escape_xml(ip6) << "</IP6>";
    }

    if (!ip6_ula.empty())
    {
        oss << "<IP6_ULA>" << one_util::escape_xml(ip6_ula) << "</IP6_ULA>";
    }

    if (!ip6_link.empty())
    {
        oss << "<IP6_LINK>" << one_util::escape_xml(ip6_link) << "</IP6_LINK>";
    }

    if (!ip6_global.empty())
    {
        oss << "<IP6_GLOBAL>" << one_util::escape_xml(ip6_global) << "</IP6_GLOBAL>";
    }

    if (!mode.empty())
    {
        oss << "<NETWORK_MODE>" << one_util::escape_xml(mode) << "</NETWORK_MODE>";
    }

    if (!reqs.empty())
    {
        oss << "<SCHED_REQUIREMENTS>" << one_util::escape_xml(reqs)
            << "</SCHED_REQUIREMENTS>";
    }

    if (!rank.empty())
    {
        oss << "<SCHED_RANK>" << one_util::escape_xml(rank) << "</SCHED_RANK>";
    }

    XML_NIC_ATTR(oss, "MAC");
    XML_NIC_ATTR(oss, "NETWORK");
    XML_NIC_ATTR(oss, "NETWORK_ID");
    XML_NIC_ATTR(oss, "NIC_ID");
    XML_NIC_ATTR(oss, "SECURITY_GROUPS");

    oss << "</NIC>";
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* VIRTUALMACHINENICS                                                         */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const char * VirtualMachineNics::NIC_NAME = "NIC";

const char * VirtualMachineNics::NIC_ALIAS_NAME = "NIC_ALIAS";

const char * VirtualMachineNics::NIC_ID_NAME = "NIC_ID";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
struct NicAliasID
{
    NicAliasID(int _n):nic_id(_n), alias_id(0) {};

    int nic_id;
    int alias_id;

    std::string alias_id_s;
};

int VirtualMachineNics::get_network_leases(int vm_id, int uid,
                                           vector<Attribute *> nics, VectorAttribute * nic_default,
                                           vector<VectorAttribute*>& sgs, std::string& error_str)
{
    Nebula& nd = Nebula::instance();

    VirtualNetworkPool * vnpool = nd.get_vnpool();
    SecurityGroupPool * sgpool  = nd.get_secgrouppool();

    set<int> sg_ids;

    int nic_id = 0;

    vector<Attribute *> alias_nics;

    std::map<std::string, NicAliasID> nic_map;

    /* ---------------------------------------------------------------------- */
    /* Get the interface network information                                  */
    /* ---------------------------------------------------------------------- */
    for (auto it=nics.begin(); it != nics.end() ; ++it)
    {
        VectorAttribute * vnic = static_cast<VectorAttribute *>(*it);
        std::string net_mode   = vnic->vector_value("NETWORK_MODE");

        one_util::toupper(net_mode);

        if (vnic->name() == "NIC" || vnic->name() == "PCI")
        {
            VirtualMachineNic * nic = new VirtualMachineNic(vnic, nic_id);

            if (net_mode != "AUTO"  )
            {
                if ( nic_default != 0 )
                {
                    nic->merge(nic_default, false);
                }

                if ( vnpool->nic_attribute(PoolObjectSQL::VM, nic, nic_id, uid,
                                           vm_id, error_str) == -1 )
                {
                    delete nic;
                    return -1;
                }

                nic->get_security_groups(sg_ids);

                std::string nic_name = nic->set_nic_name();

                NicAliasID na(nic_id);

                nic_map.insert(std::make_pair(nic_name, na));
            }
            else
            {
                // set nic name for NIC_ALIAS
                nic->set_nic_name();

                nic->replace("NIC_ID", nic_id);
            }

            nic_id++;

            add_attribute(nic, nic->get_nic_id());
        }
        else if (net_mode == "AUTO")
        {
            error_str = "Alias is incompatible with auto mode";

            return -1;
        }
        else if (vnic->name() == "NIC_ALIAS")
        {
            alias_nics.push_back(vnic);
        }
    }

    /* ---------------------------------------------------------------------- */
    /* Check NIC vs NIC_ALIAS mapping consistency                             */
    /* Sets:                                                                  */
    /*    - PARENT_ID (the id of the parent NIC)                              */
    /*    - ALIAS_ID (id of the alias)                                        */
    /*    - NIC_ID                                                            */
    /*    - NIC attributes (IP, MAC,...)                                      */
    /* ---------------------------------------------------------------------- */
    for (auto it=alias_nics.begin(); it != alias_nics.end() ; ++it, ++nic_id)
    {
        VirtualMachineNic * nic = new
        VirtualMachineNic(static_cast<VectorAttribute *>(*it), nic_id);

        std::string pnic = nic->vector_value("PARENT");

        auto nit = nic_map.find(pnic);

        if ( nit == nic_map.end() )
        {
            error_str = "NIC named " + pnic + " not found for alias";

            delete nic;
            return -1;
        }

        nic->replace("PARENT_ID", nit->second.nic_id);

        nic->replace("ALIAS_ID", nit->second.alias_id);

        if (!nit->second.alias_id_s.empty())
        {
            nit->second.alias_id_s += ",";
        }

        nit->second.alias_id_s += std::to_string(nic_id);

        nit->second.alias_id++;

        nic->replace("NIC_ID", nic_id);

        if ( vnpool->nic_attribute(PoolObjectSQL::VM, nic, nic_id, uid,
                                   vm_id, error_str) == -1 )
        {
            delete nic;
            return -1;
        }

        nic->set_nic_alias_name(nit->second.nic_id);

        add_attribute(nic, nic->get_nic_id());
    }

    /* ---------------------------------------------------------------------- */
    /* Set the ALIAS ids on the parent interfaces                             */
    /* ---------------------------------------------------------------------- */
    for (auto it=nics.begin(); it != nics.end() ; ++it)
    {
        VectorAttribute * vnic = static_cast<VectorAttribute *>(*it);

        std::string nic_name = vnic->vector_value("NAME");

        auto nit = nic_map.find(nic_name);

        if ( nit == nic_map.end() || nit->second.alias_id_s.empty())
        {
            continue;
        }

        vnic->replace("ALIAS_IDS", nit->second.alias_id_s);
    }

    /* ---------------------------------------------------------------------- */
    /* Get the secutiry groups                                                */
    /* ---------------------------------------------------------------------- */
    sgpool->get_security_group_rules(vm_id, sg_ids, sgs);

    return 0;
}

int VirtualMachineNics::get_auto_network_leases(int vm_id, int uid,
                                                VectorAttribute * nic_default, vector<VectorAttribute*>& sgs,
                                                std::string& error_str)
{
    Nebula& nd = Nebula::instance();

    VirtualNetworkPool * vnpool = nd.get_vnpool();
    SecurityGroupPool * sgpool  = nd.get_secgrouppool();

    set<int> sg_ids;

    /* ---------------------------------------------------------------------- */
    /* Get the interface network information                                  */
    /* ---------------------------------------------------------------------- */
    for ( nic_iterator nic = begin() ; nic != end() ; ++nic )
    {
        int nic_id;

        std::string net_mode = (*nic)->vector_value("NETWORK_MODE");

        if ( !one_util::icasecmp(net_mode, "AUTO") )
        {
            continue;
        }

        if ( (*nic)->vector_value("NIC_ID", nic_id) != 0 )
        {
            continue;
        }

        if ( nic_default != 0 )
        {
            (*nic)->merge(nic_default, false);
        }

        if ( vnpool->nic_attribute(PoolObjectSQL::VM, *nic, nic_id, uid,
                                   vm_id, error_str) == -1 )
        {
            return -1;
        }

        (*nic)->get_security_groups(sg_ids);
    }

    /* ---------------------------------------------------------------------- */
    /* Get the secutiry groups                                                */
    /* ---------------------------------------------------------------------- */
    sgpool->get_security_group_rules(vm_id, sg_ids, sgs);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineNics::release_network_leases(int vmid)
{
    SecurityGroupPool*  sgpool = Nebula::instance().get_secgrouppool();

    set<int> sgs;

    get_security_groups(sgs);

    for (auto sgid : sgs)
    {
        sgpool->release_security_group(vmid, sgid);
    }

    for (nic_iterator it = begin(); it != end() ; ++it)
    {
        (*it)->release_network_leases(vmid);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineNics::get_security_groups(set<int>& sgs)
{
    for (nic_iterator it = begin(); it != end() ; ++it)
    {
        (*it)->get_security_groups(sgs);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachineNics::set_up_attach_nic(int vmid, int uid, int cluster_id,
                                          VectorAttribute * vnic, VectorAttribute * nic_default,
                                          vector<VectorAttribute*>& sgs, std::string& error_str )
{
    Nebula&             nd     = Nebula::instance();
    VirtualNetworkPool* vnpool = nd.get_vnpool();
    SecurityGroupPool*  sgpool = nd.get_secgrouppool();

    // -------------------------------------------------------------------------
    // Get the highest NIC_ID and ALIAS_ID
    // -------------------------------------------------------------------------
    int max_nic_id   = -1;
    int max_alias_id = -1;

    for(nic_iterator it = begin(); it != end() ; ++it)
    {
        int nic_id = (*it)->get_nic_id();

        if ( nic_id > max_nic_id )
        {
            max_nic_id = nic_id;
        }

        if ( (*it)->is_alias() )
        {
            int alias_id;

            (*it)->vector_value("ALIAS_ID", alias_id);

            if ( alias_id > max_alias_id )
            {
                max_alias_id = alias_id;
            }
        }
    }

    VirtualMachineNic * nic  = new VirtualMachineNic(vnic, max_nic_id + 1);
    VirtualMachineNic * pnic = 0;

    std::string alias_ids;

    if ( nic->is_alias() )
    {
        int pid, alias_id;

        for(nic_iterator it = begin(); it != end() ; ++it)
        {
            if ( (*it)->vector_value("NAME") == nic->vector_value("PARENT") )
            {
                pnic = *it;

                pid = pnic->get_nic_id();

                pnic->vector_value("ALIAS_IDS", alias_ids);

                if (alias_ids.empty())
                {
                    alias_id = 0;
                }
                else
                {
                    alias_id = max_alias_id + 1;

                    alias_ids += ",";
                }

                alias_ids += std::to_string(max_nic_id + 1);

                break;
            }
        }

        if ( pnic == 0 )
        {
            error_str = "Alias not found.";
            return -1;
        }

        nic->set_nic_alias_name(pid);

        nic->replace("PARENT_ID", pid);
        nic->replace("ALIAS_ID", alias_id);
    }
    else
    {
        nic->set_nic_name();
    }

    if ( nic_default != 0 )
    {
        nic->merge(nic_default, false);
    }

    nic->set_attach();

    // -------------------------------------------------------------------------
    // Acquire a new network lease
    // -------------------------------------------------------------------------
    int rc = vnpool->nic_attribute(PoolObjectSQL::VM, nic, max_nic_id+1, uid,
                                   vmid, error_str);

    if ( rc == -1 ) //-2 is not using a pre-defined network
    {
        delete nic;
        return -1;
    }

    // -------------------------------------------------------------------------
    // Check that we don't have a cluster incompatibility.
    // -------------------------------------------------------------------------
    string nic_cluster_ids;

    if (nic->vector_value("CLUSTER_ID", nic_cluster_ids) == 0)
    {
        set<int> cluster_ids;
        one_util::split_unique(nic_cluster_ids, ',', cluster_ids);

        if (cluster_ids.count(cluster_id) == 0)
        {
            ostringstream oss;

            nic->release_network_leases(vmid);

            delete nic;

            oss << "Virtual network is not part of cluster [" << cluster_id << "]";

            error_str = oss.str();

            NebulaLog::log("DiM", Log::ERROR, error_str);

            return -1;
        }
    }

    // -------------------------------------------------------------------------
    // Get security groups for the new nic
    // -------------------------------------------------------------------------
    if ( !nic->is_alias() )
    {
        set<int> nic_sgs, vm_sgs;

        get_security_groups(vm_sgs);

        nic->get_security_groups(nic_sgs);

        for (auto sg : vm_sgs)
        {
            nic_sgs.erase(sg);
        }

        sgpool->get_security_group_rules(vmid, nic_sgs, sgs);
    }

    // -------------------------------------------------------------------------
    // Add the nic to the set
    // -------------------------------------------------------------------------
    add_attribute(nic, nic->get_nic_id());

    if ( pnic != 0 )
    {
        pnic->replace("ALIAS_IDS", alias_ids);
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

std::string& VirtualMachineNics::to_xml_short(std::string& xml)
{
    std::ostringstream oss;

    for ( nic_iterator nic = begin() ; nic != end() ; ++nic )
    {
        (*nic)->to_xml_short(oss);
    }

    xml = oss.str();

    return xml;
}

