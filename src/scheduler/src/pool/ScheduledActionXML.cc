/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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

#include "ScheduledActionXML.h"
#include "Client.h"
#include "VirtualMachinePoolXML.h"
#include "VirtualMachine.h"

#include <string>
#include <stdexcept>

/* ************************************************************************** */
/* ************************************************************************** */
/* Helper functions to parse command line arguments for scheduled actions     */
/* ************************************************************************** */
/* ************************************************************************** */
/**
 * Parses value from string to given type
 *
 * @param val_s string value
 * @param val parsed value
 *
 * @return 0 on success, -1 otherwise
 */
template<typename T>
static int from_str(const std::string& val_s, T& val)
{
    if (val_s.empty())
    {
        return -1;
    }

    std::istringstream iss(val_s);

    iss >> val;

    if (iss.fail() || !iss.eof())
    {
        return -1;
    }

    return 0;
}

template<>
int from_str(const std::string& val_s, std::string& val)
{
    if (val_s.empty())
    {
        return -1;
    }

    val = val_s;
    return 0;
}

/**
 * Parses tokens to scpecific value with given type
 *
 * @param tokens values to parse
 * @param value given type to parse it
 *
 * @return 0 on success, -1 otherwise
 */
template<typename T>
static int parse_args(std::queue<std::string>& tokens, T& value)
{
    if (tokens.empty())
    {
        return -1;
    }

    int rc = from_str(tokens.front(), value);

    tokens.pop();

    return rc;
}

template<typename T, typename... Args>
static int parse_args(std::queue<std::string>& tokens, T& value, Args&... args)
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

/* ************************************************************************** */
/* ************************************************************************** */
/* XMLRPC API Interface for executing & updating scheduled actions            */
/* ************************************************************************** */
/* ************************************************************************** */

