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

#ifndef DISPATCH_MANAGER_H_
#define DISPATCH_MANAGER_H_

#include "Listener.h"
#include "VMActions.h"

//Forward definitions
class TransferManager;
class LifeCycleManager;
class VirtualMachineManager;
class ImageManager;
class ClusterPool;
class HostPool;
class VirtualMachinePool;
class VirtualNetworkPool;
class VirtualRouterPool;
class UserPool;
class SecurityGroupPool;
class VirtualMachine;
class VirtualMachineTemplate;

struct RequestAttributes;


class DispatchManager : public Listener
{
public:

    DispatchManager()
        : Listener("Dispatch Manager")
    {
    }

    ~DispatchManager() = default;

    /**
     * Initializes internal pointers to other managers. Must be called when
     * all the other managers exist in Nebula::instance
     */
    void init_managers();

    /**
     *  This functions creates a new thread for the Dispatch Manager. This
     *  thread will wait in an action loop till it receives ACTION_FINALIZE.
     *    @return 0 on success.
     */
    int start();

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
    int deploy(std::unique_ptr<VirtualMachine> vm,
               const RequestAttributes& request);

    /**
     *  Sets an imported VM to RUNNING state, a history record MUST be added,
     *  and the VM MUST be locked.
     *    @param vm pointer to a VirtualMachine with its mutex locked.
     *    @param ra information about the API call request
     *    @return 0 on success
     */
    int import(std::unique_ptr<VirtualMachine> vm,
               const RequestAttributes& ra);

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
                  std::string& error_str);

    /**
     *  Shuts down a VM, but it is saved in the system DS instead of destroyed.
     *    @param vid VirtualMachine identification
     *    @param hard True to force the shutdown (cancel instead of shutdown)
     *    @param ra information about the API call request
     *    @return 0 on success, -1 if the VM does not exits or -2 if the VM is
     *    in a wrong a state
     */
    int undeploy(int vid, bool hard, const RequestAttributes& ra,
                 std::string& error_str);

    /**
     *  Powers off a VM.
     *    @param vid VirtualMachine identification
     *    @param ra information about the API call request
     *    @param hard True to force the poweroff (cancel instead of shutdown)
     *    @return 0 on success, -1 if the VM does not exits or -2 if the VM is
     *    in a wrong a state
     */
    int poweroff(int vid, bool hard, const RequestAttributes& ra,
                 std::string& error_str);

    /**
     *  Holds a VM.
     *    @param vid VirtualMachine identification
     *    @param ra information about the API call request
     *    @return 0 on success, -1 if the VM does not exits or -2 if the VM is
     *    in a wrong a state
     */
    int hold(int vid, const RequestAttributes& ra, std::string& error_str);

    /**
     *  Releases a VM.
     *    @param vid VirtualMachine identification
     *    @param ra information about the API call request
     *    @return 0 on success, -1 if the VM does not exits or -2 if the VM is
     *    in a wrong a state
     */
    int release(int vid, const RequestAttributes& ra, std::string& error_str);

    /**
     *  Stops a VM.
     *    @param vid VirtualMachine identification
     *    @param ra information about the API call request
     *    @return 0 on success, -1 if the VM does not exits or -2 if the VM is
     *    in a wrong a state
     */
    int stop(int vid, const RequestAttributes& ra, std::string& error_str);

    /**
     *  Suspends a VM.
     *    @param vid VirtualMachine identification
     *    @param ra information about the API call request
     *    @return 0 on success, -1 if the VM does not exits or -2 if the VM is
     *    in a wrong a state
     */
    int suspend(int vid, const RequestAttributes& ra, std::string& error_str);

    /**
     *  Resumes a VM.
     *    @param vid VirtualMachine identification
     *    @param ra information about the API call request
     *    @return 0 on success, -1 if the VM does not exits or -2 if the VM is
     *    in a wrong a state
     */
    int resume(int vid, const RequestAttributes& ra, std::string& error_str);

    /**
     *  Ends a VM life cycle inside ONE.
     *    @param vm VirtualMachine object
     *    @param ra information about the API call request
     *    @return 0 on success, the VM mutex is unlocked
     */
    int delete_vm(std::unique_ptr<VirtualMachine> vm,
                  const RequestAttributes& ra,
                  std::string& error_str);

    /**
     *  VM ID interface
     */
    int delete_vm(int vid, const RequestAttributes& ra, std::string& error_str);

    /**
     *  Moves a VM to PENDING state preserving any resource (i.e. leases) and id
     *    @param vm VirtualMachine object
     *    @param ra information about the API call request
     *    @return 0 on success
     */
    int delete_recreate(std::unique_ptr<VirtualMachine> vm,
                        const RequestAttributes& ra,
                        std::string& error_str);

    /**
     *  Ends a VM life cycle inside ONE but let the VM running at the Hipervisor.
     *    @param vm VirtualMachine object
     *    @param ra information about the API call request
     *    @return 0 on success, the VM mutex is unlocked
     */
    int delete_vm_db(std::unique_ptr<VirtualMachine> vm,
                     const RequestAttributes& ra,
                     std::string& error_str);

    /**
     *  Recover the last operation on the VM
     *    @param vm VirtualMachine object
     *    @param success if the operation is assumed to succeed or not
     *    @param ra information about the API call request
     *    @return 0 on success
     */
    int recover(std::unique_ptr<VirtualMachine> vm,
                bool success,
                const RequestAttributes& ra,
                std::string& error_str);

    /**
     *  Retry the last operation on the VM
     *    @param vm VirtualMachine object
     *    @param ra information about the API call request
     *    @return 0 on success
     */
    int retry(std::unique_ptr<VirtualMachine> vm, const RequestAttributes& ra,
              std::string& error_str);

    /**
     *  Reboots a VM preserving any resource and RUNNING state
     *    @param vid VirtualMachine identification
     *    @param hard True to force the shutdown (cancel instead of shutdown)
     *    @param ra information about the API call request
     *    @return 0 on success, -1 if the VM does not exits or -2 if the VM is
     *    in a wrong a state
     */
    int reboot(int vid, bool hard, const RequestAttributes& ra,
               std::string& error_str);

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
                std::string& error_str);

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
               const RequestAttributes& ra, std::string& error_str);

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
               std::string&  error_str);

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
                   const RequestAttributes& ra, std::string& error_str);

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
                   std::string& error_str);

    /**
     *  Starts the update NIC action.
     *    @param vid VirtualMachine identification
     *    @param nic_id NIC identification
     *    @param tmpl Template containing the new NIC attribute.
     *    @param ra information about the API call request
     *    @param error_str Error reason, if any
     *
     *    @return 0 on success, -1 otherwise
     */
    int update_nic(int vid,
                   int nic_id,
                   VirtualMachineTemplate * tmpl,
                   bool append,
                   const RequestAttributes& ra,
                   std::string& error_str);

    /**
     *  Starts the recover NIC action.
     *    @param vid VirtualMachine identification
     *    @param nic_id NIC identification
     *    @param network_id Network identification
     *    @param error_str Error reason, if any
     *
     *    @return 0 on success, -1 otherwise
     */
    int recover_nic(int vid,
                    int nic_id,
                    int network_id,
                    std::string& error_str);

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
    int snapshot_create(int vid, std::string& name, int& snap_id,
                        const RequestAttributes& ra, std::string& error_str);

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
                        std::string& error_str);

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
                        std::string& error_str);

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
    int disk_snapshot_create(int vid, int did, const std::string& name,
                             int& snap_id, const RequestAttributes& ra, std::string& error_str);

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
                             const RequestAttributes& ra, std::string& error_str);

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
                             const RequestAttributes& ra, std::string& error_str);

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
                    const RequestAttributes& ra, std::string& error_str);

    /**
     * Update virtual machine context
     *
     * @param vid VirtualMachine identification
     * @param ra information about the API call request
     * @param error_str Error reason, if any
     *
     * @return 0 on success, -1 otherwise
     */
    int live_updateconf(std::unique_ptr<VirtualMachine> vm,
                        const RequestAttributes& ra, std::string& error_str);

    /**
     * Attach a new SG to a VM NIC
     *
     *  @param vid the VM id
     *  @param nicid the id of the VM NIC
     *  @param sgid the SG id
     *  @param ra information about the API call request
     *  @param error_str Error reason, if any
     *
     *  @return 0 on success, -1 otherwise
     */
    int attach_sg(int vid, int nicid, int sgid,
                  const RequestAttributes& ra, std::string& error_str);

    /**
     * Detach a SG from VM NIC
     *
     *  @param vid the VM id
     *  @param nicid the id of the VM NIC
     *  @param sgid the SG id
     *  @param ra information about the API call request
     *  @param error_str Error reason, if any
     *
     *  @return 0 on success, -1 otherwise
     */
    int detach_sg(int vid, int nicid, int sgid,
                  const RequestAttributes& ra, std::string& error_str);

    /**
     * Backup a VM
     *
     *  @param vid the VM id
     *  @param bck_ds_is the ID of the datastore to save the backup
     *  @param reset create a full backup (valid only for incremental backup mode)
     *  @param ra information about the API call request
     *  @param error_str Error reason, if any
     *
     *  @return 0 on success, -1 otherwise
     */
    int backup(int vid, int bck_ds_id, bool reset,
               const RequestAttributes& ra, std::string& error_str);

    /**
     * Cancel ongoing backup operation
     *
     *  @param vid the VM id
     *  @param ra information about the API call request
     *  @param error_str Error reason, if any
     *
     *  @return 0 on success, -1 otherwise
     */
    int backup_cancel(int vid, const RequestAttributes& ra, std::string& error_str);

    /**
     * Restore VM from backup
     *
     *  @param vid the VM id
     *  @param img_id the ID of the backup Image
     *  @param inc_id the ID of the increment to restore
     *  @param disk_id the ID of the disk (-1 for all)
     *  @param ra information about the API call request
     *  @param error_str Error reason, if any
     *
     *  @return 0 on success, -1 otherwise
     */
    int restore(int vid, int img_id, int inc_id, int disk_id,
                const RequestAttributes& ra, std::string& error_str);

    /**
     * Resize cpu and memory
     *
     *  @param vid the VM id
     *  @param cpu new CPU value
     *  @param vcpu new VCPU value
     *  @param memory new memory value
     *  @param ra information about the API call request
     *  @param error_str Error reason, if any
     *
     *  @return 0 on success, -1 otherwise
     */
    int resize(int vid, float cpu, int vcpu, long memory,
               const RequestAttributes& ra, std::string& error_str);

    /**
     * Attach a new PCI device
     *
     *  @param vid the VM id
     *  @param pci attribute with the PCI device info
     *  @param ra information about the API call request
     *  @param error_str Error reason, if any
     *
     *  @return 0 on success, -1 otherwise
     */
    int attach_pci(int vid, VectorAttribute * pci, const RequestAttributes& ra,
                   std::string& err);
    /**
     * Detach an existing PCI device
     *
     *  @param vid the VM id
     *  @param pci_id the PCI device ID
     *  @param pci attribute with the PCI device info
     *  @param ra information about the API call request
     *  @param error_str Error reason, if any
     *
     *  @return 0 on success, -1 otherwise
     */
    int detach_pci(int vid, int pci_id, const RequestAttributes& ra,
                   std::string&  err);

    //--------------------------------------------------------------------------
    // DM Actions associated with a VM state transition
    //--------------------------------------------------------------------------

    void trigger_suspend_success(int vid);

    void trigger_stop_success(int vid);

    void trigger_undeploy_success(int vid);

    void trigger_poweroff_success(int vid);

    void trigger_done(int vid);

    void trigger_resubmit(int vid);

    static void close_cp_history(VirtualMachinePool *vmpool, VirtualMachine *vm,
                                 VMActions::Action action, const RequestAttributes& ra);

