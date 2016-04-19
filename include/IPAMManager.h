/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

#include "MadManager.h"
#include "ActionManager.h"
#include "IPAMManagerDriver.h"
#include "PoolObjectSQL.h"

using namespace std;

//Forward definitions 
class IPAMRequest;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" void * ipamm_action_loop(void *arg);

class IPAMManager : public MadManager, public ActionListener
{
public:

    IPAMManager(
        time_t                    timer,
        vector<const VectorAttribute*>& _mads):
            MadManager(_mads), timer_period(timer)
    {
        am.addListener(this);
    };

    ~IPAMManager(){};

    enum Actions
    {
        GET_FREE_ADDR_RANGE,
        REGISTER_ADDR_RANGE,
        FREE_ADDR,
        FINALIZE
    };

    /**
     * Triggers specific action to the IPAM Manager. This function
     * wraps the ActionManager trigger function.
     *   @param action to the IPAM Manager action
     *   @param request an IPAM request
     */
    void trigger(
        Actions      action,
        IPAMRequest* request);

    /**
     *  This functions starts the associated listener thread, and creates a
     *  new thread for the IPAMManager. This thread will wait in
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
    int load_mads(int uid);

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
        am.trigger(ACTION_FINALIZE,0);
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
     *  Returns a pointer to a IPAM Manager driver.
     *    @param name of an attribute of the driver (e.g. its type)
     *    @param value of the attribute
     *    @return the IPAM driver with attribute name equal to value
     *    or 0 in not found
     */
    const IPAMManagerDriver * get(
        const string&   name,
        const string&   value)
    {
        return static_cast<const IPAMManagerDriver *>
               (MadManager::get(0,name,value));
    };

    /**
     *  Returns a pointer to a IPAM Manager driver. The driver is
     *  searched by its name.
     *    @param name the name of the driver
     *    @return the IPAM driver owned by uid with attribute name equal to value
     *    or 0 in not found
     */
    const IPAMManagerDriver * get()
    {
        string name("NAME");

        return static_cast<const IPAMManagerDriver *>
               (MadManager::get(0,name,ipam_driver_name));
    };

    /**
     *  Function to execute the Manager action loop method within a new pthread
     * (requires C linkage)
     */
    friend void * ipamm_action_loop(void *arg);

    /**
     *  The action function executed when an action is triggered.
     *    @param action the name of the action
     *    @param arg arguments for the action function
     */
    void do_action(
        const string &  action,
        void *          arg);

    /**
     *  This function register an IP address
     */
    void get_free_addr_range_action(IPAMRequest * ir);
    void register_addr_range_action(IPAMRequest * ir);
    void free_addr_action(IPAMRequest * ir);
};

#endif /*IPAM_MANAGER_H*/

