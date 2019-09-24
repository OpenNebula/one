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

#ifndef LIFE_CYCLE_MANAGER_H_
#define LIFE_CYCLE_MANAGER_H_

#include "ActionManager.h"
#include "VirtualMachinePool.h"
#include "HostPool.h"
#include "ImagePool.h"
#include "SecurityGroupPool.h"
#include "ClusterPool.h"

using namespace std;

extern "C" void * lcm_action_loop(void *arg);

//Forward definitions
class TransferManager;
class DispatchManager;
class VirtualMachineManager;
class ImageManager;
struct RequestAttributes;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class LCMAction : public ActionRequest
{
public:

    enum Actions
    {
        NONE,
        SAVE_SUCCESS,     /**< Sent by the VMM when a save action succeeds    */
        SAVE_FAILURE,     /**< Sent by the VMM when a save action fails       */
        DEPLOY_SUCCESS,   /**< Sent by the VMM deploy/restore/migrate succeeds*/
        DEPLOY_FAILURE,   /**< Sent by the VMM deploy/restore/migrate fails   */
        SHUTDOWN_SUCCESS, /**< Sent by the VMM when a shutdown action succeeds*/
        SHUTDOWN_FAILURE, /**< Sent by the VMM when a shutdown action fails   */
        CANCEL_SUCCESS,   /**< Sent by the VMM when a cancel action succeeds  */
        CANCEL_FAILURE,   /**< Sent by the VMM when a cancel action fails     */
        MONITOR_SUSPEND,  /**< Sent by the VMM when a VM is paused in active  */
        MONITOR_DONE,     /**< Sent by the VMM when a Host cannot be monitored*/
        MONITOR_POWEROFF, /**< Sent by the VMM when a VM is not found         */
        MONITOR_POWERON,  /**< Sent by the VMM when a VM is found again       */
        PROLOG_SUCCESS,   /**< Sent by the TM when the prolog phase succeeds  */
        PROLOG_FAILURE,   /**< Sent by the TM when the prolog phase fails     */
        EPILOG_SUCCESS,   /**< Sent by the TM when the epilog phase succeeds  */
        EPILOG_FAILURE,   /**< Sent by the TM when the epilog phase fails     */
        ATTACH_SUCCESS,   /**< Sent by the VMM when an attach action succeeds */
        ATTACH_FAILURE,   /**< Sent by the VMM when an attach action fails    */
        DETACH_SUCCESS,   /**< Sent by the VMM when a detach action succeeds  */
        DETACH_FAILURE,   /**< Sent by the VMM when a detach action fails     */
        ATTACH_NIC_SUCCESS,/**< Sent by the VMM when attach nic action succeeds*/
        ATTACH_NIC_FAILURE,/**< Sent by the VMM when attach nic action fails   */
        DETACH_NIC_SUCCESS,/**< Sent by the VMM when detach nic action succeeds*/
        DETACH_NIC_FAILURE,/**< Sent by the VMM when detach nic action fails   */
        CLEANUP_SUCCESS,  /**< Sent by the VMM when a cleanup action succeeds */
        CLEANUP_FAILURE,  /**< Sent by the VMM when a cleanup action fails    */
        SAVEAS_SUCCESS,        /**< Sent by the VMM when saveas succeeds      */
        SAVEAS_FAILURE,        /**< Sent by the VMM when saveas fails         */
        SNAPSHOT_CREATE_SUCCESS, /**< Sent by the VMM on snap. create success */
        SNAPSHOT_CREATE_FAILURE, /**< Sent by the VMM on snap. create failure */
        SNAPSHOT_REVERT_SUCCESS, /**< Sent by the VMM on snap. revert success */
        SNAPSHOT_REVERT_FAILURE, /**< Sent by the VMM on snap. revert failure */
        SNAPSHOT_DELETE_SUCCESS, /**< Sent by the VMM on snap. revert success */
        SNAPSHOT_DELETE_FAILURE, /**< Sent by the VMM on snap. revert failure */
        DISK_SNAPSHOT_SUCCESS,   /**< Sent by TM when a snap. succeeds        */
        DISK_SNAPSHOT_FAILURE,   /**< Sent by TM when a snap. fails           */
        DEPLOY,           /**< Sent by the DM to deploy a VM on a host        */
        SUSPEND,          /**< Sent by the DM to suspend an running VM        */
        RESTORE,          /**< Sent by the DM to restore a suspended VM       */
        STOP,             /**< Sent by the DM to stop an running VM           */
        CANCEL,           /**< Sent by the DM to cancel an running VM         */
        MIGRATE,          /**< Sent by the DM to migrate a VM to other host   */
        LIVE_MIGRATE,     /**< Sent by the DM to live-migrate a VM            */
        POFF_MIGRATE,     /**< Sent by the DM to migrate a VM in a poff cycle */
        POFF_HARD_MIGRATE,/**< Sent by the DM to migrate a VM in a poff hard cycle */
        SHUTDOWN,         /**< Sent by the DM to shutdown a running VM        */
        UNDEPLOY,         /**< Sent by the DM to undeploy a running VM        */
        UNDEPLOY_HARD,    /**< Sent by the DM to force undeploy a running VM  */
        POWEROFF,         /**< Sent by the DM to power off a running VM       */
        POWEROFF_HARD,    /**< Sent by the DM to power off hard a running VM  */
        RESTART,          /**< Sent by the DM to restart a deployed VM        */
        DELETE,           /**< Sent by the DM to delete a VM                  */
        DELETE_RECREATE,  /**< Sent by the DM to cleanup a VM for resubmission*/
        UPDATESG,           /**< Sent by RM/VMM to trigger the secgroup update*/
        DISK_LOCK_SUCCESS,  /**< Sent by IM, image moves from locked to ready */
        DISK_LOCK_FAILURE,  /**< Sent by IM, image moves from locked to error */
        DISK_RESIZE_SUCCESS,/**< Sent by TM/VMM when a disk resize succeeds   */
        DISK_RESIZE_FAILURE,/**< Sent by TM/VMM when a disk resize fails      */
        UPDATE_CONF_SUCCESS,/**< Sent by TM/VMM when a update conf succeeds   */
        UPDATE_CONF_FAILURE /**< Sent by TM/VMM when a update conf fails      */
    };

