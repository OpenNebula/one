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

#include "HostPoolXML.h"
#include "MonitorXML.h"
#include "ClusterPoolXML.h"

using namespace std;

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

            for (auto it=objects.begin(); it!=objects.end(); it++)
            {
                HostXML * h = dynamic_cast<HostXML *>(it->second);

                oss << *h << endl;
            }
        }
        else
        {
            oss << "Discovered " << objects.size() << " enabled hosts.";
        }

        NebulaLog::log("HOST", Log::DEBUG, oss);
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostPoolXML::add_object(xmlNodePtr node)
{
    if ( node == 0 || node->children == 0 )
    {
        NebulaLog::log("HOST", Log::ERROR,
                       "XML Node does not represent a valid Host");

        return;
    }

    HostXML* host = new HostXML( node );

    objects.insert( pair<int, ObjectXML*>(host->get_hid(), host) );
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostPoolXML::load_info(xmlrpc_c::value &result)
{
    try
    {
        client->call("one.hostpool.info", "", &result);

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
    ClusterXML* cluster;
    HostXML*    host;

    int cluster_id;
    vector<xmlNodePtr> nodes;

    for (auto it=objects.begin(); it!=objects.end(); it++)
    {
        host = static_cast<HostXML*>(it->second);

        cluster_id = host->get_cid();

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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostPoolXML::merge_monitoring(MonitorPoolXML * mpool)
{
    vector<xmlNodePtr> nodes;

    for (auto it=objects.begin(); it!=objects.end(); it++)
    {
        HostXML* host = static_cast<HostXML*>(it->second);

        MonitorXML* monitor = mpool->get(host->get_hid());

        if ( monitor == nullptr )
        {
            continue;
        }

        nodes.clear();

        monitor->get_nodes("/MONITORING", nodes);

        if (!nodes.empty())
        {
            host->remove_nodes("/HOST/MONITORING");

            host->add_node("/HOST", nodes[0], "MONITORING");
        }

        monitor->free_nodes(nodes);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

