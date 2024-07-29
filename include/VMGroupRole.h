/* ------------------------------------------------------------------------ */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems              */
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

#ifndef VMGROUP_ROLE_H_
#define VMGROUP_ROLE_H_

#include "Template.h"

class VMGroupPool;

enum class VMGroupPolicy;

/**
 *  A VMGroupRole defines a VM type that typically implements a role in a
 *  multi-vm application.
 *
 *  ROLE = [
 *    NAME = "Web application servers",
 *    ID   = 12,
 *    POLICY = AFFINED,
 *    VMS  = "1,2,45,21"
 *  ]
 *
 */
class VMGroupRole
{
public:
    VMGroupRole(VectorAttribute *_va);

    /**
     *  @return the role id
     */
    int id() const
    {
        int rid;

        va->vector_value("ID", rid);

        return rid;
    }

    /**
     *  @return the role name
     */
    std::string name() const
    {
        return va->vector_value("NAME");
    }

    /**
     *  Set role name
     */
    void name(const std::string& new_name)
    {
        va->replace("NAME", new_name);
    }

    /**
     *  @return the set of VMs in a string in a comma separated list
     */
    std::string vms_s() const
    {
        return va->vector_value("VMS");
    }

    /**
     *  @return the policy of this role
     */
    VMGroupPolicy policy();

    std::string policy_s() const
    {
        return va->vector_value("POLICY");
    };

    /**
     * Function to print the VMGroupRole into a string stream in XML format
     *   @param xml Output string stream
     */
    void to_xml(std::ostringstream &oss) const;

    void update(VectorAttribute* va_update);

    /* ---------------------------------------------------------------------- */
    /* VMS set Interface                                                      */
    /* ---------------------------------------------------------------------- */
    const std::set<int>& get_vms() const
    {
        return vms;
    };

    int size_vms() const
    {
        return vms.size();
    }

    void add_vm(int vm_id);

    void del_vm(int vm_id);

    /* ---------------------------------------------------------------------- */
    /* Placement constraints                                                  */
    /* ---------------------------------------------------------------------- */
    /**
     *  Generates a string with the boolean expression to conform the role
     *  internal policy
     *    @param vm_id of the VM to generate the requirements for
     *    @param requirements
     */
    void vm_role_requirements(int vm_id, std::string& requirements);

    /**
     *  Generates a string with the boolean expression to conform an affinity
     *  constraint policy
     *    @param p policy to place VMs respect to this role VMs
     *    @param requirements
     */
    void role_requirements(VMGroupPolicy p, std::string& requirements);

    /**
     *  Gets the placement requirements for the affined HOSTS
     *    @param reqs string with the requirements expression
     */
    void affined_host_requirements(std::string& reqs);

    /**
     *  Gets the placement requirements for the antiaffined HOSTS
     *    @param reqs string with the requirements expression
     */
    void antiaffined_host_requirements(std::string& reqs);

    /**
     *  Generate generic requirements for a set of hosts
     *    @param hosts the set
     *    @param op1 operator for each host requirement = or !=
     *    @param op2 operator to join host requirements & or |
     *    @param oss stream where the requirement expression is output
     */
    static void host_requirements(std::set<int>& hosts, const std::string& op1,
                                  const std::string& op2, std::ostringstream& oss);

private:
    /**
     *  The set of vms in the role
     */
    std::set<int> vms;

    /**
     *  The associated vector attribute
     */
    std::unique_ptr<VectorAttribute> va;

    /**
     *  Set the VMS attribute for the role (list of VM IDs)
     */
    void set_vms();
};

/**
 *  The VMGroupRoles class represents a set of ROLES stored in a Template
 */
class VMGroupRoles
{
public:
    VMGroupRoles() = default;

    // Disable copy constructor
    VMGroupRoles(const VMGroupRoles&) = delete;

    // Disable copy assignment
    VMGroupRoles& operator=(const VMGroupRoles&) = delete;

    ~VMGroupRoles()
    {
        delete_roles();
    }

