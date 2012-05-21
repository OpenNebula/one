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

        vmpool->update(vm);

        vm->set_previous_etime(the_time);

        vm->set_previous_vm_info();

        vm->set_previous_running_etime(the_time);

        vm->set_previous_reason(History::USER);

        vmpool->update_previous_history(vm);

        vm->set_prolog_stime(the_time);

        vmpool->update_history(vm);

        vm->get_requirements(cpu,mem,disk);

        hpool->del_capacity(vm->get_previous_hid(),cpu,mem,disk);

        vm->log("LCM", Log::INFO, "New VM state is PROLOG_MIGRATE");

        //----------------------------------------------------

        tm->trigger(TransferManager::PROLOG_MIGR,vid);
    }
    else if (vm->get_lcm_state() == VirtualMachine::SAVE_SUSPEND)
    {
        Nebula&             nd = Nebula::instance();
        DispatchManager *   dm = nd.get_dm();
        int                 cpu,mem,disk;
        time_t              the_time = time(0);

        //----------------------------------------------------
        //                SUSPENDED STATE
        //----------------------------------------------------

        vm->set_running_etime(the_time);

        vm->set_etime(the_time);

        vm->set_vm_info();

        vm->set_reason(History::STOP_RESUME);

        vmpool->update_history(vm);

        vm->get_requirements(cpu,mem,disk);

        hpool->del_capacity(vm->get_hid(),cpu,mem,disk);

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

        vmpool->update(vm);

        vm->set_epilog_stime(the_time);

        vm->set_running_etime(the_time);

        vm->set_reason(History::STOP_RESUME);

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

        hpool->del_capacity(vm->get_hid(),cpu,mem,disk);

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

        vm->log("LCM", Log::INFO, "Fail to save VM state."
                " Assuming that the VM is still RUNNING (will poll VM).");

        //----------------------------------------------------

        vmm->trigger(VirtualMachineManager::POLL,vid);
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

        vmpool->update_history(vm);

        vm->set_previous_etime(the_time);

        vm->set_previous_vm_info();

        vm->set_previous_running_etime(the_time);

        vm->set_previous_reason(History::USER);

        vmpool->update_previous_history(vm);

        vm->get_requirements(cpu,mem,disk);

        hpool->del_capacity(vm->get_previous_hid(),cpu,mem,disk);
    }

    vm->set_state(VirtualMachine::RUNNING);

    vmpool->update(vm);

    vm->log("LCM", Log::INFO, "New VM state is RUNNING");

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

        vm->set_previous_etime(the_time);

        vm->set_previous_vm_info();

        vm->set_previous_running_etime(the_time);

        vm->set_previous_reason(History::USER);

        vmpool->update_previous_history(vm);

        vm->get_requirements(cpu,mem,disk);

        hpool->del_capacity(vm->get_hid(),cpu,mem,disk);

        // --- Add new record by copying the previous one

        vm->cp_previous_history();

        vmpool->update(vm); //update last_seq & state

        vm->set_stime(the_time);

        vm->set_running_stime(the_time);

        vmpool->update_history(vm);

        vm->log("LCM", Log::INFO, "Fail to live migrate VM."
                " Assuming that the VM is still RUNNING (will poll VM).");

        //----------------------------------------------------

        vmm->trigger(VirtualMachineManager::POLL,vid);
    }
    else if (vm->get_lcm_state() == VirtualMachine::BOOT)
    {
        time_t  the_time = time(0);

        vm->set_running_etime(the_time);

        failure_action(vm);
    }

    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::shutdown_success_action(int vid)
{
    Nebula&             nd = Nebula::instance();
    TransferManager *   tm = nd.get_tm();
    VirtualMachine *    vm;
    time_t              the_time = time(0);

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    //----------------------------------------------------
    //                   EPILOG STATE
    //----------------------------------------------------

    vm->set_state(VirtualMachine::EPILOG);

    vmpool->update(vm);

    vm->set_epilog_stime(the_time);

    vm->set_running_etime(the_time);

    vmpool->update_history(vm);

    vm->log("LCM", Log::INFO, "New VM state is EPILOG");

    //----------------------------------------------------

    tm->trigger(TransferManager::EPILOG,vid);

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

    //----------------------------------------------------
    //    RUNNING STATE FROM SHUTDOWN
    //----------------------------------------------------

    vm->set_state(VirtualMachine::RUNNING);

    vmpool->update(vm);

    vm->log("LCM", Log::INFO, "Fail to shutdown VM."
            " Assuming that the VM is still RUNNING (will poll VM).");

    //----------------------------------------------------

    vmm->trigger(VirtualMachineManager::POLL,vid);

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

    if (lcm_state == VirtualMachine::PROLOG)
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

    vm->set_state(VirtualMachine::BOOT);

    vmpool->update(vm);

    vm->set_prolog_etime(the_time);

    vm->set_running_stime(the_time);

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
    VirtualMachine *    vm;
    time_t  the_time = time(0);

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    vm->set_prolog_etime(the_time);

    failure_action(vm);

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

    DispatchManager::Actions action;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if (vm->get_lcm_state() == VirtualMachine::EPILOG_STOP)
    {
        action = DispatchManager::STOP_SUCCESS;
    }
    else if (vm->get_lcm_state() == VirtualMachine::EPILOG)
    {
        action = DispatchManager::DONE;
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

    hpool->del_capacity(vm->get_hid(),cpu,mem,disk);

    //----------------------------------------------------

    dm->trigger(action,vid);

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

    vm->set_epilog_etime(the_time);

    failure_action(vm);

    vm->unlock();

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::cancel_success_action(int vid)
{
    Nebula&             nd = Nebula::instance();
    TransferManager *   tm = nd.get_tm();
    VirtualMachine *    vm;
    time_t              the_time = time(0);

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    //----------------------------------------------------
    //                   EPILOG STATE
    //----------------------------------------------------

    vm->set_state(VirtualMachine::EPILOG);

    vmpool->update(vm);

    vm->set_reason(History::CANCEL);

    vm->set_epilog_stime(the_time);

    vm->set_running_etime(the_time);

    vmpool->update_history(vm);

    vm->log("LCM", Log::INFO, "New VM state is EPILOG");

    //----------------------------------------------------

    tm->trigger(TransferManager::EPILOG,vid);

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

    //----------------------------------------------------
    //    RUNNING STATE FROM CANCEL
    //----------------------------------------------------

    vm->set_state(VirtualMachine::RUNNING);

    vmpool->update(vm);

    vm->log("LCM", Log::INFO, "Fail to cancel VM."
            " Assuming that the VM is still RUNNING (will poll VM).");

    //----------------------------------------------------

    vmm->trigger(VirtualMachineManager::POLL,vid);

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

    vm->set_running_etime(the_time);

    failure_action(vm);

    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::monitor_suspend_action(int vid)
{
    VirtualMachine *    vm;

    int     cpu,mem,disk;
    time_t  the_time = time(0);

    Nebula&             nd = Nebula::instance();
    DispatchManager *   dm = nd.get_dm();

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    //----------------------------------------------------
    //                  SAVE_SUSPEND STATE
    //----------------------------------------------------

    vm->set_state(VirtualMachine::SAVE_SUSPEND);

    vm->set_resched(false);

    vmpool->update(vm);

    vm->set_running_etime(the_time);

    vm->set_etime(the_time);

    vm->set_vm_info();

    vm->set_reason(History::STOP_RESUME);

    vmpool->update_history(vm);

    vm->get_requirements(cpu,mem,disk);

    hpool->del_capacity(vm->get_hid(),cpu,mem,disk);

    vm->log("LCM", Log::INFO, "VM is suspended.");

    //----------------------------------------------------

    dm->trigger(DispatchManager::SUSPEND_SUCCESS,vid);

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

    //----------------------------------------------------
    //                   UNKNWON STATE
    //----------------------------------------------------

    vm->set_state(VirtualMachine::UNKNOWN);

    vm->set_resched(false);

    vmpool->update(vm);

    vm->log("LCM", Log::INFO, "New VM state is UNKNOWN");

    //----------------------------------------------------

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
    
    vmpool->update(vm);

    vm->set_etime(the_time);

    vm->set_vm_info();

    vm->set_reason(History::ERROR);

    vmpool->update_history(vm);

    vm->get_requirements(cpu,mem,disk);

    hpool->del_capacity(vm->get_hid(),cpu,mem,disk);

    //--- VM to FAILED. Remote host cleanup upon VM deletion ---

    dm->trigger(DispatchManager::FAILED,vm->get_oid());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
