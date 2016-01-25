/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

#ifndef VIRTUAL_MACHINE_MANAGER_H_
#define VIRTUAL_MACHINE_MANAGER_H_

#include "MadManager.h"
#include "ActionManager.h"
#include "VirtualMachineManagerDriver.h"
#include "VirtualMachinePool.h"
#include "HostPool.h"
#include "DatastorePool.h"
#include "NebulaTemplate.h"

using namespace std;

extern "C" void * vmm_action_loop(void *arg);

class VirtualMachineManager : public MadManager, public ActionListener
{
public:

    VirtualMachineManager(
        time_t                    _timer_period,
        time_t                    _poll_period,
        bool                      _do_vm_poll,
        int                       _vm_limit,
        vector<const Attribute*>& _mads);

    ~VirtualMachineManager(){};

    enum Actions
    {
        DEPLOY,
        SAVE,
        SHUTDOWN,
        CANCEL,
        CANCEL_PREVIOUS,
        CLEANUP,
        CLEANUP_BOTH,
        CLEANUP_PREVIOUS,
        MIGRATE,
        RESTORE,
        REBOOT,
        RESET,
        POLL,
        TIMER,
        DRIVER_CANCEL,
        FINALIZE,
        ATTACH,
        DETACH,
        ATTACH_NIC,
        DETACH_NIC,
        SNAPSHOT_CREATE,
        SNAPSHOT_REVERT,
        SNAPSHOT_DELETE,
        DISK_SNAPSHOT_CREATE,
        DISK_SNAPSHOT_REVERT,
        UPDATE_CONTEXT
    };

    /**
     *  Triggers specific actions to the Virtual Machine Manager. This function
     *  wraps the ActionManager trigger function.
     *    @param action the VMM action
     *    @param vid VM unique id. This is the argument of the passed to the
     *    invoked action.
     */
    virtual void trigger(
        Actions action,
        int     vid);

    /**
     *  This functions starts the associated listener thread, and creates a
     *  new thread for the Virtual Machine Manager. This thread will wait in
     *  an action loop till it receives ACTION_FINALIZE.
     *    @return 0 on success.
     */
    int start();

    /**
     *  Gets the thread identification.
     *    @return pthread_t for the manager thread (that in the action loop).
     */
    pthread_t get_thread_id() const
    {
        return vmm_thread;
    };

    /**
     *  Loads Virtual Machine Manager Mads defined in configuration file
     *   @param uid of the user executing the driver. When uid is 0 the nebula
     *   identity will be used. Otherwise the Mad will be loaded through the
     *   sudo application.
     */
    int load_mads(int uid);

    /**
     *  Check if action is supported for imported VMs
     *    @param mad name of the driver
     *    @param action
     *    @return True if it is supported
     */
    bool is_imported_action_supported(const string& mad,History::VMAction action)
    {
        const VirtualMachineManagerDriver * vmd = get(mad);

        if ( vmd == 0 )
        {
            return false;
        }

        return vmd->is_imported_action_supported(action);
    }

private:
    /**
     *  Thread id for the Virtual Machine Manager
     */
    pthread_t               vmm_thread;

    /**
     *  Pointer to the Virtual Machine Pool, to access VMs
     */
    VirtualMachinePool *    vmpool;

    /**
     *  Pointer to the Host Pool, to access hosts
     */
    HostPool *              hpool;

    /**
     *  Pointer to the Datastore Pool
     */
    DatastorePool *         ds_pool;

    /**
     *  Timer period for the Virtual Machine Manager.
     */
    time_t                  timer_period;

    /**
     *  Virtual Machine polling interval
     */
    time_t                  poll_period;

    /**
     *  Perform pro-active VM monitoring
     */
    bool                    do_vm_poll;

    /**
     *  Virtual Machine polling limit
     */
    int                     vm_limit;

    /**
     *  Action engine for the Manager
     */
    ActionManager           am;

    /**
     *  Function to execute the Manager action loop method within a new pthread
     * (requires C linkage)
     */
    friend void * vmm_action_loop(void *arg);

    /**
     *  Returns a pointer to a Virtual Machine Manager driver.
     *    @param uid of the owner of the driver
     *    @param name of an attribute of the driver (e.g. its type)
     *    @param value of the attribute
     *    @return the VM driver owned by uid with attribute name equal to value
     *    or 0 in not found
     */
    const VirtualMachineManagerDriver * get(
        const string&   name,
        const string&   value)
    {
        return static_cast<const VirtualMachineManagerDriver *>
               (MadManager::get(0,name,value));
    };

    /**
     *  Returns a pointer to a Virtual Machine Manager driver. The driver is
     *  searched by its name.
     *    @param name the name of the driver
     *    @return the VM driver owned by uid with attribute name equal to value
     *    or 0 in not found
     */
    const VirtualMachineManagerDriver * get(
        const string&   name)
    {
        string _name("NAME");
        return static_cast<const VirtualMachineManagerDriver *>
               (MadManager::get(0,_name,name));
    };

    /**
     *  The action function executed when an action is triggered.
     *    @param action the name of the action
     *    @param arg arguments for the action function
     */
    void do_action(
        const string &  action,
        void *          arg);

