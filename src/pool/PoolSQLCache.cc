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

#include "PoolSQLCache.h"
#include "Nebula.h"

unsigned int PoolSQLCache::MAX_ELEMENTS = 10000;

PoolSQLCache::PoolSQLCache()
{
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

std::mutex * PoolSQLCache::lock_line(int oid)
{
    static unsigned int num_locks = 0;

    CacheLine * cl;

    {
        std::lock_guard<std::mutex> lock(_mutex);

        auto it = cache.find(oid);

        if ( it == cache.end() )
        {
            cl = new CacheLine();

            cache.insert(std::make_pair(oid, cl));
        }
        else
        {
            cl = it->second;
        }

        cl->active++;
    }

    cl->lock();

    std::lock_guard<std::mutex> lock(_mutex);

    cl->active--;

    if ( ++num_locks > MAX_ELEMENTS )
    {
        num_locks = 0;

        if ( cache.size() > MAX_ELEMENTS )
        {
            flush_cache_lines();
        }
    }

    return &(cl->_mutex);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void PoolSQLCache::flush_cache_lines()
{
    for (auto it=cache.begin(); it!=cache.end();)
    {
        CacheLine * cl = it->second;

        bool rc = cl->trylock();

        if ( !rc ) // cache line locked
        {
            ++it;
            continue;
        }

        if ( cl->active > 0 ) // cache line being set
        {
            cl->unlock();

            ++it;
            continue;
        }

        delete it->second; // cache line locked & active == 0

        it = cache.erase(it);
    }
}

