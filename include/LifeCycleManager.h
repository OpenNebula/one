/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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

#ifndef LIFE_CYCLE_MANAGER_H_
#define LIFE_CYCLE_MANAGER_H_

#include "Listener.h"
#include "VMActions.h"

//Forward definitions
class TransferManager;
class DispatchManager;
class VirtualMachineManager;
class ImageManager;
class BackupJobPool;
class ClusterPool;
class HostPool;
class ImagePool;
class DatastorePool;
class SecurityGroupPool;
class VirtualMachinePool;
class VirtualMachine;
class VirtualNetworkPool;
struct RequestAttributes;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 *  The Virtual Machine Life-cycle Manager module. This class is responsible for
 *  managing the life-cycle of a Virtual Machine.
 */
class LifeCycleManager : public Listener
{
public:

    LifeCycleManager()
        : Listener("Life Cycle Manager")
    {
    };

    ~LifeCycleManager() = default;

    /**
     *  This functions starts a new thread for the Life-cycle Manager. This
     *  thread will wait in  an action loop till it receives ACTION_FINALIZE.
     *    @return 0 on success.
     */
    int start();

    /**
     * Initializes internal pointers to other managers. Must be called when
     * all the other managers exist in Nebula::instance
     */
    void init_managers();

    /**
     *  Recovers a VM by self-triggering the associated lost transition.
     *    @param vm to be recovered
     *    @param success trigger successful transition if true, fail otherwise
     */
    void recover(VirtualMachine * vm, bool success, const RequestAttributes& ra);

    /**
     *  Retries the last VM operation that lead to a failure. The underlying
     *  driver actions may be invoked and should be "re-entrant".
     */
    void retry(VirtualMachine * vm);

    // -------------------------------------------------------------------------
    // Internal Actions, triggered by OpenNebula components & drivers
    // -------------------------------------------------------------------------
    void start_prolog_migrate(VirtualMachine* vm);

    void revert_migrate_after_failure(VirtualMachine* vm);

    void trigger_save_success(int vid);
    void trigger_save_failure(int vid);

    void trigger_deploy_success(int vid);
    void trigger_deploy_failure(int vid);

    void trigger_shutdown_success(int vid);
    void trigger_shutdown_failure(int vid);

    void trigger_monitor_suspend(int vid);
    void trigger_monitor_done(int vid);
    void trigger_monitor_poweroff(int vid);
    void trigger_monitor_poweron(int vid);

    void trigger_prolog_success(int vid);
    void trigger_prolog_failure(int vid);

    void trigger_epilog_success(int vid);
    void trigger_epilog_failure(int vid);

    void trigger_attach_success(int vid);
    void trigger_attach_failure(int vid);

    void trigger_detach_success(int vid);
    void trigger_detach_failure(int vid);

    void trigger_saveas_success(int vid);
    void trigger_saveas_failure(int vid);

    void trigger_attach_nic_success(int vid);
    void trigger_attach_nic_failure(int vid);

    void trigger_detach_nic_success(int vid);
    void trigger_detach_nic_failure(int vid);

    void trigger_cleanup_callback(int vid);

    void trigger_snapshot_create_success(int vid);
    void trigger_snapshot_create_failure(int vid);

    void trigger_snapshot_revert_success(int vid);
    void trigger_snapshot_revert_failure(int vid);

    void trigger_snapshot_delete_success(int vid);
    void trigger_snapshot_delete_failure(int vid);

    void trigger_disk_snapshot_success(int vid);
    void trigger_disk_snapshot_failure(int vid);

    void trigger_disk_lock_success(int vid);
    void trigger_disk_lock_failure(int vid);

    void trigger_disk_resize_success(int vid);
    void trigger_disk_resize_failure(int vid);

    void trigger_update_conf_success(int vid);
    void trigger_update_conf_failure(int vid);

    void trigger_resize_success(int vid);
    void trigger_resize_failure(int vid);

