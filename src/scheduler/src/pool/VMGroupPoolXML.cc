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

#include "VMGroupPoolXML.h"

using namespace std;


void VMGroupPoolXML::add_object(xmlNodePtr node)
{
    if ( node == 0 || node->children == 0 )
    {
        NebulaLog::log("VM_GROUP", Log::ERROR, "XML Node does not represent a "
                       "valid user");
        return;
    }

    VMGroupXML * vmg = new VMGroupXML(node);

    objects.insert( pair<int, ObjectXML*>(vmg->get_oid(), vmg) );
}

int VMGroupPoolXML::load_info(xmlrpc_c::value &result)
{
    try
    {
        client->call("one.vmgrouppool.info", "iii", &result,  -2, -1, -1);

        return 0;
    }
    catch (exception const& e)
    {
        ostringstream   oss;
        oss << "Exception raised: " << e.what();

        NebulaLog::log("VMGROUP", Log::ERROR, oss);

        return -1;
    }
}
