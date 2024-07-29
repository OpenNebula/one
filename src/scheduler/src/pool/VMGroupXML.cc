/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project Leads (OpenNebula.org)             */
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

#include "VMGroupXML.h"
#include "VirtualMachinePoolXML.h"
#include <iomanip>

using namespace std;

static ostream& operator<<(ostream& os, VMGroupRule::rule_set rules);

void VMGroupXML::init_attributes()
{
    vector<xmlNodePtr>       content;
    std::vector<std::string> srules;

    xpath(oid, "/VM_GROUP/ID", -1);
    xpath(name, "/VM_GROUP/NAME", "undefined");

    // VMGroup roles
    get_nodes("/VM_GROUP/ROLES", content);

    if (!content.empty())
    {
        roles.from_xml_node(content[0]);
    }

    free_nodes(content);

    xpaths(srules, "/VM_GROUP/TEMPLATE/AFFINED");

    for ( const auto& srule : srules )
    {
        std::set<int> id_set;

        roles.names_to_ids(srule, id_set);

        VMGroupRule rule(VMGroupPolicy::AFFINED, id_set);

        affined.insert(rule);
    }

    srules.clear();

    xpaths(srules, "/VM_GROUP/TEMPLATE/ANTI_AFFINED");

    for ( const auto& srule : srules )
    {
        std::set<int> id_set;

        roles.names_to_ids(srule, id_set);

        VMGroupRule rule(VMGroupPolicy::ANTI_AFFINED, id_set);

        anti_affined.insert(rule);
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VMGroupXML::set_antiaffinity_requirements(VirtualMachinePoolXML * vmpool,
                                               std::ostringstream& oss)
{
    oss << "\n";
    oss << setfill('-') << setw(80) << '-' << setfill(' ') << "\n";
    oss << "Intra-role Anti-affinity rules \n";
    oss << left << setw(8)<< "ROLE" << " " << left << setw(8) <<"VM"
        << " " << left << "ANTI_AFFINITY REQUIRMENTS\n"
        << setfill('-') << setw(80) << '-' << setfill(' ') << "\n";

    /* ---------------------------------------------------------------------- */
    /* Intra-role anti-affinity placement rule                                */
    /* ---------------------------------------------------------------------- */
    for ( auto r : roles )
    {
        if ( r->policy() != VMGroupPolicy::ANTI_AFFINED || r->size_vms() <= 1 )
        {
            continue;
        }

        const std::set<int>& vms = r->get_vms();

        for ( auto vm_id : vms )
        {
            std::string reqs;

            VirtualMachineXML * vm = vmpool->get(vm_id);

            if ( vm == 0 )
            {
                continue;
            }

            r->vm_role_requirements(vm_id, reqs);

            if ( !reqs.empty() )
            {
                vm->add_requirements(reqs);
            }

            oss << left << setw(8) << r->id() << left << setw(8) << vm_id << reqs
                << "\n";
        }
    }


    /* ---------------------------------------------------------------------- */
    /* Inter-role anti-affinity placement rule                                */
    /* ---------------------------------------------------------------------- */
    oss << "\n";
    oss << setfill('-') << setw(80) << '-' << setfill(' ') << "\n";
    oss << "Inter-role Anti-affinity rules \n";
    oss << left << setw(8)<< "ROLE" << " " << left << setw(8) <<"VM"
        << " " << left << "ANTI_AFFINITY REQUIRMENTS\n"
        << setfill('-') << setw(80) << '-' << setfill(' ') << "\n";

    for ( const auto& rt : anti_affined )
    {
        const VMGroupRule::role_bitset& rroles = rt.get_roles();

        for ( int i=0 ; i < VMGroupRoles::MAX_ROLES; ++i)
        {
            string role_reqs;

            if ( rroles[i] == 0 )
            {
                continue;
            }

            for ( int j = 0 ; j < VMGroupRoles::MAX_ROLES ; ++j )
            {
                if ( j == i || rroles[j] == 0 )
                {
                    continue;
                }

                VMGroupRole * r = roles.get(j);

                if ( r == 0 )
                {
                    continue;
                }

                std::string reqs;

                r->role_requirements(VMGroupPolicy::ANTI_AFFINED, reqs);

                if ( reqs.empty() )
                {
                    continue;
                }

                if ( role_reqs.empty() )
                {
                    role_reqs = reqs;
                }
                else
                {
                    role_reqs += " & " + reqs;
                }
            }

            VMGroupRole * r = roles.get(i);

            const std::set<int>& vms = r->get_vms();

            for ( auto vm_id : vms )
            {
                VirtualMachineXML * vm = vmpool->get(vm_id);

                if ( vm == 0 )
                {
                    continue;
                }

                vm->add_requirements(role_reqs);

                oss << left << setw(8) << r->id() << left << setw(8) << vm_id
                    << vm->get_requirements() << "\n";
            }
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VMGroupXML::set_host_requirements(VirtualMachinePoolXML * vmpool,
                                       std::ostringstream& oss)
{
    oss << "\n";
    oss << setfill('-') << setw(80) << '-' << setfill(' ') << "\n";
    oss << "Host affinity rules \n";
    oss << left << setw(8)<< "ROLE" << " " << left << setw(8) <<"VM"
        << " " << left << "AFFINITY REQUIRMENTS\n"
        << setfill('-') << setw(80) << '-' << setfill(' ') << "\n";

    for ( auto r : roles )
    {
        std::string areqs, aareqs;

        r->affined_host_requirements(areqs);

        r->antiaffined_host_requirements(aareqs);

        if ( r->size_vms() == 0 || (areqs.empty() && aareqs.empty()) )
        {
            continue;
        }

        const std::set<int>& vms = r->get_vms();

        for (auto vm_id : vms)
        {
            VirtualMachineXML * vm = vmpool->get(vm_id);

            if ( vm == 0 )
            {
                continue;
            }

            if ( !areqs.empty() )
            {
                vm->add_requirements(areqs);
            }

            if ( !aareqs.empty() )
            {
                vm->add_requirements(aareqs);
            }

            oss << left << setw(8) << r->id() << left << setw(8) << vm_id
                << vm->get_requirements() << "\n";
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static void schecule_affined_set(const std::set<int>& vms,
                                 VirtualMachinePoolXML * vmpool, VirtualMachineRolePoolXML * vm_roles_pool,
                                 std::ostringstream& oss)
{
    std::set<int>::iterator it;
    std::set<int> hosts;

    if ( vms.size() <= 1 )
    {
        return;
    }

    /* ---------------------------------------------------------------------- */
    /* Get hosts where the affined set is running                             */
    /* ---------------------------------------------------------------------- */
    for ( it = vms.begin() ; it != vms.end() ; ++it )
    {
        VirtualMachineXML * vm = vm_roles_pool->get(*it);

        if ( vm == 0 )
        {
            continue;
        }

        int hid = vm->get_hid();

        if ( vm->is_active() && hid != -1 )
        {
            hosts.insert(hid);
        }
    }

    if ( hosts.empty() )
    {
        /* ------------------------------------------------------------------ */
        /*  No VMs of the set are running:                                    */
        /*    1. Select a set leader                                          */
        /*    2. Allocate VMs in the same host as the leader                  */
        /*    3. Aggregate requirements in the leader for scheduling          */
        /* ------------------------------------------------------------------ */
        VirtualMachineXML * vm = nullptr;

        for ( it = vms.begin(); it != vms.end() ; ++it )
        {
            vm = vmpool->get(*it);

            if ( vm != 0 )
            {
                break;
            }
        }

        if ( vm == 0 )
        {
            return;
        }

        std::ostringstream areqs;
        std::string areqs_s;

        areqs << "CURRENT_VMS = " << *it;
        areqs_s = areqs.str();

        for ( ++it ; it != vms.end() ; ++it )
        {
            HostShareCapacity sr;

            VirtualMachineXML * tmp = vmpool->get(*it);

            if ( tmp == 0 )
            {
                continue;
            }

            tmp->reset_capacity(sr);

            vm->add_capacity(sr);
            vm->add_requirements(tmp->get_requirements());
            vm->add_affined(*it);

            tmp->add_requirements(areqs_s);

            oss << left << setw(8) << tmp->get_oid() << " "
                << tmp->get_requirements() << "\n";
        }

        oss << left << setw(8) << vm->get_oid() << " "
            << vm->get_requirements() << "\n";
    }
    else
    {
        /* ------------------------------------------------------------------ */
        /* VMs in the group already running                                   */
        /*   1. Assign VMs to one of the hosts used by the affined set        */
        /* ------------------------------------------------------------------ */
        std::ostringstream oss_reqs;
        std::string reqs;

        VMGroupRole::host_requirements(hosts, "=", "|", oss_reqs);

        reqs = oss_reqs.str();

        for ( it = vms.begin() ; it != vms.end() ; ++it )
        {
            VirtualMachineXML * vm = vmpool->get(*it);

            if ( vm == 0 || reqs.empty())
            {
                continue;
            }

            vm->add_requirements(reqs);

            oss << left << setw(8) << vm->get_oid() << " "
                << vm->get_requirements() << "\n";
        }
    }
}

/* -------------------------------------------------------------------------- */

void VMGroupXML::set_affinity_requirements(VirtualMachinePoolXML * vmpool,
                                           VirtualMachineRolePoolXML * vm_roles_pool, std::ostringstream& oss)
{
    /* ---------------------------------------------------------------------- */
    /* Intra-role affinity placement rule                                     */
    /* ---------------------------------------------------------------------- */
    oss << "\n";
    oss << setfill('-') << setw(80) << '-' << setfill(' ') << "\n";
    oss << "Intra-role affinity requirements\n";
    oss << left << setw(8) << "VMID" << " " << left << "REQUIREMENTS\n";
    oss << setfill('-') << setw(80) << '-' << setfill(' ') << "\n";

    for ( auto r : roles )
    {
        if ( r->policy() != VMGroupPolicy::AFFINED || r->size_vms() <= 1 )
        {
            continue;
        }

        const std::set<int>& vms = r->get_vms();

        schecule_affined_set(vms, vmpool, vm_roles_pool, oss);
    }

    /* ---------------------------------------------------------------------- */
    /* Inter-role affinity placement rule                                     */
    /*   1. Build the reduced set of affinity rules                           */
    /*   2. Build the set of VMs affected by each rule                        */
    /*   3. Schedule the resulting set                                        */
    /* ---------------------------------------------------------------------- */
    VMGroupRule::rule_set reduced;

    oss << "\n";
    oss << setfill('-') << setw(80) << '-' << setfill(' ') << "\n";
    oss << "Inter-role affinity requirements\n";
    oss << left << setw(8) << "VMID" << " " << left << "REQUIREMENTS\n";
    oss << setfill('-') << setw(80) << '-' << setfill(' ') << "\n";

    VMGroupRule::reduce(affined, reduced);

    for ( const auto& rit : reduced )
    {
        const VMGroupRule::role_bitset& rroles = rit.get_roles();
        std::set<int> rule_vms;

        for (int i = 0 ; i <VMGroupRoles::MAX_ROLES ; ++i)
        {
            if ( rroles[i] == 0 )
            {
                continue;
            }

            VMGroupRole * r = roles.get(i);

            if ( r == 0 )
            {
                continue;
            }

            const std::set<int>& role_vms = r->get_vms();

            rule_vms.insert(role_vms.begin(), role_vms.end());
        }

        schecule_affined_set(rule_vms, vmpool, vm_roles_pool, oss);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static ostream& operator<<(ostream& os, VMGroupRule::rule_set rules)
{
    for ( const auto& rit : rules )
    {
        const VMGroupRule::role_bitset& rroles = rit.get_roles();

        os << left << setw(14) << rit.get_policy() << " ";

        for (int i = 0 ; i <VMGroupRoles::MAX_ROLES ; ++i)
        {
            if ( rroles[i] == 1 )
            {
                os << right << setw(2) << i << " ";
            }
        }

        os << "\n";
    }

    return os;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

ostream& operator<<(ostream& os, VMGroupXML& vmg)
{
    os << left << setw(7)<< "ROLE ID" << " " << left << setw(8) << "NAME" << " "
       << setw(12) << "POLICY" << " " << left << "VMS\n"
       << setfill('-') << setw(80) << '-' << setfill(' ') << "\n";

    for ( auto role : vmg.roles )
    {
        os << left << setw(7) << role->id()       << " "
           << left << setw(8) << role->name()     << " "
           << left << setw(12)<< role->policy_s() << " "
           << left << role->vms_s() << "\n";
    }

    os << "\n";
    os << left << "RULES" << "\n"
       << setfill('-') << setw(80) << '-' << setfill(' ') << "\n";

    os << vmg.affined;

    os << vmg.anti_affined;

    return os;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

