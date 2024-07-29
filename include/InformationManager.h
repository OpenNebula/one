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

#ifndef INFORMATION_MANAGER_H_
#define INFORMATION_MANAGER_H_

#include "DriverManager.h"
#include "Listener.h"
#include "ProtocolMessages.h"
#include "RaftManager.h"

class HostPool;
class Host;
class VirtualMachinePool;

class InformationManager : public DriverManager<Driver<im_msg_t>>
{
public:
    InformationManager(
            HostPool * _hpool,
            VirtualMachinePool * _vmpool,
            const std::string& mad_location)
        : DriverManager(mad_location)
        , hpool(_hpool)
        , vmpool(_vmpool)
    {
    }

    ~InformationManager() = default;

    /**
     *  This functions starts the associated listener thread, and creates a
     *  new thread for the Information Manager. This thread will wait in
     *  an action loop till it receives ACTION_FINALIZE.
     *    @return 0 on success.
     */
    int start();

    void finalize()
    {
        stop(drivers_timeout);
    };

    /**
     *  Sends a STOPMONITR command to the associated driver and host
     *    @param hid the host id
     *    @param name of the host
     *    @param im_mad the driver name
     */
    void stop_monitor(int hid,
                      const std::string& name,
                      const std::string& im_mad);

    /**
     *  Starts the monitor process on the host
     *    @param host to monitor
     *    @param update_remotes to copy the monitor probes to the host
     *    @return 0 on success
     */
    int start_monitor(Host * host, bool update_remotes);

    /**
     *  Send host info to monitor
     */
    void update_host(Host *host);

    /**
     *  Send host delete message to monitor
     */
    void delete_host(int hid);

    /**
     *  Set raft status, send info to monitor daemon
     */
    void raft_status(RaftManager::State raft);

protected:
    /**
     *  Received undefined message -> print error
     */
    static void _undefined(std::unique_ptr<im_msg_t> msg);

    /**
     *  Message HOST_STATE update from monitor
     */
    void _host_state(std::unique_ptr<im_msg_t> msg);

    /**
     *  Message HOST_SYSTEM update from monitor
     */
    void _host_system(std::unique_ptr<im_msg_t> msg);

    /**
     *  Message VM_STATE from monitor
     */
    void _vm_state(std::unique_ptr<im_msg_t> msg);

private:
    /**
     *  Pointer to the Host Pool
     */
    HostPool *      hpool;

    /**
     *  Pointer to the Host Pool
     */
    VirtualMachinePool * vmpool;

    /**
     *  Default timeout to wait for Information Driver (monitord)
     */
    static const int drivers_timeout = 10;
};

#endif /*INFORMATION_MANAGER_H_*/

