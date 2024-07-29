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

#ifndef TRANSFER_MANAGER_H_
#define TRANSFER_MANAGER_H_

#include "ProtocolMessages.h"
#include "DriverManager.h"
#include "Listener.h"

class HostPool;
class VirtualMachine;
class VirtualMachineDisk;
class VirtualMachinePool;
class LifeCycleManager;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class TransferManager :
    public DriverManager<Driver<transfer_msg_t>>,
                                              public Listener
{
public:

    TransferManager(
            VirtualMachinePool * _vmpool,
            HostPool *           _hpool,
            const std::string&   _mad_location):
        DriverManager(_mad_location),
        Listener("Transfer Manager"),
        vmpool(_vmpool),
        hpool(_hpool)
    {
    };

    ~TransferManager() = default;

    /**
     *  This functions starts the associated listener thread, and creates a
     *  new thread for the Information Manager. This thread will wait in
     *  an action loop till it receives ACTION_FINALIZE.
     *    @return 0 on success.
     */
    int start();

    /**
     *  Loads Transfer Manager Drivers in configuration file
     *   @param _mads configuration of drivers
     */
    int load_drivers(const std::vector<const VectorAttribute*>& _mads);

    /**
     * Inserts a transfer command in the xfs stream
     *
     * @param vm The VM
     * @param disk Disk to transfer
     * @param disk_index Disk index
     * @param system_tm_mad The Transfer Manager for the system datastore
     * @param opennebula_hostname The front-end hostname
     * @param xfr Stream where the transfer command will be written
     * @param error Error reason, if any
     *
     * @return 0 on success
     */
    int prolog_transfer_command(
            VirtualMachine *        vm,
            const VirtualMachineDisk* disk,
            const std::string&      system_tm_mad,
            const std::string&      opennebula_hostname,
            std::ostream&           xfr,
            std::ostringstream&     error);

    /**
     * Inserts a context command in the xfs stream
     *
     * @param vm The VM
     * @param token_password Owner user's token password
     * @param system_tm_mad The Transfer Manager for the system datastore
     * @param disk_id of the context disk
     * @param xfr Stream where the transfer command will be written
     *
     * @return -1 in case of error, 0 if the VM has no context, 1 on success
     */
    int prolog_context_command(
            VirtualMachine *        vm,
            const std::string&      token_password,
            const std::string&      system_tm_mad,
            int&                    disk_id,
            std::ostream&           xfr);

    /**
     * Inserts a transfer command in the xfs stream
     *
     * @param vm The VM
     * @param host where the operation will be performed fe or host
     * @param disk Disk to transfer
     * @param disk_index Disk index
     * @param xfr Stream where the transfer command will be written
     */
    void epilog_transfer_command(
            VirtualMachine *        vm,
            const std::string&      host,
            const VirtualMachineDisk * disk,
            std::ostream&           xfr);
    /**
     * Inserts a transfer command in the xfs stream, for live migration
     *
     * @param vm The VM
     * @param xfr Stream where the transfer command will be written
     */
    void migrate_transfer_command(
            VirtualMachine *        vm,
            std::ostream&           xfr);

    /**
     *  This function generates the epilog_delete sequence for current,
     *  front-end and previous hosts.
     *    @param vm pointer to VM, locked
     *    @param xfr stream to write the commands
     *    @param local true to delete the front-end
     *    @param previous true to delete the previous host
     *
     *    @return 0 on success
     */
    int epilog_delete_commands(VirtualMachine *vm,
                               std::ostream&   xfr,
                               bool            local,
                               bool            previous);
    /**
     *  This function generates the TM command for the given snapshot action
     *    @param vm pointer to VM, locked
     *    @param snap_action: "SNAP_CREATE, SNAP_DELETE, SNAP_REVERT"
     *    @param xfr stream to write the commands
     *
     *    @return 0 on success
     */
    int snapshot_transfer_command(const VirtualMachine * vm,
                                  const char * snap_action,
                                  std::ostream& xfr);

    /**
     *  Inserts a resize command in the xfr stream
     *    @param vm
     *    @param disk to resize
     *    @param xfr stream to include the command.
     */
    void resize_command(
            VirtualMachine *           vm,
            const VirtualMachineDisk * disk,
            std::ostream&              xfr);

    /**
     *  Generate backup commands for each VM disk
     *    @param vm
     *    @param xfr stream to include the command.
     *    @param os describing error if any
     *
     *    @return 0 on success
     */
    int backup_transfer_commands(
            VirtualMachine *    vm,
            std::ostream&       xfr);

    /**
     *  Generate backup cancel command
     *    @param vm
     *    @param xfr stream to include the command.
     *    @param os describing error if any
     *
     *    @return 0 on success
     */
    int backup_cancel_transfer_commands(
            VirtualMachine *    vm,
            std::ostream&       xfr);

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
     *  Generic name for the TransferManager driver
     */
    static const char *  transfer_driver_name;

    /**
     *  Returns a pointer to a Transfer Manager driver. The driver is
     *  searched by its name.
     *    @param name the name of the driver
     *    @return the TM driver owned by uid with attribute name equal to value
     *    or 0 in not found
     */
    const Driver<transfer_msg_t> * get(const std::string& name) const
    {
        return DriverManager::get_driver(name);
    };

    /**
     *  Returns a pointer to a Transfer Manager driver. The driver is
     *  searched by its name.
     *    @return the TM driver for the Transfer Manager
     */
    const Driver<transfer_msg_t> * get() const
    {
        return DriverManager::get_driver(transfer_driver_name);
    };

    // -------------------------------------------------------------------------
    // Protocol implementation, procesing messages from driver
    // -------------------------------------------------------------------------
    static void _undefined(std::unique_ptr<transfer_msg_t> msg);

    void _transfer(std::unique_ptr<transfer_msg_t> msg);

    static void _log(std::unique_ptr<transfer_msg_t> msg);

    // -------------------------------------------------------------------------
    // Action Listener interface
    // -------------------------------------------------------------------------
    static const int drivers_timeout = 10;

    void finalize_action() override
    {
        DriverManager::stop(drivers_timeout);
    };

public:
    /**
     *  This function starts the prolog sequence
     */
    void trigger_prolog(VirtualMachine * vm);

    /**
     *  This function starts the prolog migration sequence
     */
    void trigger_prolog_migr(VirtualMachine * vm);

    /**
     *  This function starts the prolog resume sequence
     */
    void trigger_prolog_resume(VirtualMachine * vm);

    /**
     *  This function starts the prolog attach sequence
     */
    void trigger_prolog_attach(VirtualMachine * vm);

    /**
     *  This function starts the epilog sequence
     */
    void trigger_epilog(bool local, VirtualMachine * vm);

    /**
     *  This function starts the epilog_stop sequence
     */
    void trigger_epilog_stop(VirtualMachine * vm);

    /**
     *  This function starts the epilog_delete sequence in the current host
     *    @param vid the Virtual Machine ID
     */
    void trigger_epilog_delete(VirtualMachine * vm)
    {
        trigger_epilog_delete(false, vm);
    }

    /**
     *  This function starts the epilog_delete_stop sequence on the local host
     *  i.e. the front-end (the VM is not running)
     *    @param vid the Virtual Machine ID
     */
    void trigger_epilog_delete_stop(VirtualMachine * vm)
    {
        trigger_epilog_delete(true, vm);
    }

    /**
     *  This function starts the epilog_delete sequence on the previous host
     *    @param vid the Virtual Machine ID
     */
    void trigger_epilog_delete_previous(VirtualMachine * vm);

    /**
     *  This function starts the epilog_delete sequence on the current and
     *  previous hosts
     *    @param vid the Virtual Machine ID
     */
    void trigger_epilog_delete_both(VirtualMachine * vm);

    /**
     *  This function starts the epilog_delete sequence
     */
    void trigger_epilog_delete(bool local, VirtualMachine * vm);

    /**
     *  This function starts the epilog detach sequence
     */
    void trigger_epilog_detach(VirtualMachine * vm);

    /**
     * This function cancels the operation being performed by the driver
     */
    void trigger_driver_cancel(int vid);

    /**
     * This function starts the saveas of the given disk
     */
    void trigger_saveas_hot(int vid);

    /**
     * This function performs a generic snapshot action
     */
    void do_snapshot_action(int vid, const char * action);

    /**
     * This function takes an snapshot of a disk
     */
    void trigger_snapshot_create(int vid);

    /**
     * This function takes an snapshot of a disk
     */
    void trigger_snapshot_revert(int vid);

    /**
     * This function deletes an snapshot of a disk
     */
    void trigger_snapshot_delete(int vid);

    /**
     * This function resizes a VM disk
     */
    void trigger_resize(int vid);

    /**
     * This function restores VM disk from backup
     */
    void trigger_restore(int vid, int img_id, int inc_id, int disk_id);
};

#endif /*TRANSFER_MANAGER_H*/
