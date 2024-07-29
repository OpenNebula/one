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

#ifndef MARKETPLACE_POOL_H_
#define MARKETPLACE_POOL_H_

#include "MarketPlace.h"
#include "PoolSQL.h"
#include "OneDB.h"

class MarketPlaceApp;

class MarketPlacePool : public PoolSQL
{
public:
    MarketPlacePool(SqlDB * db,
                    bool    is_federation_slave);

    ~MarketPlacePool() {};

    /* ---------------------------------------------------------------------- */
    /* Methods for DB management                                              */
    /* ---------------------------------------------------------------------- */

    /**
     *  Allocates a new MarketPlace, writing it in the pool database. No memory is
     *  allocated for the object.
     *    @param uid the user id of the MarketPlace owner
     *    @param gid the id of the group this object is assigned to
     *    @param uname name of the user
     *    @param gname name of the group
     *    @param umask permissions umask
     *    @param mp_template MarketPlace definition template
     *    @param oid the id assigned to the MarketPlace
     *    @param error_str Returns the error reason, if any
     *
     *    @return the oid assigned to the object, -1 in case of failure
     */
    int allocate(
            int                uid,
            int                gid,
            const std::string& uname,
            const std::string& gname,
            int                umask,
            std::unique_ptr<MarketPlaceTemplate> mp_template,
            int *              oid,
            std::string&       error_str);

    /**
     *  Gets an object from the pool (if needed the object is loaded from the
     *  database). The object is locked, other threads can't access the same
     *  object. The lock is released by destructor.
     *   @param oid the MarketPlace unique identifier
     *   @return a pointer to the MarketPlace, nullptr in case of failure
     */
    std::unique_ptr<MarketPlace> get(int oid)
    {
        return PoolSQL::get<MarketPlace>(oid);
    }

    /**
     *  Gets a read only object from the pool (if needed the object is loaded from the
     *  database). No object lock, other threads may work with the same object.
     *   @param oid the MarketPlace unique identifier
     *   @return a pointer to the MarketPlace, nullptr in case of failure
     */
    std::unique_ptr<MarketPlace> get_ro(int oid)
    {
        return PoolSQL::get_ro<MarketPlace>(oid);
    }

    /** Update a particular MarketPlace
     *    @param  objsql points to the market
     *    @return 0 on success
     */
    int update(PoolObjectSQL * objsql) override;

    /**
     *  Drops the MarketPlace data in the data base. The object mutex SHOULD be
     *  locked.
     *    @param objsql a pointer to the MarketPlace object
     *    @param error_msg Error reason, if any
     *    @return 0 on success, -1 DB error -3 MarketPlace's App ID set not empty
     */
    int drop(PoolObjectSQL * objsql, std::string& error_msg) override;

    /**
     *  Bootstraps the database table(s) associated to the MarketPlace pool
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * _db)
    {
        return MarketPlace::bootstrap(_db);
    };

    /**
     *  Dumps the MarketPlace pool in XML format. A filter can be also added to
     *  the query
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
        return PoolSQL::dump(oss, "MARKETPLACE_POOL", "body", one_db::mp_table,
                             where, sid, eid, desc);
    };

    /**
     *  Lists the MarketPlace ids
     *  @param oids a vector with the oids of the objects.
     *
     *  @return 0 on success
     */
    int list(std::vector<int>& oids)
    {
        return PoolSQL::list(oids, one_db::mp_table);
    }

    /**
     *  Factory method to produce objects
     *    @return a pointer to the new object
     */
    PoolObjectSQL * create() override
    {
        return new MarketPlace(-1, -1, "", "", 0, 0);
    };
};

#endif /*MARKETPLACE_POOL_H_*/
