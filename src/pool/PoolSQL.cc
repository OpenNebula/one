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

PoolSQL::PoolSQL(SqlDB * _db, const char * _table, bool cache_by_name):
    db(_db), lastOID(-1), table(_table), uses_name_pool(cache_by_name)
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

    lock();

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

        oid_queue.push(objectsql->oid);

        if ( pool.size() > MAX_POOL_SIZE )
        {
            replace();
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

    lock();

    if ( uses_name_pool == false )
    {
        unlock();
        return 0;
    }

    index = name_pool.find(key(name,ouid));

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
        objectsql = create();

        rc = objectsql->select(db,name,ouid);

        if ( rc != 0 )
        {
            delete objectsql;

            unlock();

            return 0;
        }

        if ( index != name_pool.end() && index->second->isValid() == false )
        {
            index->second->lock();

            PoolObjectSQL * tmp_ptr  = index->second;
            string          tmp_okey = key(tmp_ptr->name,tmp_ptr->uid);

            pool.erase(tmp_ptr->oid);
            name_pool.erase(tmp_okey);

            delete tmp_ptr;
        }

        string okey = key(objectsql->name,objectsql->uid);

        pool.insert(make_pair(objectsql->oid, objectsql));
        name_pool.insert(make_pair(okey, objectsql));

        if ( olock == true )
        {
            objectsql->lock();
        }

        oid_queue.push(objectsql->oid);

        if ( pool.size() > MAX_POOL_SIZE )
        {
            replace();
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
        name_pool.erase(old_key);
        
        if ( name_pool.find(new_key) == name_pool.end())
        { 
            name_pool.insert(make_pair(new_key, index->second));
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
                  const string& where)
{
    ostringstream   cmd;

    cmd << "SELECT body FROM " << table;

    if ( !where.empty() )
    {
        cmd << " WHERE " << where;
    }

    cmd << " ORDER BY oid";

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

    sql  << "SELECT oid FROM " <<  table << " WHERE " << where;

    rc = db->exec(sql, this);

    unset_callback();

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void PoolSQL::acl_filter(int                       uid, 
                         int                       gid, 
                         PoolObjectSQL::ObjectType auth_object,
                         bool&                     all,
                         string&                   filter)
{
    filter.clear();

    if ( uid == 0 || gid == 0 )
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

    aclm->reverse_search(uid, 
                         gid, 
                         auth_object,
                         AuthRequest::USE, 
                         all, 
                         oids, 
                         gids);

    for ( it = oids.begin(); it < oids.end(); it++ )
    {
        acl_filter << " OR oid = " << *it;
    }

    for ( it = gids.begin(); it < gids.end(); it++ )
    {
        acl_filter << " OR gid = " << *it;
    }

    filter = acl_filter.str();
}

/* -------------------------------------------------------------------------- */

void PoolSQL::usr_filter(int           uid, 
                         int           gid, 
                         int           filter_flag,
                         bool          all,
                         const string& acl_str,
                         string&       filter)
{
    ostringstream uid_filter;

    if ( filter_flag == RequestManagerPoolInfoFilter::MINE )
    {
        uid_filter << "uid = " << uid;
    }
    else if ( filter_flag == RequestManagerPoolInfoFilter::MINE_GROUP )
    {
        uid_filter << " uid = " << uid 
                   << " OR ( gid = " << gid << " AND group_u = 1 )";        
    }
    else if ( filter_flag == RequestManagerPoolInfoFilter::ALL )
    {
        if (!all)
        {
            uid_filter << " uid = " << uid 
                       << " OR ( gid = " << gid << " AND group_u = 1 )"
                       << " OR other_u = 1"
                       << acl_str;
        }
    }
    else
    {
        uid_filter << "uid = " << filter_flag;

        if ( filter_flag != uid && !all )
        {
            uid_filter << " AND ("
                       << " ( gid = " << gid << " AND group_u = 1)"
                       << " OR other_u = 1"
                       << acl_str
                       << ")";
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

    if ( start_id != -1 )
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
