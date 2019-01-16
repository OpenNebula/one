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

#ifndef SCHEDULER_H_
#define SCHEDULER_H_

#include "Log.h"
#include "HostPoolXML.h"
#include "VMGroupPoolXML.h"
#include "UserPoolXML.h"
#include "ClusterPoolXML.h"
#include "DatastorePoolXML.h"
#include "VirtualMachinePoolXML.h"
#include "VirtualNetworkPoolXML.h"
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

    virtual void register_policies(const SchedulerTemplate& conf){};

    static Scheduler& instance(Scheduler* the_sched=0)
    {
        static Scheduler * sched = 0;

        if ( the_sched != 0)
        {
            sched = the_sched;
        }

        return *sched;
    }

    float get_mem_ds_scale()
    {
        return mem_ds_scale;
    };

protected:

    Scheduler():
        acls(0),
        upool(0),
        hpool(0),
        clpool(0),
        dspool(0),
        img_dspool(0),
        vmpool(0),
        vm_roles_pool(0),
        vnetpool(0),
        vmgpool(0),
        vmapool(0),
        timer(0),
        one_xmlrpc(""),
        machines_limit(0),
        dispatch_limit(0),
        host_dispatch_limit(0),
        mem_ds_scale(0),
        diff_vnets(false)
    {
        am.addListener(this);
    };

    virtual ~Scheduler()
    {
        delete hpool;
        delete clpool;

        delete vmpool;
        delete vm_roles_pool;
        delete vnetpool;
        delete vmapool;

        delete dspool;
        delete img_dspool;

        delete upool;
        delete vmgpool;

        delete acls;
    };

    // ---------------------------------------------------------------
    // Pools
    // ---------------------------------------------------------------
    AclXML *      acls;
    UserPoolXML * upool;

    HostPoolXML *    hpool;
    ClusterPoolXML * clpool;

    SystemDatastorePoolXML * dspool;
    ImageDatastorePoolXML *  img_dspool;

    VirtualMachinePoolXML *     vmpool;
    VirtualMachineRolePoolXML * vm_roles_pool;

    VirtualNetworkPoolXML *     vnetpool;

    VMGroupPoolXML * vmgpool;

    VirtualMachineActionsPoolXML* vmapool;

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

    void add_vm_policy(SchedulerPolicy *policy)
    {
        vm_policies.push_back(policy);
    }

    void add_nic_policy(SchedulerPolicy *policy)
    {
        nic_policies.push_back(policy);
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

    virtual void do_vm_groups();

private:
    Scheduler(Scheduler const&){};

    Scheduler& operator=(Scheduler const&){return *this;};

    friend void * scheduler_action_loop(void *arg);

    // ---------------------------------------------------------------
    // Scheduling Policies
    // ---------------------------------------------------------------

    vector<SchedulerPolicy *> host_policies;
    vector<SchedulerPolicy *> ds_policies;
    vector<SchedulerPolicy *> vm_policies;
    vector<SchedulerPolicy *> nic_policies;

    // ---------------------------------------------------------------
    // Configuration attributes
    // ---------------------------------------------------------------

    time_t  timer;

    string  one_xmlrpc;

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
     *  multiplication factor to calculate datastore usage. memory * factor
     */
    float mem_ds_scale;

    /**
     *  Boolean to dispatch the VM inside different vnets
     */
    bool diff_vnets;

    /**
     * oned runtime configuration values
     */
     Template oned_conf;

    // ---------------------------------------------------------------
    // Timer to periodically schedule and dispatch VMs
    // ---------------------------------------------------------------

    pthread_t       sched_thread;
    ActionManager   am;

    // -------------------------------------------------------------------------
    // Action Listener interface
    // -------------------------------------------------------------------------
    void timer_action(const ActionRequest& ar);

    void finalize_action(const ActionRequest& ar)
    {
        NebulaLog::log("SCHED",Log::INFO,"Stopping the scheduler...");
    };
};

#endif /*SCHEDULER_H_*/
