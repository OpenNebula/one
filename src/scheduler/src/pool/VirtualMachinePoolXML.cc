/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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
#include <queue>

/* -------------------------------------------------------------------------- */
/**
 * Parses value from string to given type
 *
 * @param val_s string value
 * @param val parsed value
 *
 * @return 0 on success, -1 otherwise
 */
/* -------------------------------------------------------------------------- */
template<typename T>
static int from_str(const string& val_s, T& val)
{
    if (val_s.empty())
    {
        return -1;
    }

    istringstream iss(val_s);

    iss >> val;

    if (iss.fail() || !iss.eof())
    {
        return -1;
    }

    return 0;
}

template<>
int from_str(const string& val_s, string& val)
{
    if (val_s.empty())
    {
        return -1;
    }

    val = val_s;
    return 0;
}

/* -------------------------------------------------------------------------- */
/**
 * Parses tokens to scpecific value with given type
 *
 * @param tokens values to parse
 * @param value given type to parse it
 *
 * @return 0 on success, -1 otherwise
 */
/* -------------------------------------------------------------------------- */
template<typename T>
static int parse_args(queue<string>& tokens, T& value)
{
    if (tokens.empty())
    {
        return -1;
    }

    int rc = from_str(tokens.front(), value);

    tokens.pop();

    return rc;
}

/* -------------------------------------------------------------------------- */

template<typename T, typename... Args>
static int parse_args(queue<string>& tokens, T& value, Args&... args)
{
    if (tokens.empty())
    {
        return -1;
    }

    int rc = from_str(tokens.front(), value);

    tokens.pop();

    if ( rc != 0 )
    {
        return -1;
    }

    return parse_args(tokens, args...);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

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
                HostShareCapacity sr;

                string action = "DEPLOY";

                VirtualMachineXML * vm;

                vm = static_cast<VirtualMachineXML *>(it->second);

                vm->get_capacity(sr);

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
                    << right << setw(4)  << sr.cpu        << " "
                    << right << setw(11) << sr.mem        << " "
                    << right << setw(3)  << sr.pci.size() << " "
                    << right << setw(11) << sr.disk       << " ";

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

    objects.insert(pair<int,ObjectXML*>(vm->get_oid(), vm));
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachinePoolXML::load_info(xmlrpc_c::value &result)
{
    try
    {
        client->call("one.vmpool.infoextended", "iiii", &result, -2, -1, -1, -1);

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

int VirtualMachinePoolXML::dispatch(int vid, int hid, int dsid, bool resched,const string& extra_template) const
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
                         "iibis",         // arguments format
                         &deploy_result,  // resultP
                         vid,             // argument 1 (VM)
                         hid,             // argument 2 (HOST)
                         false,           // argument 3 (ENFORCE)
                         dsid,            // argument 5 (SYSTEM SD)
                         extra_template.c_str()); // argument 6 (EXTRA TEMPLATE)
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
        client->call("one.vm.update", "isi", &result, vid, st.c_str(), 1);
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
        const string&   args,
        string&         error_msg) const
{
    xmlrpc_c::value result;
    bool            success;

    queue<string>  sargs;
    string         tmp_arg;

    stringstream    ss(args);

    while (getline(ss, tmp_arg, ','))
    {
        sargs.push(tmp_arg);
    }

    try
    {
        if (action == "snapshot-create")
        {
            string name = "";

            int rc = parse_args(sargs, name);

            if (rc != 0)
            {
                error_msg = "Missing or malformed ARGS for: snapshot-create."
                    " Format: snapshot-name";
                return -1;
            }

            client->call("one.vm.snapshotcreate",
                         "is",
                         &result,
                         vid,
                         name.c_str());
        }
        else if (action == "snapshot-revert")
        {
            int snapid = 0;

            int rc = parse_args(sargs, snapid);

            if (rc != 0)
            {
                error_msg = "Missing or malformed ARGS for: snapshot-revert."
                    " Format: snapshot-id";
                return -1;
            }

            client->call("one.vm.snapshotrevert", "ii", &result, vid, snapid);
        }
        else if (action == "snapshot-delete")
        {
            int snapid = 0;

            int rc = parse_args(sargs, snapid);

            if (rc != 0)
            {
                error_msg = "Missing or malformed ARGS for: snapshot-delete."
                    " Format: snapshot-id";
                return -1;
            }

            client->call("one.vm.snapshotdelete", "ii", &result, vid, snapid);
        }
        else if (action == "disk-snapshot-create")
        {
            int diskid  = 0;
            string name = "";

            int rc = parse_args(sargs, diskid, name);

            if (rc != 0)
            {
                error_msg = "Missing or malformed ARGS for: disk-snapshot-create."
                    " Format: disk-id, snapshot-name";
                return -1;
            }

            client->call("one.vm.disksnapshotcreate",
                         "iis",
                         &result,
                         vid,
                         diskid,
                         name.c_str());
        }
        else if (action == "disk-snapshot-revert")
        {
            int diskid = 0, snapid = 0;

            int rc = parse_args(sargs, diskid, snapid);

            if (rc != 0)
            {
                error_msg = "Missing or malformed ARGS for: disk-snapshot-revert."
                    " Format: disk-id, snapshot-id";
                return -1;
            }

            client->call("one.vm.disksnapshotrevert",
                         "iii",
                         &result,
                         vid,
                         diskid,
                         snapid);
        }
        else if (action == "disk-snapshot-delete")
        {
            int diskid = 0, snapid = 0;

            int rc = parse_args(sargs, diskid, snapid);

            if (rc != 0)
            {
                error_msg = "Missing or malformed ARGS for: disk-snapshot-delete."
                    " Format: disk-id, snapshot-id";
                return -1;
            }

            client->call("one.vm.disksnapshotdelete",
                         "iii",
                         &result,
                         vid,
                         diskid,
                         snapid);
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

