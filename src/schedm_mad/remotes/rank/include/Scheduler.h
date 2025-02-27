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

#ifndef SCHEDULER_H_
#define SCHEDULER_H_

#include "HostPoolXML.h"
#include "VMGroupPoolXML.h"
#include "DatastorePoolXML.h"
#include "VirtualMachinePoolXML.h"
#include "VirtualNetworkPoolXML.h"
#include "SchedulerPolicy.h"
#include "Listener.h"

#include <memory>

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class  SchedulerTemplate;

/**
 *  The Scheduler class. It represents the scheduler ...
 */
class Scheduler
{
public:
    void start(const std::string& xml_input);

    virtual void register_policies(const SchedulerTemplate& conf) {};

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
        mem_ds_scale(0),
        diff_vnets(false)
    {
    }

    virtual ~Scheduler() = default;

    // ---------------------------------------------------------------
    // Pools
    // ---------------------------------------------------------------

    std::shared_ptr<HostPoolXML> hpool = nullptr;

    std::shared_ptr<SystemDatastorePoolXML> dspool = nullptr;
    std::shared_ptr<ImageDatastorePoolXML> img_dspool = nullptr;

    std::shared_ptr<VirtualMachinePoolXML> vmpool = nullptr;
    std::shared_ptr<VirtualMachineRolePoolXML> vm_roles_pool = nullptr;

    std::shared_ptr<VirtualNetworkPoolXML> vnetpool = nullptr;

    std::shared_ptr<VMGroupPoolXML> vmgpool = nullptr;

    // ---------------------------------------------------------------
    // Scheduler Policies
    // ---------------------------------------------------------------

    void add_host_policy(std::shared_ptr<SchedulerPolicy> policy)
    {
        host_policies.emplace_back(policy);
    }

    void add_ds_policy(std::shared_ptr<SchedulerPolicy> policy)
    {
        ds_policies.emplace_back(policy);
    }

    void add_vm_policy(std::shared_ptr<SchedulerPolicy> policy)
    {
        vm_policies.emplace_back(policy);
    }

    void add_nic_policy(std::shared_ptr<SchedulerPolicy> policy)
    {
        nic_policies.emplace_back(policy);
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

    virtual void do_vm_groups();


private:
    Scheduler(Scheduler const&) = delete;

    Scheduler& operator=(Scheduler const&) = delete;

    SchedulerTemplate parse_config();

    void setup_pools(const std::string& input_xml);

    // ---------------------------------------------------------------
    // Scheduling Policies
    // ---------------------------------------------------------------

    std::vector<std::shared_ptr<SchedulerPolicy>> host_policies;
    std::vector<std::shared_ptr<SchedulerPolicy>> ds_policies;
    std::vector<std::shared_ptr<SchedulerPolicy>> vm_policies;
    std::vector<std::shared_ptr<SchedulerPolicy>> nic_policies;

    // ---------------------------------------------------------------
    // Configuration attributes
    // ---------------------------------------------------------------
    /**
     *  multiplication factor to calculate datastore usage. memory * factor
     */
    float mem_ds_scale;

    /**
     *  Boolean to dispatch the VM inside different vnets
     */
    bool diff_vnets;
};

#endif /*SCHEDULER_H_*/
