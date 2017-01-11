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

#include "VirtualMachineAttribute.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VirtualMachineAttributeSet::~VirtualMachineAttributeSet()
{
    std::map<int, VirtualMachineAttribute *>::iterator it;

    for (it = a_set.begin(); it != a_set.end(); ++it)
    {
        if ( dispose )
        {
            delete it->second->va;
        }

        delete it->second;
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VirtualMachineAttribute * VirtualMachineAttributeSet::get_attribute(int id) const
{
    std::map<int, VirtualMachineAttribute*>::const_iterator it = a_set.find(id);

    if ( it == a_set.end() )
    {
        return 0;
    }

    return it->second;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VirtualMachineAttribute * VirtualMachineAttributeSet::get_attribute(
        const string& flag) const
{
    std::map<int, VirtualMachineAttribute*>::const_iterator it;

    for( it = a_set.begin(); it != a_set.end(); ++it)
    {
        if ( it->second->is_flag(flag) == true )
        {
            return it->second;
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VirtualMachineAttribute * VirtualMachineAttributeSet::remove_attribute(
        const string& flag)
{
    std::map<int, VirtualMachineAttribute*>::const_iterator it;
    VirtualMachineAttribute * tmp = 0;

    for( it = a_set.begin(); it != a_set.end(); ++it)
    {
        if ( it->second->is_flag(flag) == true )
        {
            tmp = it->second;
            a_set.erase(it);
        }
    }

    return tmp;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineAttributeSet::init_attribute_map(const std::string& id_name,
        std::vector<VectorAttribute *>& vas)
{
    std::vector<VectorAttribute *>::iterator it;
    int id, auto_id;

    for (it = vas.begin(), auto_id = 0; it != vas.end(); ++it, ++auto_id)
    {
        if (id_name.empty())
        {
            id = auto_id;
        }
        else if ( (*it)->vector_value(id_name, id) != 0 )
        {
            continue;
        }

        VirtualMachineAttribute * a = attribute_factory(*it, id);

        a_set.insert(make_pair(id, a));
    }
};

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

VirtualMachineAttribute * VirtualMachineAttributeSet::clear_flag(
        const string& flag)
{
    std::map<int, VirtualMachineAttribute*>::iterator it;

    for( it = a_set.begin(); it != a_set.end(); ++it)
    {
        if ( it->second->is_flag(flag) == true )
        {
            it->second->clear_flag(flag);

            return it->second;
        }
    }

    return 0;
}

