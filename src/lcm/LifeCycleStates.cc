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

#include "LifeCycleManager.h"
#include "TransferManager.h"
#include "DispatchManager.h"
#include "VirtualMachineManager.h"
#include "ImageManager.h"

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
        int    cpu, mem, disk;
        vector<VectorAttribute *> pci;

        time_t the_time = time(0);

        //----------------------------------------------------
        //                PROLOG_MIGRATE STATE
        //----------------------------------------------------

        vm->set_state(VirtualMachine::PROLOG_MIGRATE);

        vm->delete_snapshots();

        vm->reset_info();

        vmpool->update(vm);

        vm->set_previous_etime(the_time);

        vm->set_previous_vm_info();

        vm->set_previous_running_etime(the_time);

        vm->set_previous_reason(History::USER);

        vmpool->update_previous_history(vm);

        vm->set_prolog_stime(the_time);

        vmpool->update_history(vm);

        vm->get_requirements(cpu, mem, disk, pci);

        hpool->del_capacity(vm->get_previous_hid(),vm->get_oid(),cpu,mem,disk,pci);

        //----------------------------------------------------

        tm->trigger(TransferManager::PROLOG_MIGR,vid);
    }
    else if (vm->get_lcm_state() == VirtualMachine::SAVE_SUSPEND)
    {
        time_t              the_time = time(0);

        //----------------------------------------------------
        //                SUSPENDED STATE
        //----------------------------------------------------

        vm->delete_snapshots();

        vm->reset_info();

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
        time_t              the_time = time(0);

        //----------------------------------------------------
        //                 EPILOG_STOP STATE
        //----------------------------------------------------

        vm->set_state(VirtualMachine::EPILOG_STOP);

        vm->delete_snapshots();

        vm->reset_info();

        vmpool->update(vm);

        vm->set_epilog_stime(the_time);

        vm->set_running_etime(the_time);

        vm->set_reason(History::USER);

        vmpool->update_history(vm);

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
        int    cpu, mem, disk;
        vector<VectorAttribute *> pci;

        time_t the_time = time(0);

        //----------------------------------------------------
        //           RUNNING STATE FROM SAVE_MIGRATE
        //----------------------------------------------------

        vm->set_state(VirtualMachine::RUNNING);

        vm->set_etime(the_time);

        vm->set_vm_info();

        vm->set_reason(History::ERROR);

        vmpool->update_history(vm);

        vm->get_requirements(cpu, mem, disk, pci);

        hpool->del_capacity(vm->get_hid(), vm->get_oid(), cpu, mem, disk, pci);

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
        int    cpu,mem,disk;
        vector<VectorAttribute *> pci;

        time_t the_time = time(0);

        vm->set_running_stime(the_time);

        vm->set_last_poll(0);

        vmpool->update_history(vm);

        vm->set_previous_etime(the_time);

        vm->set_previous_vm_info();

        vm->set_previous_running_etime(the_time);

        vm->set_previous_reason(History::USER);

        vmpool->update_previous_history(vm);

        vm->get_requirements(cpu, mem, disk, pci);

        hpool->del_capacity(vm->get_previous_hid(),vm->get_oid(),cpu,mem,disk,pci);

        vm->set_state(VirtualMachine::RUNNING);

        vm->delete_snapshots();

        vmpool->update(vm);
    }
    else if ( vm->get_lcm_state() == VirtualMachine::BOOT ||
              vm->get_lcm_state() == VirtualMachine::BOOT_POWEROFF ||
              vm->get_lcm_state() == VirtualMachine::BOOT_UNKNOWN  ||
              vm->get_lcm_state() == VirtualMachine::BOOT_SUSPENDED||
              vm->get_lcm_state() == VirtualMachine::BOOT_STOPPED ||
              vm->get_lcm_state() == VirtualMachine::BOOT_UNDEPLOY ||
              vm->get_lcm_state() == VirtualMachine::BOOT_MIGRATE ||
              vm->get_lcm_state() == VirtualMachine::BOOT_MIGRATE_FAILURE ||
              vm->get_lcm_state() == VirtualMachine::BOOT_STOPPED_FAILURE ||
              vm->get_lcm_state() == VirtualMachine::BOOT_UNDEPLOY_FAILURE ||
              vm->get_lcm_state() == VirtualMachine::BOOT_FAILURE )
    {
        vm->set_state(VirtualMachine::RUNNING);

        vmpool->update(vm);
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
        int    cpu, mem, disk;
        vector<VectorAttribute *> pci;

        time_t the_time = time(0);

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

        vm->get_requirements(cpu, mem, disk, pci);

        hpool->del_capacity(vm->get_hid(), vm->get_oid(), cpu, mem, disk, pci);

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
    else if (vm->get_lcm_state() == VirtualMachine::BOOT)
    {
        vm->set_state(VirtualMachine::BOOT_FAILURE);

        vmpool->update(vm);
    }
    else if (vm->get_lcm_state() == VirtualMachine::BOOT_MIGRATE)
    {
        vm->set_state(VirtualMachine::BOOT_MIGRATE_FAILURE);

        vmpool->update(vm);
    }
    else if (vm->get_lcm_state() == VirtualMachine::BOOT_UNKNOWN)
    {
        vm->set_state(VirtualMachine::UNKNOWN);

        vmpool->update(vm);
    }
    else if (vm->get_lcm_state() == VirtualMachine::BOOT_POWEROFF)
    {
        vm->set_etime(the_time);
        vm->set_running_etime(the_time);

        vm->set_reason(History::ERROR);
        vm->set_action(History::RESUME_ACTION);

        vm->set_state(VirtualMachine::POWEROFF);
        vm->set_state(VirtualMachine::LCM_INIT);

        vmpool->update(vm);
        vmpool->update_history(vm);
    }
    else if (vm->get_lcm_state() == VirtualMachine::BOOT_SUSPENDED)
    {
        vm->set_etime(the_time);
        vm->set_running_etime(the_time);

        vm->set_reason(History::ERROR);
        vm->set_action(History::RESUME_ACTION);

        vm->set_state(VirtualMachine::SUSPENDED);
        vm->set_state(VirtualMachine::LCM_INIT);

        vmpool->update(vm);
        vmpool->update_history(vm);
    }
    else if (vm->get_lcm_state() == VirtualMachine::BOOT_STOPPED)
    {
        vm->set_state(VirtualMachine::BOOT_STOPPED_FAILURE);

        vmpool->update(vm);
    }
    else if (vm->get_lcm_state() == VirtualMachine::BOOT_UNDEPLOY)
    {
        vm->set_state(VirtualMachine::BOOT_UNDEPLOY_FAILURE);

        vmpool->update(vm);
    }
    //wrong state + recover failure from failure state
    else if ( vm->get_lcm_state() != VirtualMachine::BOOT_FAILURE &&
              vm->get_lcm_state() != VirtualMachine::BOOT_MIGRATE_FAILURE &&
              vm->get_lcm_state() != VirtualMachine::BOOT_UNDEPLOY_FAILURE &&
              vm->get_lcm_state() != VirtualMachine::BOOT_STOPPED_FAILURE )
    {
        vm->log("LCM",Log::ERROR,"deploy_failure_action, VM in a wrong state");
    }

    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::shutdown_success_action(int vid)
{
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

        vm->reset_info();

        vmpool->update(vm);

        vm->set_epilog_stime(the_time);

        vm->set_running_etime(the_time);

        vm->set_reason(History::USER);

        vmpool->update_history(vm);

        //----------------------------------------------------

        tm->trigger(TransferManager::EPILOG,vid);
    }
    else if (vm->get_lcm_state() == VirtualMachine::SHUTDOWN_POWEROFF)
    {
        //----------------------------------------------------
        //                POWEROFF STATE
        //----------------------------------------------------

        vm->delete_snapshots();

        vm->reset_info();

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

        vm->reset_info();

        vmpool->update(vm);

        vm->set_epilog_stime(the_time);

        vm->set_running_etime(the_time);

        vm->set_reason(History::USER);

        vmpool->update_history(vm);

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

void LifeCycleManager::prolog_success_action(int vid)
{
    VirtualMachine *        vm;
    time_t                  the_time = time(0);
    ostringstream           os;

    VirtualMachineManager::Actions action;

    vm = vmpool->get(vid, true);

    if ( vm == 0 )
    {
        return;
    }

    VirtualMachine::LcmState lcm_state = vm->get_lcm_state();

    switch (lcm_state)
    {
        //---------------------------------------------------------------------
        //                             BOOT STATE
        //---------------------------------------------------------------------
        case VirtualMachine::PROLOG_RESUME:
        case VirtualMachine::PROLOG_RESUME_FAILURE: //recover success
        case VirtualMachine::PROLOG_UNDEPLOY:
        case VirtualMachine::PROLOG_UNDEPLOY_FAILURE: //recover success
        case VirtualMachine::PROLOG_MIGRATE:
        case VirtualMachine::PROLOG_MIGRATE_FAILURE: //recover success
        case VirtualMachine::PROLOG:
        case VirtualMachine::PROLOG_FAILURE: //recover success
        case VirtualMachine::PROLOG_MIGRATE_UNKNOWN:
        case VirtualMachine::PROLOG_MIGRATE_UNKNOWN_FAILURE: //recover success
            switch (lcm_state)
            {
                case VirtualMachine::PROLOG_RESUME:
                case VirtualMachine::PROLOG_RESUME_FAILURE:
                    action = VirtualMachineManager::RESTORE;
                    vm->set_state(VirtualMachine::BOOT_STOPPED);
                    break;

                case VirtualMachine::PROLOG_UNDEPLOY:
                case VirtualMachine::PROLOG_UNDEPLOY_FAILURE:
                    action = VirtualMachineManager::DEPLOY;
                    vm->set_state(VirtualMachine::BOOT_UNDEPLOY);
                    break;

                case VirtualMachine::PROLOG_MIGRATE:
                case VirtualMachine::PROLOG_MIGRATE_FAILURE: //recover success
                    action = VirtualMachineManager::RESTORE;
                    vm->set_state(VirtualMachine::BOOT_MIGRATE);
                    break;

                case VirtualMachine::PROLOG:
                case VirtualMachine::PROLOG_FAILURE: //recover success
                case VirtualMachine::PROLOG_MIGRATE_UNKNOWN:
                case VirtualMachine::PROLOG_MIGRATE_UNKNOWN_FAILURE: //recover success
                    action = VirtualMachineManager::DEPLOY;
                    vm->set_state(VirtualMachine::BOOT);
                    break;

                default:
                    return;
            }

            vmpool->update(vm);

            vm->set_prolog_etime(the_time);

            vm->set_running_stime(the_time);

            vm->set_last_poll(0);

            vmpool->update_history(vm);

            vmm->trigger(action,vid);
            break;

        //---------------------------------------------------------------------
        //                      POWEROFF/SUSPEND STATE
        //---------------------------------------------------------------------
        case VirtualMachine::PROLOG_MIGRATE_POWEROFF:
        case VirtualMachine::PROLOG_MIGRATE_POWEROFF_FAILURE: //recover success
        case VirtualMachine::PROLOG_MIGRATE_SUSPEND:
        case VirtualMachine::PROLOG_MIGRATE_SUSPEND_FAILURE: //recover success
            vm->delete_snapshots();

            vm->reset_info();

            vmpool->update(vm);

            vm->set_etime(the_time);

            vm->set_prolog_etime(the_time);

            vm->set_last_poll(0);

            vm->set_vm_info();

            vm->set_reason(History::USER);
            vm->set_action(History::MIGRATE_ACTION);

            vmpool->update_history(vm);

            if (lcm_state == VirtualMachine::PROLOG_MIGRATE_POWEROFF||
                lcm_state == VirtualMachine::PROLOG_MIGRATE_POWEROFF_FAILURE)
            {
                dm->trigger(DispatchManager::POWEROFF_SUCCESS,vid);
            }
            else //PROLOG_MIGRATE_SUSPEND, PROLOG_MIGRATE_SUSPEND_FAILURE
            {
                dm->trigger(DispatchManager::SUSPEND_SUCCESS,vid);
            }
            break;

        default:
            vm->log("LCM",Log::ERROR,"prolog_success_action, VM in a wrong state");
            break;
    }

    vm->unlock();

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::prolog_failure_action(int vid)
{
    VirtualMachine * vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    switch(vm->get_lcm_state())
    {
        case VirtualMachine::PROLOG:
            vm->set_state(VirtualMachine::PROLOG_FAILURE);
            vmpool->update(vm);
            break;

        case VirtualMachine::PROLOG_MIGRATE:
            vm->set_state(VirtualMachine::PROLOG_MIGRATE_FAILURE);
            vmpool->update(vm);
            break;

        case VirtualMachine::PROLOG_MIGRATE_POWEROFF:
            vm->set_state(VirtualMachine::PROLOG_MIGRATE_POWEROFF_FAILURE);
            vmpool->update(vm);
            break;

        case VirtualMachine::PROLOG_MIGRATE_SUSPEND:
            vm->set_state(VirtualMachine::PROLOG_MIGRATE_SUSPEND_FAILURE);
            vmpool->update(vm);
            break;

        case VirtualMachine::PROLOG_MIGRATE_UNKNOWN:
            vm->set_state(VirtualMachine::PROLOG_MIGRATE_UNKNOWN_FAILURE);
            vmpool->update(vm);
            break;

        case VirtualMachine::PROLOG_RESUME:
            vm->set_state(VirtualMachine::PROLOG_RESUME_FAILURE);
            vmpool->update(vm);
            break;

        case VirtualMachine::PROLOG_UNDEPLOY:
            vm->set_state(VirtualMachine::PROLOG_UNDEPLOY_FAILURE);
            vmpool->update(vm);
            break;

        case VirtualMachine::PROLOG_MIGRATE_FAILURE: //recover failure from failure state
        case VirtualMachine::PROLOG_MIGRATE_POWEROFF_FAILURE:
        case VirtualMachine::PROLOG_MIGRATE_SUSPEND_FAILURE:
        case VirtualMachine::PROLOG_MIGRATE_UNKNOWN_FAILURE:
        case VirtualMachine::PROLOG_RESUME_FAILURE:
        case VirtualMachine::PROLOG_UNDEPLOY_FAILURE:
        case VirtualMachine::PROLOG_FAILURE:
            break;

        default: //wrong state
            vm->log("LCM",Log::ERROR,"prolog_failure_action, VM in a wrong state");
            break;
    }

    vm->unlock();

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::epilog_success_action(int vid)
{
    VirtualMachine *    vm;
    vector<VectorAttribute *> pci;

    time_t the_time = time(0);
    int    cpu,mem,disk;
    unsigned int port;

    VirtualMachine::LcmState state;
    DispatchManager::Actions action;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    state = vm->get_lcm_state();

    //Recover failure epilog states with success
    if ( state == VirtualMachine::EPILOG_STOP_FAILURE )
    {
        vm->set_state(VirtualMachine::EPILOG_STOP);
        vmpool->update(vm);
    }
    else if ( state == VirtualMachine::EPILOG_UNDEPLOY_FAILURE )
    {
        vm->set_state(VirtualMachine::EPILOG_UNDEPLOY);
        vmpool->update(vm);
    }
    else if ( state == VirtualMachine::EPILOG_FAILURE )
    {
        vm->set_state(VirtualMachine::EPILOG);
        vmpool->update(vm);
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

    vm->get_requirements(cpu, mem, disk, pci);

    hpool->del_capacity(vm->get_hid(), vm->get_oid(), cpu, mem, disk, pci);

    const VectorAttribute * graphics = vm->get_template_attribute("GRAPHICS");

    if ( graphics != 0 && (graphics->vector_value("PORT", port) == 0))
    {
        clpool->release_vnc_port(vm->get_cid(), port);
    }

    //----------------------------------------------------

    dm->trigger(action,vid);

    vm->unlock();

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::cleanup_callback_action(int vid)
{
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
    else if ( state == VirtualMachine::EPILOG )
    {
        vm->set_state(VirtualMachine::EPILOG_FAILURE);
        vmpool->update(vm);
    }
    else if ( state == VirtualMachine::EPILOG_STOP )
    {
        vm->set_state(VirtualMachine::EPILOG_STOP_FAILURE);
        vmpool->update(vm);
    }
    else if ( state == VirtualMachine::EPILOG_UNDEPLOY )
    {
        vm->set_state(VirtualMachine::EPILOG_UNDEPLOY_FAILURE);
        vmpool->update(vm);
    }
    //wrong state + recover failure from failure state
    else if ( state != VirtualMachine::EPILOG_FAILURE &&
              state != VirtualMachine::EPILOG_UNDEPLOY_FAILURE &&
              state != VirtualMachine::EPILOG_STOP_FAILURE )
    {
        vm->log("LCM",Log::ERROR,"epilog_failure_action, VM in a wrong state");
    }

    vm->unlock();

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::monitor_suspend_action(int vid)
{
    VirtualMachine *    vm;

    time_t  the_time = time(0);

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

        vm->log("LCM", Log::INFO, "Polling reports that the VM is suspended.");

        vm->set_state(VirtualMachine::SAVE_SUSPEND);

        vm->set_resched(false);

        vm->delete_snapshots();

        vm->reset_info();

        vmpool->update(vm);

        vm->set_running_etime(the_time);

        vm->set_etime(the_time);

        vm->set_vm_info();

        vm->set_reason(History::ERROR);

        vmpool->update_history(vm);

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

    if ( vm->get_lcm_state() == VirtualMachine::RUNNING )
    {
        //----------------------------------------------------
        //                POWEROFF STATE
        //----------------------------------------------------

        vm->log("LCM",Log::INFO,"VM running but monitor state is POWEROFF");

        time_t the_time = time(0);

        vm->delete_snapshots();

        vm->reset_info();

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

    } else if ( vm->get_lcm_state() == VirtualMachine::SHUTDOWN ||
                vm->get_lcm_state() == VirtualMachine::SHUTDOWN_POWEROFF ||
                vm->get_lcm_state() == VirtualMachine::SHUTDOWN_UNDEPLOY )
    {
        vm->log("LCM", Log::INFO, "VM reported SHUTDOWN by the drivers");

        trigger(LifeCycleManager::SHUTDOWN_SUCCESS, vid);
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

    if ( vm->get_state() == VirtualMachine::POWEROFF )
    {
            vm->log("VMM",Log::INFO,"VM found again by the drivers");

            time_t the_time = time(0);

            vm->set_state(VirtualMachine::ACTIVE);

            vm->set_state(VirtualMachine::RUNNING);

            vm->cp_history();

            vmpool->update(vm);

            vm->set_stime(the_time);

            vm->set_running_stime(the_time);

            vm->set_last_poll(the_time);

            vmpool->update_history(vm);
    }
    else if ( vm->get_state() == VirtualMachine::ACTIVE )
    {
        switch (vm->get_lcm_state()) {
            case VirtualMachine::UNKNOWN:
                vm->log("LCM", Log::INFO, "VM found again by the drivers");

                vm->set_state(VirtualMachine::RUNNING);
                vmpool->update(vm);
                break;

            case VirtualMachine::BOOT:
            case VirtualMachine::BOOT_POWEROFF:
            case VirtualMachine::BOOT_UNKNOWN :
            case VirtualMachine::BOOT_SUSPENDED:
            case VirtualMachine::BOOT_STOPPED:
            case VirtualMachine::BOOT_UNDEPLOY:
            case VirtualMachine::BOOT_MIGRATE:
            case VirtualMachine::BOOT_MIGRATE_FAILURE:
            case VirtualMachine::BOOT_STOPPED_FAILURE:
            case VirtualMachine::BOOT_UNDEPLOY_FAILURE:
            case VirtualMachine::BOOT_FAILURE:
                vm->log("LCM", Log::INFO, "VM reported RUNNING by the drivers");

                trigger(LifeCycleManager::DEPLOY_SUCCESS, vid);
                break;

            default:
                break;
        }
    }

    vm->unlock();
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
    else if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG_PROLOG_POWEROFF )
    {
        vm->log("LCM", Log::INFO, "VM Disk successfully attached.");

        vm->clear_attach_disk();
        vmpool->update(vm);

        dm->trigger(DispatchManager::POWEROFF_SUCCESS,vid);
    }
    else
    {
        vm->log("LCM",Log::ERROR,"attach_success_action, VM in a wrong state");
    }

    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::attach_failure_action(int vid)
{
    VirtualMachine *  vm;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG ||
         vm->get_lcm_state() == VirtualMachine::HOTPLUG_PROLOG_POWEROFF )
    {
        vm->unlock();

        vmpool->delete_attach_disk(vid);

        vm = vmpool->get(vid,true);

        if ( vm == 0 )
        {
            return;
        }

        if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG )
        {
            vm->set_state(VirtualMachine::RUNNING);
        }
        else
        {
            vm->log("LCM", Log::INFO, "VM Disk attach failure.");

            dm->trigger(DispatchManager::POWEROFF_SUCCESS,vid);
        }

        vmpool->update(vm);

        vm->unlock();
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
    VirtualMachine *  vm;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG ||
         vm->get_lcm_state() == VirtualMachine::HOTPLUG_EPILOG_POWEROFF )
    {
        vm->unlock();

        vmpool->delete_attach_disk(vid);

        vm = vmpool->get(vid,true);

        if ( vm == 0 )
        {
            return;
        }

        if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG )
        {
            vm->set_state(VirtualMachine::RUNNING);
        }
        else
        {
            vm->log("LCM", Log::INFO, "VM Disk successfully detached.");

            dm->trigger(DispatchManager::POWEROFF_SUCCESS,vid);
        }

        vmpool->update(vm);

        vm->unlock();
    }
    else
    {
        vm->log("LCM",Log::ERROR,"detach_success_action, VM in a wrong state");
        vm->unlock();
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::detach_failure_action(int vid)
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
    else if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG_EPILOG_POWEROFF )
    {
        vm->log("LCM", Log::INFO, "VM Disk detach failure.");

        vm->clear_attach_disk();
        vmpool->update(vm);

        dm->trigger(DispatchManager::POWEROFF_SUCCESS,vid);
    }
    else
    {
        vm->log("LCM",Log::ERROR,"detach_failure_action, VM in a wrong state");
    }

    vm->unlock();
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
        vm->attach_nic_success();

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

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG_NIC )
    {
        vm->unlock();

        vmpool->attach_nic_failure(vid);

        vm = vmpool->get(vid,true);

        if ( vm == 0 )
        {
            return;
        }

        vm->set_state(VirtualMachine::RUNNING);

        vmpool->update(vm);

        vm->unlock();
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
    VirtualMachine *  vm;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG_NIC )
    {
        vm->unlock();

        vmpool->detach_nic_success(vid);

        vm = vmpool->get(vid,true);

        if ( vm == 0 )
        {
            return;
        }

        vm->set_state(VirtualMachine::RUNNING);

        vmpool->update(vm);

        vm->unlock();
    }
    else
    {
        vm->log("LCM",Log::ERROR,"detach_nic_success_action, VM in a wrong state");
        vm->unlock();
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::detach_nic_failure_action(int vid)
{
    VirtualMachine * vm;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG_NIC )
    {
        vm->detach_nic_failure();

        vm->set_state(VirtualMachine::RUNNING);

        vmpool->update(vm);
    }
    else
    {
        vm->log("LCM",Log::ERROR,"detach_nic_failure_action, VM in a wrong state");
    }

    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::saveas_success_action(int vid)
{
    int image_id;
    int disk_id;
    string tm_mad;
    string snap;
    string ds_id;
    string src;

    VirtualMachine * vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    int rc = vm->get_saveas_disk(disk_id, src, image_id, snap, tm_mad, ds_id);

    vm->clear_saveas_disk();

    if (vm->clear_saveas_state() == -1)
    {
        vm->log("LCM",Log::ERROR, "saveas_success_action, VM in a wrong state");

        vmpool->update(vm);

        vm->unlock();

        return;
    }

    vmpool->update(vm);

    vm->unlock();

    if (rc != 0)
    {
        return;
    }

    Image * image = ipool->get(image_id, true);

    if (image == 0)
    {
        return;
    }

    image->set_state_unlock();

    ipool->update(image);

    image->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::saveas_failure_action(int vid)
{
    int image_id;
    int disk_id;
    string tm_mad;
    string snap;
    string ds_id;
    string src;

    VirtualMachine * vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    int rc = vm->get_saveas_disk(disk_id, src, image_id, snap, tm_mad, ds_id);

    vm->clear_saveas_disk();

    if (vm->clear_saveas_state() == -1)
    {
        vm->log("LCM",Log::ERROR, "saveas_failure_action, VM in a wrong state");

        vmpool->update(vm);

        vm->unlock();

        return;
    }

    vmpool->update(vm);

    vm->unlock();

    if (rc != 0)
    {
        return;
    }

    Image * image = ipool->get(image_id, true);

    if (image == 0)
    {
        return;
    }

    image->set_state(Image::ERROR);

    ipool->update(image);

    image->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::disk_snapshot_success(int vid)
{
    string tm_mad;
    int disk_id, ds_id, snap_id;
    int img_id = -1;

    Template *ds_quotas = 0;
    Template *vm_quotas = 0;

    const VectorAttribute* disk;
    Snapshots           snaps(-1);
    const Snapshots*    tmp_snaps;
    bool                has_snaps = false;
    string              error_str;

    VirtualMachine * vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if (vm->get_snapshot_disk(ds_id, tm_mad, disk_id, snap_id) == -1)
    {
        vm->log("LCM", Log::ERROR, "Snapshot DISK could not be found");

        vm->unlock();

        return;
    }

    int vm_uid = vm->get_uid();
    int vm_gid = vm->get_gid();

    VirtualMachine::LcmState state = vm->get_lcm_state();

    switch (state)
    {
        case VirtualMachine::DISK_SNAPSHOT:
            vm->set_state(VirtualMachine::RUNNING);
        case VirtualMachine::DISK_SNAPSHOT_POWEROFF:
        case VirtualMachine::DISK_SNAPSHOT_SUSPENDED:
        case VirtualMachine::DISK_SNAPSHOT_REVERT_POWEROFF:
        case VirtualMachine::DISK_SNAPSHOT_REVERT_SUSPENDED:
            vm->log("LCM", Log::INFO, "VM disk snapshot operation completed.");
            vm->revert_disk_snapshot(disk_id, snap_id);
            break;

        case VirtualMachine::DISK_SNAPSHOT_DELETE:
            vm->set_state(VirtualMachine::RUNNING);
        case VirtualMachine::DISK_SNAPSHOT_DELETE_POWEROFF:
        case VirtualMachine::DISK_SNAPSHOT_DELETE_SUSPENDED:
            vm->log("LCM", Log::INFO, "VM disk snapshot deleted.");
            vm->delete_disk_snapshot(disk_id, snap_id, &ds_quotas, &vm_quotas);

            break;

        default:
            vm->log("LCM",Log::ERROR,"disk_snapshot_success, VM in a wrong state");
            vm->unlock();
            return;
    }

    vm->clear_snapshot_disk();

    tmp_snaps = vm->get_disk_snapshots(disk_id, error_str);

    if(tmp_snaps != 0)
    {
        has_snaps = true;
        snaps = *tmp_snaps;
    }

    disk = (const_cast<const VirtualMachine *>(vm))->get_disk(disk_id);

    disk->vector_value("IMAGE_ID", img_id);

    bool is_persistent = VirtualMachine::is_persistent(disk);
    string target      = VirtualMachine::disk_tm_target(disk);

    vmpool->update(vm);

    vm->unlock();

    if ( ds_quotas != 0 )
    {
        Image* img = ipool->get(img_id, true);

        if(img != 0)
        {
            int img_uid = img->get_uid();
            int img_gid = img->get_gid();

            img->unlock();

            Quotas::ds_del(img_uid, img_gid, ds_quotas);
        }

        delete ds_quotas;
    }

    if ( vm_quotas != 0 )
    {
        Quotas::vm_del(vm_uid, vm_gid, vm_quotas);

        delete vm_quotas;
    }

    // Update image if it is persistent and ln mode does not clone it
    if ( img_id != -1 && is_persistent && has_snaps && target != "SYSTEM" )
    {
        imagem->set_image_snapshots(img_id, snaps);
    }

    switch (state)
    {
        case VirtualMachine::DISK_SNAPSHOT_POWEROFF:
        case VirtualMachine::DISK_SNAPSHOT_REVERT_POWEROFF:
        case VirtualMachine::DISK_SNAPSHOT_DELETE_POWEROFF:
            dm->trigger(DispatchManager::POWEROFF_SUCCESS, vid);
            break;

        case VirtualMachine::DISK_SNAPSHOT_SUSPENDED:
        case VirtualMachine::DISK_SNAPSHOT_REVERT_SUSPENDED:
        case VirtualMachine::DISK_SNAPSHOT_DELETE_SUSPENDED:
            dm->trigger(DispatchManager::SUSPEND_SUCCESS, vid);
            break;

        default:
            return;
    }

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::disk_snapshot_failure(int vid)
{
    string tm_mad;
    int disk_id, ds_id, snap_id;
    int img_id = -1;

    Template *ds_quotas = 0;
    Template *vm_quotas = 0;

    const VectorAttribute* disk;
    Snapshots           snaps(-1);
    const Snapshots*    tmp_snaps;
    bool                has_snaps = false;
    string              error_str;

    VirtualMachine * vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if (vm->get_snapshot_disk(ds_id, tm_mad, disk_id, snap_id) == -1)
    {
        vm->log("LCM", Log::ERROR, "Snapshot DISK could not be found");

        vm->unlock();

        return;
    }

    int vm_uid = vm->get_uid();
    int vm_gid = vm->get_gid();

    VirtualMachine::LcmState state = vm->get_lcm_state();

    switch (state)
    {
        case VirtualMachine::DISK_SNAPSHOT:
            vm->set_state(VirtualMachine::RUNNING);
        case VirtualMachine::DISK_SNAPSHOT_POWEROFF:
        case VirtualMachine::DISK_SNAPSHOT_SUSPENDED:
            vm->log("LCM", Log::ERROR, "Could not take disk snapshot.");
            vm->delete_disk_snapshot(disk_id, snap_id, &ds_quotas, &vm_quotas);
            break;

        case VirtualMachine::DISK_SNAPSHOT_DELETE:
            vm->set_state(VirtualMachine::RUNNING);
        case VirtualMachine::DISK_SNAPSHOT_DELETE_POWEROFF:
        case VirtualMachine::DISK_SNAPSHOT_REVERT_POWEROFF:
        case VirtualMachine::DISK_SNAPSHOT_DELETE_SUSPENDED:
        case VirtualMachine::DISK_SNAPSHOT_REVERT_SUSPENDED:
            vm->log("LCM", Log::ERROR, "VM disk snapshot operation failed.");
            break;

        default:
            vm->log("LCM",Log::ERROR,"disk_snapshot_failure, VM in a wrong state");
            vm->unlock();
            return;
    }

    vm->clear_snapshot_disk();

    tmp_snaps = vm->get_disk_snapshots(disk_id, error_str);

    if(tmp_snaps != 0)
    {
        has_snaps = true;
        snaps = *tmp_snaps;
    }

    disk = (const_cast<const VirtualMachine *>(vm))->get_disk(disk_id);

    disk->vector_value("IMAGE_ID", img_id);

    bool is_persistent = VirtualMachine::is_persistent(disk);
    string target      = VirtualMachine::disk_tm_target(disk);

    vmpool->update(vm);

    vm->unlock();

    if ( ds_quotas != 0 )
    {
        Image* img = ipool->get(img_id, true);

        if(img != 0)
        {
            int img_uid = img->get_uid();
            int img_gid = img->get_gid();

            img->unlock();

            Quotas::ds_del(img_uid, img_gid, ds_quotas);
        }

        delete ds_quotas;
    }

    if ( vm_quotas != 0 )
    {
        Quotas::vm_del(vm_uid, vm_gid, vm_quotas);

        delete vm_quotas;
    }

    // Update image if it is persistent and ln mode does not clone it
    if ( img_id != -1 && is_persistent && has_snaps && target != "SYSTEM" )
    {
        imagem->set_image_snapshots(img_id, snaps);
    }

    switch (state)
    {
        case VirtualMachine::DISK_SNAPSHOT_POWEROFF:
        case VirtualMachine::DISK_SNAPSHOT_REVERT_POWEROFF:
        case VirtualMachine::DISK_SNAPSHOT_DELETE_POWEROFF:
            dm->trigger(DispatchManager::POWEROFF_SUCCESS, vid);
            break;

        case VirtualMachine::DISK_SNAPSHOT_SUSPENDED:
        case VirtualMachine::DISK_SNAPSHOT_REVERT_SUSPENDED:
        case VirtualMachine::DISK_SNAPSHOT_DELETE_SUSPENDED:
            dm->trigger(DispatchManager::SUSPEND_SUCCESS, vid);
            break;

        default:
            return;
    }
    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::disk_lock_success(int vid)
{
    VirtualMachine * vm = vmpool->get(vid,true);
    Image *          image;

    if ( vm == 0 )
    {
        return;
    }

    if ( vm->get_state() != VirtualMachine::CLONING &&
         vm->get_state() != VirtualMachine::CLONING_FAILURE )
    {
        vm->unlock();
        return;
    }

    set<int> ids;

    vm->get_cloning_image_ids(ids);

    vm->unlock();

    vector< pair<int,string> > ready;
    vector< pair<int,string> >::iterator rit;

    set<int> error;

    for (set<int>::iterator id = ids.begin(); id != ids.end(); id++)
    {
        image = ipool->get(*id, true);

        if (image != 0)
        {
            switch (image->get_state()) {
                case Image::USED:
                case Image::USED_PERS:
                    ready.push_back( make_pair(*id, image->get_source()) );
                    break;

                case Image::ERROR:
                    error.insert(*id);
                    break;

                case Image::INIT:
                case Image::READY:
                case Image::DISABLED:
                case Image::LOCKED:
                case Image::CLONE:
                case Image::DELETE:
                case Image::LOCKED_USED:
                case Image::LOCKED_USED_PERS:
                    break;
            }

            image->unlock();
        }
    }

    vm = vmpool->get(vid,true);

    if (vm == 0)
    {
        return;
    }

    for (rit = ready.begin(); rit != ready.end(); rit++)
    {
        vm->clear_cloning_image_id(rit->first, rit->second);
    }

    if (ids.size() == ready.size())
    {
        bool on_hold = false;

        vm->get_template_attribute("SUBMIT_ON_HOLD", on_hold);

        if(on_hold)
        {
            vm->set_state(VirtualMachine::HOLD);
        }
        else
        {
            vm->set_state(VirtualMachine::PENDING);
        }
    }
    else if (error.size() > 0)
    {
        vm->set_state(VirtualMachine::CLONING_FAILURE);
    }
    else
    {
        vm->set_state(VirtualMachine::CLONING);
    }

    vmpool->update(vm);

    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::disk_lock_failure(int vid)
{
    disk_lock_success(vid);
}
