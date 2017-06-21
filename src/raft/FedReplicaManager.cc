/* -------------------------------------------------------------------------- */
/* Copyright 2002-2017, OpenNebula Project, OpenNebula Systems                */
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

const char * FedReplicaManager::table = "fed_logdb";

const char * FedReplicaManager::db_names = "log_index, sqlcmd";

const char * FedReplicaManager::db_bootstrap = "CREATE TABLE IF NOT EXISTS "
        "fed_logdb (log_index INTEGER PRIMARY KEY, sqlcmd MEDIUMTEXT)";

const time_t FedReplicaManager::xmlrpc_timeout_ms = 10000;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

FedReplicaManager::FedReplicaManager(time_t _t, time_t _p, SqlDB * d,
    unsigned int l): ReplicaManager(), timer_period(_t), purge_period(_p),
    last_index(-1), logdb(d), log_retention(l)
{
    pthread_mutex_init(&mutex, 0);

    am.addListener(this);

    get_last_index(last_index);
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

int FedReplicaManager::replicate(const std::string& sql)
{
    pthread_mutex_lock(&mutex);

    if ( insert_log_record(last_index+1, sql) != 0 )
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

    if ( insert_log_record(last_index + 1, sql) != 0 )
    {
        pthread_mutex_unlock(&mutex);
        return -1;
    }

    last_index++;

    std::ostringstream oss(sql);

    logdb->exec_wr(oss);

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

    std::map<int, std::string> zone_servers;

    int zone_id = nd.get_zone_id();

    if ( zpool->list_zones(zone_ids) != 0 )
    {
        return;
    }

    pthread_mutex_lock(&mutex);

    zones.clear();

    for (it = zone_ids.begin() ; it != zone_ids.end(); )
    {
        if ( *it == zone_id )
        {
            it = zone_ids.erase(it);
        }
        else
        {
            zpool->get_zone_servers(*it, zone_servers);

            ZoneServers * zs = new ZoneServers(*it, last_index, zone_servers);

            zones.insert(make_pair(*it, zs));

            zone_servers.clear();

            ++it;
        }
    }

    pthread_mutex_unlock(&mutex);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void FedReplicaManager::add_zone(int zone_id)
{
    std::ostringstream oss;

    Nebula& nd       = Nebula::instance();
    ZonePool * zpool = nd.get_zonepool();

    std::map<int, std::string> zone_servers;

    zpool->get_zone_servers(zone_id, zone_servers);

    pthread_mutex_lock(&mutex);

    ZoneServers * zs = new ZoneServers(zone_id, last_index, zone_servers);

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
        Nebula& nd          = Nebula::instance();
        RaftManager * raftm = nd.get_raftm();

        if ( raftm->is_leader() || raftm->is_solo() )
        {
            NebulaLog::log("FRM", Log::INFO, "Purging federated log");

            std::ostringstream oss;

            pthread_mutex_lock(&mutex);

            if ( last_index > log_retention )
            {
                unsigned int delete_index = last_index - log_retention;

                // keep the last "log_retention" records
                oss << "DELETE FROM fed_logdb WHERE log_index >= 0 AND "
                    << "log_index < " << delete_index;

                logdb->exec_wr(oss);
            }

            pthread_mutex_unlock(&mutex);
        }

        purge_tics = 0;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int FedReplicaManager::get_next_record(int zone_id, int& index, std::string& sql,
        std::map<int, std::string>& zservers)
{
    pthread_mutex_lock(&mutex);

    std::map<int, ZoneServers *>::iterator it = zones.find(zone_id);

    if ( it == zones.end() )
    {
        pthread_mutex_unlock(&mutex);
        return -1;
    }

    index    = it->second->next;
    zservers = it->second->servers;

    int rc   = get_log_record(index, sql);

    pthread_mutex_unlock(&mutex);

    return rc;
}

/* -------------------------------------------------------------------------- */

int FedReplicaManager::get_log_record(int index, std::string& sql)
{
    ostringstream oss;

    single_cb<std::string> cb;

    oss << "SELECT sqlcmd FROM fed_logdb WHERE log_index = " << index;

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

    oss << "SELECT sqlcmd FROM fed_logdb WHERE log_index = -1";

    cb.set_callback(&index);

    int rc = logdb->exec_rd(oss, &cb);

    cb.unset_callback();

    return rc;
}

/* -------------------------------------------------------------------------- */

int FedReplicaManager::bootstrap(SqlDB *_db)
{
    int rc;

    std::ostringstream oss(db_bootstrap);

    rc = _db->exec_local_wr(oss);

    oss.str("");

    oss << "REPLACE INTO " << table << " ("<< db_names <<") VALUES (-1,-1)";

    rc += _db->exec_local_wr(oss);

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

    zs->next++;

    if ( last_index >= zs->next )
    {
        ReplicaManager::replicate(zone_id);
    }

    pthread_mutex_unlock(&mutex);
}

/* -------------------------------------------------------------------------- */

void FedReplicaManager::replicate_failure(int zone_id, int last_zone)
{
    pthread_mutex_lock(&mutex);

    std::map<int, ZoneServers *>::iterator it = zones.find(zone_id);

    if ( it != zones.end() )
    {
        ZoneServers * zs = it->second;

        if ( last_zone >= 0 )
        {
            zs->next = last_zone + 1;
        }
    }

    ReplicaManager::replicate(zone_id);

    pthread_mutex_unlock(&mutex);
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int FedReplicaManager::xmlrpc_replicate_log(int zone_id, bool& success,
        int& last, std::string& error)
{
    static const std::string replica_method = "one.zone.fedreplicate";

    int index;
    std::string sql, secret;

    std::map<int, std::string> zservers;
    std::map<int, std::string>::iterator it;

	int xml_rc = 0;

    if ( get_next_record(zone_id, index, sql, zservers) != 0 )
    {
        error = "Failed to load federation log record";
        return -1;
    }

    // -------------------------------------------------------------------------
    // Get parameters to call append entries on follower
    // -------------------------------------------------------------------------
    if ( Client::read_oneauth(secret, error) == -1 )
    {
        return -1;
    }

    xmlrpc_c::value result;
    xmlrpc_c::paramList replica_params;

    replica_params.add(xmlrpc_c::value_string(secret));
    replica_params.add(xmlrpc_c::value_int(index));
    replica_params.add(xmlrpc_c::value_string(sql));

    // -------------------------------------------------------------------------
    // Do the XML-RPC call
    // -------------------------------------------------------------------------
    for (it=zservers.begin(); it != zservers.end(); ++it)
    {
        xml_rc = Client::client()->call(it->second, replica_method,
            replica_params, xmlrpc_timeout_ms, &result, error);

        if ( xml_rc == 0 )
        {
            vector<xmlrpc_c::value> values;

            values  = xmlrpc_c::value_array(result).vectorValueValue();
            success = xmlrpc_c::value_boolean(values[0]);

            if ( success ) //values[2] = error code (string)
            {
                last = xmlrpc_c::value_int(values[1]);
            }
            else
            {
                error = xmlrpc_c::value_string(values[1]);
                last  = xmlrpc_c::value_int(values[3]);
            }

            break;
        }
        else
        {
            std::ostringstream ess;

            ess << "Error replicating log entry " << index << " on zone server "
                << it->second << ": " << error;

            NebulaLog::log("FRM", Log::ERROR, error);

            error = ess.str();
        }
    }

    return xml_rc;
}
