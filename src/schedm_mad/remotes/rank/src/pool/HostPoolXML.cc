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

using namespace std;

void HostPoolXML::set_up()
{
    ostringstream   oss;

    PoolXML::set_up();

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
