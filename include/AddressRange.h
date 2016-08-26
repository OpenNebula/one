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

#ifndef ADDRESS_RANGE_H_
#define ADDRESS_RANGE_H_

#include <string>
#include <set>
#include <vector>

#include "PoolObjectSQL.h"
#include "AddressRangePool.h"

using namespace std;

class VectorAttribute;

/**
 *  The Lease class represents an address lease from a Virtual Network.
 */
class AddressRange
{
public:

    AddressRange(string _ipam_mad, unsigned int _id):ipam_mad(_ipam_mad),id(_id),next(0),used_addr(0){};

    virtual ~AddressRange(){};

    // *************************************************************************
    // Address Range types
    // *************************************************************************

    /**
     *  Type of Addresses defined by this address range
     */
    enum AddressType
    {
        NONE  = 0x00000000, /** Undefined Address Type */
        ETHER = 0x00000001, /** MAC address type */
        IP4   = 0x00000003, /** IP version 4 address */
        IP6   = 0x00000005, /** IP version 6 address */
        IP4_6 = 0x00000007  /** IP dual stack version 4 & 6 addresses */
    };

    /**
     *  Return the string representation of an AddressType
     *    @param ob the type
     *    @return the string
     */
    static string type_to_str(AddressType ob);

    /**
     *  Return the string representation of an AddressType
     *    @param ob the type
     *    @return the string
     */
    static AddressType str_to_type(string& str_type);

    // *************************************************************************
    // Address Range initialization functions
    // *************************************************************************

    /**
     *  Return an AddressRangeInternal or AddressRangeIPAM
     *    @param ipam_mad the driver name
     *    @next_ar id of the next address range
     *    @return the new address range
     */
    static AddressRange * new_ar_by_type(string ipam_mad, unsigned int next_ar); 

    /**
     *  Init an Address Range based on a vector attribute the following
     *  attributes will be parsed (* are optional):
     *    - TYPE = ETHER | IP4 | IP6 | IP4_6
     *    - SIZE
     *    - MAC
     *    - IP
     *    - ULA_PREFIX
     *    - GLOBAL_PREFIX
     *
     *  The following can be defined to override VNET values:
     *    - BRIDGE
     *    - VLAN_ID
     *    - PHYDEV
     *
     *  Any value defined in the INHERIT_VNET_ATTR can be defined as well.
     *
     *  Any value for context can be included in the AR.
     *
     * Example:
     *   - AR = [ TYPE = "ETHER", SIZE = 128, MAC = "00:02:01:02:03:04"]
     *   - AR = [ TYPE = "ETHER", SIZE = 128]
     *   - AR = [ TYPE = IP4,
     *            SIZE = 256,
     *            IP   = 10.0.0.0,
     *            DNS  = 10.0.0.5]
     *   - AR = [ TYPE = "IP6",
     *            SIZE = 1024,
     *            ULA_PREFIX    = "fd00:0:0:1::",
     *            GLOBAL_PREFIX = "2001::"]
     */
    int from_vattr(VectorAttribute * attr, string& error_msg);

    /**
     *  Builds an Address Range from a vector attribute stored in the DB
     *    @param vattr the VectorAttribute stored in a ADDRESS_RANGE template
     */
    int from_vattr_db(VectorAttribute *vattr);

    /**
     *  Builds an extended XML representation of the AR to send it back to
     *  clients
     *    @param oss stream to write the XML
     *    @param vm_ids list of VM the user can access VNET usage info from.
     *      A vector containing just -1 means all VMs.
     *    @param vnet_ids list of VNET the user can access reservation info from.
     *      A vector containing just -1 means all VNETs.
     *    @param vrs list of VRouter the user can access VNET usage info from.
     *      A vector containing just -1 means all VRouters.
     */
    void to_xml(ostringstream &oss, const vector<int>& vms,
        const vector<int>& vnets, const vector<int>& vrs) const;

    // *************************************************************************
    // Address allocation functions
    // *************************************************************************

    /**
     *  Returns an unused address, which becomes used and fills a NIC attribute
     *  with the configuration parameters from the address range.
     *    @param ot the type of the object allocating the address
     *    @param obid the id of the object
     *    @param nic the VM NIC attribute
     *    @param inherit attributes to be added to the NIC attribute
     *    @return 0 if success
     */
    int allocate_addr(PoolObjectSQL::ObjectType ot, int obid,
        VectorAttribute * nic, const vector<string> &inherit);

    /**
     *  Returns the specific address by mac if is not allocated. The NIC attr
     *  is filled with the configuration parameters from the address range.
     *    @param mac the mac address
     *    @param ot the type of the object allocating the address
     *    @param obid the id of the object
     *    @param nic the VM NIC attribute
     *    @param inherit attributes to be added to the NIC attribute
     *    @return 0 if success
     */
    int allocate_by_mac(const string& mac, PoolObjectSQL::ObjectType ot,
        int obid, VectorAttribute * nic, const vector<string> &inherit);

