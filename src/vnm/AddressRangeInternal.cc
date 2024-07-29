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

#include "AddressRangeInternal.h"

int AddressRangeInternal::get_single_addr(unsigned int& index, std::string& msg)
{
    unsigned int ar_size = get_size();

    for ( unsigned int i=0; i<ar_size; i++, next = (next+1)%ar_size )
    {
        if ( allocated.count(next) == 0 )
        {
            index = next;
            return 0;
        }
    }

    msg = "Not free addresses available";
    return -1;
}

int AddressRangeInternal::get_range_addr(unsigned int& index,
                                         unsigned int rsize, std::string& msg) const
{
    unsigned int ar_size = get_size();
    bool valid;

    for (unsigned int i=0; i< ar_size; i++)
    {
        if ( allocated.count(i) != 0 )
        {
            continue;
        }

        valid = true;

        for (unsigned int j=0; j<rsize; j++, i++)
        {
            if ( allocated.count(i) != 0 || i >= ar_size )
            {
                valid = false;
                break;
            }
        }

        if (valid == true)
        {
            index = i - rsize;
            return 0;
        }
    }

    msg = "There isn't a continuous range big enough";
    return -1;
}

