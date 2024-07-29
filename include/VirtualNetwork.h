
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

#ifndef VIRTUAL_NETWORK_H_
#define VIRTUAL_NETWORK_H_


#include "PoolSQL.h"
#include "VirtualNetworkTemplate.h"
#include "Clusterable.h"
#include "AddressRangePool.h"
#include "ObjectCollection.h"

#include <vector>
#include <string>

#include "NebulaLog.h"

class VirtualMachineNic;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 *  The Virtual Network class. It represents a Virtual Network at manages its
 *  leases. One lease is formed by one IP and one MAC address.
 *  MAC address are derived from IP addresses.
 */
class VirtualNetwork : public PoolObjectSQL, public Clusterable
{
public:

    /**
     *  Defines the Virtual Network type based on its associated driver
     */
    enum VirtualNetworkDriver
    {
        NONE           = 0,
        DUMMY          = 1,
        VLAN           = 2,
        EBTABLES       = 3,
        FW             = 4,
        OVSWITCH       = 5,
        VXLAN          = 6,
        VCENTER        = 7,
        OVSWITCH_VXLAN = 8,
        BRIDGE         = 9
    };

    enum BridgeType
    {
        UNDEFINED           = 0,
        LINUX               = 1,
        OPENVSWITCH         = 2,
        OPENVSWITCH_DPDK    = 3,
        VCENTER_PORT_GROUPS = 4,
        BRNONE              = 5
    };

    enum VirtualNetworkState
    {
        INIT            = 0, //!< Initialization state
        READY           = 1, //!< Virtual Network ready to use
        LOCK_CREATE     = 2, //!< Driver create in progress
        LOCK_DELETE     = 3, //!< Driver delete in progress
        DONE            = 4, //!< The Virtual Network is being deleted
        ERROR           = 5, //!< Driver operation failed
        UPDATE_FAILURE  = 6  //!< Network Update failed for some VM leases
    };

    static std::string driver_to_str(VirtualNetworkDriver ob)
    {
        switch (ob)
        {
            case NONE:           return "";
            case DUMMY:          return "dummy";
            case VLAN:           return "802.1Q";
            case EBTABLES:       return "ebtables";
            case FW:             return "fw";
            case OVSWITCH:       return "ovswitch";
            case VXLAN:          return "vxlan";
            case VCENTER:        return "vcenter";
            case OVSWITCH_VXLAN: return "ovswitch_vxlan";
            case BRIDGE:         return "bridge";
            default:             return "";
        }
    };

    static VirtualNetworkDriver str_to_driver(const std::string& ob)
    {
        if ( ob == "dummy" )
        {
            return DUMMY;
        }
        else if ( ob == "802.1Q" )
        {
            return VLAN;
        }
        else if ( ob == "ebtables" )
        {
            return EBTABLES;
        }
        else if ( ob == "fw" )
        {
            return FW;
        }
        else if ( ob == "ovswitch" )
        {
            return OVSWITCH;
        }
        else if ( ob == "vxlan" )
        {
            return VXLAN;
        }
        else if ( ob == "vcenter" )
        {
            return VCENTER;
        }
        else if ( ob == "ovswitch_vxlan" )
        {
            return OVSWITCH_VXLAN;
        }
        else if ( ob == "bridge" )
        {
            return BRIDGE;
        }
        else
        {
            return NONE;
        }
    };

    static std::string bridge_type_to_str(BridgeType ob)
    {
        switch (ob)
        {
            case UNDEFINED:
            case LINUX:
                return "linux";
            case OPENVSWITCH:
                return "openvswitch";
            case OPENVSWITCH_DPDK:
                return "openvswitch_dpdk";
            case VCENTER_PORT_GROUPS:
                return "vcenter_port_groups";
            case BRNONE:
                return "none";
            default:
                return "none";
        }
    };