    /**
     *  Returns the specific address by ip if is not allocated. The NIC attr
     *  is filled with the configuration parameters from the address range.
     *    @param ot the type of the object allocating the address
     *    @param obid the id of the object
     *    @param nic the VM NIC attribute
     *    @param inherit attributes to be added to the NIC attribute
     *    @return 0 if success
     */
    int allocate_by_ip(const string& ip, PoolObjectSQL::ObjectType ot,
        int obid, VectorAttribute * nic, const vector<string> &inherit);

    /**
     *  Sets the given ip on hold, the address is associated to a VM of id -1.
     *    @param ip the ip to hold
     */
    int hold_by_ip(const string& ip);

    /**
     *  Sets the given mac on hold, the address is associated to a VM of id -1.
     *    @param mac the mac to hold
     */
    int hold_by_mac(const string& mac);

    /**
     *  Frees a previous allocated address, referenced by its MAC address
     *  @param ot the object type of the owner of the address
     *  @param obid the id of the owner of the address
     *  @param mac the MAC address in string form
     *  @return 0 if the address was freed
     */
    int free_addr(PoolObjectSQL::ObjectType ot, int obid, const string& mac);

    /**
     *  Frees a previous allocated address, referenced by its IP address
     *  @param ot the object type of the owner of the address
     *  @param obid the id of the owner of the address
     *  @param ip the IP address in string form
     *  @return 0 if the address was freed
     */
    int free_addr_by_ip(PoolObjectSQL::ObjectType ot, int id, const string& ip);

    /**
     *  Frees all previous allocated address to the given object
     *  @param ot the object type of the owner of the address
     *  @param obid the id of the owner of the address
     *  @return the number of addresses freed
     */
    int free_addr_by_owner(PoolObjectSQL::ObjectType ot, int obid);

    /**
     *  Frees a previous allocated address range, referenced by its MAC address
     *  and size
     *  @param ot the object type of the owner of the address
     *  @param obid the id of the owner of the address
     *  @param mac the first MAC address in string form
     *  @param rsize the size of the range
     *  @return the number of addresses freed
     */
    int free_addr_by_range(PoolObjectSQL::ObjectType ot, int obid,
        const string& mac, unsigned int rsize);

    /**
     * Adds the relevant AR definition attributes to the Security Group rule
     *
     * @param rule rule to modify
     */
    void process_security_rule(VectorAttribute * rule);

    // *************************************************************************
    // Address Reservation
    // *************************************************************************

    /**
     *  Reserve a given number of addresses from this address range
     *    @param vid the id of the VNET making the reservation
     *    @param size number of addresses to reserve
     *    @param rar a new address range to place the reservation
     *    @return 0 on success
     */
    int reserve_addr(int vid, unsigned int rsize, AddressRange *rar);

    /**
     *  Reserve a given number of addresses from this address range
     *    @param vid the id of the VNET making the reservation
     *    @param size number of addresses to reserve
     *    @param rar a new address range to place the reservation
     *    @param ip the firs ip in the Reservation
     *    @return 0 on success
     */
    int reserve_addr_by_ip(int vid, unsigned int rsize, const string& ip,
        AddressRange *rar);

    /**
     *  Reserve a given number of addresses from this address range
     *    @param vid the id of the VNET making the reservation
     *    @param size number of addresses to reserve
     *    @param rar a new address range to place the reservation
     *    @param mac the firs mac in the Reservation
     *    @return 0 on success
     */
    int reserve_addr_by_mac(int vid, unsigned int rsize, const string& mac,
        AddressRange *rar);

    // *************************************************************************
    // Helpers
    // *************************************************************************

    /**
     *  Return the id for this address range
     */
    unsigned int ar_id() const
    {
        return id;
    }

    /**
     *  Return the number of used addresses
     */
    virtual int get_used_addr(unsigned int &_used_addr) const = 0;

    /**
     * Return the number of used addresses in allocated map
     */
    unsigned int get_one_used_addr() const
    {
        return used_addr;
    }

    /**
     *  Return the number of free addresses
     */
    int get_unused_addr(unsigned int &_unused_addr) const;

    /**
     *  Return the total number of addresses
     */
    unsigned int get_size() const
    {
        return size;
    }

    /**
     *  Return the IPAM_MAD
     */
    string get_ipam_mad() const
    {
        return ipam_mad;
    }

    /**
     *  Returns the string value of an Address Range Attribute
     *    @param name of the attribute
     *    @return the value of the attribute if found, empty otherwise
     */
    string get_attribute(const char *name) const
    {
        return attr->vector_value(name);
    }

