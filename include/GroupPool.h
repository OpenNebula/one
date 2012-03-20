/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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
    Group * get(int oid, bool lock)
    {
        return static_cast<Group *>(PoolSQL::get(oid,lock));
    };

    /**
     *  Gets an object from the pool (if needed the object is loaded from the
     *  database).
     *   @param name of the object
     *   @param lock locks the object if true
     *
     *   @return a pointer to the object, 0 in case of failure
     */
    Group * get(const string& name, bool lock)
    {
        // The owner is set to -1, because it is not used in the key() method
        return static_cast<Group *>(PoolSQL::get(name,-1,lock));
    };

    /**
     *  Generate an index key for the object
     *    @param name of the object
     *    @param uid owner of the object, only used if needed
     *
     *    @return the key, a string
     */
    string key(const string& name, int uid)
    {
        // Name is enough key because Groups can't repeat names.
        return name;
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
        return new Group(-1,"");
    };
};

#endif /*GROUP_POOL_H_*/