    /**
     *  Function to format a VMM Driver message in the form:
     *  <VMM_DRIVER_ACTION_DATA>
     *      <HOST> hostname </HOST>
     *      <NET_DRV> net_drv </NET_DRV>
     *      <MIGR_HOST> m_hostname </MIGR_HOST>
     *      <MIGR_NET_DRV> m_net_drv  </MIGR_NET_DRV>
     *      <DOMAIN> domain_id </DOMAIN>
     *      <DEPLOYMENT_FILE> dfile </DEPLOYMENT_FILE>
     *      <CHECKPOINT_FILE> cfile </CHECKPOINT_FILE>
     *      <VM>
     *          VM representation in XML
     *      </VM>
     *      <DATASTORE>
     *          System DS information in XML
     *      </DATASTORE>
     *  </VMM_DRIVER_ACTION_DATA>
     *
     *    @param hostname of the host to perform the action
     *    @param net_drv name of the vlan driver
     *    @param m_hostname name of the host to migrate the VM
     *    @param m_net_drv name of the vlan driver
     *    @param domain domain id as returned by the hypervisor
     *    @param dfile deployment file to boot the VM
     *    @param cfile checkpoint file to save the VM
     *    @param disk_id Disk to attach/detach, if any
     *    @param tm_command Transfer Manager command to attach/detach, if any
     *    @param tm_command_rollback TM command in case of attach failure
     *    @param disk_target_path Path of the disk to attach, if any
     *    @param tmpl the VM information in XML
     *    @param ds_id of the system datastore
     */
    string * format_message(
        const string& hostname,
        const string& net_drv,
        const string& m_hostname,
        const string& m_net_drv,
        const string& domain,
        const string& ldfile,
        const string& rdfile,
        const string& cfile,
        const string& tm_command,
        const string& tm_command_rollback,
        const string& disk_target_path,
        const string& tmpl,
        int ds_id);

    /**
     *  Function executed when a DEPLOY action is received. It deploys a VM on
     *  a Host.
     *    @param vid the id of the VM to be deployed.
     */
    void deploy_action(
        int vid);

    /**
     *  Function to stop a running VM and generate a checkpoint file. This
     *  function is executed when a SAVE action is triggered.
     *    @param vid the id of the VM.
     */
    void save_action(
        int vid);

    /**
     *  Shutdowns a VM when a SHUTDOWN action is received.
     *    @param vid the id of the VM.
     */
    void shutdown_action(
        int vid);

    /**
     *  Cancels a VM when a CANCEL action is received.
     *    @param vid the id of the VM.
     */
    void cancel_action(
        int vid);

    /**
     *  Cancels a VM (in the previous host) when a CANCEL action is received.
     *  Note that the domain-id is the last one returned by a boot action
     *    @param vid the id of the VM.
     */
    void cancel_previous_action(
        int vid);

    /**
     *  Cleanups a host (cancel VM + delete disk images).
     *    @param vid the id of the VM.
     *    @param cancel_previous if true the VM will be canceled in the previous
     *    host (only relevant to delete VM's in MIGRATE state)
     */
    void cleanup_action(
        int vid, bool cancel_previous);

    /**
     *  Cleanups the previous host (cancel VM + delete disk images).
     *    @param vid the id of the VM.
     */
    void cleanup_previous_action(
        int vid);

    /**
     *  Function to migrate (live) a VM (MIGRATE action).
     *    @param vid the id of the VM.
     */
    void migrate_action(
        int vid);

    /**
     *  Restores a VM from a checkpoint file.
     *    @param vid the id of the VM.
     */
    void restore_action(
        int vid);

    /**
     *  Reboots a running VM.
     *    @param vid the id of the VM.
     */
    void reboot_action(
        int vid);

    /**
     *  Resets a running VM.
     *    @param vid the id of the VM.
     */
    void reset_action(
        int vid);

    /**
     *  Polls a VM.
     *    @param vid the id of the VM.
     */
    void poll_action(
        int vid);

    /**
     *  This function is executed periodically to poll the running VMs
     */
    void timer_action();

    /**
     * Attaches a new disk to a VM. The VM must have a disk with the
     * attribute ATTACH = YES
     *    @param vid the id of the VM.
     */
    void attach_action(
        int vid);

    /**
     * Detaches a disk from a VM. The VM must have a disk with the
     * attribute ATTACH = YES
     *    @param vid the id of the VM.
     */
    void detach_action(
        int vid);

    /**
     * Updates the context cdrom
     *    @param vid the id of the VM.
     */
    void update_context_action(
        int vid);

    /**
     * Attaches a new NIC to a VM. The VM must have a NIC with the
     * attribute ATTACH = YES
     *    @param vid the id of the VM.
     */
    void attach_nic_action(
        int vid);

    /**
     * Detaches a NIC from a VM. The VM must have a NIC with the
     * attribute ATTACH = YES
     *    @param vid the id of the VM.
     */
    void detach_nic_action(
        int vid);

    /**
     * Creates a new system snapshot. The VM must have a snapshot with the
     * attribute ACTIVE = YES
     *
     * @param vid the id of the VM.
     */
    void snapshot_create_action(int vid);

    /**
     * Reverts to a snapshot. The VM must have a snapshot with the
     * attribute ACTIVE = YES
     *
     * @param vid the id of the VM.
     */
    void snapshot_revert_action(int vid);

    /**
     * Deletes a snapshot. The VM must have a snapshot with the
     * attribute ACTIVE = YES
     *
     * @param vid the id of the VM.
     */
    void snapshot_delete_action(int vid);

    /**
     * Creates a new disk system snapshot.
     *
     * @param vid the id of the VM.
     */
    void disk_snapshot_create_action(int vid);

    /**
     * Reverts to a disk snapshot.
     *
     * @param vid the id of the VM.
     */
    void disk_snapshot_revert_action(int vid);

    /**
     *  This function cancels the current driver operation
     */
    void driver_cancel_action(
        int vid);
};

#endif /*VIRTUAL_MACHINE_MANAGER_H*/
