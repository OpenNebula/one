/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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
#include "Nebula.h"
#include "NebulaLog.h"
#include "ZoneServer.h"

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// Replication thread class & pool
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

const time_t ReplicaThread::max_retry_timeout = 300;

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

extern "C" void * replication_thread(void *arg)
{
    ReplicaThread * rt;

    if ( arg == 0 )
    {
        return 0;
    }

    rt = static_cast<ReplicaThread *>(arg);

    rt->_thread_id = pthread_self();

    rt->do_replication();

    return 0;
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

ReplicaThread::ReplicaThread(int f):_finalize(false), _pending_requests(false),
    retry_timeout(2), follower_id(f)
{
    pthread_mutex_init(&mutex, 0);

    pthread_cond_init(&cond, 0);
};

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

void ReplicaThread::do_replication()
{
    Nebula& nd    = Nebula::instance();
    LogDB * logdb = nd.get_logdb();
    RaftManager * raftm = nd.get_raftm();

    unsigned int term = raftm->get_term();

    bool retry_request = false;
    std::string error;

    while ( _finalize == false )
    {
        pthread_mutex_lock(&mutex);

        while ( _pending_requests == false )
        {
            struct timespec timeout;

            timeout.tv_sec  = time(NULL) + retry_timeout;
            timeout.tv_nsec = 0;

            if ( pthread_cond_timedwait(&cond, &mutex, &timeout) == ETIMEDOUT )
            {
                _pending_requests = retry_request;
            }

            if ( _finalize )
            {
                return;
            }
        }

        _pending_requests = false;

        pthread_mutex_unlock(&mutex);

        // ---------------------------------------------------------------------
        // Get parameters to call append entries on follower
        // ---------------------------------------------------------------------
        int next_index   = raftm->get_next_index(follower_id);
        LogDBRecord * lr = logdb->get_log_record(next_index);

        bool success = false;
        unsigned int follower_term = -1;

        if ( lr == 0 )
        {
            ostringstream ess;

            ess << "Failed to load log record at index: " << next_index;

            NebulaLog::log("RCM", Log::ERROR, ess);

            continue;
        }

        int xml_rc = raftm->xmlrpc_replicate_log(follower_id, lr, success,
            follower_term, error);

        delete lr;

        if ( xml_rc == -1 )
        {
            NebulaLog::log("RCM", Log::ERROR, error);

            if ( retry_timeout < max_retry_timeout )
            {
                retry_timeout = 2 * retry_timeout;
            }

            retry_request = true;

            continue;
        }
        else
        {
            retry_timeout = 2;
            retry_request = false;
        }

        if ( success )
        {
            raftm->replicate_success(follower_id);
        }
        else
        {
            if ( follower_term > term )
            {
                raftm->follower(follower_term);
            }
            else
            {
                raftm->replicate_failure(follower_id);
            }
        }
    }
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

void ReplicaThread::finalize()
{
    pthread_mutex_lock(&mutex);

    _finalize = true;

    _pending_requests = false;

    pthread_cond_signal(&cond);

    pthread_mutex_unlock(&mutex);
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

void ReplicaThread::add_request()
{
    pthread_mutex_lock(&mutex);

    _pending_requests = true;

    pthread_cond_signal(&cond);

    pthread_mutex_unlock(&mutex);
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
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

void ReplicaManager::start_replica_threads(std::vector<unsigned int>& fids)
{
    std::vector<unsigned int>::iterator it;

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

        pthread_join(it->second->thread_id(), 0);

        delete it->second;
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

    pthread_join(it->second->thread_id(), 0);

    delete it->second;

    thread_pool.erase(it);
};

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

void ReplicaManager::add_replica_thread(int follower_id)
{
    std::ostringstream oss;

    pthread_attr_t pattr;
    pthread_t thid;

    Nebula& nd  = Nebula::instance();
    int this_id = nd.get_server_id();

    if ( follower_id == this_id || get_thread(follower_id) != 0 )
    {
        return;
    }

    ReplicaThread * rthread = new ReplicaThread(follower_id);

    thread_pool.insert(std::make_pair(follower_id, rthread));

    pthread_attr_init (&pattr);
    pthread_attr_setdetachstate(&pattr, PTHREAD_CREATE_JOINABLE);

    oss << "Starting replication thread for follower: " << follower_id;

    NebulaLog::log("RCM", Log::INFO, oss);

    pthread_create(&thid, &pattr, replication_thread, (void *) rthread);

    pthread_attr_destroy(&pattr);
};
