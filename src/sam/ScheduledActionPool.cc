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

#include "ScheduledActionPool.h"
#include "NebulaLog.h"

using namespace std;

int ScheduledActionPool::allocate(PoolObjectSQL::ObjectType type,
                                  int parent_id,
                                  time_t origin,
                                  const VectorAttribute * va,
                                  string& error_str)
{
    auto sched = new ScheduledAction(type, parent_id);

    if (sched->parse(va, origin, error_str) != 0)
    {
        delete sched;

        NebulaLog::error("SCH", error_str);
        return -1;
    }

    return PoolSQL::allocate(sched, error_str);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ScheduledActionPool::bootstrap(SqlDB *_db)
{
    ostringstream oss(one_db::scheduled_action_db_bootstrap);

    return _db->exec_local_wr(oss);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ScheduledActionPool::dump(const std::set<int> &actions, std::string& oss)
{
    if (actions.empty())
    {
        return 0;
    }

    ostringstream oid_filter;
    bool first = true;

    for (const auto& id: actions)
    {
        if ( first )
        {
            oid_filter << "oid = " << id;
            first = false;
        }
        else
        {
            oid_filter << " OR oid = " << id;
        }
    }

    return PoolSQL::dump(oss, string(), "body", one_db::scheduled_action_table,
            oid_filter.str(), 0, -1, false);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

template<typename T1, typename T2>
class vector_pair_cb : public Callbackable
{
public:
    void set_callback(std::vector<std::pair<T1, T2>> * _map)
    {
        result = _map;

        Callbackable::set_callback(
                static_cast<Callbackable::Callback>(&vector_pair_cb::callback), 0);
    };

    int callback(void * nil, int num, char **values, char **names)
    {
        if ( num < 2 || values == 0 || values[0] == 0 || values[1] == 0)
        {
            return -1;
        }

        T1 key;
        T2 value;

        one_util::str_cast(values[0], key);
        one_util::str_cast(values[1], value);

        result->push_back(std::make_pair(key, value));

        return 0;
    };

private:

    std::vector<std::pair<T1, T2>> * result = nullptr;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

std::vector<std::pair<int, int>> ScheduledActionPool::get_is_due_actions(PoolObjectSQL::ObjectType ot)
{
    ostringstream   sql;

    time_t actual_time = time(0);

    vector_pair_cb<int,int> cb;
    std::vector<std::pair<int, int>> actions;
    cb.set_callback(&actions);

    sql << "SELECT oid, parent_id FROM " <<  one_db::scheduled_action_table
        << " WHERE type = '" << PoolObjectSQL::type_to_str(ot) << "'"
        << " AND time < " << actual_time
        << " AND time > done "
        << " ORDER BY time";

    db->exec_rd(sql, &cb);

    cb.unset_callback();

    return actions;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ScheduledActionPool::drop_sched_actions(const std::vector<int>& sa_ids)
{
    std::string error;
    int i = 0;

    for (const auto& id : sa_ids)
    {
        if (auto sa = get(id))
        {
            drop(sa.get(), error);
            i++;
        }
    }

    return i;
}
