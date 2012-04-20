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

#include "GroupPool.h"
#include "Nebula.h"
#include "NebulaLog.h"

#include <stdexcept>

/* -------------------------------------------------------------------------- */
/* There are two default groups boostrapped by the core:                      */
/*   - oneadmin cannot be removed                                            */
/*   - users to place regular users by default                                */
/* The first 100 group IDs are reserved for system groups. Regular ones start */
/* from ID 100                                                                */
/* -------------------------------------------------------------------------- */

const string GroupPool::ONEADMIN_NAME = "oneadmin";
const int    GroupPool::ONEADMIN_ID   = 0;

const string GroupPool::USERS_NAME    = "users";
const int    GroupPool::USERS_ID      = 1;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

GroupPool::GroupPool(SqlDB * db):PoolSQL(db, Group::table, true)
{
    ostringstream oss;
    string        error_str;

    if (get_lastOID() == -1) //lastOID is set in PoolSQL::init_cb
    {
        int         rc;
        Group *     group;

        // Build the default oneadmins & users group
        group = new Group(ONEADMIN_ID, ONEADMIN_NAME);

        rc = PoolSQL::allocate(group, error_str);

        if( rc < 0 )
        {
            goto error_groups;
        }

        group = new Group(USERS_ID, USERS_NAME);

        rc = PoolSQL::allocate(group, error_str);

        if(rc < 0)
        {
            goto error_groups;
        }

        set_update_lastOID(99);
    }
    
    return;

error_groups:
    oss << "Error trying to create default group: " << error_str;
    NebulaLog::log("GROUP",Log::ERROR,oss);

    throw runtime_error(oss.str());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int GroupPool::allocate(string name, int * oid, string& error_str)
{
    Group *         group;
    ostringstream   oss;

    if ( name.empty() )
    {
        goto error_name;
    }

    if ( name.length() > 128 )
    {
        goto error_name_length;
    }

    // Check for duplicates
    group = get(name, false);

    if( group != 0 )
    {
        goto error_duplicated;
    }

    // Build a new Group object
    group = new Group(-1, name);

    // Insert the Object in the pool
    *oid = PoolSQL::allocate(group, error_str);

    return *oid;

error_name:
    oss << "NAME cannot be empty.";
    goto error_common;

error_name_length:
    oss << "NAME is too long; max length is 128 chars.";
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

int GroupPool::drop(PoolObjectSQL * objsql, string& error_msg)
{
    Group * group = static_cast<Group*>(objsql);

    int rc;

    // Return error if the group is a default one.
    if( group->get_oid() < 100 )
    {
        error_msg = "System Groups (ID < 100) cannot be deleted.";
        NebulaLog::log("GROUP", Log::ERROR, error_msg);
        return -2;
    }

    if( group->get_collection_size() > 0 )
    {
        ostringstream oss;
        oss << "Group " << group->get_oid() << " is not empty.";
        error_msg = oss.str();
        NebulaLog::log("GROUP", Log::ERROR, error_msg);

        return -3;
    }

    rc = group->drop(db);

    if( rc != 0 )
    {
        error_msg = "SQL DB error";
        rc = -1;
    }

    return rc;
}
