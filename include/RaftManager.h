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

#ifndef RAFT_MANAGER_H_
#define RAFT_MANAGER_H_

#include "ActionManager.h"
#include "ReplicaManager.h"
#include "ReplicaRequest.h"

extern "C" void * raft_manager_loop(void *arg);

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class RaftAction : public ActionRequest
{
public:
    enum Actions
    {
        LEADER,           /**< Makes this server leader */
        FOLLOWER,         /**< Makes this server follower */
        REPLICATE_LOG,    /**< Replicate a log record on followers */
        REPLICATE_SUCCESS,/**< Follower successfully replicated entry */
        REPLICATE_FAILURE /**< Follower failed to replicate (same term) */
    };

    RaftAction(Actions a, ReplicaRequest * rrequest):
        ActionRequest(ActionRequest::USER), _action(a), _id(-1),
        _rrequest(rrequest){};

    RaftAction(Actions a, unsigned int id):
        ActionRequest(ActionRequest::USER), _action(a), _id(id), _rrequest(0){};

    RaftAction(const RaftAction& o):ActionRequest(o._type),
        _action(o._action), _id(o._id), _rrequest(o._rrequest){};

    Actions action() const
    {
        return _action;
    }

    ActionRequest * clone() const
    {
        return new RaftAction(*this);
    }

    unsigned int id() const
    {
        return _id;
    }

    ReplicaRequest * request() const
    {
        return _rrequest;
    }

private:
    Actions _action;  /**< Type of action */

    unsigned int _id; /**< Id of the resource associated to the Action  */

    ReplicaRequest * _rrequest; /**< Pointer to replica request */
};

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

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

    RaftManager(bool solo):term(0), commit(0), applied(0)
    {
        if ( solo )
        {
            state = SOLO;
        }
        else
        {
            state = FOLLOWER;
        }

        am.addListener(this);
    };

    virtual ~RaftManager(){};

    // -------------------------------------------------------------------------
    // Raft associated events
    // -------------------------------------------------------------------------
    /**
     *  Triggers a REPLICATE_SUCCESS event, when a follower successfully
     *  replicated a log entry.
     */
    void replicate_success_trigger(unsigned int follower_id)
    {
        RaftAction ra(RaftAction::REPLICATE_SUCCESS, follower_id);

        am.trigger(ra);
    }

    /**
     *  Triggers a REPLICATE_FAILURE event, when a follower failed to replicate
     *  a log entry (but follower_term <= current_term).
     *  notify the client if a majority of followers replicated this  record.
     */
    void replicate_failure_trigger(unsigned int follower_id)
    {
        RaftAction ra(RaftAction::REPLICATE_FAILURE, follower_id);

        am.trigger(ra);
    }

    /**
     *  Triggers a REPLICATE event, it will notify the replica threads to
     *  send the log to the followers
     */
    void replicate_log_trigger(ReplicaRequest * rr)
    {
        RaftAction ra(RaftAction::REPLICATE_LOG, rr);

        am.trigger(ra);
    }

    /**
     *  Makes this server leader, and start replica threads
     */
    void leader_trigger(unsigned int term)
    {
        RaftAction ra(RaftAction::LEADER, term);

        am.trigger(ra);
    }

    /**
     *  Makes this server follower. Stop associated replication facilities
     */
    void follower_trigger(unsigned int term)
    {
        RaftAction ra(RaftAction::FOLLOWER, term);

        am.trigger(ra);
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
     *  @return true if the server is the leader of the zone
     */
    bool is_leader()
    {
        bool _leader;

        pthread_mutex_lock(&mutex);

        _leader = state == LEADER;

        pthread_mutex_unlock(&mutex);

        return _leader;
    }

    /**
     *  @return true if the server is the leader of the zone
     */
    bool is_solo()
    {
        bool _solo;

        pthread_mutex_lock(&mutex);

        _solo = state == SOLO;

        pthread_mutex_unlock(&mutex);

        return _solo;
    }

    /**
     *  Get next index to send to the follower
     *    @param follower server id
     *    @return -1 on failure, the next index if success
     */
    int get_next_index(unsigned int follower_id)
    {
        std::map<unsigned int, unsigned int>::iterator it;
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

private:
    friend void * raft_manager_loop(void *arg);

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
    std::map<unsigned int, ReplicaRequest *> requests;

    // -------------------------------------------------------------------------
    // Raft state
    // -------------------------------------------------------------------------
    /**
     *  Server state
     */
    State state;

    /**
     *  Current term
     */
    unsigned int term;

    //--------------------------------------------------------------------------
    // Volatile log index variables
    //   - commit, highest log known to be committed
    //   - applied, highest log applied to DB
    //
    //---------------------------- LEADER VARIABLES ----------------------------
    //
    //   - next, next log to send to each follower <follower, next>
    //   - match, highest log replicated in this server <follower, match>
    // -------------------------------------------------------------------------
    ReplicaManager replica_manager;

    unsigned int commit;

    unsigned int applied;

    std::map<unsigned int, unsigned int> next;

    std::map<unsigned int, unsigned int> match;

    // -------------------------------------------------------------------------
    // Action Listener interface
    // -------------------------------------------------------------------------
    /**
     *  Event dispatcher function
     */
    void user_action(const ActionRequest& ar);

    /**
     *  Termination function
     */
    void finalize_action(const ActionRequest& ar);

    // -------------------------------------------------------------------------
    // RaftManager actions
    // -------------------------------------------------------------------------
    void leader_action(const RaftAction& ra);

    void follower_action(const RaftAction& ra);

    void replicate_log_action(const RaftAction& ra);

    // ---------------------------------------------------------
    // Log entry replicated on follower
    // - Increment next entry to send to follower
    // - Update match entry on follower
    // - Evaluate majority to apply changes to DB
    // ---------------------------------------------------------
    void replicate_success_action(const RaftAction& ra);

    void replicate_failure_action(const RaftAction& ra);
};

#endif /*RAFT_MANAGER_H_*/

/*

                    zone = zpool->get(zone_id, true);

                    if ( zone == 0 )
                    {
                        continue;
                    }

                    ZoneServer * follower = zone->get_server(follower_id);
                    ZoneServer * leader   = zone->get_server(leader_id);

                    if ( follower == 0 )
                    {
                        zone->unlock();

                        continue;
                    }

                    follower->inc_next();

                    follower->set_match(id);

                    if ( leader->get_applied() > follower->get_next() )
                    {
                        _pending_requests = true;
                    }

                    zone->unlock();

                    LogDBRequest * lr = logdb->get_request(id);

                    if ( lr == 0 )
                    {
                        oss.str("");

                        lr->lock();

                        oss << "Log entry " << id << "-" << term << "replicated"
                            << " on server: " << follower_id << ". Total "
                            << "replicas: " << lr->replicas() << " Replicas to "
                            << "majority: " << lr->to_commit();

                        lr->replicated();

                        lr->unlock();
                    }
                }
                else
                {
                    int follower_term = xmlrpc_c::value_boolean(values[1]);

                    if ( follower_term > term )
                    {
                        //------------------------------------------------------
                        // Convert to follower
                        //   - Update term
                        //   - Set state to follower
                        //   - Stop replica threads
                        //------------------------------------------------------
                        ostringstream ess;

                        ess << "Detected a higher term on follower: "
                            << follower_id << " giving up leadership";

                        NebulaLog::log("DBM", Log::WARNING, ess);
                    }
                    else
                    {
                        //------------------------------------------------------
                        // Log inconsistency in follower
                        //   - Decrease follower index
                        //   - Retry (do not wait for replica events)
                        //------------------------------------------------------
                        ostringstream ess;

                        ess << "Log inconsistency detected on follower: "
                            << follower_id;

                        NebulaLog::log("DBM", Log::WARNING, ess);

                        zone = zpool->get(zone_id, true);

                        if ( zone == 0 )
                        {
                            continue;
                        }

                        ZoneServer * follower = zone->get_server(follower_id);

                        if ( follower == 0 )
                        {
                            zone->unlock();

                            continue;
                        }

                        follower->dec_next();

                        zone->unlock();

                        _pending_requests = true;
                    }
                }
            }
            else //RPC failed, will retry on next replication request
            {
                ostringstream ess;

                xmlrpc_c::fault failure = rpc_client.getFault();

                ess << "Error replicating log entry " << id << "-" << term
                    << " on follower " << follower_id << ": "
                    << failure.getDescription();

                NebulaLog::log("DBM", Log::ERROR, ess);
            }
        }
        catch (exception const& e)
        {
            ostringstream  ess;

            ess << "Error replicating log entry " << id << "-" << term
                << " on follower " << follower_id << ": " << e.what();

            NebulaLog::log("DBM", Log::ERROR, ess);

            continue;
        }






    std::map<unsigned int, LogDBRequest *>::iterator it;

    for ( it = requests.begin(); it != requests.end(); ++it )
    {
        delete it->second;
    }

LogDBRecord * LogDB::get_logrecord(unsigned int index);
LogDBRequest * LogDB::get_request(unsigned int index)
{
    std::map<unsigned int, LogDBRequest *>::iterator it;

    LogDBRequest * req = 0;

    pthread_mutex_lock(&mutex);

    it = requests.find(index);

    if ( it != requests.end() )
    {
        req = it->second;
    }

    pthread_mutex_unlock(&mutex);

    if ( req == 0  )
    {
        LogDBRequest * req = select(index);

        if ( req != 0 )
        {
            pthread_mutex_lock(&mutex);

            requests.insert(std::make_pair(index, req));

            pthread_mutex_unlock(&mutex);
        }
    }

    return req;
}

  */
