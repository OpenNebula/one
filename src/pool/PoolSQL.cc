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

PoolSQL::PoolSQL(SqlDB * _db, const char * _table):
    db(_db), table(_table)
{
    pthread_mutex_init(&mutex,0);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

PoolSQL::~PoolSQL()
{
    vector<PoolObjectSQL *>::iterator it;

    pthread_mutex_lock(&mutex);

    for ( it = pool.begin(); it != pool.end(); ++it)
    {
        (*it)->lock();

        delete *it;
    }

    pthread_mutex_unlock(&mutex);

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

    objsql->lock();

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

PoolObjectSQL * PoolSQL::get(int oid, bool olock)
{
    if ( oid < 0 )
    {
        return 0;
    }

    lock();

    flush_cache(oid);

    PoolObjectSQL * objectsql = create();

    objectsql->oid = oid;

    int rc = objectsql->select(db);

    if ( rc != 0 )
    {
        objectsql->lock();

        delete objectsql;

        unlock();

        return 0;
    }

    pool.push_back(objectsql);

    if ( olock == true )
    {
        objectsql->lock();
    }

    unlock();

    return objectsql;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

PoolObjectSQL * PoolSQL::get(const string& name, int ouid, bool olock)
{
    lock();

    string name_key = key(name, ouid);

    flush_cache(name_key);

    PoolObjectSQL * objectsql = create();

    int rc = objectsql->select(db, name, ouid);

    if ( rc != 0 )
    {
        objectsql->lock();

        delete objectsql;

        unlock();

        return 0;
    }

    pool.push_back(objectsql);

    if ( olock == true )
    {
        objectsql->lock();
    }

    unlock();

    return objectsql;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void PoolSQL::flush_cache(int oid)
{
    for (vector<PoolObjectSQL *>::iterator it = pool.begin(); it != pool.end();)
    {
        // The object we are looking for in ::get(). Wait until it is unlocked()
        if ((*it)->oid == oid)
        {
            (*it)->lock();
        }
        else
        {
            // Any other locked object is just ignored
            int rc = pthread_mutex_trylock(&((*it)->mutex));

            if ( rc == EBUSY ) // In use by other thread
            {
                it++;
                continue;
            }
        }

        delete *it;

        it = pool.erase(it);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void PoolSQL::flush_cache(const string& name_key)
{
    for (vector<PoolObjectSQL *>::iterator it = pool.begin(); it != pool.end();)
    {
        string okey = key((*it)->name, (*it)->uid);

        // The object we are looking for in ::get(). Wait until it is unlocked()
        if ( name_key == okey)
        {
            (*it)->lock();
        }
        else
        {
            // Any other locked object is just ignored
            int rc = pthread_mutex_trylock(&((*it)->mutex));

            if ( rc == EBUSY ) // In use by other thread
            {
                it++;
                continue;
            }
        }

        delete *it;

        it = pool.erase(it);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void PoolSQL::clean()
{
    vector<PoolObjectSQL *>::iterator it;

    lock();

    for (it = pool.begin(); it != pool.end(); ++it)
    {
        (*it)->lock();

        delete *it;
    }

    pool.clear();

    unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int PoolSQL::dump_cb(void * _oss, int num, char **values, char **names)
{
    ostringstream * oss;

    oss = static_cast<ostringstream *>(_oss);

    if ( (!values[0]) || (num != 1) )
    {
        return -1;
    }

    *oss << values[0];
    return 0;
}

/* -------------------------------------------------------------------------- */

int PoolSQL::dump(ostringstream& oss, const string& elem_name, const char* table,
    const string& where, const string& limit)
{
    ostringstream   cmd;

    cmd << "SELECT body FROM " << table;

    if ( !where.empty() )
    {
        cmd << " WHERE " << where;
    }

    cmd << " ORDER BY oid";

    if ( !limit.empty() )
    {
        cmd << " LIMIT " << limit;
    }

    return dump(oss, elem_name, cmd);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int PoolSQL::dump(ostringstream& oss, const string& root_elem_name,
    ostringstream& sql_query)
{
    int rc;

    oss << "<" << root_elem_name << ">";

    set_callback(static_cast<Callbackable::Callback>(&PoolSQL::dump_cb),
                 static_cast<void *>(&oss));

    rc = db->exec_rd(sql_query, this);

    add_extra_xml(oss);

    oss << "</" << root_elem_name << ">";

    unset_callback();

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int PoolSQL:: search_cb(void * _oids, int num, char **values, char **names)
{
    vector<int> *  oids;

    oids = static_cast<vector<int> *>(_oids);

    if ( num == 0 || values == 0 || values[0] == 0 )
    {
        return -1;
    }

    oids->push_back(atoi(values[0]));

    return 0;
}

/* -------------------------------------------------------------------------- */

int PoolSQL::search(
    vector<int>&    oids,
    const char *    table,
    const string&   where)
{
    ostringstream   sql;
    int             rc;

    set_callback(static_cast<Callbackable::Callback>(&PoolSQL::search_cb),
                 static_cast<void *>(&oids));

    sql  << "SELECT oid FROM " <<  table;

    if (!where.empty())
    {
        sql << " WHERE " << where;
    }

    rc = db->exec_rd(sql, this);

    unset_callback();

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
