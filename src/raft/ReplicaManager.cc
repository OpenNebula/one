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
#include "Client.h"
#include "ZoneServer.h"

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// Replication thread class & pool
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

const std::string ReplicaThread::replica_method = "one.zone.replicate";

const time_t ReplicaThread::max_retry_timeout   = 300;

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

ReplicaThread::ReplicaThread(int f, int l):_finalize(false),
    _pending_requests(false), retry_timeout(2), follower_id(f), leader_id(l),
    client(&transport)
{
    pthread_mutex_init(&mutex, 0);

    pthread_cond_init(&cond, 0);
};

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

int ReplicaThread::xml_rpc_replicate(unsigned int commit, LogDBRecord * lr,
        bool& success, unsigned int& fterm)
{
    std::ostringstream oss;

    Nebula& nd = Nebula::instance();

    ZonePool * zpool = nd.get_zonepool();
    int zone_id      = nd.get_zone_id();

    std::string secret, error;

    int xml_rc = 0;

    // -------------------------------------------------------------------------
    // Get parameters to call append entries on follower
    // -------------------------------------------------------------------------
    if ( Client::read_oneauth(secret, error) == -1 )
    {
        NebulaLog::log("RRM", Log::ERROR, error);
        return -1;
    }

    Zone * zone = zpool->get(zone_id, true);

    if ( zone == 0 )
    {
        return -1;
    }

    ZoneServer * follower = zone->get_server(follower_id);

    if ( follower == 0 )
    {
        zone->unlock();

        return -1;
    }

    std::string follower_edp = follower->vector_value("ENDPOINT");

    zone->unlock();

    // -------------------------------------------------------------------------
    // Setup XML-RPC call
    // -------------------------------------------------------------------------
    oss << "Replicating log entry " << lr->index << " on server: "
        << follower_id << " (" << follower_edp <<")";

    NebulaLog::log("RRM", Log::DDEBUG, oss);

    xmlrpc_c::carriageParm_curl0 carriage(follower_edp);

    xmlrpc_c::paramList replica_params;

    replica_params.add(xmlrpc_c::value_string(secret));
    replica_params.add(xmlrpc_c::value_int(leader_id));
    replica_params.add(xmlrpc_c::value_int(commit));
    replica_params.add(xmlrpc_c::value_int(lr->index));
    replica_params.add(xmlrpc_c::value_int(lr->term));
    replica_params.add(xmlrpc_c::value_int(lr->prev_index));
    replica_params.add(xmlrpc_c::value_int(lr->prev_term));
    replica_params.add(xmlrpc_c::value_string(lr->sql));

    xmlrpc_c::rpc rpc_client(replica_method, replica_params);

    // -------------------------------------------------------------------------
    // Do the XML-RPC call
    // -------------------------------------------------------------------------
    try
    {
        rpc_client.call(&client, &carriage);

        if ( rpc_client.isSuccessful() )
        {
            xmlrpc_c::value result = rpc_client.getResult();

            vector<xmlrpc_c::value> values =
                xmlrpc_c::value_array(result).vectorValueValue();

            success = xmlrpc_c::value_boolean(values[0]);
            fterm   = xmlrpc_c::value_int(values[1]);
        }
        else //RPC failed, will retry on next replication request
        {
            ostringstream ess;

            xmlrpc_c::fault failure = rpc_client.getFault();

            ess << "Error replicating log entry " << lr->index
                << " on follower " << follower_id << ": "
                << failure.getDescription();

            NebulaLog::log("RRM", Log::ERROR, ess);

            xml_rc = -1;
        }
    }
    catch (exception const& e)
    {
        std::ostringstream  ess;

        ess << "Error replicating log entry " << lr->index
            << " on follower " << follower_id << ": " << e.what();

        NebulaLog::log("RRM", Log::ERROR, ess);

        xml_rc = -1;
    }

    return xml_rc;
}


// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

void ReplicaThread::do_replication()
{
    Nebula& nd    = Nebula::instance();
    LogDB * logdb = nd.get_logdb();
    RaftManager * raftm = nd.get_raftm();

    unsigned int term = raftm->get_term();

    bool retry_request = false;

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
        unsigned int commit = raftm->get_commit();
        int next_index      = raftm->get_next_index(follower_id);

        LogDBRecord * lr    = logdb->get_log_record(next_index);

        bool success = false;
        unsigned int follower_term = -1;

        if ( lr == 0 )
        {
            ostringstream ess;

            ess << "Failed to load log entry at index: " << next_index;

            NebulaLog::log("RCM", Log::ERROR, ess);

            continue;
        }

        int xml_rc = xml_rpc_replicate(commit, lr, success, follower_term);

        delete lr;

        if ( xml_rc == -1 )
        {
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
            raftm->replicate_success_trigger(follower_id);
        }
        else
        {
            if ( follower_term > term )
            {
                raftm->follower_trigger(follower_term);
            }
            else
            {
                raftm->replicate_failure_trigger(follower_id);
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

void ReplicaManager::start_replica_threads()
{
    std::ostringstream oss;

    Nebula& nd       = Nebula::instance();
    ZonePool * zpool = nd.get_zonepool();

    int zone_id = nd.get_zone_id();

    Zone * zone = zpool->get(zone_id, true);

    if ( zone == 0 )
    {
        oss << "start replicas: zone " << zone_id << "does not exist.";

        NebulaLog::log("RCM", Log::ERROR, oss);
        return;
    }

    ZoneServers * fllw = zone->get_servers();

    for (ZoneServers::zone_iterator it = fllw->begin(); it != fllw->end(); ++it)
    {
        add_replica_thread((*it)->get_id());
    }

    zone->unlock();
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

    ReplicaThread * rthread = new ReplicaThread(follower_id, this_id);

    thread_pool.insert(std::make_pair(follower_id, rthread));

    pthread_attr_init (&pattr);
    pthread_attr_setdetachstate(&pattr, PTHREAD_CREATE_JOINABLE);

    oss << "Starting replication thread for follower: " << follower_id;

    NebulaLog::log("RCM", Log::INFO, oss);

    pthread_create(&thid, &pattr, replication_thread, (void *) rthread);

    pthread_attr_destroy(&pattr);
};
