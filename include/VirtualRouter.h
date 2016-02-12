/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

#ifndef VIRTUAL_ROUTER_H_
#define VIRTUAL_ROUTER_H_

#include "PoolObjectSQL.h"
#include "Template.h"
#include "ObjectCollection.h"
#include "VirtualMachineTemplate.h"
#include "AuthRequest.h"
#include "History.h"
#include "ActionSet.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 *  The VirtualRouter class.
 */
class VirtualRouter : public PoolObjectSQL
{
public:

    /**
     * Function to print the VirtualRouter object into a string in XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    string& to_xml(string& xml) const;

    int add_vmid(int vmid);

    bool has_vmids() const;

    /**
     *  Returns a copy of the VM IDs set
     */
    set<int> get_vms() const;

    // ------------------------------------------------------------------------
    // Template Contents
    // ------------------------------------------------------------------------

    /**
     *  Factory method for VirtualRouter templates
     */
    Template * get_new_template() const
    {
        return new Template;
    }

    /**
     *  Returns a copy of the Template
     *    @return A copy of the VirtualMachineTemplate
     */
    Template * clone_template() const
    {
        return new Template(obj_template);
    };

    Template * get_vm_template() const;

    /**
     *  Replace template for this object. Object should be updated
     *  after calling this method
     *    @param tmpl_str new contents
     *    @param keep_restricted If true, the restricted attributes of the
     *    current template will override the new template
     *    @param error string describing the error if any
     *    @return 0 on success
     */
    int replace_template(const string& tmpl_str, bool keep_restricted, string& error);

    /**
     *  Append new attributes to this object's template. Object should be updated
     *  after calling this method
     *    @param tmpl_str new contents
     *    @param keep_restricted If true, the restricted attributes of the
     *    current template will override the new template
     *    @param error string describing the error if any
     *    @return 0 on success
     */
    int append_template(const string& tmpl_str, bool keep_restricted, string& error);

    // ------------------------------------------------------------------------
    // Attach and detach NIC
    // ------------------------------------------------------------------------

    /**
     * Adds a new NIC to the virtual router template.
     * @param tmpl Template, should contain only one NIC
     * @param error_str error reason, if any
     *
     * @return 0 on failure, the NIC to attach to each VM on success
     */
    VectorAttribute * attach_nic(
            VirtualMachineTemplate * tmpl, string& error_str);

    /**
     * Deletes the NIC from the virtual router template.
     *
     * @param nic_id of the NIC
     * @return 0 if the nic_id was found, -1 otherwise
     */
    int detach_nic(int nic_id);

    // ------------------------------------------------------------------------
    // Authorization related functions
    // ------------------------------------------------------------------------

    /**
     *  Sets an authorization request for a Virtual Router template based on
     *  the networks used
     *    @param  uid for template owner
     *    @param  ar the AuthRequest object
     *    @param  tmpl the virtual router template
     */
    static void set_auth_request(int uid,
                                 AuthRequest& ar,
                                 Template *tmpl);

    /**
     * Checks if the given action is supported for Virtual Router VMs
     * @param action VM action to check
     * @return true if the action is supported for Virtual Router VMs
     */
    static bool is_action_supported(History::VMAction action)
    {
        return SUPPORTED_ACTIONS.is_set(action);
    }

private:
    // -------------------------------------------------------------------------
    // Friends
    // -------------------------------------------------------------------------
    friend class VirtualRouterPool;

    static const ActionSet<History::VMAction> SUPPORTED_ACTIONS;

    // *************************************************************************
    // Attributes
    // *************************************************************************
    ObjectCollection vms;

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
    int insert_replace(SqlDB *db, bool replace, string& error_str);

    /**
     *  Bootstraps the database table(s) associated to the VirtualRouter
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * db)
    {
        ostringstream oss(VirtualRouter::db_bootstrap);

        return db->exec(oss);
    };

    /**
     *  Rebuilds the object from an xml formatted string
     *    @param xml_str The xml-formatted string
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml(const string &xml_str);

    // *************************************************************************
    // Constructor
    // *************************************************************************
    VirtualRouter(  int id,
                    int uid,
                    int gid,
                    const string& uname,
                    const string& gname,
                    int umask,
                    Template * _template_contents);

    ~VirtualRouter();

    // *************************************************************************
    // DataBase implementation
    // *************************************************************************

    static const char * db_names;

    static const char * db_bootstrap;

    static const char * table;

    /**
     *  Writes the VirtualRouter in the database.
     *    @param db pointer to the db
     *    @param error_str Returns the error reason, if any
     *    @return 0 on success
     */
    int insert(SqlDB *db, string& error_str);

    /**
     *  Drops object from the database
     *    @param db pointer to the db
     *    @return 0 on success
     */
    virtual int drop(SqlDB *db);

    /**
     *  Writes/updates the VirtualRouter data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB *db)
    {
        string err;
        return insert_replace(db, true, err);
    };

    // -------------------------------------------------------------------------
    // NIC Management
    // -------------------------------------------------------------------------

    /**
     *  Get all network leases for this Virtual Router
     *  @return 0 onsuccess
     */
    int get_network_leases(string& estr);

    /**
     *  Releases all network leases taken by this Virtual Router
     */
    void release_network_leases();

    /**
     * Releases the network lease taken by this NIC
     *
     * @param nic NIC to be released
     *
     * @return 0 on success, -1 otherwise
     */
    int release_network_leases(const VectorAttribute  * nic);

    /**
     * Returns the nic with the giver nic_id, or 0
     * @param nic_id
     * @return nic if found, 0 if not found
     */
    VectorAttribute* get_nic(int nic_id) const;

    // -------------------------------------------------------------------------
    // VM Management
    // -------------------------------------------------------------------------

    /**
     * Tries to shutdown, or delete, all this Virtual Router's VMs
     *
     * @return 0 on success, -1 otherwise
     */
    int shutdown_vms();
};

#endif /*VIRTUAL_ROUTER_H_*/
