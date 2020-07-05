/* -------------------------------------------------------------------------- */
/* Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                */
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
#include "ActionManager.h"
#include "NebulaLog.h"

//Forward definitions
class IPAMRequest;
class VectorAttribute;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class IPMAction : public ActionRequest
{
public:
    enum Actions
    {
        REGISTER_ADDRESS_RANGE,   /**< Register/Request a new IP network    */
        UNREGISTER_ADDRESS_RANGE, /**< Unregister IP network                */
        ALLOCATE_ADDRESS,         /**< Request a specific IP (or range)     */
        GET_ADDRESS,              /**< Request any free  IP (or range)      */
        FREE_ADDRESS              /**< Frees a previously requested IP      */
    };

    IPMAction(Actions a, IPAMRequest *r):ActionRequest(ActionRequest::USER),
        _action(a), _request(r){};

    IPMAction(const IPMAction& o):ActionRequest(o._type), _action(o._action),
        _request(o._request){};

    Actions action() const
    {
        return _action;
    }

    IPAMRequest * request() const
    {
        return _request;
    }

    ActionRequest * clone() const
    {
        return new IPMAction(*this);
    }

private:
    Actions       _action;

    IPAMRequest * _request;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" void * ipamm_action_loop(void *arg);

class IPAMManager :
    public DriverManager<Driver<ipam_msg_t>>,
    public ActionListener
{
public:

    IPAMManager(time_t timer, const std::string mad_location):
            DriverManager(mad_location), timer_period(timer)
    {
        am.addListener(this);
    };

    ~IPAMManager(){};

    /**
     * Triggers specific action to the IPAM Manager. This function
     * wraps the ActionManager trigger function.
     *   @param action to the IPAM Manager action
     *   @param request an IPAM request
     */
    void trigger(IPMAction::Actions action, IPAMRequest* request)
    {
        IPMAction ipam_ar(action, request);

        am.trigger(ipam_ar);
    }

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
     *  Gets the thread identification.
     *    @return pthread_t for the manager thread (that in the action loop).
     */
    pthread_t get_thread_id() const
    {
        return ipamm_thread;
    };

    /**
     *  Finalizes the IPAM Manager
     */
    void finalize()
    {
        am.finalize();
    };

private:
    /**
     *  Thread id for the IPAM Manager
     */
    pthread_t               ipamm_thread;

    /**
     *  Action engine for the Manager
     */
    ActionManager           am;

    /**
     *  Timer for the Manager (periocally triggers timer action)
     */
    time_t                  timer_period;

    /**
     *  Generic name for the IPAM driver
     */
    static const char *    ipam_driver_name;

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
    };

    /**
     *  Register (or requests) a new address range to the IPAM.
     */
    void register_address_range_action(IPAMRequest * ir);

    /**
     *  Unregisters an address range.
     */
    void unregister_address_range_action(IPAMRequest * ir);

    /**
     *  Requests the IPAM a free address (or range)
     */
    void get_address_action(IPAMRequest * ir);

    /**
     *  Requests to set an address (or range) as used
     */
    void allocate_address_action(IPAMRequest * ir);

    /**
     * Free an address in the IPAM
     */
    void free_address_action(IPAMRequest * ir);

    /**
     *  This function initializes a request to call the IPAM driver
     *    @param ir the IPAM request
     *    @return pointer to the IPAM driver to use, 0 on failure
     */
    void send_request(IPAMManagerMessages type, IPAMRequest * ir);

    /**
     *  Function to execute the Manager action loop method within a new pthread
     *  (requires C linkage)
     */
    friend void * ipamm_action_loop(void *arg);

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

    /**
     *
     */
    static void _log(std::unique_ptr<ipam_msg_t> msg);

    // -------------------------------------------------------------------------
    // Action Listener interface
    // -------------------------------------------------------------------------
    void timer_action(const ActionRequest& ar)
    {
        check_time_outs_action();
    };

    static const int drivers_timeout = 10;

    void finalize_action(const ActionRequest& ar)
    {
        NebulaLog::log("IPM",Log::INFO,"Stopping IPAM Manager...");

        DriverManager::stop(drivers_timeout);
    };

    void user_action(const ActionRequest& ar);
};

#endif /*IPAM_MANAGER_H*/

