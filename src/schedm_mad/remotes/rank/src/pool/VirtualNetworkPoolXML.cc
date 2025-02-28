/* -------------------------------------------------------------------------- */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                */
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

void VirtualNetworkPoolXML::set_up()
{
    ostringstream   oss;

    PoolXML::set_up();

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
