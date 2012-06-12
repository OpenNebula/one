/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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

#include "MadManager.h"
#include "ActionManager.h"
#include "AuthManagerDriver.h"
#include "PoolObjectSQL.h"

using namespace std;

//Forward definitions
class AuthRequest;
class PoolObjectAuth;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" void * authm_action_loop(void *arg);

class AuthManager : public MadManager, public ActionListener
{
public:

    AuthManager(
        time_t                    timer,
        vector<const Attribute*>& _mads):
            MadManager(_mads), timer_period(timer)
    {
        am.addListener(this);
    };

    ~AuthManager(){};

    enum Actions
    {
        AUTHENTICATE,
        AUTHORIZE,
        FINALIZE
    };

    /**
     *  Triggers specific actions to the Auth Manager. This function
     *  wraps the ActionManager trigger function.
     *    @param action the Auth Manager action
     *    @param request an auth request
     */
    void trigger(
        Actions       action,
        AuthRequest*  request);

    /**
     *  This functions starts the associated listener thread, and creates a
     *  new thread for the AuthManager. This thread will wait in
     *  an action loop till it receives ACTION_FINALIZE.
     *    @return 0 on success.
     */
    int start();

    /**
     *  Loads Virtual Machine Manager Mads defined in configuration file
     *   @param uid of the user executing the driver. When uid is 0 the nebula
     *   identity will be used. Otherwise the Mad will be loaded through the
     *   sudo application.
     */
    void load_mads(int uid);

    /**
     *  Gets the thread identification.
     *    @return pthread_t for the manager thread (that in the action loop).
     */
    pthread_t get_thread_id() const
    {
        return authm_thread;
    };

    /**
     * Returns true if there is an authorization driver enabled
     *
     * @return true if there is an authorization driver enabled
     */
    bool is_authz_enabled()
    {
        return authz_enabled;
    };

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
    const AuthManagerDriver * get(
        const string&   name,
        const string&   value)
    {
        return static_cast<const AuthManagerDriver *>
               (MadManager::get(0,name,value));
    };

    /**
     *  Returns a pointer to a Auth Manager driver. The driver is
     *  searched by its name.
     *    @param name the name of the driver
     *    @return the TM driver owned by uid with attribute name equal to value
     *    or 0 in not found
     */
    const AuthManagerDriver * get()
    {
        string name("NAME");

        return static_cast<const AuthManagerDriver *>
               (MadManager::get(0,name,auth_driver_name));
    };

    /**
     *  Function to execute the Manager action loop method within a new pthread
     * (requires C linkage)
     */
    friend void * authm_action_loop(void *arg);

    /**
     *  The action function executed when an action is triggered.
     *    @param action the name of the action
     *    @param arg arguments for the action function
     */
    void do_action(
        const string &  action,
        void *          arg);

    /**
     *  This function authenticates a user
     */
    void authenticate_action(AuthRequest * ar);

    /**
     *  This function authorizes a user request
     */
    void authorize_action(AuthRequest * ar);
};

#endif /*AUTH_MANAGER_H*/

