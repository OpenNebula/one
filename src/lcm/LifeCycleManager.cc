/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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

#include "LifeCycleManager.h"
#include "NebulaLog.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" void * lcm_action_loop(void *arg)
{
    LifeCycleManager *  lcm;

    if ( arg == 0 )
    {
        return 0;
    }

    lcm = static_cast<LifeCycleManager *>(arg);

    NebulaLog::log("LCM",Log::INFO,"Life-cycle Manager started.");

    lcm->am.loop(0,0);

    NebulaLog::log("LCM",Log::INFO,"Life-cycle Manager stopped.");

    return 0;
}

/* -------------------------------------------------------------------------- */

int LifeCycleManager::start()
{
    int               rc;
    pthread_attr_t    pattr;

    pthread_attr_init (&pattr);
    pthread_attr_setdetachstate (&pattr, PTHREAD_CREATE_JOINABLE);

    NebulaLog::log("LCM",Log::INFO,"Starting Life-cycle Manager...");

    rc = pthread_create(&lcm_thread,&pattr,lcm_action_loop,(void *) this);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger(Actions action, int _vid)
{
    int *   vid;
    string  aname;

    vid = new int(_vid);

    switch (action)
    {
    case SAVE_SUCCESS:
        aname = "SAVE_SUCCESS";
        break;

    case SAVE_FAILURE:
        aname = "SAVE_FAILURE";
        break;

    case DEPLOY_SUCCESS:
        aname = "DEPLOY_SUCCESS";
        break;

    case DEPLOY_FAILURE:
        aname = "DEPLOY_FAILURE";
        break;

    case SHUTDOWN_SUCCESS:
        aname = "SHUTDOWN_SUCCESS";
        break;

    case SHUTDOWN_FAILURE:
        aname = "SHUTDOWN_FAILURE";
        break;

    case CANCEL_SUCCESS:
        aname = "CANCEL_SUCCESS";
        break;

    case CANCEL_FAILURE:
        aname = "CANCEL_FAILURE";
        break;

    case MONITOR_FAILURE:
        aname = "MONITOR_FAILURE";
        break;

    case MONITOR_SUSPEND:
        aname = "MONITOR_SUSPEND";
        break;

    case MONITOR_DONE:
        aname = "MONITOR_DONE";
        break;

    case PROLOG_SUCCESS:
        aname = "PROLOG_SUCCESS";
        break;

    case PROLOG_FAILURE:
        aname = "PROLOG_FAILURE";
        break;

    case EPILOG_SUCCESS:
        aname = "EPILOG_SUCCESS";
        break;

    case EPILOG_FAILURE:
        aname = "EPILOG_FAILURE";
        break;

    case DEPLOY:
        aname = "DEPLOY";
        break;

    case SUSPEND:
        aname = "SUSPEND";
        break;

    case RESTORE:
        aname = "RESTORE";
        break;

    case STOP:
        aname = "STOP";
        break;

    case CANCEL:
        aname = "CANCEL";
        break;

    case MIGRATE:
        aname = "MIGRATE";
        break;

    case LIVE_MIGRATE:
        aname = "LIVE_MIGRATE";
        break;

    case SHUTDOWN:
        aname = "SHUTDOWN";
        break;

    case RESTART:
        aname = "RESTART";
        break;

    case DELETE:
        aname = "DELETE";
        break;

    case CLEAN:
        aname = "CLEAN";
        break;

    case FINALIZE:
        aname = ACTION_FINALIZE;
        break;

    default:
        delete vid;
        return;
    }

    am.trigger(aname,vid);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::do_action(const string &action, void * arg)
{
    int             vid;
    ostringstream   oss;

    if (arg == 0)
    {
        return;
    }

    vid  = *(static_cast<int *>(arg));

    delete static_cast<int *>(arg);

    if (action == "SAVE_SUCCESS")
    {
        save_success_action(vid);
    }
    else if (action == "SAVE_FAILURE")
    {
        save_failure_action(vid);
    }
    else if (action == "DEPLOY_SUCCESS")
    {
        deploy_success_action(vid);
    }
    else if (action == "DEPLOY_FAILURE")
    {
        deploy_failure_action(vid);
    }
    else if (action == "SHUTDOWN_SUCCESS")
    {
        shutdown_success_action(vid);
    }
    else if (action == "SHUTDOWN_FAILURE")
    {
        shutdown_failure_action(vid);
    }
    else if (action == "CANCEL_SUCCESS")
    {
        cancel_success_action(vid);
    }
    else if (action == "CANCEL_FAILURE")
    {
        cancel_failure_action(vid);
    }
    else if (action == "MONITOR_FAILURE")
    {
        monitor_failure_action(vid);
    }
    else if (action == "MONITOR_SUSPEND")
    {
        monitor_suspend_action(vid);
    }
    else if (action == "MONITOR_DONE")
    {
        monitor_done_action(vid);
    }
    else if (action == "PROLOG_SUCCESS")
    {
        prolog_success_action(vid);
    }
    else if (action == "PROLOG_FAILURE")
    {
        prolog_failure_action(vid);
    }
    else if (action == "EPILOG_SUCCESS")
    {
        epilog_success_action(vid);
    }
    else if (action == "EPILOG_FAILURE")
    {
        epilog_failure_action(vid);
    }
    else if (action == "DEPLOY")
    {
        deploy_action(vid);
    }
    else if (action == "SUSPEND")
    {
        suspend_action(vid);
    }
    else if (action == "RESTORE")
    {
        restore_action(vid);
    }
    else if (action == "STOP")
    {
        stop_action(vid);
    }
    else if (action == "CANCEL")
    {
        cancel_action(vid);
    }
    else if (action == "MIGRATE")
    {
        migrate_action(vid);
    }
    else if (action == "LIVE_MIGRATE")
    {
        live_migrate_action(vid);
    }
    else if (action == "SHUTDOWN")
    {
        shutdown_action(vid);
    }
    else if (action == "RESTART")
    {
        restart_action(vid);
    }
    else if (action == "DELETE")
    {
        delete_action(vid);
    }
    else if (action == "CLEAN")
    {
        clean_action(vid);
    }
    else if (action == ACTION_FINALIZE)
    {
        NebulaLog::log("LCM",Log::INFO,"Stopping Life-cycle Manager...");
    }
    else
    {
        ostringstream oss;
        oss << "Unknown action name: " << action;

        NebulaLog::log("LCM", Log::ERROR, oss);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