    static BridgeType str_to_bridge_type(const std::string& ob)
    {
        if ( ob == "linux" )
        {
            return LINUX;
        }
        else if ( ob == "openvswitch" )
        {
            return OPENVSWITCH;
        }
        else if ( ob == "openvswitch_dpdk" )
        {
            return OPENVSWITCH_DPDK;
        }
        else if ( ob == "vcenter_port_groups" )
        {
            return VCENTER_PORT_GROUPS;
        }
        else if (ob == "none")
        {
            return BRNONE;
        }
        else
        {
            return UNDEFINED;
        }
    };

    /**
     * Returns the string representation of an VirtualNetworkState
     * @param state The state
     * @return the string representation
     */
    static std::string state_to_str(VirtualNetworkState state)
    {
        switch (state)
        {
            case INIT:              return "INIT";          break;
            case READY:             return "READY";         break;
            case LOCK_CREATE:       return "LOCK_CREATE";   break;
            case LOCK_DELETE:       return "LOCK_DELETE";   break;
            case DONE:              return "DONE";          break;
            case ERROR:             return "ERROR";         break;
            default:                return "";
        }
    }

    static VirtualNetworkState str_to_state(const std::string& str_state)
    {
        if ( str_state == "READY" )
        {
            return READY;
        }
        else if ( str_state == "LOCK_CREATE" )
        {
            return LOCK_CREATE;
        }
        else if ( str_state == "LOCK_DELETE" )
        {
            return LOCK_DELETE;
        }
        else if ( str_state == "DONE" )
        {
            return DONE;
        }
        else if ( str_state == "ERROR")
        {
            return ERROR;
        }

        return INIT;
    }

    /**
     *  Check consistency of PHYDEV, BRIDGE and VLAN attributes depending on
     *  the network driver
     *    @param error_str describing the error
     *    @return 0 on success -1 otherwise
     */
    static int parse_phydev_vlans(const Template* tmpl,
                                  const std::string& vn_mad,
                                  const std::string& phydev,
                                  const std::string& bridge,
                                  const bool auto_id,
                                  const std::string& vlan_id,
                                  const bool auto_outer,
                                  const std::string& outer_id,
                                  std::string& estr);

    // *************************************************************************
    // Virtual Network Public Methods
    // *************************************************************************

    virtual ~VirtualNetwork() = default;

    /**
     *  Return state of Virtual Network
     */
    VirtualNetworkState get_state()
    {
        return state;
    }

    /**
     *  Set state of Virtual Network
     */
    void set_state(VirtualNetworkState _state)
    {
        state = _state;
    }

    /**
     *  Sets the previous state
     */
    void set_prev_state()
    {
        prev_state = state;
    }

    /**
     *  Test if the Image has changed state since last time prev state was set
     *    @return true if state changed
     */
    bool has_changed_state() const
    {
        return prev_state != state;
    }

    /**
     *  Factory method for virtual network templates
     */
    std::unique_ptr<Template> get_new_template() const override
    {
        return std::make_unique<VirtualNetworkTemplate>();
    }

    /**
     *  Fills a auth class to perform an authZ/authN request based on the object
     *  attributes. Disables the cluster and all NET rules (NET* and NET/%) for
     *  reservations.
     *    @param auths to be filled
     */
    void get_permissions(PoolObjectAuth& auths) override;

    // *************************************************************************
    // Address Range management interface
    // *************************************************************************

    /**
     * Add a set of address ranges to the virtual network
     *  @param ars_tmpl template in the form AR = [TYPE=...,IP=...,SIZE=...].
     *  @param error_msg If the action fails, this message contains the reason.
     *  @return 0 on success
     */
    int add_ar(VirtualNetworkTemplate * ars_tmpl, std::string& error_msg);

    /**
     * Adds a set of address ranges
     *  @param var a vector of address ranges
     *  @param error_msg If the action fails, this message contains the reason.
     *  @return 0 on success
     */
    int add_var(std::vector<VectorAttribute *> &var, std::string& error_msg);

    /**
     * Removes an address range from the VNET
     *  @param ar_id of the address range
     *  @param force force remove, even if active leases exists
     *  @param error_msg If the action fails, this message contains the reason.
     *  @return 0 on success
     */
    int rm_ar(unsigned int ar_id, bool force, std::string& error_msg);

