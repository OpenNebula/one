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

#ifndef PLAN_MANAGER_H_
#define PLAN_MANAGER_H_

#include "Listener.h"
#include "Plan.h"
#include "OneDB.h"

#include <vector>

class ClusterPool;
class PlanPool;
class VirtualMachinePool;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class PlanManager
{
public:

    PlanManager(time_t  timer,
                int     _max_actions_per_host,
                int     _max_actions_per_cluster,
                int     _live_resched,
                int     _cold_migrate_mode,
                int     _timeout);

    void finalize();

    void add_plan(const std::string& xml);

    /**
     * Start applying plan actions
     *
     * @param cid Cluster ID
     * @return 0 on success, -1 otherwise
     */
    int start_plan(int cid, std::string& error);

    void action_success(int plan_id, int action_id)
    {
        action_finished(plan_id, action_id, PlanState::DONE);
    }

    void action_failure(int plan_id, int action_id)
    {
        action_finished(plan_id, action_id, PlanState::ERROR);
    }

private:
    /**
     * Timer to periodically checks and starts the placement actions.
     */
    Timer timer_thread;

    ClusterPool        *cluster_pool;
    PlanPool           *plan_pool;
    VirtualMachinePool *vm_pool;

    /**
     *  Dispatch Options
     */
    int max_actions_per_host;
    int max_actions_per_cluster;

    bool live_resched;
    int  cold_migrate_mode;

    int  action_timeout;

    /**
     * Periodically called method to start the placement actions.
     */
    void timer_action();

    bool start_action(int plan_id, PlanAction& action);

    void action_finished(int plan_id, int action_id, PlanState state);

    void execute_plan(Plan& plan);

    void execute_plans();
};

#endif /*PLAN_MANAGER_H*/

