/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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
#include <map>

#include <time.h>
#include <sstream>

using namespace std;

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
        NONE     = 0,
        DUMMY    = 1,
        VLAN     = 2,
        EBTABLES = 3,
        FW       = 4,
        OVSWITCH = 5,
        VXLAN    = 6
    };

    static string driver_to_str(VirtualNetworkDriver ob)
    {
        switch (ob)
        {
            case NONE:     return "";
            case DUMMY:    return "dummy";
            case VLAN:     return "802.1Q";
            case EBTABLES: return "ebtables";
            case FW:       return "fw";
            case OVSWITCH: return "ovswitch";
            case VXLAN:    return "vxlan";
        }
    };

    static VirtualNetworkDriver str_to_driver(const string& ob)
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
        else
        {
            return NONE;
        }
    };

    // *************************************************************************
    // Virtual Network Public Methods
    // *************************************************************************

    /**
     *  Factory method for virtual network templates
     */
    Template * get_new_template() const
    {
        return new VirtualNetworkTemplate;
    }

    /**
     *  Fills a auth class to perform an authZ/authN request based on the object
     *  attributes. Disables the cluster and all NET rules (NET* and NET/%) for
     *  reservations.
     *    @param auths to be filled
     */
    void get_permissions(PoolObjectAuth& auths);

    // *************************************************************************
    // Address Range management interface
    // *************************************************************************

    /**
     * Add a set of address ranges to the virtual network
     *  @param ars_tmpl template in the form AR = [TYPE=...,IP=...,SIZE=...].
     *  @param error_msg If the action fails, this message contains the reason.
     *  @return 0 on success
     */
    int add_ar(VirtualNetworkTemplate * ars_tmpl, string& error_msg);

    /**
     * Adds a set of address ranges
     *  @param var a vector of address ranges
     *  @param error_msg If the action fails, this message contains the reason.
     *  @return 0 on success
     */
    int add_var(vector<VectorAttribute *> &var, string& error_msg);

    /**
     * Removes an address range from the VNET
     *  @param ar_id of the address range
     *  @param error_msg If the action fails, this message contains the reason.
     *  @return 0 on success
     */
    int rm_ar(unsigned int ar_id, string& error_msg);

    /**
     *  Allocates a new (and empty) address range. It is not added to the
     *  ar_pool
     *    @return pointer to the new address range
     */
    AddressRange * allocate_ar()
    {
        return ar_pool.allocate_ar();
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
            string&                 error_msg);

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
    int hold_leases(VirtualNetworkTemplate * leases, string& error_msg);

    /**
     * Releases a Lease on hold
     *  @param leases template in the form LEASES = [IP=XX].
     *          The template can only contain one LEASE definition.
     *  @param error_msg If the action fails, this message contains
     *         the reason.
     *  @return 0 on success
     */
    int free_leases(VirtualNetworkTemplate* leases, string& error_msg);

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
            VectorAttribute * nic, const vector<string>& inherit)
    {
        return ar_pool.allocate_addr(ot, oid, nic, inherit);
    }

    /**
     *    Gets a new address lease for a specific VM by MAC
     *    @param ot the type of the object requesting the address
     *    @param oid the id of the object requesting the address
     *    @param mac the MAC address requested
     *    @param nic the VM NIC attribute to be filled with the lease info.
     *    @param inherit attributes from the address range to include in the NIC
     *    @return 0 if success
     */
    int allocate_by_mac(PoolObjectSQL::ObjectType ot, int oid, const string& mac,
            VectorAttribute * nic, const vector<string>& inherit)
    {
        return ar_pool.allocate_by_mac(mac, ot, oid, nic, inherit);
    }

    /**
     *    Gets a new address lease for a specific VM by IP
     *    @param ot the type of the object requesting the address
     *    @param oid the id of the object requesting the address
     *    @param ip the IP address requested
     *    @param nic the VM NIC attribute to be filled with the lease info.
     *    @param inherit attributes from the address range to include in the NIC
     *    @return 0 if success
     */
    int allocate_by_ip(PoolObjectSQL::ObjectType ot, int oid, const string& ip,
            VectorAttribute * nic, const vector<string>& inherit)
    {
        return ar_pool.allocate_by_ip(ip, ot, oid, nic, inherit);
    }

    /**
     *  Release previously given address lease
     *    @param arid of the address range where the address was leased from
     *    @param ot the type of the object requesting the address
     *    @param oid the id of the object requesting the address
     *    @param mac MAC address identifying the lease
     */
    void free_addr(unsigned int arid, PoolObjectSQL::ObjectType ot, int oid,
                    const string& mac)
    {
        ar_pool.free_addr(arid, ot, oid, mac);

        if (ot == PoolObjectSQL::VROUTER)
        {
            vrouters.del(oid);
        }
    }

    /**
     *  Release previously given address lease
     *    @param ot the type of the object requesting the address
     *    @param oid the id of the object requesting the address
     *    @param mac MAC address identifying the lease
     */
    void free_addr(PoolObjectSQL::ObjectType ot, int oid, const string& mac)
    {
        ar_pool.free_addr(ot, oid, mac);

        if (ot == PoolObjectSQL::VROUTER)
        {
            vrouters.del(oid);
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
        return ar_pool.free_addr_by_owner(ot, obid);
    }

    /**
     *  Release a previously leased address range
     *    @param ot the type of the object requesting the address (VM or NET)
     *    @param obid the id of the object requesting the address
     *    @return the number of addresses freed
     */
    int free_addr_by_range(unsigned int arid, PoolObjectSQL::ObjectType ot,
            int obid, const string& mac, unsigned int rsize)
    {
        return ar_pool.free_addr_by_range(arid, ot, obid, mac, rsize);
    }

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
            VectorAttribute *       nic,
            int                     vid,
            const vector<string>&   inherit_attrs);

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
            VectorAttribute *       nic,
            int                     vrid,
            const vector<string>&   inherit_attrs);

    /**
     * From a Security Group rule that uses this vnet, creates a new rule
     * copy for each AR.
     *
     * @param rule original rule
     * @param new_rules vector where the new rules will be placed. Rules must
     * be deleted by the caller
     */
    void process_security_rule(
            VectorAttribute *        rule,
            vector<VectorAttribute*> &new_rules);

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
    int reserve_addr(int rid, unsigned int rsize, AddressRange *rar, string& err);

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
        AddressRange *rar, string& error_str);

    /**
     *  Reserve an address range for this network and add it to the given vnet
     *    @param rid the reservation VNET ID to store the reserved AR
     *    @param rsize number of addresses to reserve
     *    @param ar_id id of the address range to obtain the addresses
     *    @param ip the first ip in the reservations
     *    @param rar the address range to place the reservation
     *    @param err error message
     *    @return 0 on success
     */
    int reserve_addr_by_ip(int rid, unsigned int rsize, unsigned int ar_id,
            const string& ip, AddressRange *rar, string& error_str);

    /**
     *  Reserve an address range for this network and add it to the given vnet
     *    @param rid the reservation VNET ID to store the reserved AR
     *    @param rsize number of addresses to reserve
     *    @param ar_id id of the address range to obtain the addresses
     *    @param mac the first mac in the reservations
     *    @param rar the address range to place the reservation
     *    @param err error message
     *    @return 0 on success
     */
    int reserve_addr_by_mac(int rid, unsigned int rsize, unsigned int ar_id,
            const string& mac, AddressRange *rar, string& error_str);

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
    unsigned int get_used()
    {
        return ar_pool.get_used_addr();
    };

    unsigned int get_one_used()
    {
        return ar_pool.get_one_used_addr();
    };

    /**
     *    Gets total number of addresses
     *    @return the number of addresses
     */
    unsigned int get_size()
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
    string& to_xml(string& xml) const;

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
    string& to_xml_extended(string& xml, const vector<int>& vms,
        const vector<int>& vnets, const vector<int>& vrs) const;

    /**
     *  Gets a string based attribute (single) from an address range. If the
     *  attribute is not found in the address range, the VNET template will be
     *  used
     *    @param name of the attribute
     *    @param value of the attribute (a string), will be "" if not defined or
     *    not a single attribute
     *    @param ar_id of the address attribute.
     */
    void get_template_attribute(const char * name, string& value, int ar_id) const;

    /**
     *  int version of get_template_attribute
     *    @return 0 on success
     */
    int get_template_attribute(const char * name, int& value, int ar_id) const;

    /**
     *    @return A copy of the VNET Template
     */
    VirtualNetworkTemplate * clone_template() const
    {
        VirtualNetworkTemplate * new_vn = new VirtualNetworkTemplate(
                *(static_cast<VirtualNetworkTemplate *>(obj_template)));

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

        return new_vn;
    };

