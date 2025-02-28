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

#include "PlanPool.h"
#include "OneDB.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

PlanPool::PlanPool(SqlDB * _db)
    : db(_db), table(one_db::plan_table)
{
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

std::unique_ptr<Plan> PlanPool::get(int id)
{
    if ( id < -1 )
    {
        return nullptr;
    }

    std::mutex * object_lock = cache.lock_line(id);

    std::unique_ptr<Plan> plan = std::make_unique<Plan>(id);

    plan->ro  = false;

    plan->_mutex = object_lock;

    plan->select(db);

    return plan;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

std::unique_ptr<Plan> PlanPool::get_ro(int id)
{
    if ( id < -1 )
    {
        return nullptr;
    }

    std::unique_ptr<Plan> plan = std::make_unique<Plan>(id);

    plan->ro = true;

    plan->select(db);

    return plan;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

vector<int> PlanPool::get_active_plans() const
{
    ostringstream   sql;

    vector_cb<int>   cb;
    std::vector<int> plans;

    cb.set_callback(&plans);

    sql << "SELECT cid FROM " <<  one_db::plan_table
        << " WHERE STATE = 1";

    db->exec_rd(sql, &cb);

    cb.unset_callback();

    return plans;
}
