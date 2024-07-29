/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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

#include "Listener.h"
#include "ReplicaManager.h"
#include "ReplicaRequest.h"
#include "Template.h"
#include "ExecuteHook.h"

class LogDBRecord;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class RaftManager
{
public:
    /**
     *  State of this server
     */
    enum State
    {
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
                const std::string& remotes_location);

    ~RaftManager() = default;

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
    void replicate_allocate(uint64_t rindex)
    {
        requests.allocate(rindex);
    }

    /**
     *  Termination function
     */
    void finalize();

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

    static std::string state_to_str(State _state)
    {
        std::string st;

        switch (_state)
        {
            case SOLO:
                st = "SOLO";
                break;
            case CANDIDATE:
                st = "CANDIDATE";
                break;
            case FOLLOWER:
                st = "FOLLOWER";
                break;
            case LEADER:
                st = "LEADER";
                break;
        }
        return st;
    }

    State get_state()
    {
        std::lock_guard<std::mutex> lock(raft_mutex);

        return state;
    }

    unsigned int get_term()
    {
        std::lock_guard<std::mutex> lock(raft_mutex);

        return term;
    }

    uint64_t get_commit()
    {
        std::lock_guard<std::mutex> lock(raft_mutex);

        return commit;
    }

    /**
     *  Update the commit index = min(leader_commit, log index).
     *  @param leader_commit index sent by leader in a replicate xml-rpc call
     *  @param index of the last record inserted in the database
     *  @return the updated commit index
     */
    uint64_t update_commit(uint64_t leader_commit, uint64_t index);

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

        std::lock_guard<std::mutex> lock(raft_mutex);

        _reconciling = reconciling;

        return _reconciling;
    }

    /**
     *  Get next index to send to the follower
     *    @param follower server id
     *    @return UINT64_MAX on failure, the next index if success
     */
    uint64_t get_next_index(int follower_id)
    {
        uint64_t _index = UINT64_MAX;

        std::lock_guard<std::mutex> lock(raft_mutex);

        auto it = next.find(follower_id);

        if ( it != next.end() )
        {
            _index = it->second;
        }

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
    int xmlrpc_request_vote(int follower_id, uint64_t lindex,
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
    std::mutex raft_mutex;

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
     * Value for name column in system_attributes table for raft state.
     */
    static const std::string raft_state_name;

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

    /**
     *  Timer action async execution
     */
    Timer timer_thread;

    Timer purge_thread;

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

    uint64_t commit;

    std::map<int, uint64_t> next;

    std::map<int, uint64_t> match;

    std::map<int, std::string>  servers;

    // -------------------------------------------------------------------------
    // Hooks
    // -------------------------------------------------------------------------

    std::unique_ptr<ExecuteHook> leader_hook;
    std::unique_ptr<ExecuteHook> follower_hook;

    // -------------------------------------------------------------------------
    // Internal Raft functions
    // -------------------------------------------------------------------------
    /**
     *  This function is executed periodically to vote leader
     */
    void timer_action();

    /**
     *  This function is executed periodically to purge the state log
     */
    void purge_action();

    /**
     *  @param s the state to check
     *  @return true if the server states matches the provided one
     */
    bool test_state(State s)
    {
        bool _is_state;

        std::lock_guard<std::mutex> lock(raft_mutex);

        _is_state = state == s;

        return _is_state;
    }

    /**
     *  Request votes of followers
     */
    void request_vote();

    /**
     *  Makes this server leader, and start replica threads
     */
    void leader();

    /**
     * Init the raft state status row.
     */
    int init_raft_state(const std::string& raft_xml);
};

#endif /*RAFT_MANAGER_H_*/