    LCMAction(Actions a, int v, int u, int g, int r):
        ActionRequest(ActionRequest::USER), _action(a), _vm_id(v), _uid(u),
        _gid(g), _req_id(r){}

    LCMAction(const LCMAction& o):ActionRequest(o._type), _action(o._action),
        _vm_id(o._vm_id), _uid(o._uid), _gid(o._gid), _req_id(o._req_id){}

    Actions action() const
    {
        return _action;
    }

    int vm_id() const
    {
        return _vm_id;
    }

    int uid() const
    {
        return _uid;
    }

    int gid() const
    {
        return _gid;
    }

    int req_id() const
    {
        return _req_id;
    }

    ActionRequest * clone() const
    {
        return new LCMAction(*this);
    }

private:
    Actions _action;

    int _vm_id;

    int _uid;
    int _gid;

    int _req_id;
};

/**
 *  The Virtual Machine Life-cycle Manager module. This class is responsible for
 *  managing the life-cycle of a Virtual Machine.
 */
class LifeCycleManager : public ActionListener
{
public:

    LifeCycleManager():
        vmpool(0), hpool(0), ipool(0), sgpool(0), clpool(0), tm(0), vmm(0),
        dm(0), imagem(0)
    {
        am.addListener(this);
    };

    ~LifeCycleManager() = default;

    /**
     *  Triggers specific actions to the Life-cycle Manager. This function
     *  wraps the ActionManager trigger function.
     *    @param action the LCM action
     *    @param vid VM unique id. This is the argument of the passed to the
     *    invoked action.
     *    @param r RM request attributes to copy to the action request: uid,
     *    gid and request_id.
     */
    void trigger(LCMAction::Actions action, int id, const RequestAttributes& r);

    void trigger(LCMAction::Actions action, int id);

    void finalize()
    {
        am.finalize();
    }

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
     *  Gets the thread identification.
     *    @return pthread_t for the manager thread (that in the action loop).
     */
    pthread_t get_thread_id() const
    {
        return lcm_thread;
    };

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

private:
    /**
     *  Thread id for the Virtual Machine Manager
     */
    pthread_t               lcm_thread;

