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

#include <climits>
#include <sstream>
#include <iostream>
#include <stdexcept>
#include <algorithm>

#include "PoolSQL.h"

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

PoolSQL::PoolSQL(SqlDB * _db, const char * table): db(_db), lastOID(-1)
{
    ostringstream   oss;

    pthread_mutex_init(&mutex,0);

    set_callback(static_cast<Callbackable::Callback>(&PoolSQL::init_cb));

    oss << "SELECT MAX(oid) FROM " << table;

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
    }

    do_hooks(objsql, Hook::ALLOCATE);

    objsql->unlock();

    delete objsql;

    unlock();

    return rc;
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
            break;
        }

        rc = pthread_mutex_trylock(&(index->second->mutex));

        if ( rc == EBUSY ) // In use by other thread, move to back
        {
            oid_queue.pop();
            oid_queue.push(oid);
        }
        else
        {
            PoolObjectSQL * tmp_ptr;

            tmp_ptr = index->second;
            pool.erase(index);

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

    unlock();
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
