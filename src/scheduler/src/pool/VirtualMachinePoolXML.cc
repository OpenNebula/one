/* -------------------------------------------------------------------------- */
/* Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             */
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
        oss << "Pending virtual machines :";

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

    xmlChar *     str_ptr = xmlNodeGetContent(node->children);
    istringstream iss(reinterpret_cast<char *>(str_ptr));

    int             vid;
    xmlrpc_c::value result;

    iss >> vid;
    xmlFree(str_ptr);

    client->call(client->get_endpoint(),           // serverUrl
                  "one.vm.info",                    // methodName
                  "si",                             // arguments format
                  &result,                          // resultP
                  client->get_oneauth().c_str(),    // argument 0
                  vid);                             // argument 1

    vector<xmlrpc_c::value> values =
                    xmlrpc_c::value_array(result).vectorValueValue();

    bool   success = xmlrpc_c::value_boolean( values[0] );
    string message = xmlrpc_c::value_string(  values[1] );

    if( !success )
    {
        ostringstream oss;

        oss << "ONE returned error while retrieving info for VM " << vid;
        oss << ":" << endl;
        oss << message;

        NebulaLog::log("VM",Log::ERROR,oss);
    }
    else
    {
        try
        {
            VirtualMachineXML* vm = new VirtualMachineXML( message );

            objects.insert( pair<int,ObjectXML*>(vid, vm) );
        }
        catch(runtime_error& re)
        {
            ostringstream oss_re;

            oss_re << re.what();
            NebulaLog::log("VM",Log::ERROR,oss_re);
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachinePoolXML::load_info(xmlrpc_c::value &result)
{
    try
    {
        client->call(client->get_endpoint(),           // serverUrl
                     "one.vmpool.info",                // methodName
                     "si",                             // arguments format
                     &result,                          // resultP
                     client->get_oneauth().c_str(),    // argument 0
                     -2);                              // argument 1
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


int VirtualMachinePoolXML::dispatch(int vid, int hid) const
{
    ostringstream               oss;
    xmlrpc_c::value             deploy_result;

    oss.str("");
    oss << "Dispatching virtual machine " << vid
        << " to HID: " << hid;

    NebulaLog::log("VM",Log::INFO,oss);

    try
    {
        client->call( client->get_endpoint(),           // serverUrl
                      "one.vm.deploy",                  // methodName
                      "sii",                            // arguments format
                      &deploy_result,                   // resultP
                      client->get_oneauth().c_str(),    // argument 0
                      vid,                              // argument 1
                      hid                               // argument 2
                    );
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
