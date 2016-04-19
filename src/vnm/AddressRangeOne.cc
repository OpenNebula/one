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

#include "AddressRangeOne.h"
#include "Attribute.h"
#include "VirtualNetworkPool.h"
#include "NebulaUtil.h"

#include <arpa/inet.h>
#include <algorithm>

using namespace std;

int AddressRangeOne::get_free_addr(unsigned int &index)
{
    for (unsigned int i=0; i<size; i++, next = (next+1)%size)
    {
        if (allocated.count(next) == 0)
        {
            index = next; 
            return 0;
        }
    }

    return -1;
}

int AddressRangeOne::get_free_addr_range(unsigned int &index, unsigned int rsize)
{
    bool valid = true;

    for (unsigned int i=0; i<size; i++)
    {
        if (allocated.count(i) != 0)
        {
            continue;
        }

        valid = true;

        for (unsigned int j=0; j<rsize; j++, i++)
        {
            if (allocated.count(i) != 0 || i >= size)
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

    if (valid == false)
    {
        return -1; //This address range has not a continuos range big enough
    }

    return 0;
}

int AddressRangeOne::register_addr(unsigned int index)
{
    if ((allocated.count(index) != 0) || (index >= size))
    {
        return -1;
    }

    return 0;
}

int AddressRangeOne::register_addr_range(unsigned int sindex, unsigned int rsize)
{
    for (unsigned int j=sindex; j<(sindex+rsize); j++)
    {
        if (allocated.count(j) != 0)
        {
            return -1;
        }
    }

    return 0;
}

int AddressRangeOne::free_addr(unsigned int index)
{
    return 0;
}

