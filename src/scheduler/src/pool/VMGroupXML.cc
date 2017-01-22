/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project Leads (OpenNebula.org)             */
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

void VMGroupXML::init_attributes()
{
    vector<xmlNodePtr>       content;
    std::vector<std::string> srules;

    std::vector<std::string>::iterator it;

    xpath(oid, "/VM_GROUP/ID", -1);
    xpath(name,"/VM_GROUP/NAME", "undefined");

    // VMGroup roles
    get_nodes("/VM_GROUP/ROLES", content);

    if (!content.empty())
    {
        roles.from_xml_node(content[0]);
    }

    free_nodes(content);

    content.clear();

    xpaths(srules, "/VM_GROUP/TEMPLATE/AFFINED");

    for ( it = srules.begin() ; it != srules.end(); ++it )
    {
        std::set<int> id_set;

        roles.names_to_ids(*it, id_set);

        VMGroupRule rule(VMGroupPolicy::AFFINED, id_set);

        rules.insert(rule);
    }

    srules.clear();

    xpaths(srules, "/VM_GROUP/TEMPLATE/ANTI_AFFINED");

    for ( it = srules.begin() ; it != srules.end(); ++it )
    {
        std::set<int> id_set;

        roles.names_to_ids(*it, id_set);

        VMGroupRule rule(VMGroupPolicy::ANTI_AFFINED, id_set);

        rules.insert(rule);
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VMGroupXML::set_antiaffinity_requirements(VirtualMachinePoolXML * vmpool)
{
    VMGroupRoles::role_iterator it;
    std::ostringstream oss;

    oss << "Anti-affinity rules for VMGroup " << get_name() << "\n";
    oss << left << setw(8)<< "ROLE" << " " << left << setw(8) <<"VM"
        << " " << left << "ANTI_AFFINITY REQUIRMENTS\n"
        << setfill('-') << setw(80) << '-' << setfill(' ') << "\n";

    /* ---------------------------------------------------------------------- */
    /* Intra-role anti-affinity placement rule                                */
    /* ---------------------------------------------------------------------- */
    for ( it = roles.begin(); it != roles.end() ; ++it )
    {
        VMGroupRole * r = *it;

        if ( r->policy() != VMGroupPolicy::ANTI_AFFINED || r->size_vms() <= 1 )
        {
            continue;
        }

        const std::set<int> vms = r->get_vms();
        std::set<int>::const_iterator jt;

        for ( jt = vms.begin() ; jt != vms.end(); ++jt )
        {
            std::string reqs;

            VirtualMachineXML * vm = vmpool->get(*jt);

            if ( vm == 0 )
            {
                continue;
            }

            r->vm_role_requirements(*jt, reqs);

            if ( !reqs.empty() )
            {
                vm->add_requirements(reqs);
            }

            oss << left << setw(8) << r->id() << left << setw(8) << *jt << reqs
                << "\n";
        }
    }

    oss << setfill('-') << setw(80) << '-' << setfill(' ') << "\n";

    /* ---------------------------------------------------------------------- */
    /* Inter-role anti-affinity placement rule                                */
    /* ---------------------------------------------------------------------- */
    VMGroupRule::rule_set::iterator rt;

    for ( rt = rules.begin() ; rt != rules.end() ; ++rt )
    {
        if ( (*rt).get_policy() != VMGroupPolicy::ANTI_AFFINED )
        {
            continue;
        }

        VMGroupRule::role_bitset rroles = (*rt).get_roles();

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

            const std::set<int> vms = r->get_vms();
            std::set<int>::const_iterator vt;

            for ( vt=vms.begin() ; vt!=vms.end(); ++vt )
            {
                VirtualMachineXML * vm = vmpool->get(*vt);

                if ( vm == 0 )
                {
                    continue;
                }

                vm->add_requirements(role_reqs);

                oss << left << setw(8) << r->id() << left << setw(8) << *vt
                    << vm->get_requirements() << "\n";
            }
        }
    }

    NebulaLog::log("VMGRP", Log::DEBUG, oss);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static void host_requirements(std::set<int>& hosts, const std::string& op1,
        const std::string& op2, std::ostringstream& oss)
{
    std::set<int>::const_iterator jt;
    bool empty = true;

    for ( jt = hosts.begin() ; jt != hosts.end() ; ++jt )
    {
        if ( empty == true )
        {
            empty = false;

            oss << "(ID" << op1 << *jt << ")";
        }
        else
        {
            oss << " " << op2 << " (ID" << op1 << *jt << ")";
        }
    }
}

void VMGroupXML::set_host_requirements(VirtualMachinePoolXML * vmpool)
{
    VMGroupRoles::role_iterator it;

    std::ostringstream doss;

    doss << "Host affinity rules for VMGroup " << get_name() << "\n";
    doss << left << setw(8)<< "ROLE" << " " << left << setw(8) <<"VM"
         << " " << left << "AFFINITY REQUIRMENTS\n"
         << setfill('-') << setw(80) << '-' << setfill(' ') << "\n";

    for ( it = roles.begin(); it != roles.end() ; ++it )
    {
        std::ostringstream oss;

        std::set<int> ahosts;
        std::set<int> aahosts;

        std::set<int>::const_iterator jt;

        VMGroupRole * r = *it;

        r->get_affined_hosts(ahosts);

        r->get_antiaffined_hosts(aahosts);

        if ( r->size_vms() == 0 || (ahosts.size() == 0 && aahosts.size() == 0) )
        {
            continue;
        }

        host_requirements(ahosts, "=", "|", oss);

        std::string areqs = oss.str();

        oss.str("");

        host_requirements(aahosts, "!=", "&", oss);

        std::string aareqs = oss.str();


        const std::set<int> vms = r->get_vms();

        for ( jt = vms.begin() ; jt != vms.end(); ++jt )
        {
            VirtualMachineXML * vm = vmpool->get(*jt);

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

            doss << left << setw(8) << r->id() << left << setw(8) << *jt
                 << vm->get_requirements() << "\n";
        }
    }

    NebulaLog::log("VMGRP", Log::DEBUG, doss);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

ostream& operator<<(ostream& os, VMGroupXML& vmg)
{
    VMGroupRule::rule_set::iterator rit;
    VMGroupRoles::role_iterator it;

    os << left << setw(4) << vmg.oid << " "
       << left << setw(8) << vmg.name<< " "
       << left << setw(26)<< "ROLES" << "\n"
       << setfill(' ') << setw(14) << " " << setfill('-') << setw(26) << '-'
       << setfill(' ') << "\n";

    for ( it = vmg.roles.begin() ; it != vmg.roles.end() ; ++it )
    {
        os << setfill(' ') << setw(14) << ' '
           << left << setw(3) << (*it)->id()       << " "
           << left << setw(8) << (*it)->name()     << " "
           << left << setw(12)<< (*it)->policy_s() << "\n";
    }

    os << setfill(' ') << setw(14) << ' ' << left << "RULES" << "\n"
       << setfill(' ') << setw(14) << ' ' << setfill('-') << setw(26) << '-'
       << setfill(' ') << "\n";

    for ( rit = vmg.rules.begin() ; rit != vmg.rules.end(); ++rit )
    {
        const VMGroupRule::role_bitset rroles = (*rit).get_roles();

        os << setfill(' ') << setw(14) << ' ' << left << setw(14)
           << (*rit).get_policy() << " ";

        for (int i = 0 ; i <VMGroupRoles::MAX_ROLES ; ++i)
        {
            if ( rroles[i] == 1 )
            {
                os << right << setw(3) << i << " ";
            }
        }

        os << "\n";
    }

    return os;
}
