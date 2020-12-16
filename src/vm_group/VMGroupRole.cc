/* ------------------------------------------------------------------------ */
/* Copyright 2002-2020, OpenNebula Project, OpenNebula Systems              */
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
/* -------------------------------------------------------------------------*/

#include "VMGroupRole.h"
#include "VMGroupRule.h"

#include <iomanip>

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*  VMGroupRole                                                               */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VMGroupRole::VMGroupRole(VectorAttribute *_va):va(_va)
{
    string vms_str = va->vector_value("VMS");

    if ( !vms_str.empty() )
    {
        one_util::split_unique(vms_str, ',', vms);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VMGroupPolicy VMGroupRole::policy()
{
    string p = va->vector_value("POLICY");

    one_util::toupper(p);

    if ( p == "AFFINED" )
    {
        return VMGroupPolicy::AFFINED;
    }
    else if ( p == "ANTI_AFFINED" )
    {
        return VMGroupPolicy::ANTI_AFFINED;
    }
    else
    {
        return VMGroupPolicy::NONE;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VMGroupRole::add_vm(int vm_id)
{
    auto rc = vms.insert(vm_id);

    if ( rc.second == false )
    {
        return;
    }

    set_vms();
}

void VMGroupRole::del_vm(int vm_id)
{
    size_t rc = vms.erase(vm_id);

    if ( rc == 0 )
    {
        return;
    }

    set_vms();
}

void VMGroupRole::set_vms()
{
    if ( vms.empty() )
    {
        va->remove("VMS");
        return;
    }

    std::string vms_str = one_util::join(vms.begin(), vms.end(), ',');

    va->replace("VMS", vms_str);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static void affinity_requirements(int vm_id, std::string& requirements,
        VMGroupPolicy policy, const std::set<int>& vms)
{
    string op, op2;

    requirements = "";

    switch(policy)
    {
        case VMGroupPolicy::AFFINED:
            op = "=";
            op2= " | ";
            break;
        case VMGroupPolicy::ANTI_AFFINED:
            op = "!=";
            op2= " & ";
            break;
        case VMGroupPolicy::NONE:
            return;
    }

    std::ostringstream oss;

    bool first = true;

    for ( auto id : vms )
    {
        if ( vm_id == -1 || vm_id != id )
        {
            if ( !first )
            {
                oss << op2;
            }

            first = false;

            oss << "(CURRENT_VMS " << op << " " << id << ")";
        }
    }

    requirements = oss.str();
}

void VMGroupRole::vm_role_requirements(int vm_id, std::string& requirements)
{
    affinity_requirements(vm_id, requirements, policy(), vms);
}

void VMGroupRole::role_requirements(VMGroupPolicy pol, std::string& reqs)
{
    affinity_requirements(-1, reqs, pol, vms);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VMGroupRole::host_requirements(std::set<int>& hosts, const std::string& op1,
        const std::string& op2, std::ostringstream& oss)
{
    bool empty = true;

    for ( auto hid : hosts )
    {
        if ( empty == true )
        {
            empty = false;

            oss << "(ID" << op1 << hid << ")";
        }
        else
        {
            oss << " " << op2 << " (ID" << op1 << hid << ")";
        }
    }
}

/* -------------------------------------------------------------------------- */

void VMGroupRole::affined_host_requirements(std::string& reqs)
{
    std::ostringstream oss;
    std::set<int> hosts;

    string shosts = va->vector_value("HOST_AFFINED");

    if ( !shosts.empty() )
    {
        one_util::split_unique(shosts, ',', hosts);
    }

    host_requirements(hosts, "=", "|", oss);

    reqs = oss.str();
}

/* -------------------------------------------------------------------------- */

void VMGroupRole::antiaffined_host_requirements(std::string& reqs)
{
    std::ostringstream oss;
    std::set<int> hosts;

    string shosts = va->vector_value("HOST_ANTI_AFFINED");

    if ( !shosts.empty() )
    {
        one_util::split_unique(shosts, ',', hosts);
    }

    host_requirements(hosts, "!=", "&", oss);

    reqs = oss.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*  VMGroupRoles                                                              */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VMGroupRoles::from_xml_node(const xmlNodePtr node)
{
    std::vector<VectorAttribute *> roles;

    if ( roles_template.from_xml_node(node) == -1 )
    {
        return -1;
    }

    roles_template.get("ROLE", roles);

    for (auto vattr : roles)
    {
        std::string rname = vattr->vector_value("NAME");

        int rid;
        int rc = vattr->vector_value("ID", rid);

        if ( rname.empty() || rc == -1 )
        {
            return -1;
        }

        if ( rid >= next_role )
        {
            next_role = rid + 1;
        }

        VMGroupRole * role = new VMGroupRole(vattr);

        if ( by_id.insert(rid, role) == false )
        {
            delete role;
            return -1;
        }

        if ( by_name.insert(rname, role) == false )
        {
            by_id.erase(rid);

            delete role;
            return -1;
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VMGroupRoles::add_role(VectorAttribute * vrole, string& error)
{
    std::string rname = vrole->vector_value("NAME");

    if ( rname.empty() )
    {
        error = "Missing NAME in VM group role";
        return -1;
    }

    // Remove internal attributes before inserting
    vrole->replace("ID", next_role);

    vrole->remove("VMS");

    VMGroupRole * role = new VMGroupRole(vrole);

    if ( by_id.insert(next_role, role) == false )
    {
        delete role;

        error = "Role ID already exists";
        return -1;
    }

    if ( by_name.insert(rname, role) == false )
    {
        by_id.erase(next_role);

        delete role;

        error = "Role NAME already exists";
        return -1;
    }

    next_role += 1;

    roles_template.set(vrole);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VMGroupRoles::add_vm(const std::string& role_name, int vmid)
{
    VMGroupRole * role;

    role = by_name.get(role_name);

    if ( role == 0 )
    {
        return -1;
    }

    role->add_vm(vmid);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VMGroupRoles::del_vm(const std::string& role_name, int vmid)
{
    VMGroupRole * role;

    role = by_name.get(role_name);

    if ( role == 0 )
    {
        return -1;
    }

    role->del_vm(vmid);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VMGroupRoles::vm_size()
{
    int total = 0;

    for ( auto it = begin(); it != end() ; ++it )
    {
        total += (*it)->get_vms().size();
    }

    return total;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VMGroupRoles::names_to_ids(const std::string& rnames, std::set<int>&  keyi)
{
    std::set<std::string> a_set, key_set;

    one_util::split_unique(rnames, ',', a_set);

    for ( const auto& name : a_set )
    {
        key_set.insert(one_util::trim(name));
    }

    for ( const auto& name : key_set )
    {
        VMGroupRole *r = by_name.get(name);

        if ( r == 0 )
        {
            keyi.clear();
            return -1;
        }

        keyi.insert(r->id());
    }

    return 0;
}

