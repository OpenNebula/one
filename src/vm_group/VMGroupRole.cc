/* ------------------------------------------------------------------------ */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems              */
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

#include <iomanip>

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

VMGroupRole::Policy VMGroupRole::policy()
{
    string p = va->vector_value("POLICY");

    if ( p == "AFFINED" )
    {
        return AFFINED;
    }
    else if ( p == "ANTI_AFFINED" )
    {
        return ANTI_AFFINED;
    }
    else
    {
        return NONE;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VMGroupRole::add_vm(int vm_id)
{
    std::pair<std::set<int>::iterator, bool> rc;

    rc = vms.insert(vm_id);

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
        VMGroupRole::Policy policy, const std::set<int>& vms)
{
    string op;

    requirements = "";

    switch(policy)
    {
        case VMGroupRole::AFFINED:
            op = "=";
            break;
        case VMGroupRole::ANTI_AFFINED:
            op = "!=";
            break;
        case VMGroupRole::NONE:
            return;
    }

    std::ostringstream oss;
    std::set<int>::const_iterator it;

    for ( it = vms.begin(); it != vms.end(); ++it )
    {
        if ( vm_id == -1 || vm_id != *it )
        {
            if ( it != vms.begin() )
            {
                oss << " & ";
            }

            oss << "( CURRENT_VMS " << op << " " << *it << ") ";
        }
    }

    requirements = oss.str();
}

void VMGroupRole::vm_role_requirements(int vm_id, std::string& requirements)
{
    affinity_requirements(vm_id, requirements, policy(), vms);
}

void VMGroupRole::role_requirements(Policy policy, std::string& requirements)
{
    affinity_requirements(-1, requirements, policy, vms);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*  VMGroupRoles                                                              */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VMGroupRoles::from_xml_node(const xmlNodePtr node)
{
    std::vector<VectorAttribute *> roles;
    std::vector<VectorAttribute *>::iterator it;

    if ( roles_template.from_xml_node(node) == -1 )
    {
        return -1;
    }

    roles_template.get("ROLE", roles);

    for (it = roles.begin(); it != roles.end(); ++it)
    {
        std::string rname = (*it)->vector_value("NAME");

        int rid;
        int rc = (*it)->vector_value("ID", rid);

        if ( rname.empty() || rc == -1 )
        {
            return -1;
        }

        if ( rid >= next_role )
        {
            next_role = rid + 1;
        }

        VMGroupRole * role = new VMGroupRole((*it));

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

    for ( role_iterator it = begin(); it != end() ; ++it )
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
    std::set<std::string>::iterator it;

    one_util::split_unique(rnames, ',', a_set);

    for ( it = a_set.begin(); it != a_set.end() ; ++it )
    {
        key_set.insert(one_util::trim(*it));
    }

    for ( it = key_set.begin(); it != key_set.end(); ++it )
    {
        VMGroupRole *r = by_name.get(*it);

        if ( r == 0 )
        {
            keyi.clear();
            return -1;
        }

        keyi.insert(r->id());
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

ostream& operator<<(ostream& os, VMGroupRoles& roles)
{
    VMGroupRoles::role_iterator it;

    for ( it = roles.begin() ; it != roles.end() ; ++it )
    {
        os << right << setw(3)  << (*it)->id()       << " "
           << right << setw(12) << (*it)->name()     << " "
           << right << setw(12) << (*it)->policy_s() << "\n";
    }

    return os;
}