    /**
     *  Returns the int value of an Address Range Attribute
     *    @param name of the attribute
     *    @param value of the attribute
     *    @return 0 on success
     */
    int get_attribute(const char *name, int& value) const
    {
        return attr->vector_value(name, value);
    }

    /**
     *  Updates the Address Range with the attributes provided. The following
     *  CANNOT be updated: TYPE, SIZE, IP, MAC (plus the internal AR_ID and
     *  ALLOCATED)
     *    @param vup the new vector attributes for the address range
     *    @param error_msg If the action fails, this message contains
     *    the reason.
     *    @return 0 on success
     */
    int update_attributes(
            VectorAttribute *   vup,
            bool                keep_restricted,
            string&             error_msg);

    /**
     *  Get the security groups for this AR.
     *    @return a reference to the security group set
     */
    const set<int>& get_security_groups() const
    {
        return security_groups;
    }

    /*
     *  add_ar from AddressRangePool needs to access the internal representation
     *  of the AR to include it in the ARPool template.
     */
    friend int AddressRangePool::add_ar(AddressRange * ar);

    static void set_restricted_attributes(vector<const SingleAttribute *>& rattrs);

protected:
    /* ---------------------------------------------------------------------- */
    /* String to binary conversion functions for different address types      */
    /* ---------------------------------------------------------------------- */

    /**
     *  MAC to binary (48 bits)
     *    @param mac in string form 00:02:01:02:03:04
     *    @return 0 on success
     */
    int mac_to_i(string mac, unsigned int i_mac[]) const;

    /**
     *  MAC to string
     *    @param mac in array form
     */
    string mac_to_s(const unsigned int mac[]) const;

    /**
     *  IP4_SUBNET prefix conversion
     *  @param subnet in string form 192.168.0.0/24
     *  @param i_ip4_subnet unsigned int array
     *  @return 0 on success
     */
    int ip4_subnet_to_i(const string& subnet, unsigned int i_ip4_subnet[]) const;

    /**
     *  IP4_SUBNET to string
     *  @param i_ip4_subnet unsigned int array
     *  @return string notation
     */
    string ip4_subnet_to_s(const unsigned int i_ip4_subnet[]) const;

    /**
     *  Checks that address range fit in the IPv4 subnet
     */
    int check_ip4_subnet() const;
    int check_ip4_subnet(unsigned int size) const;

    /**
     *  IP version 4 to binary (32 bits)
     *    @param ip in string form 192.168.0.2
     *    @return 0 on success
     */
    int ip_to_i(const string& _ip, unsigned int& i_ip) const;

    /**
     * IP version 4 to dot notation
     *
     * @param i_ip Numeric (32 bits) IP
     * @return dot notation
     */
    string ip_to_s(unsigned int i_ip) const;

    /**
     *  IPv6 64bits prefix conversion
     *    @param prefix in string form 2a00:1bc0:b001:A::
     *    @return 0 on success
     */
    int prefix6_to_i(const string& prefix, unsigned int ip[]) const;

    /**
     * IPv6 to string
     * @param prefix Numeric IPv6 prefix
     * @param mac Numeric (48 bits) mac address
     * @param ip6_s Will contain the resulting IPv6 string
     * @return 0 on success
     */
    int ip6_to_s(const unsigned int prefix[], const unsigned int mac[], string& ip6_s) const;

    /* ---------------------------------------------------------------------- */
    /* NIC setup functions                                                    */
    /* ---------------------------------------------------------------------- */
    /**
     *  Writes MAC address to the given NIC attribute
     *    @param addr_index internal index for the lease
     *    @param nic attribute of a VMTemplate
     */
    void set_mac(unsigned int addr_index, VectorAttribute * nic) const;

    /**
     *  Writes IP address to the given NIC attribute
     *    @param addr_index internal index for the lease
     *    @param nic attribute of a VMTemplate
     */
    void set_ip(unsigned int addr_index, VectorAttribute * nic) const;

    /**
     *  Writes IPv6 address to the given NIC attribute
     *    @param addr_index internal index for the lease
     *    @param nic attribute of a VMTemplate
     */
    void set_ip6(unsigned int addr_index, VectorAttribute * nic) const;

    /**
     *  Writes VNET configuration attributes to the given NIC attribute. It
     *  includes: BRIDGE, VLAN_ID, PHYDEV and INHERIT_VNET_ATTR in oned.conf
     *    @param addr_index internal index for the lease
     *    @param nic attribute of a VMTemplate
     */
    void set_vnet(VectorAttribute *nic, const vector<string> &inherit) const;

    /* ---------------------------------------------------------------------- */
    /* Address index map helper functions                                     */
    /* ---------------------------------------------------------------------- */

