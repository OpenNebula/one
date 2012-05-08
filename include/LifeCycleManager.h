/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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

using namespace std;

extern "C" void * lcm_action_loop(void *arg);

/**
 *  The Virtual Machine Life-cycle Manager module. This class is responsible for
 *  managing the life-cycle of a Virtual Machine.
 */
class LifeCycleManager : public ActionListener
{
public:

    LifeCycleManager(VirtualMachinePool * _vmpool, HostPool * _hpool):
        vmpool(_vmpool),hpool(_hpool)
    {
        am.addListener(this);
    };

    ~LifeCycleManager(){};

    enum Actions
    {
        SAVE_SUCCESS,     /**< Sent by the VMM when a save action succeeds    */
        SAVE_FAILURE,     /**< Sent by the VMM when a save action fails       */
        DEPLOY_SUCCESS,   /**< Sent by the VMM when a deploy/restore/migrate action succeeds  */
        DEPLOY_FAILURE,   /**< Sent by the VMM when a deploy/restore/migrate action fails     */
        SHUTDOWN_SUCCESS, /**< Sent by the VMM when a shutdown action succeeds*/
        SHUTDOWN_FAILURE, /**< Sent by the VMM when a shutdown action fails   */
        CANCEL_SUCCESS,   /**< Sent by the VMM when a cancel action succeeds  */
        CANCEL_FAILURE,   /**< Sent by the VMM when a cancel action fails     */
        MONITOR_FAILURE,  /**< Sent by the VMM when a VM has failed while active */
        MONITOR_SUSPEND,  /**< Sent by the VMM when a VM is paused while active */
        MONITOR_DONE,     /**< Sent by the VMM when a VM is not found */
        PROLOG_SUCCESS,   /**< Sent by the TM when the prolog phase succeeds  */
        PROLOG_FAILURE,   /**< Sent by the TM when the prolog phase fails     */
        EPILOG_SUCCESS,   /**< Sent by the TM when the epilog phase succeeds  */
        EPILOG_FAILURE,   /**< Sent by the TM when the epilog phase fails     */
        DEPLOY,           /**< Sent by the DM to deploy a VM on a host        */
        SUSPEND,          /**< Sent by the DM to suspend an running VM        */
        RESTORE,          /**< Sent by the DM to restore a suspended VM       */
        STOP,             /**< Sent by the DM to stop an running VM           */
        CANCEL,           /**< Sent by the DM to cancel an running VM         */
        MIGRATE,          /**< Sent by the DM to migrate a VM to other host   */
        LIVE_MIGRATE,     /**< Sent by the DM to live-migrate a VM            */
        SHUTDOWN,         /**< Sent by the DM to shutdown a running VM        */
        RESTART,          /**< Sent by the DM to restart a deployed VM        */
        DELETE,           /**< Sent by the DM to delete a VM                  */
        CLEAN,            /**< Sent by the DM to cleanup a VM for resubmission*/
        FINALIZE
    };

    /**
     *  Triggers specific actions to the Life-cycle Manager. This function
     *  wraps the ActionManager trigger function.
     *    @param action the LCM action
     *    @param vid VM unique id. This is the argument of the passed to the
     *    invoked action.
     */
    void trigger(
        Actions action,
        int     vid);

    /**
     *  This functions starts a new thread for the Life-cycle Manager. This
     *  thread will wait in  an action loop till it receives ACTION_FINALIZE.
     *    @return 0 on success.
     */
    int start();

    /**
     *  Gets the thread identification.
     *    @return pthread_t for the manager thread (that in the action loop).
     */
    pthread_t get_thread_id() const
    {
        return lcm_thread;
    };

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
     *  Action engine for the Manager
     */
    ActionManager           am;

    /**
     *  Function to execute the Manager action loop method within a new pthread
     * (requires C linkage)
     */
    friend void * lcm_action_loop(void *arg);

    /**
     *  The action function executed when an action is triggered.
     *    @param action the name of the action
     *    @param arg arguments for the action function
     */
    void do_action(
        const string &  action,
        void *          arg);

    /**
     *  Cleans up a VM, canceling any pending or ongoing action and closing
     *  the history registers
     *      @param vm with the lock aquired
     */
    void clean_up_vm (VirtualMachine *vm);

    void save_success_action(int vid);

    void save_failure_action(int vid);

    void deploy_success_action(int vid);

    void deploy_failure_action(int vid);

    void shutdown_success_action(int vid);

    void shutdown_failure_action(int vid);

    void cancel_success_action(int vid);

    void cancel_failure_action(int vid);

    void monitor_failure_action(int vid);

    void monitor_suspend_action(int vid);

    void monitor_done_action(int vid);

    void prolog_success_action(int vid);

    void prolog_failure_action(int vid);

    void epilog_success_action(int vid);

    void epilog_failure_action(int vid);

    void deploy_action(int vid);

    void suspend_action(int vid);

    void restore_action(int vid);

    void stop_action(int vid);

    void cancel_action(int vid);

    void checkpoint_action(int vid);

    void migrate_action(int vid);

    void live_migrate_action(int vid);

    void shutdown_action(int vid);

    void failure_action(VirtualMachine * vm);

    void restart_action(int vid);

    void delete_action(int vid);

    void clean_action(int vid);

    void timer_action();
};

#endif /*LIFE_CYCLE_MANAGER_H_*/
