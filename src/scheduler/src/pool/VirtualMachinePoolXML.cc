/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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

#include "VirtualMachinePoolXML.h"
#include <stdexcept>

int VirtualMachinePoolXML::set_up()
{
    ostringstream   oss;
    int             rc;

    rc = PoolXML::set_up();

    if ( rc == 0 )
    {
        oss.str("");
        oss << "Pending and rescheduling VMs:" << endl;

        map<int,ObjectXML*>::iterator it;

        for (it=objects.begin();it!=objects.end();it++)
        {
            oss << " " << it->first;
        }

        NebulaLog::log("VM",Log::DEBUG,oss);
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachinePoolXML::add_object(xmlNodePtr node)
{
    if ( node == 0 || node->children == 0 || node->children->next==0 )
    {
        NebulaLog::log("VM",Log::ERROR,
                       "XML Node does not represent a valid Virtual Machine");
        return;
    }

    VirtualMachineXML* vm = new VirtualMachineXML(node);

    objects.insert(pair<int,ObjectXML*>(vm->get_oid(),vm));
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachinePoolXML::load_info(xmlrpc_c::value &result)
{
    try
    {
        client->call(client->get_endpoint(),        // serverUrl
                     "one.vmpool.info",             // methodName
                     "siiii",                       // arguments format
                     &result,                       // resultP
                     client->get_oneauth().c_str(), // auth string
                     -2,                            // VM from all users
                     -1,                            // start_id (none)
                     -1,                            // end_id (none)
                     -1);                           // not in DONE state
        return 0;
    }
    catch (exception const& e)
    {
        ostringstream   oss;
        oss << "Exception raised: " << e.what();

        NebulaLog::log("VM", Log::ERROR, oss);

        return -1;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */


int VirtualMachinePoolXML::dispatch(int vid, int hid, bool resched) const
{
    ostringstream               oss;
    xmlrpc_c::value             deploy_result;

    if (resched == true)
    {
        oss << "Rescheduling ";
    }
    else
    {
        oss << "Dispatching ";   
    }

    oss << "virtual machine " << vid << " to host " << hid;

    NebulaLog::log("VM",Log::INFO,oss);

    try
    {
        //TODO Get live migration from config file
        if (resched == true)
        {
            client->call(client->get_endpoint(),           // serverUrl
                         "one.vm.migrate",                 // methodName
                         "siib",                           // arguments format
                         &deploy_result,                   // resultP
                         client->get_oneauth().c_str(),    // argument 0 (AUTH)
                         vid,                              // argument 1 (VM)
                         hid,                              // argument 2 (HOST)
                         live_resched);                    // argument 3 (LIVE)
        }
        else
        {
            client->call(client->get_endpoint(),           // serverUrl
                         "one.vm.deploy",                  // methodName
                         "sii",                            // arguments format
                         &deploy_result,                   // resultP
                         client->get_oneauth().c_str(),    // argument 0 (AUTH)
                         vid,                              // argument 1 (VM)
                         hid);                             // argument 2 (HOST)
        }
    }
    catch (exception const& e)
    {
        oss.str("");
        oss << "Exception raised: " << e.what() << '\n';

        NebulaLog::log("VM",Log::ERROR,oss);

        return -1;
    }

    // See how ONE handled the deployment

    vector<xmlrpc_c::value> values =
                    xmlrpc_c::value_array(deploy_result).vectorValueValue();

    bool   success = xmlrpc_c::value_boolean( values[0] );

    if ( !success )
    {
        string message = xmlrpc_c::value_string(  values[1] );

        oss.str("");
        oss << "Error deploying virtual machine " << vid
            << " to HID: " << hid << ". Reason: " << message;

        NebulaLog::log("VM",Log::ERROR,oss);

        return -1;
    }

    return 0;
}
