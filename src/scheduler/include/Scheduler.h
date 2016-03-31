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

#ifndef SCHEDULER_H_
#define SCHEDULER_H_

#include "Log.h"
#include "HostPoolXML.h"
#include "UserPoolXML.h"
#include "ClusterPoolXML.h"
#include "DatastorePoolXML.h"
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
        clpool(0),
        vmpool(0),
        vmapool(0),
        dspool(0),
        img_dspool(0),
        upool(0),
        acls(0),
        timer(0),
        url(""),
        machines_limit(0),
        dispatch_limit(0),
        host_dispatch_limit(0)
    {
        am.addListener(this);
    };

    virtual ~Scheduler()
    {
        delete hpool;
        delete clpool;

        delete vmpool;
        delete vmapool;

        delete dspool;
        delete img_dspool;

        delete upool;

        delete acls;
    };

    // ---------------------------------------------------------------
    // Pools
    // ---------------------------------------------------------------

    HostPoolXML *    hpool;
    ClusterPoolXML * clpool;

    VirtualMachinePoolXML *       vmpool;
    VirtualMachineActionsPoolXML* vmapool;
    SystemDatastorePoolXML * dspool;
    ImageDatastorePoolXML * img_dspool;
    UserPoolXML * upool;

    AclXML * acls;

    // ---------------------------------------------------------------
    // Scheduler Policies
    // ---------------------------------------------------------------

    void add_host_policy(SchedulerPolicy *policy)
    {
        host_policies.push_back(policy);
    }

    void add_ds_policy(SchedulerPolicy *policy)
    {
        ds_policies.push_back(policy);
    }

    // ---------------------------------------------------------------
    // Scheduler main methods
    // ---------------------------------------------------------------

    /**
     *  Gets the hosts that match the requirements of the pending VMs, also
     *  the capacity of the host is checked. If there is enough room to host the
     *  VM a share vector is added to the VM.
     */
    virtual void match_schedule();

    virtual void dispatch();

    /**
     * Retrieves the pools
     *
     * @return   0 on success
     *          -1 on error
     *          -2 if no VMs need to be scheduled
     */
    virtual int set_up_pools();

    virtual int do_scheduled_actions();

private:
    Scheduler(Scheduler const&){};

    Scheduler& operator=(Scheduler const&){return *this;};

    friend void * scheduler_action_loop(void *arg);

    // ---------------------------------------------------------------
    // Scheduling Policies
    // ---------------------------------------------------------------

    vector<SchedulerPolicy *> host_policies;
    vector<SchedulerPolicy *> ds_policies;

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
     *  OpenNebula zone id.
     */
    int zone_id;

    /**
     * oned runtime configuration values
     */
     Template oned_conf;

    // ---------------------------------------------------------------
    // Timer to periodically schedule and dispatch VMs
    // ---------------------------------------------------------------

    pthread_t       sched_thread;
    ActionManager   am;

    void do_action(const string &name, void *args);
};

#endif /*SCHEDULER_H_*/
