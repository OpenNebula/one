/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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


#ifndef DATASTORE_POOL_XML_H_
#define DATASTORE_POOL_XML_H_

#include "PoolXML.h"
#include "DatastoreXML.h"

using namespace std;

class DatastorePoolXML : public PoolXML
{
public:

    DatastorePoolXML(Client* client):PoolXML(client){};

    ~DatastorePoolXML(){};

    /**
     *  Gets an object from the pool
     *   @param oid the object unique identifier
     *
     *   @return a pointer to the object, 0 in case of failure
     */
    DatastoreXML * get(int oid) const
    {
        return static_cast<DatastoreXML *>(PoolXML::get(oid));
    };

protected:

    virtual int get_suitable_nodes(vector<xmlNodePtr>& content) = 0;

    void add_object(xmlNodePtr node);

    int load_info(xmlrpc_c::value &result);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class SystemDatastorePoolXML : public DatastorePoolXML
{
public:
    SystemDatastorePoolXML(Client* client):DatastorePoolXML(client){};

protected:
    int get_suitable_nodes(vector<xmlNodePtr>& content)
    {
        return get_nodes("/DATASTORE_POOL/DATASTORE[TYPE=1 and STATE=0]", content);
    };
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class ImageDatastorePoolXML : public DatastorePoolXML
{
public:
    ImageDatastorePoolXML(Client* client):DatastorePoolXML(client){};

protected:
    int get_suitable_nodes(vector<xmlNodePtr>& content)
    {
        return get_nodes("/DATASTORE_POOL/DATASTORE[TYPE=0]", content);
    };
};

#endif /* DATASTORE_POOL_XML_H_ */
