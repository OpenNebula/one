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

#ifndef ADDRESS_RANGE_H_
#define ADDRESS_RANGE_H_

#include <string>
#include <set>
#include <vector>

#include "PoolObjectSQL.h"
#include "AddressRangePool.h"

class VectorAttribute;

/**
 *  The Lease class represents an address lease from a Virtual Network.
 */
class AddressRange
{
public:

    virtual ~AddressRange() {};

    // *************************************************************************
    // Address Range types
    /// *************************************************************************

    /**
     *  Type of Addresses defined by this address range
     *  Constants are encoded as follows:
     *
     *  option bits    address family bits
     *            ---+----+----+
     *           ...*|0000|****|
     *           ----+----+||||+
     *                     |||\___ AR with Ethernet addresses
     *                     ||\____ AR with IPv4 addresses
     *                     |\_____ AR with IPv6 addresses (SLAAC)
     *                     \______ AR with IPv6 addresses (static, non-SLAAC)
     */
    enum AddressType
    {
        NONE         = 0x00000000, /** Undefined Address Type */
        ETHER        = 0x00000001, /** MAC address type */
        IP4          = 0x00000003, /** MAC + IP4 address */
        IP6          = 0x00000005, /** MAC + IP6 address */
        IP6_STATIC   = 0x00000009, /** MAC + IP6 (no-SLAAC) address */
        IP4_6        = 0x00000007, /** MAC + IP4 + IP6  addresses */
        IP4_6_STATIC = 0x0000000B, /** MAC + IP4 + IP6 (no-SLAAC) addresses */
    };

    /**
     *  Return the string representation of an AddressType
     *    @param ob the type
     *    @return the string
     */
    static std::string type_to_str(AddressType ob);

    /**
     *  Return the string representation of an AddressType
     *    @param ob the type
     *    @return the string
     */
    static AddressType str_to_type(std::string& str_type);

    /**
     *  Return true if the address range includes IPv4 addresses
     */
    bool is_ipv4() const
    {
        return (type & 0x00000002) != 0;
    }

    /**
     *  Return true if the address range includes IPv6 addresses
     */
    bool is_ipv6() const
    {
        return (type & 0x00000004) != 0;
    }

    /**
     *  Return true if the address range includes static IPv6 addresses (host id
     *  is manually defined)
     */
    bool is_ipv6_static() const
    {
        return (type & 0x00000008) != 0;
    }

    bool is_ipam() const
    {
        return !attr->vector_value("IPAM_MAD").empty() && attr->vector_value("IPAM_MAD") != "internal";
    }

    // *************************************************************************
    // Address Range initialization functions
    // *************************************************************************

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
     *
     * NOTE: This function is part of the AddressRange interface. The AR
     * implementation may contact an external IPAM to complete or validate
     * the AR allocation request.
     */
    virtual int from_vattr(VectorAttribute * attr, std::string& error_msg) = 0;

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
    void to_xml(std::ostringstream &oss, const std::vector<int>& vms,
                const std::vector<int>& vnets, const std::vector<int>& vrs) const;

    /**
     *  Same as above but without the LEASES section
     */
    void to_xml(std::ostringstream &oss) const;


    // *************************************************************************
    // Address allocation functions
    // *************************************************************************

