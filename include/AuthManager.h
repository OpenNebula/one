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

#ifndef AUTH_MANAGER_H_
#define AUTH_MANAGER_H_

#include <time.h>

#include "Listener.h"
#include "ProtocolMessages.h"
#include "DriverManager.h"

//Forward definitions
class AuthRequest;


class AuthManager :
    public DriverManager<Driver<auth_msg_t>>,
                                          public Listener
{
public:

    AuthManager(
            time_t             timer,
            const std::string& mads_location)
        : DriverManager(mads_location)
        , Listener("Authorization Manager")
        , timer_thread(timer, [this]() {timer_action();})
    , authz_enabled(false)
    {
    }

    /**
     *  This functions starts the associated listener thread, and creates a
     *  new thread for the AuthManager. This thread will wait in
     *  an action loop till it receives ACTION_FINALIZE.
     *    @return 0 on success.
     */
    int start();

    /**
     *  Loads Virtual Machine Manager Mads defined in configuration file
     *   @param _mads configuration of drivers
     */
    int load_drivers(const std::vector<const VectorAttribute*>& _mads);

    /**
     * Returns true if there is an authorization driver enabled
     *
     * @return true if there is an authorization driver enabled
     */
    bool is_authz_enabled()
    {
        return authz_enabled;
    }

    /**
     *  This function authenticates a user
     */
    void trigger_authenticate(AuthRequest& ar);

    /**
     *  This function authorizes a user request
     */
    void trigger_authorize(AuthRequest& ar);

private:
    /**
     *  Timer action async execution
     */
    Timer timer_thread;

    /**
     *  Generic name for the Auth driver
     */
    static const char * auth_driver_name;

    /**
     * True if there is an authorization driver enabled
     */
    bool authz_enabled;

    /**
     *
     */
    static const int drivers_timeout = 10;

    /**
     *  Returns a pointer to a Auth Manager driver.
     *    @param name of an attribute of the driver (e.g. its type)
     *    @param value of the attribute
     *    @return the Auth driver with attribute name equal to value
     *    or 0 in not found
     */
    const Driver<auth_msg_t> * get(const std::string& name) const
    {
        return DriverManager::get_driver(name);
    }

    /**
     *  Returns a pointer to a Auth Manager driver. The driver is
     *  searched by its name.
     *    @param name the name of the driver
     *    @return the TM driver owned by uid with attribute name equal to value
     *    or 0 in not found
     */
    const Driver<auth_msg_t> * get() const
    {
        return DriverManager::get_driver(auth_driver_name);
    }

    // -------------------------------------------------------------------------
    // Protocol implementation, procesing messages from driver
    // -------------------------------------------------------------------------
    /**
     *
     */
    static void _undefined(std::unique_ptr<auth_msg_t> msg);

    /**
     *
     */
    void _authorize(std::unique_ptr<auth_msg_t> msg);

    /**
     *
     */
    void _authenticate(std::unique_ptr<auth_msg_t> msg);

    /**
     *
     */
    static void _log(std::unique_ptr<auth_msg_t> msg);

    // -------------------------------------------------------------------------
    // Action Listener interface
    // -------------------------------------------------------------------------
    void timer_action()
    {
        check_time_outs_action();
    }

    void finalize_action() override;
};

#endif /*AUTH_MANAGER_H*/

