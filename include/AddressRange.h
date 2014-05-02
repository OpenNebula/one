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

#ifndef ADDRESS_RANGE_H_
#define ADDRESS_RANGE_H_

#include <string>
#include <set>
#include <vector>

using namespace std;

class VectorAttribute;

/**
 *  The Lease class represents an address lease from a Virtual Network.
 */
class AddressRange
{
public:

    AddressRange(){};

    virtual ~AddressRange(){};

    /**
     *  Init an Address Range based on a vector attribute the following
     *  attributes will be parsed (* are optional):
     *    - TYPE = ETHER | IP4 | IP6 | IP4_6
     *    - SIZE
     *    - MAC_START
     *    - IP_START
     *    - ULA_PREFIX
     *    - GLOBAL_PREFIX
     *
     *  The following can be defined to override VNET values:
     *    - BRIDGE
     *    - VLAN
     *    - VLAN_ID
     *    - PHYDEV
     *
     *  Any value defined in the INHERIT_VNET_ATTR can be defined as well.
     *
     *  Any value for context can be included in the AR.
     *
     * Example:
     *   - AR = [ TYPE = "ETHER", SIZE = 128, MAC_START = "00:02:01:02:03:04"]
     *   - AR = [ TYPE = "ETHER", SIZE = 128]
     *   - AR = [ TYPE     = IP4,
     *            SIZE     = 256,
     *            IP_START = 10.0.0.0,
     *            DNS      = 10.0.0.2]
     *   - AR = [ TYPE = "IP6",
     *            SIZE = 1024,
     *            ULA_PREFIX    = "fd00:0:0:1::",
     *            GLOBAL_PREFIX = "2001::"]
     */
    int init_address_range(VectorAttribute * attr, string& error_msg);

    /**
     *  Type of Addresses defined by this address range
     */
    enum AddressType
    {
        ETHER = 0x00000001, /** MAC address type */
        IP4   = 0x00000003, /** IP version 4 address */
        IP6   = 0x00000005, /** IP version 6 address */
        IP4_6 = 0x00000007  /** IP dual stack version 4 & 6 addresses */
    };

    /**
     *  Returns an unused address, which becomes used and fills a NIC attribute
     *  with the configuration parameters from the address range.
     *
     *  @param nic the VM NIC attribute
     *  @return 0 if success
     */
    int allocate_addr(VectorAttribute * nic, const vector<string> &inherit);

    /**
     *  Frees a previous allocated address, referenced by its MAC address
     *
     *  @param mac the MAC address in string form
     */
    void free_addr(const string& mac);


private:
    /* ---------------------------------------------------------------------- */
    /* String to binary conversion functions for different address types      */
    /* ---------------------------------------------------------------------- */

    /**
     *  MAC to binary (48 bits)
     *    @param mac in string form 00:02:01:02:03:04
     *    @return 0 on success
     */
    int mac_to_i(string mac, unsigned int i_mac[]);

    /**
     *  IP version 4 to binary (32 bits)
     *    @param ip in string form 192.168.0.2
     *    @return 0 on success
     */
    int ip_to_i(const string& _ip, unsigned int& i_ip);

    /**
     *  IPv6 64bits prefix conversion
     *    @param prefix in string form 2a00:1bc0:b001:A::
     *    @return 0 on success
     */
    int prefix6_to_i(const string& prefix, unsigned int ip[]);

    /* ---------------------------------------------------------------------- */
    /* NIC setup functions                                                    */
    /* ---------------------------------------------------------------------- */

    void set_mac(unsigned int addr_index, VectorAttribute * nic);

    void set_ip(unsigned int addr_index, VectorAttribute * nic);

    void set_ip6(unsigned int addr_index, VectorAttribute * nic);

    void set_vnet(VectorAttribute *nic, const vector<string> &inherit);

    /* ---------------------------------------------------------------------- */
    /* Address index set helper functions                                     */
    /* ---------------------------------------------------------------------- */

    void allocated_to_attr();

    int  attr_to_allocated();

    void allocate_addr(unsigned int addr_index);

    void free_addr(unsigned int addr_index);

    /* ---------------------------------------------------------------------- */
    /* Address Range data                                                     */
    /* ---------------------------------------------------------------------- */

    /**
     *  The type of addresses defined in the range
     */
    AddressType type;

    /**
     *  Key-Value representation of the attribute
     */
    VectorAttribute * attr;

    /**
     *  ID for this range, unique within the Virtual Network
     */
    unsigned int id;

    /**
     *  Number of addresses in the range
     */
    unsigned int size;

    /**
     *  First IP4 in the range
     */
    unsigned int ip_start;

    /**
     *  First MAC in the range
     */
    unsigned int mac_start[2];

    /**
     *  Binary representation of the IPv6 address global unicast prefix
     */
    unsigned int global6[2];

    /**
     *  Binary representation of the IPv6 address site unicast prefix
     */
    unsigned int ula6[2];

    /**
     *  Next address to lease
     */
    unsigned int next;

    /**
     *  Set of address leased to a VM or other VNET
     */
    set<unsigned int> allocated;
};

#endif
