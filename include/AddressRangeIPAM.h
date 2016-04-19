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

#ifndef ADDRESS_RANGE_IPAM_H_
#define ADDRESS_RANGE_IPAM_H_

#include <string>
#include <set>
#include <vector>

#include "PoolObjectSQL.h"
#include "AddressRange.h"
#include "AddressRangePool.h"

using namespace std;

class VectorAttribute;

/**
 *  The Lease class represents an address lease from a Virtual Network.
 */
class AddressRangeIPAM : public AddressRange
{
public:

    AddressRangeIPAM(string _ipam_mad, unsigned int _id):AddressRange(_ipam_mad, _id){};

    virtual ~AddressRangeIPAM(){};
    
private:

    /**
     *  Get a free address from the IPAM
     *    @param index the index
     *    @return 0 on success
     */
    int get_free_addr(unsigned int &index);

    /**
     *  Get a free address range from the IPAM
     *    @param index the index
     *    @param rsize the size of the range
     *    @return 0 on success
     */
    int get_free_addr_range(unsigned int &index, unsigned int rsize);

    /**
     *  Register an address in the IPAM
     *    @param index the index
     *    @return 0 on success
     */
    int register_addr(unsigned int index);

    /**
     *  Register an address range in the IPAM
     *    @param sindex the index
     *    @param rsize the size of the range
     *    @return 0 on succes
     */
    int register_addr_range(unsigned int sindex, unsigned int rsize);

    /**
     *  Free an address in the IPAM
     *    @param index the index
     *    @return 0 on success
     */
    int free_addr(unsigned int index);

};

#endif