    /**
     * Removes all address ranges from the VNET
     *  @param error_msg If the action fails, this message contains the reason.
     *  @return 0 on success
     */
    int rm_ars(std::string& error_msg);

    /**
     *  Allocates a new (and empty) address range. It is not added to the
     *  ar_pool
     *    @return pointer to the new address range
     */
    AddressRange * allocate_ar(const std::string& ipam_mad)
    {
        return ar_pool.allocate_ar(ipam_mad);
    }

    /**
     *  Adds a previously allocated address range to the AR pool
     *    @param rar pointer to the address range
     *    @return 0 on success
     */
    int add_ar(AddressRange * rar)
    {
        return ar_pool.add_ar(rar);
    }

    /**
     * Update an address range to the virtual network
     *  @param ars_tmpl template in the form AR = [AR_ID=...]. The address range
     *  is specified by the AR_ID attribute.
     *  @param keep_restricted If true, the restricted attributes of the
     *  current template will override the new template
     *  @param error_msg If the action fails, this message contains
     *  the reason.
     *  @return 0 on success
     */
    int update_ar(
            VirtualNetworkTemplate* ars_tmpl,
            bool                    keep_restricted,
            std::string&            error_msg);

    // *************************************************************************
    // Address hold/release interface
    // *************************************************************************

    /**
     * Holds a Lease, marking it as used
     *  @param leases template in the form LEASES = [IP=XX].
     *          The template can only contain one LEASE definition.
     *  @param error_msg If the action fails, this message contains the reason.
     *  @return 0 on success
     */
    int hold_leases(VirtualNetworkTemplate * leases, std::string& error_msg);

    /**
     * Releases a Lease on hold
     *  @param leases template in the form LEASES = [IP=XX].
     *          The template can only contain one LEASE definition.
     *  @param error_msg If the action fails, this message contains
     *         the reason.
     *  @return 0 on success
     */
    int free_leases(VirtualNetworkTemplate* leases, std::string& error_msg);

    // *************************************************************************
    // Address allocation funtions
    // *************************************************************************

    /**
     *  Release previously given address lease
     *    @param arid of the address range where the address was leased from
     *    @param ot the type of the object requesting the address
     *    @param oid the id of the object requesting the address
     *    @param mac MAC address identifying the lease
     */
    void free_addr(unsigned int arid, PoolObjectSQL::ObjectType ot, int oid,
                   const std::string& mac)
    {
        ar_pool.free_addr(arid, ot, oid, mac);

        if (ot == PoolObjectSQL::VROUTER)
        {
            vrouters.del(oid);
        }
        else if (ot == PoolObjectSQL::VM)
        {
            clear_update_vm(oid);
        }
    }

    /**
     *  Release previously given address lease
     *    @param ot the type of the object requesting the address
     *    @param oid the id of the object requesting the address
     *    @param mac MAC address identifying the lease
     */
    void free_addr(PoolObjectSQL::ObjectType ot, int oid, const std::string& mac)
    {
        ar_pool.free_addr(ot, oid, mac);

        if (ot == PoolObjectSQL::VROUTER)
        {
            vrouters.del(oid);
        }
        else if (ot == PoolObjectSQL::VM)
        {
            clear_update_vm(oid);
        }
    }

    /**
     *  Release all previously given address leases to the given object
     *    @param ot the type of the object requesting the address (VM or NET)
     *    @param obid the id of the object requesting the address
     *    @return the number of addresses freed
     */
    int free_addr_by_owner(PoolObjectSQL::ObjectType ot, int obid)
    {
        if (ot == PoolObjectSQL::VM)
        {
            clear_update_vm(obid);
        }

        return ar_pool.free_addr_by_owner(ot, obid);
    }

    /**
     *  Release a previously leased address range
     *    @param ot the type of the object requesting the address (VM or NET)
     *    @param obid the id of the object requesting the address
     *    @return the number of addresses freed
     */
    int free_addr_by_range(unsigned int arid, PoolObjectSQL::ObjectType ot,
                           int obid, const std::string& mac, unsigned int rsize)
    {
        if (ot == PoolObjectSQL::VM)
        {
            clear_update_vm(obid);
        }

        return ar_pool.free_addr_by_range(arid, ot, obid, mac, rsize);
    }

