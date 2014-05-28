/* -------------------------------------------------------------------------- */
/* Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

    // *************************************************************************
    // Address Range management interface
    // *************************************************************************

    /**
     * Add an address range to the virtual network
     *  @param ars_tmpl template in the form AR = [TYPE=...,IP=...,SIZE=...].
     *  @param error_msg If the action fails, this message contains the reason.
     *  @return 0 on success
     */
    int add_ar(VirtualNetworkTemplate * ars_tmpl, string& error_msg);

    /**
     * Removes an address range from the VNET
     *  @param ar_id of the address range
     *  @param error_msg If the action fails, this message contains the reason.
     *  @return 0 on success
     */
    int rm_ar(unsigned int ar_id, string& error_msg);

    /**
     *  Allocates a new (and empty) address range to the AR pool
     *    @return pointer to the ar added to the AR pool
     */
    AddressRange * allocate_ar()
    {
        return ar_pool.allocate_ar();
    }

    /**
     * Update an address range to the virtual network
     *  @param ars_tmpl template in the form AR = [AR_ID=...]. The address range
     *  is specified by the AR_ID attribute.
     */
    void update_ar(VirtualNetworkTemplate * ars_tmpl);

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
     *    @param vid VM identifier
     *    @param nic the VM NIC attribute to be filled with the lease info.
     *    @param inherit attributes from the address range to include in the NIC
     *    @return 0 if success
     */
    int allocate_addr(int vid, VectorAttribute * nic,
        const vector<string>& inherit)
    {
        return ar_pool.allocate_addr(PoolObjectSQL::VM, vid, nic, inherit);
    }

    /**
     *    Gets a new address lease for a specific VM by MAC
     *    @param vid VM identifier
     *    @param mac the MAC address requested
     *    @param nic the VM NIC attribute to be filled with the lease info.
     *    @param inherit attributes from the address range to include in the NIC
     *    @return 0 if success
     */
    int allocate_by_mac(int vid, const string& mac, VectorAttribute * nic,
        const vector<string>& inherit)
    {
        return ar_pool.allocate_by_mac(mac, PoolObjectSQL::VM, vid, nic, inherit);
    }

    /**
     *    Gets a new address lease for a specific VM by IP
     *    @param vid VM identifier
     *    @param ip the IP address requested
     *    @param nic the VM NIC attribute to be filled with the lease info.
     *    @param inherit attributes from the address range to include in the NIC
     *    @return 0 if success
     */
    int allocate_by_ip(int vid, const string& ip, VectorAttribute * nic,
        const vector<string>& inherit)
    {
        return ar_pool.allocate_by_ip(ip, PoolObjectSQL::VM, vid, nic, inherit);
    }

    /**
     *  Release previously given address lease
     *    @param arid of the address range where the address was leased from
     *    @param vid the ID of the VM
     *    @param mac MAC address identifying the lease
     */
    void free_addr(unsigned int arid, int vid, const string& mac)
    {
        ar_pool.free_addr(arid, PoolObjectSQL::VM, vid, mac);
    }

    /**
     *  Release all previously given address leases to the given object
     *    @param ot the type of the object requesting the address (VM or NET)
     *    @param obid the id of the object requesting the address
     */
    void free_addr_by_owner(PoolObjectSQL::ObjectType ot, int obid)
    {
        ar_pool.free_addr_by_owner(ot, obid);
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

    // *************************************************************************
    // Network Reservation functions
    // *************************************************************************

    int reserve_addr(VirtualNetwork *rvnet, unsigned int rsize, string& error_str);


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

    /**
     *  Returns the parent networks used to create this VNET (if any)
     *    @param parents vector of parents networks if any
     *    @return the number of parents
     */
    unsigned int get_parents(vector<int>& parents)
    {
        return ar_pool.get_parents(parents);
    };

    /**
     * Function to print the VirtualNetwork object into a string in
     * XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    string& to_xml(string& xml) const;

    /**
     * Function to print the object into a string in XML format
     * base64 encoded
     *  @param xml64 the resulting XML string
     *  @param extended return the extended template or the simple one
     *  @return a reference to the generated string
     */
    string& to_xml64(string &xml64, bool extended);

    /**
     * Function to print the VirtualNetwork object into a string in
     * XML format. The extended XML includes the LEASES
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    string& to_xml_extended(string& xml) const;

    /**
     *  Replace the template of the virtual network it also updates the BRIDGE,
     *  PHY_DEV, VLAN_ID and VLAN attributes.
     *    @param tmpl string representation of the template
     */
    int replace_template(const string& tmpl_str, string& error);

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
     *    @return A copy of the VNET Template
     */
    VirtualNetworkTemplate * clone_template() const
    {
        return new VirtualNetworkTemplate(
                *(static_cast<VirtualNetworkTemplate *>(obj_template)));
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
     *  Whether or not to isolate this network with the vnm driver
     */
    int     vlan;

    /**
     *  The Address Range Pool
     */
    AddressRangePool ar_pool;

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
    string& to_xml_extended(string& xml, bool extended) const;

    /**
     *  Rebuilds the object from an xml formatted string
     *    @param xml_str The xml-formatted string
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml(const string &xml_str);

    //**************************************************************************
    // Constructor
    //**************************************************************************

    VirtualNetwork(int                      uid,
                   int                      gid,
                   const string&            _uname,
                   const string&            _gname,
                   int                      _umask,
                   int                      _cluster_id,
                   const string&            _cluster_name,
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