    /**
     *  Pointer to the Virtual Machine Pool, to access VMs
     */
    VirtualMachinePool *    vmpool;

    /**
     *  Pointer to the Host Pool, to access hosts
     */
    HostPool *              hpool;

    /**
     *  Pointer to the Image Pool, to access images
     */
    ImagePool *             ipool;

    /**
     *  Pointer to the SecurityGroup Pool
     */
    SecurityGroupPool *     sgpool;

    /**
     *  Pointer to the Cluster Pool
     */
    ClusterPool *           clpool;

    /**
     * Pointer to TransferManager
     */
    TransferManager *       tm;

    /**
     * Pointer to VirtualMachineManager
     */
    VirtualMachineManager * vmm;

    /**
     * Pointer to DispatchManager
     */
    DispatchManager *       dm;

    /**
     *  Action engine for the Manager
     */
    ActionManager           am;

    /**
     * Pointer to ImageManager
     */
    ImageManager *          imagem;

    /**
     *  Function to execute the Manager action loop method within a new pthread
     * (requires C linkage)
     */
    friend void * lcm_action_loop(void *arg);

    // -------------------------------------------------------------------------
    // Action Listener interface
    // -------------------------------------------------------------------------
    void finalize_action(const ActionRequest& ar)
    {
        NebulaLog::log("LCM",Log::INFO,"Stopping Life-cycle Manager...");
    };

    void user_action(const ActionRequest& ar);

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
            const LCMAction& la);

    // -------------------------------------------------------------------------
    // Internal Actions, triggered by OpenNebula components & drivers
    // -------------------------------------------------------------------------
    void start_prolog_migrate(VirtualMachine* vm);

    void revert_migrate_after_failure(VirtualMachine* vm);

    void save_success_action(int vid);
    void save_failure_action(int vid);

    void deploy_success_action(int vid);
    void deploy_failure_action(int vid);

    void shutdown_success_action(int vid);
    void shutdown_failure_action(int vid);

    void monitor_suspend_action(int vid);
    void monitor_done_action(int vid);
    void monitor_poweroff_action(int vid);
    void monitor_poweron_action(int vid);

    void prolog_success_action(int vid);
    void prolog_failure_action(int vid);

    void epilog_success_action(int vid);
    void epilog_failure_action(int vid);

    void attach_success_action(int vid);
    void attach_failure_action(int vid);

    void detach_success_action(int vid);
    void detach_failure_action(int vid);

    void saveas_success_action(int vid);
    void saveas_failure_action(int vid);

    void attach_nic_success_action(int vid);
    void attach_nic_failure_action(int vid);

    void detach_nic_success_action(int vid);
    void detach_nic_failure_action(int vid);

    void cleanup_callback_action(int vid);

    void snapshot_create_success(int vid);
    void snapshot_create_failure(int vid);

    void snapshot_revert_success(int vid);
    void snapshot_revert_failure(int vid);

    void snapshot_delete_success(int vid);
    void snapshot_delete_failure(int vid);

    void disk_snapshot_success(int vid);
    void disk_snapshot_failure(int vid);

    void disk_lock_success(int vid);
    void disk_lock_failure(int vid);

    void disk_resize_success(int vid);
    void disk_resize_failure(int vid);

    void update_conf_success(int vid);
    void update_conf_failure(int vid);

    // -------------------------------------------------------------------------
    // External Actions, triggered by user requests
    // -------------------------------------------------------------------------
    void deploy_action(const LCMAction& la);

    void suspend_action(const LCMAction& la);

    void restore_action(const LCMAction& la);

    void stop_action(const LCMAction& la);

    void checkpoint_action(const LCMAction& la);

    void migrate_action(const LCMAction& la);

    void live_migrate_action(const LCMAction& la);

    void shutdown_action(const LCMAction& la, bool hard);

    void undeploy_action(const LCMAction& la, bool hard);

    void poweroff_action(const LCMAction& la);

    void poweroff_hard_action(const LCMAction& la);

    void poweroff_action(int vid, bool hard, const LCMAction& la);

    void updatesg_action(const LCMAction& la);

    void restart_action(const LCMAction& la);

    void delete_action(const LCMAction& la);

    void delete_recreate_action(const LCMAction& la);
};

#endif /*LIFE_CYCLE_MANAGER_H_*/
