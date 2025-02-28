/* -------------------------------------------------------------------------- */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                */
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

#ifndef RANK_SCHEDULER_H_
#define RANK_SCHEDULER_H_

#include "Scheduler.h"
#include "SchedulerTemplate.h"
#include "RankPolicy.h"
#include "UserPriorityPolicy.h"

#include <memory>

class RankScheduler : public Scheduler
{
public:

    RankScheduler():Scheduler(), rp_host(nullptr), rp_ds(nullptr), rp_nics(nullptr), rp_vm(nullptr) {};

    ~RankScheduler()
    {
    };

    void register_policies(const SchedulerTemplate& conf) override
    {
        rp_host = std::make_shared<RankHostPolicy>(hpool, conf.get_policy(), 1.0);

        add_host_policy(rp_host);

        rp_ds = std::make_shared<RankDatastorePolicy>(dspool, conf.get_ds_policy(), 1.0);

        add_ds_policy(rp_ds);

        rp_vm = std::make_shared<UserPriorityPolicy>(vmpool, 1.0);

        add_vm_policy(rp_vm);

        rp_nics = std::make_shared<RankNetworkPolicy>(vnetpool, conf.get_nics_policy(), 1.0);

        add_nic_policy(rp_nics);
    };

private:
    std::shared_ptr<RankPolicy> rp_host = nullptr;
    std::shared_ptr<RankPolicy> rp_ds = nullptr;
    std::shared_ptr<RankPolicy> rp_nics = nullptr;

    std::shared_ptr<UserPriorityPolicy> rp_vm = nullptr;
};

#endif // RANK_SCHEDULER_H_
