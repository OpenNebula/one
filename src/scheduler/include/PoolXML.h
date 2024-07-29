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


#ifndef POOL_XML_H_
#define POOL_XML_H_

#include "NebulaLog.h"
#include "ObjectXML.h"
#include "Client.h"


class PoolXML : public ObjectXML
{
public:
    /**
     *
     *
     */
    const std::map<int, ObjectXML*>& get_objects() const
    {
        return objects;
    };

    /**
     *  Set ups the pool by performing the following actions:
     *  - All the objects stored in the pool are flushed
     *  - The suitable objects in the database are loaded
     *    @return 0 on success
     */
    virtual int set_up()
    {
        int rc;

        // ---------------------------------------------------------------------
        // Clean the pool to get updated data from OpenNebula
        // ---------------------------------------------------------------------

        flush();

        // ---------------------------------------------------------------------
        // Load the ids (to get an updated list of the pool)
        // ---------------------------------------------------------------------

        xmlrpc_c::value result;

        rc = load_info(result);

        if ( rc != 0 )
        {
            NebulaLog::log("POOL", Log::ERROR,
                           "Could not retrieve pool info from ONE");
            return -1;
        }

        std::vector<xmlrpc_c::value> values =
                xmlrpc_c::value_array(result).vectorValueValue();

        bool   success = xmlrpc_c::value_boolean( values[0] );
        std::string message = xmlrpc_c::value_string(  values[1] );

        if( !success )
        {
            std::ostringstream oss;

            oss << "ONE returned error while retrieving pool info:" << std::endl;
            oss << message;

            NebulaLog::log("POOL", Log::ERROR, oss);
            return -1;
        }

        update_from_str(message);

        std::vector<xmlNodePtr> nodes;

        get_suitable_nodes(nodes);

        for (unsigned int i=0 ;
             i < nodes.size() && ( pool_limit == 0 || i < pool_limit ) ;
             i++)
        {
            add_object(nodes[i]);
        }

        free_nodes(nodes);

        return 0;
    };

    /**
     *  Gets an object from the pool
     *   @param oid the object unique identifier
     *
     *   @return a pointer to the object, 0 in case of failure
     */
    virtual ObjectXML * get(int oid) const
    {
        auto it = objects.find(oid);

        if ( it == objects.end() )
        {
            return 0;
        }
        else
        {
            return it->second;
        }
    };

    /**
     *  Gets an object and removes it from the pool. The calling function
     *  needs to free the object memory
     *    @param oid of the object
     *
     *    @return pointer of the object 0 if not found
     */
    virtual ObjectXML * erase(int oid)
    {
        auto it = objects.find(oid);

        if ( it == objects.end() )
        {
            return 0;
        }
        else
        {
            ObjectXML * obj = it->second;

            objects.erase(it);

            return obj;
        }
    }

    /**
     *  Inserts a new object in the pool
     *    @param obj pointer to the XML object to be inserted
     *
     *    @return true if the object was successfully inserted
     */
    virtual bool insert(int oid, ObjectXML * obj)
    {
        auto rc = objects.insert(std::pair<int, ObjectXML*>(oid, obj));

        return rc.second;
    }

protected:
    // ------------------------------------------------------------------------

    PoolXML(Client* client, unsigned int pool_limit = 0):ObjectXML()
    {
        this->client     = client;
        this->pool_limit = pool_limit;
    };

    virtual ~PoolXML()
    {
        flush();
    };

    // ------------------------------------------------------------------------
    /**
     * Inserts a new ObjectXML into the objects map
     */
    virtual void add_object(xmlNodePtr node) = 0;

    /**
     *
     */
    virtual int get_suitable_nodes(std::vector<xmlNodePtr>& content) const = 0;

    /**
     *
     */
    virtual int load_info(xmlrpc_c::value &result) = 0;

    /**
     *  Deletes pool objects and frees resources.
     */
    void flush()
    {
        for (auto it=objects.begin(); it!=objects.end(); it++)
        {
            delete it->second;
        }

        objects.clear();
    }

    // ------------------------------------------------------------------------
    // Attributes
    // ------------------------------------------------------------------------
    /**
     * XML-RPC client
     */
    Client * client;

    /**
     *  Limit of pool elements to process (request individual info)
     *  from the pool.
     */
    unsigned int pool_limit;

    /**
     * Hash map contains the suitable [id, object] pairs.
     */
    std::map<int, ObjectXML *> objects;
};

#endif /* POOL_XML_H_ */
