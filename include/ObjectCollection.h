/* -------------------------------------------------------------------------- */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             */
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

#ifndef OBJECT_COLLECTION_H_
#define OBJECT_COLLECTION_H_

#include <set>

using namespace std;

/**
 *  Class to store a set of PoolObjectSQL IDs.
 */
class ObjectCollection
{
public:

    ObjectCollection(const string& _collection_name)
        :collection_name(_collection_name)
    {};

    ~ObjectCollection(){};

    /**
     *  Adds this object's ID to the set.
     *    @param object The new object
     *
     *    @return 0 on success, -1 if the ID was already in the set
     */
    virtual int add_collection_id(PoolObjectSQL* object)
    {
        return add_collection_id(object->get_oid());
    };

    /**
     *  Deletes this object's ID from the set.
     *    @param object The object
     *
     *    @return 0 on success, -1 if the ID was not in the set
     */
    virtual int del_collection_id(PoolObjectSQL* object)
    {
        return del_collection_id(object->get_oid());
    };

    /**
     *  Returns how many IDs are there in the set.
     *    @return how many IDs are there in the set.
     */
    int get_collection_size()
    {
        return collection_set.size();
    };

protected:

    /**
     *  Rebuilds the object from an xml node
     *    @param node The xml node pointer
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml_node(const xmlNodePtr node)
    {
        ObjectXML   xml(node);
        int         rc = 0;
        int         id;

        vector<string>              values;
        vector<string>::iterator    it;
        istringstream               iss;

        string xpath_expr = "/" + collection_name + "/ID";

        values = xml[xpath_expr.c_str()];

        for ( it = values.begin() ; it < values.end(); it++ )
        {
            iss.str(*it);
            iss >> dec >> id;

            if ( iss.fail() )
            {
                rc = -1;
            }
            else
            {
                collection_set.insert(id);
            }
        }

        return rc;
    };

    /**
     * Function to print the Collection object into a string in
     * XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    string& to_xml(string& xml) const
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

    /**
     *  Adds an ID to the set.
     *    @param id The new id
     *
     *    @return 0 on success, -1 if the ID was already in the set
     */
    int add_collection_id(int id)
    {
        pair<set<int>::iterator,bool> ret;

        ret = collection_set.insert(id);

        if( !ret.second )
        {
            return -1;
        }

        return 0;
    };

    /**
     *  Deletes an ID from the set.
     *    @param id The id
     *
     *    @return 0 on success, -1 if the ID was not in the set
     */
    int del_collection_id(int id)
    {
        if( collection_set.erase(id) != 1 )
        {
            return -1;
        }

        return 0;
    };

    /**
     *  Returns a copy of the IDs set
     */
    set<int> get_collection_copy()
    {
        return set<int> (collection_set);
    };

private:

    /**
     *  The collection's name
     */
    string  collection_name;

    /**
     *  Set containing the relations IDs
     */
    set<int> collection_set;

};

#endif /*OBJECT_COLLECTION_H_*/
