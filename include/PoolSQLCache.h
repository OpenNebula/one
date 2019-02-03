/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

#ifndef POOL_SQL_CACHE_H_
#define POOL_SQL_CACHE_H_

#include <map>
#include <string>
#include <queue>
#include <pthread.h>

#include "PoolObjectSQL.h"

/**
 *  This class stores the active reference to pool objects. It can also
 *  cache to not reload object state from the DB.
 *
 *  Access to the cache needs to happen in a critical section.
 */
class PoolSQLCache
{
public:

    PoolSQLCache();

    virtual ~PoolSQLCache()
    {
        pthread_mutex_destroy(&mutex);
    };

    /**
     *  Allocates a new cache line to hold an active pool object. If the line
     *  does not exist it is created. Any active reference is deallocated to
     *  load a fresh copy of the object.
     *
     *  The cache line is locked to sync access to the given object.
     *
     *  @param oid of the object
     */
    pthread_mutex_t * lock_line(int oid);

private:
    /**
     *  This class represents a cache line. It stores a reference to the pool
     *  object and a mutex to control concurrent access to the object
     */
    struct CacheLine
    {
        CacheLine():active(0)
        {
            pthread_mutex_init(&mutex, 0);
        };

        ~CacheLine()
        {
            pthread_mutex_destroy(&mutex);
        }

        void lock()
        {
            pthread_mutex_lock(&mutex);
        };

        void unlock()
        {
            pthread_mutex_unlock(&mutex);
        }

        int trylock()
        {
            return pthread_mutex_trylock(&mutex);
        }

        /**
         *  Concurrent access to object
         */
        pthread_mutex_t mutex;

        /**
         *  Number of threads waiting on the line mutex
         */
        int active;
    };

    /**
     *  Max number of references in the cache.
     */
    static unsigned int MAX_ELEMENTS;

    /**
     *  Cache of pool objects indexed by their oid
     */
    std::map<int, CacheLine *> cache;

    /**
     *  Deletes all cache lines if they are not in use.
     */
    void flush_cache_lines();

    /**
     *  Controls concurrent access to the cache map.
     */
    pthread_mutex_t mutex;

    void lock()
    {
        pthread_mutex_lock(&mutex);
    };

    void unlock()
    {
        pthread_mutex_unlock(&mutex);
    }
};

#endif /*POOL_SQL_CACHE_H_*/

