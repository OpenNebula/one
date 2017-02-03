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

    lcm->am.loop();

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

void LifeCycleManager::user_action(const ActionRequest& ar)
{
    const LCMAction& lcm_ar = static_cast<const LCMAction& >(ar);
    int vid = lcm_ar.vm_id();

    switch (lcm_ar.action())
    {
    case LCMAction::SAVE_SUCCESS:
        save_success_action(vid);
        break;
    case LCMAction::SAVE_FAILURE:
        save_failure_action(vid);
        break;
    case LCMAction::DEPLOY_SUCCESS:
        deploy_success_action(vid);
        break;
    case LCMAction::DEPLOY_FAILURE:
        deploy_failure_action(vid);
        break;
    case LCMAction::SHUTDOWN_SUCCESS:
        shutdown_success_action(vid);
        break;
    case LCMAction::SHUTDOWN_FAILURE:
        shutdown_failure_action(vid);
        break;
    case LCMAction::CANCEL_SUCCESS:
        shutdown_success_action(vid);
        break;
    case LCMAction::CANCEL_FAILURE:
        shutdown_failure_action(vid);
        break;
    case LCMAction::MONITOR_SUSPEND:
        monitor_suspend_action(vid);
        break;
    case LCMAction::MONITOR_DONE:
        monitor_done_action(vid);
        break;
    case LCMAction::MONITOR_POWEROFF:
        monitor_poweroff_action(vid);
        break;
    case LCMAction::MONITOR_POWERON:
        monitor_poweron_action(vid);
        break;
    case LCMAction::PROLOG_SUCCESS:
        prolog_success_action(vid);
        break;
    case LCMAction::PROLOG_FAILURE:
        prolog_failure_action(vid);
        break;
    case LCMAction::EPILOG_SUCCESS:
        epilog_success_action(vid);
        break;
    case LCMAction::EPILOG_FAILURE:
        epilog_failure_action(vid);
        break;
    case LCMAction::ATTACH_SUCCESS:
        attach_success_action(vid);
        break;
    case LCMAction::ATTACH_FAILURE:
        attach_failure_action(vid);
        break;
    case LCMAction::DETACH_SUCCESS:
        detach_success_action(vid);
        break;
    case LCMAction::DETACH_FAILURE:
        detach_failure_action(vid);
        break;
    case LCMAction::SAVEAS_SUCCESS:
        saveas_success_action(vid);
        break;
    case LCMAction::SAVEAS_FAILURE:
        saveas_failure_action(vid);
        break;
    case LCMAction::ATTACH_NIC_SUCCESS:
        attach_nic_success_action(vid);
        break;
    case LCMAction::ATTACH_NIC_FAILURE:
        attach_nic_failure_action(vid);
        break;
    case LCMAction::DETACH_NIC_SUCCESS:
        detach_nic_success_action(vid);
        break;
    case LCMAction::DETACH_NIC_FAILURE:
        detach_nic_failure_action(vid);
        break;
    case LCMAction::CLEANUP_SUCCESS:
        cleanup_callback_action(vid);
        break;
    case LCMAction::CLEANUP_FAILURE:
        cleanup_callback_action(vid);
        break;
    case LCMAction::SNAPSHOT_CREATE_SUCCESS:
        snapshot_create_success(vid);
        break;
    case LCMAction::SNAPSHOT_CREATE_FAILURE:
        snapshot_create_failure(vid);
        break;
    case LCMAction::SNAPSHOT_REVERT_SUCCESS:
        snapshot_revert_success(vid);
        break;
    case LCMAction::SNAPSHOT_REVERT_FAILURE:
        snapshot_revert_failure(vid);
        break;
    case LCMAction::SNAPSHOT_DELETE_SUCCESS:
        snapshot_delete_success(vid);
        break;
    case LCMAction::SNAPSHOT_DELETE_FAILURE:
        snapshot_delete_failure(vid);
        break;
    case LCMAction::DISK_SNAPSHOT_SUCCESS:
        disk_snapshot_success(vid);
        break;
    case LCMAction::DISK_SNAPSHOT_FAILURE:
        disk_snapshot_failure(vid);
        break;
    case LCMAction::DISK_LOCK_SUCCESS:
        disk_lock_success(vid);
        break;
    case LCMAction::DISK_LOCK_FAILURE:
        disk_lock_failure(vid);
        break;
    case LCMAction::DISK_RESIZE_SUCCESS:
        disk_resize_success(vid);
        break;
    case LCMAction::DISK_RESIZE_FAILURE:
        disk_resize_failure(vid);
        break;
    case LCMAction::DEPLOY:
        deploy_action(vid);
        break;
    case LCMAction::SUSPEND:
        suspend_action(vid);
        break;
    case LCMAction::RESTORE:
        restore_action(vid);
        break;
    case LCMAction::STOP:
        stop_action(vid);
        break;
    case LCMAction::CANCEL:
        shutdown_action(vid, true);
        break;
    case LCMAction::MIGRATE:
        migrate_action(vid);
        break;
    case LCMAction::LIVE_MIGRATE:
        live_migrate_action(vid);
        break;
    case LCMAction::SHUTDOWN:
        shutdown_action(vid, false);
        break;
    case LCMAction::UNDEPLOY:
        undeploy_action(vid, false);
        break;
    case LCMAction::UNDEPLOY_HARD:
        undeploy_action(vid, true);
        break;
    case LCMAction::RESTART:
        restart_action(vid);
        break;
    case LCMAction::DELETE:
        delete_action(vid);
        break;
    case LCMAction::DELETE_RECREATE:
        delete_recreate_action(vid);
        break;
    case LCMAction::POWEROFF:
        poweroff_action(vid);
        break;
    case LCMAction::POWEROFF_HARD:
        poweroff_hard_action(vid);
        break;
    case LCMAction::UPDATESG:
        updatesg_action(vid);
        break;
    case LCMAction::NONE:
        break;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
