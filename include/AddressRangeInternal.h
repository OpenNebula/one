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

#ifndef ADDRESS_RANGE_INTERNAL_H_
#define ADDRESS_RANGE_INTERNAL_H_

#include <string>

#include "AddressRange.h"

class VectorAttribute;

class AddressRangeInternal : public AddressRange
{
public:
    AddressRangeInternal(unsigned int _id):AddressRange(_id), next(0) {};

    virtual ~AddressRangeInternal() {};

    /* ---------------------------------------------------------------------- */
    /* AddressRange Interface                                                 */
    /* ---------------------------------------------------------------------- */
    /**
     *  Init an Address Range based on a vector attribute.
     *    @param attr the description of the AddressRange
     *    @param error_msg description if error
     *    @return 0 on success
     */
    int from_vattr(VectorAttribute * attr, std::string& error_msg) override
    {
        return AddressRange::from_attr(attr, error_msg);
    }

    /**
     *  Sets the given range of addresses (by index) as used
     *    @param index the first address to set as used
     *    @param sz number of addresses to set
     *    @param msg describing the error if any
     *
     *    @return 0 if success
     */
    int allocate_addr(unsigned int index, unsigned int rsize,
                      std::string& error_msg) override
    {
        return 0;
    }

    /**
     *  Gets a range of free addresses
     *    @param index the first address in the range
     *    @param size number of addresses requested in the range
     *    @param msg describing the error if any
     *
     *    @return 0 if success
     */
    int get_addr(unsigned int& index, unsigned int rsize,
                 std::string& error_msg) override
    {
        if ( rsize == 1 )
        {
            return get_single_addr(index, error_msg);
        }

        return get_range_addr(index, rsize, error_msg);
    }

    /**
     *  Sets the given address (by index) as free
     *    @param index of the address
     *    @param msg describing the error if any
     *
     *    @return 0 if success
     */
    int free_addr(unsigned int index, std::string& msg) override
    {
        return 0;
    };

private:
    /**
     *  Lookup index for the next free address lease
     */
    unsigned int next;

    /**
     *  Get a free lease
     *    @param index of the free lease, undefined if error
     *    @param msg with error description if any
     *    @return 0 on success -1 otherwise
     */
    int get_single_addr(unsigned int& index, std::string& msg);

    /**
     *  Get a free and continuous range of leases
     *    @param index of the first free lease in range, undefined if error
     *    @param sz of the range
     *    @param msg with error description if any
     *    @return 0 on success -1 otherwise
     */
    int get_range_addr(unsigned int& index, unsigned int sz, std::string& msg) const;
};

#endif
