/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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

#include <climits>
#include <sstream>
#include <iostream>
#include <stdexcept>
#include <algorithm>

#include "PoolSQL.h"
#include "RequestManagerPoolInfoFilter.h"

#include <errno.h>

/* ************************************************************************** */
/* PoolSQL constructor/destructor                                             */
/* ************************************************************************** */

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
static int _get_lastOID(SqlDB * db, const string& table)
{
    ostringstream oss;

    int _last_oid = -1;

    single_cb<int> cb;

    cb.set_callback(&_last_oid);

    oss << "SELECT last_oid FROM pool_control WHERE tablename='" << table <<"'";

    db->exec_rd(oss, &cb);

    cb.unset_callback();

    return _last_oid;
}

int PoolSQL::get_lastOID()
{
    int _last_oid;

    lock();

    _last_oid = _get_lastOID(db, table);

    unlock();

    return _last_oid;
}

/* -------------------------------------------------------------------------- */

static int _set_lastOID(int _last_oid, SqlDB * db, const string& table)
{
    ostringstream oss;

    oss << "REPLACE INTO pool_control (tablename, last_oid) VALUES ('" << table
        << "'," << _last_oid << ")";

    return db->exec_wr(oss);
}

void PoolSQL::set_lastOID(int _last_oid)
{
    lock();

    _set_lastOID(_last_oid, db, table);

    unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

PoolSQL::PoolSQL(SqlDB * _db, const char * _table):db(_db), table(_table)
{
    pthread_mutex_init(&mutex,0);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

PoolSQL::~PoolSQL()
{
    vector<PoolObjectSQL *>::iterator it;

    pthread_mutex_lock(&mutex);

    pthread_mutex_destroy(&mutex);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* PoolSQL public interface                                                   */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
int PoolSQL::allocate(PoolObjectSQL *objsql, string& error_str)
{
    int rc;
    int lastOID;

    lock();

    lastOID = _get_lastOID(db, table);

    if (lastOID == INT_MAX)
    {
        lastOID = -1;
    }

    objsql->oid = ++lastOID;

    if ( _set_lastOID(lastOID, db, table) == -1 )
    {
        unlock();

        return -1;
    }

    rc = objsql->insert(db, error_str);

    if ( rc != 0 )
    {
        rc = -1;
    }
    else
    {
        rc = lastOID;
        do_hooks(objsql, Hook::ALLOCATE);
    }

    delete objsql;

    if( rc == -1 )
    {
        _set_lastOID(--lastOID, db, table);
    }

    unlock();

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

PoolObjectSQL * PoolSQL::get(int oid)
{
    if ( oid < 0 )
    {
        return 0;
    }

    pthread_mutex_t * object_lock = cache.lock_line(oid);

    PoolObjectSQL * objectsql = create();

    objectsql->oid = oid;

    objectsql->ro  = false;

    objectsql->mutex = object_lock;

    int rc = objectsql->select(db);

    if ( rc != 0 )
    {
        objectsql->unlock(); //Free object and unlock cache line mutex

        return 0;
    }

    return objectsql;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

PoolObjectSQL * PoolSQL::get_ro(int oid)
{
    if ( oid < 0 )
    {
        return 0;
    }

    PoolObjectSQL * objectsql = create();

    objectsql->oid = oid;

    objectsql->ro = true;

    int rc = objectsql->select(db);

    if ( rc != 0 )
    {
        objectsql->unlock(); //Free object;

        return 0;
    }

    return objectsql;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

PoolObjectSQL * PoolSQL::get(const string& name, int ouid)
{

    int oid = PoolObjectSQL::select_oid(db, table.c_str(), name, ouid);

    if ( oid == -1 )
    {
        return 0;
    }

    return get(oid);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

PoolObjectSQL * PoolSQL::get_ro(const string& name, int uid)
{
    int oid = PoolObjectSQL::select_oid(db, table.c_str(), name, uid);

    if ( oid == -1 )
    {
        return 0;
    }

    return get_ro(oid);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int PoolSQL::dump(string& oss, const string& elem_name, const string& column, const char* table,
    const string& where, const string& limit, bool desc)
{
    ostringstream   cmd;

    cmd << "SELECT " << column << " FROM " << table;

    if ( !where.empty() )
    {
        cmd << " WHERE " << where;
    }

    cmd << " ORDER BY oid";

    if ( desc == true )
    {
        cmd << " DESC";
    }

    if ( !limit.empty() )
    {
        cmd << " LIMIT " << limit;
    }

    return dump(oss, elem_name, cmd);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int PoolSQL::dump(string& oss, const string& root_elem_name,
    ostringstream& sql_query)
{
    int rc;

    string_cb cb(1);

    ostringstream oelem; 

    oelem << "<" << root_elem_name << ">";

    oss.append(oelem.str());

    cb.set_callback(&oss);

    rc = db->exec_rd(sql_query, &cb);

    cb.unset_callback();

    oelem.str("");

    oelem << "</" << root_elem_name << ">";

    oss.append(oelem.str());

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int PoolSQL::search(
    vector<int>&    oids,
    const char *    table,
    const string&   where)
{
    ostringstream   sql;
    int             rc;

    vector_cb<int> cb;

    cb.set_callback(&oids);

    sql  << "SELECT oid FROM " <<  table;

    if (!where.empty())
    {
        sql << " WHERE " << where;
    }

    rc = db->exec_rd(sql, &cb);

    cb.unset_callback();

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void PoolSQL::acl_filter(int                       uid,
                         const set<int>&           user_groups,
                         PoolObjectSQL::ObjectType auth_object,
                         bool&                     all,
                         bool                      disable_all_acl,
                         bool                      disable_cluster_acl,
                         bool                      disable_group_acl,
                         string&                   filter)
{
    filter.clear();

    if ( uid == UserPool::ONEADMIN_ID ||
            user_groups.count( GroupPool::ONEADMIN_ID ) == 1 )
    {
        all = true;
        return;
    }

    Nebula&     nd   = Nebula::instance();
    AclManager* aclm = nd.get_aclm();

    ostringstream         acl_filter;
    vector<int>::iterator it;

    vector<int> oids;
    vector<int> gids;
    vector<int> cids;

    aclm->reverse_search(uid,
                         user_groups,
                         auth_object,
                         AuthRequest::USE,
                         disable_all_acl,
                         disable_cluster_acl,
                         disable_group_acl,
                         all,
                         oids,
                         gids,
                         cids);

    for ( it = oids.begin(); it < oids.end(); it++ )
    {
        acl_filter << " OR oid = " << *it;
    }

    for ( it = gids.begin(); it < gids.end(); it++ )
    {
        acl_filter << " OR gid = " << *it;
    }

    ClusterPool::cluster_acl_filter(acl_filter, auth_object, cids);

    filter = acl_filter.str();
}

/* -------------------------------------------------------------------------- */

void PoolSQL::usr_filter(int                uid,
                         int                gid,
                         const set<int>&    user_groups,
                         int                filter_flag,
                         bool               all,
                         const string&      acl_str,
                         string&            filter)
{
    ostringstream uid_filter;

    set<int>::iterator g_it;

    if ( filter_flag == RequestManagerPoolInfoFilter::MINE )
    {
        uid_filter << "uid = " << uid;
    }
    else if ( filter_flag == RequestManagerPoolInfoFilter::GROUP )
    {
        uid_filter << "gid = " << gid;
    }
    else if ( filter_flag == RequestManagerPoolInfoFilter::MINE_GROUP )
    {
        uid_filter << "uid = " << uid << " OR ( (";

        string sep = " ";

        for (g_it = user_groups.begin(); g_it != user_groups.end(); g_it++)
        {
            uid_filter << sep << "( gid = " << *g_it << " )";
            sep = " OR ";
        }

        uid_filter << ")";

        if ( !all )
        {
            uid_filter << " AND ( other_u = 1";

            for (g_it = user_groups.begin(); g_it != user_groups.end(); g_it++)
            {
                uid_filter << " OR ( gid = " << *g_it << " AND group_u = 1 )";
            }

            uid_filter << acl_str << ")";
        }

        uid_filter << ")";
    }
    else if ( filter_flag == RequestManagerPoolInfoFilter::ALL )
    {
        if (!all)
        {
            uid_filter << " uid = " << uid
                    << " OR other_u = 1";

            for (g_it = user_groups.begin(); g_it != user_groups.end(); g_it++)
            {
                uid_filter << " OR ( gid = " << *g_it << " AND group_u = 1 )";
            }

            uid_filter << acl_str;
        }
    }
    else
    {
        uid_filter << "uid = " << filter_flag;

        if ( filter_flag != uid && !all )
        {
            uid_filter << " AND ( other_u = 1";

            for (g_it = user_groups.begin(); g_it != user_groups.end(); g_it++)
            {
                uid_filter << " OR ( gid = " << *g_it << " AND group_u = 1 )";
            }

            uid_filter << acl_str << ")";
        }
    }

    filter = uid_filter.str();
}

/* -------------------------------------------------------------------------- */

void PoolSQL::oid_filter(int     start_id,
                         int     end_id,
                         string& filter)
{
    ostringstream idfilter;

    if ( end_id >= -1 && start_id != -1 )
    {
        idfilter << "oid >= " << start_id;

        if ( end_id != -1 )
        {
            idfilter << " AND oid <= " << end_id;
        }
    }

    filter = idfilter.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void PoolSQL::register_hooks(vector<const VectorAttribute *> hook_mads,
                             const string&                   remotes_location)
{
    string name;
    string on;
    string cmd;
    string arg;

    for (unsigned int i = 0 ; i < hook_mads.size() ; i++ )
    {
        name = hook_mads[i]->vector_value("NAME");
        on   = hook_mads[i]->vector_value("ON");
        cmd  = hook_mads[i]->vector_value("COMMAND");
        arg  = hook_mads[i]->vector_value("ARGUMENTS");

        one_util::toupper(on);

        if ( on.empty() || cmd.empty() )
        {
            NebulaLog::log("VM", Log::WARNING, "Empty ON or COMMAND attribute"
                " in Hook, not registered!");

            continue;
        }

        if ( name.empty() )
        {
            name = cmd;
        }

        if (cmd[0] != '/')
        {
            ostringstream cmd_os;

            cmd_os << remotes_location << "/hooks/" << cmd;

            cmd = cmd_os.str();
        }

        if ( on == "CREATE" )
        {
            AllocateHook * hook;

            hook = new AllocateHook(name, cmd, arg, false);

            add_hook(hook);
        }
        else if ( on == "REMOVE" )
        {
            RemoveHook * hook;

            hook = new RemoveHook(name, cmd, arg, false);

            add_hook(hook);
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