private:

    // -------------------------------------------------------------------------
    // Friends
    // -------------------------------------------------------------------------
    friend class VirtualNetworkPool;

    // *************************************************************************
    // Virtual Network Private Attributes
    // *************************************************************************

    // -------------------------------------------------------------------------
    // Binded physical attributes
    // -------------------------------------------------------------------------

    /**
     * Name of the vn mad
     */
    string vn_mad;

    /**
     *  Name of the bridge this VNW binds to
     */
    string  bridge;

    /**
     *  Name of the physical device the bridge should be attached to
     */
    string  phydev;

    /**
     *  VLAN ID of the NIC
     */
    string  vlan_id;

    /**
     *  If the VLAN has been set automatically
     */
    bool  vlan_id_automatic;

    /**
     *  Parent VNET ID if any
     */
    int     parent_vid;

    /**
     *  Security Groups
     */
    set<int> security_groups;

    /**
     *  The Address Range Pool
     */
    AddressRangePool ar_pool;

    /**
     *  Set of Virtual Router IDs
     */
    ObjectCollection vrouters;

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
    int insert_replace(SqlDB *db, bool replace, string& error_str);

    /**
     *  Bootstraps the database table(s) associated to the Virtual Network
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * db)
    {
        ostringstream oss_vnet(VirtualNetwork::db_bootstrap);

        return db->exec(oss_vnet);
    };

    /**
     * Function to print the VirtualNetwork object into a string in
     * XML format
     *  @param xml the resulting XML string
     *  @param extended If true, leases are included
     *  @return a reference to the generated string
     */
    string& to_xml_extended(string& xml, bool extended,
        const vector<int>& vm_ids, const vector<int>& vnet_oids,
        const vector<int>& vr_ids) const;

    /**
     *  Rebuilds the object from an xml formatted string
     *    @param xml_str The xml-formatted string
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml(const string &xml_str);

    /**
     * Updates the BRIDGE, PHY_DEV, and VLAN_ID attributes.
     *    @param error string describing the error if any
     *    @return 0 on success
     */
    int post_update_template(string& error);

    //**************************************************************************
    // Constructor
    //**************************************************************************

    VirtualNetwork(int                      uid,
                   int                      gid,
                   const string&            _uname,
                   const string&            _gname,
                   int                      _umask,
                   int                      _parent_vid,
                   const set<int>           &_cluster_ids,
                   VirtualNetworkTemplate * _vn_template = 0);

    ~VirtualNetwork();

    // *************************************************************************
    // DataBase implementation
    // *************************************************************************

    static const char * table;

    static const char * db_names;

    static const char * db_bootstrap;

    /**
     *  Writes the Virtual Network and its associated template and leases in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int insert(SqlDB * db, string& error_str);

    /**
     *  Writes/updates the Virtual Network data fields in the database.
     *    @param db pointer to the db
     *    @return 0 on success
     */
    int update(SqlDB * db)
    {
        string error_str;
        return insert_replace(db, true, error_str);
    }
};

#endif /*VIRTUAL_NETWORK_H_*/
