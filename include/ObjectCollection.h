/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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

#include "PoolObjectSQL.h"

using namespace std;

/**
 *  Class to store a set of PoolObjectSQL IDs.
 */
class ObjectCollection
{
public:

    ObjectCollection(const string& _collection_name)
        :collection_name(_collection_name){};

    ObjectCollection(const string& cname, const set<int>& cset)
        :collection_name(cname), collection_set(cset){};

    ~ObjectCollection(){};

    /**
     *  Adds an ID to the set.
     *    @param id The new id
     *
     *    @return 0 on success, -1 if the ID was already in the set
     */
    int add(int id);

    /**
     *  Deletes an ID from the set.
     *    @param id The id
     *
     *    @return 0 on success, -1 if the ID was not in the set
     */
    int del(int id);

    /**
     *  Deletes all IDs from the set.
     */
    void clear()
    {
        collection_set.clear();
    }

    /**
     *  Returns how many IDs are there in the set.
     *    @return how many IDs are there in the set.
     */
    int size() const
    {
        return collection_set.size();
    };

    /**
     * Rebuilds the object from an xml object
     * @param xml xml object
     * @param xpath_prefix Parent nodes, e.g. "/DATASTORE/"
     *
     * @return 0 on success, -1 otherwise
     */
    int from_xml(const ObjectXML* xml, const string& xpath_prefix);

    /**
     * Function to print the Collection object into a string in
     * XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    string& to_xml(string& xml) const;

    /**
     *  Returns a copy of the IDs set
     */
    set<int> clone() const
    {
        return set<int>(collection_set);
    };

    /**
     *  Returns a reference to the IDs set
     */
    const set<int>& get_collection() const
    {
        return collection_set;
    };

    /**
     * Returns true if the collection contains the given id
     * @param id ID to search
     * @return true if the collection contains the given id
     */
    bool contains(int id) const
    {
        return collection_set.count(id) > 0;
    }

    /**
     *  Returns and deletes the first element from the set
     *    @param the element
     *    @return 0 on success -1 if the set was empty
     */
    int pop(int& elem);

    /**
     * Adds to the collection the contents of other collection
     *
     */
    ObjectCollection& operator<<(const ObjectCollection& r);

private:

    /**
     *  The collection's name
     */
    string  collection_name;

    /**
     *  Set containing the relations IDs
     */
    set<int> collection_set;

    /**
     *  Rebuilds the object from an xml node
     *    @param node The xml node pointer
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml_node(const xmlNodePtr node);
};

#endif /*OBJECT_COLLECTION_H_*/
