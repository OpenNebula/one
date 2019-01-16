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

#ifndef DISPATCH_MANAGER_H_
#define DISPATCH_MANAGER_H_

#include "ActionManager.h"
#include "HostPool.h"
#include "VirtualMachinePool.h"
#include "VirtualRouterPool.h"
#include "ClusterPool.h"
#include "UserPool.h"

using namespace std;

extern "C" void * dm_action_loop(void *arg);

//Forward definitions
class TransferManager;
class LifeCycleManager;
class VirtualMachineManager;
class ImageManager;

struct RequestAttributes;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class DMAction : public ActionRequest
{
public:
    enum Actions
    {
        SUSPEND_SUCCESS,  /**< Send by LCM when a VM is suspended*/
        STOP_SUCCESS,     /**< Send by LCM when a VM is stopped*/
        UNDEPLOY_SUCCESS, /**< Send by LCM when a VM is undeployed and saved*/
        POWEROFF_SUCCESS, /**< Send by LCM when a VM is powered off */
        DONE,             /**< Send by LCM when a VM is shut down*/
        RESUBMIT          /**< Send by LCM when a VM is ready for resubmission*/
    };

    DMAction(Actions a, int v):ActionRequest(ActionRequest::USER),
        _action(a), _vm_id(v){};

    DMAction(const DMAction& o):ActionRequest(o._type), _action(o._action),
        _vm_id(o._vm_id){};

    Actions action() const
    {
        return _action;
    }

    int vm_id() const
    {
        return _vm_id;
    }

    ActionRequest * clone() const
    {
        return new DMAction(*this);
    }

private:
    Actions _action;

    int     _vm_id;
};

class DispatchManager : public ActionListener
{
public:

    DispatchManager():
            hpool(0), vmpool(0), clpool(0), vrouterpool(0), tm(0), vmm(0), lcm(0), imagem(0)
    {
        am.addListener(this);
    };

    ~DispatchManager(){};

     /**
      * Initializes internal pointers to other managers. Must be called when
      * all the other managers exist in Nebula::instance
      */
    void init_managers();

    /**
     *  Triggers specific actions to the Dispatch Manager. This function
     *  wraps the ActionManager trigger function.
     *    @param action the DM action
     *    @param vid VM unique id. This is the argument of the passed to the
     *    invoked action.
     */
    void trigger(DMAction::Actions action, int vid)
    {
        DMAction dm_ar(action, vid);

        am.trigger(dm_ar);
    }

    void finalize()
    {
        am.finalize();
    }

    /**
     *  This functions creates a new thread for the Dispatch Manager. This
     *  thread will wait in an action loop till it receives ACTION_FINALIZE.
     *    @return 0 on success.
     */
    int start();

    /**
     *  Gets the thread identification.
     *    @return pthread_t for the manager thread (that in the action loop).
     */
    pthread_t get_thread_id() const
    {
        return dm_thread;
    };

    //--------------------------------------------------------------------------
    // DM Actions, the RM and the Scheduler will invoke this methods
    //--------------------------------------------------------------------------
    /**
     *  Deploys a VM. A new history record MUST be added before calling this
     *  function. Also the VM MUST have its mutex locked. If the function fails
     *  the calling funtion is responsible for recovering from the error.
     *    @param vm pointer to a VirtualMachine with its mutex locked.
     *    @param ra information about the API call request
     *    @return 0 on success
     */
    int deploy(VirtualMachine * vm, const RequestAttributes& request);

    /**
     *  Sets an imported VM to RUNNING state, a history record MUST be added,
     *  and the VM MUST be locked.
     *    @param vm pointer to a VirtualMachine with its mutex locked.
     *    @param ra information about the API call request
     *    @return 0 on success
     */
    int import(VirtualMachine * vm, const RequestAttributes& ra);

    /**
     *  Migrates a VM. The following actions must be performed before calling
     *  this function:
     *    - Lock the VM mutex.
     *    - Update the History statistics of the current host.
     *    - Add a new History record with the new host.
     *  If the function fails the calling funtion is responsible for recovering
     *  from the error.
     *    @param vm pointer to a VirtualMachine with its mutex locked.
     *    @param poff migration type: 0(save), 1(poff), 2(poff-hard)
     *    @param ra information about the API call request
     *    @return 0 on success
     */
    int migrate(VirtualMachine * vm, int poff, const RequestAttributes& request);

