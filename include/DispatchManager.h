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

#ifndef DISPATCH_MANAGER_H_
#define DISPATCH_MANAGER_H_

#include "ActionManager.h"
#include "HostPool.h"
#include "VirtualMachinePool.h"

using namespace std;

extern "C" void * dm_action_loop(void *arg);

//Forward definitions
class TransferManager;
class LifeCycleManager;
class VirtualMachineManager;
class ImageManager;

class DispatchManager : public ActionListener
{
public:

    DispatchManager():
            hpool(0), vmpool(0), tm(0), vmm(0), lcm(0), imagem(0)
    {
        am.addListener(this);
    };

    ~DispatchManager(){};

     /**
	  * Initializes internal pointers to other managers. Must be called when
	  * all the other managers exist in Nebula::instance
	  */
    void init_managers();

    enum Actions
    {
        SUSPEND_SUCCESS,/**< Send by LCM when a VM is suspended*/
        STOP_SUCCESS,   /**< Send by LCM when a VM is stopped*/
        UNDEPLOY_SUCCESS,  /**< Send by LCM when a VM is undeployed and saved*/
        POWEROFF_SUCCESS, /**< Send by LCM when a VM is powered off */
        DONE,           /**< Send by LCM when a VM is shut down*/
        RESUBMIT,       /**< Send by LCM when a VM is ready for resubmission*/
        FINALIZE
    };

    /**
     *  Triggers specific actions to the Dispatch Manager. This function
     *  wraps the ActionManager trigger function.
     *    @param action the DM action
     *    @param vid VM unique id. This is the argument of the passed to the
     *    invoked action.
     */
    void trigger(
        Actions action,
        int     _vid);

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
     *    @return 0 on success
     */
    int deploy (
        VirtualMachine * vm);

    /**
     *  Sets an imported VM to RUNNING state, a history record MUST be added,
     *  and the VM MUST be locked.
     *    @param vm pointer to a VirtualMachine with its mutex locked.
     *    @return 0 on success
     */
    int import (
        VirtualMachine * vm);

    /**
     *  Migrates a VM. The following actions must be performed before calling
     *  this function:
     *    - Lock the VM mutex.
     *    - Update the History statistics of the current host.
     *    - Add a new History record with the new host.
     *  If the function fails the calling funtion is responsible for recovering
     *  from the error.
     *    @param vm pointer to a VirtualMachine with its mutex locked.
     *    @return 0 on success
     */
    int migrate(
        VirtualMachine * vm);

    /**
     *  Migrates a VM. The following actions must be performed before calling
     *  this function:
     *    - Lock the VM mutex.
     *    - Update the History statistics of the current host.
     *    - Add a new History record with the new host.
     *  If the function fails the calling funtion is responsible for recovering
     *  from the error.
     *    @param vm pointer to a VirtualMachine with its mutex locked.
     *    @return 0 on success
     */
    int live_migrate(
        VirtualMachine * vm);

    /**
     *  Shuts down a VM.
     *    @param vid VirtualMachine identification
     *    @param hard True to force the shutdown (cancel instead of shutdown)
     *    @return 0 on success, -1 if the VM does not exits or -2 if the VM is
     *    in a wrong a state
     */
    int shutdown (
        int     vid,
        bool    hard,
        string& error_str);

    /**
     *  Shuts down a VM, but it is saved in the system DS instead of destroyed.
     *    @param vid VirtualMachine identification
     *    @param hard True to force the shutdown (cancel instead of shutdown)
     *    @return 0 on success, -1 if the VM does not exits or -2 if the VM is
     *    in a wrong a state
     */
    int undeploy (
        int     vid,
        bool    hard,
        string& error_str);

    /**
     *  Powers off a VM.
     *    @param vid VirtualMachine identification
     *    @param hard True to force the poweroff (cancel instead of shutdown)
     *    @return 0 on success, -1 if the VM does not exits or -2 if the VM is
     *    in a wrong a state
     */
    int poweroff (
        int     vid,
        bool    hard,
        string& error_str);

    /**
     *  Holds a VM.
     *    @param vid VirtualMachine identification
     *    @return 0 on success, -1 if the VM does not exits or -2 if the VM is
     *    in a wrong a state
     */
    int hold(
        int     vid,
        string& error_str);

    /**
     *  Releases a VM.
     *    @param vid VirtualMachine identification
     *    @return 0 on success, -1 if the VM does not exits or -2 if the VM is
     *    in a wrong a state
     */
    int release(
        int     vid,
        string& error_str);

    /**
     *  Stops a VM.
     *    @param vid VirtualMachine identification
     *    @return 0 on success, -1 if the VM does not exits or -2 if the VM is
     *    in a wrong a state
     */
    int stop(
        int     vid,
        string& error_str);

    /**
     *  Suspends a VM.
     *    @param vid VirtualMachine identification
     *    @return 0 on success, -1 if the VM does not exits or -2 if the VM is
     *    in a wrong a state
     */
    int suspend(
        int     vid,
        string& error_str);

    /**
     *  Resumes a VM.
     *    @param vid VirtualMachine identification
     *    @return 0 on success, -1 if the VM does not exits or -2 if the VM is
     *    in a wrong a state
     */
    int resume(
        int     vid,
        string& error_str);

    /**
     *  Ends a VM life cycle inside ONE.
     *    @param vid VirtualMachine identification
     *    @return 0 on success, -1 if the VM does not exits or -2 if the VM is
     *    in a wrong a state
     */
    int finalize(
        int     vid,
        string& error_str);

