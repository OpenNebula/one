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

#ifndef ONE_MONITOR_DRIVER_H_
#define ONE_MONITOR_DRIVER_H_

#include "OpenNebulaDriver.h"
#include "ProtocolMessages.h"

class HostMonitorManager;

/**
 *  This class implements the Monitor Driver interface for oned.
 */
class OneMonitorDriver :
    public OpenNebulaDriver<im_msg_t>
{
public:
    OneMonitorDriver(HostMonitorManager * _hm);

    /**
     *  Send a host state message to oned
     *    @param oid host id
     *    @param state for the host
     */
    void host_state(int oid, const std::string& state);

    /**
     *  Send a VM state message to oned
     *    @param oid host id
     *    @param state for the host
     */
    void vm_state(int oid, const std::string& state);

    /**
     *  Send host system information to oned
     *    @param oid host id
     *    @param status result of the system monitor
     *    @param payload system data
     */
    void host_system_info(int oid, const std::string& status, const std::string& payload);

private:
    //--------------------------------------------------------------------------
    // Message callbacks, implements the driver protocol
    //--------------------------------------------------------------------------
    static void _undefined(std::unique_ptr<im_msg_t> msg);

    /**
     *  List of all hosts in xml format
     */
    static void _host_list(std::unique_ptr<im_msg_t> msg);

    /**
     *  Update information from a host
     */
    static void _update_host(std::unique_ptr<im_msg_t> msg);

    /**
     *  Remove host from the pool
     */
    static void _del_host(std::unique_ptr<im_msg_t> msg);

    /**
     *  Start the monitor agent/ or active monitor the host
     */
    static void _start_monitor(std::unique_ptr<im_msg_t> msg);

    /**
     *  Stop the monitor agent/ or stop monitor the host
     */
    static void _stop_monitor(std::unique_ptr<im_msg_t> msg);

    /**
     *  Raft status changed
     */
    static void _raft_status(std::unique_ptr<im_msg_t> msg);

private:
    static HostMonitorManager * hm;
};

#endif // ONE_MONITOR_DRIVER_H_