    /**
     *  This function generates a string representation of the in-memory allocated
     *  addresses. It'll be stored along side the AR vector attribute in the
     *  ADDRESS_RANGE template.
     */
    void allocated_to_attr();

    /**
     *  Generates a memory map for the addresses.
     *    @param allocated_s the string representation of the allocated addresses
     *    generated by allocated_to_attr()
     *    @return 0 on success
     */
    int  attr_to_allocated(const string& allocated_s);

    /**
     * Get a free address 
     * @param index the index
     * @return 0 on success
     */
    virtual int get_free_addr(unsigned int &index) = 0;

    /**
     * Get a free address range
     * @param index the index
     * @param rsize the size of the range
     * @return 0 on success
     */
    virtual int get_free_addr_range(unsigned int &index, unsigned int rsize) = 0;

    /**
     * Register an address
     * @param index the index
     * @return 0 on success
     */
    virtual int register_addr(unsigned int index) = 0;

    /**
     * Register an address range
     * @param index the index
     * @param rsize the size of the range
     * @return 0 on success
     */
    virtual int register_addr_range(unsigned int index, unsigned int rsize) = 0;

    /**
     * Free an address
     * @param index the index
     * @return 0 on success
     */
    virtual int free_addr(unsigned int index) = 0;

    /**
     *  Adds a new allocated address to the map. Updates the ALLOCATED attribute
     */
    void allocate_addr(PoolObjectSQL::ObjectType ot, int obid,
        unsigned int addr_index);

    /**
     *  Frees an address from the map. Updates the ALLOCATED attribute
     */
    int free_addr(PoolObjectSQL::ObjectType ot, int obid,
        unsigned int addr_index);

    void reserve_addr_range(int vid, unsigned int rsize,
        unsigned int sindex, AddressRange *rar);

    /**
     *  Reserve a set of addresses from an starting one
     *    @param vid the id of the VNET making the reservation
     *    @param rsize number of addresses to reserve
     *    @param sindex the first index to start the reservation
     *    @param rar a new address range to place the reservation
     *    @return 0 on success
     */
    int reserve_addr_by_index(int vid, unsigned int rsize, unsigned int sindex,
        AddressRange *rar);

    /* ---------------------------------------------------------------------- */
    /* Restricted Attributes functions                                        */
    /* ---------------------------------------------------------------------- */
    bool check(string& rs_attr) const;

    /**
     * Deletes all restricted attributes
     */
    void remove_restricted(VectorAttribute* va);

    /**
     * Deletes all the attributes, except the restricted ones
     */
    void remove_all_except_restricted(VectorAttribute* va);

    /* ---------------------------------------------------------------------- */
    /* IPAM                                                                   */
    /* ---------------------------------------------------------------------- */
    /**
     * IPAM driver name
     */
    string ipam_mad;

    /* ---------------------------------------------------------------------- */
    /* Address Range data                                                     */
    /* ---------------------------------------------------------------------- */
    /**
     *  The type of addresses defined in the range
     */
    AddressType type;

    /**
     *  ID for this range, unique within the Virtual Network
     */
    unsigned int id;

    /**
     *  IPv4 subnet for this range
     */
    unsigned int ip4_subnet[2];

    /**
     *  Number of addresses in the range
     */
    unsigned int size;

    /**
     *  First IP4 in the range
     */
    unsigned int ip;

    /**
     *  First MAC in the range
     */
    unsigned int mac[2];

    /**
     *  Binary representation of the IPv6 address global unicast prefix
     */
    unsigned int global6[2];

    /**
     *  Binary representation of the IPv6 address site unicast prefix
     */
    unsigned int ula6[2];

    /**
     *  Security Group IDs for this Address Range
     */
    set<int> security_groups;

    /**
     *  The Address Range attributes as a Template VectorAttribute. This is
     *  used to generate XML or a template representation of the AR.
     */
    VectorAttribute * attr;

    /* ---------------------------------------------------------------------- */
    /* Allocated address & control                                            */
    /* ---------------------------------------------------------------------- */
    /**
     *  Map to store the allocated address indexed by the address index relative
     *  to the mac/ip values. It contains also the type and id of the object
     *  owning the address ObjectType(32bits) | Object ID (32)
     */
    map<unsigned int, long long> allocated;

    unsigned int next;

    unsigned int used_addr;

    /* ---------------------------------------------------------------------- */
    /* Restricted Attributes                                                  */
    /* ---------------------------------------------------------------------- */
    /**
     *  TRUE if restricted attributes have been defined for Address Ranges
     */
    static bool restricted_set;

    /**
     *  The restricted attributes from oned.conf
     */
    static set<string> restricted_attributes;

    /**
     *  Attributes to be process for Security Group rules
     */
    const static char * SG_RULE_ATTRIBUTES[];

    const static int  NUM_SG_RULE_ATTRIBUTES;
};

#endif
