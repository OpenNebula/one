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

#include "AddressRange.h"
#include "AddressRangePool.h"

class VectorAttribute;

class AddressRangeIPAM : public AddressRange
{
public:
    AddressRangeIPAM(unsigned int _id):AddressRange(_id){};

    virtual ~AddressRangeIPAM(){};

    /* ---------------------------------------------------------------------- */
    /* AddressRange Interface **TODO contact IPAM**                           */
    /* ---------------------------------------------------------------------- */
    int from_vattr(VectorAttribute * attr, std::string& error_msg)
    {
        error_msg = "Not Implemented";
        return -1;
    };

    int allocate_addr(unsigned int index, unsigned int size, string& error_msg)
    {
        error_msg = "Not Implemented";
        return -1;
    };

    int get_addr(unsigned int& index, unsigned int rsize, string& error_msg)
    {
        error_msg = "Not Implemented";
        return -1;
    };

    int free_addr(unsigned int index, string& error_msg)
    {
        error_msg = "Not Implemented";
        return -1;
    };
};

#endif
