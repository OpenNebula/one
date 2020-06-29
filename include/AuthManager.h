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

#ifndef AUTH_MANAGER_H_
#define AUTH_MANAGER_H_

#include <time.h>

#include "NebulaLog.h"
#include "ActionManager.h"
#include "ProtocolMessages.h"
#include "DriverManager.h"

//Forward definitions
class AuthRequest;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class AMAction : public ActionRequest
{
public:
    enum Actions
    {
        AUTHENTICATE,
        AUTHORIZE
    };

    AMAction(Actions a, AuthRequest *r):ActionRequest(ActionRequest::USER),
        _action(a), _request(r) {}

    AMAction(const AMAction& o):ActionRequest(o._type), _action(o._action),
        _request(o._request) {}

    Actions action() const
    {
        return _action;
    }

    AuthRequest * request() const
    {
        return _request;
    }

    ActionRequest * clone() const
    {
        return new AMAction(*this);
    }

private:
    Actions       _action;

    AuthRequest * _request;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" void * authm_action_loop(void *arg);

class AuthManager :
    public DriverManager<Driver<auth_msg_t>>,
    public ActionListener
{
public:

    AuthManager(
        time_t                    timer,
        const std::string&        mads_location):
            DriverManager(mads_location),
            timer_period(timer)
    {
        am.addListener(this);
    }

    ~AuthManager() {}

    /**
     *  Triggers specific actions to the Auth Manager. This function
     *  wraps the ActionManager trigger function.
     *    @param action the Auth Manager action
     *    @param request an auth request
     */
    void trigger(AMAction::Actions action, AuthRequest*  request)
    {
        AMAction auth_ar(action, request);

        am.trigger(auth_ar);
    }

    /**
     *  This functions starts the associated listener thread, and creates a
     *  new thread for the AuthManager. This thread will wait in
     *  an action loop till it receives ACTION_FINALIZE.
     *    @return 0 on success.
     */
    int start();

    /**
     *
     */
    void finalize()
    {
        am.finalize();
    }

    /**
     *  Loads Virtual Machine Manager Mads defined in configuration file
     *   @param _mads configuration of drivers
     */
    int load_drivers(const std::vector<const VectorAttribute*>& _mads);

    /**
     *  Gets the thread identification.
     *    @return pthread_t for the manager thread (that in the action loop).
     */
    pthread_t get_thread_id() const
    {
        return authm_thread;
    }

    /**
     * Returns true if there is an authorization driver enabled
     *
     * @return true if there is an authorization driver enabled
     */
    bool is_authz_enabled()
    {
        return authz_enabled;
    }

private:
    /**
     *  Thread id for the Transfer Manager
     */
    pthread_t               authm_thread;

    /**
     *  Action engine for the Manager
     */
    ActionManager           am;

    /**
     *  Timer for the Manager (periocally triggers timer action)
     */
    time_t                  timer_period;

    /**
     *  Generic name for the Auth driver
     */
    static const char *    auth_driver_name;

     /**
      * True if there is an authorization driver enabled
      */
    bool                   authz_enabled;

    /**
     *  Returns a pointer to a Auth Manager driver.
     *    @param name of an attribute of the driver (e.g. its type)
     *    @param value of the attribute
     *    @return the Auth driver with attribute name equal to value
     *    or 0 in not found
     */
    const Driver<auth_msg_t> * get(const string&   name)
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
    const Driver<auth_msg_t> * get()
    {
        return DriverManager::get_driver(auth_driver_name);
    }

    /**
     *  This function authenticates a user
     */
    void authenticate_action(AuthRequest * ar);

    /**
     *  This function authorizes a user request
     */
    void authorize_action(AuthRequest * ar);

    /**
     *  Function to execute the Manager action loop method within a new pthread
     * (requires C linkage)
     */
    friend void * authm_action_loop(void *arg);

    // -------------------------------------------------------------------------
    // Protocol implementation, procesing messages from driver
    // -------------------------------------------------------------------------
    /**
     *
     */
    static void _undefined(unique_ptr<auth_msg_t> msg);

    /**
     *
     */
    void _authorize(unique_ptr<auth_msg_t> msg);

    /**
     *
     */
    void _authenticate(unique_ptr<auth_msg_t> msg);

    /**
     *
     */
    static void _log(unique_ptr<auth_msg_t> msg);

    // -------------------------------------------------------------------------
    // Action Listener interface
    // -------------------------------------------------------------------------
    void timer_action(const ActionRequest& ar)
    {
        check_time_outs_action();
    }

    static const int drivers_timeout = 10;

    void finalize_action(const ActionRequest& ar)
    {
        NebulaLog::log("AuM",Log::INFO,"Stopping Authorization Manager...");

        DriverManager::stop(drivers_timeout);
    }

    void user_action(const ActionRequest& ar);
};

#endif /*AUTH_MANAGER_H*/

