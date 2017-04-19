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
#include "LogDBRecord.h"
#include "ZoneServer.h"

extern "C" void * logdb_manager_loop(void *arg);

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class LogDBAction : public ActionRequest
{
public:
    enum Actions
    {
        NEW_LOGDB_RECORD,
        DELETE_SERVER
    }

    LogDBAction(Actions a, LogDBRequest * r):ActionRequest(ActionRequest::USER),
        _action(a), _request(r){};

    LogDBAction(const LogDBAction& o):ActionRequest(o._type),
        _action(o._action), _request(o._request){};

    Actions action() const
    {
        return _action;
    }

    LogDBRequest * request() const
    {
        return _request;
    }

    ActionRequest * clone() const
    {
        return new LogDBAction(*this);
    }

private:
    Action _action;

    LogDBRequest * _request;
};

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

class LogDBManager : public ActionListener
{
private:
    class LogDBManagerThread
    {
    public:
        LogDBManagerThread(ZoneServer * z):replicate(false), zserver(z)
        {
            pthread_mutex_init(&mutex, 0);

            pthread_cond_init(&cond, 0);
        };

        virtual ~LogDBManagerThread(){};

        void do_replication();

    private:
        pthread_t thread_id;

        pthread_mutex_t mutex;

        pthread_cond_t cond;

        bool replicate;

        ZoneServer * zserver;
    }

    /**
     *  LogDB records being replicated on followers
     */
    std::map<unsigned int, LogDBRecord *> log;

    // -------------------------------------------------------------------------
    // Action Listener interface
    // -------------------------------------------------------------------------
    void finalize_action(const ActionRequest& ar)
    {
        NebulaLog::log("DBM",Log::INFO,"Stopping LogDB Manager...");
    };

    void user_action(const ActionRequest& ar);
}


#endif /*LOG_DB_H_*/

