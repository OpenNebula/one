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

#ifndef SCHEDULED_ACTION_POOL_H_
#define SCHEDULED_ACTION_POOL_H_

#include "PoolSQL.h"
#include "OneDB.h"
#include "ScheduledAction.h"

class SqlDB;

class ScheduledActionPool : public PoolSQL
{
public:
    ScheduledActionPool(SqlDB * db)
        : PoolSQL(db, one_db::scheduled_action_table)
    {}

    /**
     *  Function to allocate a new Scheduled Action object
     *    @return the oid assigned to the object or -1 in case of failure
     */
    int allocate(PoolObjectSQL::ObjectType type,
                 int parent_id,
                 time_t origin,
                 const VectorAttribute * va,
                 std::string& error_str);

    /**
     *  Gets an object from the pool (if needed the object is loaded from the
     *  database). The object is locked, other threads can't access the same
     *  object. The lock is released by destructor.
     *   @param oid the Hook unique identifier
     *   @return a pointer to the Hook, nullptr in case of failure
     */
    std::unique_ptr<ScheduledAction> get(int oid)
    {
        return PoolSQL::get<ScheduledAction>(oid);
    }

    /**
     *  Gets a read only object from the pool (if needed the object is loaded from the
     *  database). No object lock, other threads may work with the same object.
     *   @param oid the Hook unique identifier
     *   @return a pointer to the Scheduled Action, nullptr in case of failure
     */
    std::unique_ptr<ScheduledAction> get_ro(int oid)
    {
        return PoolSQL::get_ro<ScheduledAction>(oid);
    }

    /**
     *  Bootstraps the database table(s) associated to the Scheduled Action pool
     *    @return 0 on success
     */
    static int bootstrap(SqlDB *_db);

    /**
     *  Dumps the HOOK pool in XML format. A filter can be also added to the
     *  query
     *  @param oss the output stream to dump the pool contents
     *  @param where filter for the objects, defaults to all
     *  @param sid first element used for pagination
     *  @param eid last element used for pagination, -1 to disable
     *  @param desc descending order of pool elements
     *
     *  @return 0 on success
     */
    int dump(std::string& oss, const std::string& where, int sid, int eid,
        bool desc) override
    {
        return PoolSQL::dump(oss, "SCHED_ACTION_POOL", "body",
                    one_db::scheduled_action_table, where, sid, eid, desc);
    }

    /**
     *  Prints a set of ScheduledActions into a string stream. The element
     *  is named <SCHEDULED_ACTIONS>
     *
     *  @param actions set of ScheduledActions IDs to include
     *  @param oss the output stream
     *
     *  @return -1 if any of the actions does not exist. The stream contains
     *  all the existing actions.
     */
    int dump(const std::set<int> &actions, std::string& oss);

    /**
     *  Factory method to produce Hook objects
     *    @return a pointer to the new VN
     */
    PoolObjectSQL * create() override
    {
        return new ScheduledAction(PoolObjectSQL::NONE, -1);
    }

    /*
     * Return list of due actions <sched_id, resource_id> for specific object type
    */
    std::vector<std::pair<int, int>> get_is_due_actions(PoolObjectSQL::ObjectType ot);
};

#endif
