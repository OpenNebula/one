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
        DELETE_SERVER
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
private:

    friend void * logdb_manager_loop(void *arg);

    friend void * replication_thread(void *arg);

    /**
     * Event engine for the LogDBManager
     */
    ActionManager am;

    // -------------------------------------------------------------------------
    // Replication thread class
    // -------------------------------------------------------------------------
    class ReplicaThread
    {
    public:
        ReplicaThread(ZoneServer * z):zserver(z)
        {
            pthread_mutex_init(&mutex, 0);

            pthread_cond_init(&cond, 0);
        };

        virtual ~ReplicaThread(){};

        void do_replication();

    private:
        pthread_t thread_id;

        pthread_mutex_t mutex;

        pthread_cond_t cond;

        ZoneServer * zserver;
    };

    // -------------------------------------------------------------------------
    // Action Listener interface
    // -------------------------------------------------------------------------
    void finalize_action(const ActionRequest& ar);

    /**
     *  Start the replication threads, one for each server in the zone
     */
    void start(const ActionRequest& ar);

    /**
     *  Stop the replication threads (leader becomes follower)
     */
    void stop(const ActionRequest& ar);

    /**
     *  Notify threads there is a new log entry to replicate on followers
     */
    void replicate(const ActionRequest& ar);

    /**
     *  Event dispatcher function
     */
    void user_action(const ActionRequest& ar);

};

#endif /*LOG_DB_MANAGER_H_*/

