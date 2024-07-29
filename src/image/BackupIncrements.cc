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

#include "BackupIncrements.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int BackupIncrements::from_xml_node(const xmlNodePtr node)
{
    int rc = _template.from_xml_node(node);

    if (rc == -1)
    {
        return -1;
    }

    increments.init(&_template);

    return 0;
}

/* -------------------------------------------------------------------------- */

int BackupIncrements::add_increment(const std::string& source, long long size,
                                    Increment::Type type)
{
    VectorAttribute * va = increments.new_increment(source, size, type);

    if (va == nullptr)
    {
        return -1;
    }

    _template.set(va);

    return 0;
}

/* -------------------------------------------------------------------------- */

int BackupIncrements::last_increment_id()
{
    Increment * li = increments.last_increment();

    if ( li == nullptr )
    {
        return -1;
    }

    return li->id();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VectorAttribute * IncrementSet::new_increment(const std::string& source, long long sz,
                                              Increment::Type type)
{
    Increment * li = last_increment();

    int parent = -1;

    if ( li == nullptr )
    {
        if ( type != Increment::FULL )
        {
            return nullptr;
        }
    }
    else
    {
        parent = li->id();
    }

    int iid = parent + 1;

    VectorAttribute * va = new VectorAttribute("INCREMENT");

    switch (type)
    {
        case Increment::FULL:
            va->replace("TYPE", "FULL");
            break;
        case Increment::INCREMENT:
            va->replace("TYPE", "INCREMENT");
            break;
    }

    va->replace("DATE", time(0));

    va->replace("SOURCE", source);

    va->replace("SIZE", sz);

    va->replace("PARENT_ID", parent);

    va->replace("ID", iid);

    add_attribute(attribute_factory(va, iid), iid);

    return va;
}

/* -------------------------------------------------------------------------- */

long long IncrementSet::total_size()
{
    long long sz = 0;

    for (inc_iterator i = begin(); i != end(); ++i)
    {
        sz += (*i)->size();
    }

    return sz;
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int BackupIncrements::update_increments(const std::string& incs, const std::string& sz)
{
    int first = -1;

    Increment * inc;

    std::vector<std::string> id_sources = one_util::split(incs, ',');

    for (const std::string& is: id_sources)
    {
        std::vector<std::string> parts = one_util::split(is, ':');

        if (parts.size() != 2)
        {
            return -1;
        }

        int id;

        if (!one_util::str_cast(parts[0], id))
        {
            return -1;
        }

        inc = increments.get_increment(id);

        if ( inc == nullptr )
        {
            return -1;
        }

        if ( first == -1 )
        {
            first = id;

            inc->backup_type(Increment::FULL);

            inc->parent_id(-1);

            inc->size(sz);
        }

        inc->source(parts[1]);
    }

    first = first - 1;

    while (first >= 0 && (inc = increments.delete_increment(first)) != nullptr)
    {
        delete _template.remove(inc->vector_attribute());

        delete inc;

        first = first - 1;
    }

    return 0;
}
