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

const unsigned int PoolSQL::MAX_POOL_SIZE = 15000;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int PoolSQL::init_cb(void *nil, int num, char **values, char **names)
{
    lastOID = -1;

    if ( values[0] != 0 )
    {
        lastOID = atoi(values[0]);
    }

    return 0;
}

/* -------------------------------------------------------------------------- */

PoolSQL::PoolSQL(SqlDB * _db, const char * _table, bool _cache, bool cache_by_name):
    db(_db), lastOID(-1), table(_table), cache(_cache), uses_name_pool(cache_by_name)
{
    ostringstream   oss;

    pthread_mutex_init(&mutex,0);

    set_callback(static_cast<Callbackable::Callback>(&PoolSQL::init_cb));

    oss << "SELECT last_oid FROM pool_control WHERE tablename='" << table <<"'";

    db->exec(oss,this);

    unset_callback();
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

PoolSQL::~PoolSQL()
{
    map<int,PoolObjectSQL *>::iterator  it;

    pthread_mutex_lock(&mutex);

    for ( it = pool.begin(); it != pool.end(); it++)
    {
        it->second->lock();

        delete it->second;
    }

    pthread_mutex_unlock(&mutex);

    pthread_mutex_destroy(&mutex);
}


/* ************************************************************************** */
/* PoolSQL public interface                                                   */
/* ************************************************************************** */

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int PoolSQL::allocate(
    PoolObjectSQL   *objsql,
    string&         error_str)
{
    int rc;

    lock();

    if (lastOID == INT_MAX)
    {
        lastOID = -1;
    }

    objsql->lock();

    objsql->oid = ++lastOID;

    rc = objsql->insert(db,error_str);

    if ( rc != 0 )
    {
        lastOID--;
        rc = -1;
    }
    else
    {
        rc = lastOID;
        do_hooks(objsql, Hook::ALLOCATE);
    }

    objsql->unlock();

    delete objsql;

    if( rc != -1 )
    {
        update_lastOID();
    }

    unlock();

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void PoolSQL::update_lastOID()
{
    // db->escape_str is not used for 'table' since its name can't be set in
    // any way by the user, it is hardcoded.

    ostringstream oss;

    oss << "REPLACE INTO pool_control (tablename, last_oid) VALUES ("
        << "'" <<   table       << "',"
        <<          lastOID     << ")";

    db->exec(oss);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

PoolObjectSQL * PoolSQL::get(
    int     oid,
    bool    olock)
{
    map<int,PoolObjectSQL *>::iterator  index;
    PoolObjectSQL *                     objectsql;
    int                                 rc;

    if ( oid < 0 )
    {
        objectsql = 0;
        return objectsql;
    }

    lock();

    if (!cache)
    {
        flush_cache(oid);
    }

    index = pool.find(oid);

    if ( index != pool.end() )
    {
        if ( index->second->isValid() == false )
        {
            objectsql = 0;
        }
        else
        {
            objectsql = index->second;

            if ( olock == true )
            {
                objectsql->lock();

                if ( objectsql->isValid() == false )
                {
                    objectsql->unlock();
                    objectsql = 0;
                }
            }
        }

        unlock();

        return objectsql;
    }
    else
    {
        objectsql = create();

        objectsql->oid = oid;

        rc = objectsql->select(db);

        if ( rc != 0 )
        {
            delete objectsql;

            unlock();

            objectsql = 0;
            return 0;
        }

        if ( uses_name_pool )
        {
            map<string,PoolObjectSQL *>::iterator name_index;
            string okey;

            okey       = key(objectsql->name,objectsql->uid);
            name_index = name_pool.find(okey);

            if ( name_index != name_pool.end() )
            {
                name_index->second->lock();

                PoolObjectSQL * tmp_ptr  = name_index->second;

                name_pool.erase(okey);
                pool.erase(tmp_ptr->oid);

                delete tmp_ptr;
            }

            name_pool.insert(make_pair(okey, objectsql));
        }

        pool.insert(make_pair(objectsql->oid,objectsql));

        if ( olock == true )
        {
            objectsql->lock();
        }

        if (cache)
        {
            oid_queue.push(objectsql->oid);

            if ( pool.size() > MAX_POOL_SIZE )
            {
                replace();
            }
        }

        unlock();

        return objectsql;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

PoolObjectSQL * PoolSQL::get(const string& name, int ouid, bool olock)
{
    map<string,PoolObjectSQL *>::iterator  index;

    PoolObjectSQL *  objectsql;
    int              rc;
    string           name_key;

    if ( uses_name_pool == false )
    {
        return 0;
    }

    lock();

    name_key = key(name,ouid);

    if (!cache)
    {
        flush_cache(name_key);
    }

    index = name_pool.find(name_key);

    if ( index != name_pool.end() && index->second->isValid() == true )
    {
        objectsql = index->second;

        if ( olock == true )
        {
            objectsql->lock();

            if ( objectsql->isValid() == false )
            {
                objectsql->unlock();
                objectsql = 0;
            }
        }

        unlock();

        return objectsql;
    }
    else
    {
        if ( index != name_pool.end() && index->second->isValid() == false )
        {
            index->second->lock();

            PoolObjectSQL * tmp_ptr  = index->second;
            string          tmp_okey = key(tmp_ptr->name,tmp_ptr->uid);

            pool.erase(tmp_ptr->oid);
            name_pool.erase(tmp_okey);

            delete tmp_ptr;
        }

        objectsql = create();

        rc = objectsql->select(db,name,ouid);

        if ( rc != 0 )
        {
            delete objectsql;

            unlock();

            return 0;
        }

        string okey = key(objectsql->name,objectsql->uid);

        pool.insert(make_pair(objectsql->oid, objectsql));
        name_pool.insert(make_pair(okey, objectsql));

        if ( olock == true )
        {
            objectsql->lock();
        }

        if (cache)
        {
            oid_queue.push(objectsql->oid);

            if ( pool.size() > MAX_POOL_SIZE )
            {
                replace();
            }
        }

        unlock();

        return objectsql;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void PoolSQL::update_cache_index(string& old_name,
                                 int     old_uid,
                                 string& new_name,
                                 int     new_uid)
{
    map<string,PoolObjectSQL *>::iterator  index;
    PoolObjectSQL * the_object;

    lock();

    if ( uses_name_pool == false )
    {
        unlock();
        return;
    }

    string old_key  = key(old_name, old_uid);
    string new_key  = key(new_name, new_uid);

    index = name_pool.find(old_key);

    if ( index != name_pool.end() )
    {
        the_object = index->second;

        name_pool.erase(old_key);

        if ( name_pool.find(new_key) == name_pool.end())
        {
            name_pool.insert(make_pair(new_key, the_object));
        }
    }

    unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void PoolSQL::replace()
{
    bool removed = false;
    int  oid;
    int  rc;

    map<int,PoolObjectSQL *>::iterator  index;

    while (!removed)
    {
        oid   = oid_queue.front();
        index = pool.find(oid);

        if ( index == pool.end())
        {
            oid_queue.pop();
            continue;
        }

        rc = pthread_mutex_trylock(&(index->second->mutex));

        if ( rc == EBUSY ) // In use by other thread, move to back
        {
            oid_queue.pop();
            oid_queue.push(oid);
        }
        else
        {
            PoolObjectSQL * tmp_ptr = index->second;

            pool.erase(index);

            if ( uses_name_pool )
            {
                string okey = key(tmp_ptr->name,tmp_ptr->uid);
                name_pool.erase(okey);
            }

            delete tmp_ptr;

            oid_queue.pop();
            removed = true;
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void PoolSQL::flush_cache(int oid)
{
    int  rc;
    PoolObjectSQL * tmp_ptr;

    map<int,PoolObjectSQL *>::iterator  it;

    for (it = pool.begin(); it != pool.end(); )
    {
        // The object we are looking for in ::get(). Will wait until it is
        // unlocked()
        if (it->second->oid == oid)
        {
            it->second->lock();
        }
        else
        {
            // Any other locked object is just ignored
            rc = pthread_mutex_trylock(&(it->second->mutex));

            if ( rc == EBUSY ) // In use by other thread
            {
                it++;
                continue;
            }
        }

        tmp_ptr = it->second;

        // map::erase does not invalidate the iterator, except for the current
        // one
        pool.erase(it++);

        if ( uses_name_pool )
        {
            string okey = key(tmp_ptr->name,tmp_ptr->uid);
            name_pool.erase(okey);
        }

        delete tmp_ptr;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void PoolSQL::flush_cache(const string& name_key)
{
    int  rc;
    PoolObjectSQL * tmp_ptr;

    map<string,PoolObjectSQL *>::iterator it;

    for (it = name_pool.begin(); it != name_pool.end(); )
    {
        string okey = key(it->second->name, it->second->uid);

        // The object we are looking for in ::get(). Will wait until it is
        // unlocked()
        if (name_key == okey)
        {
            it->second->lock();
        }
        else
        {
            // Any other locked object is just ignored
            rc = pthread_mutex_trylock(&(it->second->mutex));

            if ( rc == EBUSY ) // In use by other thread
            {
                it++;
                continue;
            }
        }

        tmp_ptr = it->second;

        // map::erase does not invalidate the iterator, except for the current
        // one
        name_pool.erase(it++);
        pool.erase(tmp_ptr->oid);

        delete tmp_ptr;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void PoolSQL::clean()
{
    map<int,PoolObjectSQL *>::iterator  it;

    lock();

    for ( it = pool.begin(); it != pool.end(); it++)
    {
        it->second->lock();

        delete it->second;
    }

    pool.clear();
    name_pool.clear();

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

int PoolSQL::dump(ostringstream& oss,
                  const string& elem_name,
                  const char * table,
                  const string& where,
                  const string& limit)
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

int PoolSQL::dump(ostringstream&  oss,
                  const string&   root_elem_name,
                  ostringstream&  sql_query)
{
    int rc;

    oss << "<" << root_elem_name << ">";

    set_callback(static_cast<Callbackable::Callback>(&PoolSQL::dump_cb),
                 static_cast<void *>(&oss));

    rc = db->exec(sql_query, this);

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

    rc = db->exec(sql, this);

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

    if ( uid == UserPool::ONEADMIN_ID || user_groups.count( GroupPool::ONEADMIN_ID ) == 1 )
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

    for ( it = cids.begin(); it < cids.end(); it++ )
    {
        acl_filter << " OR cid = " << *it;
    }

    filter = acl_filter.str();
}

/* -------------------------------------------------------------------------- */

void PoolSQL::usr_filter(int                uid,
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

void PoolSQL::register_hooks(vector<const Attribute *> hook_mads,
                             const string&             remotes_location)
{
    const VectorAttribute * vattr;

    string name;
    string on;
    string cmd;
    string arg;

    for (unsigned int i = 0 ; i < hook_mads.size() ; i++ )
    {
        vattr = static_cast<const VectorAttribute *>(hook_mads[i]);

        name = vattr->vector_value("NAME");
        on   = vattr->vector_value("ON");
        cmd  = vattr->vector_value("COMMAND");
        arg  = vattr->vector_value("ARGUMENTS");

        transform (on.begin(),on.end(),on.begin(),(int(*)(int))toupper);

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
