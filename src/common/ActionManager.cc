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

#include "ActionManager.h"
#include <ctime>

/* ************************************************************************** */
/* ActionManager constructor & destructor                                   */
/* ************************************************************************** */

ActionManager::ActionManager(): listener(0)
{
    pthread_mutex_init(&mutex,0);

    pthread_cond_init(&cond,0);
}

/* -------------------------------------------------------------------------- */

ActionManager::~ActionManager()
{
    pthread_mutex_destroy(&mutex);

    pthread_cond_destroy(&cond);
}

/* ************************************************************************** */
/* NeActionManager public interface                                           */
/* ************************************************************************** */

void ActionManager::trigger(const ActionRequest& ar )
{
    lock();

    actions.push(ar);

    pthread_cond_signal(&cond);

    unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ActionManager::loop(time_t timer, const ActionRequest& trequest)
{
    struct timespec timeout;

    int finalize = 0;
    int rc;

    ActionRequest action;

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

        listener->_do_action(action);

        switch(action.type())
        {
            case ActionRequest::TIMER:
                timeout.tv_sec  = time(NULL) + timer;
                timeout.tv_nsec = 0;
            break;

            case ActionRequest::FINALIZE:
                finalize = 1;
            break;

            default:
            break;
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
