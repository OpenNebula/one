/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

#include "VirtualMachineAttribute.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VirtualMachineAttribute * VirtualMachineAttributeSet::get_attribute(
        const string& flag) const
{
    std::map<int, ExtendedAttribute*>::const_iterator it;

    VirtualMachineAttribute * vma;

    for( it = a_set.begin(); it != a_set.end(); ++it)
    {
        vma = static_cast<VirtualMachineAttribute *>(it->second);

        if ( vma->is_flag(flag) == true )
        {
            return vma;
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachineAttributeSet::set_flag(int a_id, const string& flag_name)
{
    VirtualMachineAttribute * va = get_attribute(a_id);

    if ( va == 0 )
    {
        return -1;
    }

    va->set_flag(flag_name);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VirtualMachineAttribute * VirtualMachineAttributeSet::remove_attribute(
        const string& flag)
{
    std::map<int, ExtendedAttribute*>::const_iterator it;

    VirtualMachineAttribute * vma;
    VirtualMachineAttribute * tmp = 0;

    for( it = a_set.begin(); it != a_set.end(); ++it)
    {
        vma = static_cast<VirtualMachineAttribute *>(it->second);

        if ( vma->is_flag(flag) == true )
        {
            tmp = vma;
            a_set.erase(it);
        }
    }

    return tmp;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VirtualMachineAttribute * VirtualMachineAttributeSet::clear_flag(
        const string& flag)
{
    std::map<int, ExtendedAttribute *>::iterator it;

    VirtualMachineAttribute * vma;

    for( it = a_set.begin(); it != a_set.end(); ++it)
    {
        vma = static_cast<VirtualMachineAttribute *>(it->second);

        if ( vma->is_flag(flag) == true )
        {
            vma->clear_flag(flag);

            return vma;
        }
    }

    return 0;
}

