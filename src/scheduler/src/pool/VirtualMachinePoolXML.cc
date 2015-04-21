/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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
#include <iomanip>

int VirtualMachinePoolXML::set_up()
{
    ostringstream   oss;

    int rc = PoolXML::set_up();

    if ( rc == 0 )
    {
        if (objects.empty())
        {
            return -2;
        }

        if (NebulaLog::log_level() >= Log::DDDEBUG)
        {
            oss << "Pending/rescheduling VM and capacity requirements:" << endl;

            oss << right << setw(8)  << "VM"        << " "
                << right << setw(4)  << "CPU"       << " "
                << right << setw(11) << "Memory"    << " "
                << right << setw(11) << "System DS" << " "
                << " Image DS"
                << endl << setw(60) << setfill('-') << "-" << setfill(' ');

            for (map<int,ObjectXML*>::iterator it=objects.begin();it!=objects.end();it++)
            {
                int cpu, mem;
                long long disk;

                VirtualMachineXML * vm = static_cast<VirtualMachineXML *>(it->second);

                vm->get_requirements(cpu, mem, disk);

                oss << endl
                    << right << setw(8)  << it->first   << " "
                    << right << setw(4)  << cpu         << " "
                    << right << setw(11) << mem         << " "
                    << right << setw(11) << disk        << " ";

                map<int,long long> ds_usage = vm->get_storage_usage();

                for (map<int,long long>::const_iterator ds_it = ds_usage.begin();
                        ds_it != ds_usage.end(); ds_it++)
                {
                    oss << " DS " << ds_it->first << ": " << ds_it->second << " ";
                }
            }
        }
        else
        {
            oss << "Found " << objects.size() << " pending/rescheduling VMs.";
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

int VirtualMachinePoolXML::dispatch(int vid, int hid, int dsid, bool resched) const
{
    xmlrpc_c::value deploy_result;

    try
    {
        if (resched == true)
        {
            client->call(client->get_endpoint(),           // serverUrl
                         "one.vm.migrate",                 // methodName
                         "siibb",                          // arguments format
                         &deploy_result,                   // resultP
                         client->get_oneauth().c_str(),    // argument 0 (AUTH)
                         vid,                              // argument 1 (VM)
                         hid,                              // argument 2 (HOST)
                         live_resched,                     // argument 3 (LIVE)
                         false);                           // argument 4 (ENFORCE)
        }
        else
        {
            client->call(client->get_endpoint(),           // serverUrl
                         "one.vm.deploy",                  // methodName
                         "siibi",                          // arguments format
                         &deploy_result,                   // resultP
                         client->get_oneauth().c_str(),    // argument 0 (AUTH)
                         vid,                              // argument 1 (VM)
                         hid,                              // argument 2 (HOST)
                         false,                            // argument 3 (ENFORCE)
                         dsid);                            // argument 5 (SYSTEM SD)
        }
    }
    catch (exception const& e)
    {
        ostringstream   oss;

        oss << "Exception raised: " << e.what() << '\n';

        NebulaLog::log("VM",Log::ERROR,oss);

        return -1;
    }

    vector<xmlrpc_c::value> values =
                    xmlrpc_c::value_array(deploy_result).vectorValueValue();

    bool success = xmlrpc_c::value_boolean(values[0]);

    if ( !success )
    {
        ostringstream oss;
        string message = xmlrpc_c::value_string(values[1]);

        oss << "Error deploying virtual machine " << vid
            << " to HID: " << hid << ". Reason: " << message;

        NebulaLog::log("VM",Log::ERROR,oss);

        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachinePoolXML::update(int vid, const string &st) const
{
    xmlrpc_c::value result;
    bool            success;

    try
    {
        client->call( client->get_endpoint(),     // serverUrl
                "one.vm.update",                  // methodName
                "sis",                            // arguments format
                &result,                          // resultP
                client->get_oneauth().c_str(),    // argument
                vid,                              // VM ID
                st.c_str()                        // Template
        );
    }
    catch (exception const& e)
    {
        return -1;
    }

    vector<xmlrpc_c::value> values =
            xmlrpc_c::value_array(result).vectorValueValue();

    success = xmlrpc_c::value_boolean(values[0]);

    if (!success)
    {
        return -1;
    }

    return 0;
}
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachineActionsPoolXML::set_up()
{
    ostringstream   oss;
    int             rc;

    rc = PoolXML::set_up();

    if ( rc == 0 )
    {
        if (objects.empty())
        {
            return -2;
        }

        oss.str("");
        oss << "VMs with scheduled actions:" << endl;

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

int VirtualMachineActionsPoolXML::action(
        int             vid,
        const string&   action,
        string&         error_msg) const
{
    xmlrpc_c::value result;
    bool            success;

    try
    {
        if (action == "snapshot-create")
        {
            client->call( client->get_endpoint(), // serverUrl
                "one.vm.snapshotcreate",          // methodName
                "sis",                            // arguments format
                &result,                          // resultP
                client->get_oneauth().c_str(),    // session
                vid,                              // VM ID
                string("").c_str()                // snapshot name
            );
        }
        else
        {
            client->call( client->get_endpoint(), // serverUrl
                "one.vm.action",                  // methodName
                "ssi",                            // arguments format
                &result,                          // resultP
                client->get_oneauth().c_str(),    // session
                action.c_str(),                   // action
                vid                               // VM ID
            );
        }
    }
    catch (exception const& e)
    {
        return -1;
    }

    vector<xmlrpc_c::value> values =
            xmlrpc_c::value_array(result).vectorValueValue();

    success = xmlrpc_c::value_boolean(values[0]);

    if (!success)
    {
        error_msg = xmlrpc_c::value_string(  values[1] );

        return -1;
    }

    return 0;
}
