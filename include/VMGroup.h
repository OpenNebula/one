/* ------------------------------------------------------------------------ */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems              */
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

#ifndef VMGROUP_H_
#define VMGROUP_H_

#include "PoolObjectSQL.h"
#include "VMGroupRole.h"
#include "VMGroupRule.h"

class VMGroupPool;

enum class VMGroupPolicy;

/**
 *  A VM group is a set of related VMs that may impose placement constraints.
 *
 *  Data model:
 *
 *  NAME        = "Web server"
 *  DESCRIPTION = "A multi-tier web server: frontend, apps servers, db"
 *
 *  ROLE = [
 *    NAME = "frontend",
 *    ID   = 0,
 *    VMS  = "0,1"
 *  ]
 *
 *  ROLE = [
 *    NAME   = "db",
 *    ID     = 1,
 *    POLICY = ANTI_AFFINED,
 *    VMS    = "2,3,4,5"
 *  ]
 *
 *  ANTI_AFFINED = "db, front_end"
 */
class VMGroup : public PoolObjectSQL
{
public:
    virtual ~VMGroup() = default;

    /**
     * Function to print the VMGroup object into a string in XML format
     *   @param xml the resulting XML string
     *   @return a reference to the generated string
     */
    std::string& to_xml(std::string& xml) const override;

    /**
     *  Rebuilds the object from an xml formatted string
     *    @param xml_str The xml-formatted string
     *    @return 0 on success, -1 otherwise
     */
    int from_xml(const std::string &xml_str) override;

    /**
     *  Returns a copy of the Template
     *    @return A copy of the Template
     */
    Template * clone_template() const
    {
        return new Template(*obj_template);
    };

    // -------------------------------------------------------------------------
    // Role Management
    // -------------------------------------------------------------------------
    /**
     *  Adds a VM to a role
     *    @param role_name
     *    @param vmid
     *
     *    @return 0 if VM was successfully added, -1 otherwise
     */
    int add_vm(const std::string& role_name, int vmid)
    {
        return _roles.add_vm(role_name, vmid);
    }

    /**
     *  Deletes a VM from a role
     *    @param role_name
     *    @param vmid
     *
     *    @return 0 if VM was successfully added, -1 otherwise
     */
    int del_vm(const std::string& role_name, int vmid)
    {
        return _roles.del_vm(role_name, vmid);
    }

    VMGroupRoles& roles()
    {
        return _roles;
    }

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
     *    @param error string if any
     *
     *    @return 0 on success
     */
    int del_role(int id, std::string& error);

    /**
     *  Update existing role
     *    @param id ID of the role to update
     *    @param vrole VectorAttribute of the role
     *    @param error string if any
     *
     *    @return 0 on success
     */
    int update_role(int id, VectorAttribute * vrole, std::string& error);

    int check_consistency(std::string& error_str);

private:
    // -------------------------------------------------------------------------
    // Friends
    // -------------------------------------------------------------------------
    friend class VMGroupPool;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    VMGroup(int _uid, int _gid,
            const std::string& _uname, const std::string& _gname,
            int _umask, std::unique_ptr<Template> group_template);

    // -------------------------------------------------------------------------
    // Role Management
    // -------------------------------------------------------------------------
    /**
     *  Check if all the roles in a AFFINED/ANTI_AFFINED rules are defined in
     *  the group
     *    @param policy attribute with a list (comma-separated) of role names
     *    @param error_str if any
     *
     *    @return 0 if all roles are defined -1 otherwise
     */
    int check_rule_names(VMGroupPolicy policy, std::string& error_str);

    /**
     *  Generate a rule_set from the AFFINED/ANTI_AFFINED rules
     *    @param p policy AFFINED or ANTIAFFINED
     *    @param rs rule_set with the rules
     *    @param error if some of the roles are not defined
     *
     *    @return 0 if success -1 otherwise
     */
    int get_rules(VMGroupPolicy p, VMGroupRule::rule_set& rs, std::string& err);

    int check_rule_consistency(std::string& error);

    // -------------------------------------------------------------------------
    // DataBase implementation
    // -------------------------------------------------------------------------

    /**
     *  Execute an INSERT or REPLACE Sql query.
     *    @param db The SQL DB
     *    @param replace Execute an INSERT or a REPLACE
     *    @param error_str Returns the error reason, if any
     *    @return 0 one success
     */
    int insert_replace(SqlDB *db, bool replace, std::string& error_str);

    /**
     *  Bootstraps the database table(s) associated to the VMGroup
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * db);

    /**
     *  Writes the VMGroup in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqlDB *db, std::string& error_str) override;

    /**
     *  Writes/updates the VMGroup's data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB *db) override
    {
        std::string error_str;
        return insert_replace(db, true, error_str);
    }

    /**
     * Checks the new roles and affined/anti-affined cross-references
     *    @param error string describing the error if any
     *    @return 0 on success
     */
    int post_update_template(std::string& error) override;

    /**
     *  Factory method for VMGroup templates
     */
    std::unique_ptr<Template> get_new_template() const override
    {
        return std::make_unique<Template>();
    }

    // -------------------------------------------------------------------------
    // VMGroup attributes
    // -------------------------------------------------------------------------
	/**
	 *  The role set
	 */
	VMGroupRoles _roles;
};

#endif /*VMGROUP_H_*/

