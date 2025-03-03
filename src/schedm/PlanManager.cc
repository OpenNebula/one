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

#include "PlanManager.h"
#include "Nebula.h"
#include "NebulaLog.h"
#include "RaftManager.h"
#include "RequestManagerVirtualMachine.h"
#include "ClusterPool.h"
#include "PlanPool.h"
#include "Plan.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

PlanManager::PlanManager(time_t timer,
                         int    _max_actions_per_host,
                         int    _max_actions_per_cluster,
                         int    _live_resched,
                         int    _cold_migrate_mode,
                         int    _timeout)
    : timer_thread(timer, [this]() {timer_action();})
    , max_actions_per_host(_max_actions_per_host)
    , max_actions_per_cluster(_max_actions_per_cluster)
    , live_resched(_live_resched == 1)
    , cold_migrate_mode(_cold_migrate_mode)
    , action_timeout(_timeout)
{
    NebulaLog::info("PLM", "Staring Plan Manager...");

    auto& nd = Nebula::instance();

    cluster_pool = nd.get_clpool();
    plan_pool    = nd.get_planpool();
    vm_pool      = nd.get_vmpool();

    if (_max_actions_per_host <= 0)
    {
        max_actions_per_host = 1;
    }

    if (_max_actions_per_cluster <= 0)
    {
        max_actions_per_cluster = 1;
    }

    if (cold_migrate_mode < 0 || cold_migrate_mode >2)
    {
        cold_migrate_mode = 0;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void PlanManager::finalize()
{
    NebulaLog::info("PLM", "Stopping Plan Manager...");

    timer_thread.stop();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void PlanManager::add_plan(const string& xml)
{
    NebulaLog::debug("PLM", "Adding new plan:" + xml);

    Plan plan;

    if (plan.from_xml(xml) != 0)
    {
        NebulaLog::error("PLM", "Error parsing plan XML:" + xml);
        return;
    }

    if (plan.actions().empty())
    {
        NebulaLog::debug("PLM", "Plan has no actions, skipping...");
        return;
    }

    if (auto cplan = plan_pool->get(plan.cid()))
    {
        if (plan.cid() == -1)
        {
            NebulaLog::info("PLM", "Adding new placement plan");

            if (cplan->state() == PlanState::APPLYING)
            {
                NebulaLog::info("PLM", "Cannot add plan. A placement plan is already in progress.");
                return;
            }

            cplan->from_xml(xml);

            cplan->state(PlanState::APPLYING);
        }
        else if (auto cluster = cluster_pool->get_ro(plan.cid()))
        {
            NebulaLog::info("PLM", "Adding new plan for cluster " + to_string(plan.cid()));

            if (cplan->state() == PlanState::APPLYING)
            {
                NebulaLog::info("PLM", "Cannot add cluster optimization plan. A plan is already in progress.");
                return;
            }

            cplan->from_xml(xml);

            if (cluster->is_autoapply())
            {
                cplan->state(PlanState::APPLYING);
            }
            else
            {
                cplan->state(PlanState::READY);
            }
        }
        else
        {
            NebulaLog::error("PLM", "Optimization plan for non-existent cluster " + to_string(plan.cid()));
            return;
        }

        plan_pool->update(cplan.get());
    }
    else
    {
        NebulaLog::error("PLM", "Plan not found, unable to update plan for cluster " + to_string(plan.cid()));
        return;
    }

    // Clear previous scheduling messages for all VM actions
    for (const auto& action : plan.actions())
    {
        if (auto vm = vm_pool->get(action.vm_id()))
        {
            string sched_message;

            vm->get_user_template_attribute("SCHED_MESSAGE", sched_message);

            if (sched_message.empty())
            {
                continue;
            }

            vm->set_template_error_message("SCHED_MESSAGE", "");

            vm_pool->update(vm.get());
        }
    }

    execute_plans();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
static int start_check_plan(Plan& p, std::string& error)
{
    switch(p.state())
    {
        case PlanState::NONE:
            error = "Plan is not ready";
            return -1;
        case PlanState::APPLYING:
            error = "Plan is already applying";
            return -1;
        case PlanState::DONE:
            error = "Plan is already done";
            return -1;
        case PlanState::ERROR:
            error = "Plan is in error state";
            return -1;
        default:
            break;
    }

    p.state(PlanState::APPLYING);

    return 0;
}

/* -------------------------------------------------------------------------- */

int PlanManager::start_plan(int cid, std::string& error)
{
    if (auto plan = plan_pool->get(cid))
    {
        if (start_check_plan(*plan, error) == -1)
        {
            return -1;
        }

        plan_pool->update(plan.get());
    }
    else
    {
        error = "Plan not found";
        return -1;
    }

    execute_plans();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void PlanManager::timer_action()
{
    RaftManager * raftm = Nebula::instance().get_raftm();

    if (!raftm || (!raftm->is_leader() && !raftm->is_solo()))
    {
        return;
    }

    NebulaLog::info("PLM", "Starting Plan Manager timer action...");

    execute_plans();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool PlanManager::start_action(PlanAction& action)
{
    const string& aname = action.operation();

    Request::ErrorCode rc = Request::SUCCESS;

    RequestAttributes ra(AuthRequest::ADMIN,
                         UserPool::ONEADMIN_ID,
                         GroupPool::ONEADMIN_ID,
                         PoolObjectSQL::VM);

    if (aname == "deploy")
    {
        VirtualMachineDeploy request;

        ostringstream extra;

        auto nics = action.nics();

        for (auto nic : nics)
        {
            extra << "NIC=[NIC_ID=\"" << nic.first
                  << "\", NETWORK_MODE=\"auto\" , NETWORK_ID=\"" << nic.second
                  << "\"]";
        }

        rc = request.request_execute(ra, action.vm_id(), action.host_id(), false,
                action.ds_id(), extra.str());
    }
    else if (aname == "migrate")
    {
        VirtualMachineMigrate request;

        rc = request.request_execute(ra, action.vm_id(), action.host_id(), live_resched,
                false, action.ds_id(), cold_migrate_mode);
    }
    else
    {
        VirtualMachineAction request;

        rc = request.request_execute(ra, aname, action.vm_id());
    }

    action.timestamp(time(nullptr));

    if (rc != Request::SUCCESS)
    {
        action.state(PlanState::ERROR);

        auto error_msg = Request::failure_message(rc, ra, aname, ra.resp_obj);

        NebulaLog::info("PLM", error_msg);

        if (auto vm = vm_pool->get(action.vm_id()))
        {
            vm->set_template_error_message(error_msg);

            vm_pool->update(vm.get());
        }

        return false;
    }

    action.state(PlanState::APPLYING);

    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void PlanManager::action_finished(int cid, int vid, PlanState state)
{
    auto plan = plan_pool->get(cid);

    if (!plan)
    {
        if (cid != -1)
        {
            action_finished(-1, vid, state);
        }

        return;
    }

    if (plan->action_finished(vid, state))
    {
        plan->check_completed();

        plan_pool->update(plan.get());
    }
    else if (cid != -1)
    {
        //Not included in cluster plan, it could be in placement plan
        action_finished(-1, vid, state);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void PlanManager::execute_plan(Plan& plan)
{
    if (plan.state() != PlanState::APPLYING)
    {
        NebulaLog::info("PLM", "Plan " + to_string(plan.cid()) + " is not applying");
        return;
    }

    plan.timeout_actions(action_timeout);

    // Update counter, num of running actions per host, per cluster
    map<int, int> host_actions;
    int           cluster_actions = 0;

    plan.count_actions(cluster_actions, host_actions);

    // Execute plan actions
    while (auto action = plan.get_next_action())
    {
        if (host_actions[action->host_id()] >= max_actions_per_host
            || cluster_actions >= max_actions_per_cluster)
        {
            break;
        }

        if (start_action(*action))
        {
            host_actions[action->host_id()]++;
            cluster_actions++;
        }
    }

    plan.check_completed();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void PlanManager::execute_plans()
{
    auto plans = plan_pool->get_active_plans();

    NebulaLog::info("PLM", "Found " + to_string(plans.size()) + " active plans");

    for (auto plan_id : plans)
    {
        auto plan = plan_pool->get(plan_id);

        execute_plan(*plan);

        plan_pool->update(plan.get());
    }
}
