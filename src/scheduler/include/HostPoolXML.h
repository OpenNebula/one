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


#ifndef HOST_POOL_XML_H_
#define HOST_POOL_XML_H_

#include "PoolXML.h"
#include "HostXML.h"
#include "ClusterPoolXML.h"

using namespace std;

class HostPoolXML : public PoolXML
{
public:

    HostPoolXML(Client* client):PoolXML(client) {};

    ~HostPoolXML(){};

    int set_up();

    /**
     *  Gets an object from the pool
     *   @param oid the object unique identifier
     *
     *   @return a pointer to the object, 0 in case of failure
     */
    HostXML * get(int oid) const
    {
        return static_cast<HostXML *>(PoolXML::get(oid));
    };

    /**
     * For each Host in a cluster, adds the cluster template as a new
     * Host xml element
     *
     * @param clpool Cluster pool
     */
    void merge_clusters(ClusterPoolXML * clpool);

protected:

    int get_suitable_nodes(vector<xmlNodePtr>& content)
    {
        return get_nodes("/HOST_POOL/HOST[STATE=1 or STATE=2]", content);
    };

    void add_object(xmlNodePtr node);

    int load_info(xmlrpc_c::value &result);
};

#endif /* HOST_POOL_XML_H_ */
