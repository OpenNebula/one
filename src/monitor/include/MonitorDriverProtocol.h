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

#ifndef MONITOR_DRIVER_PROTOCOL_H_
#define MONITOR_DRIVER_PROTOCOL_H_

#include "MonitorDriverMessages.h"
#include "Message.h"

#include <memory>

class HostMonitorManager;

struct MonitorDriverProtocol
{
public:
    static void _undefined(std::unique_ptr<monitor_msg_t> msg);

    static void _monitor_vm(std::unique_ptr<monitor_msg_t> msg);

    static void _beacon_host(std::unique_ptr<monitor_msg_t> msg);

    static void _monitor_host(std::unique_ptr<monitor_msg_t> msg);

    static void _system_host(std::unique_ptr<monitor_msg_t> msg);

    static void _state_vm(std::unique_ptr<monitor_msg_t> msg);

    static void _start_monitor(std::unique_ptr<monitor_msg_t> msg);

    static void _log(std::unique_ptr<monitor_msg_t> msg);

    static HostMonitorManager * hm;
};

#endif // MONITOR_DRIVER_H_
