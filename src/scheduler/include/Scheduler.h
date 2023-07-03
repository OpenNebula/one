/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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
#include "Listener.h"
#include "AclXML.h"
#include "MonitorXML.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class  SchedulerTemplate;

/**
 *  The Scheduler class. It represents the scheduler ...
 */
class Scheduler
{
public:
    void start();

    void finalize()
    {
        if (timer_thread.get())
        {
            timer_thread->stop();
        }
    }

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
        timer(0),
        one_xmlrpc(""),
        machines_limit(0),
        dispatch_limit(0),
        host_dispatch_limit(0),
        zone_id(0),
        mem_ds_scale(0),
        diff_vnets(false),
        max_backups(5),
        max_backups_host(2)
    {
    }

    virtual ~Scheduler()
    {
        delete hpool;
        delete clpool;
        delete hmonpool;

        delete vmpool;
        delete vm_roles_pool;
        delete vnetpool;

        delete dspool;
        delete img_dspool;

        delete upool;
        delete vmgpool;

        delete acls;
    }

    // ---------------------------------------------------------------
    // Pools
    // ---------------------------------------------------------------
    AclXML *      acls = nullptr;
    UserPoolXML * upool = nullptr;

    HostPoolXML *    hpool = nullptr;
    ClusterPoolXML * clpool = nullptr;

    SystemDatastorePoolXML * dspool = nullptr;
    ImageDatastorePoolXML *  img_dspool = nullptr;

    VirtualMachinePoolXML *     vmpool = nullptr;
    VirtualMachineRolePoolXML * vm_roles_pool = nullptr;

    VirtualNetworkPoolXML *     vnetpool = nullptr;

    VMGroupPoolXML * vmgpool = nullptr;

    MonitorPoolXML * hmonpool = nullptr;

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

    virtual void do_vm_groups();

private:
    Scheduler(Scheduler const&) = delete;

    Scheduler& operator=(Scheduler const&) = delete;

    // ---------------------------------------------------------------
    // Scheduling Policies
    // ---------------------------------------------------------------

    std::vector<SchedulerPolicy *> host_policies;
    std::vector<SchedulerPolicy *> ds_policies;
    std::vector<SchedulerPolicy *> vm_policies;
    std::vector<SchedulerPolicy *> nic_policies;

    // ---------------------------------------------------------------
    // Configuration attributes
    // ---------------------------------------------------------------

    time_t  timer;

    std::string  one_xmlrpc;

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
     * Max number of active backups
     */
    int max_backups;

    /**
     * Max number of active backups per host
     */
    int max_backups_host;

    /**
     * oned runtime configuration values
     */
    Template oned_conf;

    // ---------------------------------------------------------------
    // Timer to periodically schedule and dispatch VMs
    // ---------------------------------------------------------------
    std::unique_ptr<Timer> timer_thread;

    // -------------------------------------------------------------------------
    // Action Listener interface
    // -------------------------------------------------------------------------
    void timer_action();
};

#endif /*SCHEDULER_H_*/
