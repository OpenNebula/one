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

void RaftManager::user_action(const ActionRequest& ar)
{
    const RaftAction& la = static_cast<const RaftAction& >(ar);

    switch(la.action())
    {
        case RaftAction::LEADER:
            leader_action();
            break;

        case RaftAction::FOLLOWER:
            follower_action();
            break;
    }
}

void RaftManager::finalize_action(const ActionRequest& ar)
{
    NebulaLog::log("RCM", Log::INFO, "Raft Consensus Manager...");
}

void RaftManager::leader_action()
{
    Nebula& nd       = Nebula::instance();
    ZonePool * zpool = nd.get_zonepool();

    int this_id = nd.get_server_id();
    int zone_id = nd.get_zone_id();

    NebulaLog::log("RCM", Log::INFO, "Becoming leader of zone");

    Zone * zone = zpool->get(zone_id, true);

    if ( zone == 0 )
    {
        std::ostringstream oss;

        oss << "leader: zone " << zone_id << "does not exist.";

        NebulaLog::log("RCM", Log::ERROR, oss);
        return;
    }

    ZoneServers * servers     = zone->get_servers();
    ZoneServer *  this_server = servers->get_server(this_id);

    this_server->set_state(ZoneServer::LEADER);

    this_server->logdbm_start();

    zone->unlock();
}

void RaftManager::follower_action()
{

}

