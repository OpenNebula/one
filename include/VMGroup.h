/* ------------------------------------------------------------------------ */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems              */
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
    /**
     * Function to print the VMGroup object into a string in XML format
     *   @param xml the resulting XML string
     *   @return a reference to the generated string
     */
    string& to_xml(string& xml) const override;

    /**
     *  Rebuilds the object from an xml formatted string
     *    @param xml_str The xml-formatted string
     *    @return 0 on success, -1 otherwise
     */
    int from_xml(const string &xml_str) override;

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
        return roles.add_vm(role_name, vmid);
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
        return roles.del_vm(role_name, vmid);
    }

private:
    // -------------------------------------------------------------------------
    // Friends
    // -------------------------------------------------------------------------
    friend class VMGroupPool;

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------
    VMGroup(int _uid, int _gid, const string& _uname, const string& _gname,
            int _umask, Template * group_template);

    virtual ~VMGroup() = default;

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
    static const char * db_names;

    static const char * db_bootstrap;

    static const char * table;

    /**
     *  Execute an INSERT or REPLACE Sql query.
     *    @param db The SQL DB
     *    @param replace Execute an INSERT or a REPLACE
     *    @param error_str Returns the error reason, if any
     *    @return 0 one success
     */
    int insert_replace(SqlDB *db, bool replace, string& error_str);

    /**
     *  Bootstraps the database table(s) associated to the VMGroup
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * db)
    {
        ostringstream oss(VMGroup::db_bootstrap);

        return db->exec_local_wr(oss);
    };

    /**
     *  Writes the VMGroup in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqlDB *db, string& error_str) override;

    /**
     *  Writes/updates the VMGroup's data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB *db) override
    {
        string error_str;
        return insert_replace(db, true, error_str);
    }

    /**
     * Checks the new roles and affined/anti-affined cross-references
     *    @param error string describing the error if any
     *    @return 0 on success
     */
    int post_update_template(string& error) override;

    /**
     *  Factory method for VMGroup templates
     */
    Template * get_new_template() const override
    {
        return new Template;
    }

    // -------------------------------------------------------------------------
    // VMGroup attributes
    // -------------------------------------------------------------------------
	/**
	 *  The role set
	 */
	VMGroupRoles roles;
};

#endif /*VMGROUP_H_*/

