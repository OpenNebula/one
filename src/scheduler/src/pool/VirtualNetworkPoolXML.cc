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

#include "VirtualNetworkPoolXML.h"
#include <iomanip>

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetworkPoolXML::set_up()
{
    ostringstream   oss;
    int             rc;

    rc = PoolXML::set_up();

    if ( rc == 0 )
    {
        if (NebulaLog::log_level() >= Log::DDDEBUG)
        {
            oss << "Discovered VNETS:" << endl;

            oss << right << setw(8)  << "ID"     << " "
                << right << setw(8)  << "Leases" << " " <<  endl
                << setw(20) << setfill('-') << "-" << setfill(' ') << endl;

            for (auto it=objects.begin(); it!=objects.end(); it++)
            {
                VirtualNetworkXML * n = dynamic_cast<VirtualNetworkXML *>(it->second);

                oss << *n << endl;
            }
        }
        else
        {
            oss << "Discovered " << objects.size() << " vnets.";
        }

        NebulaLog::log("VNET", Log::DEBUG, oss);
    }

    return rc;
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualNetworkPoolXML::add_object(xmlNodePtr node)
{
    if ( node == 0 || node->children == 0 )
    {
        NebulaLog::log("VNET", Log::ERROR,
                       "XML Node does not represent a valid VNET");
        return;
    }

    VirtualNetworkXML* vnet = new VirtualNetworkXML(node);

    objects.insert(pair<int, ObjectXML*>(vnet->get_oid(), vnet));
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetworkPoolXML::load_info(xmlrpc_c::value &result)
{
    try
    {
        client->call("one.vnpool.info", "iii", &result, -2, -1, -1);

        return 0;
    }
    catch (exception const& e)
    {
        ostringstream   oss;
        oss << "Exception raised: " << e.what();

        NebulaLog::log("VNET", Log::ERROR, oss);

        return -1;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

