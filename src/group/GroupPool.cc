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

#include "GroupPool.h"
#include "Nebula.h"
#include "NebulaLog.h"
#include "OneDB.h"

#include <stdexcept>

using namespace std;

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

GroupPool::GroupPool(SqlDB * db, bool is_slave,
                     const vector<const SingleAttribute *>& restricted_attrs)
    : PoolSQL(db, one_db::group_table)
{
    ostringstream oss;
    string        error_str;

    //Federation slaves do not need to init the pool
    if (is_slave)
    {
        return;
    }

    //lastOID is set in PoolSQL::init_cb
    if (get_lastOID() == -1)
    {
        int         rc;
        Group *     group;

        // Build the default oneadmins & users group
        group = new Group(ONEADMIN_ID, ONEADMIN_NAME);

        rc = PoolSQL::allocate(group, error_str);

        if (rc < 0)
        {
            goto error_groups;
        }

        group = new Group(USERS_ID, USERS_NAME);

        group->sunstone_views("cloud", "cloud", "groupadmin", "groupadmin,cloud");

        rc = PoolSQL::allocate(group, error_str);

        if (rc < 0)
        {
            goto error_groups;
        }

        set_lastOID(99);
    }

    // Set restricted attributes
    GroupTemplate::parse_restricted(restricted_attrs);

    return;

error_groups:
    oss << "Error trying to create default group: " << error_str;
    NebulaLog::log("GROUP", Log::ERROR, oss);

    throw runtime_error(oss.str());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int GroupPool::allocate(string name, int * oid, string& error_str)
{
    int db_oid;

    Group * group;

    ostringstream   oss;

    if (Nebula::instance().is_federation_slave())
    {
        NebulaLog::log("ONE", Log::ERROR,
                       "GroupPool::allocate called, but this "
                       "OpenNebula is a federation slave");

        return -1;
    }

    // Check name
    if ( !PoolObjectSQL::name_is_valid(name, error_str) )
    {
        goto error_name;
    }

    // Check for duplicates
    db_oid = exist(name);

    if( db_oid != -1 )
    {
        goto error_duplicated;
    }

    // Build a new Group object
    group = new Group(-1, name);

    // Insert the Object in the pool
    *oid = PoolSQL::allocate(group, error_str);

    return *oid;

error_duplicated:
    oss << "NAME is already taken by GROUP " << db_oid << ".";
    error_str = oss.str();

error_name:
    *oid = -1;

    return *oid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int GroupPool::update(PoolObjectSQL * objsql)
{
    if (Nebula::instance().is_federation_slave())
    {
        NebulaLog::log("ONE", Log::ERROR,
                       "GroupPool::update called, but this "
                       "OpenNebula is a federation slave");

        return -1;
    }

    return PoolSQL::update(objsql);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int GroupPool::update_quotas(Group * group)
{
    return group->update_quotas(db);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int GroupPool::drop(PoolObjectSQL * objsql, string& error_msg)
{
    Group * group = static_cast<Group*>(objsql);

    int rc;

    if (Nebula::instance().is_federation_slave())
    {
        NebulaLog::log("ONE", Log::ERROR,
                       "GroupPool::drop called, but this "
                       "OpenNebula is a federation slave");

        return -1;
    }

    // Return error if the group is a default one.
    if( group->get_oid() < 100 )
    {
        error_msg = "System Groups (ID < 100) cannot be deleted.";
        NebulaLog::log("GROUP", Log::ERROR, error_msg);
        return -2;
    }

    if( group->users.size() > 0 )
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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int GroupPool::dump(string& oss, const string& where, int sid, int eid, bool desc)
{
    int     rc;
    string  def_quota_xml;

    ostringstream cmd;

    cmd << "SELECT " << one_db::group_table << ".body, "
        << one_db::group_quotas_db_table << ".body" << " FROM " << one_db::group_table
        << " LEFT JOIN " << one_db::group_quotas_db_table << " ON "
        << one_db::group_table << ".oid=" << one_db::group_quotas_db_table << ".group_oid";

    if ( !where.empty() )
    {
        cmd << " WHERE " << where;
    }

    cmd << " ORDER BY oid";

    if ( desc == true )
    {
        cmd << " DESC";
    }

    if ( eid != -1 )
    {
        cmd << " " << db->limit_string(sid, eid);
    }

    oss.append("<GROUP_POOL>");

    string_cb cb(2);

    cb.set_callback(&oss);

    rc = db->exec_rd(cmd, &cb);

    cb.unset_callback();

    oss.append(Nebula::instance().get_default_group_quota().to_xml(def_quota_xml));

    oss.append("</GROUP_POOL>");

    return rc;
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
