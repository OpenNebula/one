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

#include "FedReplicaManager.h"
#include "ReplicaThread.h"
#include "Nebula.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const char * FedReplicaManager::table = "fed_logdb";

const char * FedReplicaManager::db_names = "log_index, sql";

const char * FedReplicaManager::db_bootstrap = "CREATE TABLE IF NOT EXISTS "
        "fed_logdb (log_index INTEGER PRIMARY KEY, sql MEDIUMTEXT)";

const time_t FedReplicaManager::xmlrpc_timeout_ms = 2000;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

FedReplicaManager::FedReplicaManager(time_t _t, time_t _p, SqlDB * d, long l):
    ReplicaManager(), timer_period(_t), purge_period(_t), logdb(d),
    log_retention(l)
{
    Nebula& nd       = Nebula::instance();
    ZonePool * zpool = nd.get_zonepool();

    std::vector<int> zone_ids;
    vector<int>::iterator it;

    std::map<int, std::string> zone_servers;

    am.addListener(this);

    if ( zpool->list_zones(zone_ids) != 0 )
    {
        return;
    }

    for ( it = zone_ids.begin() ; it != zone_ids.end(); ++it)
    {
        zpool->get_zone_servers(*it, zone_servers);

        ZoneServers * zs = new ZoneServers(*it, zone_servers);

        zones.insert(make_pair(*it, zs));

        zone_servers.clear();
    }

    get_last_index(last_index);

    start_replica_threads(zone_ids);

    pthread_mutex_init(&mutex, 0);
};

/* -------------------------------------------------------------------------- */

FedReplicaManager::~FedReplicaManager()
{
    std::map<int, ZoneServers *>::iterator it;

    for ( it = zones.begin() ; it != zones.end() ; ++it )
    {
        delete it->second;
    }

    zones.clear();
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int FedReplicaManager::replicate(const std::string& sql)
{
    pthread_mutex_lock(&mutex);

    if ( insert_log_record(last_index+1, sql) == 0 )
    {
        pthread_mutex_unlock(&mutex);
        return -1;
    }

    last_index++;

    pthread_mutex_unlock(&mutex);

    ReplicaManager::replicate();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int FedReplicaManager::apply_log_record(int index, const std::string& sql)
{
    int rc;

    pthread_mutex_lock(&mutex);

    if ( (unsigned int) index != last_index + 1 )
    {
        rc = last_index;

        pthread_mutex_unlock(&mutex);

        return rc;
    }

    if ( insert_log_record(last_index + 1, sql) == 0 )
    {
        pthread_mutex_unlock(&mutex);
        return -1;
    }

    last_index++;

    std::ostringstream oss(sql);

    rc = logdb->exec_wr(oss);

    pthread_mutex_unlock(&mutex);

    return rc;
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

    fedrm->am.loop(fedrm->timer_period);

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
/* -------------------------------------------------------------------------- */

void FedReplicaManager::add_zone(int zone_id)
{
    Nebula& nd       = Nebula::instance();
    ZonePool * zpool = nd.get_zonepool();

    std::map<int, std::string> zone_servers;

    zpool->get_zone_servers(zone_id, zone_servers);

    ZoneServers * zs = new ZoneServers(zone_id, zone_servers);

    pthread_mutex_lock(&mutex);

    zones.insert(make_pair(zone_id, zs));

    pthread_mutex_unlock(&mutex);

    add_replica_thread(zone_id);
}

/* -------------------------------------------------------------------------- */

void FedReplicaManager::delete_zone(int zone_id)
{
    std::map<int, ZoneServers *>::iterator it;

    pthread_mutex_lock(&mutex);

    it = zones.find(zone_id);

    if ( it == zones.end() )
    {
        return;
    }

    delete it->second;

    zones.erase(it);

    pthread_mutex_unlock(&mutex);

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

void FedReplicaManager::timer_action(const ActionRequest& ar)
{
    static int mark_tics  = 0;
    static int purge_tics = 0;

    mark_tics++;
    purge_tics++;

    // Thread heartbeat
    if ( (mark_tics * timer_period) >= 600 )
    {
        NebulaLog::log("FRM",Log::INFO,"--Mark--");
        mark_tics = 0;
    }

    // Database housekeeping
    if ( (purge_tics * timer_period) >= purge_period )
    {
        NebulaLog::log("FRM", Log::INFO, "Purging federated log");

        std::ostringstream oss;

        pthread_mutex_lock(&mutex);

        // keep the last "log_retention" records
        oss << "DELETE FROM fed_logdb WHERE log_index NOT IN (SELECT "
            << "log_index FROM fed_logdb ORDER BY log_index DESC LIMIT "
            << log_retention <<")";

        logdb->exec_wr(oss);

        pthread_mutex_unlock(&mutex);

        purge_tics = 0;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int FedReplicaManager::get_log_record(int index, std::string& sql)
{
    ostringstream oss;

    single_cb<std::string> cb;

    oss << "SELECT sql FROM fed_logdb WHERE log_index = " << index;

    cb.set_callback(&sql);

    int rc = logdb->exec_rd(oss, &cb);

    cb.unset_callback();

    return rc;
}

/* -------------------------------------------------------------------------- */

int FedReplicaManager::insert_log_record(int index, const std::string& sql)
{
    std::ostringstream oss;

    char * sql_db = logdb->escape_str(sql.c_str());

    if ( sql_db == 0 )
    {
        return -1;
    }

    oss << "REPLACE INTO " << table << " ("<< db_names <<") VALUES "
        << "(" << index  << ",'" << sql_db << "'), "
        << "(" << -1 << "," << index << ")";

    return logdb->exec_wr(oss);
}

/* -------------------------------------------------------------------------- */

int FedReplicaManager::get_last_index(unsigned int& index)
{
    ostringstream oss;

    single_cb<unsigned int> cb;

    oss << "SELECT sql FROM fed_logdb WHERE log_index = -1";

    cb.set_callback(&index);

    int rc = logdb->exec_rd(oss, &cb);

    cb.unset_callback();

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

