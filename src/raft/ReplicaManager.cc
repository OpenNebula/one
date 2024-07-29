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

#include "ReplicaManager.h"
#include "ReplicaThread.h"
#include "Nebula.h"
#include "NebulaLog.h"

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

ReplicaThread * ReplicaManager::get_thread(int server_id)
{
    auto it = thread_pool.find(server_id);

    if ( it == thread_pool.end() )
    {
        return 0;
    }

    return it->second;
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

void ReplicaManager::start_replica_threads(std::vector<int>& fids)
{
    for (auto id : fids)
    {
        add_replica_thread(id);
    }
};

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

void ReplicaManager::stop_replica_threads()
{
    for ( auto it = thread_pool.begin() ; it != thread_pool.end() ; ++it )
    {
        it->second->finalize();
    }

    thread_pool.clear();
};

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

void ReplicaManager::replicate()
{
    for ( auto it = thread_pool.begin() ; it != thread_pool.end() ; ++it )
    {
        it->second->add_request();
    }
};

void ReplicaManager::replicate(int follower)
{
    ReplicaThread * rth = get_thread(follower);

    if ( rth == 0 )
    {
        return;
    }

    rth->add_request();
};

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

void ReplicaManager::delete_replica_thread(int follower_id)
{
    auto it = thread_pool.find(follower_id);

    if ( it == thread_pool.end() )
    {
        return;
    }

    it->second->finalize();

    thread_pool.erase(it);
};

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

void ReplicaManager::add_replica_thread(int follower_id)
{
    Nebula& nd  = Nebula::instance();
    int this_id = nd.get_server_id();

    if ( follower_id == this_id || get_thread(follower_id) != 0 )
    {
        return;
    }

    ReplicaThread * rthread = thread_factory(follower_id);

    thread_pool.insert(std::make_pair(follower_id, rthread));

    std::thread replica_thread([rthread]
    {
        rthread->do_replication();

        delete rthread;
    });

    replica_thread.detach();
}

// -----------------------------------------------------------------------------

ReplicaThread * RaftReplicaManager::thread_factory(int follower_id)
{
    return new RaftReplicaThread(follower_id);
}

// -----------------------------------------------------------------------------

ReplicaThread * HeartBeatManager::thread_factory(int follower_id)
{
    return new HeartBeatThread(follower_id);
}
