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

void  LifeCycleManager::deploy_action(int vid)
{
    VirtualMachine *    vm;
    ostringstream       os;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if ( vm->get_state() == VirtualMachine::ACTIVE )
    {
        Nebula&             nd = Nebula::instance();
        TransferManager *   tm = nd.get_tm();
        time_t              thetime = time(0);
        int                 cpu,mem,disk;

        VirtualMachine::LcmState vm_state;
        TransferManager::Actions tm_action;

        //----------------------------------------------------
        //                 PROLOG STATE
        //----------------------------------------------------

        vm_state  = VirtualMachine::PROLOG;
        tm_action = TransferManager::PROLOG;

        if (vm->hasPreviousHistory())
        {
            if (vm->get_previous_reason() == History::STOP_RESUME)
            {
                vm_state  = VirtualMachine::PROLOG_RESUME;
                tm_action = TransferManager::PROLOG_RESUME;
            }
        }

        vm->set_state(vm_state);

        vmpool->update(vm);

        vm->set_stime(thetime);

        vm->set_prolog_stime(thetime);

        vmpool->update_history(vm);

        vm->get_requirements(cpu,mem,disk);

        hpool->add_capacity(vm->get_hid(),cpu,mem,disk);

        vm->log("LCM", Log::INFO, "New VM state is PROLOG.");

        //----------------------------------------------------

        tm->trigger(tm_action,vid);
    }
    else
    {
        vm->log("LCM", Log::ERROR, "deploy_action, VM in a wrong state.");
    }

    vm->unlock();

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::suspend_action(int vid)
{
    VirtualMachine *    vm;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if (vm->get_state() == VirtualMachine::ACTIVE &&
        vm->get_lcm_state() == VirtualMachine::RUNNING)
    {
        Nebula&                 nd = Nebula::instance();
        VirtualMachineManager * vmm = nd.get_vmm();

        //----------------------------------------------------
        //                SAVE_SUSPEND STATE
        //----------------------------------------------------

        vm->set_state(VirtualMachine::SAVE_SUSPEND);

        vm->set_resched(false);
        
        vmpool->update(vm);

        vm->log("LCM", Log::INFO, "New VM state is SAVE_SUSPEND");

        //----------------------------------------------------

        vmm->trigger(VirtualMachineManager::SAVE,vid);
    }
    else
    {
        vm->log("LCM", Log::ERROR, "suspend_action, VM in a wrong state.");
    }

    vm->unlock();

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::stop_action(int vid)
{
    VirtualMachine *    vm;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if (vm->get_state() == VirtualMachine::ACTIVE &&
        vm->get_lcm_state() == VirtualMachine::RUNNING)
    {
        Nebula&                 nd = Nebula::instance();
        VirtualMachineManager * vmm = nd.get_vmm();

        //----------------------------------------------------
        //                SAVE_STOP STATE
        //----------------------------------------------------

        vm->set_state(VirtualMachine::SAVE_STOP);
        
        vm->set_resched(false);
        
        vmpool->update(vm);

        vm->log("LCM", Log::INFO, "New VM state is SAVE_STOP");

        //----------------------------------------------------

        vmm->trigger(VirtualMachineManager::SAVE,vid);
    }
    else
    {
        vm->log("LCM", Log::ERROR, "stop_action, VM in a wrong state.");
    }

    vm->unlock();

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::migrate_action(int vid)
{
    VirtualMachine *    vm;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if (vm->get_state() == VirtualMachine::ACTIVE &&
        vm->get_lcm_state() == VirtualMachine::RUNNING)
    {
        Nebula&                 nd  = Nebula::instance();
        VirtualMachineManager * vmm = nd.get_vmm();
        int                     cpu,mem,disk;

        //----------------------------------------------------
        //                SAVE_MIGRATE STATE
        //----------------------------------------------------

        vm->set_state(VirtualMachine::SAVE_MIGRATE);

        vm->set_resched(false);

        vmpool->update(vm);

        vm->set_stime(time(0));

        vmpool->update_history(vm);

        vm->get_requirements(cpu,mem,disk);

        hpool->add_capacity(vm->get_hid(),cpu,mem,disk);

        vm->log("LCM", Log::INFO, "New VM state is SAVE_MIGRATE");

        //----------------------------------------------------

        vmm->trigger(VirtualMachineManager::SAVE,vid);
    }
    else
    {
        vm->log("LCM", Log::ERROR, "migrate_action, VM in a wrong state.");
    }

    vm->unlock();

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::live_migrate_action(int vid)
{
    VirtualMachine *    vm;
    ostringstream        os;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if (vm->get_state() == VirtualMachine::ACTIVE &&
        vm->get_lcm_state() == VirtualMachine::RUNNING)
    {
        Nebula&                 nd = Nebula::instance();
        VirtualMachineManager * vmm = nd.get_vmm();
        int                     cpu,mem,disk;

        //----------------------------------------------------
        //                   MIGRATE STATE
        //----------------------------------------------------

        vm->set_state(VirtualMachine::MIGRATE);

        vm->set_resched(false);

        vmpool->update(vm);

        vm->set_stime(time(0));

        vmpool->update_history(vm);

        vm->get_requirements(cpu,mem,disk);

        hpool->add_capacity(vm->get_hid(),cpu,mem,disk);

        vm->log("LCM",Log::INFO,"New VM state is MIGRATE");

        //----------------------------------------------------

        vmm->trigger(VirtualMachineManager::MIGRATE,vid);
    }
    else
    {
        vm->log("LCM", Log::ERROR, "live_migrate_action, VM in a wrong state.");
    }

    vm->unlock();

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::shutdown_action(int vid)
{
    VirtualMachine *    vm;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if (vm->get_state() == VirtualMachine::ACTIVE &&
        vm->get_lcm_state() == VirtualMachine::RUNNING)
    {
        Nebula&                 nd = Nebula::instance();
        VirtualMachineManager * vmm = nd.get_vmm();

        //----------------------------------------------------
        //                  SHUTDOWN STATE
        //----------------------------------------------------

        vm->set_state(VirtualMachine::SHUTDOWN);

        vm->set_resched(false);

        vmpool->update(vm);

        vm->log("LCM",Log::INFO,"New VM state is SHUTDOWN");

        //----------------------------------------------------

        vmm->trigger(VirtualMachineManager::SHUTDOWN,vid);
    }
    else
    {
        vm->log("LCM", Log::ERROR, "shutdown_action, VM in a wrong state.");
    }

    vm->unlock();

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::restore_action(int vid)
{
    VirtualMachine *    vm;
    ostringstream       os;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if (vm->get_state() == VirtualMachine::ACTIVE)
    {
        Nebula&                 nd  = Nebula::instance();
        VirtualMachineManager * vmm = nd.get_vmm();
        int                     cpu,mem,disk;
        time_t                  the_time = time(0);

        vm->log("LCM", Log::INFO, "Restoring VM");

        //----------------------------------------------------
        //            BOOT STATE (FROM SUSPEND)
        //----------------------------------------------------

        vm->set_state(VirtualMachine::BOOT);

        vm->cp_history();

        vmpool->update(vm); //update last_seq & state

        vm->set_stime(the_time);

        vm->set_running_stime(the_time);

        vmpool->update_history(vm);

        vm->get_requirements(cpu,mem,disk);

        hpool->add_capacity(vm->get_hid(),cpu,mem,disk);

        vm->log("LCM", Log::INFO, "New state is BOOT");

        //----------------------------------------------------

        vmm->trigger(VirtualMachineManager::RESTORE,vid);
    }
    else
    {
        vm->log("LCM", Log::ERROR, "restore_action, VM in a wrong state.");
    }

    vm->unlock();

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::cancel_action(int vid)
{
    VirtualMachine *    vm;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if (vm->get_state() == VirtualMachine::ACTIVE &&
        vm->get_lcm_state() == VirtualMachine::RUNNING)
    {
        Nebula&                 nd = Nebula::instance();
        VirtualMachineManager * vmm = nd.get_vmm();

        //----------------------------------------------------
        //                  CANCEL STATE
        //----------------------------------------------------

        vm->set_state(VirtualMachine::CANCEL);

        vm->set_resched(false);

        vmpool->update(vm);

        vm->log("LCM", Log::INFO, "New state is CANCEL");

        //----------------------------------------------------

        vmm->trigger(VirtualMachineManager::CANCEL,vid);
    }
    else
    {
        vm->log("LCM", Log::ERROR, "cancel_action, VM in a wrong state.");
    }

    vm->unlock();

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::restart_action(int vid)
{
    VirtualMachine *    vm;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if (vm->get_state() == VirtualMachine::ACTIVE &&
        (vm->get_lcm_state() == VirtualMachine::UNKNOWN ||
         vm->get_lcm_state() == VirtualMachine::BOOT))
    {
        Nebula&                 nd = Nebula::instance();
        VirtualMachineManager * vmm = nd.get_vmm();

        //----------------------------------------------------
        //       RE-START THE VM IN THE SAME HOST
        //----------------------------------------------------

        if (vm->get_lcm_state() == VirtualMachine::BOOT)
        {
            vm->log("LCM", Log::INFO, "Sending BOOT command to VM again");
        }
        else
        {
            vm->set_state(VirtualMachine::BOOT);

            vmpool->update(vm);

            vm->log("LCM", Log::INFO, "New VM state is BOOT");
        }

        //----------------------------------------------------

        vmm->trigger(VirtualMachineManager::DEPLOY,vid);
    }
    else
    {
        vm->log("LCM", Log::ERROR, "restart_action, VM in a wrong state.");
    }

    vm->unlock();

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::delete_action(int vid)
{
    VirtualMachine * vm;

    Nebula&           nd = Nebula::instance();
    DispatchManager * dm = nd.get_dm();

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    VirtualMachine::LcmState state = vm->get_lcm_state();

    if ((state == VirtualMachine::LCM_INIT) ||
        (state == VirtualMachine::CLEANUP))
    {
        vm->unlock();
        return;
    }

    clean_up_vm(vm);

    dm->trigger(DispatchManager::DONE,vid);

    vm->unlock();

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
void  LifeCycleManager::clean_action(int vid)
{
    VirtualMachine * vm;

    Nebula&           nd = Nebula::instance();
    DispatchManager * dm = nd.get_dm();

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    VirtualMachine::LcmState state = vm->get_lcm_state();

    if ((state == VirtualMachine::LCM_INIT) ||
        (state == VirtualMachine::CLEANUP))
    {
        vm->unlock();
        return;
    }

    clean_up_vm(vm);

    dm->trigger(DispatchManager::RESUBMIT,vid);

    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::clean_up_vm(VirtualMachine * vm)
{
    int    cpu, mem, disk;
    time_t the_time = time(0);

    Nebula& nd = Nebula::instance();

    TransferManager *       tm  = nd.get_tm();
    VirtualMachineManager * vmm = nd.get_vmm();

    VirtualMachine::LcmState state = vm->get_lcm_state();
    int                      vid   = vm->get_oid();

    vm->set_state(VirtualMachine::CLEANUP);
    vm->set_resched(false);
    vmpool->update(vm);

    vm->set_etime(the_time);
    vm->set_vm_info();
    vm->set_reason(History::USER);

    vm->get_requirements(cpu,mem,disk);
    hpool->del_capacity(vm->get_hid(),cpu,mem,disk);

    switch (state)
    {
        case VirtualMachine::PROLOG:
        case VirtualMachine::PROLOG_RESUME:
            vm->set_prolog_etime(the_time);
            vmpool->update_history(vm);

            tm->trigger(TransferManager::DRIVER_CANCEL,vid);
            tm->trigger(TransferManager::EPILOG_DELETE,vid);
        break;

        case VirtualMachine::BOOT:
        case VirtualMachine::RUNNING:
        case VirtualMachine::UNKNOWN:
        case VirtualMachine::SHUTDOWN:
        case VirtualMachine::CANCEL:
            vm->set_running_etime(the_time);
            vmpool->update_history(vm);

            vmm->trigger(VirtualMachineManager::DRIVER_CANCEL,vid);
            vmm->trigger(VirtualMachineManager::CANCEL,vid);

            tm->trigger(TransferManager::EPILOG_DELETE,vid);
        break;

        case VirtualMachine::MIGRATE:
            vm->set_running_etime(the_time);
            vmpool->update_history(vm);

            vm->set_previous_etime(the_time);
            vm->set_previous_vm_info();
            vm->set_previous_running_etime(the_time);
            vm->set_previous_reason(History::USER);
            vmpool->update_previous_history(vm);

            hpool->del_capacity(vm->get_previous_hid(),cpu,mem,disk);

            vmm->trigger(VirtualMachineManager::DRIVER_CANCEL,vid);

            vmm->trigger(VirtualMachineManager::CANCEL,vid);
            vmm->trigger(VirtualMachineManager::CANCEL_PREVIOUS,vid);

            tm->trigger(TransferManager::EPILOG_DELETE,vid);
        break;

        case VirtualMachine::SAVE_STOP:
        case VirtualMachine::SAVE_SUSPEND:
            vm->set_running_etime(the_time);
            vmpool->update_history(vm);

            vmm->trigger(VirtualMachineManager::DRIVER_CANCEL,vid);
            vmm->trigger(VirtualMachineManager::CANCEL,vid);

            tm->trigger(TransferManager::EPILOG_DELETE,vid);
        break;

        case VirtualMachine::SAVE_MIGRATE:
            vm->set_running_etime(the_time);
            vmpool->update_history(vm);

            vm->set_previous_etime(the_time);
            vm->set_previous_vm_info();
            vm->set_previous_running_etime(the_time);
            vm->set_previous_reason(History::USER);
            vmpool->update_previous_history(vm);

            hpool->del_capacity(vm->get_previous_hid(),cpu,mem,disk);

            vmm->trigger(VirtualMachineManager::DRIVER_CANCEL,vid);
            vmm->trigger(VirtualMachineManager::CANCEL_PREVIOUS,vid);

            tm->trigger(TransferManager::EPILOG_DELETE_PREVIOUS,vid);
        break;

        case VirtualMachine::PROLOG_MIGRATE:
            vm->set_prolog_etime(the_time);
            vmpool->update_history(vm);

            tm->trigger(TransferManager::DRIVER_CANCEL,vid);
            tm->trigger(TransferManager::EPILOG_DELETE,vid);
            tm->trigger(TransferManager::EPILOG_DELETE_PREVIOUS,vid);
        break;

        case VirtualMachine::EPILOG_STOP:
        case VirtualMachine::EPILOG:
            vm->set_epilog_etime(the_time);
            vmpool->update_history(vm);

            tm->trigger(TransferManager::DRIVER_CANCEL,vid);
            tm->trigger(TransferManager::EPILOG_DELETE,vid);
        break;

        case VirtualMachine::FAILURE:
            vmpool->update_history(vm);
            tm->trigger(TransferManager::EPILOG_DELETE,vid);
        break;
        
        default: //LCM_INIT,CLEANUP
        break;
    }


}
