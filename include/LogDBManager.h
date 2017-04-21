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

#ifndef LOG_DB_MANAGER_H_
#define LOG_DB_MANAGER_H_

#include <xmlrpc-c/client.hpp>

#include "ActionManager.h"
#include "ZoneServer.h"

extern "C" void * logdb_manager_loop(void *arg);

extern "C" void * replication_thread(void *arg);

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class LogDBAction : public ActionRequest
{
public:
    enum Actions
    {
        START,
        STOP,
        REPLICATE,
        DELETE_SERVER,
        ADD_SERVER
    };

    LogDBAction(Actions a):ActionRequest(ActionRequest::USER), _action(a){};

    LogDBAction(const LogDBAction& o):ActionRequest(o._type),
        _action(o._action){};

    Actions action() const
    {
        return _action;
    }

    ActionRequest * clone() const
    {
        return new LogDBAction(*this);
    }

private:
    Actions _action;
};

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

class LogDBManager : public ActionListener
{
public:
    LogDBManager(){};

    virtual ~LogDBManager(){};

    /**
     *  Triggers specific actions to the LogDBManager
     *    @param action to trigger in the manager
     */
    void trigger(LogDBAction::Actions action)
    {
        LogDBAction log_action(action);

        am.trigger(log_action);
    }

private:
    friend void * logdb_manager_loop(void *arg);

    friend void * replication_thread(void *arg);

    /**
     * Event engine for the LogDBManager
     */
    ActionManager am;

    /**
     *  Servers in the zone, managed by Zone::add/delete_server
     */
    ZoneServers * servers;

    // -------------------------------------------------------------------------
    // Replication thread class & pool
    // -------------------------------------------------------------------------
    class ReplicaThread
    {
    public:
        ReplicaThread(ZoneServer * server, ZoneServer * leader);

        virtual ~ReplicaThread(){};

        void do_replication();

        void finalize();

        pthread_t * thread_id()
        {
            return &_thread_id;
        }

    private:
        friend void * replication_thread(void *arg);

        // ---------------------------------------------------------------------
        // pthread synchronization variables
        // ---------------------------------------------------------------------
        pthread_t _thread_id;

        pthread_mutex_t mutex;

        pthread_cond_t cond;

        bool _finalize;

        // ---------------------------------------------------------------------
        // Information of the replication target server and leader
        // ---------------------------------------------------------------------
        ZoneServer * server;

        ZoneServer * leader;

        // ---------------------------------------------------------------------
        // XML-RPC client variables to talk with this server
        // ---------------------------------------------------------------------
        xmlrpc_c::clientXmlTransport_curl transport;

        xmlrpc_c::client_xml client;

        static const std::string replica_method;
    };

    std::map<int, ReplicaThread *> thread_pool;

    ReplicaThread * get_thread(int server_id)
    {
        std::map<int, ReplicaThread *>::iterator it;

        it = thread_pool.find(server_id);

        if ( it == thread_pool.end() )
        {
            return 0;
        }

        return it->second;
    }

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
    // LogDBManager actions
    // -------------------------------------------------------------------------
    /**
     *  Start the replication threads, one for each server in the zone
     */
    void start_action();

    /**
     *  Stop the replication threads (leader becomes follower)
     */
    void stop_action();

    /**
     *  Notify threads there is a new log entry to replicate on followers
     */
    void replicate_action();

    /**
     *
     */
    void delete_server_action();

};

#endif /*LOG_DB_MANAGER_H_*/

