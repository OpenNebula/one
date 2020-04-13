/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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
#include "PoolSQL.h"

using namespace std;


class GroupPool : public PoolSQL
{
public:

    GroupPool(SqlDB * db, bool is_federation_slave,
        vector<const SingleAttribute *>& restricted_attrs);

    ~GroupPool() = default;

    /* ---------------------------------------------------------------------- */
    /* Constants for DB management                                            */
    /* ---------------------------------------------------------------------- */

    /**
     *  Default name for the oneadmin group
     */
    static const string ONEADMIN_NAME;

    /**
     *  Identifier for the oneadmin group
     */
    static const int ONEADMIN_ID;

    /**
     *  Default name for the users group
     */
    static const string USERS_NAME;

    /**
     *  Identifier for the user group
     */
    static const int USERS_ID;

    /* ---------------------------------------------------------------------- */
    /* Methods for DB management                                              */
    /* ---------------------------------------------------------------------- */

    /**
     *  Allocates a new group, writting it in the pool database. No memory is
     *  allocated for the object.
     *    @param name Group name
     *    @param oid the id assigned to the Group
     *    @param error_str Returns the error reason, if any
     *
     *    @return the oid assigned to the object, -1 in case of failure
     */
    int allocate(string                   name,
                 int *                    oid,
                 string&                  error_str);

    /**
     *  Function to get a group from the pool, if the object is not in memory
     *  it is loaded from the DB
     *    @param oid group unique id
     *    @param lock locks the group mutex
     *    @return a pointer to the group, 0 if the group could not be loaded
     */
    Group * get(int oid)
    {
        return static_cast<Group *>(PoolSQL::get(oid));
    };

    /**
     *  Function to get a read only group from the pool, if the object is not in memory
     *  it is loaded from the DB
     *    @param oid group unique id
     *    @param lock locks the group mutex
     *    @return a pointer to the group, 0 if the group could not be loaded
     */
    Group * get_ro(int oid)
    {
        return static_cast<Group *>(PoolSQL::get_ro(oid));
    };

    /**
     *  Returns the name of a group
     *    @param id of the group
     *    @return name of the group
     */
    const string get_name(int gid)
    {
        static string error_str = "";

        Group * group = get_ro(gid);

        if ( group == 0 )
        {
            return error_str;
        }

        const string gname = group->get_name();

        group->unlock();

        return gname;
    }

    /**
     * Update a particular Group. This method does not update the group's quotas
     *    @param user pointer to Group
     *    @return 0 on success
     */
    int update(PoolObjectSQL * objsql);

    /**
     * Update a particular Group's Quotas
     *    @param group pointer to Group
     *    @return 0 on success
     */
    int update_quotas(Group * group);

    /**
     *  Drops the Group from the data base. The object mutex SHOULD be
     *  locked.
     * @param objsql a pointer to a Group object
     * @param error_msg Error reason, if any
     * @return  0 on success,
     *          -1 DB error,
     *          -2 object is a system group (ID < 100)
     *          -3 Group's User IDs set is not empty
     */
    int drop(PoolObjectSQL * objsql, string& error_msg);

    /**
     *  Bootstraps the database table(s) associated to the Group pool
     *    @return 0 on success
     */
    static int bootstrap(SqlDB * _db)
    {
        return Group::bootstrap(_db);
    };

    /**
     *  Dumps the Group pool in XML format. A filter can be also added to the
     *  query
     *  @param oss the output stream to dump the pool contents
     *  @param where filter for the objects, defaults to all
     *  @param sid first element used for pagination
     *  @param eid last element used for pagination, -1 to disable
     *  @param desc descending order of pool elements
     *
     *  @return 0 on success
     */
    int dump(string& oss, const string& where, int sid, int eid, bool desc);

private:

    /**
     *  Factory method to produce objects
     *    @return a pointer to the new object
     */
    PoolObjectSQL * create()
    {
        return new Group(-1,"");
    };
};

#endif /*GROUP_POOL_H_*/
