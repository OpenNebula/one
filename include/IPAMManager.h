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

#ifndef IPAM_MANAGER_H_
#define IPAM_MANAGER_H_

#include <time.h>

#include "ProtocolMessages.h"
#include "DriverManager.h"
#include "Listener.h"

//Forward definitions
class IPAMRequest;
class VectorAttribute;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class IPAMManager :
    public DriverManager<Driver<ipam_msg_t>>,
                                          public Listener
{
public:

    IPAMManager(time_t timer, const std::string& mad_location)
        : DriverManager(mad_location)
        , Listener("IPAM Manager")
        , timer_thread(timer, [this]() {timer_action();})
    {
    }

    ~IPAMManager() = default;

    /**
     *  This functions starts the associated listener thread, and creates a
     *  new thread for the IPAMManager. This thread will wait in
     *  an action loop till it receives ACTION_FINALIZE.
     *    @return 0 on success.
     */
    int start();

    /**
     *  Loads IPAM Manager Mads defined in configuration file
     *   @param _mads configuration of drivers
     */
    int load_drivers(const std::vector<const VectorAttribute*>& _mads);

    /**
     *  Register (or requests) a new address range to the IPAM.
     */
    void trigger_register_address_range(IPAMRequest& ir);

    /**
     *  Unregisters an address range.
     */
    void trigger_unregister_address_range(IPAMRequest& ir);

    /**
     *  Requests the IPAM a free address (or range)
     */
    void trigger_get_address(IPAMRequest& ir);

    /**
     *  Requests to set an address (or range) as used
     */
    void trigger_allocate_address(IPAMRequest& ir);

    /**
     * Free an address in the IPAM
     */
    void trigger_free_address(IPAMRequest& ir);

    /**
     * Call vnet_create action
     */
    void trigger_vnet_create(int vnid, const std::string& xml64);

    /**
     * Call vnet_create action
     */
    void trigger_vnet_delete(int vnid, const std::string& xml64);

private:
    /**
     *  Timer action async execution
     */
    Timer timer_thread;

    /**
     *  Generic name for the IPAM driver
     */
    static const char * ipam_driver_name;

    /**
     *  Returns a pointer to a IPAM Manager driver. The driver is
     *  searched by its name.
     *    @param name the name of the driver
     *    @return the IPAM driver owned by uid with attribute name equal to value
     *    or 0 in not found
     */
    const Driver<ipam_msg_t> * get() const
    {
        return DriverManager::get_driver(ipam_driver_name);
    }

    /**
     *  This function initializes a request to call the IPAM driver
     *    @param type Message type
     *    @param ir the IPAM request
     */
    void send_request(IPAMManagerMessages type, IPAMRequest& ir);

    /**
     *  This function send an action message to IPAM driver
     *    @param type Message type
     *    @param oid Object ID
     *    @param xml Object xml data
     */
    void send_message(IPAMManagerMessages type,
                      int oid,
                      const std::string& xml);

    // -------------------------------------------------------------------------
    // Protocol implementation, procesing messages from driver
    // -------------------------------------------------------------------------
    /**
     *
     */
    static void _undefined(std::unique_ptr<ipam_msg_t> msg);

    /**
     *
     */
    void _notify_request(std::unique_ptr<ipam_msg_t> msg);

    void _vnet_create(std::unique_ptr<ipam_msg_t> msg);

    void _vnet_delete(std::unique_ptr<ipam_msg_t> msg);

    /**
     *
     */
    static void _log(std::unique_ptr<ipam_msg_t> msg);

    // -------------------------------------------------------------------------
    // Action Listener interface
    // -------------------------------------------------------------------------
    void timer_action()
    {
        check_time_outs_action();
    }

    static const int drivers_timeout = 10;

    void finalize_action() override
    {
        DriverManager::stop(drivers_timeout);
    }
};

#endif /*IPAM_MANAGER_H*/

