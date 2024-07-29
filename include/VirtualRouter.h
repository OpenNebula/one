/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
struct RequestAttributes;

/**
 *  The VirtualRouter class.
 */
class VirtualRouter : public PoolObjectSQL
{
public:

    virtual ~VirtualRouter() = default;

    /**
     * Function to print the VirtualRouter object into a string in XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    std::string& to_xml(std::string& xml) const override;

    int add_vmid(int vmid)
    {
        return vms.add(vmid);
    }

    int del_vmid(int vmid)
    {
        return vms.del(vmid);
    }

    bool has_vmids() const
    {
        return vms.size() > 0;
    }

    /**
     *  Returns a copy of the VM IDs set
     */
    const std::set<int>& get_vms() const
    {
        return vms.get_collection();
    }

    // ------------------------------------------------------------------------
    // Template Contents
    // ------------------------------------------------------------------------
    /**
     *  Factory method for VirtualRouter templates
     */
    std::unique_ptr<Template> get_new_template() const override
    {
        return std::make_unique<Template>();
    }

    /**
     *  Returns a copy of the Template
     *    @return A copy of the VirtualMachineTemplate
     */
    std::unique_ptr<Template> clone_template() const
    {
        return std::make_unique<Template>(obj_template.get());
    }

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
    int replace_template(const std::string& tmpl_str, bool keep_restricted,
                         std::string& error) override;

    /**
     *  Append new attributes to this object's template. Object should be updated
     *  after calling this method
     *    @param tmpl_str new contents
     *    @param keep_restricted If true, the restricted attributes of the
     *    current template will override the new template
     *    @param error string describing the error if any
     *    @return 0 on success
     */
    int append_template(const std::string& tmpl_str, bool keep_restricted,
                        std::string& error) override;

    /**
     * Set the template ID to instantiate new VMs
     *
     * @param tmpl_id VM Template ID
     */
    void set_template_id(int tmpl_id);

    /**
     * Get the template ID set with set_template_id
     *
     * @return VM Template ID, or -1 if it was not found
     */
    int get_template_id() const;

    // ------------------------------------------------------------------------
    // Attach and detach NIC
    // ------------------------------------------------------------------------

    /**
     * Adds a new NIC to the virtual router template.
     * @param tmpl Template, should contain only one NIC
     * @param error reason, if any
     *
     * @return 0 on failure, the NIC to attach to each VM on success
     */
    VectorAttribute * attach_nic(VirtualMachineTemplate * tmpl,
                                 std::string& error);

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
     *    @param  check_lock for check if the resource is lock or not
     */
    static void set_auth_request(int uid, AuthRequest& ar, Template *tmpl,
                                 bool check_lock);


    // -------------------------------------------------------------------------
    // VM Management
    // -------------------------------------------------------------------------
    //
    /**
     *  Tries to shutdown, or delete, all this Virtual Router's VMs
     *    @param ra attributes for the VirtualRouter delete operation
     *    @param vms implementing the VirtualRouter
     *    @param nics IP leased to the VirtualRouter
     *    @return 0 on success, -1 otherwise
     */
    static int shutdown_vms(const std::set<int>& vms,
                            const RequestAttributes& ra);

private:
    // -------------------------------------------------------------------------
    // Friends
    // -------------------------------------------------------------------------
    friend class VirtualRouterPool;

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
    int insert_replace(SqlDB *db, bool replace, std::string& error_str);

    /**
     *  Bootstraps the database table(s) associated to the VirtualRouter
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * db);

    /**
     *  Rebuilds the object from an xml formatted string
     *    @param xml_str The xml-formatted string
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml(const std::string &xml_str) override;

    // *************************************************************************
    // Constructor
    // *************************************************************************
    VirtualRouter(int id,
                  int uid,
                  int gid,
                  const std::string& uname,
                  const std::string& gname,
                  int umask,
                  std::unique_ptr<Template> _template_contents);

    // *************************************************************************
    // DataBase implementation
    // *************************************************************************

    /**
     *  Writes the VirtualRouter in the database.
     *    @param db pointer to the db
     *    @param error_str Returns the error reason, if any
     *    @return 0 on success
     */
    int insert(SqlDB *db, std::string& error_str) override;

    /**
     *  Drops object from the database
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int drop(SqlDB *db) override;

    /**
     *  Writes/updates the VirtualRouter data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB *db) override
    {
        std::string err;
        return insert_replace(db, true, err);
    };

    // -------------------------------------------------------------------------
    // NIC Management
    // -------------------------------------------------------------------------

    /**
     *  Get all network leases for this Virtual Router
     *  @return 0 onsuccess
     */
    int get_network_leases(std::string& estr) const;

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
};

#endif /*VIRTUAL_ROUTER_H_*/
