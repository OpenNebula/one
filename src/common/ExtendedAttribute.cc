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

#include "ExtendedAttribute.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

ExtendedAttributeSet::~ExtendedAttributeSet()
{
    std::map<int, ExtendedAttribute *>::iterator it;

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

ExtendedAttribute * ExtendedAttributeSet::get_attribute(int id) const
{
    std::map<int, ExtendedAttribute*>::const_iterator it = a_set.find(id);

    if ( it == a_set.end() )
    {
        return 0;
    }

    return it->second;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ExtendedAttributeSet::init_attribute_map(const std::string& id_name,
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

        ExtendedAttribute * a = attribute_factory(*it, id);

        a_set.insert(make_pair(id, a));
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

ExtendedAttribute * ExtendedAttributeSet::delete_attribute(int id)
{
    std::map<int, ExtendedAttribute*>::iterator it = a_set.find(id);

    if ( it == a_set.end() )
    {
        return 0;
    }

    a_set.erase(it);

    return it->second;
}