private:
    /**
     *  Pointer to the Host Pool, to access hosts
     */
    HostPool *              hpool = nullptr;

    /**
     *  Pointer to the Virtual Machine Pool, to access VMs
     */
    VirtualMachinePool *    vmpool = nullptr;

    /**
     *  Pointer to the User Pool, to access user
     */
    UserPool *              upool = nullptr;

    /**
     *  Pointer to the Cluster Pool
     */
    ClusterPool *           clpool = nullptr;

    /**
     * Pointer to Security Group Pool
     */
    SecurityGroupPool *     sgpool = nullptr;

    /**
     * Pointer to VirtualNetworkPool
     */
    VirtualNetworkPool *    vnpool = nullptr;

    /**
     *  Pointer to the Virtual Router Pool
     */
    VirtualRouterPool *     vrouterpool = nullptr;

    /**
     * Pointer to TransferManager
     */
    TransferManager *       tm = nullptr;

    /**
     * Pointer to VirtualMachineManager
     */
    VirtualMachineManager * vmm = nullptr;

    /**
     * Pointer to LifeCycleManager
     */
    LifeCycleManager *       lcm = nullptr;

    /**
     * Pointer to ImageManager
     */
    ImageManager *          imagem = nullptr;

    /**
     *  Frees the resources associated to a VM: disks, ip addresses and Quotas
     */
    void free_vm_resources(std::unique_ptr<VirtualMachine> vm, bool check_images);
};

#endif /*DISPATCH_MANAGER_H*/
