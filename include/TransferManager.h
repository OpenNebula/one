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

#ifndef TRANSFER_MANAGER_H_
#define TRANSFER_MANAGER_H_

#include "MadManager.h"
#include "ActionManager.h"
#include "VirtualMachinePool.h"
#include "LifeCycleManager.h"
#include "TransferManagerDriver.h"

using namespace std;

extern "C" void * tm_action_loop(void *arg);

class TransferManager : public MadManager, public ActionListener
{
public:

    TransferManager(
    	VirtualMachinePool *      	_vmpool,
        HostPool *                	_hpool,
        vector<const Attribute*>&   _mads):
            MadManager(_mads),
            vmpool(_vmpool),
            hpool(_hpool)
    {
        am.addListener(this);
    };

    ~TransferManager(){};

    enum Actions
    {
        PROLOG,
        PROLOG_MIGR,
        PROLOG_RESUME,
        PROLOG_ATTACH,
        EPILOG,
        EPILOG_STOP,
        EPILOG_DELETE,
        EPILOG_DELETE_PREVIOUS,
        EPILOG_DELETE_STOP,
        EPILOG_DELETE_BOTH,
        EPILOG_DETACH,
        CHECKPOINT,
        DRIVER_CANCEL,
        SAVEAS_HOT,
        SNAPSHOT_CREATE,
        SNAPSHOT_REVERT,
        SNAPSHOT_DELETE,
        FINALIZE
    };

    /**
     *  Triggers specific actions to the Information Manager. This function
     *  wraps the ActionManager trigger function.
     *    @param action the IM action
     *    @param vid VM unique id. This is the argument of the passed to the
     *    invoked action.
     */
    virtual void trigger(
        Actions action,
        int     vid);

    /**
     *  This functions starts the associated listener thread, and creates a
     *  new thread for the Information Manager. This thread will wait in
     *  an action loop till it receives ACTION_FINALIZE.
     *    @return 0 on success.
     */
    int start();

    /**
     *  Loads Virtual Machine Manager Mads defined in configuration file
     *   @param uid of the user executing the driver. When uid is 0 the nebula
     *   identity will be used. Otherwise the Mad will be loaded through the
     *   sudo application.
     */
    int load_mads(int uid);

    /**
     *  Gets the thread identification.
     *    @return pthread_t for the manager thread (that in the action loop).
     */
    pthread_t get_thread_id() const
    {
        return tm_thread;
    };

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
            const VectorAttribute * disk,
            string&                 system_tm_mad,
            string&                 opennebula_hostname,
            ostream&                xfr,
            ostringstream&          error);

    /**
     * Inserts a transfer command in the xfs stream
     *
     * @param vm The VM
     * @param disk Disk to transfer
     * @param disk_index Disk index
     * @param xfr Stream where the transfer command will be written
     */
    void epilog_transfer_command(
            VirtualMachine *        vm,
            const VectorAttribute * disk,
            ostream&                xfr);
    /**
     * Inserts a transfer command in the xfs stream, for live migration
     *
     * @param vm The VM
     * @param xfr Stream where the transfer command will be written
     */
    void migrate_transfer_command(
        VirtualMachine *        vm,
        ostream&                xfr);

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
                               ostream&        xfr,
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
    int snapshot_transfer_command(VirtualMachine * vm,
                                  const char * snap_action,
                                  ostream& xfr);
