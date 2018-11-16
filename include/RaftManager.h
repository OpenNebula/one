/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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

#ifndef RAFT_MANAGER_H_
#define RAFT_MANAGER_H_

#include "ActionManager.h"
#include "ReplicaManager.h"
#include "ReplicaRequest.h"
#include "Template.h"
#include "RaftHook.h"

extern "C" void * raft_manager_loop(void *arg);

extern "C" void * reconciling_thread(void *arg);

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class RaftManager : public ActionListener
{
public:
    /**
     *  State of this server
     */
    enum State {
        SOLO      = 0,
        CANDIDATE = 1,
        FOLLOWER  = 2,
        LEADER    = 3
    };

    /**
     * Raft manager constructor
     *   @param server_id of this server
     *   @param leader_hook_mad to be executed when follower->leader
     *   @param follower_hook_mad to be executed when leader->follower
     *   @param log_purge period to purge logDB records
     *   @param bcast heartbeat broadcast timeout
     *   @param election timeout
     *   @param xmlrpc timeout for RAFT related xmlrpc API calls
     **/
    RaftManager(int server_id, const VectorAttribute * leader_hook_mad,
        const VectorAttribute * follower_hook_mad, time_t log_purge,
        long long bcast, long long election, time_t xmlrpc,
        const string& remotes_location);

    ~RaftManager()
    {
        delete leader_hook;
        delete follower_hook;

        pthread_mutex_destroy(&mutex);
    };

    // -------------------------------------------------------------------------
    // Raft associated actions (synchronous)
    // -------------------------------------------------------------------------
    /**
     *  Follower successfully replicated a log entry:
     *    - Increment next entry to send to follower
     *    - Update match entry on follower
     *    - Evaluate majority to apply changes to DB
     */
    void replicate_success(int follower_id);

    /**
     *  Follower failed to replicate a log entry because an inconsistency was
     *  detected (same index, different term):
     *    - Decrease follower next_index
     *    - Retry (do not wait for replica events)
     */
    void replicate_failure(int follower_id);

    /**
     *  Triggers a REPLICATE event, it will notify the replica threads to
     *  send the log to the followers
     */
    void replicate_log(ReplicaRequest * rr);

    /**
     *  Allocate a replica request fot the given index.
     *    @param rindex of the record for the request
     */
	void replicate_allocate(int rindex)
	{
		requests.allocate(rindex);
	}

    /**
     *  Finalizes the Raft Consensus Manager
     */
    void finalize()
    {
        am.finalize();
    }

    /**
     *  Starts the Raft Consensus Manager
     */
    int start();

    pthread_t get_thread_id() const
    {
        return raft_thread;
    };

    // -------------------------------------------------------------------------
    // Raft state query functions
    // -------------------------------------------------------------------------
    /**
     *  Return the Raft status in XML format
     *    @return xml document with the raft state
     */
    std::string& to_xml(std::string& state_xml);

    /**
     *  Makes this server follower. Stop associated replication facilities
     */
    void follower(unsigned int term);

    unsigned int get_term()
    {
        unsigned int _term;

        pthread_mutex_lock(&mutex);

        _term = term;

        pthread_mutex_unlock(&mutex);

        return _term;
    }

    unsigned int get_commit()
    {
        unsigned int _commit;

        pthread_mutex_lock(&mutex);

        _commit = commit;

        pthread_mutex_unlock(&mutex);

        return _commit;
    }

	/**
     *  Update the commit index = min(leader_commit, log index).
	 *  @param leader_commit index sent by leader in a replicate xml-rpc call
	 *  @param index of the last record inserted in the database
	 *  @return the updated commit index
	 */
	unsigned int update_commit(unsigned int leader_commit, unsigned int index);

    /**
     *  Evaluates a vote request. It is granted if no vote has been granted in
     *  this term or it is requested by the same candidate.
     *    @param _votedfor the candidate id
     *    @return -1 if vote is not granted
     */
    int update_votedfor(int _votedfor);

	/**
	 *  Update the last_heartbeat time recieved from server. It stores the id
     *  of the leader.
     *    @param leader_id id of server, -1 if there is no leader set (e.g.
     *    during a election because a vote request was received)
	 */
	void update_last_heartbeat(int leader_id);

    /**
     *  @return true if the server is the leader of the zone, runs in solo mode
	 *  or is a follower
     */
    bool is_leader()
    {
		return test_state(LEADER);
    }

    bool is_follower()
    {
		return test_state(FOLLOWER);
    }

    bool is_candidate()
    {
        return test_state(CANDIDATE);
    }

    bool is_solo()
    {
        return test_state(SOLO);
    }

    bool is_reconciling()
    {
        bool _reconciling;

        pthread_mutex_lock(&mutex);

        _reconciling = reconciling;

        pthread_mutex_unlock(&mutex);

        return _reconciling;
    }

    /**
     *  Get next index to send to the follower
     *    @param follower server id
     *    @return -1 on failure, the next index if success
     */
    int get_next_index(int follower_id)
    {
        std::map<int, unsigned int>::iterator it;
        unsigned int _index = -1;

        pthread_mutex_lock(&mutex);

        it = next.find(follower_id);

        if ( it != next.end() )
        {
            _index = it->second;
        }

        pthread_mutex_unlock(&mutex);

        return _index;
    }

    /**
     * Gets the endpoint for xml-rpc calls of the current leader
     *   @param endpoint
     *   @return 0 on success, -1 if no leader found
     */
    int get_leader_endpoint(std::string& endpoint);

    // -------------------------------------------------------------------------
    // XML-RPC Raft API calls
    // -------------------------------------------------------------------------
    /**
     *  Calls the follower xml-rpc method
	 *    @param follower_id to make the call
     *    @param lr the record to replicate
     *    @param success of the xml-rpc method
     *    @param ft term in the follower as returned by the replicate call
	 *    @param error describing error if any
     *    @return -1 if a XMl-RPC (network) error occurs, 0 otherwise
     */
	int xmlrpc_replicate_log(int follower_id, LogDBRecord * lr, bool& success,
			unsigned int& ft, std::string& error);

    /**
     *  Calls the request vote xml-rpc method
	 *    @param follower_id to make the call
     *    @param lindex highest last log index
     *    @param lterm highest last log term
     *    @param success of the xml-rpc method
     *    @param ft term in the follower as returned by the replicate call
	 *    @param error describing error if any
     *    @return -1 if a XMl-RPC (network) error occurs, 0 otherwise
     */
    int xmlrpc_request_vote(int follower_id, unsigned int lindex,
            unsigned int lterm, bool& success, unsigned int& fterm,
            std::string& error);

    // -------------------------------------------------------------------------
    // Server related interface
    // -------------------------------------------------------------------------
    /**
     *  Adds a new server to the follower list and starts associated replica
     *  thread.
     *    @param follower_id id of new server
     *    @param xmlep xmlrpc endpoint for new server
     */
	void add_server(int follower_id, const std::string& xmlep);

    /**
     *  Deletes a new server to the follower list and stops associated replica
     *  thread.
     *    @param follower_id id of server
     */
	void delete_server(int follower_id);

    /**
     *  Reset index for a follower.
     *    @param follower_id id of server
     */
	void reset_index(int follower_id);

private:
    friend void * raft_manager_loop(void *arg);

    friend void * reconciling_thread(void *arg);

    /**
     *  Thread id of the main event loop
     */
    pthread_t raft_thread;

    pthread_mutex_t mutex;

    /**
     * Event engine for the RaftManager
     */
    ActionManager am;

    /**
     * Clients waiting for a log replication
     */
    ReplicaRequestMap requests;

    // -------------------------------------------------------------------------
    // Raft state
    // -------------------------------------------------------------------------
    /**
     *  Server state
     */
    State state;

	/**
	 *  Server id
	 */
	int server_id;

    /**
     *  Current term
     */
    unsigned int term;

    /**
     *  Number of servers in zone
     */
    unsigned int num_servers;

	/**
	 *  Time when the last heartbeat was sent (LEADER) or received (FOLLOWER)
	 */
	struct timespec last_heartbeat;

    /**
     *  ID of the last candidate we voted for  ( -1 if none )
     */
    int votedfor;

    /**
     *  ID of leader for the current term
     */
    int leader_id;

    /**
     *  This is the raft persistent state: votedfor and current term. It is
     *  stored along the log in a special record (0, -1 , TEMPLATE, 0)
     */
    Template raft_state;

    /**
     *  After becoming a leader it is replicating and applying any pending
     *  log entry.
     */
    bool reconciling;

    //--------------------------------------------------------------------------
    //  Timers
    //    - timer_period_ms. Base timer to wake up the manager (10ms)
    //    - purge_period_ms. How often the LogDB is purged (600s)
    //    - xmlrpc_timeout. To timeout xml-rpc api calls to replicate log
	//    - election_timeout. Timeout leader heartbeats (followers)
	//    - broadcast_timeout. To send heartbeat to followers (leader)
    //--------------------------------------------------------------------------
    static const time_t timer_period_ms;

    time_t purge_period_ms;

    time_t xmlrpc_timeout_ms;

	struct timespec election_timeout;

	struct timespec broadcast_timeout;

    //--------------------------------------------------------------------------
    // Volatile log index variables
    //   - commit, highest log known to be committed
    //   - applied, highest log applied to DB (in LogDB)
    //
    //---------------------------- LEADER VARIABLES ----------------------------
    //
    //   - next, next log to send to each follower <follower, next>
    //   - match, highest log replicated in this server <follower, match>
	//   - servers, list of servers in zone and xml-rpc edp <follower, edp>
    // -------------------------------------------------------------------------
    RaftReplicaManager replica_manager;

    HeartBeatManager   heartbeat_manager;

    unsigned int commit;

    std::map<int, unsigned int> next;

    std::map<int, unsigned int> match;

    std::map<int, std::string>  servers;

    // -------------------------------------------------------------------------
    // Hooks
    // -------------------------------------------------------------------------

    RaftLeaderHook   * leader_hook;
    RaftFollowerHook * follower_hook;

    // -------------------------------------------------------------------------
    // Action Listener interface
    // -------------------------------------------------------------------------
    /**
     *  Termination function
     */
    void finalize_action(const ActionRequest& ar);

    /**
     *  This function is executed periodically to purge the state log
     */
    void timer_action(const ActionRequest& ar);

	/**
	 *  @param s the state to check
	 *  @return true if the server states matches the provided one
	 */
	bool test_state(State s)
	{
        bool _is_state;

        pthread_mutex_lock(&mutex);

        _is_state = state == s;

        pthread_mutex_unlock(&mutex);

        return _is_state;
	}

    // -------------------------------------------------------------------------
    // Internal Raft functions
    // -------------------------------------------------------------------------
	/**
	 *  Request votes of followers
	 */
    void request_vote();

    /**
     *  Makes this server leader, and start replica threads
     */
    void leader();
};

#endif /*RAFT_MANAGER_H_*/

