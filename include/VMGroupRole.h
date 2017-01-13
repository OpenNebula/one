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

#ifndef VMGROUP_ROLE_H_
#define VMGROUP_ROLE_H_

#include "PoolObjectSQL.h"
#include "NebulaUtil.h"

class VMGroupPool;

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

    /**
     *  Scheduling policy for the VMs within this role
     */
    enum Policy
    {
        NONE        = 0x00,
        AFFINED     = 0x01,
        ANTI_AFFINED= 0x02
    };

    /* ---------------------------------------------------------------------- */

    VMGroupRole(VectorAttribute *_va);

    virtual ~VMGroupRole(){};

    /**
     *  @return the role id
     */
    int id()
    {
        int rid;

        va->vector_value("ID", rid);

        return rid;
    }

    /**
     *  @return the role name
     */
    std::string name()
    {
        return va->vector_value("NAME");
    }

    Policy policy()
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

    /* ---------------------------------------------------------------------- */
    /* VMS set Interface                                                      */
    /* ---------------------------------------------------------------------- */
    const std::set<int>& get_vms()
    {
        return vms;
    };

    void add_vm(int vm_id);

    void del_vm(int vm_id);

    /* ---------------------------------------------------------------------- */
    /* Placement constraints                                                  */
    /* ---------------------------------------------------------------------- */
    /**
     *  Generates a string with the boolean expresion to conform the role
     *  policy
     *    @param vm_id of the VM to generate the requirements for
     *    @param requirements
     */
    void vm_requirements(int vm_id, std::string requirements);

private:
    /**
     *  The set of vms in the role
     */
    std::set<int> vms;

    /**
     *  The associated vector attribute
     */
    VectorAttribute * va;

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
    VMGroupRoles():roles_template(false,'=',"ROLES"), next_role(0){};

    ~VMGroupRoles()
    {
        by_id.delete_roles();
    };

    /**
     * Function to print the VMGroupRoles into a string in XML format
     *   @param xml the resulting XML string
     *   @return a reference to the generated string
     */
    std::string& to_xml(std::string& xml_str) const
    {
        return roles_template.to_xml(xml_str);
    }

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
    int add_role(VectorAttribute * vrole, string& error);

    /**
     *  Generates the ids corresponding to a set of role names
     *    @param keys the set of names
     *    @param keyi the set of ids
     *    @return 0 if all the names were successfully translated
     */
    int names_to_ids(const std::set<std::string> keys, std::set<int>&  keyi);

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
        return by_name.get(rname);
    }

    /**
     * @return the a VMGroupRole by its id
     *   @param rname role name
     */
    VMGroupRole * get(int id)
    {
        return by_id.get(id);
    }

    /**
     * Max number of roles in a VMGroup
     */
    const static int MAX_ROLES = 32;

private:
    /**
     *  A role map indexed by different key types
     */
    template<class T>
    class RoleMap
    {
    public:
        /**
         *  Inserts a new role in the map
         *    @param k the key
         *    @param r pointer to yhe VMGroupRole
         *    @return true if the role was successfully inserted
         */
        bool insert(const T& k, VMGroupRole * r)
        {
            std::pair<T, VMGroupRole *> rpair(k, r);
            std::pair<roles_it, bool> rc;

            rc = roles.insert(rpair);

            return rc.second;
        }

        /**
         *  Frees the memory associated to the map and clears it
         */
        void delete_roles()
        {
            for (roles_it it = roles.begin() ; it != roles.end() ; ++it )
            {
                delete it->second;
            }

            clear();
        }

        VMGroupRole * get(T k)
        {
            typename std::map<T, VMGroupRole *>::iterator it;

            it = roles.find(k);

            if ( it == roles.end() )
            {
                return 0;
            }

            return it->second;
        }

        /**
         *  Clears the contents of the map
         */
        void clear()
        {
            roles.clear();
        }

        size_t erase(const T& k)
        {
            return roles.erase(k);
        }

        /**
         *  Iterators for the map
         */
        typedef typename std::map<T, VMGroupRole *>::iterator roles_it;

        roles_it begin()
        {
            return roles.begin();
        }

        roles_it end()
        {
            return roles.end();
        }

    private:
        std::map<T, VMGroupRole *> roles;
    };

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

        RoleIterator(){};
        RoleIterator(const RoleIterator& rit):role_it(rit.role_it){};
        RoleIterator(const std::map<int, VMGroupRole *>::iterator& _role_it)
            :role_it(_role_it){};

        virtual ~RoleIterator(){};

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

    /**
     *  The role template to store the VMGroupRole
     */
	Template roles_template;

    /**
     *  The next role id
     */
    int next_role;

    /**
     *  Map to access the roles by their name
     */
    RoleMap<std::string> by_name;

    /**
     *  Map to access the roles by their id
     */
    RoleMap<int> by_id;
};

#endif /*VMGROUP_ROLE_H*/

