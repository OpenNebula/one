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

#include "MonitorDriverProtocol.h"

#include "NebulaLog.h"
#include "HostMonitorManager.h"
#include "OneMonitorDriver.h"

HostMonitorManager * MonitorDriverProtocol::hm = nullptr;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MonitorDriverProtocol::_undefined(message_t msg)
{
    NebulaLog::info("MDP", "Received UNDEFINED msg: " + msg->payload());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MonitorDriverProtocol::_monitor_vm(message_t msg)
{
    NebulaLog::ddebug("MDP", "Received MONITOR_VM msg: " + msg->payload());

    char * error_msg;

    Template tmpl;
    int rc = tmpl.parse(msg->payload(), &error_msg);

    if (rc != 0)
    {
        NebulaLog::error("MDP", msg->payload());
        NebulaLog::error("MDP", string("Error parsing VM monitoring template: ")
                + error_msg);

        free(error_msg);
        return;
    }

    map<string, pair<int, Template>> vms_templ;
    vector<VectorAttribute*> vms;

    tmpl.get("VM", vms);

    // Merge all attributes by deploy_id
    for (const auto& vm : vms)
    {
        int id = -1;
        string monitor_b64;
        string uuid;

        if (vm->vector_value("ID", id) != 0)
        {
            continue;
        }

        vm->vector_value("MONITOR", monitor_b64);
        vm->vector_value("UUID", uuid);

        auto monitor_plain = one_util::base64_decode(monitor_b64);

        if (monitor_plain != nullptr)
        {
            Template mon_tmpl;

            rc = mon_tmpl.parse(*monitor_plain, &error_msg);

            if (rc != 0)
            {
                NebulaLog::error("MDP", "Error parsing VM monitor attribute: "
                    + *monitor_plain + ", error: " + error_msg);

                delete monitor_plain;

                free(error_msg);
                continue;
            }

            delete monitor_plain;

            auto it = vms_templ.find(uuid);

            if (it == vms_templ.end())
            {
                vms_templ.insert(make_pair(std::move(uuid), make_pair(id, std::move(mon_tmpl))));
            }
            else
            {
                it->second.second.merge(&mon_tmpl);
            }
        }
    }

    // Process all monitoring templates
    for (const auto& vm : vms_templ)
    {
        hm->monitor_vm(vm.second.first, vm.first, vm.second.second);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MonitorDriverProtocol::_beacon_host(message_t msg)
{
    NebulaLog::ddebug("MDP", "Received beacon for host " +
            to_string(msg->oid()) + ": " + msg->payload());

    hm->update_last_monitor(msg->oid());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MonitorDriverProtocol::_monitor_host(message_t msg)
{
    NebulaLog::ddebug("MDP", "Received monitoring information for host " +
            to_string(msg->oid()) + ": " + msg->payload());

    std::string msg_str = msg->payload();
    char * error_msg;

    Template tmpl;
    int rc = tmpl.parse(msg_str, &error_msg);

    if (rc != 0)
    {
        NebulaLog::error("MDP", string("Error parsing monitoring template: ")
                + error_msg);

        free(error_msg);
        return;
    }

    bool result = msg->status() == "SUCCESS" ? true : false;

    hm->monitor_host(msg->oid(), result, tmpl);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MonitorDriverProtocol::_system_host(message_t msg)
{
    NebulaLog::ddebug("MDP", "Received system information for host " +
            to_string(msg->oid()) + ": " + msg->payload());

    auto oned = hm->get_oned_driver();
    oned->host_system_info(msg->oid(), msg->status(), msg->payload());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MonitorDriverProtocol::_state_vm(message_t msg)
{
    NebulaLog::ddebug("MDP", "Received state vm message for host " +
            to_string(msg->oid()) + ": " + msg->payload());

    if (msg->status() != "SUCCESS")
    {
        NebulaLog::warn("MDP", "Failed to monitor VM state for host " +
            to_string(msg->oid()) + ": " + msg->payload());
    }

    auto oned = hm->get_oned_driver();
    oned->vm_state(msg->oid(), msg->payload());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MonitorDriverProtocol::_start_monitor(message_t msg)
{
    NebulaLog::ddebug("MDP", "Received start monitor for host " +
            to_string(msg->oid()) + ": " + msg->payload());

    if (msg->status() != "SUCCESS")
    {
        hm->start_monitor_failure(msg->oid());

        NebulaLog::warn("MDP", "Start monitor failed for host " +
            to_string(msg->oid()) + ": " + msg->payload());

        return;
    }

    auto oned = hm->get_oned_driver();
    oned->host_system_info(msg->oid(), msg->status(), msg->payload());

    hm->start_monitor_success(msg->oid());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MonitorDriverProtocol::_log(message_t msg)
{
    auto log_type = Log::INFO;

    switch (msg->status()[0])
    {
            case 'E':
                log_type = Log::ERROR;
                break;
            case 'W':
                log_type = Log::WARNING;
                break;
            case 'D':
                log_type = Log::DEBUG;
                break;
    }

    NebulaLog::log("MDP", log_type, msg->payload());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
