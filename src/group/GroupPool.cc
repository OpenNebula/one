/* -------------------------------------------------------------------------- */
/* Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             */
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

#include "GroupPool.h"
#include "Nebula.h"
#include "NebulaLog.h"

#include <stdexcept>

const string GroupPool::ONEADMIN_GROUP_NAME = "oneadmin";
const string GroupPool::USERS_GROUP_NAME    = "users";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

GroupPool::GroupPool(SqlDB * db):PoolSQL(db, Group::table)
{
    // lastOID is set in PoolSQL::init_cb
    if (get_lastOID() == -1)
    {
        int         rc;
        Group *     group;
        string      error_str;

        // Build the default groups
        group = new Group(0, 0, GroupPool::ONEADMIN_GROUP_NAME);

        // Insert the Object in the pool
        rc = PoolSQL::allocate(group, error_str);

        if(rc < 0)
        {
            ostringstream oss;

            oss << "Error trying to create default group: " << error_str;
            NebulaLog::log("GROUP",Log::ERROR,oss);

            throw runtime_error(oss.str());
        }

        group = new Group(1, 0, GroupPool::USERS_GROUP_NAME);

        // Insert the Object in the pool
        rc = PoolSQL::allocate(group, error_str);

        if(rc < 0)
        {
            ostringstream oss;

            oss << "Error trying to create default group: " << error_str;
            NebulaLog::log("GROUP",Log::ERROR,oss);

            throw runtime_error(oss.str());
        }

        // First 100 group Ids are reserved for system groups.
        // Regular ones start from ID 100
        lastOID=99;
        update_lastOID();
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int GroupPool::allocate(int uid, string name, int * oid, string& error_str)
{
    Group *         group;
    ostringstream   oss;

    if ( name.empty() )
    {
        goto error_name;
    }

    // Check for duplicates
    group = get(name, uid, false);

    if( group != 0 )
    {
        goto error_duplicated;
    }

    // Build a new Group object
    group = new Group(-1, uid, name);

    // Insert the Object in the pool
    *oid = PoolSQL::allocate(group, error_str);

    return *oid;


error_name:
    oss << "NAME cannot be empty.";
    goto error_common;

error_duplicated:
    oss << "NAME is already taken by GROUP " << group->get_oid() << ".";

error_common:
    *oid = -1;
    error_str = oss.str();

    return *oid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int GroupPool::drop(Group * group)
{
    int         rc;

    // Return error if the group is a default one.
    if( group->get_oid() < 100 )
    {
        NebulaLog::log("GROUP",Log::ERROR,
                       "Groups with ID less than 100 cannot be deleted.");

        return -1;
    }

    rc = group->drop(db);

    return rc;
}