    /**
     *  Migrates a VM. The following actions must be performed before calling
     *  this function:
     *    - Lock the VM mutex.
     *    - Update the History statistics of the current host.
     *    - Add a new History record with the new host.
     *  If the function fails the calling funtion is responsible for recovering
     *  from the error.
     *    @param vm pointer to a VirtualMachine with its mutex locked.
     *    @param ra information about the API call request
     *    @return 0 on success
     */
    int live_migrate(VirtualMachine * vm, const RequestAttributes& request);

    /**
     *  Terminates a VM.
     *    @param vid VirtualMachine identification
     *    @param hard True to force the shutdown (cancel instead of shutdown)
     *    @param ra information about the API call request
     *    @return 0 on success, -1 if the VM does not exits or -2 if the VM is
     *    in a wrong a state
     */
    int terminate(int vid, bool hard, const RequestAttributes& request,
        string& error_str);

    /**
     *  Shuts down a VM, but it is saved in the system DS instead of destroyed.
     *    @param vid VirtualMachine identification
     *    @param hard True to force the shutdown (cancel instead of shutdown)
     *    @param ra information about the API call request
     *    @return 0 on success, -1 if the VM does not exits or -2 if the VM is
     *    in a wrong a state
     */
    int undeploy (int vid, bool hard, const RequestAttributes& ra,
            string& error_str);

    /**
     *  Powers off a VM.
     *    @param vid VirtualMachine identification
     *    @param ra information about the API call request
     *    @param hard True to force the poweroff (cancel instead of shutdown)
     *    @return 0 on success, -1 if the VM does not exits or -2 if the VM is
     *    in a wrong a state
     */
    int poweroff (int vid, bool hard, const RequestAttributes& ra,
            string& error_str);

    /**
     *  Holds a VM.
     *    @param vid VirtualMachine identification
     *    @param ra information about the API call request
     *    @return 0 on success, -1 if the VM does not exits or -2 if the VM is
     *    in a wrong a state
     */
    int hold(int vid, const RequestAttributes& ra, string& error_str);

    /**
     *  Releases a VM.
     *    @param vid VirtualMachine identification
     *    @param ra information about the API call request
     *    @return 0 on success, -1 if the VM does not exits or -2 if the VM is
     *    in a wrong a state
     */
    int release(int vid, const RequestAttributes& ra, string& error_str);

    /**
     *  Stops a VM.
     *    @param vid VirtualMachine identification
     *    @param ra information about the API call request
     *    @return 0 on success, -1 if the VM does not exits or -2 if the VM is
     *    in a wrong a state
     */
    int stop(int vid, const RequestAttributes& ra, string& error_str);

    /**
     *  Suspends a VM.
     *    @param vid VirtualMachine identification
     *    @param ra information about the API call request
     *    @return 0 on success, -1 if the VM does not exits or -2 if the VM is
     *    in a wrong a state
     */
    int suspend(int vid, const RequestAttributes& ra, string& error_str);

    /**
     *  Resumes a VM.
     *    @param vid VirtualMachine identification
     *    @param ra information about the API call request
     *    @return 0 on success, -1 if the VM does not exits or -2 if the VM is
     *    in a wrong a state
     */
    int resume(int vid, const RequestAttributes& ra, string& error_str);

    /**
     *  Ends a VM life cycle inside ONE.
     *    @param vm VirtualMachine object
     *    @param ra information about the API call request
     *    @return 0 on success, the VM mutex is unlocked
     */
    int delete_vm(VirtualMachine * vm, const RequestAttributes& ra,
            string& error_str);

    /**
     *  VM ID interface
     */
    int delete_vm(int vid, const RequestAttributes& ra, string& error_str)
    {
        VirtualMachine * vm;

        vm = vmpool->get(vid);

        if ( vm == 0 )
        {
            error_str = "Virtual machine does not exist";
            return -1;
        }

        return delete_vm(vm, ra, error_str);
    }

    /**
     *  Moves a VM to PENDING state preserving any resource (i.e. leases) and id
     *    @param vm VirtualMachine object
     *    @param ra information about the API call request
     *    @return 0 on success
     */
    int delete_recreate(VirtualMachine * vm, const RequestAttributes& ra,
            string& error_str);

