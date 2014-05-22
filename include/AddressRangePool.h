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

#ifndef ADDRESS_RANGE_POOL_H_
#define ADDRESS_RANGE_POOL_H_

#include <string>
#include <vector>
#include <map>

#include <libxml/parser.h>

#include "Template.h"
#include "AddressRange.h"

class VectorAttribute;

using namespace std;

class AddressRangePool
{
public:
    AddressRangePool();

    virtual ~AddressRangePool();

    /**
     *  Builds the address range set from an array of VectorAttributes. This
     *  function is used to create address ranges.
     *    @param ars the vector of address ranges
     *    @param error_msg describing the error
     *    @return 0 on success
     */
    int from_vattr(vector<Attribute *> ars, string& error_msg);

    /**
     *  Builds the address range set from its XML representation. This function
     *  is used to rebuild the address ranges from the DB.
     *    @param node xmlNode for the template
     *    @return 0 on success
     */
    int from_xml_node(const xmlNodePtr node);

    /**
     *  Removes an address range from the pool if it does not contain any used
     *  leases
     *    @param arid of the address range to be removed
     *    @return 0 on success, -1 if not exists or has used addresses
     */
    int rm_ar(unsigned int ar_id, string& error_msg);

    /**
     *  Updates the given address ranges
     *    @param ars vector of address ranges as VectorAttributes obtined from
     *    template in the form AR = [...]
     */
    void update_ar(vector<Attribute *> ars);

    /**
     *  Generate a XML representation of the Address Range Pool
     *    @param sstream where the ARPool is written
     *    @param extended true to include lease information
     *    @return the string with the XML
     */
    string& to_xml(string& sstream, bool extended) const;

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
     *    @param arid the ID of the address range
     *    @param ot the type of the object requesting the address (VM or NET)
     *    @param obid the id of the object requesting the address
     *    @param mac the specific MAC address requested
     */
    void free_addr(PoolObjectSQL::ObjectType ot, int obid, const string& mac);

    /**
     *  Frees the given address by IP from all address ranges containing
     *  the IP
     *    @param arid the ID of the address range
     *    @param ot the type of the object requesting the address (VM or NET)
     *    @param obid the id of the object requesting the address
     *    @param ip the specific IP address requested
     */
    void free_addr_by_ip(PoolObjectSQL::ObjectType ot, int id, const string& ip);

    /**
     *  Return the number of used addresses
     */
    unsigned int get_used_addr() const
    {
        return used_addr;
    }

    /**
     *  Gets an attribute from the Address Range
     *    @param name of the attribute
     *    @param value of the attribute
     *    @param ar_id to get the attribute from
     */
    void get_attribute(const char * name, string& value, int ar_id) const;

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