private:
    /**
     *  Thread id for the Transfer Manager
     */
    pthread_t               tm_thread;

    /**
     *  Pointer to the Virtual Machine Pool, to access VMs
     */
    VirtualMachinePool *    vmpool;

    /**
     *  Pointer to the Host Pool, to access hosts
     */
    HostPool *              hpool;

    /**
     *  Action engine for the Manager
     */
    ActionManager   		am;

    /**
     *  Generic name for the TransferManager driver
     */
     static const char *  transfer_driver_name;

    /**
     *  Returns a pointer to a Transfer Manager driver.
     *    @param name of an attribute of the driver (e.g. its type)
     *    @param value of the attribute
     *    @return the TM driver owned by uid with attribute name equal to value
     *    or 0 in not found
     */
    const TransferManagerDriver * get(
        const string&   name,
        const string&   value)
    {
        return static_cast<const TransferManagerDriver *>
               (MadManager::get(0,name,value));
    };

    /**
     *  Returns a pointer to a Transfer Manager driver. The driver is
     *  searched by its name.
     *    @param name the name of the driver
     *    @return the TM driver owned by uid with attribute name equal to value
     *    or 0 in not found
     */
    const TransferManagerDriver * get(
        const string&   name)
    {
        string _name("NAME");
        return static_cast<const TransferManagerDriver *>
               (MadManager::get(0,_name,name));
    };

    /**
     *  Returns a pointer to a Transfer Manager driver. The driver is
     *  searched by its name.
     *    @return the TM driver for the Transfer Manager
     */
    const TransferManagerDriver * get()
    {
        string _name("NAME");
        return static_cast<const TransferManagerDriver *>
               (MadManager::get(0,_name,transfer_driver_name));
    };

    /**
     *  Function to execute the Manager action loop method within a new pthread
     * (requires C linkage)
     */
    friend void * tm_action_loop(void *arg);

    /**
     *  The action function executed when an action is triggered.
     *    @param action the name of the action
     *    @param arg arguments for the action function
     */
    void do_action(
        const string &  action,
        void *          arg);

    /**
     *  This function starts the prolog sequence
     */
    void prolog_action(int vid);

    /**
     *  This function starts the prolog migration sequence
     */
    void prolog_migr_action(int vid);

    /**
     *  This function starts the prolog resume sequence
     */
    void prolog_resume_action(int vid);

    /**
     *  This function starts the prolog attach sequence
     */
    void prolog_attach_action(int vid);

    /**
     *  This function starts the epilog sequence
     */
    void epilog_action(int vid);

    /**
     *  This function starts the epilog_stop sequence
     */
    void epilog_stop_action(int vid);

    /**
     *  This function starts the epilog_delete sequence in the current host
     *    @param vid the Virtual Machine ID
     */
    void epilog_delete_action(int vid)
    {
        epilog_delete_action(false, vid);
    }

    /**
     *  This function starts the epilog_delete_stop sequence on the local host
     *  i.e. the front-end (the VM is not running)
     *    @param vid the Virtual Machine ID
     */
    void epilog_delete_stop_action(int vid)
    {
        epilog_delete_action(true, vid);
    }

    /**
     *  This function starts the epilog_delete sequence on the previous host
     *    @param vid the Virtual Machine ID
     */
    void epilog_delete_previous_action(int vid);

    /**
     *  This function starts the epilog_delete sequence on the current and
     *  previous hosts
     *    @param vid the Virtual Machine ID
     */
    void epilog_delete_both_action(int vid);

    /**
     *  This function starts the epilog_delete sequence
     */
    void epilog_delete_action(bool local, int vid);

    /**
     *  This function starts the epilog detach sequence
     */
    void epilog_detach_action(int vid);

    /**
     *  This function starts the epilog sequence
     */
    void checkpoint_action(int vid);

    /**
     * This function cancels the operation being performed by the driver
     */
    void driver_cancel_action(int vid);

    /**
     * This function starts the saveas of the given disk
     */
    void saveas_hot_action(int vid);

    /**
     * This function performs a generic snapshot action
     */
    void do_snapshot_action(int vid, const char * action);

    /**
     * This function takes an snapshot of a disk
     */
    void snapshot_create_action(int vid);

    /**
     * This function takes an snapshot of a disk
     */
    void snapshot_revert_action(int vid);

    /**
     * This function deletes an snapshot of a disk
     */
    void snapshot_delete_action(int vid);
};

#endif /*TRANSFER_MANAGER_H*/