    void trigger_backup_success(int vid);
    void trigger_backup_failure(int vid);
    // -------------------------------------------------------------------------
    // External Actions, triggered by user requests
    // -------------------------------------------------------------------------
    void trigger_deploy(int vid);
    void trigger_suspend(int vid, const RequestAttributes& ra);
    void trigger_restore(int vid, const RequestAttributes& ra);
    void trigger_stop(int vid, const RequestAttributes& ra);
    void trigger_migrate(int vid, const RequestAttributes& ra,
                         VMActions::Action vm_action);
    void trigger_migrate(int vid, const RequestAttributes& ra)
    {
        trigger_migrate(vid, ra, VMActions::MIGRATE_ACTION);
    }
    void trigger_migrate_poweroff(int vid, const RequestAttributes& ra)
    {
        trigger_migrate(vid, ra, VMActions::POFF_MIGRATE_ACTION);
    }
    void trigger_migrate_poweroff_hard(int vid, const RequestAttributes& ra)
    {
        trigger_migrate(vid, ra, VMActions::POFF_HARD_MIGRATE_ACTION);
    }
    void trigger_live_migrate(int vid, const RequestAttributes& ra);
    void trigger_shutdown(int vid, bool hard, const RequestAttributes& ra);
    void trigger_undeploy(int vid, bool hard, const RequestAttributes& ra);
    void trigger_undeploy(int vid, const RequestAttributes& ra)
    {
        trigger_undeploy(vid, false, ra);
    }
    void trigger_undeploy_hard(int vid, const RequestAttributes& ra)
    {
        trigger_undeploy(vid, true, ra);
    }
    void trigger_poweroff(int vid, const RequestAttributes& ra);
    void trigger_poweroff_hard(int vid, const RequestAttributes& ra);
    void trigger_poweroff(int vid, bool hard, const RequestAttributes& ra);
    void trigger_updatesg(int sgid);
    void trigger_restart(int vid, const RequestAttributes& ra);
    void trigger_delete(int vid, const RequestAttributes& ra);
    void trigger_delete_recreate(int vid, const RequestAttributes& ra);

    void trigger_updatevnet(int vnid);

private:
    /**
     *  Pointer to the Virtual Machine Pool, to access VMs
     */
    VirtualMachinePool *    vmpool = nullptr;

    /**
     *  Pointer to the Host Pool, to access hosts
     */
    HostPool *              hpool = nullptr;

    /**
     *  Pointer to the Image Pool, to access images
     */
    ImagePool *             ipool = nullptr;

    /**
     *  Pointer to the Datastore Pool, to access images
     */
    DatastorePool *         dspool = nullptr;

    /**
     *  Pointer to the SecurityGroup Pool
     */
    SecurityGroupPool *     sgpool = nullptr;

    /**
     *  Pointer to the SecurityGroup Pool
     */
    BackupJobPool *         bjpool = nullptr;

    /**
     *  Pointer to the Cluster Pool
     */
    ClusterPool *           clpool = nullptr;

    /**
     *  Pointer to the Cluster Pool
     */
    VirtualNetworkPool *    vnpool = nullptr;

    /**
     * Pointer to TransferManager
     */
    TransferManager *       tm = nullptr;

    /**
     * Pointer to VirtualMachineManager
     */
    VirtualMachineManager * vmm = nullptr;

    /**
     * Pointer to DispatchManager
     */
    DispatchManager *       dm = nullptr;

    /**
     * Pointer to ImageManager
     */
    ImageManager *          imagem = nullptr;

    /**
     *  Cleans up a VM, canceling any pending or ongoing action and closing
     *  the history registers
     *
     * @param vm with the lock acquired
     * @param dispose true if the vm will end in DONE, false to resubmit to PENDING
     * @param image_id If the VM is in the middle of a save as operation, an
     * image may need to be set to error state.
     */
    void clean_up_vm(VirtualMachine *vm, bool dispose, int& image_id,
            int uid, int gid, int req_id, Template& quota_tmpl);
};

#endif /*LIFE_CYCLE_MANAGER_H_*/
