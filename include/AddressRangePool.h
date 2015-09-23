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

#ifndef ADDRESS_RANGE_POOL_H_
#define ADDRESS_RANGE_POOL_H_

#include <string>
#include <vector>
#include <map>
#include <set>

#include <libxml/parser.h>

#include "Template.h"
#include "PoolObjectSQL.h"

class VectorAttribute;
class AddressRange;

using namespace std;

class AddressRangePool
{
public:
    AddressRangePool();

    virtual ~AddressRangePool();

    // *************************************************************************
    // Inititalization functions
    // *************************************************************************

    /**
     *  Builds the address range from a VectorAttribute. This function is used
     *  to create address ranges.
     *    @param ars the vector of address ranges
     *    @param error_msg describing the error
     *    @return 0 on success
     */
    int from_vattr(VectorAttribute * ar, string& error_msg);

    /**
     *  Builds the address range set from its XML representation. This function
     *  is used to rebuild the address ranges from the DB.
     *    @param node xmlNode for the template
     *    @return 0 on success
     */
    int from_xml_node(const xmlNodePtr node);

    // *************************************************************************
    // Address Range management interface
    // *************************************************************************

    /**
     *  Removes an address range from the pool if it does not contain any used
     *  leases
     *    @param arid of the address range to be removed
     *    @return 0 on success, -1 if not exists or has used addresses
     */
    int rm_ar(unsigned int ar_id, string& error_msg);

    /**
     *  Updates the given address ranges
     *    @param ars vector of address ranges as VectorAttributes obtained from
     *    template in the form AR = [...]. Only one AR is processed.
     *    @param keep_restricted If true, the restricted attributes of the
     *    current template will override the new template
     *    @param error_msg If the action fails, this message contains
     *    the reason.
     *    @return 0 on success
     */
    int update_ar(vector<Attribute *> ars, bool keep_restricted, string& error_msg);

    /**
     *  Allocates a new *empty* address range. It is not added to the pool as it
     *  needs to be initialized. Only the AR_ID is set.
     *    @return the new address range.
     */
    AddressRange * allocate_ar();

    /**
     *  Adds a new address range to the pool. It should be allocated by the
     *  allocate_ar() function.
     *    @param ar the new address range;
     *    @return 0 on success
     */
    int add_ar(AddressRange * ar);

    // *************************************************************************
    // Address allocation interface
    // *************************************************************************

    /**
     *  Allocates an address in a suitable address range from the pool
     *    @param ot the type of the object requesting the address (VM or NET)
     *    @param obid the id of the object requesting the address
     *    @param nic the NIC attribute to be filled with lease attributes
     *    @param inherit attributes to be added to the NIC
     *    @return 0 if success
     */
    int allocate_addr(PoolObjectSQL::ObjectType ot, int obid,
        VectorAttribute * nic, const vector<string> &inherit);

    /**
     *  Allocates an address in a suitable address range from the pool by mac
     *    @param mac the specific MAC address requested
     *    @param ot the type of the object requesting the address (VM or NET)
     *    @param obid the id of the object requesting the address
     *    @param nic the NIC attribute to be filled with lease attributes
     *    @param inherit attributes to be added to the NIC
     *    @return 0 if success
     */
    int allocate_by_mac(const string &mac, PoolObjectSQL::ObjectType ot, int obid,
        VectorAttribute * nic, const vector<string> &inherit);

    /**
     *  Allocates an address in a suitable address range from the pool by mac
     *    @param ip the specific IP address requested
     *    @param ot the type of the object requesting the address (VM or NET)
     *    @param obid the id of the object requesting the address
     *    @param nic the NIC attribute to be filled with lease attributes
     *    @param inherit attributes to be added to the NIC
     *    @return 0 if success
     */
    int allocate_by_ip(const string &ip, PoolObjectSQL::ObjectType ot, int obid,
        VectorAttribute * nic, const vector<string> &inherit);

    /**
     *  Holds an address from the specified address range.
     *    @param arid of the address range
     *    @param ip the ip to hold
     *    @return 0 on success
     */
    int hold_by_ip(unsigned int arid, const string& ip);

    /**
     *  Holds an address from the first address range containing the MAC
     *    @param mac the mac to hold
     *    @return 0 on success
     */
    int hold_by_ip(const string& ip);

    /**
     *  Holds an address from the specified address range.
     *    @param arid of the address range
     *    @param mac the mac to hold
     *    @return 0 on success
     */
    int hold_by_mac(unsigned int arid, const string& mac);

    /**
     *  Holds an address from the first address range containing the MAC
     *    @param mac the mac to hold
     *    @return 0 on success
     */
    int hold_by_mac(const string& mac);

    /**
     *  Frees the given address by MAC on the given address range
     *    @param arid the ID of the address range
     *    @param ot the type of the object requesting the address (VM or NET)
     *    @param obid the id of the object requesting the address
     *    @param mac the specific MAC address requested
     */
    void free_addr(unsigned int arid, PoolObjectSQL::ObjectType ot, int obid,
        const string& mac);

    /**
     *  Frees the given address by IP on the given address range
     *    @param arid the ID of the address range
     *    @param ot the type of the object requesting the address (VM or NET)
     *    @param obid the id of the object requesting the address
     *    @param ip the specific IP address requested
     */
    void free_addr_by_ip(unsigned int arid, PoolObjectSQL::ObjectType ot,
        int obid, const string& ip);

