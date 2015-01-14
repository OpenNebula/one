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

#include "ActionManager.h"
#include <ctime>
#include <cerrno>

/* ************************************************************************** */
/* NeActionManager constants                                                  */
/* ************************************************************************** */

const string ActionListener::ACTION_TIMER = string("ACTION_TIMER");
const string ActionListener::ACTION_FINALIZE = string("ACTION_FINALIZE");

/* ************************************************************************** */
/* NeActionManager constructor & destructor                                   */
/* ************************************************************************** */

ActionManager::ActionManager():
        actions(),
        listener(0)
{
    pthread_mutex_init(&mutex,0);

    pthread_cond_init(&cond,0);
}

/* -------------------------------------------------------------------------- */

ActionManager::~ActionManager()
{
    unlock();

    pthread_mutex_destroy(&mutex);

    pthread_cond_destroy(&cond);
}

/* ************************************************************************** */
/* NeActionManager public interface                                           */
/* ************************************************************************** */

void ActionManager::trigger(
    const string    &action,
    void *          arg)
{
    ActionRequest   request(action,arg);

    lock();

    actions.push(request);

    pthread_cond_signal(&cond);

    unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ActionManager::loop(
    time_t      timer,
    void *      timer_args)
{
    struct timespec     timeout;
    int                 finalize = 0;
    int                 rc;

    ActionRequest       action;
    ActionRequest       trequest(ActionListener::ACTION_TIMER,timer_args);

    timeout.tv_sec  = time(NULL) + timer;
    timeout.tv_nsec = 0;

    //Action Loop, end when a finalize action is triggered to this manager
    while (finalize == 0)
    {
        lock();

        while ( actions.empty() == true )
        {
            if ( timer != 0 )
            {
                rc = pthread_cond_timedwait(&cond,&mutex, &timeout);

                if ( rc == ETIMEDOUT )
                    actions.push(trequest);
            }
            else
                pthread_cond_wait(&cond,&mutex);
        }

        action = actions.front();
        actions.pop();

        unlock();
        
        listener->do_action(action.name,action.args);

        if ( action.name == ActionListener::ACTION_TIMER )
        {
            timeout.tv_sec  = time(NULL) + timer;
            timeout.tv_nsec = 0;
        }
        else if ( action.name == ActionListener::ACTION_FINALIZE )
        {
            finalize = 1;
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
