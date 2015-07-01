/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

using namespace std;


/**
 * ActionListener class. Interface to be implemented by any class
 * that need to handle actions. There are two predefined actions
 * (each action is identified with its name, a string):
 *   - ACTION_TIMER, periodic action
 *   - ACTION_FINALIZE, to finalize the action loop
 */

class ActionListener
{
public:

    /**
     * Predefined string to refer to the periodic action
     */
    static const string ACTION_TIMER;

    /**
     * Predefined string to refer to the finalize action
     */
    static const string ACTION_FINALIZE;

    ActionListener(){};

    virtual ~ActionListener(){};

    /**
     *  the do_action() function is executed upon action arrival.
     *  This function should check the action type, and perform the
     *  corresponding action.
     *    @param name the action name
     *    @param args action arguments
     */
    virtual void do_action(const string &name, void *args) = 0;
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

    /** Function to trigger an action to this manager.
     *    @param action the action name
     *    @param args arguments for the action
     */
    void trigger(
        const string        &action,
        void *              args);

    /** The calling thread will be suspended until an action is triggeed.
     *    @param timeout for the periodic action. Use 0 to disable the timer.
     *    @param timer_args arguments for the timer action
     */
    void loop(
        time_t              timeout,
        void *              timer_args);

    /** Register the calling object in this action manager.
     *    @param listener a pointer to the action listner
     */
    void addListener(
        ActionListener *  listener)
    {
        this->listener = listener;
    };

private:

    /**
     *  Implementation class, pending actions are stored in a queue.
     *  Each element stores the action name and its arguments
     */
    struct ActionRequest
    {
        string  name;
        void *  args;

        ActionRequest(
            const string    &aname = "",
            void *          aargs  = 0):
                name(aname),
                args(aargs){};
    };

    /**
     *  Queue of pending actions, processed in a FIFO manner
     */
    queue<ActionRequest>    actions;

    /**
     *  Action synchronization is implemented using the pthread library,
     *  with condition variable and its associated mutex
     */
    pthread_mutex_t         mutex;
    pthread_cond_t          cond;

    /**
     *  The listener notified by this manager
     */
    ActionListener *        listener;

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
