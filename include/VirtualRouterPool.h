/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

/**
 *  The VirtualRouter Pool class.
 */
class VirtualRouterPool : public PoolSQL
{
public:

    VirtualRouterPool(
            SqlDB *                     db,
            vector<const Attribute *>   hook_mads,
            const string&               remotes_location)
                : PoolSQL(db, VirtualRouter::table, true, true)
    {
        register_hooks(hook_mads, remotes_location);
    };

    ~VirtualRouterPool(){};

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
                 const string&            uname,
                 const string&            gname,
                 int                      umask,
                 Template *               template_contents,
                 int *                    oid,
                 string&                  error_str)
    {
        *oid = PoolSQL::allocate(
            new VirtualRouter(-1, uid, gid, uname, gname, umask, template_contents),
            error_str);

        return *oid;
    }

    /**
     *  Gets an object from the pool (if needed the object is loaded from the
     *  database).
     *   @param oid the object unique identifier
     *   @param lock locks the object if true
     *
     *   @return a pointer to the object, 0 in case of failure
     */
    VirtualRouter * get(int oid, bool lock)
    {
        return static_cast<VirtualRouter *>(PoolSQL::get(oid,lock));
    };

    /**
     *  Gets an object from the pool (if needed the object is loaded from the
     *  database).
     *   @param name of the object
     *   @param uid id of owner
     *   @param lock locks the object if true
     *
     *   @return a pointer to the object, 0 in case of failure
     */
    VirtualRouter * get(const string& name, int uid, bool lock)
    {
        return static_cast<VirtualRouter *>(PoolSQL::get(name,uid,lock));
    };

    /**
     *  Dumps the pool in XML format. A filter can be also added to the
     *  query
     *  @param oss the output stream to dump the pool contents
     *  @param where filter for the objects, defaults to all
     *  @param limit parameters used for pagination
     *
     *  @return 0 on success
     */
    int dump(ostringstream& oss, const string& where, const string& limit)
    {
        return PoolSQL::dump(oss, "VROUTER_POOL", VirtualRouter::table, where,
                             limit);
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
    int search(vector<int>& oids, const string& where)
    {
        return PoolSQL::search(oids, VirtualRouter::table, where);
    };

private:
    /**
     *  Factory method to produce objects
     *    @return a pointer to the new object
     */
    PoolObjectSQL * create()
    {
        return new VirtualRouter(-1,-1,-1,"","",0,0);
    };
};

#endif /*VIRTUAL_ROUTER_POOL_H_*/