    /**
     *  Ends a VM life cycle inside ONE but let the VM running at the Hipervisor.
     *    @param vm VirtualMachine object
     *    @param ra information about the API call request
     *    @return 0 on success, the VM mutex is unlocked
     */
    int delete_vm_db(VirtualMachine * vm, const RequestAttributes& ra,
            string& error_str);

    /**
     *  Recover the last operation on the VM
     *    @param vm VirtualMachine object
     *    @param success if the operation is assumed to succeed or not
     *    @param ra information about the API call request
     *    @return 0 on success
     */
    int recover(VirtualMachine * vm, bool success, const RequestAttributes& ra,
            string& error_str);

    /**
     *  Retry the last operation on the VM
     *    @param vm VirtualMachine object
     *    @param ra information about the API call request
     *    @return 0 on success
     */
    int retry(VirtualMachine * vm, const RequestAttributes& ra,
            string& error_str);

    /**
     *  Reboots a VM preserving any resource and RUNNING state
     *    @param vid VirtualMachine identification
     *    @param hard True to force the shutdown (cancel instead of shutdown)
     *    @param ra information about the API call request
     *    @return 0 on success, -1 if the VM does not exits or -2 if the VM is
     *    in a wrong a state
     */
    int reboot(int vid, bool hard, const RequestAttributes& ra,
            string& error_str);

    /**
     *  Set the re-scheduling flag for the VM (must be in RUNNING state)
     *    @param vid VirtualMachine identification
     *    @param do_resched set or unset the flag
     *    @param ra information about the API call request
     *
     *    @return 0 on success, -1 if the VM does not exits or -2 if the VM is
     *    in a wrong a state
     */
    int resched(int vid, bool do_resched, const RequestAttributes& ra,
            string& error_str);

    /**
     *  Starts the attach disk action.
     *    @param vid VirtualMachine identification
     *    @param tmpl Template containing the new DISK attribute.
     *    @param ra information about the API call request
     *    @param error_str Error reason, if any
     *
     *    @return 0 on success, -1 otherwise
     */
    int attach(int vid, VirtualMachineTemplate * tmpl,
            const RequestAttributes& ra, string& error_str);

    /**
     * Starts the detach disk action.
     *    @param vid VirtualMachine identification
     *    @param disk_id Disk to detach
     *    @param ra information about the API call request
     *    @param error_str Error reason, if any
     *
     *    @return 0 on success, -1 otherwise
     */
    int detach(int id, int disk_id, const RequestAttributes& ra,
            string&  error_str);

    /**
     *  Starts the attach NIC action.
     *    @param vid VirtualMachine identification
     *    @param tmpl Template containing the new NIC attribute.
     *    @param ra information about the API call request
     *    @param error_str Error reason, if any
     *
     *    @return 0 on success, -1 otherwise
     */
    int attach_nic(int vid, VirtualMachineTemplate * tmpl,
            const RequestAttributes& ra, string& error_str);

    /**
     * Starts the detach NIC action.
     *    @param vid VirtualMachine identification
     *    @param nic_id NIC to detach
     *    @param ra information about the API call request
     *    @param error_str Error reason, if any
     *
     *    @return 0 on success, -1 otherwise
     */
    int detach_nic(int id, int nic_id, const RequestAttributes& ra,
            string& error_str);

    /**
     * Starts the snapshot create action
     *
     * @param vid VirtualMachine identification
     * @param name Name for the new snapshot
     * @param snap_id Will contain the new snapshot ID
     * @param ra information about the API call request
     * @param error_str Error reason, if any
     *
     * @return 0 on success, -1 otherwise
     */
    int snapshot_create(int vid, string& name, int& snap_id,
            const RequestAttributes& ra, string& error_str);

    /**
     * Starts the snapshot revert action
     *
     * @param vid VirtualMachine identification
     * @param snap_id Snapshot to be restored
     * @param ra information about the API call request
     * @param error_str Error reason, if any
     *
     * @return 0 on success, -1 otherwise
     */
    int snapshot_revert(int vid, int snap_id, const RequestAttributes& ra,
            string& error_str);

    /**
     * Starts the snapshot delete action
     *
     * @param vid VirtualMachine identification
     * @param snap_id Snapshot to be deleted
     * @param ra information about the API call request
     * @param error_str Error reason, if any
     *
     * @return 0 on success, -1 otherwise
     */
    int snapshot_delete(int vid, int snap_id, const RequestAttributes& ra,
            string& error_str);

