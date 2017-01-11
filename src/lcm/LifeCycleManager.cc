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

#include "LifeCycleManager.h"
#include "Nebula.h"
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

void LifeCycleManager::init_managers()
{
    Nebula& nd = Nebula::instance();

    tm      = nd.get_tm();
    vmm     = nd.get_vmm();
    dm      = nd.get_dm();
    imagem  = nd.get_imagem();

    vmpool = nd.get_vmpool();
    hpool  = nd.get_hpool();
    ipool  = nd.get_ipool();
    sgpool = nd.get_secgrouppool();
    clpool = nd.get_clpool();
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

    case MONITOR_SUSPEND:
        aname = "MONITOR_SUSPEND";
        break;

    case MONITOR_DONE:
        aname = "MONITOR_DONE";
        break;

    case MONITOR_POWEROFF:
        aname = "MONITOR_POWEROFF";
        break;

    case MONITOR_POWERON:
        aname = "MONITOR_POWERON";
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

    case ATTACH_SUCCESS:
        aname = "ATTACH_SUCCESS";
        break;

    case ATTACH_FAILURE:
        aname = "ATTACH_FAILURE";
        break;

    case DETACH_SUCCESS:
        aname = "DETACH_SUCCESS";
        break;

    case DETACH_FAILURE:
        aname = "DETACH_FAILURE";
        break;

    case SAVEAS_SUCCESS:
        aname = "SAVEAS_SUCCESS";
        break;

    case SAVEAS_FAILURE:
        aname = "SAVEAS_FAILURE";
        break;

    case ATTACH_NIC_SUCCESS:
        aname = "ATTACH_NIC_SUCCESS";
        break;

    case ATTACH_NIC_FAILURE:
        aname = "ATTACH_NIC_FAILURE";
        break;

    case DETACH_NIC_SUCCESS:
        aname = "DETACH_NIC_SUCCESS";
        break;

    case DETACH_NIC_FAILURE:
        aname = "DETACH_NIC_FAILURE";
        break;

    case CLEANUP_SUCCESS:
        aname = "CLEANUP_SUCCESS";
        break;

    case CLEANUP_FAILURE:
        aname = "CLEANUP_FAILURE";
        break;

    case SNAPSHOT_CREATE_SUCCESS:
        aname = "SNAPSHOT_CREATE_SUCCESS";
        break;

    case SNAPSHOT_CREATE_FAILURE:
        aname = "SNAPSHOT_CREATE_FAILURE";
        break;

    case SNAPSHOT_REVERT_SUCCESS:
        aname = "SNAPSHOT_REVERT_SUCCESS";
        break;

    case SNAPSHOT_REVERT_FAILURE:
        aname = "SNAPSHOT_REVERT_FAILURE";
        break;

    case SNAPSHOT_DELETE_SUCCESS:
        aname = "SNAPSHOT_DELETE_SUCCESS";
        break;

    case SNAPSHOT_DELETE_FAILURE:
        aname = "SNAPSHOT_DELETE_FAILURE";
        break;

    case DISK_SNAPSHOT_SUCCESS:
        aname = "DISK_SNAPSHOT_SUCCESS";
        break;

    case DISK_SNAPSHOT_FAILURE:
        aname = "DISK_SNAPSHOT_FAILURE";
        break;

    case DISK_LOCK_SUCCESS:
        aname = "DISK_LOCK_SUCCESS";
        break;

    case DISK_LOCK_FAILURE:
        aname = "DISK_LOCK_FAILURE";
        break;

    case DISK_RESIZE_SUCCESS:
        aname = "DISK_RESIZE_SUCCESS";
        break;

    case DISK_RESIZE_FAILURE:
        aname = "DISK_RESIZE_FAILURE";
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

    case UNDEPLOY:
        aname = "UNDEPLOY";
        break;

    case UNDEPLOY_HARD:
        aname = "UNDEPLOY_HARD";
        break;

    case RESTART:
        aname = "RESTART";
        break;

    case DELETE:
        aname = "DELETE";
        break;

    case DELETE_RECREATE:
        aname = "DELETE_RECREATE";
        break;

    case FINALIZE:
        aname = ACTION_FINALIZE;
        break;

    case POWEROFF:
        aname = "POWEROFF";
        break;

    case POWEROFF_HARD:
        aname = "POWEROFF_HARD";
        break;

    case UPDATESG:
        aname = "UPDATESG";
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
        shutdown_success_action(vid);
    }
    else if (action == "CANCEL_FAILURE")
    {
        shutdown_failure_action(vid);
    }
    else if (action == "MONITOR_SUSPEND")
    {
        monitor_suspend_action(vid);
    }
    else if (action == "MONITOR_DONE")
    {
        monitor_done_action(vid);
    }
    else if (action == "MONITOR_POWEROFF")
    {
        monitor_poweroff_action(vid);
    }
    else if (action == "MONITOR_POWERON")
    {
        monitor_poweron_action(vid);
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
    else if (action == "ATTACH_SUCCESS")
    {
        attach_success_action(vid);
    }
    else if (action == "ATTACH_FAILURE")
    {
        attach_failure_action(vid);
    }
    else if (action == "DETACH_SUCCESS")
    {
        detach_success_action(vid);
    }
    else if (action == "DETACH_FAILURE")
    {
        detach_failure_action(vid);
    }
    else if (action == "SAVEAS_SUCCESS")
    {
        saveas_success_action(vid);
    }
    else if (action == "SAVEAS_FAILURE")
    {
        saveas_failure_action(vid);
    }
    else if (action == "ATTACH_NIC_SUCCESS")
    {
        attach_nic_success_action(vid);
    }
    else if (action == "ATTACH_NIC_FAILURE")
    {
        attach_nic_failure_action(vid);
    }
    else if (action == "DETACH_NIC_SUCCESS")
    {
        detach_nic_success_action(vid);
    }
    else if (action == "DETACH_NIC_FAILURE")
    {
        detach_nic_failure_action(vid);
    }
    else if (action == "CLEANUP_SUCCESS")
    {
        cleanup_callback_action(vid);
    }
    else if (action == "CLEANUP_FAILURE")
    {
        cleanup_callback_action(vid);
    }
    else if (action == "SNAPSHOT_CREATE_SUCCESS")
    {
        snapshot_create_success(vid);
    }
    else if (action == "SNAPSHOT_CREATE_FAILURE")
    {
        snapshot_create_failure(vid);
    }
    else if (action == "SNAPSHOT_REVERT_SUCCESS")
    {
        snapshot_revert_success(vid);
    }
    else if (action == "SNAPSHOT_REVERT_FAILURE")
    {
        snapshot_revert_failure(vid);
    }
    else if (action == "SNAPSHOT_DELETE_SUCCESS")
    {
        snapshot_delete_success(vid);
    }
    else if (action == "SNAPSHOT_DELETE_FAILURE")
    {
        snapshot_delete_failure(vid);
    }
    else if (action == "DISK_SNAPSHOT_SUCCESS")
    {
        disk_snapshot_success(vid);
    }
    else if (action == "DISK_SNAPSHOT_FAILURE")
    {
        disk_snapshot_failure(vid);
    }
    else if (action == "DISK_LOCK_SUCCESS")
    {
        disk_lock_success(vid);
    }
    else if (action == "DISK_LOCK_FAILURE")
    {
        disk_lock_failure(vid);
    }
    else if (action == "DISK_RESIZE_SUCCESS")
    {
        disk_resize_success(vid);
    }
    else if (action == "DISK_RESIZE_FAILURE")
    {
        disk_resize_failure(vid);
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
        shutdown_action(vid, true);
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
        shutdown_action(vid, false);
    }
    else if (action == "UNDEPLOY")
    {
        undeploy_action(vid, false);
    }
    else if (action == "UNDEPLOY_HARD")
    {
        undeploy_action(vid, true);
    }
    else if (action == "RESTART")
    {
        restart_action(vid);
    }
    else if (action == "DELETE")
    {
        delete_action(vid);
    }
    else if (action == "DELETE_RECREATE")
    {
        delete_recreate_action(vid);
    }
    else if (action == "POWEROFF")
    {
        poweroff_action(vid);
    }
    else if (action == "POWEROFF_HARD")
    {
        poweroff_hard_action(vid);
    }
    else if (action == "UPDATESG")
    {
        updatesg_action(vid);
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