    /**
     * Generate a random L2 lease for a NIC, this address is not actually
     * allocated in any AR
     */
    static int allocate_random_addr(VectorAttribute *nic);

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
                      VectorAttribute * nic, const std::set<std::string> &inherit);

    /**
     *  Returns the specific address by mac/ip if is not allocated. The NIC attr
     *  is filled with the configuration parameters from the address range.
     *    @param mac the mac address
     *    @param ot the type of the object allocating the address
     *    @param obid the id of the object
     *    @param nic the VM NIC attribute
     *    @param inherit attributes to be added to the NIC attribute
     *    @return 0 if success
     */
    int allocate_by_mac(const std::string& mac, PoolObjectSQL::ObjectType ot,
                        int obid, VectorAttribute * nic, const std::set<std::string> &inherit);

    int allocate_by_ip(const std::string& ip, PoolObjectSQL::ObjectType ot,
                       int obid, VectorAttribute * nic, const std::set<std::string> &inherit);

    int allocate_by_ip6(const std::string& ip6, PoolObjectSQL::ObjectType ot,
                        int obid, VectorAttribute * nic, const std::set<std::string> &inherit);

    /**
     *  Sets the given ip/mac on hold, the address is associated to a VM of
     *  id -1.
     *    @param ip/mac the ip to hold
     */
    int hold_by_mac(const std::string& mac);

    int hold_by_ip(const std::string& ip);

    int hold_by_ip6(const std::string& ip);

    /**
     *  Frees a previous allocated address, referenced by its MAC/IP address
     *  @param ot the object type of the owner of the address
     *  @param obid the id of the owner of the address
     *  @param mac/ip the MAC/IP address in string form
     *  @return 0 if the address was freed
     */
    int free_addr(PoolObjectSQL::ObjectType ot, int obid, const std::string& mac);

    int free_addr_by_ip(PoolObjectSQL::ObjectType ot, int id, const std::string& ip);

    int free_addr_by_ip6(PoolObjectSQL::ObjectType ot, int id, const std::string& ip);

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
                           const std::string& mac, unsigned int rsize);

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
     *    @param ip/mac the firs ip in the Reservation
     *    @return 0 on success
     */
    int reserve_addr_by_mac(int vid, unsigned int rsize, const std::string& mac,
                            AddressRange *rar);

    int reserve_addr_by_ip(int vid, unsigned int rsize, const std::string& ip,
                           AddressRange *rar);

    int reserve_addr_by_ip6(int vid, unsigned int rsize, const std::string& ip,
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
    unsigned long int get_used_addr() const
    {
        return allocated.size();
    }

    /**
     *  Return the number of free addresses
     */
    unsigned long int get_free_addr() const
    {
        return size - allocated.size();
    }

    void get_ids(std::set<int>& ids, PoolObjectSQL::ObjectType ob) const
    {
        for (const auto& lease: allocated)
        {
            if (lease.second & ob)
            {
                ids.emplace(lease.second & 0x00000000FFFFFFFFLL);
            }
        }
    }

    /**
     *  Return the total number of addresses
     */
    unsigned long int get_size() const
    {
        return size;
    }

    /**
     *  Returns the string value of an Address Range Attribute
     *    @param name of the attribute
     *    @return the value of the attribute if found, empty otherwise
     */
    std::string get_attribute(const std::string& name) const
    {
        return attr->vector_value(name);
    }

    /**
     *  Returns the value of an Address Range Attribute
     *    @param name of the attribute
     *    @param value of the attribute
     *    @return 0 on success
     */
    template<typename T>
    int get_attribute(const std::string& name, T& value) const
    {
        return attr->vector_value(name, value);
    }

    /**
     *  Updates the Address Range with the attributes provided. The following
     *  CANNOT be updated: TYPE, SIZE, IP, MAC (plus the internal AR_ID and
     *  ALLOCATED)
     *    @param vup the new vector attributes for the address range
     *    @param update_attr Updated attributes with old values. Caller must
     *      release the pointer.
     *    @param error_msg If the action fails, this message contains
     *    the reason.
     *    @return 0 on success
     */
    int update_attributes(
            VectorAttribute *  vup,
            bool               keep_restricted,
            std::set<int>&     ids,
            std::unique_ptr<VectorAttribute>& update_attr,
            std::string&       error_msg);

    /**
     *  Helper function to initialize restricte attributes of an AddressRange
     */
    static void set_restricted_attributes(std::vector<const SingleAttribute *>& ras);

    /**
     *  Get the security groups for this AR.
     *    @return a reference to the security group set
     */
    const std::set<int>& get_security_groups() const
    {
        return security_groups;
    }

    /**
     *  Copy security groups into set
     */
    void get_security_groups(std::set<int>& sgs) const
    {
        for (auto sg : security_groups)
        {
            sgs.insert(sg);
        }
    }

    /*
     *  Decrypts the address range attributes
     */
    void decrypt();

    /*
     *  add_ar from AddressRangePool needs to access the internal representation
     *  of the AR to include it in the ARPool template.
     */
    friend int AddressRangePool::add_ar(AddressRange * ar);

    /*
     *  rm_ar from AddressRangePool needs to access the internal representation
     *  of the AR to remove it from the ARPool template.
     */
    friend int AddressRangePool::rm_ar(unsigned int ar_id, bool force,
                                       std::string& error_msg);

    /*
     *  rm_ars from AddressRangePool needs to access the internal representation
     *  of the AR to remove it from the ARPool template.
     */
    friend int AddressRangePool::rm_ars(std::string& error_msg);

protected:
    /**
     *  Base constructor it cannot be called directly but from the
     *  AddressRange factory constructor.
     */
    AddressRange(unsigned int _id):id(_id) {};

    /* ---------------------------------------------------------------------- */
    /* Address/AR helper functions to build/parse driver messages             */
    /* ---------------------------------------------------------------------- */
    /**
     * Builds the AddressRange from its vector attribute representation
     */
    int from_attr(VectorAttribute * attr, std::string& error_msg);

    /**
     *  Builds an address request representation in XML form:
     *  <ADDRESS>
     *    <IP>
     *    <MAC>
     *    <IP6_ULA>
     *    <IP6_GLOBAL>
     *    <IP6>
     *    <SIZE>
     *
     *    @param index for the address
     *    @param size number of addresses in this request
     *    @param oss string stream to write the request to
     */
    void addr_to_xml(unsigned int index, unsigned int size,
                     std::ostringstream& oss) const;

    /**
     *  Check if the given MAC is valid for this address range by verifying:
     *    - Correct : notation
     *    - Part of the AR
     *
     *    @param index of the MAC in the AR
     *    @param mac_s string representation of the MAC in : notation
     *    @param check_free apart from previous checks
     *
     *    @return true if the MAC is valid
     */
    bool is_valid_mac(unsigned int& index, const std::string& mac_s,
                      bool check_free);

    /**
     *  Check if the given IP is valid for this address range by verifying:
     *    - AR is of type IP4 or IP4_6
     *    - Correct . notation
     *    - Part of the AR
     *
     *    @param index of the IP in the AR
     *    @param ip_s string representation of the IP in . notation
     *    @param check_free apart from previous checks
     *
     *    @return true if the IP is valid
     */
    bool is_valid_ip(unsigned int& index, const std::string& ip_s,
                     bool check_free) const;

    /**
     *  Check if the given IP is valid for this address range by verifying:
     *    - AR is of type IP6_STATIC or IP4_6_STATIC
     *    - Correct : notation
     *    - Part of the AR
     *
     *    @param index of the IP in the AR
     *    @param ip6_s string representation of the IP in : notation
     *    @param check_free apart from previous checks
     *
     *    @return true if the IP is valid
     */
    bool is_valid_ip6(unsigned int& index, const std::string& ip_s,
                      bool check_free);

    /* ---------------------------------------------------------------------- */
    /* Implementation specific address management interface                   */
    /* ---------------------------------------------------------------------- */
    /**
     *  Sets the given range of addresses (by index) as used
     *    @param ix the first address to set as used
     *    @param sz number of addresses to set
     *    @param mg describing the error if any
     *
     *    @return 0 if success
     */
    virtual int allocate_addr(unsigned int ix, unsigned int sz,
                              std::string& mg) = 0;
    /**
     *  Gets a range of free addresses
     *    @param index the first address in the range
     *    @param size number of addresses requested in the range
     *    @param msg describing the error if any
     *
     *    @return 0 if success
     */
    virtual int get_addr(unsigned int& index, unsigned int sz,
                         std::string& msg) = 0;

    /**
     *  Sets the given address (by index) as free
     *    @param index of the address
     *    @param msg describing the error if any
     *
     *    @return 0 if success
     */
    virtual int free_addr(unsigned int index, std::string& msg) = 0;

    /* ---------------------------------------------------------------------- */
    /* Allocated addresses                                                    */
    /* ---------------------------------------------------------------------- */
    /**
     *  Map to store the allocated address indexed by the address index relative
     *  to the mac/ip values. It contains also the type and id of the object
     *  owning the address.
     *
     *              +--------------------+--------------------+
     *  index ----> | ObjectType(32bits) | Object ID (32bits) |
     *              +--------------------+--------------------+
     *
     *  Address = First Address + index
     */
    std::map<unsigned int, long long> allocated;

private:
    /* ---------------------------------------------------------------------- */
    /* String to binary conversion functions for different address types      */
    /* ---------------------------------------------------------------------- */
    /**
     *  MAC to binary (48 bits)
     *    @param mac in string form 00:02:01:02:03:04
     *    @return 0 on success
     */
    static int mac_to_i(std::string mac, unsigned int i_mac[]);

    /**
     *  MAC to string
     *    @param mac in array form
     */
    static std::string mac_to_s(const unsigned int mac[]);

    /**
     *  IP version 4 to binary (32 bits)
     *    @param ip in string form 192.168.0.2
     *    @return 0 on success
     */
    static int ip_to_i(const std::string& _ip, unsigned int& i_ip);

    /**
     *  IP version 6 to binary (32 bits)
     *    @param ip string form 2a00:1bc0:b001:A::3
     *    @return 0 on success
     */
    static int ip6_to_i(const std::string& _ip, unsigned int i_ip[]);

    /**
     * IP version 4 to dot notation
     *
     * @param i_ip Numeric (32 bits) IP
     * @return dot notation
     */
    static std::string ip_to_s(unsigned int i_ip);

    /**
     *  IPv6 64bits prefix conversion
     *    @param prefix in string form 2a00:1bc0:b001:A::
     *    @return 0 on success
     */
    static int prefix6_to_i(const std::string& prefix, unsigned int ip[]);

    /**
     * IPv6 to string
     * @param prefix Numeric IPv6 prefix
     * @param mac Numeric (48 bits) mac address
     * @param ip6_s Will contain the resulting IPv6 string
     * @return 0 on success
     */
    static int ip6_to_s(const unsigned int prefix[], const unsigned int mac[],
                        std::string& ip6_s);

    static int ip6_to_s(const unsigned int ip6_i[], std::string& ip6_s);

    /* ---------------------------------------------------------------------- */
    /* NIC setup functions                                                    */
    /* ---------------------------------------------------------------------- */

    /**
     *  Writes EXTERNAL_PORT_RANGE and INTERNAL_PORT_RANGE to allocate Forward
     *  ports to an address lease.
     *    @param addr_index internal index for the lease
     *    @param nic attribute of a VMTemplate
     */
    void set_port_ranges(unsigned int addr_index, VectorAttribute * nic) const;

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
     *  Writes IPv6 address (no-slaac) to the given NIC attribute
     *    @param addr_index internal index for the lease
     *    @param nic attribute of a VMTemplate
     */
    void set_ip6_static(unsigned int addr_index, VectorAttribute * nic) const;

    /**
     *  Writes VNET configuration attributes to the given NIC attribute. It
     *  includes: BRIDGE, VLAN_ID, PHYDEV and INHERIT_VNET_ATTR in oned.conf
     *    @param addr_index internal index for the lease
     *    @param nic attribute of a VMTemplate
     */
    void set_vnet(VectorAttribute *nic,
                  const std::set<std::string> &inherit) const;

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
    int  attr_to_allocated(const std::string& allocated_s);

    /**
     *  Adds a new allocated address to the map. Updates the ALLOCATED attribute
     */
    void set_allocated_addr(PoolObjectSQL::ObjectType ot, int obid,
                            unsigned int addr_index);

    /**
     *  Sets the address lease as used and fills a NIC attribute with the
     *  configuration parameters from the address range.
     *    @param index of the lease in the address range
     *    @param ot the type of the object allocating the address
     *    @param obid the id of the object
     *    @param nic the VM NIC attribute
     *    @param inherit attributes to be added to the NIC attribute
     *    @return 0 if success
     */
    void allocate_by_index(unsigned int index,
                           PoolObjectSQL::ObjectType       ot,
                           int                             obid,
                           VectorAttribute*                nic,
                           const std::set<std::string>&    inherit);

    /**
     *  Frees an address from the map. Updates the ALLOCATED attribute
     */
    int free_allocated_addr(PoolObjectSQL::ObjectType ot, int obid,
                            unsigned int addr_index);

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
    /**
     *  Function to parse the IPv4 attribute ("IP") for IP4 and IP4_6 ARs
     *    @param error_msg if any
     *    @return 0 on success
     */
    int init_ipv4(std::string& error_msg);

    /**
     *  Function to parse the IPv6 attributes ("GLOBAL_PREFIX" and "ULA_PREFIX")
     *  for IP6 and IP4_6 ARs
     *    @param error_msg if any
     *    @return 0 on success
     */
    int init_ipv6(std::string& error_msg);

    /**
     *  Function to parse the IPv6 attributes no slaac ("IP6") for IP6_STATIC
     *  and IP4_6_STATIC ARs
     *    @param error_msg if any
     *    @return 0 on success
     */
    int init_ipv6_static(std::string& error_msg);

    /**
     *  Function to parse the MAC attributes ("MAC") for all AR types
     *    @param error_msg if any
     *    @return 0 on success
     */
    int init_mac(std::string& error_msg);

    /**
     *  Checks for restricted attributes, returns the first one found
     */
    bool check(std::string& rs_attr) const;

    /**
     * Deletes all restricted attributes
     */
    void remove_restricted(VectorAttribute* va);

    /**
     * Deletes all the attributes, except the restricted ones
     */
    void remove_all_except_restricted(VectorAttribute* va);

    /* ---------------------------------------------------------------------- */
    /* Address Range data                                                     */
    /* ---------------------------------------------------------------------- */
    /**
     *  The type of addresses defined in the range
     */
    AddressType type = NONE;

    /**
     *  ID for this range, unique within the Virtual Network
     */
    unsigned int id;

    /**
     *  Number of addresses in the range
     */
    unsigned long int size = 0;

    /**
     *  First IP4 in the range
     */
    unsigned int ip = 0;

    /**
     *  First MAC in the range
     */
    unsigned int mac[2] = {0};

    /**
     *  Binary representation of the IPv6 address global unicast prefix
     */
    unsigned int global6[2] = {0};

    /**
     *  Binary representation of the IPv6 address site unicast prefix
     */
    unsigned int ula6[2] = {0};

    /**
     *  Binary representation of the first IPv6 address in the AR. No SLAAC ARs
     */
    unsigned int ip6[4] = {0};

    /**
     *  Port range definition parameters. First port available in the range
     */
    unsigned int port_start = 0;

    /**
     *  Port block size, each lease will have a block of port_size ports
     */
    unsigned int port_size  = 0;

    /**
     *  Security Group IDs for this Address Range
     */
    std::set<int> security_groups;

    /**
     *  The Address Range attributes as a Template VectorAttribute. This is
     *  used to generate XML or a template representation of the AR.
     */
    VectorAttribute * attr = nullptr;

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
    static std::set<std::string> restricted_attributes;

    /**
     *  Attributes to be process for Security Group rules
     */
    const static char * SG_RULE_ATTRIBUTES[];

    const static int  NUM_SG_RULE_ATTRIBUTES;
};

#endif
