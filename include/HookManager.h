/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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
#include "VirtualMachinePool.h"

using namespace std;

extern "C" void * hm_action_loop(void *arg);

class HookManager : public MadManager, public ActionListener
{
public:

    HookManager(vector<const VectorAttribute*>& _mads, VirtualMachinePool * _vmpool)
        :MadManager(_mads),vmpool(_vmpool)
    {
        am.addListener(this);
    };

    ~HookManager(){};

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
     *
     */
    int load_mads(int uid=0);

    /**
     *
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
        string name("NAME");

        return static_cast<const HookManagerDriver *>
               (MadManager::get(0,name,hook_driver_name));
    };

private:
    /**
     *  Generic name for the Hook driver
     */
     static const char *  hook_driver_name;

    /**
     *  Pointer to the VirtualMachine Pool
     */
     VirtualMachinePool * vmpool;

    /**
     *  Thread id for the HookManager
     */
    pthread_t             hm_thread;

    /**
     *  Action engine for the Manager
     */
    ActionManager         am;

    /**
     *  Function to execute the Manager action loop method within a new pthread
     *  (requires C linkage)
     */
    friend void * hm_action_loop(void *arg);

    // -------------------------------------------------------------------------
    // Action Listener interface
    // -------------------------------------------------------------------------
    void finalize_action(const ActionRequest& ar)
    {
        NebulaLog::log("HKM",Log::INFO,"Stopping Hook Manager...");

        MadManager::stop();
    };
};

#endif /*HOOK_MANAGER_H*/

