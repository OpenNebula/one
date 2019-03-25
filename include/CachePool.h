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

#ifndef CACHE_POOL_H_
#define CACHE_POOL_H_

#include <time.h>
#include <sstream>
#include <pthread.h>

#include <iostream>

#include <vector>

using namespace std;

/**
 *  The Cache Pool class. This class is used to store volatile pool data.
 */
template<typename T> class CachePool
{
public:
    CachePool()
    {
        pthread_mutex_init(&resource_lock, 0);
    }

    ~CachePool()
    {
        typename std::map<int, T *>::iterator it;

        pthread_mutex_lock(&resource_lock);

        for (it=resources.begin(); it != resources.end() ; ++it)
        {
            delete it->second;
        }

        pthread_mutex_unlock(&resource_lock);

        pthread_mutex_destroy(&resource_lock);
    };

    T * get_resource(int oid)
    {
        T * res;

        pthread_mutex_lock(&resource_lock);

        typename std::map<int, T *>::iterator it = resources.find(oid);

        if ( it == resources.end() )
        {
            res = new T;

            resources.insert(std::make_pair(oid, res));
        }
        else
        {
            res = it->second;
        }

        pthread_mutex_unlock(&resource_lock);

        return res;
    }


    void delete_resource(int oid)
    {
        pthread_mutex_lock(&resource_lock);

        typename std::map<int, T *>::iterator it = resources.find(oid);

        if ( it != resources.end() )
        {
            delete it->second;

            resources.erase(it);
        }

        pthread_mutex_unlock(&resource_lock);
    }

private:

    pthread_mutex_t resource_lock;

    std::map<int, T *> resources;
};

#endif /*CACHE_POOL_H_*/