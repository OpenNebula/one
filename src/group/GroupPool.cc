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

const string GroupPool::DEFAULT_GROUP_NAME = "default";

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

        // Build a new Group object
        group = new Group(0, 0, GroupPool::DEFAULT_GROUP_NAME);

        // Insert the Object in the pool
        rc = PoolSQL::allocate(group, error_str);

        if(rc != 0)
        {
            ostringstream oss;

            oss << "Error trying to create default group: " << error_str;
            NebulaLog::log("GROUP",Log::ERROR,oss);

            throw runtime_error(oss.str());
        }
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

    // Return error if group is 'default'
    if( group->get_oid() == 0 )
    {
        NebulaLog::log("GROUP",Log::WARNING,
                       "Default group cannot be deleted.");

        return -1;
    }

    rc = group->drop(db);

    return rc;
}
