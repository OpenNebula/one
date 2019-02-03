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

#ifndef ACTION_MANAGER_H_
#define ACTION_MANAGER_H_

#include <queue>
#include <pthread.h>
#include <ctime>
#include <string>

/**
 *  Represents a generic request, pending actions are stored in a queue.
 *  Each element stores the base action type, additional data is added by each
 *  ActionListener implementation.
 */
class ActionRequest
{
public:
    /**
     *  Base Action types
     */
    enum Type
    {
        FINALIZE,
        TIMER,
        USER
    };

    Type type() const
    {
        return _type;
    }

    ActionRequest(Type __type): _type(__type){};

    virtual ~ActionRequest(){};

    virtual ActionRequest * clone() const
    {
        return new ActionRequest(_type);
    }

protected:
    Type _type;
};

/**
 * ActionListener class. Interface to be implemented by any class that need to
 * handle actions.
 */
class ActionListener
{
protected:
    ActionListener(){};

    virtual ~ActionListener(){};

    /**
     *  the user_action() function is executed upon action arrival.
     *  This function should check the action type, and perform the
     *  corresponding action.
     *    @param ar the ActionRequest
     */
    virtual void user_action(const ActionRequest& ar){};

    /**
     *  Periodic timer action, executed each time the time_out expires. Listener
     *  needs to re-implement the default timer action if needed.
     *    @param ar the ActionRequest
     */
    virtual void timer_action(const ActionRequest& ar){};

    /**
     *  Action executed when the Manager finlizes. Listener needs to re-implement
     *  the default action if needed.
     *    @param ar the ActionRequest
     */
    virtual void finalize_action(const ActionRequest& ar){};

private:
    friend class ActionManager;

    /**
     *  Invoke the action handler
     */
    void _do_action(const ActionRequest& ar)
    {
        switch(ar.type())
        {
            case ActionRequest::FINALIZE:
                finalize_action(ar);
                break;

            case ActionRequest::TIMER:
                timer_action(ar);
                break;

            case ActionRequest::USER:
                user_action(ar);
                break;
        }
    }
};


/**
 *  ActionManager. Provides action support for a class implementing
 *  the ActionListener interface.
 */
class ActionManager
{
public:

    ActionManager();

    virtual ~ActionManager();

    /**
     *  Function to trigger an action to this manager.
     *    @param action the action name
     *    @param args arguments for the action
     */
    void trigger(const ActionRequest& ar);

    /**
     *  Trigger the FINALIZE event
     */
    void finalize()
    {
        ActionRequest frequest(ActionRequest::FINALIZE);

        trigger(frequest);
    }

    /**
     * The calling thread will be suspended until an action is triggered.
     *   @param timeout for the periodic action.
     *   @param timer_args arguments for the timer action
     */
    void loop(struct timespec& _timeout, const ActionRequest& trequest);

    void loop(time_t timeout, const ActionRequest& trequest)
    {
        struct timespec _timeout;

        _timeout.tv_sec  = timeout;
        _timeout.tv_nsec = 0;

        loop(_timeout, trequest);
    }

    /**
     * The calling thread will be suspended until an action is triggered.
     *   @param timeout for the periodic action, the timer action will recieve
     *   an "empty" ActionRequest.
     */
    void loop(time_t timeout)
    {
        ActionRequest trequest(ActionRequest::TIMER);

        struct timespec _timeout;

        _timeout.tv_sec  = timeout;
        _timeout.tv_nsec = 0;

        loop(_timeout, trequest);
    }

    void loop(struct timespec& _timeout)
    {
        ActionRequest trequest(ActionRequest::TIMER);

        loop(_timeout, trequest);
    }

    /**
     * The calling thread will be suspended until an action is triggered. No
     * periodic action is defined.
     */
    void loop()
    {
        ActionRequest trequest(ActionRequest::TIMER);
        struct timespec _timeout;

        _timeout.tv_sec  = 0;
        _timeout.tv_nsec = 0;

        loop(_timeout, trequest);
    }

    /**
     *   Register the calling object in this action manager.
     *      @param listener a pointer to the action listner
     */
    void addListener(ActionListener *  listener)
    {
        this->listener = listener;
    };

private:
    /**
     *  Queue of pending actions, processed in a FIFO manner
     */
    std::queue<ActionRequest *> actions;

    /**
     *  Action synchronization is implemented using the pthread library,
     *  with condition variable and its associated mutex
     */
    pthread_mutex_t mutex;
    pthread_cond_t  cond;

    /**
     *  The listener notified by this manager
     */
    ActionListener * listener;

    /**
     *  Function to lock the Manager mutex
     */
    void lock()
    {
        pthread_mutex_lock(&mutex);
    };

    /**
     *  Function to unlock the Manager mutex
     */
    void unlock()
    {
        pthread_mutex_unlock(&mutex);
    };

};

#endif /*ACTION_MANAGER_H_*/
