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

#ifndef HOOK_MANAGER_H_
#define HOOK_MANAGER_H_

#include "ProtocolMessages.h"
#include "DriverManager.h"
#include "Listener.h"

#include <vector>

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class HookManager :
    public DriverManager<Driver<hook_msg_t>>,
                                          public Listener
{
public:

    HookManager(const std::string& mad_location)
        : DriverManager(mad_location)
        , Listener("Hook Manager")
    {
    }

    virtual ~HookManager() = default;

    /**
     *  This functions starts the associated listener thread, and creates a
     *  new thread for the Hook Manager. This thread will wait in
     *  an action loop till it receives ACTION_FINALIZE.
     *    @return 0 on success.
     */
    int start();

    /**
     *  Loads Hook Manager Mads defined in configuration file
     *   @param _mads configuration of drivers
     */
    int load_drivers(const std::vector<const VectorAttribute*>& _mads);

    /**
     *  Returns a pointer to a Information Manager MAD. The driver is
     *  searched by its name and owned by oneadmin with uid=0.
     *    @param name of the driver
     *    @return the Hook driver owned by uid 0, with attribute "NAME" equal to
     *    name or 0 in not found
     */
    const Driver<hook_msg_t> * get() const
    {
        return DriverManager::get_driver(hook_driver_name);
    }

    static std::string format_message(const std::string& args,
                                      const std::string& remote_host,
                                      int hook_id);

    /**
     *  Generic name for the Hook driver
     */
    static const char *  hook_driver_name;

    /**
     *  Send event message to the driver
     *    @param message to pass to the driver
     */
    void trigger_send_event(const std::string& message);

    /**
     *  Send retry message to the driver
     *    @param message to pass to the driver
     */
    void trigger_retry(const std::string& message);

private:
    // -------------------------------------------------------------------------
    // Protocol implementation, procesing messages from driver
    // -------------------------------------------------------------------------
    /**
     *
     */
    static void _undefined(std::unique_ptr<hook_msg_t> msg);

    /**
     *
     */
    void _execute(std::unique_ptr<hook_msg_t> msg);

    /**
     *
     */
    void _retry(std::unique_ptr<hook_msg_t> msg);

    /**
     *
     */
    static void _log(std::unique_ptr<hook_msg_t> msg);

    // -------------------------------------------------------------------------
    // Action Listener interface
    // -------------------------------------------------------------------------
    static const int drivers_timeout = 10;

    void finalize_action() override
    {
        DriverManager::stop(drivers_timeout);
    };
};

#endif /*HOOK_MANAGER_H*/