    /**
     *  Update NIC attributes from updated Virtual Network attributes
     *   @param nic todo
     *   @return the number of updated attributes
     */
    int nic_update(VirtualMachineNic *nic, std::unique_ptr<VectorAttribute>& uattr) const;

    /**
     * Modifies the given nic attribute adding the following attributes:
     *  * IP:  leased from network
     *  * MAC: leased from network
     *  * BRIDGE: for this virtual network
     *  @param nic attribute for the VM template
     *  @param vid of the VM getting the lease
     *  @param inherit_attrs Attributes to be inherited from the vnet template
     *      into the nic
     *  @return 0 on success
     */
    int nic_attribute(
            VirtualMachineNic *             nic,
            int                             vid,
            const std::set<std::string>&    inherit_attrs);

    /**
     * Modifies the given nic attribute adding the following attributes:
     *  * IP:  leased from network
     *  * MAC: leased from network
     *  @param nic attribute for the VRouter template
     *  @param vrid of the VRouter getting the lease
     *  @param inherit_attrs Attributes to be inherited from the vnet template
     *      into the nic
     *  @return 0 on success
     */
    int vrouter_nic_attribute(
            VirtualMachineNic *             nic,
            int                             vrid,
            const std::set<std::string>&    inherit_attrs);

    /**
     * From a Security Group rule that uses this vnet, creates a new rule
     * copy for each AR.
     *
     * @param rule original rule
     * @param new_rules vector where the new rules will be placed. Rules must
     * be deleted by the caller
     */
    void process_security_rule(
            VectorAttribute *             rule,
            std::vector<VectorAttribute*> &new_rules);

    // *************************************************************************
    // Network Reservation functions
    // *************************************************************************

    /**
     *  Reserve an address range for this network and add it to the given AR
     *    @param rid the reservation VNET ID to store the reserved AR
     *    @param rsize number of addresses to reserve
     *    @param rar the address range to place the reservation
     *    @param err error message
     *    @return 0 on success
     */
    int reserve_addr(int rid, unsigned int rsize, AddressRange *rar,
                     std::string& err);

    /**
     *  Reserve an address range for this network and add it to the given AR
     *    @param rid the reservation VNET ID to store the reserved AR
     *    @param rsize number of addresses to reserve
     *    @param ar_id of the ar to make the reservation from
     *    @param rar the address range to place the reservation
     *    @param err error message
     *    @return 0 on success
     */
    int reserve_addr(int rid, unsigned int rsize, unsigned int ar_id,
                     AddressRange *rar, std::string& error_str);

    /**
     *  Reserve an address range for this network and add it to the given vnet
     *    @param rid the reservation VNET ID to store the reserved AR
     *    @param rsize number of addresses to reserve
     *    @param ar_id id of the address range to obtain the addresses
     *    @param ip/mac the first ip/mac in the reservations
     *    @param rar the address range to place the reservation
     *    @param err error message
     *    @return 0 on success
     */
    int reserve_addr_by_mac(int rid, unsigned int rsize, unsigned int ar_id,
                            const std::string& mac, AddressRange *rar, std::string& error_str);

    int reserve_addr_by_ip(int rid, unsigned int rsize, unsigned int ar_id,
                           const std::string& ip, AddressRange *rar, std::string& error_str);

    int reserve_addr_by_ip6(int rid, unsigned int rsize, unsigned int ar_id,
                            const std::string& ip6, AddressRange *rar, std::string& error_str);

    /**
     * Returns true if this VNET is a reservation
     * @return true if this VNET is a reservation
     */
    bool is_reservation() const;

    // *************************************************************************
    // Formatting & Helper functions
    // *************************************************************************
    /**
     *    Gets used leases
     *    @return number of network leases in used
     */
    unsigned int get_used() const
    {
        return ar_pool.get_used_addr();
    };