static bool update_action(int vmid, SchedAction* action, std::string& error)
{
    xmlrpc_c::value result;

    error.clear();

    try
    {
        std::ostringstream oss;

        oss << "<TEMPLATE>";
        action->to_xml(oss);
        oss << "</TEMPLATE>";

        Client::client()->call("one.vm.schedupdate", "iis", &result, vmid,
                               action->action_id(), oss.str().c_str());
    }
    catch (std::exception const& e)
    {
        return false;
    }

    std::vector<xmlrpc_c::value> values =
            xmlrpc_c::value_array(result).vectorValueValue();

    bool rc = xmlrpc_c::value_boolean(values[0]);

    if (!rc)
    {
        error = xmlrpc_c::value_string(values[1]);
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static int action_call(int vmid, SchedAction *sa, const std::string& aname,
        std::string& error)
{
    static std::set<std::string> valid_actions { "terminate", "terminate-hard",
        "undeploy", "undeploy-hard", "hold", "release", "stop", "suspend",
        "resume", "reboot", "reboot-hard", "poweroff", "poweroff-hard",
        "snapshot-create", "snapshot-revert", "snapshot-delete",
        "disk-snapshot-create", "disk-snapshot-revert", "disk-snapshot-delete",
        "backup" };

    if ( valid_actions.find(aname) == valid_actions.end() )
    {
        error = aname + " is not supported.";
        return -1;
    }

    std::string args_st = sa->vector_value("ARGS");

    xmlrpc_c::value result;

    std::stringstream       ss(args_st);
    std::queue<std::string> args;

    std::string tmp_arg;

    while (getline(ss, tmp_arg, ','))
    {
        args.push(tmp_arg);
    }

    try
    {
        if (aname == "snapshot-create")
        {
            std::string name = "";

            if (parse_args(args, name) != 0)
            {
                error = "Missing or malformed ARGS for: snapshot-create."
                        " Format: snapshot-name";
                return -1;
            }

            Client::client()->call("one.vm.snapshotcreate", "is", &result, vmid,
                    name.c_str());
        }
        else if (aname == "snapshot-revert")
        {
            int snapid = 0;

            if (parse_args(args, snapid) != 0)
            {
                error = "Missing or malformed ARGS for: snapshot-revert."
                        " Format: snapshot-id";
                return -1;
            }

            Client::client()->call("one.vm.snapshotrevert", "ii", &result, vmid,
                    snapid);
        }
        else if (aname == "snapshot-delete")
        {
            int snapid = 0;

            if (parse_args(args, snapid) != 0)
            {
                error = "Missing or malformed ARGS for: snapshot-delete."
                        " Format: snapshot-id";
                return -1;
            }

            Client::client()->call("one.vm.snapshotdelete", "ii", &result, vmid,
                    snapid);
        }
        else if (aname == "disk-snapshot-create")
        {
            int diskid = 0;
            std::string name = "";

            if (parse_args(args, diskid, name) != 0)
            {
                error = "Missing or malformed ARGS for: disk-snapshot-create."
                        " Format: disk-id, snapshot-name";
                return -1;
            }

            Client::client()->call("one.vm.disksnapshotcreate", "iis", &result,
                    vmid, diskid, name.c_str());
        }
        else if (aname == "disk-snapshot-revert")
        {
            int diskid = 0, snapid = 0;

            if (parse_args(args, diskid, snapid) != 0)
            {
                error = "Missing or malformed ARGS for: disk-snapshot-revert."
                        " Format: disk-id, snapshot-id";
                return -1;
            }

            Client::client()->call("one.vm.disksnapshotrevert", "iii", &result,
                    vmid, diskid, snapid);
        }
        else if (aname == "disk-snapshot-delete")
        {
            int diskid = 0, snapid = 0;

            if (parse_args(args, diskid, snapid) != 0)
            {
                error = "Missing or malformed ARGS for: disk-snapshot-delete."
                        " Format: disk-id, snapshot-id";
                return -1;
            }

            Client::client()->call("one.vm.disksnapshotdelete", "iii", &result,
                    vmid, diskid, snapid);
        }
        else if (aname == "backup")
        {
            int dsid = -1;
            bool reset = false;

            if (args.size() == 1)
            {
                args.push("0"); // For backward compatibility set reset = false
            }

            if (parse_args(args, dsid, reset) != 0)
            {
                error = "Missing or malformed ARGS for: backup."
                        " Format: datastore-id, reset";
                return -1;
            }

            Client::client()->call("one.vm.backup", "iib", &result, vmid, dsid, reset);
        }
        else
        {
            Client::client()->call("one.vm.action", "si", &result,
                    aname.c_str(), vmid);
        }
    }
    catch (std::exception const& e)
    {
        return -1;
    }

    std::vector<xmlrpc_c::value> values =
            xmlrpc_c::value_array(result).vectorValueValue();

    if (!xmlrpc_c::value_boolean(values[0]))
    {
        error = xmlrpc_c::value_string(values[1]);

        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static void scheduled_action(int vmid, SchedAction* action, const std::string& aname)
{
    std::ostringstream oss;

    oss << "Executing action '" << aname << "' for VM " << vmid << " : ";

    std::string error;

    if (action_call(vmid, action, aname, error) == 0)
    {
        time_t done_time = time(0);
        time_t next_time;

        action->remove("MESSAGE");

        action->replace("DONE", done_time);

        do
        {
            next_time = action->next_action();
        } while ( next_time < done_time && next_time != -1 );

        oss << "Success.";
    }
    else
    {
        std::ostringstream oss_aux;

        std::string time_str = one_util::log_time(time(0));

        oss_aux << time_str << " : " << error;

        action->replace("MESSAGE", oss_aux.str());

        oss << "Failure. " << error;
    }

    if (!update_action(vmid, action, error))
    {
        std::ostringstream oss_aux;

        oss_aux << "Unable to update scheduled action: " << error;
        NebulaLog::warn("SCHED", oss_aux.str());
    }

    NebulaLog::log("SCHED", Log::INFO, oss);
}

/* ************************************************************************** */
/* Scheduled Backups Dispatch                                                 */
/* ************************************************************************** */

void BackupActions::add(int vmid, int hid, time_t stime, SchedActionsXML& sas)
{
    struct VMBackupAction vm_ba;

    vm_ba.vm_id = vmid;

    SchedAction* first_action = nullptr;

    // Only first due backup with lower time will be executed
    for (auto action: sas)
    {
        std::string action_st = action->vector_value("ACTION");

        one_util::tolower(action_st);

        if ( action_st != "backup" || !action->is_due(stime))
        {
            continue;
        }

        if (!first_action ||
            first_action->get_time(stime) > action->get_time(stime))
        {
            first_action = action;
        }
    }

    if ( first_action == nullptr )
    {
        return;
    }

    std::ostringstream oss;

    oss << "Found pending backup for VM " << vmid;

    NebulaLog::log("SCHED", Log::INFO, oss);

    vm_ba.backup    = *first_action->vector_attribute();
    vm_ba.action_id = first_action->action_id();

    auto it = host_backups.find(vm_ba.vm_id);

    if ( it == host_backups.end() )
    {
        host_backups.insert(std::pair<int, std::vector<VMBackupAction>>(hid,
                    { vm_ba }));
    }
    else
    {
        it->second.push_back(std::move(vm_ba));
    }

    return;
}

void BackupActions::dispatch(VirtualMachineActionsPoolXML * vmapool)
{
    for (auto& hba : host_backups)
    {
        if ( vmapool->active_backups() >= max_backups )
        {
            std::ostringstream oss;

            oss << "Reached max number of active backups (" << max_backups << ")";

            NebulaLog::log("SCHED", Log::INFO, oss);
            break;
        }

        if ( vmapool->host_backups(hba.first) >= max_backups_host )
        {
            std::ostringstream oss;

            oss << "Reached max number of active backups (" << max_backups_host
                << ") in host " << hba.first;

            NebulaLog::log("SCHED", Log::INFO, oss);
            continue;
        }

        for (auto& vba: hba.second)
        {
            SchedAction sa(&vba.backup, vba.action_id);

            scheduled_action(vba.vm_id, &sa, "backup");

            vmapool->add_backup(hba.first);
        }
    }
}

/* ************************************************************************** */
/* Scheduled Actions Dispatch                                                 */
/* ************************************************************************** */
int SchedActionsXML::do_actions(int vmid, time_t stime)
{
    SchedAction* first_action = nullptr;
    std::string  first_aname  = "";

    // Only first is_due action with lower time will be executed
    // Backups are filtered out to schedule them separately
    for (auto action : *this)
    {
        if (!action->is_due(stime))
        {
            continue;
        }

        std::string aname = action->vector_value("ACTION");
        one_util::tolower(aname);

        if (aname == "backup")
        {
            continue;
        }

        if (!first_action ||
            first_action->get_time(stime) > action->get_time(stime))
        {
            first_action = action;
            first_aname  = aname;
        }
    }

    if (!first_action)
    {
        return 0;
    }

    scheduled_action(vmid, first_action, first_aname);

    return 0;
}

