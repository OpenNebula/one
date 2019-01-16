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

#include "ReplicaManager.h"
#include "ReplicaThread.h"
#include "Nebula.h"
#include "NebulaLog.h"

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

ReplicaThread * ReplicaManager::get_thread(int server_id)
{
    std::map<int, ReplicaThread *>::iterator it;

    it = thread_pool.find(server_id);

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
    std::vector<int>::iterator it;

    for (it = fids.begin(); it != fids.end(); ++it)
    {
        add_replica_thread(*it);
    }
};

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

void ReplicaManager::stop_replica_threads()
{
    std::map<int, ReplicaThread *>::iterator it;

    for ( it = thread_pool.begin() ; it != thread_pool.end() ; ++it )
    {
        it->second->finalize();
    }

    thread_pool.clear();
};

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

void ReplicaManager::replicate()
{
    std::map<int, ReplicaThread *>::iterator it;

    for ( it = thread_pool.begin() ; it != thread_pool.end() ; ++it )
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

    std::map<int, ReplicaThread *>::iterator it;

    it = thread_pool.find(follower_id);

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
    pthread_attr_t pattr;
    pthread_t thid;

    Nebula& nd  = Nebula::instance();
    int this_id = nd.get_server_id();

    if ( follower_id == this_id || get_thread(follower_id) != 0 )
    {
        return;
    }

    ReplicaThread * rthread = thread_factory(follower_id);

    thread_pool.insert(std::make_pair(follower_id, rthread));

    pthread_attr_init (&pattr);
    pthread_attr_setdetachstate(&pattr, PTHREAD_CREATE_DETACHED);

    pthread_create(&thid, &pattr, replication_thread, (void *) rthread);

    pthread_attr_destroy(&pattr);
};

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