    /**
     *  Moves a VM to PENDING state preserving any resource (i.e. leases) and id
     *    @param vid VirtualMachine identification
     *    @return 0 on success, -1 if the VM does not exits or -2 if the VM is
     *    in a wrong a state
     */
    int resubmit(
        int     vid,
        string& error_str);

    /**
     *  Reboots a VM preserving any resource and RUNNING state
     *    @param vid VirtualMachine identification
     *    @param hard True to force the shutdown (cancel instead of shutdown)
     *    @return 0 on success, -1 if the VM does not exits or -2 if the VM is
     *    in a wrong a state
     */
    int reboot(
        int     vid,
        bool    hard,
        string& error_str);

    /**
     *  Set the re-scheduling flag for the VM (must be in RUNNING state)
     *    @param vid VirtualMachine identification
     *    @param do_resched set or unset the flag
     *
     *    @return 0 on success, -1 if the VM does not exits or -2 if the VM is
     *    in a wrong a state
     */
    int resched(
        int     vid,
        bool    do_resched,
        string& error_str);

    /**
     *  Starts the attach disk action.
     *    @param vid VirtualMachine identification
     *    @param tmpl Template containing the new DISK attribute.
     *    @param error_str Error reason, if any
     *
     *    @return 0 on success, -1 otherwise
     */
    int attach(
        int                      vid,
        VirtualMachineTemplate * tmpl,
        string&                  error_str);

    /**
     * Starts the detach disk action.
     *    @param vid VirtualMachine identification
     *    @param disk_id Disk to detach
     *    @param error_str Error reason, if any
     *
     *    @return 0 on success, -1 otherwise
     */
    int detach(
        int      id,
        int      disk_id,
        string&  error_str);

    /**
     *  Starts the attach NIC action.
     *    @param vid VirtualMachine identification
     *    @param tmpl Template containing the new NIC attribute.
     *    @param error_str Error reason, if any
     *
     *    @return 0 on success, -1 otherwise
     */
    int attach_nic(
        int                      vid,
        VirtualMachineTemplate * tmpl,
        string&                  error_str);

    /**
     * Starts the detach NIC action.
     *    @param vid VirtualMachine identification
     *    @param nic_id NIC to detach
     *    @param error_str Error reason, if any
     *
     *    @return 0 on success, -1 otherwise
     */
    int detach_nic(
        int      id,
        int      nic_id,
        string&  error_str);
    /**
     * Starts the snapshot create action
     *
     * @param vid VirtualMachine identification
     * @param name Name for the new snapshot
     * @param snap_id Will contain the new snapshot ID
     * @param error_str Error reason, if any
     *
     * @return 0 on success, -1 otherwise
     */
    int snapshot_create(
        int         vid,
        string&     name,
        int&        snap_id,
        string&     error_str);

    /**
     * Starts the snapshot revert action
     *
     * @param vid VirtualMachine identification
     * @param snap_id Snapshot to be restored
     * @param error_str Error reason, if any
     *
     * @return 0 on success, -1 otherwise
     */
    int snapshot_revert(
        int         vid,
        int         snap_id,
        string&     error_str);

    /**
     * Starts the snapshot delete action
     *
     * @param vid VirtualMachine identification
     * @param snap_id Snapshot to be deleted
     * @param error_str Error reason, if any
     *
     * @return 0 on success, -1 otherwise
     */
    int snapshot_delete(
        int         vid,
        int         snap_id,
        string&     error_str);

    /**
     * Starts the disk snapshot create action
     *
     * @param vid VirtualMachine identification
     * @param did DISK identification
     * @param tag Description for the new snapshot
     * @param snap_id Will contain the new snapshot ID
     * @param error_str Error reason, if any
     *
     * @return 0 on success, -1 otherwise
     */
    int disk_snapshot_create(
        int           vid,
        int           did,
        const string& tag,
        int&          snap_id,
        string&       error_str);

    /**
     * Reverts the disk state to a previous snapshot
     *
     * @param vid VirtualMachine identification
     * @param did DISK identification
     * @param snap_id Snapshot to be restored
     * @param error_str Error reason, if any
     *
     * @return 0 on success, -1 otherwise
     */
    int disk_snapshot_revert(
        int         vid,
        int         did,
        int         snap_id,
        string&     error_str);
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
     *  Pointer to the Virtual Machine Pool, to access hosts
     */
    VirtualMachinePool *    vmpool;

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
	ImageManager *			imagem;

    /**
     *  Action engine for the Manager
     */
    ActionManager           am;

    /**
     *  Function to execute the Manager action loop method within a new pthread
     * (requires C linkage)
     */
    friend void * dm_action_loop(void *arg);

    /**
     *  The action function executed when an action is triggered.
     *    @param action the name of the action
     *    @param arg arguments for the action function
     */
    void do_action(
        const string &  action,
        void *          arg);

    /**
     * Called from finalize(). Releases the images and networks acquired by this
     * vm, and unlocks it.
     *   @param vm the VM
     */
    void finalize_cleanup(VirtualMachine * vm);

    //--------------------------------------------------------------------------
    // DM Actions associated with a VM state transition
    //--------------------------------------------------------------------------

    void  suspend_success_action(int vid);

    void  stop_success_action(int vid);

    void  undeploy_success_action(int vid);

    void  poweroff_success_action(int vid);

    void  done_action(int vid);

    void  resubmit_action(int vid);
};

#endif /*DISPATCH_MANAGER_H*/
