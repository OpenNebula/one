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

extern "C" void * raft_manager_loop(void *arg);

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class RaftAction : public ActionRequest
{
public:
    enum Actions
    {
        LEADER,
        FOLLOWER
    };

    RaftAction(Actions a):ActionRequest(ActionRequest::USER), _action(a){};

    RaftAction(const RaftAction& o):ActionRequest(o._type),
        _action(o._action){};

    Actions action() const
    {
        return _action;
    }

    ActionRequest * clone() const
    {
        return new RaftAction(*this);
    }

private:
    Actions _action;
};

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

class RaftManager : public ActionListener
{
public:
    RaftManager(){};

    virtual ~RaftManager(){};

    /**
     *  Triggers specific actions to the LogDBManager
     *    @param action to trigger in the manager
     */
    void trigger(RaftAction::Actions action)
    {
        RaftAction log_action(action);

        am.trigger(log_action);
    }

    void finalize()
    {
        am.finalize();
    }

    int start();

    pthread_t get_thread_id() const
    {
        return raft_thread;
    };

private:
    friend void * raft_manager_loop(void *arg);

    pthread_t raft_thread;

    /**
     * Event engine for the RaftManager
     */
    ActionManager am;

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
    /**
     *  Make this server leader
     */
    void leader_action();

    /**
     *  Make this server follower
     */
    void follower_action();
};

#endif /*RAFT_MANAGER_H_*/

