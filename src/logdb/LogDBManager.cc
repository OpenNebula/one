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
    NebulaLog::log("DBM",Log::INFO,"Stopping LogDB Manager...");
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

    ZoneServers * servers = zone->get_servers();
    ZoneServer *  this_server = servers->get_server(this_id);

    if ( this_server == 0 )
    {
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
        ReplicaThread * rthread = new ReplicaThread(*it, this_server);

        thread_pool.insert(std::make_pair(id, rthread));

        pthread_attr_init (&pattr);
        pthread_attr_setdetachstate(&pattr, PTHREAD_CREATE_JOINABLE);

        oss << "Starting replication thread for server " << id;

        NebulaLog::log("DBM", Log::INFO, oss);

        pthread_create(rthread->thread_id(), &pattr, replication_thread,
                (void *) rthread);
    }

    zone->unlock();
};


void LogDBManager::stop_action()
{
    std::map<int, ReplicaThread *>::iterator it;

    for ( it = thread_pool.begin() ; it != thread_pool.end() ; ++it )
    {
        it->second->finalize();

        pthread_join(*(it->second->thread_id()), 0);

        delete it->second;
    }

    thread_pool.clear();
};

void LogDBManager::replicate_action()
{

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

LogDBManager::ReplicaThread::ReplicaThread(ZoneServer * z, ZoneServer *l):
    _finalize(false), server(z), leader(l), client(&transport)
{
    pthread_mutex_init(&mutex, 0);

    pthread_cond_init(&cond, 0);
};

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
//
void LogDBManager::ReplicaThread::do_replication()
{
    std::string server_endpoint = server->vector_value("ENDPOINT");

    std::string secret, error;

    Client::read_oneauth(secret, error);

    while ( _finalize == false )
    {
        pthread_mutex_lock(&mutex);

        if ( _finalize )
        {
            return;
        }

        int next = server->get_next();
/*
        LogDBRequest

        xmlrpc_c::carriageParm_curl0 carriage(server_endpoint);

        xmlrpc_c::paramList replica_params;

        replica_params.add(xmlrpc_c::value_string(secret));
        replica_params.add(xmlrpc_c::value_int(leader->term()));
        replica_params.add(xmlrpc_c::value_int(secret));
        replica_params.add(xmlrpc_c::value_string(secret));



            client->call("one.vm.deploy", // methodName
                         "iibi",          // arguments format
                         &deploy_result,  // resultP
                         vid,             // argument 1 (VM)
                         hid,             // argument 2 (HOST)
                         false,           // argument 3 (ENFORCE)
                         dsid);           // argument 5 (SYSTEM SD)

    sampleAddParms.add(xmlrpc_c::value_int(5));
    sampleAddParms.add(xmlrpc_c::value_int(7));

    xmlrpc_c::rpcPtr myRpcP(methodName, sampleAddParms);

    string const serverUrl("http://localhost:8080/RPC2");
    */
        pthread_mutex_unlock(&mutex);
    }
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

void LogDBManager::ReplicaThread::finalize()
{
    pthread_mutex_lock(&mutex);

    _finalize = true;

    pthread_cond_signal(&cond);

    pthread_mutex_unlock(&mutex);
}
