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

#include "MonitorDriverProtocol.h"

#include "NebulaLog.h"
#include "HostMonitorManager.h"
#include "OneMonitorDriver.h"
#include "MonitorDriverMessages.h"
#include "SSLUtil.h"

#include <iomanip>

using namespace std;

HostMonitorManager * MonitorDriverProtocol::hm = nullptr;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MonitorDriverProtocol::_undefined(unique_ptr<monitor_msg_t> msg)
{
    NebulaLog::info("MDP", "Received UNDEFINED msg: " + msg->payload());
}

static void log_message(const monitor_msg_t& msg)
{
    if ( NebulaLog::log_level() < Log::DDEBUG )
    {
        return;
    }

    ostringstream oss;

    struct tm tms;
    time_t    ts = msg.timestamp();

    localtime_r(&ts, &tms);

    oss << "[" << tms.tm_hour << ":" << tms.tm_min << ":" << tms.tm_sec
        << "] Received " << msg.type_str() << " message from host "
        << msg.oid() << ":\n" << msg.payload();

    NebulaLog::ddebug("MDP", oss.str());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MonitorDriverProtocol::_monitor_vm(unique_ptr<monitor_msg_t> msg)
{
    log_message(*msg);

    if (msg->status() != "SUCCESS")
    {
        NebulaLog::warn("MDP", "Failed to monitor VM for host " +
                        to_string(msg->oid()) + ": " + msg->payload());

        return;
    }

    if (!hm->test_set_timestamp(MonitorDriverMessages::MONITOR_VM, msg->oid(),
                                msg->timestamp()))
    {
        return;
    }

    Template tmpl;
    char *   error_msg;

    int rc = tmpl.parse(msg->payload(), &error_msg);

    if (rc != 0)
    {
        ostringstream oss;
        oss << "Error parsing VM monitoring template from host " << msg->oid()
            << "\nMessage: " << msg->payload()
            << "\nError: " << error_msg;

        NebulaLog::error("MDP", oss.str());

        free(error_msg);

        hm->error_monitor(msg->oid(), "Error parsing monitor information");
        return;
    }

    map<int, Template> vms_templ;
    vector<VectorAttribute*> vms;

    tmpl.get("VM", vms);

    // Merge all attributes by ID
    for (const auto& vm : vms)
    {
        int id = -1;
        string monitor_b64;
        string deploy_id;

        if (vm->vector_value("ID", id) != 0)
        {
            continue;
        }

        vm->vector_value("MONITOR", monitor_b64);
        vm->vector_value("DEPLOY_ID", deploy_id);

        string monitor_plain;

        ssl_util::base64_decode(monitor_b64, monitor_plain);

        Template mon_tmpl;

        rc = mon_tmpl.parse(monitor_plain, &error_msg);

        if (rc != 0)
        {
            NebulaLog::error("MDP", "Error parsing VM monitor attribute: "
                             + monitor_plain + ", error: " + error_msg);

            free(error_msg);
            continue;
        }

        if (id < 0)
        {
            // Wild VM, no need to merge storage monitor data
            hm->monitor_wild_vm(deploy_id, mon_tmpl);
        }
        else
        {
            // OpenNebula VM, merge templates with same ID
            auto it = vms_templ.find(id);

            if (it == vms_templ.end())
            {
                vms_templ[id] = move(mon_tmpl);
            }
            else
            {
                it->second.merge(&mon_tmpl);
            }
        }
    }

    // Process all monitoring templates
    for (const auto& vm : vms_templ)
    {
        hm->monitor_vm(vm.first, vm.second);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MonitorDriverProtocol::_beacon_host(unique_ptr<monitor_msg_t> msg)
{
    log_message(*msg);

    if (msg->status() != "SUCCESS")
    {
        NebulaLog::warn("MDP", "Error condition detected on beacon for host "
                        + to_string(msg->oid()) + ": " + msg->payload());

        if (msg->oid() >= 0)
        {
            hm->error_monitor(msg->oid(), msg->payload());
        }
        return;
    }

    hm->update_last_monitor(msg->oid());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MonitorDriverProtocol::_monitor_host(unique_ptr<monitor_msg_t> msg)
{
    log_message(*msg);

    if (msg->status() != "SUCCESS")
    {
        NebulaLog::warn("MDP", "Failed to monitor host " + to_string(msg->oid())
                        + ": " + msg->payload());

        hm->error_monitor(msg->oid(), msg->payload());
        return;
    }

    if (!hm->test_set_timestamp(MonitorDriverMessages::MONITOR_HOST, msg->oid(),
                                msg->timestamp()))
    {
        return;
    }

    Template tmpl;
    char*    error_msg;

    int rc = tmpl.parse(msg->payload(), &error_msg);

    if (rc != 0)
    {
        ostringstream oss;
        oss << "Error parsing monitoring template for host " << msg->oid()
            << "\nMessage: " << msg->payload()
            << "\nError: " << error_msg;

        NebulaLog::error("MDP", oss.str());

        free(error_msg);

        hm->error_monitor(msg->oid(), "Error parsing monitor information");
        return;
    }

    hm->monitor_host(msg->oid(), tmpl);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MonitorDriverProtocol::_system_host(unique_ptr<monitor_msg_t> msg)
{
    log_message(*msg);

    if (msg->status() != "SUCCESS")
    {
        NebulaLog::warn("MDP", "Failed to get system information for host " +
                        to_string(msg->oid()) + ": " + msg->payload());

        hm->error_monitor(msg->oid(), msg->payload());
        return;
    }

    if (!hm->test_set_timestamp(MonitorDriverMessages::SYSTEM_HOST, msg->oid(),
                                msg->timestamp()))
    {
        return;
    }

    auto oned = hm->get_oned_driver();
    oned->host_system_info(msg->oid(), msg->status(), msg->payload());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MonitorDriverProtocol::_state_vm(unique_ptr<monitor_msg_t> msg)
{
    log_message(*msg);

    if (msg->status() != "SUCCESS")
    {
        NebulaLog::warn("MDP", "Failed to monitor VM state for host " +
                        to_string(msg->oid()) + ": " + msg->payload());

        return;
    }

    if (!hm->test_set_timestamp(MonitorDriverMessages::STATE_VM, msg->oid(),
                                msg->timestamp()))
    {
        return;
    }

    auto oned = hm->get_oned_driver();
    oned->vm_state(msg->oid(), msg->payload());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* Format of the START_MONITOR response message is:
 * <MONITOR_MESSAGES>
 *   <MONITOR_VM>
 *   ...
 *   </MONITOR_VM>
 *   ...
 * </MONITOR_MESSAGES>
 *
 * It includes all messages that may be sent by probes, defined in
 * MonitorDriverMessages. This message is constructed in monitord_client.rb
 */
void MonitorDriverProtocol::_start_monitor(unique_ptr<monitor_msg_t> msg)
{
    log_message(*msg);

    if (msg->status() != "SUCCESS")
    {
        NebulaLog::warn("MDP", "Start monitor failed for host " +
                        to_string(msg->oid()) + ": " + msg->payload());

        hm->start_monitor_failure(msg->oid());
        return;
    }

    auto data = one_util::trim(msg->payload());
    if (data.empty())
    {
        hm->start_monitor_success(msg->oid());

        return;
    }

    ObjectXML msg_xml;

    if ( msg_xml.update_from_str(msg->payload()) != 0 )
    {
        hm->start_monitor_failure(msg->oid());

        NebulaLog::warn("MDP", "Error parsing start message for host " +
                        to_string(msg->oid()) + ": " + msg->payload());

        return;
    }

    time_t ts;

    msg_xml.xpath(ts, "/MONITOR_MESSAGES/TIMESTAMP", static_cast<time_t>(0));

    const vector<MonitorDriverMessages> stypes =
    {
        MonitorDriverMessages::MONITOR_VM,
        MonitorDriverMessages::BEACON_HOST,
        MonitorDriverMessages::MONITOR_HOST,
        MonitorDriverMessages::SYSTEM_HOST,
        MonitorDriverMessages::STATE_VM
    };

    for (const auto& it : stypes)
    {
        string payload64, payload;

        string xpath = "/MONITOR_MESSAGES/" +
                       monitor_msg_t::type_str(it);

        if ( msg_xml.xpath(payload64, xpath.c_str(), "") != 0 )
        {
            continue;
        }

        ssl_util::base64_decode(payload64, payload);

        auto m = make_unique<monitor_msg_t>();

        m->type(it);

        m->oid(msg->oid());

        m->timestamp(ts);

        m->status("SUCCESS");

        m->payload(payload);

        switch(it)
        {
            case MonitorDriverMessages::MONITOR_VM:
                _monitor_vm(move(m));
                break;
            case MonitorDriverMessages::BEACON_HOST:
                _beacon_host(move(m));
                break;
            case MonitorDriverMessages::MONITOR_HOST:
                _monitor_host(move(m));
                break;
            case MonitorDriverMessages::SYSTEM_HOST:
                _system_host(move(m));
                break;
            case MonitorDriverMessages::STATE_VM:
                _state_vm(move(m));
                break;
            default:
                break;
        }
    }

    hm->start_monitor_success(msg->oid());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MonitorDriverProtocol::_log(unique_ptr<monitor_msg_t> msg)
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
