/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

#include "MadManager.h"
#include "ActionManager.h"
#include "HookManagerDriver.h"

#include <vector>

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class HMAction : public ActionRequest
{
public:
    enum Actions
    {
        SEND_EVENT,  /**< Send event to hook manager driver*/
        RETRY       /**< Send RETRY action to hook manager driver*/
    };

    HMAction(Actions a, const std::string& m):ActionRequest(ActionRequest::USER),
        _action(a), _message(m){};

    HMAction(const HMAction& o):ActionRequest(o._type), _action(o._action),
        _message(o._message){};

    Actions action() const
    {
        return _action;
    }

    const std::string& message() const
    {
        return _message;
    }

    ActionRequest * clone() const
    {
        return new HMAction(*this);
    }

private:
    Actions _action;

    std::string _message;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" void * hm_action_loop(void *arg);

class HookManager : public MadManager, public ActionListener
{
public:

    HookManager(std::vector<const VectorAttribute*>& _mads):MadManager(_mads)
    {
        am.addListener(this);
    };

    virtual ~HookManager() = default;

    /**
     *  This functions starts the associated listener thread, and creates a
     *  new thread for the Hook Manager. This thread will wait in
     *  an action loop till it receives ACTION_FINALIZE.
     *    @return 0 on success.
     */
    int start();

    /**
     *  Gets the HookManager thread identification.
     *    @return pthread_t for the manager thread (that in the action loop).
     */
    pthread_t get_thread_id() const
    {
        return hm_thread;
    };

    /**
     *  Loads Hook Manager Mads defined in configuration file
     *   @param uid of the user executing the driver. When uid is 0 the nebula
     *   identity will be used. Otherwise the Mad will be loaded through the
     *   sudo application.
     */
    int load_mads(int uid=0);

    /**
     *  Triggers specific actions to the Hook Manager.
     *    @param action the HM action
     *    @param message to send to the driver
     */
    void trigger(HMAction::Actions action, const std::string& message)
    {
        HMAction hm_ar(action, message);

        am.trigger(hm_ar);
    }

    /**
     *  Terminates the hook manager thread listener
     */
    void finalize()
    {
        am.finalize();
    };

    /**
     *  Returns a pointer to a Information Manager MAD. The driver is
     *  searched by its name and owned by oneadmin with uid=0.
     *    @param name of the driver
     *    @return the Hook driver owned by uid 0, with attribute "NAME" equal to
     *    name or 0 in not found
     */
    const HookManagerDriver * get()
    {
        std::string name("NAME");

        return static_cast<const HookManagerDriver *>
               (MadManager::get(0, name,hook_driver_name));
    };

    static std::string * format_message(const string& args, const string&remote_host,
                                        int hook_id);

private:
    /**
     *  Function to execute the Manager action loop method within a new pthread
     *  (requires C linkage)
     */
    friend void * hm_action_loop(void *arg);

    /**
     *  Generic name for the Hook driver
     */
     static const char *  hook_driver_name;

    /**
     *  Thread id for the HookManager
     */
    pthread_t             hm_thread;

    /**
     *  Action engine for the Manager
     */
    ActionManager         am;

    /**
     *  Send event message to the driver
     *    @param message to pass to the driver
     */
    void send_event_action(const std::string& message);

    /**
     *  Send retry message to the driver
     *    @param message to pass to the driver
     */
    void retry_action(const std::string& message);

    // -------------------------------------------------------------------------
    // Action Listener interface
    // -------------------------------------------------------------------------
    void finalize_action(const ActionRequest& ar)
    {
        NebulaLog::log("HKM",Log::INFO,"Stopping Hook Manager...");

        MadManager::stop();
    };

    void user_action(const ActionRequest& ar);
};

#endif /*HOOK_MANAGER_H*/

