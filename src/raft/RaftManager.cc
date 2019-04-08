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

#include "Nebula.h"

#include "RaftManager.h"
#include "FedReplicaManager.h"
#include "ZoneServer.h"
#include "Client.h"

#include <cstdlib>

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
const time_t RaftManager::timer_period_ms = 50;

const string RaftManager::raft_state_name = "RAFT_STATE";

static void set_timeout(long long ms, struct timespec& timeout)
{
    std::lldiv_t d;

    d = std::div(ms, (long long) 1000);

    timeout.tv_sec  = d.quot;
    timeout.tv_nsec = d.rem * 1000000;
}

static unsigned int get_zone_servers(std::map<int, std::string>& _s);

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* RaftManager component life-cycle functions                                 */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

RaftManager::RaftManager(int id, const VectorAttribute * leader_hook_mad,
        const VectorAttribute * follower_hook_mad, time_t log_purge,
        long long bcast, long long elect, time_t xmlrpc,
        const string& remotes_location):server_id(id), term(0), num_servers(0),
        reconciling(false), commit(0), leader_hook(0), follower_hook(0)
{
    Nebula& nd    = Nebula::instance();
    LogDB * logdb = nd.get_logdb();

    std::string raft_xml, cmd, arg;

	pthread_mutex_init(&mutex, 0);

	am.addListener(this);

    // -------------------------------------------------------------------------
    // Initialize Raft variables:
    //   - state
    //   - servers
    //   - votedfor
    //   - term
    // -------------------------------------------------------------------------

    if ( logdb->get_raft_state(raft_state_name, raft_xml) != 0 )
    {
        std::ostringstream bsr;

        bsr << "<MESSAGE>bootstrap state</MESSAGE>";

        init_raft_state(bsr.str());

        raft_state.replace("TERM", 0);
        raft_state.replace("VOTEDFOR", -1);

        raft_state.to_xml(raft_xml);

        logdb->update_raft_state(raft_state_name, raft_xml);

        votedfor = -1;
        term     = 0;
    }
    else
    {
        raft_state.from_xml(raft_xml);

        raft_state.get("TERM", term);
        raft_state.get("VOTEDFOR", votedfor);
    }

    leader_id = -1;

    num_servers = get_zone_servers(servers);

	if ( server_id == -1 )
	{
        NebulaLog::log("ONE", Log::INFO, "oned started in solo mode.");
		state = SOLO;
	}
	else
	{
        NebulaLog::log("RCM", Log::INFO, "oned started in follower mode");
		state = FOLLOWER;
	}

    // -------------------------------------------------------------------------
    // Initialize Raft timers
    // -------------------------------------------------------------------------

    purge_period_ms   = log_purge * 1000;
    xmlrpc_timeout_ms = xmlrpc;

    set_timeout(bcast, broadcast_timeout);
    set_timeout(elect, election_timeout);

    // 5 seconds warm-up to start election
    clock_gettime(CLOCK_REALTIME, &last_heartbeat);
    last_heartbeat.tv_sec += 5;

    // -------------------------------------------------------------------------
    // Initialize Hooks
    // -------------------------------------------------------------------------

    if ( leader_hook_mad != 0 )
    {
        cmd = leader_hook_mad->vector_value("COMMAND");
        arg = leader_hook_mad->vector_value("ARGUMENTS");

        if ( cmd.empty() )
        {
            ostringstream oss;

            oss << "Empty COMMAND attribute in RAFT_LEADER_HOOK. Hook "
                << "not registered!";

            NebulaLog::log("ONE", Log::WARNING, oss);
        }
        else
        {
            if (cmd[0] != '/')
            {
                ostringstream cmd_os;
                cmd_os << remotes_location << "/hooks/" << cmd;
                cmd = cmd_os.str();
            }

            leader_hook = new RaftLeaderHook(cmd, arg);
        }
    }

    if ( follower_hook_mad != 0 )
    {
        cmd = follower_hook_mad->vector_value("COMMAND");
        arg = follower_hook_mad->vector_value("ARGUMENTS");

        if ( cmd.empty() )
        {
            ostringstream oss;

            oss << "Empty COMMAND attribute in RAFT_FOLLOWER_HOOK. Hook "
                << "not registered!";

            NebulaLog::log("ONE", Log::WARNING, oss);
        }
        else
        {
            if (cmd[0] != '/')
            {
                ostringstream cmd_os;
                cmd_os << remotes_location << "/hooks/" << cmd;
                cmd = cmd_os.str();
            }

            follower_hook = new RaftFollowerHook(cmd, arg);
        }
    }

    if ( state == FOLLOWER && follower_hook != 0 )
    {
        follower_hook->do_hook(0);
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" void * raft_manager_loop(void *arg)
{
    RaftManager * raftm;
    struct timespec timeout;

    if ( arg == 0 )
    {
        return 0;
    }

    raftm = static_cast<RaftManager *>(arg);

    timeout.tv_sec  = 0;
    timeout.tv_nsec = raftm->timer_period_ms * 1000000;

    NebulaLog::log("RCM",Log::INFO,"Raft Consensus Manager started.");

    raftm->am.loop(timeout);

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

void RaftManager::finalize_action(const ActionRequest& ar)
{
    NebulaLog::log("RCM", Log::INFO, "Raft Consensus Manager...");

    if (is_leader())
    {
        follower(0);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* Server management interface                                                */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static unsigned int get_zone_servers(std::map<int, std::string>& _serv)
{
    Nebula& nd       = Nebula::instance();
    ZonePool * zpool = nd.get_zonepool();

    int zone_id = nd.get_zone_id();

    return zpool->get_zone_servers(zone_id, _serv);
}

int RaftManager::get_leader_endpoint(std::string& endpoint)
{
    int rc;

    pthread_mutex_lock(&mutex);

    if ( leader_id == -1 )
    {
        rc = -1;
    }
    else
    {
        std::map<int, std::string>::iterator it;

        it = servers.find(leader_id);

        if ( it == servers.end() )
        {
            rc = -1;
        }
        else
        {
            endpoint = it->second;
            rc = 0;
        }
    }

    pthread_mutex_unlock(&mutex);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RaftManager::add_server(int follower_id, const std::string& endpoint)
{
    std::ostringstream oss;

	LogDB * logdb = Nebula::instance().get_logdb();

	unsigned int log_term;
    uint64_t log_index;

    logdb->get_last_record_index(log_index, log_term);

	pthread_mutex_lock(&mutex);

    if ( state != LEADER )
    {
        pthread_mutex_unlock(&mutex);
        return;
    }

    num_servers++;

    servers.insert(std::make_pair(follower_id, endpoint));

	next.insert(std::make_pair(follower_id, log_index + 1));

	match.insert(std::make_pair(follower_id, 0));

    oss << "Starting replication and heartbeat threads for follower: "
        << follower_id;

    NebulaLog::log("RCM", Log::INFO, oss);

	replica_manager.add_replica_thread(follower_id);

	heartbeat_manager.add_replica_thread(follower_id);

	pthread_mutex_unlock(&mutex);
};

/* -------------------------------------------------------------------------- */

void RaftManager::delete_server(int follower_id)
{
    std::ostringstream oss;
    std::map<int, std::string> _servers;

	pthread_mutex_lock(&mutex);

    if ( state != LEADER )
    {
        pthread_mutex_unlock(&mutex);
        return;
    }

    num_servers--;
    servers.erase(follower_id);

	next.erase(follower_id);

	match.erase(follower_id);

    oss << "Stopping replication and heartbeat threads for follower: "
        << follower_id;

    NebulaLog::log("RCM", Log::INFO, oss);

	replica_manager.delete_replica_thread(follower_id);

	heartbeat_manager.delete_replica_thread(follower_id);

	pthread_mutex_unlock(&mutex);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* State transitions & and callbacks                                          */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" void * reconciling_thread(void *arg)
{
    Nebula& nd = Nebula::instance();

    LogDB * logdb    = nd.get_logdb();
    RaftManager * rm = nd.get_raftm();

    uint64_t * index = static_cast<uint64_t *>(arg);

    NebulaLog::log("RCM", Log::INFO, "Replicating log to followers");

    logdb->replicate(*index);

    NebulaLog::log("RCM", Log::INFO, "Leader log replicated");

    pthread_mutex_lock(&(rm->mutex));

    rm->reconciling = false;

    pthread_mutex_unlock(&(rm->mutex));

    free(index);

    return 0;
}

void RaftManager::leader()
{
    Nebula& nd    = Nebula::instance();

    LogDB * logdb     = nd.get_logdb();
    AclManager * aclm = nd.get_aclm();

    FedReplicaManager * frm = nd.get_frm();

    std::map<int, std::string>::iterator it;
    std::vector<int> _follower_ids;

    uint64_t index, _applied, _next_index;

    std::map<int, std::string> _servers;

    std::ostringstream oss;

    logdb->setup_index(_applied, index);

    pthread_mutex_lock(&mutex);

    if ( state != CANDIDATE )
    {
        pthread_mutex_unlock(&mutex);
        return;
    }

    oss << "Becoming leader of the zone. Last log record: " << index << " last "
        << "applied record: " << _applied;

    NebulaLog::log("RCM", Log::INFO, oss);

    next.clear();
    match.clear();

    requests.clear();

    if ( leader_hook != 0 )
    {
        leader_hook->do_hook(0);
    }

    state  = LEADER;

    commit = _applied;

    leader_id = server_id;

    if ( _applied < index )
    {
        reconciling = true;
        _next_index = index;
    }
    else
    {
        _next_index = index + 1;
    }

    for (it = servers.begin(); it != servers.end() ; ++it )
    {
        if ( it->first == server_id )
        {
            continue;
        }

        next.insert(std::make_pair(it->first, _next_index));

        match.insert(std::make_pair(it->first, 0));

        _follower_ids.push_back(it->first);
    }

    replica_manager.start_replica_threads(_follower_ids);
    heartbeat_manager.start_replica_threads(_follower_ids);

    pthread_mutex_unlock(&mutex);

    aclm->reload_rules();

    if ( nd.is_federation_master() )
    {
        frm->start_replica_threads();
    }

    if ( _applied < index )
    {
        pthread_attr_t pattr;
        pthread_t thid;

        pthread_attr_init (&pattr);
        pthread_attr_setdetachstate(&pattr, PTHREAD_CREATE_DETACHED);

        int * _index = (int *) malloc(sizeof(int));

        *_index = _next_index;

        pthread_create(&thid, &pattr, reconciling_thread, (void *) _index);

        pthread_attr_destroy(&pattr);
    }

    NebulaLog::log("RCM", Log::INFO, "oned is now the leader of the zone");
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RaftManager::follower(unsigned int _term)
{
    uint64_t lapplied, lindex;

    Nebula& nd    = Nebula::instance();
    LogDB * logdb = nd.get_logdb();

    FedReplicaManager * frm = nd.get_frm();

    std::string raft_state_xml;

    logdb->setup_index(lapplied, lindex);

    pthread_mutex_lock(&mutex);

    if ( state == LEADER && follower_hook != 0 )
    {
        follower_hook->do_hook(0);
    }

    replica_manager.stop_replica_threads();
    heartbeat_manager.stop_replica_threads();

    state = FOLLOWER;

    if ( _term > term )
    {
        term     = _term;
        votedfor = -1;

        raft_state.replace("VOTEDFOR", votedfor);
        raft_state.replace("TERM", term);

        raft_state.to_xml(raft_state_xml);
    }

    commit    = lapplied;
    leader_id = -1;

    NebulaLog::log("RCM", Log::INFO, "oned is set to follower mode");

    next.clear();
    match.clear();

    requests.clear();

    //Reset heartbeat when turning into follower when a higher term is found:
    // 1. On vote request
    // 2. On heartbeat response
    // 3. On log replicate request
	clock_gettime(CLOCK_REALTIME, &last_heartbeat);

    pthread_mutex_unlock(&mutex);

    if ( nd.is_federation_master() )
    {
        frm->stop_replica_threads();
    }

    if (!raft_state_xml.empty())
    {
        logdb->update_raft_state(raft_state_name, raft_state_xml);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RaftManager::replicate_log(ReplicaRequest * request)
{
    pthread_mutex_lock(&mutex);

    if ( state != LEADER )
    {
        request->notify();

        requests.remove(request->index());

        pthread_mutex_unlock(&mutex);
        return;
    }

    //Count servers that need to replicate this record
    int to_commit = num_servers / 2;

    std::map<int, uint64_t>::iterator it;

    for (it = next.begin(); it != next.end() ; ++it)
    {
        uint64_t rindex = request->index();

        if ( rindex < (uint64_t) it->second )
        {
            to_commit--;
        }
        else
        {
            replica_manager.replicate(it->first);
        }
    }

    if ( to_commit <= 0 )
    {
        request->notify();

        request->result  = true;
        request->timeout = false;

        commit = request->index();

        requests.remove(request->index());
    }
    else
    {
        request->to_commit(to_commit);

        requests.set(request->index(), request);
    }

    pthread_mutex_unlock(&mutex);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RaftManager::replicate_success(int follower_id)
{
    std::map<int, ReplicaRequest *>::iterator it;

    std::map<int, uint64_t>::iterator next_it;
    std::map<int, uint64_t>::iterator match_it;

    Nebula& nd    = Nebula::instance();
    LogDB * logdb = nd.get_logdb();

	unsigned int db_lterm;
    uint64_t db_lindex;

    logdb->get_last_record_index(db_lindex, db_lterm);

    pthread_mutex_lock(&mutex);

    next_it  = next.find(follower_id);
    match_it = match.find(follower_id);

    if ( next_it == next.end() || match_it == match.end() )
    {
        pthread_mutex_unlock(&mutex);
        return;
    }

    uint64_t replicated_index = next_it->second;

    match_it->second = replicated_index;
    next_it->second  = replicated_index + 1;

    if ( requests.add_replica(replicated_index) == 0 )
    {
        commit = replicated_index;
    }

    if (db_lindex > replicated_index && state == LEADER &&
            requests.is_replicable(replicated_index + 1))
    {
        replica_manager.replicate(follower_id);
    }

    pthread_mutex_unlock(&mutex);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RaftManager::replicate_failure(int follower_id)
{
    std::map<int, uint64_t>::iterator next_it;

    pthread_mutex_lock(&mutex);

    next_it = next.find(follower_id);

    if ( next_it != next.end() )
    {
        if ( next_it->second > 0 )
        {
            next_it->second = next_it->second - 1;
        }
    }

    if ( state == LEADER )
    {
        replica_manager.replicate(follower_id);
    }

    pthread_mutex_unlock(&mutex);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* Raft state interface                                                       */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RaftManager::update_last_heartbeat(int _leader_id)
{
    pthread_mutex_lock(&mutex);

    leader_id = _leader_id;

	clock_gettime(CLOCK_REALTIME, &last_heartbeat);

    pthread_mutex_unlock(&mutex);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

uint64_t RaftManager::update_commit(uint64_t leader_commit, uint64_t index)
{
    uint64_t _commit;

    pthread_mutex_lock(&mutex);

    if ( leader_commit > commit )
    {
        if ( index < leader_commit )
        {
            commit = index;
        }
        else
        {
            commit = leader_commit;
        }
    }

    _commit = commit;

    pthread_mutex_unlock(&mutex);

    return _commit;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int RaftManager::update_votedfor(int _votedfor)
{
    Nebula& nd    = Nebula::instance();
    LogDB * logdb = nd.get_logdb();

    std::string raft_state_xml;

    pthread_mutex_lock(&mutex);

    if ( votedfor != -1 && votedfor != _votedfor )
    {
        pthread_mutex_unlock(&mutex);

        return -1;
    }

    votedfor = _votedfor;

    raft_state.replace("VOTEDFOR", votedfor);

    raft_state.to_xml(raft_state_xml);

    pthread_mutex_unlock(&mutex);

    logdb->update_raft_state(raft_state_name, raft_state_xml);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RaftManager::timer_action(const ActionRequest& ar)
{
    static int mark_tics  = 0;
    static int purge_tics = 0;
    ostringstream oss;

    Nebula& nd = Nebula::instance();

    if ( nd.is_cache() )
    {
        return;
    }

    mark_tics++;
    purge_tics++;

    // Thread heartbeat
    if ( (mark_tics * timer_period_ms) >= 600000 )
    {
        NebulaLog::log("RCM",Log::INFO,"--Mark--");
        mark_tics = 0;
    }

    // Database housekeeping
    if ( (purge_tics * timer_period_ms) >= purge_period_ms )
    {
        LogDB * logdb = nd.get_logdb();

        int rc = logdb->purge_log();

        purge_tics = 0;

        if (rc > 0 && purge_period_ms > 60000) //logs removed, wakeup in 60s 
        {
            purge_tics = (int) ((purge_period_ms - 60000)/timer_period_ms);
        }
    }

    // Leadership
    struct timespec the_time;

    clock_gettime(CLOCK_REALTIME, &the_time);

    pthread_mutex_lock(&mutex);

    if ( state == LEADER ) // Send the heartbeat
    {
        time_t sec  = last_heartbeat.tv_sec + broadcast_timeout.tv_sec;
        long   nsec = last_heartbeat.tv_nsec + broadcast_timeout.tv_nsec;


        if ((sec < the_time.tv_sec) || (sec == the_time.tv_sec &&
                nsec <= the_time.tv_nsec))
        {
            heartbeat_manager.replicate();

            clock_gettime(CLOCK_REALTIME, &last_heartbeat);

            pthread_mutex_unlock(&mutex);
        }
        else
        {
            pthread_mutex_unlock(&mutex);
        }
    }
    else if ( state == FOLLOWER )
    {
        time_t sec  = last_heartbeat.tv_sec + election_timeout.tv_sec;
        long   nsec = last_heartbeat.tv_nsec + election_timeout.tv_nsec;

        if ((sec < the_time.tv_sec) || (sec == the_time.tv_sec &&
                nsec <= the_time.tv_nsec))
        {
            NebulaLog::log("RRM", Log::ERROR, "Failed to get heartbeat from "
                "leader. Starting election proccess");

            state = CANDIDATE;

            pthread_mutex_unlock(&mutex);

            request_vote();
        }
        else
        {
            pthread_mutex_unlock(&mutex);
        }
    }
    else //SOLO or CANDIDATE, do nothing
    {
        pthread_mutex_unlock(&mutex);
    }

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* XML-RPC interface to talk to followers                                     */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RaftManager::request_vote()
{
    unsigned int lterm, fterm, _term;
    uint64_t lindex;
    int _server_id;

    std::map<int, std::string> _servers;
    std::map<int, std::string>::iterator it;


    std::ostringstream oss;

    unsigned int granted_votes;
    unsigned int votes2go;

    Nebula& nd    = Nebula::instance();
    LogDB * logdb = nd.get_logdb();

    int rc;

    std::string error;
    std::string raft_state_xml;

    struct timespec etimeout;
    long long ms;

    bool success;

    unsigned int _num_servers = get_zone_servers(_servers);

    do
    {
        /* ------------------------------------------------------------------ */
        /* Initialize election variables                                      */
        /* ------------------------------------------------------------------ */
        pthread_mutex_lock(&mutex);

        if ( state != CANDIDATE )
        {
            pthread_mutex_unlock(&mutex);
            break;
        }

        servers     = _servers;
        num_servers = _num_servers;

        term     = term + 1;
        votedfor = server_id;

        leader_id = -1;

        raft_state.replace("TERM", term);
        raft_state.replace("VOTEDFOR", votedfor);

        raft_state.to_xml(raft_state_xml);

        votes2go      = num_servers / 2;
        granted_votes = 0;

        _term      = term;
        _server_id = server_id;

        pthread_mutex_unlock(&mutex);

        logdb->update_raft_state(raft_state_name, raft_state_xml);

        logdb->get_last_record_index(lindex, lterm);

        /* ------------------------------------------------------------------ */
        /* Request vote on all the followers                                  */
        /* ------------------------------------------------------------------ */
        for (it = _servers.begin(); it != _servers.end() ; ++it, oss.str("") )
        {
            int id = it->first;

            if ( id == _server_id )
            {
                continue;
            }

            rc = xmlrpc_request_vote(id, lindex, lterm, success, fterm, error);

            if ( rc == -1 )
            {
                NebulaLog::log("RCM", Log::INFO, error);
            }
            else if ( success == false )
            {
                oss << "Vote not granted from follower " << id << ": " << error;

                NebulaLog::log("RCM", Log::INFO, oss);

                if ( fterm > _term )
                {
                    oss.str("");
                    oss << "Follower " << id << " is in term " << fterm
                        << " current term is "<< _term
                        << ". Turning into follower";

                    NebulaLog::log("RCM", Log::INFO, oss);

                    follower(fterm);

                    return;
                }
            }
            else if ( success == true )
            {
                granted_votes++;

                oss << "Got vote from follower " << id << ". Total votes: "
                    << granted_votes;

                NebulaLog::log("RCM", Log::INFO, oss);
            }

            if ( granted_votes >= votes2go )
            {
                NebulaLog::log("RCM", Log::INFO, "Got majority of votes");
                break;
            }
        }

        /* ------------------------------------------------------------------ */
        /* Become leader if we have enough votes                              */
        /* ------------------------------------------------------------------ */
        if ( granted_votes >= votes2go )
        {
            leader();
            return;
        }

        /* ------------------------------------------------------------------ */
        /* Timeout for a new election process (blocking timer thread)         */
        /* ------------------------------------------------------------------ */
        pthread_mutex_lock(&mutex);

        votedfor = -1;

        raft_state.replace("VOTEDFOR", votedfor);

        raft_state.to_xml(raft_state_xml);

        pthread_mutex_unlock(&mutex);

        logdb->update_raft_state(raft_state_name, raft_state_xml);

        srand(_server_id+1);

        ms = rand() % 1000 + election_timeout.tv_sec * 1000
            + election_timeout.tv_nsec / 1000000;

        oss.str("");

        oss << "No leader found, starting new election in " << ms << "ms";
        NebulaLog::log("RCM", Log::INFO, oss);

        set_timeout(ms, etimeout);

        nanosleep(&etimeout, 0);

    } while ( true );
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int RaftManager::xmlrpc_replicate_log(int follower_id, LogDBRecord * lr,
		bool& success, unsigned int& fterm, std::string& error)
{
	int _server_id;
	uint64_t _commit;
    int _term;
    std::string xmlrpc_secret;

    static const std::string replica_method = "one.zone.replicate";

    std::string follower_edp;

    std::map<int, std::string>::iterator it;

	int xml_rc = 0;

	pthread_mutex_lock(&mutex);

    it = servers.find(follower_id);

    if ( it == servers.end() )
    {
        error = "Cannot find follower end point";
        pthread_mutex_unlock(&mutex);

        return -1;
    }

    follower_edp = it->second;

	_commit    = commit;
    _term      = term;
	_server_id = server_id;

	pthread_mutex_unlock(&mutex);

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
    replica_params.add(xmlrpc_c::value_int(_server_id));
    replica_params.add(xmlrpc_c::value_i8(_commit));
    replica_params.add(xmlrpc_c::value_int(_term));
    replica_params.add(xmlrpc_c::value_i8(lr->index));
    replica_params.add(xmlrpc_c::value_int(lr->term));
    replica_params.add(xmlrpc_c::value_i8(lr->prev_index));
    replica_params.add(xmlrpc_c::value_int(lr->prev_term));
    replica_params.add(xmlrpc_c::value_i8(lr->fed_index));
    replica_params.add(xmlrpc_c::value_string(lr->sql));

    // -------------------------------------------------------------------------
    // Do the XML-RPC call
    // -------------------------------------------------------------------------
    xml_rc = Client::call(follower_edp, replica_method, replica_params,
            xmlrpc_timeout_ms, &result, error);

    if ( xml_rc == 0 )
    {
        vector<xmlrpc_c::value> values;

        values  = xmlrpc_c::value_array(result).vectorValueValue();
        success = xmlrpc_c::value_boolean(values[0]);

        if ( success ) //values[2] = error code (string)
        {
            fterm = xmlrpc_c::value_int(values[1]);
        }
        else
        {
            error = xmlrpc_c::value_string(values[1]);
            fterm = xmlrpc_c::value_int(values[3]);
        }
    }
    else
    {
        std::ostringstream ess;

        ess << "Error replicating log entry " << lr->index << " on follower "
            << follower_id << ": " << error;

        error = ess.str();
    }

    return xml_rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int RaftManager::xmlrpc_request_vote(int follower_id, uint64_t lindex,
        unsigned int lterm, bool& success, unsigned int& fterm,
        std::string& error)
{
	int _server_id;
    int _term;
    std::string xmlrpc_secret;

    static const std::string replica_method = "one.zone.voterequest";

    std::string follower_edp;

    std::map<int, std::string>::iterator it;

	int xml_rc = 0;

	pthread_mutex_lock(&mutex);

    it = servers.find(follower_id);

    if ( it == servers.end() )
    {
        error = "Cannot find follower end point";
        pthread_mutex_unlock(&mutex);

        return -1;
    }

    follower_edp = it->second;

	_term      = term;
	_server_id = server_id;

	pthread_mutex_unlock(&mutex);

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
    replica_params.add(xmlrpc_c::value_int(_term));
    replica_params.add(xmlrpc_c::value_int(_server_id));
    replica_params.add(xmlrpc_c::value_i8(lindex));
    replica_params.add(xmlrpc_c::value_int(lterm));

    // -------------------------------------------------------------------------
    // Do the XML-RPC call
    // -------------------------------------------------------------------------
    xml_rc = Client::call(follower_edp, replica_method, replica_params,
        xmlrpc_timeout_ms, &result, error);

    if ( xml_rc == 0 )
    {
        vector<xmlrpc_c::value> values;

        values  = xmlrpc_c::value_array(result).vectorValueValue();
        success = xmlrpc_c::value_boolean(values[0]);

        if ( success ) //values[2] = error code (string)
        {
            fterm = xmlrpc_c::value_int(values[1]);
        }
        else
        {
            error = xmlrpc_c::value_string(values[1]);
            fterm = xmlrpc_c::value_int(values[3]);
        }
    }
    else
    {
        std::ostringstream ess;

        ess << "Error requesting vote from follower "<< follower_id << ":"
            << error;

        error = ess.str();
    }

    return xml_rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

std::string& RaftManager::to_xml(std::string& raft_xml)
{
    Nebula& nd    = Nebula::instance();
    LogDB * logdb = nd.get_logdb();

    unsigned int lterm;
    uint64_t lindex;
    std::ostringstream oss;

    logdb->get_last_record_index(lindex, lterm);

	pthread_mutex_lock(&mutex);

    oss << "<RAFT>"
        << "<SERVER_ID>" << server_id << "</SERVER_ID>"
        << "<STATE>"     << state << "</STATE>"
        << "<TERM>"      << term << "</TERM>"
        << "<VOTEDFOR>"  << votedfor << "</VOTEDFOR>"
        << "<COMMIT>"    << commit << "</COMMIT>";

	if ( state == SOLO )
	{
        oss << "<LOG_INDEX>-1</LOG_INDEX>"
            << "<LOG_TERM>-1</LOG_TERM>";
	}
    else
    {
        oss << "<LOG_INDEX>" << lindex << "</LOG_INDEX>"
            << "<LOG_TERM>"  << lterm  << "</LOG_TERM>";
    }

    if ( nd.is_federation_enabled() )
    {
        oss << "<FEDLOG_INDEX>" << logdb->last_federated() << "</FEDLOG_INDEX>";
    }
    else
    {
        oss << "<FEDLOG_INDEX>-1</FEDLOG_INDEX>";
    }

    oss << "</RAFT>";

	pthread_mutex_unlock(&mutex);

    raft_xml = oss.str();

    return raft_xml;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RaftManager::reset_index(int follower_id)
{
    std::map<int, uint64_t>::iterator next_it;

	unsigned int log_term;
    uint64_t log_index;

	LogDB * logdb = Nebula::instance().get_logdb();

    logdb->get_last_record_index(log_index, log_term);

    pthread_mutex_lock(&mutex);

    next_it = next.find(follower_id);

    if ( next_it != next.end() )
    {
        next_it->second = log_index + 1;
    }

    pthread_mutex_unlock(&mutex);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int RaftManager::init_raft_state(const std::string& raft_xml)
{
    string error;
    Nebula& nd = Nebula::instance();

    return nd.insert_sys_attribute(raft_state_name, raft_xml, error);
}

