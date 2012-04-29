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

#ifndef SCHEDULER_H_
#define SCHEDULER_H_

#include "Log.h"
#include "HostPoolXML.h"
#include "VirtualMachinePoolXML.h"
#include "SchedulerPolicy.h"
#include "ActionManager.h"
#include "AclXML.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" void * scheduler_action_loop(void *arg);
class  SchedulerTemplate;
/**
 *  The Scheduler class. It represents the scheduler ...
 */

class Scheduler: public ActionListener
{
public:

    void start();

    virtual void register_policies(const SchedulerTemplate& conf) = 0;

protected:

    Scheduler():
        hpool(0),
        vmpool(0),
        acls(0),
        timer(0),
        url(""),
        machines_limit(0),
        dispatch_limit(0),
        host_dispatch_limit(0),
        threshold(0.9),
        client(0)
    {
        am.addListener(this);
    };

    virtual ~Scheduler()
    {
        if ( hpool != 0)
        {
            delete hpool;
        }

        if ( vmpool != 0)
        {
            delete vmpool;
        }

        if ( acls != 0)
        {
            delete acls;
        }

        if ( client != 0)
        {
            delete client;
        }
    };

    // ---------------------------------------------------------------
    // Pools
    // ---------------------------------------------------------------

    HostPoolXML *             hpool;
    VirtualMachinePoolXML *   vmpool;

    AclXML *                  acls;

    // ---------------------------------------------------------------
    // Scheduler Policies
    // ---------------------------------------------------------------

    void add_host_policy(SchedulerHostPolicy *policy)
    {
        host_policies.push_back(policy);
    }

    // ---------------------------------------------------------------
    // Scheduler main methods
    // ---------------------------------------------------------------

    /**
     *  Gets the hosts that match the requirements of the pending VMs, also
     *  the capacity of the host is checked. If there is enough room to host the
     *  VM a share vector is added to the VM.
     */
    virtual void match();

    virtual void dispatch();

    virtual int schedule();

    virtual int set_up_pools();

private:
    Scheduler(Scheduler const&){};

    Scheduler& operator=(Scheduler const&){return *this;};

    friend void * scheduler_action_loop(void *arg);


    // ---------------------------------------------------------------
    // Scheduling Policies
    // ---------------------------------------------------------------

    vector<SchedulerHostPolicy *>   host_policies;

    // ---------------------------------------------------------------
    // Configuration attributes
    // ---------------------------------------------------------------

    time_t  timer;

    string  url;

    /**
     *  Limit of pending virtual machines to process from the pool.
     */
    unsigned int machines_limit;

    /**
     *  Limit of virtual machines to ask OpenNebula core to deploy.
     */
    unsigned int dispatch_limit;

    /**
     *  Limit of virtual machines to be deployed simultaneously to a given host.
     */
    unsigned int host_dispatch_limit;

    /**
     *  Threshold value to round up freecpu
     */
    float threshold;

    /**
     *  XML_RPC client
     */
    Client * client;

    // ---------------------------------------------------------------
    // Timer to periodically schedule and dispatch VMs
    // ---------------------------------------------------------------

    pthread_t       sched_thread;
    ActionManager   am;

    void do_action(const string &name, void *args);
};

#endif /*SCHEDULER_H_*/
