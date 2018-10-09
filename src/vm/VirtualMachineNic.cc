/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachineNic::release_network_leases(int vmid)
{
    Nebula& nd = Nebula::instance();
    VirtualNetworkPool* vnpool = nd.get_vnpool();
    SecurityGroupPool*  sgpool = nd.get_secgrouppool();

    set<int> sgs;

    get_security_groups(sgs);

    sgpool->release_security_groups(vmid, sgs);

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

    VirtualNetwork * vn = vnpool->get(vnid);

    if ( vn == 0 )
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

    vnpool->update(vn);

    vn->unlock();

    return 0;
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
        User * user      = upool->get_ro(uname);

        if ( user == 0 )
        {
            error = "User set in NETWORK_UNAME does not exist";
            return -1;
        }

        uid = user->get_oid();

        user->unlock();
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

    string net_mode = "";

    net_mode = this->vector_value("NETWORK_MODE");
    one_util::toupper(net_mode);

    if ( net_mode == "AUTO" )
    {
        return;
    }

    get_security_groups(sgroups);

    vnpool->authorize_nic(ot, this, uid, ar, sgroups, check_lock);

    for(set<int>::iterator it = sgroups.begin(); it != sgroups.end(); it++)
    {
        SecurityGroup * sgroup = sgpool->get_ro(*it);

        if(sgroup != 0)
        {
            PoolObjectAuth perm;

            sgroup->get_permissions(perm);

            sgroup->unlock();

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
    std::string ip      = vector_value("IP");
    std::string ip6     = vector_value("IP6");
    std::string ip6_ula = vector_value("IP6_ULA");

    std::string reqs = vector_value("SCHED_REQUIREMENTS");
    std::string rank = vector_value("SCHED_RANK");
    std::string mode = vector_value("NETWORK_MODE");

    oss << "<NIC>";

    if (!ip.empty())
    {
        oss << "<IP>" << one_util::escape_xml(ip) << "</IP>";
    }

    if (!ip6.empty())
    {
        oss << "<IP6>" << one_util::escape_xml(ip6) << "</IP6>";
    }

    if (!ip6_ula.empty())
    {
        oss << "<IP6_ULA>" << one_util::escape_xml(ip6_ula) << "</IP6_ULA>";
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

const char * VirtualMachineNics::NIC_ID_NAME = "NIC_ID";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachineNics::get_network_leases(int vm_id, int uid,
        vector<Attribute *> nics, VectorAttribute * nic_default,
        vector<VectorAttribute*>& sgs, std::string& error_str)
{
    Nebula& nd = Nebula::instance();

    VirtualNetworkPool * vnpool = nd.get_vnpool();
    SecurityGroupPool * sgpool  = nd.get_secgrouppool();

    set<int> sg_ids;

    vector<Attribute*>::iterator it;
    int nic_id;

    /* ---------------------------------------------------------------------- */
    /* Get the interface network information                                  */
    /* ---------------------------------------------------------------------- */
    for (it=nics.begin(), nic_id=0 ; it != nics.end() ; ++it, ++nic_id)
    {
        VectorAttribute * vnic  = static_cast<VectorAttribute *>(*it);
        VirtualMachineNic * nic = new VirtualMachineNic(vnic, nic_id);

        std::string net_mode = vnic->vector_value("NETWORK_MODE");
        one_util::toupper(net_mode);

        if (net_mode != "AUTO"  )
        {
            if ( nic_default != 0 )
            {
                nic->merge(nic_default, false);
            }

            if ( vnpool->nic_attribute(PoolObjectSQL::VM, nic, nic_id, uid,
                    vm_id, error_str) == -1 )
            {
                return -1;
            }

            nic->get_security_groups(sg_ids);
        }
        else
        {
            nic->replace("NIC_ID", nic_id);
        }

        add_attribute(nic, nic->get_nic_id());
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
        one_util::toupper(net_mode);

        if ( net_mode != "AUTO" )
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
    // Get the highest NIC_ID
    // -------------------------------------------------------------------------
    int max_nic_id = -1;

    for(nic_iterator it = begin(); it != end() ; ++it)
    {
        int nic_id = (*it)->get_nic_id();

        if ( nic_id > max_nic_id )
        {
            max_nic_id = nic_id;
        }
    }

    VirtualMachineNic * nic = new VirtualMachineNic(vnic, max_nic_id + 1);

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
    set<int> nic_sgs, vm_sgs;

    get_security_groups(vm_sgs);

    nic->get_security_groups(nic_sgs);

    for (set<int>::iterator it = vm_sgs.begin(); it != vm_sgs.end(); ++it)
    {
        nic_sgs.erase(*it);
    }

    sgpool->get_security_group_rules(vmid, nic_sgs, sgs);

    // -------------------------------------------------------------------------
    // Add the nic to the set
    // -------------------------------------------------------------------------
    add_attribute(nic, nic->get_nic_id());

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