    /**
     *    Gets total number of addresses
     *    @return the number of addresses
     */
    unsigned int get_size() const
    {
        return ar_pool.get_size();
    };
    /**
     *  Returns the parent network used to create this VNET (if any)
     *    @return the parent vnet id or -1 this vnet has no parent
     */
    int get_parent() const
    {
        return parent_vid;
    };

    /**
     *  Returns the parent address range used to create this AR (if any)
     *    @param ar_id the id of the AR
     *    @return the parent AR id or -1 this vnet has no parent
     */
    int get_ar_parent(int ar_id) const
    {
        return ar_pool.get_ar_parent(ar_id);
    };

    /**
     * Function to print the VirtualNetwork object into a string in
     * XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    std::string& to_xml(std::string& xml) const override;

    /**
     * Function to print the VirtualNetwork object into a string in
     * XML format. The extended XML includes the LEASES
     *  @param xml the resulting XML string
     *  @param vm_ids list of VM the user can access VNET usage info from.
     *  A vector containing just -1 means all VMs.
     *  @param vnet_ids list of VNET the user can access reservation info from.
     *  A vector containing just -1 means all VNETs.
     *  @param vrs list of VRouter the user can access reservation info from.
     *  A vector containing just -1 means all VRouters.
     *  @return a reference to the generated string
     */
    std::string& to_xml_extended(std::string& xml, const std::vector<int>& vms,
                                 const std::vector<int>& vnets, const std::vector<int>& vrs) const;

