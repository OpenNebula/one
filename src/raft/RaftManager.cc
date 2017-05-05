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

#include "Nebula.h"

#include "RaftManager.h"
#include "ZoneServer.h"
#include "Client.h"

#include <cstdlib>

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
const time_t RaftManager::timer_period_ms = 10;

static void set_timeout(long long ms, struct timespec& timeout)
{
    std::lldiv_t d;

    d = std::div(ms, (long long) 1000);

    timeout.tv_sec  = d.quot;
    timeout.tv_nsec = d.rem * 1000000;
}

static unsigned int get_zone_servers(std::map<unsigned int, std::string>& _s);

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* RaftManager component life-cycle functions                                 */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

RaftManager::RaftManager(int id, time_t log_purge, long long bcast,
        long long elect, time_t xmlrpc):server_id(id), term(0), num_servers(0),
	commit(0)
{
    Nebula& nd    = Nebula::instance();
    LogDB * logdb = nd.get_logdb();

    std::string raft_xml;

	pthread_mutex_init(&mutex, 0);

	am.addListener(this);

    // -------------------------------------------------------------------------
    // Initialize Raft variables:
    //   - state
    //   - servers
    //   - votedfor
    //   - term
    // -------------------------------------------------------------------------
    if ( logdb->get_raft_state(raft_xml) != 0 )
    {
        raft_state.replace("TERM", 0);
        raft_state.replace("VOTEDFOR", -1);

        raft_state.to_xml(raft_xml);

        logdb->insert_raft_state(raft_xml);

        votedfor = -1;
        term     = 0;
    }
    else
    {
        raft_state.from_xml(raft_xml);

        raft_state.get("TERM", term);
        raft_state.get("VOTEDFOR", votedfor);
    }

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
    //   TODO: randomize election timeout
    // -------------------------------------------------------------------------
    purge_period_ms   = log_purge * 1000;
    xmlrpc_timeout_ms = xmlrpc;

    set_timeout(bcast, broadcast_timeout);
    set_timeout(elect, election_timeout);

    // 5 seconds warm-up to start election
	clock_gettime(CLOCK_REALTIME, &last_heartbeat);
	last_heartbeat.tv_sec += 5;
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
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* Server management interface                                                */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static unsigned int get_zone_servers(std::map<unsigned int, std::string>& _serv)
{
    unsigned int  _num_servers;

    Nebula& nd       = Nebula::instance();
    ZonePool * zpool = nd.get_zonepool();

    int zone_id = nd.get_zone_id();

    ZoneServers::zone_iterator zit;

    Zone * zone = zpool->get(zone_id, true);

    if ( zone == 0 )
    {
        _serv.clear();
        return 0;
    }

    ZoneServers * followers = zone->get_servers();

    for (zit = followers->begin(); zit != followers->end(); ++zit)
    {
        unsigned int id  = (*zit)->get_id();
        std::string  edp = (*zit)->vector_value("ENDPOINT");

        _serv.insert(make_pair(id, edp));
    }

    _num_servers = zone->servers_size();

    zone->unlock();

    return _num_servers;
}

/* -------------------------------------------------------------------------- */

void RaftManager::add_server(unsigned int follower_id)
{
	LogDB * logdb = Nebula::instance().get_logdb();

	unsigned int log_index, log_term;

    logdb->get_last_record_index(log_index, log_term);

    std::map<unsigned int, std::string> _servers;

    unsigned int _num_servers = get_zone_servers(_servers);

	pthread_mutex_lock(&mutex);

    num_servers = _num_servers;
    servers     = _servers;

	next.insert(std::make_pair(follower_id, log_index + 1));

	match.insert(std::make_pair(follower_id, 0));

	replica_manager.add_replica_thread(follower_id);

	pthread_mutex_unlock(&mutex);
};

/* -------------------------------------------------------------------------- */

void RaftManager::delete_server(unsigned int follower_id)
{
    std::map<unsigned int, std::string> _servers;

    unsigned int _num_servers = get_zone_servers(_servers);

	pthread_mutex_lock(&mutex);

    num_servers = _num_servers;
    servers     = _servers;

	next.erase(follower_id);

	match.erase(follower_id);

	replica_manager.delete_replica_thread(follower_id);

	pthread_mutex_unlock(&mutex);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* State transitions & and callbacks                                          */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RaftManager::leader()
{
    LogDB * logdb = Nebula::instance().get_logdb();

    std::map<unsigned int, std::string>::iterator it;
    std::vector<unsigned int> _follower_ids;

    int index, _applied;

    std::map<unsigned int, std::string> _servers;

    std::ostringstream oss;

    std::string raft_state_xml;

    logdb->setup_index(_applied, index);

    pthread_mutex_lock(&mutex);

    if ( state != CANDIDATE )
    {
        NebulaLog::log("RCM", Log::INFO, "Cannot become leader, no longer "
                "candidate");

        pthread_mutex_unlock(&mutex);

        return;
    }

    oss << "Becoming leader of zone. Last log record: " << index << " last "
        << "applied record: " << _applied;

    NebulaLog::log("RCM", Log::INFO, oss);

    next.clear();
    match.clear();

    requests.clear();

    state = LEADER;

    commit   = _applied;
    votedfor = -1;

    raft_state.replace("VOTEDFOR", votedfor);

    raft_state.to_xml(raft_state_xml);

    for (it = servers.begin(); it != servers.end() ; ++it )
    {
        if ( it->first == (unsigned int) server_id )
        {
            continue;
        }

        next.insert(std::make_pair(it->first, index + 1));

        match.insert(std::make_pair(it->first, 0));

        _follower_ids.push_back(it->first);
    }

    replica_manager.start_replica_threads(_follower_ids);

    pthread_mutex_unlock(&mutex);

    logdb->insert_raft_state(raft_state_xml);

    NebulaLog::log("RCM", Log::INFO, "oned is now the leader of zone");
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RaftManager::follower(unsigned int _term)
{
    int lapplied, lindex;

    Nebula& nd    = Nebula::instance();
    LogDB * logdb = nd.get_logdb();

    std::string raft_state_xml;

    logdb->setup_index(lapplied, lindex);

    pthread_mutex_lock(&mutex);

    replica_manager.stop_replica_threads();

    state = FOLLOWER;

    term     = _term;
    votedfor = -1;

    commit   = lapplied;

    raft_state.replace("VOTEDFOR", votedfor);
    raft_state.replace("TERM", term);

    raft_state.to_xml(raft_state_xml);

    NebulaLog::log("RCM", Log::INFO, "oned is set to follower mode");

    std::map<unsigned int, ReplicaRequest *>::iterator it;

    for ( it = requests.begin() ; it != requests.end() ; ++it )
    {
        it->second->result = false;
        it->second->timeout= false;
        it->second->message= "oned is now follower";

        it->second->notify();
    }

    next.clear();
    match.clear();

    requests.clear();

    pthread_mutex_unlock(&mutex);

    logdb->insert_raft_state(raft_state_xml);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RaftManager::replicate_log(ReplicaRequest * request)
{
    pthread_mutex_lock(&mutex);

    if ( state != LEADER )
    {
        pthread_mutex_unlock(&mutex);
        return;
    }

    if ( num_servers <= 1 )
    {
        request->notify();

        request->result  = true;
        request->timeout = false;

        commit = request->index();
    }
    else
    {
        request->to_commit(num_servers / 2 );

        requests.insert(std::make_pair(request->index(), request));
    }

    if ( num_servers > 1 )
    {
        replica_manager.replicate();
    }

    pthread_mutex_unlock(&mutex);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RaftManager::replicate_success(unsigned int follower_id)
{
    std::map<unsigned int, ReplicaRequest *>::iterator it;

    std::map<unsigned int, unsigned int>::iterator next_it;
    std::map<unsigned int, unsigned int>::iterator match_it;

    Nebula& nd    = Nebula::instance();
    LogDB * logdb = nd.get_logdb();

	unsigned int db_last_index, db_last_term;

    logdb->get_last_record_index(db_last_index, db_last_term);

    pthread_mutex_lock(&mutex);

    next_it  = next.find(follower_id);
    match_it = match.find(follower_id);

    if ( next_it == next.end() || match_it == match.end() )
    {
        pthread_mutex_unlock(&mutex);
        return;
    }

    unsigned int replicated_index = next_it->second;

    match_it->second = replicated_index;
    next_it->second  = replicated_index + 1;

    it = requests.find(replicated_index);

    if ( it != requests.end() )
    {
        it->second->inc_replicas();

        if ( it->second->to_commit() == 0 )
        {
            requests.erase(it);

            commit = replicated_index;
        }
    }

    if ( db_last_index > replicated_index )
    {
        replica_manager.replicate(follower_id);
    }

    pthread_mutex_unlock(&mutex);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RaftManager::replicate_failure(unsigned int follower_id)
{
    std::map<unsigned int, unsigned int>::iterator next_it;

    pthread_mutex_lock(&mutex);

    next_it = next.find(follower_id);

    if ( next_it != next.end() )
    {
        next_it->second = next_it->second - 1;
    }

    replica_manager.replicate(follower_id);

    pthread_mutex_unlock(&mutex);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* Raft state interface                                                       */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RaftManager::update_last_heartbeat()
{
    pthread_mutex_lock(&mutex);

	clock_gettime(CLOCK_REALTIME, &last_heartbeat);

    pthread_mutex_unlock(&mutex);
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

    logdb->insert_raft_state(raft_state_xml);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RaftManager::timer_action(const ActionRequest& ar)
{
    static int mark_tics  = 0;
    static int purge_tics = 0;

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
        Nebula& nd    = Nebula::instance();
        LogDB * logdb = nd.get_logdb();

        NebulaLog::log("RCM", Log::INFO, "Purging obsolete LogDB records");

        logdb->purge_log();

        purge_tics = 0;
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
            clock_gettime(CLOCK_REALTIME, &last_heartbeat);

            pthread_mutex_unlock(&mutex);

			send_heartbeat();
		}

        pthread_mutex_unlock(&mutex);
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

            clock_gettime(CLOCK_REALTIME, &last_heartbeat);

            pthread_mutex_unlock(&mutex);

            request_vote();
		}

        pthread_mutex_unlock(&mutex);
	}
	else
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

void RaftManager::send_heartbeat()
{
    std::map<unsigned int, std::string> _servers;
    std::map<unsigned int, std::string>::iterator it;

	LogDBRecord lr;

	bool success;
	unsigned int fterm;

	std::string error;

	lr.index = 0;
	lr.prev_index = 0;

	lr.term = 0;
	lr.prev_term = 0;

	lr.sql = "";

	lr.timestamp = 0;

    pthread_mutex_lock(&mutex);

    if ( state != LEADER )
    {
        pthread_mutex_unlock(&mutex);
        return;
    }

    _servers = servers;

    pthread_mutex_unlock(&mutex);

    for (it = _servers.begin(); it != _servers.end() ; ++it )
    {
        if ( it->first == (unsigned int) server_id )
        {
            continue;
        }

		int rc = xmlrpc_replicate_log(it->first, &lr, success, fterm, error);

		if ( rc == -1 )
		{
			std::ostringstream oss;

			oss << "Error sending heartbeat to follower " << it->first <<": "
				<< error;

        	NebulaLog::log("RCM", Log::INFO, oss);
		}
		else if ( success == false && fterm > term )
		{
			std::ostringstream oss;

            oss << "Follower " << it->first << " term (" << fterm
                << ") is higher than current (" << term << ")";

        	NebulaLog::log("RCM", Log::INFO, oss);

			follower(fterm);

			break;
		}
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RaftManager::request_vote()
{
    unsigned int lindex, lterm, fterm, _term, _server_id;

    std::map<unsigned int, std::string> _servers;
    std::map<unsigned int, std::string>::iterator it;

    std::ostringstream oss;

    unsigned int granted_votes = 0;
    unsigned int votes2go;

    Nebula& nd    = Nebula::instance();
    LogDB * logdb = nd.get_logdb();

    int rc;

    std::string error;
    std::string raft_state_xml;

    struct timespec etimeout;
    long long ms;

    bool success;

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

        _servers = servers;

        term     = term + 1;
        votedfor = server_id;

        raft_state.replace("TERM", term);
        raft_state.replace("VOTEDFOR", votedfor);

        raft_state.to_xml(raft_state_xml);

        votes2go = num_servers / 2;

        _term      = term;
        _server_id = server_id;

        pthread_mutex_unlock(&mutex);

        logdb->insert_raft_state(raft_state_xml);

        logdb->get_last_record_index(lindex, lterm);

        /* ------------------------------------------------------------------ */
        /* Request vote on all the followers                                  */
        /* ------------------------------------------------------------------ */
        for (it = _servers.begin(); it != _servers.end() ; ++it, oss.str("") )
        {
            unsigned int id = it->first;

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

        logdb->insert_raft_state(raft_state_xml);

        srand(_server_id);

        ms = rand() % 500 + election_timeout.tv_sec * 1000
            + election_timeout.tv_nsec / 1000000;

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
	int _commit;
	int _term;

    static const std::string replica_method = "one.zone.replicate";

    std::ostringstream ess;

    std::string secret;
    std::string follower_edp;

    std::map<unsigned int, std::string>::iterator it;

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
    if ( Client::read_oneauth(secret, error) == -1 )
    {
        NebulaLog::log("RRM", Log::ERROR, error);
        return -1;
    }

    xmlrpc_c::carriageParm_curl0 carriage(follower_edp);

    xmlrpc_c::paramList replica_params;

    xmlrpc_c::clientXmlTransport_curl transport;

    xmlrpc_c::client_xml client(&transport);

    replica_params.add(xmlrpc_c::value_string(secret));
    replica_params.add(xmlrpc_c::value_int(_server_id));
    replica_params.add(xmlrpc_c::value_int(_commit));
    replica_params.add(xmlrpc_c::value_int(_term));
    replica_params.add(xmlrpc_c::value_int(lr->index));
    replica_params.add(xmlrpc_c::value_int(lr->term));
    replica_params.add(xmlrpc_c::value_int(lr->prev_index));
    replica_params.add(xmlrpc_c::value_int(lr->prev_term));
    replica_params.add(xmlrpc_c::value_string(lr->sql));

    xmlrpc_c::rpcPtr rpc_client(replica_method, replica_params);

    // -------------------------------------------------------------------------
    // Do the XML-RPC call
    // -------------------------------------------------------------------------
    try
    {
        rpc_client->start(&client, &carriage);

        client.finishAsync(xmlrpc_c::timeout(xmlrpc_timeout_ms));

        if (!rpc_client->isFinished())
        {
            rpc_client->finishErr(girerr::error("XMLRPC method "+replica_method
                + " timeout, resetting call"));
        }

        if ( rpc_client->isSuccessful() )
        {
            vector<xmlrpc_c::value> values;

            xmlrpc_c::value result = rpc_client->getResult();

            values  = xmlrpc_c::value_array(result).vectorValueValue();
            success = xmlrpc_c::value_boolean(values[0]);

            if ( success ) //values[2] = error code (string)
            {
                fterm    = xmlrpc_c::value_int(values[1]);
            }
            else
            {
                error = xmlrpc_c::value_string(values[1]);
                fterm = xmlrpc_c::value_int(values[3]);
            }
        }
        else //RPC failed, will retry on next replication request
        {
            xmlrpc_c::fault failure = rpc_client->getFault();

            ess << "Error replicating log entry " << lr->index
                << " on follower " << follower_id << ": "
                << failure.getDescription();

			error = ess.str();

            xml_rc = -1;
        }
    }
    catch (exception const& e)
    {
        ess << "Error exception replicating log entry " << lr->index
            << " on follower " << follower_id << ": " << e.what();

		error = ess.str();

        xml_rc = -1;
    }

    return xml_rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int RaftManager::xmlrpc_request_vote(int follower_id, unsigned int lindex,
        unsigned int lterm, bool& success, unsigned int& fterm,
        std::string& error)
{
	int _server_id;
	int _term;

    static const std::string replica_method = "one.zone.voterequest";

    std::ostringstream ess;

    std::string secret;
    std::string follower_edp;

    std::map<unsigned int, std::string>::iterator it;

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
    if ( Client::read_oneauth(secret, error) == -1 )
    {
        NebulaLog::log("RRM", Log::ERROR, error);
        return -1;
    }

    xmlrpc_c::carriageParm_curl0 carriage(follower_edp);

    xmlrpc_c::paramList replica_params;

    xmlrpc_c::clientXmlTransport_curl transport;

    xmlrpc_c::client_xml client(&transport);

    replica_params.add(xmlrpc_c::value_string(secret));
    replica_params.add(xmlrpc_c::value_int(_term));
    replica_params.add(xmlrpc_c::value_int(_server_id));
    replica_params.add(xmlrpc_c::value_int(lindex));
    replica_params.add(xmlrpc_c::value_int(lterm));

    xmlrpc_c::rpcPtr rpc_client(replica_method, replica_params);

    // -------------------------------------------------------------------------
    // Do the XML-RPC call
    // -------------------------------------------------------------------------
    try
    {
        rpc_client->start(&client, &carriage);

        client.finishAsync(xmlrpc_c::timeout(xmlrpc_timeout_ms));

        if (!rpc_client->isFinished())
        {
            rpc_client->finishErr(girerr::error("XMLRPC method "+replica_method
                + " timeout, resetting call"));
        }

        if ( rpc_client->isSuccessful() )
        {
            vector<xmlrpc_c::value> values;

            xmlrpc_c::value result = rpc_client->getResult();

            values  = xmlrpc_c::value_array(result).vectorValueValue();
            success = xmlrpc_c::value_boolean(values[0]);

            if ( success ) //values[2] = error code (string)
            {
                fterm    = xmlrpc_c::value_int(values[1]);
            }
            else
            {
                error = xmlrpc_c::value_string(values[1]);
                fterm = xmlrpc_c::value_int(values[3]);
            }
        }
        else //RPC failed, vote not granted
        {
            xmlrpc_c::fault failure = rpc_client->getFault();

            ess << "Error requesting vote from follower " << follower_id << ": "
                << failure.getDescription();

			error = ess.str();

            xml_rc = -1;
        }
    }
    catch (exception const& e)
    {
        ess << "Error requesting vote from follower " << follower_id << ": "
            << e.what();

		error = ess.str();

        xml_rc = -1;
    }

    return xml_rc;
}

