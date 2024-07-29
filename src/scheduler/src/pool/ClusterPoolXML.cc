/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project Leads (OpenNebula.org)             */
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

#include "ClusterPoolXML.h"

using namespace std;

const int ClusterPoolXML::NONE_CLUSTER_ID   = -1;

void ClusterPoolXML::add_object(xmlNodePtr node)
{
    if ( node == 0 || node->children == 0 )
    {
        NebulaLog::log("CLUSTER", Log::ERROR,
                       "XML Node does not represent a valid Cluster");

        return;
    }

    ClusterXML* cluster = new ClusterXML( node );

    objects.insert( pair<int, ObjectXML*>(cluster->get_oid(), cluster) );
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClusterPoolXML::load_info(xmlrpc_c::value &result)
{
    try
    {
        client->call("one.clusterpool.info", "", &result);

        return 0;
    }
    catch (exception const& e)
    {
        ostringstream   oss;
        oss << "Exception raised: " << e.what();

        NebulaLog::log("CLUSTER", Log::ERROR, oss);

        return -1;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

