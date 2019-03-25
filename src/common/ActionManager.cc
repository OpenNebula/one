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

#include "ActionManager.h"
#include <ctime>
#include <errno.h>

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
    while (!actions.empty())
    {
        delete actions.front();
        actions.pop();
    }

    pthread_mutex_destroy(&mutex);

    pthread_cond_destroy(&cond);
}

/* ************************************************************************** */
/* NeActionManager public interface                                           */
/* ************************************************************************** */

void ActionManager::trigger(const ActionRequest& ar )
{
    lock();

    actions.push(ar.clone());

    pthread_cond_signal(&cond);

    unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static void set_timeout(struct timespec& timeout, struct timespec& _tout)
{
    clock_gettime(CLOCK_REALTIME, &timeout);

    timeout.tv_sec  += _tout.tv_sec;
    timeout.tv_nsec += _tout.tv_nsec;

    while ( timeout.tv_nsec >= 1000000000 )
    {
        timeout.tv_sec  += 1;
        timeout.tv_nsec -= 1000000000;
    }
}

void ActionManager::loop(struct timespec& _tout, const ActionRequest& trequest)
{
    struct timespec timeout;

    int finalize = 0;
    int rc;

    ActionRequest * action;

    set_timeout(timeout, _tout);

    //Action Loop, end when a finalize action is triggered to this manager
    while (finalize == 0)
    {
        lock();

        while ( actions.empty() == true )
        {
            if ( _tout.tv_sec != 0 || _tout.tv_nsec != 0 )
            {
                rc = pthread_cond_timedwait(&cond, &mutex, &timeout);

                if ( rc == ETIMEDOUT )
                    actions.push(trequest.clone());
            }
            else
                pthread_cond_wait(&cond,&mutex);
        }

        action = actions.front();
        actions.pop();

        unlock();

        listener->_do_action(*action);

        switch(action->type())
        {
            case ActionRequest::TIMER:
                set_timeout(timeout, _tout);
            break;

            case ActionRequest::FINALIZE:
                finalize = 1;
            break;

            default:
            break;
        }

        delete action;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
