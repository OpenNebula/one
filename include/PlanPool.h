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

#ifndef PLAN_POOL_H_
#define PLAN_POOL_H_

#include "PoolSQLCache.h"
#include "Plan.h"

class SqlDB;


class PlanPool
{
public:
    PlanPool(SqlDB * _db);

    /**
     *  Gets an object from the pool (if needed the object is loaded from the
     *  database). The object is locked, other threads can't access the same
     *  object. The lock is released by destructor.
     *   @param oid the object unique identifier
     *   @return a pointer to the object, nullptr in case of failure
     */
    std::unique_ptr<Plan> get(int id);

    /**
     *  Gets a read only object from the pool (if needed the object is loaded from the
     *  database). No object lock, other threads may work with the same object.
     *   @param oid the object unique identifier
     *   @return a pointer to the object, nullptr in case of failure
     */
    std::unique_ptr<Plan> get_ro(int id);

    /**
     *  Bootstraps the database table(s) associated to the Hook pool
     *    @return 0 on success
     */
    static int bootstrap(SqlDB *_db)
    {
        return Plan::bootstrap(_db);
    };

    /**
     *  Updates the plan in the database.
     *    @param plan pointer to the Plan object
     *    @return 0 on success
     */
    int update(Plan* plan)
    {
        return plan->update(db);
    }

    /**
     *  Drops the object's data in the data base. The object mutex SHOULD be
     *  locked.
     *    @param objsql a pointer to the object
     *    @return 0 on success, -1 DB error
     */
    int drop(Plan* plan)
    {
        return plan->drop(db);
    }

    /**
     * Get id of plans ready to be executed
     * @return a vector with the active plan IDs
     */
    std::vector<int> get_active_plans() const;


private:
    /**
     * The mutex for the plan. This implementation assumes that the mutex
     * IS LOCKED when the class destructor is called.
     */
    std::mutex _mutex;

    /**
     *  Pointer to the database.
     */
    SqlDB * db;

    /**
     *  Tablename for this pool
     */
    std::string table;

    /**
     *  The pool cache is implemented with a Map of SQL object pointers,
     *  using the OID as key.
     */
    PoolSQLCache cache;
};

#endif // PLAN_POOL_H_
