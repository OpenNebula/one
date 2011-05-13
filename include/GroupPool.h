/* -------------------------------------------------------------------------- */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             */
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

#ifndef GROUP_POOL_H_
#define GROUP_POOL_H_

#include "Group.h"
#include "SqlDB.h"

using namespace std;


class GroupPool : public PoolSQL
{
public:
    GroupPool(SqlDB * db);

    ~GroupPool(){};

    /**
     *  Names for the default groups
     */
    static const string ONEADMIN_GROUP_NAME;
    static const string USERS_GROUP_NAME;

    /* ---------------------------------------------------------------------- */
    /* Methods for DB management                                              */
    /* ---------------------------------------------------------------------- */

    /**
     *  Allocates a new group, writting it in the pool database. No memory is
     *  allocated for the object.
     *    @param uid user id (the owner of the Object)
     *    @param name Group name
     *    @param oid the id assigned to the Group
     *    @param error_str Returns the error reason, if any
     *
     *    @return the oid assigned to the object, -1 in case of failure
     */
    int allocate(int                      uid,
                 string                   name,
                 int *                    oid,
                 string&                  error_str);

    /**
     *  Function to get a group from the pool, if the object is not in memory
     *  it is loaded from the DB
     *    @param oid group unique id
     *    @param lock locks the group mutex
     *    @return a pointer to the group, 0 if the group could not be loaded
     */
    Group * get(int oid, bool lock)
    {
        return static_cast<Group *>(PoolSQL::get(oid,lock));
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
    Group * get(const string& name, int uid, bool lock)
    {
        return static_cast<Group *>(PoolSQL::get(name,uid,lock));
    };

    /** Update a particular Group
     *    @param user pointer to Group
     *    @return 0 on success
     */
    int update(Group * group)
    {
        return group->update(db);
    };

    /**
     *  Drops the Group from the data base. The object mutex SHOULD be
     *  locked.
     *    @param group a pointer to the object
     *    @return 0 on success.
     */
    int drop(Group * group);

    /**
     *  Bootstraps the database table(s) associated to the Group pool
     */
    static void bootstrap(SqlDB * _db)
    {
        Group::bootstrap(_db);
    };

    /**
     *  Dumps the Group pool in XML format. A filter can be also added to the
     *  query
     *  @param oss the output stream to dump the pool contents
     *  @param where filter for the objects, defaults to all
     *
     *  @return 0 on success
     */
    int dump(ostringstream& oss, const string& where)
    {
        return PoolSQL::dump(oss, "GROUP_POOL", Group::table, where);
    };

private:

    /**
     *  Factory method to produce objects
     *    @return a pointer to the new object
     */
    PoolObjectSQL * create()
    {
        return new Group(-1,-1,"");
    };
};

#endif /*GROUP_POOL_H_*/
