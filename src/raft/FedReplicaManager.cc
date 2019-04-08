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

#include "FedReplicaManager.h"
#include "ReplicaThread.h"
#include "Nebula.h"
#include "Client.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const time_t FedReplicaManager::xmlrpc_timeout_ms = 10000;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

FedReplicaManager::FedReplicaManager(LogDB * d): ReplicaManager(), logdb(d)
{
    pthread_mutex_init(&mutex, 0);

    am.addListener(this);
};

/* -------------------------------------------------------------------------- */

FedReplicaManager::~FedReplicaManager()
{
    Nebula& nd = Nebula::instance();

    std::map<int, ZoneServers *>::iterator it;

    for ( it = zones.begin() ; it != zones.end() ; ++it )
    {
        delete it->second;
    }

    zones.clear();

    if ( nd.is_federation_master() )
    {
        stop_replica_threads();
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

uint64_t FedReplicaManager::apply_log_record(uint64_t index, uint64_t prev,
        const std::string& sql)
{
    uint64_t rc;

    pthread_mutex_lock(&mutex);

    uint64_t last_index = logdb->last_federated();

    if ( prev != last_index )
    {
        rc = last_index;

        pthread_mutex_unlock(&mutex);
        return rc;
    }

    std::ostringstream oss(sql);

    if ( logdb->exec_federated_wr(oss, index) != 0 )
    {
        pthread_mutex_unlock(&mutex);
        return UINT64_MAX;
    }

    pthread_mutex_unlock(&mutex);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" void * frm_loop(void *arg)
{
    FedReplicaManager * fedrm;

    if ( arg == 0 )
    {
        return 0;
    }

    fedrm = static_cast<FedReplicaManager *>(arg);

    NebulaLog::log("FRM",Log::INFO,"Federation Replica Manger started.");

    fedrm->am.loop();

    NebulaLog::log("FRM",Log::INFO,"Federation Replica Manger stopped.");

    return 0;
}

/* -------------------------------------------------------------------------- */

int FedReplicaManager::start()
{
    int               rc;
    pthread_attr_t    pattr;

    pthread_attr_init (&pattr);
    pthread_attr_setdetachstate (&pattr, PTHREAD_CREATE_JOINABLE);

    NebulaLog::log("FRM",Log::INFO,"Starting Federation Replica Manager...");

    rc = pthread_create(&frm_thread, &pattr, frm_loop,(void *) this);

    return rc;
}

/* -------------------------------------------------------------------------- */

void FedReplicaManager::finalize_action(const ActionRequest& ar)
{
    NebulaLog::log("FRM", Log::INFO, "Federation Replica Manager...");
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void FedReplicaManager::update_zones(std::vector<int>& zone_ids)
{
    Nebula& nd       = Nebula::instance();
    ZonePool * zpool = nd.get_zonepool();

    vector<int>::iterator it;

    int zone_id = nd.get_zone_id();

    if ( zpool->list_zones(zone_ids) != 0 )
    {
        return;
    }

    pthread_mutex_lock(&mutex);

    uint64_t last_index = logdb->last_federated();

    zones.clear();

    for (it = zone_ids.begin() ; it != zone_ids.end(); )
    {
        if ( *it == zone_id )
        {
            it = zone_ids.erase(it);
        }
        else
        {
            Zone * zone = zpool->get(*it);

            if ( zone == 0 )
            {
                it = zone_ids.erase(it);
            }
            else
            {
                std::string zedp;

                zone->get_template_attribute("ENDPOINT", zedp);

                zone->unlock();

                ZoneServers * zs = new ZoneServers(*it, last_index, zedp);

                zones.insert(make_pair(*it, zs));

                ++it;
            }
        }
    }

    pthread_mutex_unlock(&mutex);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void FedReplicaManager::add_zone(int zone_id)
{
    std::ostringstream oss;

    std::string zedp;

    Nebula& nd       = Nebula::instance();
    ZonePool * zpool = nd.get_zonepool();

    Zone * zone = zpool->get(zone_id);

    if ( zone == 0 )
    {
        return;
    }

    zone->get_template_attribute("ENDPOINT", zedp);

    zone->unlock();

    pthread_mutex_lock(&mutex);

    int last_index = logdb->last_federated();

    ZoneServers * zs = new ZoneServers(zone_id, last_index, zedp);

    zones.insert(make_pair(zone_id, zs));

    oss << "Starting federation replication thread for slave: " << zone_id;

    NebulaLog::log("FRM", Log::INFO, oss);

    add_replica_thread(zone_id);

    pthread_mutex_unlock(&mutex);
}

/* -------------------------------------------------------------------------- */

void FedReplicaManager::delete_zone(int zone_id)
{
    std::ostringstream oss;

    std::map<int, ZoneServers *>::iterator it;

    pthread_mutex_lock(&mutex);

    it = zones.find(zone_id);

    if ( it == zones.end() )
    {
        return;
    }

    delete it->second;

    zones.erase(it);

    oss << "Stopping replication thread for slave: " << zone_id;

    NebulaLog::log("FRM", Log::INFO, oss);

    delete_replica_thread(zone_id);

    pthread_mutex_unlock(&mutex);
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
    pthread_mutex_lock(&mutex);

    std::map<int, ZoneServers *>::iterator it = zones.find(zone_id);

    if ( it == zones.end() )
    {
        pthread_mutex_unlock(&mutex);
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

        if ( zs->next == UINT64_MAX ) //no new records
        {
            pthread_mutex_unlock(&mutex);
            return -2;
        }
    }

    int rc = logdb->get_log_record(zs->next, lr);

    if ( rc == -1 )
    {
        std::ostringstream oss;

        oss << "Failed to load federation log record " << zs->next
            << " for zone " << zs->zone_id;

        error = oss.str();
    }

    pthread_mutex_unlock(&mutex);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void FedReplicaManager::replicate_success(int zone_id)
{
    pthread_mutex_lock(&mutex);

    std::map<int, ZoneServers *>::iterator it = zones.find(zone_id);

    if ( it == zones.end() )
    {
        pthread_mutex_unlock(&mutex);
        return;
    }

    ZoneServers * zs = it->second;

    zs->last = zs->next;

    zs->next = logdb->next_federated(zs->next);

    if ( zs->next != UINT64_MAX )
    {
        ReplicaManager::replicate(zone_id);
    }

    pthread_mutex_unlock(&mutex);
}

/* -------------------------------------------------------------------------- */

void FedReplicaManager::replicate_failure(int zone_id, uint64_t last_zone)
{
    pthread_mutex_lock(&mutex);

    std::map<int, ZoneServers *>::iterator it = zones.find(zone_id);

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

    pthread_mutex_unlock(&mutex);
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int FedReplicaManager::xmlrpc_replicate_log(int zone_id, bool& success,
        uint64_t& last, std::string& error)
{
    static const std::string replica_method = "one.zone.fedreplicate";

    std::string zedp, xmlrpc_secret;

	int xml_rc = 0;

    LogDBRecord lr;

    int rc = get_next_record(zone_id, zedp, lr, error);

    if ( rc != 0 )
    {
        return rc;
    }

    uint64_t prev_index = logdb->previous_federated(lr.index);

    // -------------------------------------------------------------------------
    // Get parameters to call append entries on follower
    // -------------------------------------------------------------------------
    xmlrpc_c::value result;
    xmlrpc_c::paramList replica_params;

    if ( Client::read_oneauth(xmlrpc_secret, error) == -1 )
    {
        return -1;
    }

    replica_params.add(xmlrpc_c::value_string(xmlrpc_secret));
    replica_params.add(xmlrpc_c::value_i8(lr.index));
    replica_params.add(xmlrpc_c::value_i8(prev_index));
    replica_params.add(xmlrpc_c::value_string(lr.sql));

    // -------------------------------------------------------------------------
    // Do the XML-RPC call
    // -------------------------------------------------------------------------
    xml_rc = Client::client()->call(zedp, replica_method, replica_params,
        xmlrpc_timeout_ms, &result, error);

    if ( xml_rc == 0 )
    {
        vector<xmlrpc_c::value> values;

        values  = xmlrpc_c::value_array(result).vectorValueValue();
        success = xmlrpc_c::value_boolean(values[0]);

        if ( success ) //values[2] = error code (string)
        {
            last = xmlrpc_c::value_i8(values[1]);
        }
        else
        {
            error = xmlrpc_c::value_string(values[1]);
            last  = xmlrpc_c::value_i8(values[3]);
        }
    }
    else
    {
        std::ostringstream ess;

        ess << "Error replicating log entry " << lr.index << " on zone "
            << zone_id << " (" << zedp << "): " << error;

        NebulaLog::log("FRM", Log::ERROR, ess);

        error = ess.str();
    }

    return xml_rc;
}