    /**
     *  Frees the given address by MAC from all address ranges containing
     *  the MAC
     *    @param ot the type of the object requesting the address (VM or NET)
     *    @param obid the id of the object requesting the address
     *    @param mac the specific MAC address requested
     */
    void free_addr(PoolObjectSQL::ObjectType ot, int obid, const string& mac);

    /**
     *  Frees the given address by IP from all address ranges containing
     *  the IP
     *    @param ot the type of the object requesting the address (VM or NET)
     *    @param obid the id of the object requesting the address
     *    @param ip the specific IP address requested
     */
    void free_addr_by_ip(PoolObjectSQL::ObjectType ot, int id, const string& ip);

    /**
     *  Frees all the addressed owned by the given object
     *    @param ot the type of the object requesting the address (VM or NET)
     *    @param obid the id of the object requesting the address
     *    @return the number of addresses freed
     */
    int free_addr_by_owner(PoolObjectSQL::ObjectType ot, int obid);

    /**
     *  Frees the given address range
     *    @param arid the ID of the address range
     *    @param ot the type of the object requesting the address (VM or NET)
     *    @param obid the id of the object requesting the address
     *    @param mac the first MAC address in the range
     *    @param rsize size of the address range
     */
    int free_addr_by_range(unsigned int arid, PoolObjectSQL::ObjectType ot,
            int obid, const string& mac, unsigned int rsize);

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
    // Address reservation
    // *************************************************************************

    /**
     *  Reserve a given number of addresses from the first address range with
     *  enough free addresses to allocate the reservation
     *    @param vid the id of the VNET making the reservation
     *    @param size number of addresses to reserve
     *    @param rar a new address range to place the reservation
     *    @return 0 on success
     */
    int reserve_addr(int vid, unsigned int rsize, AddressRange *rar);

    /**
     *  Reserve a given number of addresses from the given address range
     *    @param vid the id of the VNET making the reservation
     *    @param rsize number of addresses to reserve
     *    @param ar_id the address range to reserve the addresses from
     *    @param rar a new address range to place the reservation
     *    @return 0 on success
     */
    int reserve_addr(int vid, unsigned int rsize, unsigned int ar_id,
        AddressRange *rar);

    /**
     *  Reserve a number of addresses from an address range from a given ip
     *    @param vid the id of the VNET making the reservation
     *    @param rsize number of addresses to reserve
     *    @param ar_id the address range to reserve the addresses from
     *    @param ip the first IP in the reservation
     *    @param rar a new address range to place the reservation
     *    @return 0 on success
     */
    int reserve_addr_by_ip(int vid, unsigned int rsize, unsigned int ar_id,
        const string& ip, AddressRange *rar);

    /**
     *  Reserve a number of addresses from an address range from a given ip
     *    @param vid the id of the VNET making the reservation
     *    @param rsize number of addresses to reserve
     *    @param ar_id the address range to reserve the addresses from
     *    @param mac the first IP in the reservation
     *    @param rar a new address range to place the reservation
     *    @return 0 on success
     */
    int reserve_addr_by_mac(int vid, unsigned int rsize, unsigned int ar_id,
        const string& mac, AddressRange *rar);

    // *************************************************************************
    // Helpers & Formatting
    // *************************************************************************

    /**
     *  Return the number of used addresses
     */
    unsigned int get_used_addr() const
    {
        return used_addr;
    }

    /**
     *  Return the total number addresses
     */
    unsigned int get_size() const;

    /**
     *  Return the parent id of an address range
     *    @param ar_id of the address range
     *    @return the parent ar id, -1 if none
     */
    int get_ar_parent(int ar_id) const;

    /**
     *  Gets an attribute from the Address Range
     *    @param name of the attribute
     *    @param value of the attribute
     *    @param ar_id to get the attribute from
     */
    void get_attribute(const char * name, string& value, int ar_id) const;

    /**
     *  Gets an attribute from the Address Range, int version
     *    @param name of the attribute
     *    @param value of the attribute
     *    @param ar_id to get the attribute from
     *    @return 0 on success
     */
    int get_attribute(const char * name, int& value, int ar_id) const;

    /**
     *  Gets a reference to a the security group set of an AR
     *    @return a reference to the security group set or empty set if error
     */
    const set<int>& get_security_groups(int ar_id) const;

    /**
     *  Generate a XML representation of the Address Range Pool
     *    @param sstream where the ARPool is written
     *    @param extended true to include lease information
     *    @param vm_ids list of VM the user can access VNET usage info from.
     *      A vector containing just -1 means all VMs.
     *    @param vnet_ids list of VNET the user can access reservation info from.
     *      A vector containing just -1 means all VNETs.
     *    @return the string with the XML
     */
    string& to_xml(string& sstream, bool extended, const vector<int>& vms,
        const vector<int>& vnets) const;

private:
    /**
     *  Stores the Address Ranges in a template form. This template is used
     *  to store the pool in the DB
     */
    Template ar_template;

    /**
     *  ID for the next Address Range
     */
    unsigned int next_ar;

    /**
     *  Map to access each range
     */
    map<unsigned int, AddressRange *> ar_pool;

    /**
     *  Used addresses
     */
    unsigned int used_addr;
};

#endif
