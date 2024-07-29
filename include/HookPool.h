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

#ifndef HOOK_POOL_H_
#define HOOK_POOL_H_

#include "PoolSQL.h"
#include "Hook.h"
#include "HookAPI.h"
#include "OneDB.h"

class SqlDB;


class HookPool : public PoolSQL
{
public:

    HookPool(SqlDB * db) : PoolSQL(db, one_db::hook_table) {};

    ~HookPool() {};

    /**
     *  Function to allocate a new Hook object
     *    @param oid the id assigned to the Hook
     *    @return the oid assigned to the object or -1 in case of failure
     */
    int allocate (std::unique_ptr<Template> tmpl, std::string& error_str);

    /**
     *  Gets an object from the pool (if needed the object is loaded from the
     *  database). The object is locked, other threads can't access the same
     *  object. The lock is released by destructor.
     *   @param oid the Hook unique identifier
     *   @return a pointer to the Hook, nullptr in case of failure
     */
    std::unique_ptr<Hook> get(int oid)
    {
        return PoolSQL::get<Hook>(oid);
    }

    /**
     *  Gets a read only object from the pool (if needed the object is loaded from the
     *  database). No object lock, other threads may work with the same object.
     *   @param oid the Hook unique identifier
     *   @return a pointer to the Hook, nullptr in case of failure
     */
    std::unique_ptr<Hook> get_ro(int oid)
    {
        return PoolSQL::get_ro<Hook>(oid);
    }

    /**
     *  Bootstraps the database table(s) associated to the Hook pool
     *    @return 0 on success
     */
    static int bootstrap(SqlDB *_db)
    {
        return Hook::bootstrap(_db);
    };

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
        return PoolSQL::dump(oss, "HOOK_POOL", "body", one_db::hook_table,
                             where, sid, eid, desc);
    };

    /**
     *  Factory method to produce Hook objects
     *    @return a pointer to the new VN
     */
    PoolObjectSQL * create() override
    {
        return new Hook(0);
    };
};

#endif
