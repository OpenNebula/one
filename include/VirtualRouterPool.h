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

#ifndef VIRTUAL_ROUTER_POOL_H_
#define VIRTUAL_ROUTER_POOL_H_

#include "PoolSQL.h"
#include "VirtualRouter.h"
#include "OneDB.h"

/**
 *  The VirtualRouter Pool class.
 */
class VirtualRouterPool : public PoolSQL
{
public:

    VirtualRouterPool(SqlDB * db) : PoolSQL(db, one_db::vr_table) {};

    ~VirtualRouterPool() {};

    /**
     *  Allocates a new object, writing it in the pool database. No memory is
     *  allocated for the object.
     *    @param uid user id (the owner of the VirtualRouter)
     *    @param gid the id of the group this object is assigned to
     *    @param uname name of the owner user
     *    @param gname name of the group
     *    @param umask permissions umask
     *    @param template_contents a Template object
     *    @param oid the id assigned to the VirtualRouter
     *    @param error_str Returns the error reason, if any
     *
     *    @return the oid assigned to the object, -1 in case of failure
     */
    int allocate(int                      uid,
                 int                      gid,
                 const std::string&       uname,
                 const std::string&       gname,
                 int                      umask,
                 std::unique_ptr<Template> template_contents,
                 int *                    oid,
                 std::string&             error_str)
    {
        VirtualRouter vr{-1, uid, gid, uname, gname, umask, move(template_contents)};
        *oid = PoolSQL::allocate(vr, error_str);

        return *oid;
    }

    /**
     *  Gets an object from the pool (if needed the object is loaded from the
     *  database). The object is locked, other threads can't access the same
     *  object. The lock is released by destructor.
     *   @param oid the VirtualRouter unique identifier
     *   @return a pointer to the VirtualRouter, nullptr in case of failure
     */
    std::unique_ptr<VirtualRouter> get(int oid)
    {
        return PoolSQL::get<VirtualRouter>(oid);
    }

    /**
     *  Gets a read only object from the pool (if needed the object is loaded from the
     *  database). No object lock, other threads may work with the same object.
     *   @param oid the VirtualRouter unique identifier
     *   @return a pointer to the VirtualRouter, nullptr in case of failure
     */
    std::unique_ptr<VirtualRouter> get_ro(int oid)
    {
        return PoolSQL::get_ro<VirtualRouter>(oid);
    }

    /**
     *  Dumps the pool in XML format. A filter can be also added to the
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
        return PoolSQL::dump(oss, "VROUTER_POOL", "body", one_db::vr_table,
                             where, sid, eid, desc);
    };

    /**
     *  Bootstraps the database table(s) associated to the pool
     *    @return 0 on success
     */
    static int bootstrap(SqlDB *_db)
    {
        return VirtualRouter::bootstrap(_db);
    };

    /**
     *  Gets the IDs of objects matching the given SQL where string.
     *    @param oids a vector that contains the IDs
     *    @param where SQL clause
     *    @return 0 on success
     */
    int search(std::vector<int>& oids, const std::string& where)
    {
        return PoolSQL::search(oids, one_db::vr_table, where);
    };

private:
    /**
     *  Factory method to produce objects
     *    @return a pointer to the new object
     */
    PoolObjectSQL * create() override
    {
        return new VirtualRouter(-1, -1, -1, "", "", 0, 0);
    };
};

#endif /*VIRTUAL_ROUTER_POOL_H_*/
