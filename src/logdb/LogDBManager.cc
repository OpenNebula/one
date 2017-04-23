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

#include "LogDBManager.h"
#include "Nebula.h"
#include "NebulaLog.h"
#include "Client.h"

// ----------------------------------------------------------------------------
// Thread wrapper functions
// ----------------------------------------------------------------------------
extern "C" void * logdb_manager_loop(void *arg)
{
    LogDBManager * dbm;

    if ( arg == 0 )
    {
        return 0;
    }

    dbm = static_cast<LogDBManager *>(arg);

    NebulaLog::log("DBM",Log::INFO,"LogDB Replication Manager started.");

    dbm->am.loop();

    NebulaLog::log("DBM",Log::INFO,"LogDB Replication Manager stopped.");

    return 0;
}

extern "C" void * replication_thread(void *arg)
{
    LogDBManager::ReplicaThread * rt;

    if ( arg == 0 )
    {
        return 0;
    }

    rt = static_cast<LogDBManager::ReplicaThread *>(arg);

    rt->do_replication();

    return 0;
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

void LogDBManager::finalize_action(const ActionRequest& ar)
{
    NebulaLog::log("DBM", Log::INFO, "Stopping LogDB Manager...");
};

void LogDBManager::user_action(const ActionRequest& ar)
{
    const LogDBAction& la = static_cast<const LogDBAction& >(ar);

    switch(la.action())
    {
        case LogDBAction::START:
        case LogDBAction::ADD_SERVER:
            start_action();
            break;

        case LogDBAction::STOP:
            stop_action();
            break;

        case LogDBAction::REPLICATE:
            replicate_action();
            break;

        case LogDBAction::DELETE_SERVER:
            delete_server_action();
            break;
    }
};

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

void LogDBManager::start_action()
{
    std::ostringstream oss;

    Nebula& nd       = Nebula::instance();
    ZonePool * zpool = nd.get_zonepool();

    int this_id = nd.get_server_id();
    int zone_id = nd.get_zone_id();

    Zone * zone = zpool->get(zone_id, true);

    if ( zone == 0 )
    {
        oss << "start replicas: zone " << zone_id << "does not exist.";

        NebulaLog::log("DBM", Log::ERROR, oss);
        return;
    }

    ZoneServers * servers     = zone->get_servers();
    ZoneServer *  this_server = servers->get_server(this_id);

    if ( this_server == 0 )
    {
        zone->unlock();

        oss << "start replicas: server " << zone_id << "does not exist.";

        NebulaLog::log("DBM", Log::ERROR, oss);
        return;
    }

    ZoneServers::zone_iterator it;

    for (it = servers->begin() ; it != servers->end() ; ++it )
    {
        pthread_attr_t pattr;

        int id = (*it)->get_id();

        if ( id == this_id || (*it)->is_offline() || get_thread(id) != 0 )
        {
            continue;
        }

        // ---------------------------------------------------------------------
        // Initialize follower
        // ---------------------------------------------------------------------
        (*it)->init_follower(this_server->get_applied());

        // ---------------------------------------------------------------------
        // Create replication thread for this follower
        // ---------------------------------------------------------------------
        ReplicaThread * rthread = new ReplicaThread(id, this_id);

        thread_pool.insert(std::make_pair(id, rthread));

        pthread_attr_init (&pattr);
        pthread_attr_setdetachstate(&pattr, PTHREAD_CREATE_JOINABLE);

        oss << "Starting replication thread for server " << id;

        NebulaLog::log("DBM", Log::INFO, oss);

        pthread_create(rthread->thread_id(), &pattr, replication_thread,
                (void *) rthread);

        pthread_attr_destroy(&pattr);
    }

    zone->unlock();
};

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

void LogDBManager::stop_action()
{
    std::map<int, ReplicaThread *>::iterator it;

    for ( it = thread_pool.begin() ; it != thread_pool.end() ; ++it )
    {
        it->second->finalize();

        pthread_join(*(it->second->thread_id()),0);

        delete it->second;
    }

    thread_pool.clear();
};

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

void LogDBManager::replicate_action()
{
    std::map<int, ReplicaThread *>::iterator it;

    for ( it = thread_pool.begin() ; it != thread_pool.end() ; ++it )
    {
        it->second->add_request();
    }
};

void LogDBManager::delete_server_action()
{

};

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// Replication thread logic
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

const std::string LogDBManager::ReplicaThread::replica_method =
    "one.zone.replicate";

LogDBManager::ReplicaThread::ReplicaThread(int f, int l):
    _finalize(false), follower_id(f), leader_id(l), client(&transport)
{
    pthread_mutex_init(&mutex, 0);

    pthread_cond_init(&cond, 0);
};

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

void LogDBManager::ReplicaThread::do_replication()
{
    std::string secret, error;

    Client::read_oneauth(secret, error);

    Nebula& nd       = Nebula::instance();
    ZonePool * zpool = nd.get_zonepool();
    LogDB * logdb    = nd.get_logdb();

    int zone_id = nd.get_zone_id();

    while ( _finalize == false )
    {
        pthread_mutex_lock(&mutex);

        while ( _pending_requests == false )
        {
            pthread_cond_wait(&cond,&mutex);

            if ( _finalize )
            {
                return;
            }
        }

        _pending_requests = false;

        pthread_mutex_unlock(&mutex);

        Zone * zone = zpool->get(zone_id, true);

        if ( zone == 0 )
        {
            continue;
        }

        ZoneServer * follower = zone->get_server(follower_id);
        ZoneServer * leader   = zone->get_server(leader_id);

        if ( leader == 0 || follower == 0 )
        {
            zone->unlock();

            continue;
        }

        std::string follower_edp = follower->vector_value("ENDPOINT");

        int id     = follower->get_next();
        int term   = leader->get_term();
        int commit = leader->get_commit();

        zone->unlock();

        LogDBRequest * lr = logdb->get_request(id);

        if ( lr == 0 )
        {
            ostringstream oss;

            oss << "Failed to load log entry at index: " << id;
            NebulaLog::log("DBM", Log::ERROR, oss);

            continue;
        }

        lr->lock();

        std::string sql = lr->sql();

        unsigned int prev_id   = lr->prev_index();
        unsigned int prev_term = lr->prev_term();

        lr->unlock();

        ostringstream oss;

        oss << "Replicating log entry " << id << "-" << term << " on server: "
            << follower_id << " (" << follower_edp <<")";

        NebulaLog::log("DBM", Log::DDEBUG, oss);

        xmlrpc_c::carriageParm_curl0 carriage(follower_edp);

        xmlrpc_c::paramList replica_params;

        replica_params.add(xmlrpc_c::value_string(secret));
        replica_params.add(xmlrpc_c::value_int(leader_id));
        replica_params.add(xmlrpc_c::value_int(commit));
        replica_params.add(xmlrpc_c::value_int(id));
        replica_params.add(xmlrpc_c::value_int(term));
        replica_params.add(xmlrpc_c::value_int(prev_id));
        replica_params.add(xmlrpc_c::value_int(prev_term));
        replica_params.add(xmlrpc_c::value_string(sql));

        xmlrpc_c::rpc rpc_client(replica_method, replica_params);

        try
        {
            rpc_client.call(&client, &carriage);

            if ( rpc_client.isSuccessful() )
            {
                xmlrpc_c::value result = rpc_client.getResult();

                vector<xmlrpc_c::value> values =
                    xmlrpc_c::value_array(result).vectorValueValue();

                bool success = xmlrpc_c::value_boolean(values[0]);

                if ( success )
                {
                    zone = zpool->get(zone_id, true);

                    if ( zone == 0 )
                    {
                        continue;
                    }

                    ZoneServer * follower = zone->get_server(follower_id);

                    if ( follower == 0 )
                    {
                        zone->unlock();

                        continue;
                    }

                    follower->inc_next();

                    follower->set_match(id);

                    zone->unlock();

                    LogDBRequest * lr = logdb->get_request(id);

                    if ( lr == 0 )
                    {
                        lr->lock();

                        lr->replicated();

                        lr->unlock();
                    }
                }
                else
                {
                    int follower_term = xmlrpc_c::value_boolean(values[1]);

                    if ( follower_term > term )
                    {
                        //Convert to follower
                        // - Update term
                        // - Set state to follower
                        // - Stop replica threads
                        ostringstream ess;

                        ess << "Detected a higher term on follower: "
                            << follower_id << " giving up leadership";

                        NebulaLog::log("DBM", Log::WARNING, ess);
                    }
                    else
                    {
                        //Log inconsistency in follower
                        // - Decrease follower index
                        // - Retry
                        ostringstream ess;

                        ess << "Log inconsistency detected on follower: "
                            << follower_id;

                        NebulaLog::log("DBM", Log::WARNING, ess);

                        zone = zpool->get(zone_id, true);

                        if ( zone == 0 )
                        {
                            continue;
                        }

                        ZoneServer * follower = zone->get_server(follower_id);

                        if ( follower == 0 )
                        {
                            zone->unlock();

                            continue;
                        }

                        follower->dec_next();

                        zone->unlock();

                        _pending_requests = true;
                    }
                }
            }
            else //RPC failed, will retry on next replication request
            {
                ostringstream ess;

                xmlrpc_c::fault failure = rpc_client.getFault();

                ess << "Error replicating log entry " << id << "-" << term
                    << " on follower " << follower_id << ": "
                    << failure.getDescription();

                NebulaLog::log("DBM", Log::ERROR, ess);
            }
        }
        catch (exception const& e)
        {
            ostringstream  ess;

            ess << "Error replicating log entry " << id << "-" << term
                << " on follower " << follower_id << ": " << e.what();

            NebulaLog::log("DBM", Log::ERROR, ess);

            continue;
        }
    }
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

void LogDBManager::ReplicaThread::finalize()
{
    pthread_mutex_lock(&mutex);

    _finalize = true;

    _pending_requests = false;

    pthread_cond_signal(&cond);

    pthread_mutex_unlock(&mutex);
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

void LogDBManager::ReplicaThread::add_request()
{
    pthread_mutex_lock(&mutex);

    _pending_requests = true;

    pthread_cond_signal(&cond);

    pthread_mutex_unlock(&mutex);
}
