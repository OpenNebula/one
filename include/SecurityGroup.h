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

#ifndef SECURITYGROUP_H_
#define SECURITYGROUP_H_

#include "PoolObjectSQL.h"
#include "ObjectCollection.h"

/**
 *  The SecurityGroup class.
 */
class SecurityGroup : public PoolObjectSQL
{
public:

    virtual ~SecurityGroup() = default;

    /**
     * Function to print the SecurityGroup object into a string in XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    std::string& to_xml(std::string& xml) const override;

    /**
     *  Rebuilds the object from an xml formatted string
     *    @param xml_str The xml-formatted string
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml(const std::string &xml_str) override;

    /**
     *  Returns a copy of the Template
     *    @return A copy of the Template
     */
    std::unique_ptr<Template> clone_template() const
    {
        return std::make_unique<Template>(*obj_template);
    }

    /* ---------------------------------------------------------------------- */
    /*   Access VM Counter                                                    */
    /* ---------------------------------------------------------------------- */

    /**
     *  Adds a VM ID to the security group (up-to-date set)
     *    @param vm_id The new id
     *
     *    @return 0 on success, -1 if the ID was already in the set
     */
    int add_vm(int vm_id)
    {
        return updated.add(vm_id);
    }

    /**
     *  Deletes a VM ID from the security Group (any of the sets)
     *    @param vm_id The id
     */
    void del_vm(int vm_id)
    {
        if ( updated.del(vm_id) == 0 )
        {
            return;
        }

        if ( updating.del(vm_id) == 0 )
        {
            return;
        }

        if ( error.del(vm_id) == 0 )
        {
            return;
        }

        outdated.del(vm_id);
    }

    /**
     *  Returns how many VMs are using the security group.
     *    @return how many IDs are there in the set.
     */
    int get_vms() const
    {
        return updated.size() + updating.size() + error.size() + outdated.size();
    }

    /**
     * Returns a group of Vector Attributes, in the form
     *  SECURITY_GROUP_RULE = [ SECURITY_GROUP_ID = oid, ... ]
     *
     * New objects are allocated, and must be deleted by the calling method
     *
     * @return a group of vector attributes
     */
    void get_rules(std::vector<VectorAttribute*>& result) const;

    /**
     * Commit SG changes to associated VMs
     *   @param recover, if true It will propagate the changes to VMs in error
     *   and those being updated. Otherwise all VMs associated with the SG will
     *   be updated
     */
    void commit(bool recover)
    {
        if (!recover)
        {
            outdated << updated;
            updated.clear();
        }

        outdated << updating << error;

        updating.clear();
        error.clear();
    };

    /**
     *  Functions to manipulate the vm collection id's
     */
    int get_outdated(int& id)
    {
        return outdated.pop(id);
    }

    bool is_outdated(int id)
    {
        return outdated.contains(id);
    }

    int add_outdated(int id)
    {
        return outdated.add(id);
    }

    int add_updating(int id)
    {
        return updating.add(id);
    }

    bool is_updating(int id)
    {
        return updating.contains(id);
    }

    int del_updating(int id)
    {
        return updating.del(id);
    }

    int add_error(int id)
    {
        return error.add(id);
    }

private:

    // -------------------------------------------------------------------------
    // Friends
    // -------------------------------------------------------------------------

    friend class SecurityGroupPool;

    // *************************************************************************
    // Constructor
    // *************************************************************************

    SecurityGroup(  int                _uid,
                    int                _gid,
                    const std::string& _uname,
                    const std::string& _gname,
                    int                _umask,
                    std::unique_ptr<Template> sgroup_template);

    /**
     *  Check that a rule is valid
     *    @param rule as a VectorAttribute
     *    @param error describing the problem if any
     *    @return true if the rule is valid
     */
    bool is_valid(const VectorAttribute * rule, std::string& error) const;

    /**
     *  Remove duplicit rules. The duplicits are removed from obj_template
     *  not from passed parameter
     *    @param rules as vector of VectorAttributes
     */
    void remove_duplicates(std::vector<VectorAttribute*>& rules);

    /**
     * Checks the new rules
     *    @param error string describing the error if any
     *    @return 0 on success
     */
    int post_update_template(std::string& error) override;

    // *************************************************************************
    // DataBase implementation (Private)
    // *************************************************************************

    /**
     *  Execute an INSERT or REPLACE Sql query.
     *    @param db The SQL DB
     *    @param replace Execute an INSERT or a REPLACE
     *    @param error_str Returns the error reason, if any
     *    @return 0 one success
     */
    int insert_replace(SqlDB *db, bool replace, std::string& error_str);

    /**
     *  Bootstraps the database table(s) associated to the SecurityGroup
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * db);

    /**
     *  Writes the SecurityGroup in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqlDB *db, std::string& error_str) override;

    /**
     *  Writes/updates the SecurityGroup's data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB *db) override
    {
        std::string error_str;
        return insert_replace(db, true, error_str);
    }

    /**
     *  Factory method for SecurityGroup templates
     */
    std::unique_ptr<Template> get_new_template() const override
    {
        return std::make_unique<Template>();
    }

    /**
     *  These collections stores the collection of VMs in the security
     *  group and manages the update process of a Security Group
     *    - updated VMs using the last version of the sg rules
     *    - outdated VMs with a previous version of the security group
     *    - updating VMs being updated, action sent to the drivers
     *    - error VMs that fail to update because of a wrong state or driver error
     */
    ObjectCollection updated;

    ObjectCollection outdated;

    ObjectCollection updating;

    ObjectCollection error;
};

#endif /*SECURITYGROUP_H_*/
