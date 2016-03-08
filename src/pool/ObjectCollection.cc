/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ObjectCollection::from_xml_node(const xmlNodePtr node)
{
   istringstream iss;
   int           id;
   int           rc = 0;
   ostringstream oss;

   vector<string>::iterator it;
   vector<string> ids;

   ObjectXML oxml(node);

   oss << "/" << collection_name << "/ID";

   oxml.xpaths(ids, oss.str().c_str());

   for (it = ids.begin(); it != ids.end(); it++)
   {
       iss.clear();
       iss.str(*it);
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

string& ObjectCollection::to_xml(string& xml) const
{
    ostringstream       oss;
    set<int>::iterator  it;

    oss << "<" << collection_name << ">";

    for ( it = collection_set.begin(); it != collection_set.end(); it++ )
    {
        oss << "<ID>" << *it << "</ID>";
    }

    oss << "</" << collection_name << ">";

    xml = oss.str();

    return xml;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ObjectCollection::add(int id)
{
    pair<set<int>::iterator,bool> ret;

    ret = collection_set.insert(id);

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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ObjectCollection::pop(int& elem)
{
    if (collection_set.empty())
    {
        return -1;
    }

    set<int>::iterator it = collection_set.begin();

    elem = *it;

    collection_set.erase(it);

    return 0;
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

ObjectCollection& ObjectCollection::operator<<(const ObjectCollection& r)
{
    set<int>::const_iterator i;

    for (i = r.collection_set.begin(); i != r.collection_set.end(); ++i)
    {
        collection_set.insert(*i);
    }

    return *this;
}
