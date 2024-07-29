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

#include "OneMonitorDriver.h"

#include "HostMonitorManager.h"
#include "NebulaLog.h"

using namespace std;


HostMonitorManager * OneMonitorDriver::hm = nullptr;

OneMonitorDriver::OneMonitorDriver(HostMonitorManager * _hm)
{
    hm = _hm;

    register_action(InformationManagerMessages::UNDEFINED,
                    &OneMonitorDriver::_undefined);

    register_action(InformationManagerMessages::HOST_LIST,
                    &OneMonitorDriver::_host_list);

    register_action(InformationManagerMessages::UPDATE_HOST,
                    &OneMonitorDriver::_update_host);

    register_action(InformationManagerMessages::DEL_HOST,
                    &OneMonitorDriver::_del_host);

    register_action(InformationManagerMessages::START_MONITOR,
                    &OneMonitorDriver::_start_monitor);

    register_action(InformationManagerMessages::STOP_MONITOR,
                    &OneMonitorDriver::_stop_monitor);

    register_action(InformationManagerMessages::RAFT_STATUS,
                    &OneMonitorDriver::_raft_status);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void OneMonitorDriver::host_state(int oid, const std::string& state)
{
    im_msg_t oned_msg;

    oned_msg.type(InformationManagerMessages::HOST_STATE);
    oned_msg.oid(oid);
    oned_msg.payload(state);

    write2one(oned_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void OneMonitorDriver::vm_state(int oid, const std::string& state)
{
    im_msg_t oned_msg;

    oned_msg.type(InformationManagerMessages::VM_STATE);
    oned_msg.oid(oid);
    oned_msg.payload(state);

    write2one(oned_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void OneMonitorDriver::host_system_info(int oid, const std::string& status,
                                        const std::string& payload)
{
    im_msg_t oned_msg;

    oned_msg.type(InformationManagerMessages::HOST_SYSTEM);
    oned_msg.oid(oid);
    oned_msg.status(status);
    oned_msg.payload(payload);

    write2one(oned_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void OneMonitorDriver::_undefined(std::unique_ptr<im_msg_t> msg)
{
    NebulaLog::info("MDR", "Received UNDEFINED msg: " + msg->payload());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void OneMonitorDriver::_host_list(std::unique_ptr<im_msg_t> msg)
{
    ObjectXML xml(msg->payload());

    vector<xmlNodePtr> nodes;

    xml.get_nodes("/HOST_POOL/HOST", nodes);

    for (const auto& node : nodes)
    {
        Template host(false, '=', "HOST");
        host.from_xml_node(node);
        int id;
        if (host.get("ID", id))
        {
            string xml_str;
            hm->update_host(id, host.to_xml(xml_str));
        }
    }

    xml.free_nodes(nodes);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void OneMonitorDriver::_update_host(std::unique_ptr<im_msg_t> msg)
{
    hm->update_host(msg->oid(), msg->payload());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void OneMonitorDriver::_del_host(std::unique_ptr<im_msg_t> msg)
{
    hm->delete_host(msg->oid());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void OneMonitorDriver::_start_monitor(std::unique_ptr<im_msg_t> msg)
{
    hm->start_host_monitor(msg->oid());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void OneMonitorDriver::_stop_monitor(std::unique_ptr<im_msg_t> msg)
{
    hm->stop_host_monitor(msg->oid());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void OneMonitorDriver::_raft_status(std::unique_ptr<im_msg_t> msg)
{
    hm->raft_status(msg->payload());
}
