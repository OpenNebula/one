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

#include "LifeCycleManager.h"
#include "Nebula.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::save_success_action(int vid)
{
    VirtualMachine *    vm;
    ostringstream       os;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if ( vm->get_lcm_state() == VirtualMachine::SAVE_MIGRATE )
    {
        Nebula&             nd = Nebula::instance();
        TransferManager *   tm = nd.get_tm();
        int                 cpu,mem,disk;
        time_t              the_time = time(0);

        //----------------------------------------------------
        //                PROLOG_MIGRATE STATE
        //----------------------------------------------------

        vm->set_state(VirtualMachine::PROLOG_MIGRATE);

        vm->delete_snapshots();

        map<string, string> empty;
        vm->update_info(0, 0, -1, -1, empty);

        vmpool->update(vm);

        vm->set_previous_etime(the_time);

        vm->set_previous_vm_info();

        vm->set_previous_running_etime(the_time);

        vm->set_previous_reason(History::USER);

        vmpool->update_previous_history(vm);

        vm->set_prolog_stime(the_time);

        vmpool->update_history(vm);

        vm->get_requirements(cpu,mem,disk);

        hpool->del_capacity(vm->get_previous_hid(), vm->get_oid(), cpu, mem, disk);

        vm->log("LCM", Log::INFO, "New VM state is PROLOG_MIGRATE");

        //----------------------------------------------------

        tm->trigger(TransferManager::PROLOG_MIGR,vid);
    }
    else if (vm->get_lcm_state() == VirtualMachine::SAVE_SUSPEND)
    {
        Nebula&             nd = Nebula::instance();
        DispatchManager *   dm = nd.get_dm();
        time_t              the_time = time(0);

        //----------------------------------------------------
        //                SUSPENDED STATE
        //----------------------------------------------------

        vm->delete_snapshots();

        map<string, string> empty;
        vm->update_info(0, 0, -1, -1, empty);

        vmpool->update(vm);

        vm->set_running_etime(the_time);

        vm->set_etime(the_time);

        vm->set_vm_info();

        vm->set_reason(History::USER);

        vmpool->update_history(vm);

        //----------------------------------------------------

        dm->trigger(DispatchManager::SUSPEND_SUCCESS,vid);
    }
    else if ( vm->get_lcm_state() == VirtualMachine::SAVE_STOP)
    {
        Nebula&             nd = Nebula::instance();
        TransferManager *   tm = nd.get_tm();
        time_t              the_time = time(0);

        //----------------------------------------------------
        //                 EPILOG_STOP STATE
        //----------------------------------------------------

        vm->set_state(VirtualMachine::EPILOG_STOP);

        vm->delete_snapshots();

        map<string, string> empty;
        vm->update_info(0, 0, -1, -1, empty);

        vmpool->update(vm);

        vm->set_epilog_stime(the_time);

        vm->set_running_etime(the_time);

        vm->set_reason(History::USER);

        vmpool->update_history(vm);

        vm->log("LCM", Log::INFO, "New VM state is EPILOG_STOP");

        //----------------------------------------------------

        tm->trigger(TransferManager::EPILOG_STOP,vid);
    }
    else
    {
        vm->log("LCM",Log::ERROR,"save_success_action, VM in a wrong state");
    }

    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::save_failure_action(int vid)
{
    VirtualMachine *    vm;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if ( vm->get_lcm_state() == VirtualMachine::SAVE_MIGRATE )
    {
        int                     cpu,mem,disk;
        time_t                  the_time = time(0);

        Nebula&                 nd = Nebula::instance();
        VirtualMachineManager * vmm = nd.get_vmm();

        //----------------------------------------------------
        //           RUNNING STATE FROM SAVE_MIGRATE
        //----------------------------------------------------

        vm->set_state(VirtualMachine::RUNNING);

        vm->set_etime(the_time);

        vm->set_vm_info();

        vm->set_reason(History::ERROR);

        vmpool->update_history(vm);

        vm->get_requirements(cpu,mem,disk);

        hpool->del_capacity(vm->get_hid(), vm->get_oid(), cpu, mem, disk);

        vm->set_previous_etime(the_time);

        vm->set_previous_vm_info();

        vm->set_previous_running_etime(the_time);

        vm->set_previous_reason(History::USER);

        vmpool->update_previous_history(vm);

        // --- Add new record by copying the previous one

        vm->cp_previous_history();

        vmpool->update(vm); //update last_seq & state

        vm->set_stime(the_time);

        vm->set_running_stime(the_time);

        vm->set_last_poll(0);

        vmpool->update_history(vm);

        vm->log("LCM", Log::INFO, "Fail to save VM state while migrating."
                " Assuming that the VM is still RUNNING (will poll VM).");

        //----------------------------------------------------

        vmm->trigger(VirtualMachineManager::POLL,vid);
    }
    else if ( vm->get_lcm_state() == VirtualMachine::SAVE_SUSPEND ||
              vm->get_lcm_state() == VirtualMachine::SAVE_STOP )
    {
        Nebula&                 nd = Nebula::instance();
        VirtualMachineManager * vmm = nd.get_vmm();

        //----------------------------------------------------
        //    RUNNING STATE FROM SAVE_SUSPEND OR SAVE_STOP
        //----------------------------------------------------

        vm->set_state(VirtualMachine::RUNNING);

        vmpool->update(vm);

        vm->set_action(History::NONE_ACTION);

        vmpool->update_history(vm);

        vm->log("LCM", Log::INFO, "Fail to save VM state."
                " Assuming that the VM is still RUNNING (will poll VM).");

        //----------------------------------------------------

        vmm->trigger(VirtualMachineManager::POLL,vid);
    }
    else
    {
        vm->log("LCM",Log::ERROR,"save_failure_action, VM in a wrong state");
    }

    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::deploy_success_action(int vid)
{
    VirtualMachine *    vm;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    //----------------------------------------------------
    //                 RUNNING STATE
    //----------------------------------------------------

    if ( vm->get_lcm_state() == VirtualMachine::MIGRATE )
    {
        int     cpu,mem,disk;
        time_t  the_time = time(0);

        vm->set_running_stime(the_time);

        vm->set_last_poll(0);

        vmpool->update_history(vm);

        vm->set_previous_etime(the_time);

        vm->set_previous_vm_info();

        vm->set_previous_running_etime(the_time);

        vm->set_previous_reason(History::USER);

        vmpool->update_previous_history(vm);

        vm->get_requirements(cpu,mem,disk);

        hpool->del_capacity(vm->get_previous_hid(), vm->get_oid(), cpu, mem, disk);

        vm->set_state(VirtualMachine::RUNNING);

        vm->delete_snapshots();

        vmpool->update(vm);

        vm->log("LCM", Log::INFO, "New VM state is RUNNING");
    }
    else if ( vm->get_lcm_state() == VirtualMachine::BOOT ||
              vm->get_lcm_state() == VirtualMachine::BOOT_POWEROFF ||
              vm->get_lcm_state() == VirtualMachine::BOOT_UNKNOWN  ||
              vm->get_lcm_state() == VirtualMachine::BOOT_SUSPENDED||
              vm->get_lcm_state() == VirtualMachine::BOOT_STOPPED ||
              vm->get_lcm_state() == VirtualMachine::BOOT_UNDEPLOY ||
              vm->get_lcm_state() == VirtualMachine::BOOT_MIGRATE ||
              vm->get_lcm_state() == VirtualMachine::BOOT_MIGRATE_FAILURE ||
              vm->get_lcm_state() == VirtualMachine::BOOT_FAILURE )
    {
        vm->set_state(VirtualMachine::RUNNING);

        vmpool->update(vm);

        vm->log("LCM", Log::INFO, "New VM state is RUNNING");
    }
    else
    {
        vm->log("LCM",Log::ERROR,"deploy_success_action, VM in a wrong state");
    }

    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::deploy_failure_action(int vid)
{

    VirtualMachine *    vm;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    time_t  the_time = time(0);

    if ( vm->get_lcm_state() == VirtualMachine::MIGRATE )
    {
        int     cpu,mem,disk;
        time_t  the_time = time(0);

        Nebula&                 nd = Nebula::instance();
        VirtualMachineManager * vmm = nd.get_vmm();

        //----------------------------------------------------
        //           RUNNING STATE FROM MIGRATE
        //----------------------------------------------------

        vm->set_state(VirtualMachine::RUNNING);

        vmpool->update(vm);

        vm->set_etime(the_time);

        vm->set_vm_info();

        vm->set_reason(History::ERROR);

        vmpool->update_history(vm);

        vm->set_previous_etime(the_time);

        vm->set_previous_vm_info();

        vm->set_previous_running_etime(the_time);

        vm->set_previous_reason(History::USER);

        vmpool->update_previous_history(vm);

        vm->get_requirements(cpu,mem,disk);

        hpool->del_capacity(vm->get_hid(), vm->get_oid(), cpu, mem, disk);

        // --- Add new record by copying the previous one

        vm->cp_previous_history();

        vmpool->update(vm); //update last_seq & state

        vm->set_stime(the_time);

        vm->set_running_stime(the_time);

        vm->set_last_poll(0);

        vmpool->update_history(vm);

        vm->log("LCM", Log::INFO, "Fail to live migrate VM."
                " Assuming that the VM is still RUNNING (will poll VM).");

        //----------------------------------------------------

        vmm->trigger(VirtualMachineManager::POLL,vid);
    }
    else if (vm->get_lcm_state() == VirtualMachine::BOOT ||
             vm->get_lcm_state() == VirtualMachine::BOOT_FAILURE)
    {
        vm->set_state(VirtualMachine::BOOT_FAILURE);

        vmpool->update(vm);

        vm->log("LCM", Log::INFO, "Fail to boot VM. New VM state is BOOT_FAILURE");
    }
    else if (vm->get_lcm_state() == VirtualMachine::BOOT_MIGRATE ||
             vm->get_lcm_state() == VirtualMachine::BOOT_MIGRATE_FAILURE )
    {
        vm->set_state(VirtualMachine::BOOT_MIGRATE_FAILURE);

        vmpool->update(vm);

        vm->log("LCM", Log::INFO, "Fail to boot VM. New VM state is BOOT_MIGRATE_FAILURE");
    }
    else if (vm->get_lcm_state() == VirtualMachine::BOOT_UNKNOWN)
    {
        vm->set_state(VirtualMachine::UNKNOWN);

        vmpool->update(vm);

        vm->log("LCM", Log::INFO, "Fail to boot VM. New VM state is UNKNOWN");
    }
    else if (vm->get_lcm_state() == VirtualMachine::BOOT_POWEROFF)
    {
        vm->set_etime(the_time);
        vm->set_running_etime(the_time);

        vm->set_state(VirtualMachine::POWEROFF);
        vm->set_state(VirtualMachine::LCM_INIT);

        vmpool->update(vm);
        vmpool->update_history(vm);

        vm->log("LCM", Log::INFO, "Fail to boot VM. New VM state is POWEROFF");
    }
    else if (vm->get_lcm_state() == VirtualMachine::BOOT_SUSPENDED)
    {
        vm->set_etime(the_time);
        vm->set_running_etime(the_time);

        vm->set_state(VirtualMachine::SUSPENDED);
        vm->set_state(VirtualMachine::LCM_INIT);

        vmpool->update(vm);
        vmpool->update_history(vm);

        vm->log("LCM", Log::INFO, "Fail to boot VM. New VM state is SUSPENDED");
    }
    else if (vm->get_lcm_state() == VirtualMachine::BOOT_STOPPED)
    {
        Nebula&             nd = Nebula::instance();
        TransferManager *   tm = nd.get_tm();
        time_t              the_time = time(0);

        //----------------------------------------------------
        //             EPILOG_STOP STATE FROM BOOT
        //----------------------------------------------------

        vm->set_state(VirtualMachine::EPILOG_STOP);

        vmpool->update(vm);

        vm->set_epilog_stime(the_time);

        vm->set_running_etime(the_time);

        vm->set_reason(History::ERROR);

        vmpool->update_history(vm);

        vm->log("LCM", Log::INFO, "Fail to boot VM. New VM state is EPILOG_STOP");

        //----------------------------------------------------

        tm->trigger(TransferManager::EPILOG_STOP,vid);
    }
    else if (vm->get_lcm_state() == VirtualMachine::BOOT_UNDEPLOY)
    {
        Nebula&             nd = Nebula::instance();
        TransferManager *   tm = nd.get_tm();
        time_t              the_time = time(0);

        //----------------------------------------------------
        //            EPILOG_UNDEPLOY STATE FROM BOOT
        //----------------------------------------------------

        vm->set_state(VirtualMachine::EPILOG_UNDEPLOY);

        vmpool->update(vm);

        vm->set_epilog_stime(the_time);

        vm->set_running_etime(the_time);

        vm->set_reason(History::ERROR);

        vmpool->update_history(vm);

        vm->log("LCM", Log::INFO, "Fail to boot VM. New VM state is EPILOG_UNDEPLOY");

        //----------------------------------------------------

        tm->trigger(TransferManager::EPILOG_STOP,vid);
    }
    else
    {
        vm->log("LCM",Log::ERROR,"deploy_failure_action, VM in a wrong state");
    }

    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::shutdown_success_action(int vid)
{
    Nebula&             nd = Nebula::instance();
    TransferManager *   tm = nd.get_tm();
    DispatchManager *   dm = nd.get_dm();
    VirtualMachine *    vm;
    time_t              the_time = time(0);

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if ( vm->get_lcm_state() == VirtualMachine::SHUTDOWN )
    {
        //----------------------------------------------------
        //                   EPILOG STATE
        //----------------------------------------------------

        vm->set_state(VirtualMachine::EPILOG);

        vm->delete_snapshots();

        map<string, string> empty;
        vm->update_info(0, 0, -1, -1, empty);

        vmpool->update(vm);

        vm->set_epilog_stime(the_time);

        vm->set_running_etime(the_time);

        vm->set_reason(History::USER);

        vmpool->update_history(vm);

        vm->log("LCM", Log::INFO, "New VM state is EPILOG");

        //----------------------------------------------------

        tm->trigger(TransferManager::EPILOG,vid);
    }
    else if (vm->get_lcm_state() == VirtualMachine::SHUTDOWN_POWEROFF)
    {
        //----------------------------------------------------
        //                POWEROFF STATE
        //----------------------------------------------------

        vm->delete_snapshots();

        map<string, string> empty;
        vm->update_info(0, 0, -1, -1, empty);

        vmpool->update(vm);

        vm->set_running_etime(the_time);

        vm->set_etime(the_time);

        vm->set_vm_info();

        vm->set_reason(History::USER);

        vmpool->update_history(vm);

        //----------------------------------------------------

        dm->trigger(DispatchManager::POWEROFF_SUCCESS,vid);
    }
    else if (vm->get_lcm_state() == VirtualMachine::SHUTDOWN_UNDEPLOY)
    {
        //----------------------------------------------------
        //            EPILOG_UNDEPLOY STATE
        //----------------------------------------------------

        vm->set_state(VirtualMachine::EPILOG_UNDEPLOY);

        vm->delete_snapshots();

        map<string, string> empty;
        vm->update_info(0, 0, -1, -1, empty);

        vmpool->update(vm);

        vm->set_epilog_stime(the_time);

        vm->set_running_etime(the_time);

        vm->set_reason(History::USER);

        vmpool->update_history(vm);

        vm->log("LCM", Log::INFO, "New VM state is EPILOG_UNDEPLOY");

        //----------------------------------------------------

        tm->trigger(TransferManager::EPILOG_STOP,vid);
    }
    else
    {
        vm->log("LCM",Log::ERROR,"shutdown_success_action, VM in a wrong state");
    }

    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::shutdown_failure_action(int vid)
{
    VirtualMachine *        vm;

    Nebula&                 nd = Nebula::instance();
    VirtualMachineManager * vmm = nd.get_vmm();

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if ( vm->get_lcm_state() == VirtualMachine::SHUTDOWN ||
         vm->get_lcm_state() == VirtualMachine::SHUTDOWN_POWEROFF ||
         vm->get_lcm_state() == VirtualMachine::SHUTDOWN_UNDEPLOY )
    {
        //----------------------------------------------------
        //    RUNNING STATE FROM SHUTDOWN
        //----------------------------------------------------

        vm->set_state(VirtualMachine::RUNNING);

        vmpool->update(vm);

        vm->set_action(History::NONE_ACTION);

        vmpool->update_history(vm);

        vm->log("LCM", Log::INFO, "Fail to shutdown VM."
                " Assuming that the VM is still RUNNING (will poll VM).");

        //----------------------------------------------------

        vmm->trigger(VirtualMachineManager::POLL,vid);
    }
    else
    {
        vm->log("LCM",Log::ERROR,"shutdown_failure_action, VM in a wrong state");
    }

    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::prolog_success_action(int vid)
{
    Nebula&                 nd = Nebula::instance();
    VirtualMachineManager * vmm = nd.get_vmm();
    VirtualMachine *        vm;
    time_t                  the_time = time(0);
    ostringstream           os;

    VirtualMachineManager::Actions action;
    VirtualMachine::LcmState       lcm_state;

    vm = vmpool->get(vid, true);

    if ( vm == 0 )
    {
        return;
    }

    lcm_state = vm->get_lcm_state();

    if (lcm_state == VirtualMachine::PROLOG ||
        lcm_state == VirtualMachine::PROLOG_UNDEPLOY )
    {
        action = VirtualMachineManager::DEPLOY;
    }
    else if ( lcm_state == VirtualMachine::PROLOG_MIGRATE ||
              lcm_state == VirtualMachine::PROLOG_RESUME )
    {
        action = VirtualMachineManager::RESTORE;
    }
    else
    {
        vm->log("LCM",Log::ERROR,"prolog_success_action, VM in a wrong state");
        vm->unlock();

        return;
    }

    //----------------------------------------------------
    //                     BOOT STATE
    //----------------------------------------------------

    if ( lcm_state == VirtualMachine::PROLOG_RESUME )
    {
        vm->set_state(VirtualMachine::BOOT_STOPPED);
    }
    else if ( lcm_state == VirtualMachine::PROLOG_UNDEPLOY )
    {
        vm->set_state(VirtualMachine::BOOT_UNDEPLOY);
    }
    else if ( lcm_state == VirtualMachine::PROLOG_MIGRATE )
    {
        vm->set_state(VirtualMachine::BOOT_MIGRATE);
    }
    else // PROLOG
    {
        vm->set_state(VirtualMachine::BOOT);
    }

    vmpool->update(vm);

    vm->set_prolog_etime(the_time);

    vm->set_running_stime(the_time);

    vm->set_last_poll(0);

    vmpool->update_history(vm);

    vm->log("LCM", Log::INFO, "New VM state is BOOT");

    //----------------------------------------------------

    vmm->trigger(action,vid);

    vm->unlock();

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::prolog_failure_action(int vid)
{
    VirtualMachine::LcmState    state;
    VirtualMachine *            vm;

    time_t  the_time = time(0);

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    state = vm->get_lcm_state();

    if ( state == VirtualMachine::PROLOG ||
         state == VirtualMachine::PROLOG_MIGRATE )
    {
        vm->set_prolog_etime(the_time);

        failure_action(vm);
    }
    else if ( state == VirtualMachine::PROLOG_RESUME )
    {
        //----------------------------------------------------
        //    STOPPED STATE FROM PROLOG_RESUME
        //----------------------------------------------------

        Nebula&             nd = Nebula::instance();
        DispatchManager *   dm = nd.get_dm();

        int                 cpu,mem,disk;

        vm->set_prolog_etime(the_time);

        vm->set_resched(false);

        vmpool->update(vm);

        vm->set_etime(the_time);

        vm->set_vm_info();

        vm->set_reason(History::ERROR);

        vmpool->update_history(vm);

        vm->get_requirements(cpu,mem,disk);

        hpool->del_capacity(vm->get_hid(), vm->get_oid(), cpu, mem, disk);

        //----------------------------------------------------

        dm->trigger(DispatchManager::STOP_SUCCESS,vid);
    }
    else if ( state == VirtualMachine::PROLOG_UNDEPLOY )
    {
        //----------------------------------------------------
        //    UNDEPLOY STATE FROM PROLOG_UNDEPLOY
        //----------------------------------------------------

        Nebula&             nd = Nebula::instance();
        DispatchManager *   dm = nd.get_dm();

        int                 cpu,mem,disk;

        vm->set_prolog_etime(the_time);

        vm->set_resched(false);

        vmpool->update(vm);

        vm->set_etime(the_time);

        vm->set_vm_info();

        vm->set_reason(History::ERROR);

        vmpool->update_history(vm);

        vm->get_requirements(cpu,mem,disk);

        hpool->del_capacity(vm->get_hid(), vm->get_oid(), cpu, mem, disk);

        //----------------------------------------------------

        dm->trigger(DispatchManager::UNDEPLOY_SUCCESS,vid);
    }
    else
    {
        vm->log("LCM",Log::ERROR,"prolog_failure_action, VM in a wrong state");
    }

    vm->unlock();

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::epilog_success_action(int vid)
{
    Nebula&             nd = Nebula::instance();
    DispatchManager *   dm = nd.get_dm();

    VirtualMachine *    vm;
    time_t              the_time = time(0);
    int                 cpu,mem,disk;

    VirtualMachine::LcmState state;
    DispatchManager::Actions action;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    state = vm->get_lcm_state();

    if ( state == VirtualMachine::EPILOG_STOP )
    {
        action = DispatchManager::STOP_SUCCESS;
    }
    else if ( state == VirtualMachine::EPILOG_UNDEPLOY )
    {
        action = DispatchManager::UNDEPLOY_SUCCESS;
    }
    else if ( state == VirtualMachine::EPILOG )
    {
        action = DispatchManager::DONE;
    }
    else if ( state == VirtualMachine::CLEANUP_RESUBMIT )
    {
        dm->trigger(DispatchManager::RESUBMIT, vid);

        vm->unlock();

        return;
    }
    else
    {
        vm->log("LCM",Log::ERROR,"epilog_success_action, VM in a wrong state");
        vm->unlock();

        return;
    }

    vm->set_epilog_etime(the_time);

    vm->set_etime(the_time);

    vm->set_vm_info();

    vmpool->update_history(vm);

    vm->get_requirements(cpu,mem,disk);

    hpool->del_capacity(vm->get_hid(), vm->get_oid(), cpu, mem, disk);

    //----------------------------------------------------

    dm->trigger(action,vid);

    vm->unlock();

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::cleanup_callback_action(int vid)
{
    Nebula&             nd = Nebula::instance();
    DispatchManager *   dm = nd.get_dm();

    VirtualMachine *    vm;

    VirtualMachine::LcmState state;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    state = vm->get_lcm_state();

    if ( state == VirtualMachine::CLEANUP_RESUBMIT )
    {
        dm->trigger(DispatchManager::RESUBMIT, vid);

    }
    else
    {
        vm->log("LCM",Log::ERROR,"cleanup_callback_action, VM in a wrong state");
    }

    vm->unlock();

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::epilog_failure_action(int vid)
{
    VirtualMachine * vm;
    time_t           the_time = time(0);

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if ( vm->get_lcm_state() == VirtualMachine::CLEANUP_RESUBMIT )
    {
        Nebula&           nd = Nebula::instance();
        DispatchManager * dm = nd.get_dm();

        dm->trigger(DispatchManager::RESUBMIT, vid);
    }
    else if ( vm->get_lcm_state() == VirtualMachine::EPILOG_STOP ||
              vm->get_lcm_state() == VirtualMachine::EPILOG_UNDEPLOY ||
              vm->get_lcm_state() == VirtualMachine::EPILOG )
    {
        vm->set_epilog_etime(the_time);

        failure_action(vm);
    }
    else
    {
        vm->log("LCM",Log::ERROR,"epilog_failure_action, VM in a wrong state");
    }

    vm->unlock();

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::cancel_success_action(int vid)
{
    Nebula&             nd = Nebula::instance();
    TransferManager *   tm = nd.get_tm();
    DispatchManager *   dm = nd.get_dm();
    VirtualMachine *    vm;
    time_t              the_time = time(0);

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if ( vm->get_lcm_state() == VirtualMachine::CANCEL )
    {
        //----------------------------------------------------
        //                   EPILOG STATE
        //----------------------------------------------------

        vm->set_state(VirtualMachine::EPILOG);

        vm->delete_snapshots();

        map<string, string> empty;
        vm->update_info(0, 0, -1, -1, empty);

        vmpool->update(vm);

        vm->set_reason(History::USER);

        vm->set_epilog_stime(the_time);

        vm->set_running_etime(the_time);

        vmpool->update_history(vm);

        vm->log("LCM", Log::INFO, "New VM state is EPILOG");

        //----------------------------------------------------

        tm->trigger(TransferManager::EPILOG,vid);
    }
    else if (vm->get_lcm_state() == VirtualMachine::SHUTDOWN_UNDEPLOY)
    {
        //----------------------------------------------------
        //            EPILOG_UNDEPLOY STATE
        //----------------------------------------------------

        vm->set_state(VirtualMachine::EPILOG_UNDEPLOY);

        vm->delete_snapshots();

        map<string, string> empty;
        vm->update_info(0, 0, -1, -1, empty);

        vmpool->update(vm);

        vm->set_epilog_stime(the_time);

        vm->set_running_etime(the_time);

        vm->set_reason(History::USER);

        vmpool->update_history(vm);

        vm->log("LCM", Log::INFO, "New VM state is EPILOG_UNDEPLOY");

        //----------------------------------------------------

        tm->trigger(TransferManager::EPILOG_STOP,vid);
    }
    else if (vm->get_lcm_state() == VirtualMachine::SHUTDOWN_POWEROFF)
    {
        //----------------------------------------------------
        //                POWEROFF STATE
        //----------------------------------------------------
        map<string, string> empty;

        vm->delete_snapshots();

        vm->update_info(0, 0, -1, -1, empty);

        vmpool->update(vm);

        vm->set_running_etime(the_time);

        vm->set_etime(the_time);

        vm->set_vm_info();

        vm->set_reason(History::USER);

        vmpool->update_history(vm);

        //----------------------------------------------------

        dm->trigger(DispatchManager::POWEROFF_SUCCESS,vid);
    }
    else
    {
        vm->log("LCM",Log::ERROR,"cancel_success_action, VM in a wrong state");
    }

    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::cancel_failure_action(int vid)
{
    VirtualMachine *    vm;

    Nebula&                 nd = Nebula::instance();
    VirtualMachineManager * vmm = nd.get_vmm();

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if ( vm->get_lcm_state() == VirtualMachine::CANCEL ||
         vm->get_lcm_state() == VirtualMachine::SHUTDOWN_UNDEPLOY ||
         vm->get_lcm_state() == VirtualMachine::SHUTDOWN_POWEROFF)
    {
        //------------------------------------------------------------------
        // RUNNING STATE FROM CANCEL, SHUTDOWN_POWEROFF OR SHUTDOWN_UNDEPLOY
        //------------------------------------------------------------------

        vm->set_state(VirtualMachine::RUNNING);

        vmpool->update(vm);

        vm->set_action(History::NONE_ACTION);

        vmpool->update_history(vm);

        vm->log("LCM", Log::INFO, "Fail to cancel VM."
                " Assuming that the VM is still RUNNING (will poll VM).");

        //----------------------------------------------------

        vmm->trigger(VirtualMachineManager::POLL,vid);
    }
    else
    {
        vm->log("LCM",Log::ERROR,"cancel_failure_action, VM in a wrong state");
    }

    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::monitor_failure_action(int vid)
{
    VirtualMachine * vm;

    time_t  the_time = time(0);

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if ( vm->get_lcm_state() == VirtualMachine::RUNNING ||
         vm->get_lcm_state() == VirtualMachine::UNKNOWN )
    {
        vm->set_running_etime(the_time);

        failure_action(vm);
    }
    else
    {
        vm->log("LCM",Log::ERROR,"monitor_failure_action, VM in a wrong state");
    }

    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::monitor_suspend_action(int vid)
{
    VirtualMachine *    vm;

    time_t  the_time = time(0);

    Nebula&             nd = Nebula::instance();
    DispatchManager *   dm = nd.get_dm();

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if ( vm->get_lcm_state() == VirtualMachine::RUNNING ||
         vm->get_lcm_state() == VirtualMachine::UNKNOWN )
    {
        //----------------------------------------------------
        //                  SAVE_SUSPEND STATE
        //----------------------------------------------------

        vm->set_state(VirtualMachine::SAVE_SUSPEND);

        vm->set_resched(false);

        vm->delete_snapshots();

        map<string, string> empty;
        vm->update_info(0, 0, -1, -1, empty);

        vmpool->update(vm);

        vm->set_running_etime(the_time);

        vm->set_etime(the_time);

        vm->set_vm_info();

        vm->set_reason(History::ERROR);

        vmpool->update_history(vm);

        vm->log("LCM", Log::INFO, "VM is suspended.");

        //----------------------------------------------------

        dm->trigger(DispatchManager::SUSPEND_SUCCESS,vid);
    }
    else
    {
        vm->log("LCM",Log::ERROR,"monitor_suspend_action, VM in a wrong state");
    }

    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::monitor_done_action(int vid)
{
    VirtualMachine *    vm;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if ( vm->get_lcm_state() == VirtualMachine::RUNNING )
    {
        //----------------------------------------------------
        //                   UNKNWON STATE
        //----------------------------------------------------

        vm->set_state(VirtualMachine::UNKNOWN);

        vm->set_resched(false);

        vmpool->update(vm);

        vm->log("LCM", Log::INFO, "New VM state is UNKNOWN");
    }
    // This event can be received when the VM is in PROLOG, BOOT...
    // and other transient states (through host monitor probe).
    // Just ignore the callback if VM is not in RUNNING.

    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::monitor_poweroff_action(int vid)
{
    VirtualMachine *    vm;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    //This event should be ignored if the VM is not RUNNING
    if ( vm->get_lcm_state() == VirtualMachine::RUNNING )
    {
        //----------------------------------------------------
        //                POWEROFF STATE
        //----------------------------------------------------
        map<string, string> empty;
        time_t              the_time = time(0);

        Nebula&             nd = Nebula::instance();
        DispatchManager *   dm = nd.get_dm();

        vm->delete_snapshots();

        vm->update_info(0, 0, -1, -1, empty);

        vm->set_resched(false);

        vm->set_state(VirtualMachine::SHUTDOWN_POWEROFF);

        vmpool->update(vm);

        vm->set_running_etime(the_time);

        vm->set_etime(the_time);

        vm->set_vm_info();

        vm->set_reason(History::USER);

        vmpool->update_history(vm);

        //----------------------------------------------------

        dm->trigger(DispatchManager::POWEROFF_SUCCESS,vid);
    }

    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::monitor_poweron_action(int vid)
{
    VirtualMachine *    vm;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    //This event should be ignored if the VM is not POWEROFF
    if ( vm->get_state() == VirtualMachine::POWEROFF )
    {
            time_t the_time = time(0);

            vm->set_state(VirtualMachine::ACTIVE);

            vm->set_state(VirtualMachine::RUNNING);

            vm->cp_history();

            vmpool->update(vm);

            vm->set_stime(the_time);

            vm->set_running_stime(the_time);

            vm->set_last_poll(the_time);

            vmpool->update_history(vm);

            vm->log("LCM", Log::INFO, "New VM state is RUNNING");
    }

    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::failure_action(VirtualMachine * vm)
{
    Nebula&             nd = Nebula::instance();
    DispatchManager *   dm = nd.get_dm();

    time_t  the_time = time(0);
    int     cpu,mem,disk;

    //----------------------------------------------------
    //                LCM FAILURE STATE
    //----------------------------------------------------

    vm->set_state(VirtualMachine::FAILURE);

    vm->set_resched(false);

    vm->delete_snapshots();

    map<string, string> empty;
    vm->update_info(0, 0, -1, -1, empty);

    vmpool->update(vm);

    vm->set_etime(the_time);

    vm->set_vm_info();

    vm->set_reason(History::ERROR);

    vmpool->update_history(vm);

    vm->get_requirements(cpu,mem,disk);

    hpool->del_capacity(vm->get_hid(), vm->get_oid(), cpu, mem, disk);

    //--- VM to FAILED. Remote host cleanup upon VM deletion ---

    dm->trigger(DispatchManager::FAILED,vm->get_oid());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::attach_success_action(int vid)
{
    VirtualMachine *    vm;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG )
    {
        vm->clear_attach_disk();

        vm->set_state(VirtualMachine::RUNNING);

        vmpool->update(vm);
    }
    else
    {
        vm->log("LCM",Log::ERROR,"attach_success_action, VM in a wrong state");
    }

    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::attach_failure_action(int vid, bool release_save_as)
{
    VirtualMachine *  vm;
    VectorAttribute * disk;

    int uid;
    int gid;
    int oid;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG )
    {
        disk = vm->delete_attach_disk();
        uid  = vm->get_uid();
        gid  = vm->get_gid();
        oid  = vm->get_oid();

        vm->set_state(VirtualMachine::RUNNING);

        vmpool->update(vm);

        vm->unlock();

        if ( disk != 0 )
        {
            Nebula&       nd     = Nebula::instance();
            ImageManager* imagem = nd.get_imagem();

            Template tmpl;
            int      image_id;

            tmpl.set(disk);

            if ( disk->vector_value("IMAGE_ID", image_id) == 0 )
            {
                // Disk using an Image
                Quotas::quota_del(Quotas::IMAGE, uid, gid, &tmpl);

                imagem->release_image(oid, image_id, false);

                // Release non-persistent images in the detach event
                if (release_save_as)
                {
                    int save_as_id;

                    if ( disk->vector_value("SAVE_AS", save_as_id) == 0 )
                    {
                        imagem->release_image(oid, save_as_id, false);
                    }
                }
            }
            else // Volatile disk
            {
                // It is an update of the volatile counter without
                // shutting destroying a VM
                tmpl.add("VMS", 0);

                Quotas::quota_del(Quotas::VM, uid, gid, &tmpl);
            }
        }
    }
    else
    {
        vm->log("LCM",Log::ERROR,"attach_failure_action, VM in a wrong state");
        vm->unlock();
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::detach_success_action(int vid)
{
    attach_failure_action(vid, true);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::detach_failure_action(int vid)
{
    attach_success_action(vid);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::snapshot_create_success(int vid)
{
    VirtualMachine *    vm;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG_SNAPSHOT )
    {
        vm->clear_active_snapshot();

        vm->set_state(VirtualMachine::RUNNING);

        vmpool->update(vm);
    }
    else
    {
        vm->log("LCM",Log::ERROR,"snapshot_create_success, VM in a wrong state");
    }

    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::snapshot_create_failure(int vid)
{
    VirtualMachine *  vm;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG_SNAPSHOT )
    {
        vm->delete_active_snapshot();

        vm->set_state(VirtualMachine::RUNNING);

        vmpool->update(vm);
    }
    else
    {
        vm->log("LCM",Log::ERROR,"snapshot_create_failure, VM in a wrong state");
    }

    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::snapshot_revert_success(int vid)
{
    // TODO: snapshot list may be inconsistent with hypervisor info
    // after a revert operation

    VirtualMachine *  vm;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG_SNAPSHOT )
    {
        vm->clear_active_snapshot();

        vm->set_state(VirtualMachine::RUNNING);

        vmpool->update(vm);
    }
    else
    {
        vm->log("LCM",Log::ERROR,"snapshot_revert_success, VM in a wrong state");
    }

    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::snapshot_revert_failure(int vid)
{
    // TODO: for now, it is the same code

    snapshot_revert_success(vid);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::snapshot_delete_success(int vid)
{
    VirtualMachine *  vm;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG_SNAPSHOT )
    {
        vm->delete_active_snapshot();

        vm->set_state(VirtualMachine::RUNNING);

        vmpool->update(vm);
    }
    else
    {
        vm->log("LCM",Log::ERROR,"snapshot_delete_success, VM in a wrong state");
    }

    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::snapshot_delete_failure(int vid)
{
    VirtualMachine *  vm;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG_SNAPSHOT )
    {
        vm->clear_active_snapshot();

        vm->set_state(VirtualMachine::RUNNING);

        vmpool->update(vm);
    }
    else
    {
        vm->log("LCM",Log::ERROR,"snapshot_delete_failure, VM in a wrong state");
    }

    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::attach_nic_success_action(int vid)
{
    VirtualMachine * vm;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG_NIC )
    {
        vm->clear_attach_nic();

        vm->set_state(VirtualMachine::RUNNING);

        vmpool->update(vm);
    }
    else
    {
        vm->log("LCM",Log::ERROR,"attach_nic_success_action, VM in a wrong state");
    }

    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::attach_nic_failure_action(int vid)
{
    VirtualMachine *  vm;
    VectorAttribute * nic;

    int uid;
    int gid;
    int oid;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG_NIC )
    {
        nic = vm->delete_attach_nic();
        uid = vm->get_uid();
        gid = vm->get_gid();
        oid = vm->get_oid();

        vm->set_state(VirtualMachine::RUNNING);

        vmpool->update(vm);

        vm->unlock();

        if ( nic != 0 )
        {
            Template tmpl;

            tmpl.set(nic);

            Quotas::quota_del(Quotas::NETWORK, uid, gid, &tmpl);

            VirtualMachine::release_network_leases(nic, oid);
        }
    }
    else
    {
        vm->log("LCM",Log::ERROR,"attach_nic_failure_action, VM in a wrong state");
        vm->unlock();
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::detach_nic_success_action(int vid)
{
    attach_nic_failure_action(vid);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::detach_nic_failure_action(int vid)
{
    attach_nic_success_action(vid);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::saveas_hot_success_action(int vid)
{
    Nebula&        nd = Nebula::instance();
    ImagePool * ipool = nd.get_ipool();

    VirtualMachine * vm;
    Image * image;

    int image_id;
    int disk_id;
    string source;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    int rc = vm->get_saveas_disk_hot(disk_id, source, image_id);

    if (vm->clear_saveas_state(disk_id, true) == -1)
    {
        vm->log("LCM", Log::ERROR, "saveas_hot_success_action, VM in a wrong state");
        vm->unlock();

        return;
    }

    vmpool->update(vm);

    vm->unlock();

    if ( rc != 0 )
    {
        return;
    }

    image = ipool->get(image_id, true);

    if ( image == 0 )
    {
        return;
    }

    image->set_state(Image::READY);

    ipool->update(image);

    image->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::saveas_hot_failure_action(int vid)
{
    Nebula&        nd = Nebula::instance();
    ImagePool * ipool = nd.get_ipool();

    VirtualMachine * vm;
    Image * image;

    int image_id;
    int disk_id;
    string source;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    int rc = vm->get_saveas_disk_hot(disk_id, source, image_id);

    if (vm->clear_saveas_state(disk_id, true) == -1)
    {
        vm->log("LCM", Log::ERROR, "saveas_hot_success_action, VM in a wrong state");
        vm->unlock();

        return;
    }

    vmpool->update(vm);

    vm->unlock();

    if ( rc != 0 )
    {
        return;
    }

    image = ipool->get(image_id, true);

    if ( image == 0 )
    {
        return;
    }

    image->set_state(Image::ERROR);

    ipool->update(image);

    image->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