    /**
     * Starts the disk snapshot create action
     *
     * @param vid VirtualMachine identification
     * @param did DISK identification
     * @param name Description for the new snapshot
     * @param snap_id Will contain the new snapshot ID
     * @param ra information about the API call request
     * @param error_str Error reason, if any
     *
     * @return 0 on success, -1 otherwise
     */
    int disk_snapshot_create(int vid, int did, const string& name, int& snap_id,
            const RequestAttributes& ra, string& error_str);

    /**
     * Reverts the disk state to a previous snapshot
     *
     * @param vid VirtualMachine identification
     * @param did DISK identification
     * @param snap_id Snapshot to be restored
     * @param ra information about the API call request
     * @param error_str Error reason, if any
     *
     * @return 0 on success, -1 otherwise
     */
    int disk_snapshot_revert(int vid, int did, int snap_id,
            const RequestAttributes& ra, string& error_str);

    /**
     * Deletes a disk snapshot
     *
     * @param vid VirtualMachine identification
     * @param did DISK identification
     * @param snap_id Snapshot to be restored
     * @param ra information about the API call request
     * @param error_str Error reason, if any
     *
     * @return 0 on success, -1 otherwise
     */
    int disk_snapshot_delete(int vid, int did, int snap_id,
            const RequestAttributes& ra, string& error_str);

    /**
     * Starts the disk resize create action
     *
     * @param vid VirtualMachine identification
     * @param did DISK identification
     * @param size new size for the disk
     * @param ra information about the API call request
     * @param error_str Error reason, if any
     *
     * @return 0 on success, -1 otherwise
     */
    int disk_resize(int vid, int did, long long new_size,
            const RequestAttributes& ra, string& error_str);
private:
    /**
     *  Thread id for the Dispatch Manager
     */
    pthread_t               dm_thread;

    /**
     *  Pointer to the Host Pool, to access hosts
     */
    HostPool *              hpool;

    /**
     *  Pointer to the Virtual Machine Pool, to access VMs
     */
    VirtualMachinePool *    vmpool;

    /**
     *  Pointer to the User Pool, to access user
     */
    UserPool *    upool;

    /**
     *  Pointer to the Cluster Pool
     */
     ClusterPool *    clpool;

    /**
     *  Pointer to the Virtual Router Pool
     */
    VirtualRouterPool *     vrouterpool;

    /**
     * Pointer to TransferManager
     */
    TransferManager *       tm;

    /**
     * Pointer to VirtualMachineManager
     */
    VirtualMachineManager * vmm;

    /**
     * Pointer to LifeCycleManager
     */
    LifeCycleManager *       lcm;

    /**
     * Pointer to ImageManager
     */
    ImageManager *          imagem;

    /**
     *  Action engine for the Manager
     */
    ActionManager           am;

    /**
     *  Frees the resources associated to a VM: disks, ip addresses and Quotas
     */
    void free_vm_resources(VirtualMachine * vm, bool check_images);

    //--------------------------------------------------------------------------
    // DM Actions associated with a VM state transition
    //--------------------------------------------------------------------------

    void  suspend_success_action(int vid);

    void  stop_success_action(int vid);

    void  undeploy_success_action(int vid);

    void  poweroff_success_action(int vid);

    void  done_action(int vid);

    void  resubmit_action(int vid);

    /**
     *  Function to execute the Manager action loop method within a new pthread
     * (requires C linkage)
     */
    friend void * dm_action_loop(void *arg);

    // -------------------------------------------------------------------------
    // Action Listener interface
    // -------------------------------------------------------------------------
    void finalize_action(const ActionRequest& ar)
    {
        NebulaLog::log("DiM",Log::INFO,"Stopping Dispatch Manager...");
    };

    void user_action(const ActionRequest& ar);

    /**
    * Fill a template only with the necessary attributes to update the quotas
    *   @param vm with the attributes
    *   @param template that will be filled
    *   @param only_running true to not add CPU, MEMORY and VMS counters
    */
    void get_quota_template(VirtualMachine * vm, 
            VirtualMachineTemplate& quota_tmpl, bool only_running);
};

#endif /*DISPATCH_MANAGER_H*/
