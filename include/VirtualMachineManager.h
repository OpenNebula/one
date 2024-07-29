/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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

#include "VirtualMachineManagerDriver.h"
#include "DriverManager.h"
#include "Listener.h"

class DatastorePool;
class HostPool;
class VirtualMachine;
class VirtualMachinePool;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VirtualMachineManager :
    public DriverManager<VirtualMachineManagerDriver>,
    public Listener
{
public:

    VirtualMachineManager(
            const std::string&        _mads);

    ~VirtualMachineManager() = default;

    /**
     *  This functions starts the associated listener thread, and creates a
     *  new thread for the Virtual Machine Manager. This thread will wait in
     *  an action loop till it receives ACTION_FINALIZE.
     *    @return 0 on success.
     */
    int start();

    /**
     *  Loads Virtual Machine Manager Mads defined in configuration file
     *   @param _mads configuration of drivers
     */
    int load_drivers(const std::vector<const VectorAttribute*>& _mads);

    /**
     *  Check if action is supported for imported VMs
     *    @param mad name of the driver
     *    @param action
     *    @return True if it is supported
     */
    bool is_imported_action_supported(const std::string& mad, VMActions::Action action)
    {
        const VirtualMachineManagerDriver * vmd = get(mad);

        if ( vmd == nullptr )
        {
            return false;
        }

        return vmd->is_imported_action_supported(action);
    }

    /**
     * Updates firewall rules of a VM
     *   @param vm pointer to VM, needs to be locked
     *   @param sgid the id of the security group
     *
     *   @return 0 on success
     */
    int updatesg(VirtualMachine * vm, int sgid);

    /**
     * Updates nic attributes of a VM
     *   @param vm pointer to VM, needs to be locked
     *   @param vnid the id of the virtual network
     *
     *   @return 0 on success
     */
    int updatenic(VirtualMachine * vm, int vnid);

    /**
     * Get keep_snapshots capability from driver
     */
    bool is_keep_snapshots(const std::string& name)
    {
        const VirtualMachineManagerDriver * vmd = get(name);

        if ( vmd == nullptr )
        {
            return false;
        }

        return vmd->is_keep_snapshots();
    }

    /**
     * Get cold_nic_attach behavior for the driver. When true the driver will be
     * invoked in cold NIC attach operations
     */
    bool is_cold_nic_attach(const std::string& name)
    {
        const VirtualMachineManagerDriver * vmd = get(name);

        if ( vmd == nullptr )
        {
            return false;
        }

        return vmd->is_cold_nic_attach();
    }

    /**
     * Get live_resize capability from driver
     */
    bool is_live_resize(const std::string& name)
    {
        const VirtualMachineManagerDriver * vmd = get(name);

        if ( vmd == nullptr )
        {
            return false;
        }

        return vmd->is_live_resize();
    }

    /**
     *  Returns a pointer to a Virtual Machine Manager driver. The driver is
     *  searched by its name.
     *    @param name the name of the driver
     *    @return the VM driver owned by uid with attribute name equal to value
     *    or 0 in not found
     */
    const VirtualMachineManagerDriver * get(const std::string& name) const
    {
        return DriverManager::get_driver(name);
    };

    /**
     *  Validates raw sections in the Virtual Machine Template for the
     *  target driver
     *  @param template of the virtual machine
     *  @param error_str error if any
     *
     *  @return 0 on success (valid raw)
     */
    int validate_raw(const Template * vmt, std::string& error_str);

    /**
     *  Validate if the VM template satisfy all driver conditions
     *  @param vmm_mad is the tm_mad for system datastore chosen
     */
    int validate_template(const std::string& vmm_mad, const VirtualMachine* vm,
                          int hid, int cluster_id, std::string& error);

private:
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

    // -------------------------------------------------------------------------
    // Protocol implementation, procesing messages from driver
    // -------------------------------------------------------------------------
    static void _undefined(std::unique_ptr<vm_msg_t> msg);

    /**
     *
     */
    void _deploy(std::unique_ptr<vm_msg_t> msg);

    /**
     *
     */
    void _shutdown(std::unique_ptr<vm_msg_t> msg);

    /**
     *
     */
    void _reset(std::unique_ptr<vm_msg_t> msg);

    /**
     *
     */
    void _reboot(std::unique_ptr<vm_msg_t> msg);

    /**
     *
     */
    void _cancel(std::unique_ptr<vm_msg_t> msg);

    /**
     *
     */
    void _cleanup(std::unique_ptr<vm_msg_t> msg);

    /**
     *
     */
    void _checkpoint(std::unique_ptr<vm_msg_t> msg);

    /**
     *
     */
    void _save(std::unique_ptr<vm_msg_t> msg);

    /**
     *
     */
    void _restore(std::unique_ptr<vm_msg_t> msg);

    /**
     *
     */
    void _migrate(std::unique_ptr<vm_msg_t> msg);

    /**
     *
     */
    void _attachdisk(std::unique_ptr<vm_msg_t> msg);

    /**
     *
     */
    void _detachdisk(std::unique_ptr<vm_msg_t> msg);

    /**
     *
     */
    void _attachnic(std::unique_ptr<vm_msg_t> msg);

    /**
     *
     */
    void _detachnic(std::unique_ptr<vm_msg_t> msg);

    /**
     *
     */
    void _snapshotcreate(std::unique_ptr<vm_msg_t> msg);

    /**
     *
     */
    void _snapshotrevert(std::unique_ptr<vm_msg_t> msg);

    /**
     *
     */
    void _snapshotdelete(std::unique_ptr<vm_msg_t> msg);

    /**
     *
     */
    void _disksnapshotcreate(std::unique_ptr<vm_msg_t> msg);

    /**
     *
     */
    void _disksnapshotrevert(std::unique_ptr<vm_msg_t> msg);

    /**
     *
     */
    void _resizedisk(std::unique_ptr<vm_msg_t> msg);

    /**
     *
     */
    void _updateconf(std::unique_ptr<vm_msg_t> msg);

    /**
     *
     */
    void _updatesg(std::unique_ptr<vm_msg_t> msg);

    /**
     *
     */
    void _driver_cancel(std::unique_ptr<vm_msg_t> msg);

    /**
     *
     */
    void _resize(std::unique_ptr<vm_msg_t> msg);

    /**
     *
     */
    void _log(std::unique_ptr<vm_msg_t> msg);

    /**
     *
     */
    void _backup(std::unique_ptr<vm_msg_t> msg);

    /**
     *
     */
    void _updatenic(std::unique_ptr<vm_msg_t> msg);

    /**
     *
     */
    void log_error(VirtualMachine* vm_id,
                   const std::string& payload,
                   const std::string& msg);

    /**
     *
     */
    void log_error(int vm_id,
                   const std::string& payload,
                   const std::string& msg);


    /**
     *
     */
    bool check_vm_state(int vm_id, vm_msg_t* msg);

    // -------------------------------------------------------------------------
    // Action Listener interface
    // -------------------------------------------------------------------------

    static const int drivers_timeout = 10;

    void finalize_action() override
    {
        DriverManager::stop(drivers_timeout);
    };

    /**
     *  Function to format a VMM Driver message in the form:
     *  <VMM_DRIVER_ACTION_DATA>
     *      <HOST> hostname </HOST>
     *      <MIGR_HOST> m_hostname </MIGR_HOST>
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
     *    @param m_hostname name of the host to migrate the VM
     *    @param domain domain id as returned by the hypervisor
     *    @param dfile deployment file to boot the VM
     *    @param cfile checkpoint file to save the VM
     *    @param disk_id Disk to attach/detach, if any
     *    @param tm_command Transfer Manager command to attach/detach, if any
     *    @param tm_command_rollback TM command in case of attach failure
     *    @param disk_target_path Path of the disk to attach, if any
     *    @param tmpl the VM information in XML
     *    @param ds_id of the system datastore
     *    @param id of the security group
     */
    std::string format_message(
            const std::string& hostname,
            const std::string& m_hostname,
            const std::string& domain,
            const std::string& ldfile,
            const std::string& rdfile,
            const std::string& cfile,
            const std::string& tm_command,
            const std::string& tm_command_rollback,
            const std::string& disk_target_path,
            const std::string& tmpl,
            int ds_id,
            int sgid = -1,
            int nicid = -1);

public:
    /**
     *  Function executed when a DEPLOY action is received. It deploys a VM on
     *  a Host.
     *    @param vid the id of the VM to be deployed.
     */
    void trigger_deploy(int vid);

    /**
     *  Function to stop a running VM and generate a checkpoint file. This
     *  function is executed when a SAVE action is triggered.
     *    @param vid the id of the VM.
     */
    void trigger_save(int vid);

    /**
     *  Shutdowns a VM when a SHUTDOWN action is received.
     *    @param vid the id of the VM.
     */
    void trigger_shutdown(int vid);

    /**
     *  Cancels a VM when a CANCEL action is received.
     *    @param vid the id of the VM.
     */
    void trigger_cancel(int vid);

    /**
     *  Cancels a VM (in the previous host) when a CANCEL action is received.
     *  Note that the domain-id is the last one returned by a boot action
     *    @param vid the id of the VM.
     */
    void trigger_cancel_previous(int vid);

    /**
     *  Cleanups a host (cancel VM + delete disk images).
     *    @param vid the id of the VM.
     *    @param cancel_previous if true the VM will be canceled in the previous
     *    host (only relevant to delete VM's in MIGRATE state)
     */
    void trigger_cleanup(int vid, bool cancel_previous);

    /**
     *  Cleanups the previous host (cancel VM + delete disk images).
     *    @param vid the id of the VM.
     */
    void trigger_cleanup_previous(int vid);

    /**
     *  Function to migrate (live) a VM (MIGRATE action).
     *    @param vid the id of the VM.
     */
    void trigger_migrate(int vid);

    /**
     *  Restores a VM from a checkpoint file.
     *    @param vid the id of the VM.
     */
    void trigger_restore(int vid);

    /**
     *  Reboots a running VM.
     *    @param vid the id of the VM.
     */
    void trigger_reboot(int vid);

    /**
     *  Resets a running VM.
     *    @param vid the id of the VM.
     */
    void trigger_reset(int vid);

    /**
     * Attaches a new disk to a VM. The VM must have a disk with the
     * attribute ATTACH = YES
     *    @param vid the id of the VM.
     */
    void trigger_attach(int vid);

    /**
     * Detaches a disk from a VM. The VM must have a disk with the
     * attribute ATTACH = YES
     *    @param vid the id of the VM.
     */
    void trigger_detach(int vid);

    /**
     * Attaches a new NIC to a VM. The VM must have a NIC with the
     * attribute ATTACH = YES
     *    @param vid the id of the VM.
     */
    void trigger_attach_nic(int vid);

    /**
     * Detaches a NIC from a VM. The VM must have a NIC with the
     * attribute ATTACH = YES
     *    @param vid the id of the VM.
     */
    void trigger_detach_nic(int vid);

    /**
     *  This function cancels the current driver operation
     */
    void trigger_driver_cancel(int vid);

    /**
     * Creates a new system snapshot. The VM must have a snapshot with the
     * attribute ACTIVE = YES
     *
     * @param vid the id of the VM.
     */
    void trigger_snapshot_create(int vid);

    /**
     * Reverts to a snapshot. The VM must have a snapshot with the
     * attribute ACTIVE = YES
     *
     * @param vid the id of the VM.
     */
    void trigger_snapshot_revert(int vid);

    /**
     * Deletes a snapshot. The VM must have a snapshot with the
     * attribute ACTIVE = YES
     *
     * @param vid the id of the VM.
     */
    void trigger_snapshot_delete(int vid);

    /**
     * Creates a new disk system snapshot.
     *
     * @param vid the id of the VM.
     */
    void trigger_disk_snapshot_create(int vid);

    /**
     * Resize a VM disk
     *
     * @param vid the id of the VM.
     */
    void trigger_disk_resize(int vid);

    /**
     * Update VM context
     *
     * @param vid the id of the VM.
     */
    void trigger_update_conf(int vid);

    /**
     * Update VM context
     *
     * @param vid the id of the VM.
     */
    void trigger_resize(int vid);

    /**
       * Create backup for the VM
       *
       * @param vid the id of the VM.
       */
    void trigger_backup(int vid);

    /**
       * Cancel ongoing backup operation
       *
       * @param vid the id of the VM.
       */
    void trigger_backup_cancel(int vid);
};

#endif /*VIRTUAL_MACHINE_MANAGER_H*/
