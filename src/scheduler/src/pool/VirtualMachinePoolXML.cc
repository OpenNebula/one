/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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
        map<int, ObjectXML*>::iterator it;

        if (objects.empty())
        {
            return -2;
        }

        vm_resources.clear();

        for ( it = objects.begin(); it != objects.end(); ++it )
        {
            vm_resources.add_resource(it->first);
        } 

        if (NebulaLog::log_level() >= Log::DDDEBUG)
        {

            oss << "Pending/rescheduling VM and capacity requirements:" << endl;

            oss << right << setw(8)  << "ACTION"    << " "
                << right << setw(8)  << "VM"        << " "
                << right << setw(4)  << "CPU"       << " "
                << right << setw(11) << "Memory"    << " "
                << right << setw(3)  << "PCI"       << " "
                << right << setw(11) << "System DS" << " "
                << " Image DS" << endl
                << setw(60) << setfill('-') << "-" << setfill(' ') << endl;

            for (it = objects.begin() ; it != objects.end() ; ++it)
            {
                int cpu, mem;
                long long disk;
                vector<VectorAttribute *> pci;

                string action = "DEPLOY";

                VirtualMachineXML * vm;

                vm = static_cast<VirtualMachineXML *>(it->second);

                vm->get_requirements(cpu, mem, disk, pci);

                if (vm->is_resched())
                {
                    action = "RESCHED";
                }
                else if (vm->is_resume())
                {
                    action = "RESUME";
                }

                oss << right << setw(8)  << action      << " "
                    << right << setw(8)  << it->first   << " "
                    << right << setw(4)  << cpu         << " "
                    << right << setw(11) << mem         << " "
                    << right << setw(3)  << pci.size()  << " "
                    << right << setw(11) << disk        << " ";

                map<int,long long> ds_usage = vm->get_storage_usage();
                map<int,long long>::const_iterator ds_it;

                for ( ds_it = ds_usage.begin(); ds_it != ds_usage.end(); ds_it++)
                {
                    oss << " DS " << ds_it->first << ": " << ds_it->second <<" ";
                }

                oss << endl;
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
        client->call("one.vmpool.info", "iiii", &result, -2, -1, -1, -1);

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

    VirtualMachineXML* vm = get(vid);

    if (vm != 0 && vm->clear_log())
    {
        update(vm);
    }

    try
    {
        if (resched == true)
        {
            client->call("one.vm.migrate",// methodName
                         "iibb",          // arguments format
                         &deploy_result,  // resultP
                         vid,             // argument 1 (VM)
                         hid,             // argument 2 (HOST)
                         live_resched,    // argument 3 (LIVE)
                         false);          // argument 4 (ENFORCE)
        }
        else
        {
            client->call("one.vm.deploy", // methodName
                         "iibi",          // arguments format
                         &deploy_result,  // resultP
                         vid,             // argument 1 (VM)
                         hid,             // argument 2 (HOST)
                         false,           // argument 3 (ENFORCE)
                         dsid);           // argument 5 (SYSTEM SD)
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
        client->call("one.vm.update", "is", &result, vid, st.c_str());
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
            client->call("one.vm.snapshotcreate", "is", &result, vid, "");
        }
        else
        {
            client->call("one.vm.action", "si", &result, action.c_str(), vid);
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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachineRolePoolXML::set_up()
{
    int rc = PoolXML::set_up();

    if ( rc == 0 )
    {
        ostringstream oss;

        oss << "VMs in VMGroups:" << endl;

        map<int,ObjectXML*>::iterator it;

        for (it=objects.begin();it!=objects.end();it++)
        {
            oss << " " << it->first;
        }

        NebulaLog::log("VM", Log::DEBUG, oss);
    }

    return rc;
}