    /**
     * Max number of roles in a VMGroup
     */
    const static int MAX_ROLES = 32;

    /**
     * Function to print the VMGroupRoles into a string in XML format
     *   @param xml the resulting XML string
     *   @return a reference to the generated string
     */
    std::string& to_xml(std::string& xml_str) const;

    /**
     *  Builds the object from an xml node
     *    @param node for the ROLES template
     *    @return 0 on success, -1 otherwise
     */
    int from_xml_node(const xmlNodePtr node);

    /**
     *  Adds a new role to the set
     *    @param vrole VectorAttribute of the role
     *    @param error string if any
     *
     *    @return 0 on success
     */
    int add_role(VectorAttribute * vrole, std::string& error);

    /**
     *  Delete role from the set
     *    @param id ID of the role
     */
    void del_role(int id);

    int rename_role(VMGroupRole* role, const std::string& new_name);

    /**
     *  Generates the ids corresponding to a set of role names
     *    @param rnames string with a comma separated list of role names
     *    @param keyi the set of ids
     *
     *    @return 0 if all the names were successfully translated
     */
    int names_to_ids(const std::string& rnames, std::set<int>&  keyi);

    /**
     *  Adds a VM to a role
     *    @param role_name
     *    @param vmid
     *
     *    @return 0 if VM was successfully added, -1 otherwise
     */
    int add_vm(const std::string& role_name, int vmid);

    /**
     *  Deletes a VM from a role
     *    @param role_name
     *    @param vmid
     *
     *    @return 0 if VM was successfully added, -1 otherwise
     */
    int del_vm(const std::string& role_name, int vmid);

    /**
     *  @return the total number of VMs in the group
     */
    int vm_size();

    /**
     * @return the a VMGroupRole by its name
     *   @param rname role name
     */
    VMGroupRole * get(const std::string& rname)
    {
        auto it = by_name.find(rname);

        if (it == by_name.end())
        {
            return nullptr;
        }

        return it->second;
    }

    /**
     * @return the a VMGroupRole by its id
     *   @param rname role name
     */
    VMGroupRole * get(int id)
    {
        auto it = by_id.find(id);

        if (it == by_id.end())
        {
            return nullptr;
        }

        return it->second;
    }

    /* ---------------------------------------------------------------------- */
    /* ---------------------------------------------------------------------- */
    /**
     *  Iterator for the roles in the group
     */
    class RoleIterator
    {
    public:
        RoleIterator& operator=(const RoleIterator& rhs)
        {
            role_it = rhs.role_it;
            return *this;
        }

        RoleIterator& operator++()
        {
            ++role_it;
            return *this;
        }

        bool operator!=(const RoleIterator& rhs)
        {
            return role_it != rhs.role_it;
        }

        VMGroupRole * operator*() const
        {
            return role_it->second;
        }

        RoleIterator() {};
        RoleIterator(const RoleIterator& rit):role_it(rit.role_it) {};
        RoleIterator(const std::map<int, VMGroupRole *>::iterator& _role_it)
            :role_it(_role_it) {};

        virtual ~RoleIterator() {};

    private:
        std::map<int, VMGroupRole *>::iterator role_it;
    };

    RoleIterator begin()
    {
        RoleIterator it(by_id.begin());
        return it;
    }

    RoleIterator end()
    {
        RoleIterator it(by_id.end());
        return it;
    }

    typedef class RoleIterator role_iterator;

private:
    /**
     *  The next role id
     */
    int next_role = 0;

    /**
     *  Map to access the roles by their name
     */
    std::map<std::string, VMGroupRole *> by_name;

    /**
     *  Map to access the roles by their id
     */
    std::map<int, VMGroupRole *> by_id;

    /**
     *  Frees the memory associated with the roles
     */
    void delete_roles()
    {
        for (auto it : by_id)
        {
            delete it.second;
        }

        by_id.clear();
        by_name.clear();
    }
};

#endif /*VMGROUP_ROLE_H*/

