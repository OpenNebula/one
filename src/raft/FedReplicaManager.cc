/* -------------------------------------------------------------------------- */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                */
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

#include "FedReplicaManager.h"
#include "ReplicaThread.h"
#include "Nebula.h"
#include "Client.h"
#include "ZonePool.h"
#include "LogDB.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const time_t FedReplicaManager::rpc_timeout_ms = 10000;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

FedReplicaManager::FedReplicaManager(LogDB * d): ReplicaManager(), logdb(d)
{
}

/* -------------------------------------------------------------------------- */

FedReplicaManager::~FedReplicaManager()
{
    Nebula& nd = Nebula::instance();

    for ( auto it = zones.begin() ; it != zones.end() ; ++it )
    {
        delete it->second;
    }

    zones.clear();

    if ( nd.is_federation_master() )
    {
        stop_replica_threads();
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

uint64_t FedReplicaManager::apply_log_record(uint64_t index, uint64_t prev,
                                             const std::string& sql)
{
    lock_guard<mutex> ul(fed_mutex);

    uint64_t last_index = logdb->last_federated();

    if ( prev != last_index )
    {
        return last_index;
    }

    std::ostringstream oss(sql);

    if ( logdb->exec_federated_wr(oss, index) != 0 )
    {
        return UINT64_MAX;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void FedReplicaManager::update_zones(std::vector<int>& zone_ids)
{
    Nebula& nd       = Nebula::instance();
    ZonePool * zpool = nd.get_zonepool();

    int zone_id = nd.get_zone_id();

    if ( zpool->list(zone_ids) != 0 )
    {
        return;
    }

    lock_guard<mutex> ul(fed_mutex);

    uint64_t last_index = logdb->last_federated();

    zones.clear();

    for (auto it = zone_ids.begin() ; it != zone_ids.end(); )
    {
        if ( *it == zone_id )
        {
            it = zone_ids.erase(it);
        }
        else
        {
            if ( auto zone = zpool->get(*it) )
            {
                std::string zedp;

                // Prefer grpc over xml-rpc
                zone->get_template_attribute("ENDPOINT_GRPC", zedp);

                if ( zedp.empty() )
                {
                    zone->get_template_attribute("ENDPOINT", zedp);
                }

                ZoneServers * zs = new ZoneServers(*it, last_index, zedp);

                zones.insert(make_pair(*it, zs));

                ++it;
            }
            else
            {
                it = zone_ids.erase(it);
            }
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void FedReplicaManager::add_zone(int zone_id)
{
    std::ostringstream oss;

    std::string zedp;

    Nebula& nd       = Nebula::instance();
    ZonePool * zpool = nd.get_zonepool();

    if (auto zone = zpool->get_ro(zone_id))
    {
        // Prefer grpc over xml-rpc
        zone->get_template_attribute("ENDPOINT_GRPC", zedp);

        if ( zedp.empty() )
        {
            zone->get_template_attribute("ENDPOINT", zedp);
        }
    }
    else
    {
        return;
    }

    lock_guard<mutex> ul(fed_mutex);

    int last_index = logdb->last_federated();

    ZoneServers * zs = new ZoneServers(zone_id, last_index, zedp);

    zones.insert(make_pair(zone_id, zs));

    oss << "Starting federation replication thread for slave: " << zone_id;

    NebulaLog::log("FRM", Log::INFO, oss);

    add_replica_thread(zone_id);
}

/* -------------------------------------------------------------------------- */

void FedReplicaManager::delete_zone(int zone_id)
{
    std::ostringstream oss;

    lock_guard<mutex> ul(fed_mutex);

    auto it = zones.find(zone_id);

    if ( it == zones.end() )
    {
        return;
    }

    delete it->second;

    zones.erase(it);

    oss << "Stopping replication thread for slave: " << zone_id;

    NebulaLog::log("FRM", Log::INFO, oss);

    delete_replica_thread(zone_id);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

ReplicaThread * FedReplicaManager::thread_factory(int zone_id)
{
    return new FedReplicaThread(zone_id);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int FedReplicaManager::get_next_record(int zone_id, std::string& zedp,
                                       LogDBRecord& lr, std::string& error)
{
    lock_guard<mutex> ul(fed_mutex);

    auto it = zones.find(zone_id);

    if ( it == zones.end() )
    {
        return -1;
    }

    ZoneServers * zs = it->second;

    zedp  = zs->endpoint;

    //Initialize next index for the zone
    if ( zs->next == UINT64_MAX )
    {
        zs->next= logdb->last_federated();
    }

    //Update the next index for zone if already reaplicated
    if ( zs->last == zs->next )
    {
        zs->next = logdb->next_federated(zs->next);
    }

    if ( zs->next == UINT64_MAX ) //no new records
    {
        return -2;
    }

    uint64_t prev_index = logdb->previous_federated(zs->next);

    if ( prev_index == UINT64_MAX )
    {
        std::ostringstream oss;

        oss << "Missing federation record previous to: " << zs->next;

        error = oss.str();

        return -1;
    }

    int rc = logdb->get_log_record(zs->next, prev_index, lr);

    if ( rc == -1 )
    {
        std::ostringstream oss;

        oss << "Failed to load federation log record " << zs->next
            << " for zone " << zs->zone_id;

        error = oss.str();
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void FedReplicaManager::replicate_success(int zone_id)
{
    lock_guard<mutex> ul(fed_mutex);

    auto it = zones.find(zone_id);

    if ( it == zones.end() )
    {
        return;
    }

    ZoneServers * zs = it->second;

    zs->last = zs->next;

    zs->next = logdb->next_federated(zs->next);

    if ( zs->next != UINT64_MAX )
    {
        ReplicaManager::replicate(zone_id);
    }
}

/* -------------------------------------------------------------------------- */

void FedReplicaManager::replicate_failure(int zone_id, uint64_t last_zone)
{
    lock_guard<mutex> ul(fed_mutex);

    auto it = zones.find(zone_id);

    if ( it != zones.end() )
    {
        ZoneServers * zs = it->second;

        if ( last_zone != UINT64_MAX )
        {
            zs->last = last_zone;

            zs->next = logdb->next_federated(zs->last);
        }

        if ( zs->next != UINT64_MAX )
        {
            ReplicaManager::replicate(zone_id);
        }
    }
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int FedReplicaManager::rpc_replicate_log(int zone_id, bool& success,
                                         uint64_t& last, std::string& error)
{
    std::string zedp;

    LogDBRecord lr;

    int rc = get_next_record(zone_id, zedp, lr, error);

    if ( rc != 0 )
    {
        return rc;
    }

    uint64_t prev_index = logdb->previous_federated(lr.index);

    rc = Client::fed_replicate(zedp, lr.index, prev_index, lr.sql, rpc_timeout_ms, success, last, error);

    if ( rc != 0)
    {
        std::ostringstream ess;

        ess << "Error replicating log entry " << lr.index << " on zone "
            << zone_id << " (" << zedp << "): " << error;

        NebulaLog::log("FRM", Log::ERROR, ess);

        error = ess.str();
    }

    return rc;
}

