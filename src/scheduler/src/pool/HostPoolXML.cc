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

#include "HostPoolXML.h"

int HostPoolXML::set_up()
{
    ostringstream   oss;
    int             rc;

    rc = PoolXML::set_up();

    if ( rc == 0 )
    {
        if (NebulaLog::log_level() >= Log::DDDEBUG)
        {
            oss << "Discovered Hosts (enabled):" << endl;

            map<int, ObjectXML*>::iterator it;

            for (it=objects.begin();it!=objects.end();it++)
            {
                HostXML * h = dynamic_cast<HostXML *>(it->second);

                oss << *h << endl;
            }
        }
        else
        {
            oss << "Discovered " << objects.size() << " enabled hosts.";
        }

        NebulaLog::log("HOST",Log::DEBUG,oss);
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostPoolXML::add_object(xmlNodePtr node)
{
    if ( node == 0 || node->children == 0 )
    {
        NebulaLog::log("HOST",Log::ERROR,
                       "XML Node does not represent a valid Host");

        return;
    }

    HostXML* host = new HostXML( node );

    objects.insert( pair<int,ObjectXML*>(host->get_hid(), host) );
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostPoolXML::load_info(xmlrpc_c::value &result)
{
    try
    {
        client->call( client->get_endpoint(),           // serverUrl
                      "one.hostpool.info",              // methodName
                      "s",                              // arguments format
                      &result,                          // resultP
                      client->get_oneauth().c_str()     // argument
                    );
        return 0;
    }
    catch (exception const& e)
    {
        ostringstream   oss;
        oss << "Exception raised: " << e.what();

        NebulaLog::log("HOST", Log::ERROR, oss);

        return -1;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostPoolXML::merge_clusters(ClusterPoolXML * clpool)
{
    // TODO
    /*
    map<int,ObjectXML*>::iterator it;

    ClusterXML* cluster;
    HostXML*    host;

    int cluster_id;
    vector<xmlNodePtr> nodes;

    for (it=objects.begin(); it!=objects.end(); it++)
    {
        host = static_cast<HostXML*>(it->second);

        cluster_id = host->get_cid();

        if(cluster_id != -1) //ClusterPool::NONE_CLUSTER_ID
        {
            cluster = clpool->get(cluster_id);

            if(cluster != 0)
            {
                nodes.clear();

                cluster->get_nodes("/CLUSTER/TEMPLATE", nodes);

                if (!nodes.empty())
                {
                    host->add_node("/HOST", nodes[0], "CLUSTER_TEMPLATE");
                }

                cluster->free_nodes(nodes);
            }
        }
    }
    */
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
