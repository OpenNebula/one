/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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

#include "ObjectCollection.h"
#include "ObjectXML.h"
#include <algorithm>

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ObjectCollection::from_xml_node(const xmlNodePtr node)
{
   istringstream iss;
   int           id;
   int           rc = 0;
   ostringstream oss;

   vector<string> ids;

   ObjectXML oxml(node);

   oss << "/" << collection_name << "/ID";

   oxml.xpaths(ids, oss.str().c_str());

   for (auto id_str : ids)
   {
       iss.clear();
       iss.str(id_str);
       iss >> dec >> id;

       if ( iss.fail() )
       {
           rc = -1;
           break;
       }
       else
       {
           collection_set.insert(id);
       }
   }

    return rc;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ObjectCollection::from_xml(const ObjectXML* xml, const string& xpath_prefix)
{
    int                 rc;
    vector<xmlNodePtr>  content;

    xml->get_nodes(xpath_prefix + collection_name, content);

    if (content.empty())
    {
        return -1;
    }

    rc = from_xml_node(content[0]);

    xml->free_nodes(content);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& ObjectCollection::to_xml(string& xml) const
{
    ostringstream       oss;

    oss << "<" << collection_name << ">";

    for (auto id : collection_set)
    {
        oss << "<ID>" << id << "</ID>";
    }

    oss << "</" << collection_name << ">";

    xml = oss.str();

    return xml;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ObjectCollection::add(int id)
{
    auto ret = collection_set.insert(id);

    if( !ret.second )
    {
        return -1;
    }

    return 0;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ObjectCollection::del(int id)
{
    if( collection_set.erase(id) != 1 )
    {
        return -1;
    }

    return 0;
};

int ObjectCollection::del_not_present(const ObjectCollection& base)
{
    int removed = 0;

    if ( collection_set.size() == 0 )
    {
        return 0;
    }

    for (auto it = collection_set.begin(); it != collection_set.end(); )
    {
        if ( base.contains(*it) )
        {
            ++it;
        }
        else
        {
            it = collection_set.erase(it);

            removed++;
        }
    }

    return removed;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ObjectCollection::pop(int& elem)
{
    if (collection_set.empty())
    {
        return -1;
    }

    auto it = collection_set.begin();

    elem = *it;

    collection_set.erase(it);

    return 0;
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

ObjectCollection& ObjectCollection::operator<<(const ObjectCollection& r)
{
    for (auto id : r.collection_set)
    {
        collection_set.insert(id);
    }

    return *this;
}

ObjectCollection& ObjectCollection::operator<<(const std::set<int>& r)
{
    for (const auto& id : r)
    {
        collection_set.insert(id);
    }

    return *this;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

ObjectCollection& ObjectCollection::operator-=(const ObjectCollection& r)
{
    std::set<int> diff;

    std::set_difference(collection_set.cbegin(), collection_set.cend(),
            r.collection_set.cbegin(), r.collection_set.cend(),
            std::inserter(diff, diff.end()));

    collection_set.swap(diff);

    return *this;
}

ObjectCollection& ObjectCollection::operator-=(const std::set<int>& r)
{
    std::set<int> diff;

    std::set_difference(collection_set.cbegin(), collection_set.cend(),
            r.cbegin(), r.cend(), std::inserter(diff, diff.end()));

    collection_set.swap(diff);

    return *this;
}
