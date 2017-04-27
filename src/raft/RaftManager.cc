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

#include "RaftManager.h"
#include "Nebula.h"
#include "ZoneServer.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" void * raft_manager_loop(void *arg)
{
    RaftManager * raftm;

    if ( arg == 0 )
    {
        return 0;
    }

    raftm = static_cast<RaftManager *>(arg);

    NebulaLog::log("RCM",Log::INFO,"Raft Consensus Manager started.");

    raftm->am.loop();

    NebulaLog::log("RCM",Log::INFO,"Raft Consensus Manager stopped.");

    return 0;
}

/* -------------------------------------------------------------------------- */

int RaftManager::start()
{
    int               rc;
    pthread_attr_t    pattr;

    pthread_attr_init (&pattr);
    pthread_attr_setdetachstate (&pattr, PTHREAD_CREATE_JOINABLE);

    NebulaLog::log("RCM",Log::INFO,"Starting Raft Consensus Manager...");

    rc = pthread_create(&raft_thread, &pattr, raft_manager_loop,(void *) this);

    return rc;
}

/* -------------------------------------------------------------------------- */

void RaftManager::user_action(const ActionRequest& ar)
{
    const RaftAction& ra = static_cast<const RaftAction& >(ar);

    switch(ra.action())
    {
        case RaftAction::LEADER:
            leader_action(ra);
            break;

        case RaftAction::FOLLOWER:
            follower_action(ra);
            break;

        case RaftAction::REPLICATE_LOG:
            replicate_log_action(ra);
            break;

        case RaftAction::REPLICATE_SUCCESS:
            replicate_success_action(ra);
            break;

        case RaftAction::REPLICATE_FAILURE:
            replicate_failure_action(ra);
            break;
    }
}

/* -------------------------------------------------------------------------- */

void RaftManager::finalize_action(const ActionRequest& ar)
{
    NebulaLog::log("RCM", Log::INFO, "Raft Consensus Manager...");
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RaftManager::leader_action(const RaftAction& ra)
{
    Nebula& nd       = Nebula::instance();
    LogDB * logdb    = nd.get_logdb();
    ZonePool * zpool = nd.get_zonepool();

    int index, _applied;

    int this_id = nd.get_server_id();
    int zone_id = nd.get_zone_id();

    std::ostringstream oss;

    pthread_mutex_lock(&mutex);

    if ( state != FOLLOWER )
    {
        pthread_mutex_unlock(&mutex);
        return;
    }

    pthread_mutex_unlock(&mutex);

    NebulaLog::log("RCM", Log::INFO, "Becoming leader of zone");

    //--------------------------------------------------------------------------
    // Initialize leader variables
    //   - term
    //   - state
    //   - last applied index
    //   - commit index
    //   - next and match index for all servers
    //--------------------------------------------------------------------------
    logdb->setup_index(_applied, index);

    oss << "Becoming leader of zone. Last log record: " << index << " last "
        << "applied record: " << _applied;

    Zone * zone = zpool->get(zone_id, true);

    if ( zone == 0 )
    {
        std::ostringstream oss;

        oss << "leader: zone " << zone_id << "does not exist.";

        NebulaLog::log("RCM", Log::ERROR, oss);
        return;
    }

    pthread_mutex_lock(&mutex);

    ZoneServers * fllw = zone->get_servers();

    for (ZoneServers::zone_iterator it = fllw->begin(); it != fllw->end(); ++it)
    {
        int id = (*it)->get_id();

        if ( id == this_id )
        {
            continue;
        }

        next.insert(make_pair<unsigned int, unsigned int>(id, index + 1));

        match.insert(make_pair<unsigned int, unsigned int>(id, 0));
    }

    zone->unlock();

    applied = _applied;

    commit  = _applied;

    state = LEADER;

    term  = ra.id();

    pthread_mutex_unlock(&mutex);

    replica_manager.start_replica_threads();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RaftManager::follower_action(const RaftAction& ra)
{
    replica_manager.stop_replica_threads();

    pthread_mutex_lock(&mutex);

    state = FOLLOWER;

    term  = ra.id();

    pthread_mutex_unlock(&mutex);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RaftManager::replicate_log_action(const RaftAction& ra)
{
    pthread_mutex_lock(&mutex);

    if ( state != LEADER )
    {
        pthread_mutex_unlock(&mutex);
        return;
    }

    ReplicaRequest * request = ra.request();

    requests.insert(std::make_pair(request->index(), request));

    pthread_mutex_unlock(&mutex);

    replica_manager.replicate();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RaftManager::replicate_success_action(const RaftAction& ra)
{

}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RaftManager::replicate_failure_action(const RaftAction& ra)
{

}