    /**
     *  Replace template for this object. Object should be updated
     *  after calling this method
     *    @param tmpl_str new contents
     *    @param keep_restricted If true, the restricted attributes of the
     *    current template will override the new template
     *    @param error string describing the error if any
     *    @return 0 on success
     */
    int replace_template(const std::string& tmpl_str,
                         bool keep_restricted,
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
    int append_template(const std::string& tmpl_str,
                        bool keep_restricted,
                        std::string& error) override;

    /**
     *  Gets a string based attribute (single) from an address range. If the
     *  attribute is not found in the address range, the VNET template will be
     *  used
     *    @param name of the attribute
     *    @param value of the attribute (a string), will be "" if not defined or
     *    not a single attribute
     *    @param ar_id of the address attribute.
     */
    void get_template_attribute(const std::string& name, std::string& value,
                                int ar_id) const;

    /**
     *  int version of get_template_attribute
     *    @return 0 on success
     */
    int get_template_attribute(const std::string& name, int& value,
                               int ar_id) const;

    /**
     *  Adds the security group of the VNet and its ARs to the given set
     *    @param sgs to put the sg ids in
     */
    void get_security_groups(std::set<int> & sgs);

    /**
     *    @return A copy of the VNET Template
     */
    std::unique_ptr<VirtualNetworkTemplate> clone_template() const
    {
        auto new_vn = std::make_unique<VirtualNetworkTemplate>(*obj_template);

        //Clone non-template attributes
        //  AUTOMATIC_VLAN_ID
        //  VLAN_ID
        if ( vlan_id.empty() )
        {
            new_vn->replace("AUTOMATIC_VLAN_ID", "NO");
        }
        else
        {
            new_vn->replace("VLAN_ID", vlan_id);
        }

        if ( outer_vlan_id.empty() )
        {
            new_vn->replace("AUTOMATIC_OUTER_VLAN_ID", "NO");
        }
        else
        {
            new_vn->replace("OUTER_VLAN_ID", outer_vlan_id);
        }

        return new_vn;
    };

    /**
     *  Encrypt all secret attributes
     */
    void encrypt() override;

    /**
     *  Decrypt all secret attributes
     */
    void decrypt() override;

    /**
     * Commit Virtual Network changes to associated VMs
     *   @param recover, if true It will propagate the changes to VMs in error
     *   and those being updated. Otherwise all VMs associated with the VN will
     *   be updated
     */
    void commit(bool recover);

    void commit(const std::set<int>& vm_ids);

    /**
     *  Functions to manipulate the vm collection IDs
     */
    int get_outdated(int& vmid)
    {
        return outdated.pop(vmid);
    }

    bool is_outdated(int vmid) const
    {
        return outdated.contains(vmid);
    }

    int add_outdated(int vmid)
    {
        return outdated.add(vmid);
    }

    int add_updating(int vmid)
    {
        return updating.add(vmid);
    }

    bool is_updating(int vmid) const
    {
        return updating.contains(vmid);
    }

    int del_updating(int vmid)
    {
        return updating.del(vmid);
    }

    int add_error(int vmid)
    {
        return error.add(vmid);
    }

    int add_updated(int vmid)
    {
        return updated.add(vmid);
    }

    /**
     *  Deletes a VM ID from the network update list (any of the sets)
     *    @param vm_id The id
     */
    void clear_update_vm(int vm_id);

private:

    // -------------------------------------------------------------------------
    // Friends
    // -------------------------------------------------------------------------
    friend class VirtualNetworkPool;

    // *************************************************************************
    // Virtual Network Private Attributes
    // *************************************************************************

    VirtualNetworkState state;

    VirtualNetworkState prev_state;

    // -------------------------------------------------------------------------
    // Binded physical attributes
    // -------------------------------------------------------------------------

    /**
     * Name of the vn mad
     */
    std::string vn_mad;

    /**
     *  Name of the bridge this VNW binds to
     */
    std::string  bridge;

    /**
     *  Name of the physical device the bridge should be attached to
     */
    std::string  phydev;

    /**
     *  VLAN ID of the NIC. When more than VLAN ID is used this refers to the
     *  link layer or outer/service VLAN_ID
     */
    std::string  vlan_id;

    /**
     *  Used for double tagging of VM traffic. This id refers to the transport
     *  layer or outer/service VLAN_ID
     */
    std::string outer_vlan_id;

    /**
     *  If the VLAN has been set automatically
     */
    bool  vlan_id_automatic;

    /**
     *  If the outer VLAN has been set automatically
     */
    bool  outer_vlan_id_automatic;

    /**
     *  Parent VNET ID if any
     */
    int     parent_vid;

    /**
     *  Security Groups
     */
    std::set<int> security_groups;

    /**
     *  The Address Range Pool
     */
    AddressRangePool ar_pool;

    /**
     *  Set of Virtual Router IDs
     */
    ObjectCollection vrouters;

    /**
     *  Bridge type of the VirtualNetwork
     */
    std::string bridge_type;

    /**
     *  These collections stores the collection of VMs in the Virtual
     *  Networks and manages the update process
     *    - updated VMs using the last version of the vnet
     *    - outdated VMs with a previous version of the vnet
     *    - updating VMs being updated, action sent to the drivers
     *    - error VMs that fail to update because of a wrong state or driver error
     */
    ObjectCollection updated;

    ObjectCollection outdated;

    ObjectCollection updating;

    ObjectCollection error;

    // *************************************************************************
    // VLAN ID functions
    // *************************************************************************

    /**
     *  This function parses the VLAN attribute and clears the associated
     *  automatic flag if set.
     *    @param id_name of the VLAN attribute VLAN_ID or OUTER_VLAN_ID
     *    @param auto_name of automatic flag AUTOMATIC_VLAN_ID or
     *    AUTOMATIC_OUTER_VLAN_ID
     *    @param id the associated vlan variable
     *    @param auto the associated automatic variable
     */
    void parse_vlan_id(const char * id_name, const char * auto_name,
                       std::string& id, bool& auto_id);

    // *************************************************************************
    // Address allocation funtions
    // *************************************************************************

    /**
     *    Gets a new address lease for a specific VM
     *    @param ot the type of the object requesting the address
     *    @param oid the id of the object requesting the address
     *    @param nic the VM NIC attribute to be filled with the lease info.
     *    @param inherit attributes from the address range to include in the NIC
     *    @return 0 if success
     */
    int allocate_addr(PoolObjectSQL::ObjectType ot, int oid,
                      VectorAttribute * nic, const std::set<std::string>& inherit)
    {
        return ar_pool.allocate_addr(ot, oid, nic, inherit);
    }

    /**
     *    Gets a new address lease for a specific VM by MAC/IP
     *    @param ot the type of the object requesting the address
     *    @param oid the id of the object requesting the address
     *    @param mac/ip the MAC/IP  address requested
     *    @param nic the VM NIC attribute to be filled with the lease info.
     *    @param inherit attributes from the address range to include in the NIC
     *    @return 0 if success
     */
    int allocate_by_mac(PoolObjectSQL::ObjectType ot,
                        int oid,
                        const std::string& mac,
                        VectorAttribute * nic,
                        const std::set<std::string>& inherit)
    {
        return ar_pool.allocate_by_mac(mac, ot, oid, nic, inherit);
    }

    int allocate_by_ip(PoolObjectSQL::ObjectType ot,
                       int oid,
                       const std::string& ip,
                       VectorAttribute * nic,
                       const std::set <std::string>& inherit)
    {
        return ar_pool.allocate_by_ip(ip, ot, oid, nic, inherit);
    }

    int allocate_by_ip6(PoolObjectSQL::ObjectType ot,
                        int oid,
                        const std::string& ip,
                        VectorAttribute * nic,
                        const std::set<std::string>& inherit)
    {
        return ar_pool.allocate_by_ip6(ip, ot, oid, nic, inherit);
    }

    // *************************************************************************
    // BRIDGE TYPE functions
    // *************************************************************************

    /**
     *  This function parses the BRIDGE TYPE attribute.
     *
     *    @param br_type the bridge type associated to the nic
     */
    int parse_bridge_type(const std::string &vn_mad, std::string &error_str);

    // *************************************************************************
    // DataBase implementation (Private)
    // *************************************************************************

    /**
     *  Execute an INSERT or REPLACE Sql query.
     *    @param db The SQL DB
     *    @param replace Execute an INSERT or a REPLACE
     *    @param error_str Returns the error reason, if any
     *    @return 0 on success
     */
    int insert_replace(SqlDB *db, bool replace, std::string& error_str);

    /**
     *  Bootstraps the database table(s) associated to the Virtual Network
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * db);

    /**
     * Function to print the VirtualNetwork object into a string in
     * XML format
     *  @param xml the resulting XML string
     *  @param extended_and_check If true, leases are included and permissions are checked
     *  @return a reference to the generated string
     */
    std::string& to_xml_extended(std::string& xml, bool extended_and_check,
                                 const std::vector<int>& vm_ids, const std::vector<int>& vnet_oids,
                                 const std::vector<int>& vr_ids) const;

    /**
     *  Rebuilds the object from an xml formatted string
     *    @param xml_str The xml-formatted string
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml(const std::string &xml_str) override;

    /**
     * Updates the BRIDGE, PHYDEV, and VLAN_ID attributes.
     *    @param error string describing the error if any
     *    @return 0 on success
     */
    int post_update_template(std::string& error) override;

    /**
     * Detect changed attributes in new_tmpl, store them as
     * new attribute VNET_UPDATE
     *  @param new_tmpl New template to compare with obj_template
     *  @param removed Detect also removed attributes
     */
    void set_updated_attributes(Template* new_tmpl, bool removed);

    //**************************************************************************
    // Constructor
    //**************************************************************************

    VirtualNetwork(int                      uid,
                   int                      gid,
                   const std::string&       _uname,
                   const std::string&       _gname,
                   int                      _umask,
                   int                      _parent_vid,
                   const std::set<int>      &_cluster_ids,
                   std::unique_ptr<VirtualNetworkTemplate> _vn_template = 0);

    // *************************************************************************
    // DataBase implementation
    // *************************************************************************

    /**
     *  Writes the Virtual Network and its associated template and leases in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqlDB * db, std::string& error_str) override;

    /**
     *  Writes/updates the Virtual Network data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB * db) override
    {
        std::string error_str;
        return insert_replace(db, true, error_str);
    }
};

#endif /*VIRTUAL_NETWORK_H_*/
