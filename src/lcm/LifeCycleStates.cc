/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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
#include <time.h>
#include <stdio.h>

#include "Nebula.h"
#include "LifeCycleManager.h"
#include "TransferManager.h"
#include "DispatchManager.h"
#include "VirtualMachineManager.h"
#include "ImageManager.h"
#include "Quotas.h"
#include "BackupJobPool.h"
#include "ClusterPool.h"
#include "HostPool.h"
#include "ImagePool.h"
#include "DatastorePool.h"
#include "VirtualMachinePool.h"

using namespace std;

void LifeCycleManager::start_prolog_migrate(VirtualMachine* vm)
{
    HostShareCapacity sr;

    time_t the_time = time(0);

    //----------------------------------------------------
    //                PROLOG_MIGRATE STATE
    //----------------------------------------------------

    vm->set_state(VirtualMachine::PROLOG_MIGRATE);

    vm->set_previous_etime(the_time);

    vm->set_previous_running_etime(the_time);

    vmpool->update_previous_history(vm);

    vm->set_prolog_stime(the_time);

    vmpool->update_history(vm);

    vm->get_capacity(sr);

    if ( vm->get_hid() != vm->get_previous_hid() )
    {
        hpool->del_capacity(vm->get_previous_hid(), sr);

        vm->release_previous_vnc_port();
    }

    vmpool->update(vm);

    //----------------------------------------------------

    tm->trigger_prolog_migr(vm);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::revert_migrate_after_failure(VirtualMachine* vm)
{
    HostShareCapacity sr;

    time_t the_time = time(0);

    //----------------------------------------------------
    //           RUNNING STATE FROM SAVE_MIGRATE
    //----------------------------------------------------

    vm->set_state(VirtualMachine::RUNNING);

    vm->set_etime(the_time);

    vmpool->update_history(vm);

    vm->get_capacity(sr);

    if ( vm->get_hid() != vm->get_previous_hid() )
    {
        hpool->del_capacity(vm->get_hid(), sr);

        if (!sr.pci.empty())
        {
            if (auto host = hpool->get(vm->get_previous_hid()))
            {
                // Revert PCI assignment in sr
                host->revert_pci(sr);
            }
        }

        vm->rollback_previous_vnc_port();
    }

    vm->set_previous_etime(the_time);

    vm->set_previous_running_etime(the_time);

    vmpool->update_previous_history(vm);

    // --- Add new record by copying the previous one

    vm->cp_previous_history();

    vm->set_stime(the_time);

    vm->set_running_stime(the_time);

    vmpool->insert_history(vm);

    vmpool->update(vm);

    vm->log("LCM", Log::INFO, "Fail to save VM state while migrating."
            " Assuming that the VM is still RUNNING.");
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_save_success(int vid)
{
    trigger([this, vid] {
        ostringstream       os;

        auto vm = vmpool->get(vid);

        if ( vm == nullptr )
        {
            return;
        }

        Template quota_tmpl;
        int uid = vm->get_uid();
        int gid = vm->get_gid();

        if ( vm->get_lcm_state() == VirtualMachine::SAVE_MIGRATE )
        {
            if ( !vmm->is_keep_snapshots(vm->get_vmm_mad()) )
            {
                vm->delete_snapshots(quota_tmpl);
            }

            start_prolog_migrate(vm.get());
        }
        else if (vm->get_lcm_state() == VirtualMachine::SAVE_SUSPEND)
        {
            //----------------------------------------------------
            //                SUSPENDED STATE
            //----------------------------------------------------

            if ( !vmm->is_keep_snapshots(vm->get_vmm_mad()) )
            {
                vm->delete_snapshots(quota_tmpl);

                vmpool->update(vm.get());
            }

            //----------------------------------------------------

            dm->trigger_suspend_success(vid);
        }
        else if ( vm->get_lcm_state() == VirtualMachine::SAVE_STOP)
        {
            time_t the_time = time(0);

            //----------------------------------------------------
            //                 EPILOG_STOP STATE
            //----------------------------------------------------

            vm->set_state(VirtualMachine::EPILOG_STOP);

            if ( !vmm->is_keep_snapshots(vm->get_vmm_mad()) )
            {
                vm->delete_snapshots(quota_tmpl);
            }

            vm->set_epilog_stime(the_time);

            vm->set_running_etime(the_time);

            vmpool->update_history(vm.get());

            vmpool->update(vm.get());

            //----------------------------------------------------

            tm->trigger_epilog_stop(vm.get());
        }
        else
        {
            vm->log("LCM",Log::ERROR,"save_success_action, VM in a wrong state");
        }

        vm.reset();

        if (!quota_tmpl.empty())
        {
            Quotas::quota_del(Quotas::VM, uid, gid, &quota_tmpl);
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_save_failure(int vid)
{
    trigger([this, vid] {
        auto vm = vmpool->get(vid);

        if ( vm == nullptr )
        {
            return;
        }

        if ( vm->get_lcm_state() == VirtualMachine::SAVE_MIGRATE )
        {
            revert_migrate_after_failure(vm.get());
        }
        else if ( vm->get_lcm_state() == VirtualMachine::SAVE_SUSPEND ||
                vm->get_lcm_state() == VirtualMachine::SAVE_STOP )
        {
            //----------------------------------------------------
            //    RUNNING STATE FROM SAVE_SUSPEND OR SAVE_STOP
            //----------------------------------------------------

            vm->set_state(VirtualMachine::RUNNING);

            vm->clear_action();

            vmpool->update_history(vm.get());

            vmpool->update(vm.get());

            vm->log("LCM", Log::INFO, "Fail to save VM state."
                    " Assuming that the VM is still RUNNING.");
        }
        else
        {
            vm->log("LCM",Log::ERROR,"save_failure_action, VM in a wrong state");
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_deploy_success(int vid)
{
    trigger([this, vid] {
        auto vm = vmpool->get(vid);

        if ( vm == nullptr )
        {
            return;
        }

        Template quota_tmpl;
        int uid = vm->get_uid();
        int gid = vm->get_gid();

        //----------------------------------------------------
        //                 RUNNING STATE
        //----------------------------------------------------

        if ( vm->get_lcm_state() == VirtualMachine::MIGRATE )
        {
            HostShareCapacity sr;

            time_t the_time = time(0);

            vm->set_running_stime(the_time);

            vmpool->update_history(vm.get());

            vm->set_previous_etime(the_time);

            vm->set_previous_running_etime(the_time);

            vmpool->update_previous_history(vm.get());

            vm->get_capacity(sr);

            hpool->del_capacity(vm->get_previous_hid(), sr);

            vm->set_state(VirtualMachine::RUNNING);

            if ( !vmm->is_keep_snapshots(vm->get_vmm_mad()) )
            {
                vm->delete_snapshots(quota_tmpl);
            }

            vm->release_previous_vnc_port();

            vmpool->update(vm.get());
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

            vm->clear_action();

            vm->set_etime(0);

            vm->set_running_etime(0);

            vmpool->update_history(vm.get());

            vmpool->update(vm.get());
        }
        else if ( vm->get_lcm_state() != VirtualMachine::RUNNING)
        {
            vm->log("LCM",Log::ERROR,"deploy_success_action, VM in a wrong state");
        }

        vm.reset();

        if (!quota_tmpl.empty())
        {
            Quotas::quota_del(Quotas::VM, uid, gid, &quota_tmpl);
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_deploy_failure(int vid)
{
    trigger([this, vid] {
        auto vm = vmpool->get(vid);

        if ( vm == nullptr )
        {
            return;
        }

        time_t the_time = time(0);

        if ( vm->get_lcm_state() == VirtualMachine::MIGRATE )
        {
            HostShareCapacity sr;

            //----------------------------------------------------
            //           RUNNING STATE FROM MIGRATE
            //----------------------------------------------------

            vm->set_state(VirtualMachine::RUNNING);

            vm->set_etime(the_time);

            vmpool->update_history(vm.get());

            vm->set_previous_etime(the_time);

            vm->set_previous_running_etime(the_time);

            vmpool->update_previous_history(vm.get());

            vm->get_capacity(sr);

            hpool->del_capacity(vm->get_hid(), sr);

            vm->rollback_previous_vnc_port();

            // --- Add new record by copying the previous one

            vm->cp_previous_history();

            vm->set_stime(the_time);

            vm->set_running_stime(the_time);

            vmpool->insert_history(vm.get());

            vmpool->update(vm.get());

            vm->log("LCM", Log::INFO, "Fail to live migrate VM."
                    " Assuming that the VM is still RUNNING.");

            return;
        }
        else if (vm->get_lcm_state() == VirtualMachine::BOOT)
        {
            vm->set_state(VirtualMachine::BOOT_FAILURE);
        }
        else if (vm->get_lcm_state() == VirtualMachine::BOOT_MIGRATE)
        {
            vm->set_state(VirtualMachine::BOOT_MIGRATE_FAILURE);
        }
        else if (vm->get_lcm_state() == VirtualMachine::BOOT_UNKNOWN)
        {
            vm->set_state(VirtualMachine::UNKNOWN);
        }
        else if (vm->get_lcm_state() == VirtualMachine::BOOT_POWEROFF)
        {
            vm->set_state(VirtualMachine::POWEROFF);
            vm->set_state(VirtualMachine::LCM_INIT);
        }
        else if (vm->get_lcm_state() == VirtualMachine::BOOT_SUSPENDED)
        {
            vm->set_state(VirtualMachine::SUSPENDED);
            vm->set_state(VirtualMachine::LCM_INIT);
        }
        else if (vm->get_lcm_state() == VirtualMachine::BOOT_STOPPED)
        {
            vm->set_state(VirtualMachine::BOOT_STOPPED_FAILURE);

            vm->set_etime(the_time);
        }
        else if (vm->get_lcm_state() == VirtualMachine::BOOT_UNDEPLOY)
        {
            vm->set_state(VirtualMachine::BOOT_UNDEPLOY_FAILURE);

            vm->set_etime(the_time);
        }
        //wrong state + recover failure from failure state
        else if ( vm->get_lcm_state() != VirtualMachine::BOOT_FAILURE &&
                vm->get_lcm_state() != VirtualMachine::BOOT_MIGRATE_FAILURE &&
                vm->get_lcm_state() != VirtualMachine::BOOT_UNDEPLOY_FAILURE &&
                vm->get_lcm_state() != VirtualMachine::BOOT_STOPPED_FAILURE )
        {
            vm->log("LCM",Log::ERROR,"deploy_failure_action, VM in a wrong state");
        }

        vm->set_running_etime(the_time);

        vmpool->update_history(vm.get());

        vmpool->update(vm.get());
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_shutdown_success(int vid)
{
    trigger([this, vid] {
        time_t              the_time = time(0);

        auto vm = vmpool->get(vid);

        if ( vm == nullptr )
        {
            return;
        }

        Template quota_tmpl;
        int uid = vm->get_uid();
        int gid = vm->get_gid();

        if ( vm->get_lcm_state() == VirtualMachine::SHUTDOWN )
        {
            //----------------------------------------------------
            //                   EPILOG STATE
            //----------------------------------------------------
            vm->set_state(VirtualMachine::EPILOG);

            if ( !vmm->is_keep_snapshots(vm->get_vmm_mad()) )
            {
                vm->delete_snapshots(quota_tmpl);
            }

            vm->set_epilog_stime(the_time);

            vm->set_running_etime(the_time);

            vmpool->update_history(vm.get());

            vmpool->update(vm.get());

            //----------------------------------------------------

            tm->trigger_epilog(false, vm.get());
        }
        else if (vm->get_lcm_state() == VirtualMachine::SHUTDOWN_POWEROFF)
        {
            //----------------------------------------------------
            //                POWEROFF STATE
            //----------------------------------------------------

            if ( !vmm->is_keep_snapshots(vm->get_vmm_mad()) )
            {
                vm->delete_snapshots(quota_tmpl);

                vmpool->update(vm.get());
            }

            //----------------------------------------------------

            dm->trigger_poweroff_success(vid);
        }
        else if (vm->get_lcm_state() == VirtualMachine::SHUTDOWN_UNDEPLOY)
        {
            //----------------------------------------------------
            //            EPILOG_UNDEPLOY STATE
            //----------------------------------------------------

            vm->set_state(VirtualMachine::EPILOG_UNDEPLOY);

            if ( !vmm->is_keep_snapshots(vm->get_vmm_mad()) )
            {
                vm->delete_snapshots(quota_tmpl);
            }

            vm->set_epilog_stime(the_time);

            vm->set_running_etime(the_time);

            vmpool->update_history(vm.get());

            vmpool->update(vm.get());

            //----------------------------------------------------

            tm->trigger_epilog_stop(vm.get());
        }
        else if (vm->get_lcm_state() == VirtualMachine::SAVE_MIGRATE)
        {
            if ( !vmm->is_keep_snapshots(vm->get_vmm_mad()) )
            {
                vm->delete_snapshots(quota_tmpl);
            }

            start_prolog_migrate(vm.get());
        }
        else
        {
            vm->log("LCM",Log::ERROR,"shutdown_success_action, VM in a wrong state");
        }

        vm.reset();

        if (!quota_tmpl.empty())
        {
            Quotas::quota_del(Quotas::VM, uid, gid, &quota_tmpl);
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_shutdown_failure(int vid)
{
    trigger([this, vid] {
        auto vm = vmpool->get(vid);

        if ( vm == nullptr )
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

            vm->clear_action();

            vmpool->update_history(vm.get());

            vmpool->update(vm.get());

            vm->log("LCM", Log::INFO, "Fail to shutdown VM."
                    " Assuming that the VM is still RUNNING.");
        }
        else if (vm->get_lcm_state() == VirtualMachine::SAVE_MIGRATE)
        {
            revert_migrate_after_failure(vm.get());
        }
        else
        {
            vm->log("LCM",Log::ERROR,"shutdown_failure_action, VM in a wrong state");
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_prolog_success(int vid)
{
    trigger([this, vid] {
        time_t                  the_time = time(0);
        ostringstream           os;

        auto vm = vmpool->get(vid);

        if ( vm == nullptr )
        {
            return;
        }

        Template quota_tmpl;
        int uid = vm->get_uid();
        int gid = vm->get_gid();

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
                        vmm->trigger_restore(vid);
                        vm->set_state(VirtualMachine::BOOT_STOPPED);
                        break;

                    case VirtualMachine::PROLOG_UNDEPLOY:
                    case VirtualMachine::PROLOG_UNDEPLOY_FAILURE:
                        vmm->trigger_deploy(vid);
                        vm->set_state(VirtualMachine::BOOT_UNDEPLOY);
                        break;

                    case VirtualMachine::PROLOG_MIGRATE:
                    case VirtualMachine::PROLOG_MIGRATE_FAILURE: //recover success
                        if (vm->get_action() == VMActions::POFF_MIGRATE_ACTION ||
                            vm->get_action() == VMActions::POFF_HARD_MIGRATE_ACTION)
                        {
                            vmm->trigger_deploy(vid);
                            vm->set_state(VirtualMachine::BOOT);
                        }
                        else
                        {
                            vmm->trigger_restore(vid);
                            vm->set_state(VirtualMachine::BOOT_MIGRATE);
                        }
                        break;
                    case VirtualMachine::PROLOG_MIGRATE_UNKNOWN:
                    case VirtualMachine::PROLOG_MIGRATE_UNKNOWN_FAILURE:
                    case VirtualMachine::PROLOG:
                    case VirtualMachine::PROLOG_FAILURE: //recover success
                        vmm->trigger_deploy(vid);
                        vm->set_state(VirtualMachine::BOOT);
                        break;

                    default:
                        return;
                }

                vm->set_prolog_etime(the_time);

                vm->set_running_stime(the_time);

                vmpool->update_history(vm.get());

                vmpool->update(vm.get());
                break;

            //---------------------------------------------------------------------
            //                      POWEROFF/SUSPEND STATE
            //---------------------------------------------------------------------
            case VirtualMachine::PROLOG_MIGRATE_POWEROFF:
            case VirtualMachine::PROLOG_MIGRATE_POWEROFF_FAILURE: //recover success
            case VirtualMachine::PROLOG_MIGRATE_SUSPEND:
            case VirtualMachine::PROLOG_MIGRATE_SUSPEND_FAILURE: //recover success
                if ( !vmm->is_keep_snapshots(vm->get_vmm_mad()) )
                {
                    vm->delete_snapshots(quota_tmpl);
                }

                vm->set_prolog_etime(the_time);

                vmpool->update_history(vm.get());

                vmpool->update(vm.get());

                if (lcm_state == VirtualMachine::PROLOG_MIGRATE_POWEROFF||
                    lcm_state == VirtualMachine::PROLOG_MIGRATE_POWEROFF_FAILURE)
                {
                    dm->trigger_poweroff_success(vid);
                }
                else //PROLOG_MIGRATE_SUSPEND, PROLOG_MIGRATE_SUSPEND_FAILURE
                {
                    dm->trigger_suspend_success(vid);
                }
                break;

            default:
                vm->log("LCM",Log::ERROR,"prolog_success_action, VM in a wrong state");
                break;
        }

        vm.reset();

        if (!quota_tmpl.empty())
        {
            Quotas::quota_del(Quotas::VM, uid, gid, &quota_tmpl);
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_prolog_failure(int vid)
{
    trigger([this, vid] {
        HostShareCapacity sr;

        time_t t = time(0);

        auto vm = vmpool->get(vid);

        if ( vm == nullptr )
        {
            return;
        }

        switch (vm->get_lcm_state())
        {
            case VirtualMachine::PROLOG:
                vm->set_state(VirtualMachine::PROLOG_FAILURE);
                vmpool->update(vm.get());
                break;

            case VirtualMachine::PROLOG_MIGRATE:
                vm->set_state(VirtualMachine::PROLOG_MIGRATE_FAILURE);
                vmpool->update(vm.get());
                break;

            case VirtualMachine::PROLOG_MIGRATE_POWEROFF:
                vm->set_state(VirtualMachine::PROLOG_MIGRATE_POWEROFF_FAILURE);
                vmpool->update(vm.get());
                break;

            case VirtualMachine::PROLOG_MIGRATE_SUSPEND:
                vm->set_state(VirtualMachine::PROLOG_MIGRATE_SUSPEND_FAILURE);
                vmpool->update(vm.get());
                break;

            case VirtualMachine::PROLOG_MIGRATE_UNKNOWN:
                vm->set_state(VirtualMachine::PROLOG_MIGRATE_UNKNOWN_FAILURE);
                vmpool->update(vm.get());
                break;

            case VirtualMachine::PROLOG_RESUME:
                vm->set_state(VirtualMachine::PROLOG_RESUME_FAILURE);
                vmpool->update(vm.get());
                break;

            case VirtualMachine::PROLOG_UNDEPLOY:
                vm->set_state(VirtualMachine::PROLOG_UNDEPLOY_FAILURE);
                vmpool->update(vm.get());
                break;

            //recover failure from failure state
            case VirtualMachine::PROLOG_MIGRATE_FAILURE:
            case VirtualMachine::PROLOG_MIGRATE_POWEROFF_FAILURE:
            case VirtualMachine::PROLOG_MIGRATE_SUSPEND_FAILURE:
            case VirtualMachine::PROLOG_MIGRATE_UNKNOWN_FAILURE:

                // Close current history record
                vm->set_prolog_etime(t);
                vm->set_etime(t);

                vmpool->update_history(vm.get());

                switch (vm->get_lcm_state())
                {
                    case VirtualMachine::PROLOG_MIGRATE_FAILURE:
                        vm->set_state(VirtualMachine::PROLOG_MIGRATE);
                        break;
                    case VirtualMachine::PROLOG_MIGRATE_POWEROFF_FAILURE:
                        vm->set_state(VirtualMachine::PROLOG_MIGRATE_POWEROFF);
                        break;
                    case VirtualMachine::PROLOG_MIGRATE_SUSPEND_FAILURE:
                        vm->set_state(VirtualMachine::PROLOG_MIGRATE_SUSPEND);
                        break;
                    case VirtualMachine::PROLOG_MIGRATE_UNKNOWN_FAILURE:
                        vm->set_state(VirtualMachine::PROLOG_MIGRATE_UNKNOWN);
                        break;
                    default:
                        break;
                }

                vm->get_capacity(sr);

                hpool->del_capacity(vm->get_hid(), sr);

                // Clone previous history record into a new one
                vm->cp_previous_history();

                vm->set_stime(t);
                vm->set_prolog_stime(t);

                hpool->add_capacity(vm->get_hid(), sr);

                vmpool->insert_history(vm.get());

                vmpool->update(vm.get());

                trigger_prolog_success(vm->get_oid());
                break;

            case VirtualMachine::PROLOG_RESUME_FAILURE:
            case VirtualMachine::PROLOG_UNDEPLOY_FAILURE:
            case VirtualMachine::PROLOG_FAILURE:
                break;

            default: //wrong state
                vm->log("LCM",Log::ERROR,"prolog_failure_action, VM in a wrong state");
                break;
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_epilog_success(int vid)
{
    trigger([this, vid] {
        HostShareCapacity sr;

        time_t the_time = time(0);
        unsigned int port;

        VirtualMachine::LcmState state;
        void (DispatchManager::*action)(int);

        auto vm = vmpool->get(vid);

        if ( vm == nullptr )
        {
            return;
        }

        state = vm->get_lcm_state();

        //Recover failure epilog states with success
        if ( state == VirtualMachine::EPILOG_STOP_FAILURE )
        {
            vm->set_state(VirtualMachine::EPILOG_STOP);
        }
        else if ( state == VirtualMachine::EPILOG_UNDEPLOY_FAILURE )
        {
            vm->set_state(VirtualMachine::EPILOG_UNDEPLOY);
        }
        else if ( state == VirtualMachine::EPILOG_FAILURE )
        {
            vm->set_state(VirtualMachine::EPILOG);
        }

        state = vm->get_lcm_state();

        if ( state == VirtualMachine::EPILOG_STOP )
        {
            action = &DispatchManager::trigger_stop_success;
        }
        else if ( state == VirtualMachine::EPILOG_UNDEPLOY )
        {
            action = &DispatchManager::trigger_undeploy_success;
        }
        else if ( state == VirtualMachine::EPILOG )
        {
            action = &DispatchManager::trigger_done;
        }
        else if ( state == VirtualMachine::CLEANUP_RESUBMIT )
        {
            dm->trigger_resubmit(vid);

            vmpool->update(vm.get());

            return;
        }
        else
        {
            vm->log("LCM",Log::ERROR,"epilog_success_action, VM in a wrong state");

            return;
        }

        vm->set_epilog_etime(the_time);

        vm->set_etime(the_time);

        VectorAttribute * graphics = vm->get_template_attribute("GRAPHICS");

        //Do not free VNC ports for STOP as it is stored in checkpoint file
        if ( graphics != nullptr && (graphics->vector_value("PORT", port) == 0) &&
            state != VirtualMachine::EPILOG_STOP )
        {
            graphics->remove("PORT");
            clpool->release_vnc_port(vm->get_cid(), port);
        }

        vmpool->update_history(vm.get());

        vm->get_capacity(sr);

        hpool->del_capacity(vm->get_hid(), sr);

        vmpool->update(vm.get());

        //----------------------------------------------------

        (dm->*action)(vid);
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_cleanup_callback(int vid)
{
    trigger([this, vid] {
        VirtualMachine::LcmState state;

        auto vm = vmpool->get_ro(vid);

        if ( vm == nullptr )
        {
            return;
        }

        state = vm->get_lcm_state();

        if ( state == VirtualMachine::CLEANUP_RESUBMIT )
        {
            dm->trigger_resubmit(vid);

        }
        else
        {
            vm->log("LCM",Log::ERROR,"cleanup_callback_action, VM in a wrong state");
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_epilog_failure(int vid)
{
    trigger([this, vid] {
        VirtualMachine::LcmState state;

        auto vm = vmpool->get(vid);

        if ( vm == nullptr )
        {
            return;
        }

        state = vm->get_lcm_state();

        if ( state == VirtualMachine::CLEANUP_RESUBMIT )
        {
            dm->trigger_resubmit(vid);
        }
        else if ( state == VirtualMachine::EPILOG )
        {
            vm->set_state(VirtualMachine::EPILOG_FAILURE);
            vmpool->update(vm.get());
        }
        else if ( state == VirtualMachine::EPILOG_STOP )
        {
            vm->set_state(VirtualMachine::EPILOG_STOP_FAILURE);
            vmpool->update(vm.get());
        }
        else if ( state == VirtualMachine::EPILOG_UNDEPLOY )
        {
            vm->set_state(VirtualMachine::EPILOG_UNDEPLOY_FAILURE);
            vmpool->update(vm.get());
        }
        //wrong state + recover failure from failure state
        else if ( state != VirtualMachine::EPILOG_FAILURE &&
                state != VirtualMachine::EPILOG_UNDEPLOY_FAILURE &&
                state != VirtualMachine::EPILOG_STOP_FAILURE )
        {
            vm->log("LCM",Log::ERROR,"epilog_failure_action, VM in a wrong state");
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_monitor_suspend(int vid)
{
    trigger([this, vid] {
        auto vm = vmpool->get(vid);

        if ( vm == nullptr )
        {
            return;
        }

        Template quota_tmpl;
        int uid = vm->get_uid();
        int gid = vm->get_gid();

        if ( vm->get_lcm_state() == VirtualMachine::RUNNING ||
            vm->get_lcm_state() == VirtualMachine::UNKNOWN )
        {
            //----------------------------------------------------
            //                  SAVE_SUSPEND STATE
            //----------------------------------------------------

            vm->log("LCM", Log::INFO, "Polling reports that the VM is suspended.");

            vm->set_state(VirtualMachine::SAVE_SUSPEND);

            vm->set_resched(false);

            if ( !vmm->is_keep_snapshots(vm->get_vmm_mad()) )
            {
                vm->delete_snapshots(quota_tmpl);
            }

            vm->set_internal_action(VMActions::MONITOR_ACTION);

            vmpool->update_history(vm.get());

            vmpool->update(vm.get());

            //----------------------------------------------------

            dm->trigger_suspend_success(vid);
        }
        else
        {
            vm->log("LCM",Log::ERROR,"monitor_suspend_action, VM in a wrong state");
        }

        vm.reset();

        if (!quota_tmpl.empty())
        {
            Quotas::quota_del(Quotas::VM, uid, gid, &quota_tmpl);
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_monitor_done(int vid)
{
    trigger([this, vid] {
        auto vm = vmpool->get(vid);

        if ( vm == nullptr )
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

            vmpool->update(vm.get());
        }
        // This event can be received when the VM is in PROLOG, BOOT...
        // and other transient states (through host monitor probe).
        // Just ignore the callback if VM is not in RUNNING.
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_monitor_poweroff(int vid)
{
    trigger([this, vid] {
        auto vm = vmpool->get(vid);

        if ( vm == nullptr )
        {
            return;
        }

        Template quota_tmpl;
        int uid = vm->get_uid();
        int gid = vm->get_gid();

        if ( vm->get_lcm_state() == VirtualMachine::RUNNING ||
                vm->get_lcm_state() == VirtualMachine::UNKNOWN )
        {
            //----------------------------------------------------
            //                POWEROFF STATE
            //----------------------------------------------------

            vm->log("LCM",Log::INFO,"VM running but monitor state is POWEROFF");

            if ( !vmm->is_keep_snapshots(vm->get_vmm_mad()) )
            {
                vm->delete_snapshots(quota_tmpl);
            }

            vm->set_resched(false);

            vm->set_state(VirtualMachine::SHUTDOWN_POWEROFF);

            vm->set_internal_action(VMActions::MONITOR_ACTION);

            vmpool->update_history(vm.get());

            vmpool->update(vm.get());

            //----------------------------------------------------

            dm->trigger_poweroff_success(vid);

        }
        else if ( vm->get_lcm_state() == VirtualMachine::SHUTDOWN ||
                    vm->get_lcm_state() == VirtualMachine::SHUTDOWN_POWEROFF ||
                    vm->get_lcm_state() == VirtualMachine::SHUTDOWN_UNDEPLOY )
        {
            vm->log("LCM", Log::INFO, "VM reported SHUTDOWN by the drivers");

            trigger_shutdown_success(vid);
        }

        vm.reset();

        if (!quota_tmpl.empty())
        {
            Quotas::quota_del(Quotas::VM, uid, gid, &quota_tmpl);
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_monitor_poweron(int vid)
{
    trigger([this, vid] {
        auto vm = vmpool->get(vid);

        if ( vm == nullptr )
        {
            return;
        }

        if ( vm->get_state() == VirtualMachine::POWEROFF ||
            vm->get_state() == VirtualMachine::SUSPENDED )
        {
            VirtualMachineTemplate quota_tmpl;
            string error;

            time_t the_time = time(0);

            // Prevent Monitor and VMM driver race condition.
            // Ignore state updates for 30s after state changes
            if ( the_time - vm->get_running_etime() < 30 )
            {
                vm->log("VMM", Log::INFO, "Ignoring VM state update");
                return;
            }

            int uid = vm->get_uid();
            int gid = vm->get_gid();

            vm->log("VMM",Log::INFO,"VM found again by the drivers");

            vm->set_state(VirtualMachine::ACTIVE);

            vm->set_state(VirtualMachine::RUNNING);

            vm->set_etime(the_time);

            vmpool->update_history(vm.get());

            vm->cp_history();

            vm->set_stime(the_time);

            vm->set_running_stime(the_time);

            vmpool->insert_history(vm.get());

            vmpool->update(vm.get());

            vm->get_quota_template(quota_tmpl, true);

            vm.reset();

            Quotas::vm_check(uid, gid, &quota_tmpl, error);
        }
        else if ( vm->get_state() == VirtualMachine::ACTIVE )
        {
            switch (vm->get_lcm_state()) {
                case VirtualMachine::UNKNOWN:
                    vm->log("LCM", Log::INFO, "VM found again by the drivers");

                    vm->set_state(VirtualMachine::RUNNING);
                    vmpool->update(vm.get());
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

                    trigger_deploy_success(vid);
                    break;

                default:
                    break;
            }
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_attach_success(int vid)
{
    trigger([this, vid] {
        auto vm = vmpool->get(vid);

        if ( vm == nullptr )
        {
            return;
        }

        if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG ||
             vm->get_lcm_state() == VirtualMachine::HOTPLUG_PROLOG_POWEROFF )
        {
            vm->log("LCM", Log::INFO, "VM Disk successfully attached.");

            vm->clear_attach_disk();

            // Reset incremental backup pointer. After attach a new full backup
            // is needed.
            if ( vm->backups().configured() )
            {
                vm->backups().last_increment_id(-1);
                vm->backups().incremental_backup_id(-1);
            }

            if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG )
            {
                vm->set_state(VirtualMachine::RUNNING);
            }
            else
            {
                dm->trigger_poweroff_success(vid);
            }

            vmpool->update(vm.get());
            vmpool->update_search(vm.get());
        }
        else
        {
            vm->log("LCM",Log::ERROR,"attach_success_action, VM in a wrong state");
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_attach_failure(int vid)
{
    trigger([this, vid] {
        auto vm = vmpool->get(vid);

        if ( vm == nullptr )
        {
            return;
        }

        if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG ||
            vm->get_lcm_state() == VirtualMachine::HOTPLUG_PROLOG_POWEROFF )
        {
            vmpool->delete_attach_disk(std::move(vm));

            vm = vmpool->get(vid);

            if ( vm == nullptr )
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

                dm->trigger_poweroff_success(vid);
            }

            vmpool->update(vm.get());
        }
        else
        {
            vm->log("LCM",Log::ERROR,"attach_failure_action, VM in a wrong state");
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_detach_success(int vid)
{
    trigger([this, vid] {
        auto vm = vmpool->get(vid);

        if ( vm == nullptr )
        {
            return;
        }

        if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG ||
            vm->get_lcm_state() == VirtualMachine::HOTPLUG_EPILOG_POWEROFF )
        {
            vmpool->delete_attach_disk(std::move(vm));

            vm = vmpool->get(vid);

            if ( vm == nullptr )
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

                dm->trigger_poweroff_success(vid);
            }

            vmpool->update(vm.get());
            vmpool->update_search(vm.get());
        }
        else
        {
            vm->log("LCM",Log::ERROR,"detach_success_action, VM in a wrong state");
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_detach_failure(int vid)
{
    trigger([this, vid] {
        auto vm = vmpool->get(vid);

        if ( vm == nullptr )
        {
            return;
        }

        if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG )
        {
            vm->clear_attach_disk();

            vm->set_state(VirtualMachine::RUNNING);

            vmpool->update(vm.get());
        }
        else if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG_EPILOG_POWEROFF )
        {
            vm->log("LCM", Log::INFO, "VM Disk detach failure.");

            vm->clear_attach_disk();
            vmpool->update(vm.get());

            dm->trigger_poweroff_success(vid);
        }
        else
        {
            vm->log("LCM",Log::ERROR,"detach_failure_action, VM in a wrong state");
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_snapshot_create_success(int vid)
{
    trigger([this, vid] {
        auto vm = vmpool->get(vid);

        if ( vm == nullptr )
        {
            return;
        }

        if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG_SNAPSHOT )
        {
            vm->clear_active_snapshot();

            vm->set_state(VirtualMachine::RUNNING);

            vmpool->update(vm.get());
        }
        else
        {
            vm->log("LCM",Log::ERROR,"snapshot_create_success, VM in a wrong state");
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_snapshot_create_failure(int vid)
{
    trigger([this, vid] {
        int vm_uid, vm_gid;
        VectorAttribute* snap = nullptr;

        if ( auto vm = vmpool->get(vid) )
        {
            if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG_SNAPSHOT )
            {
                vm_uid = vm->get_uid();
                vm_gid = vm->get_gid();

                snap = vm->get_active_snapshot();

                if (snap)
                {
                    snap = snap->clone();
                }

                vm->delete_active_snapshot();

                vm->set_state(VirtualMachine::RUNNING);

                vmpool->update(vm.get());
            }
            else
            {
                vm->log("LCM",Log::ERROR,"snapshot_create_failure, VM in a wrong state");
            }
        }
        else
        {
            return;
        }

        if (snap)
        {
            Template quota_tmpl;

            quota_tmpl.set(snap);
            quota_tmpl.replace("VMS", 0);

            Quotas::quota_del(Quotas::VM, vm_uid, vm_gid, &quota_tmpl);
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_snapshot_revert_success(int vid)
{
    // TODO: snapshot list may be inconsistent with hypervisor info
    // after a revert operation
    trigger([this, vid] {
        auto vm = vmpool->get(vid);

        if ( vm == nullptr )
        {
            return;
        }

        if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG_SNAPSHOT )
        {
            vm->clear_active_snapshot();

            vm->set_state(VirtualMachine::RUNNING);

            vmpool->update(vm.get());
        }
        else
        {
            vm->log("LCM",Log::ERROR,"snapshot_revert_success, VM in a wrong state");
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_snapshot_revert_failure(int vid)
{
    trigger_snapshot_revert_success(vid);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_snapshot_delete_success(int vid)
{
    trigger([this, vid] {
        int vm_uid, vm_gid;
        VectorAttribute* snap = nullptr;

        if ( auto vm = vmpool->get(vid) )
        {
            if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG_SNAPSHOT )
            {
                vm_uid = vm->get_uid();
                vm_gid = vm->get_gid();

                snap = vm->get_active_snapshot();

                if (snap)
                {
                    snap = snap->clone();
                }

                vm->delete_active_snapshot();

                vm->set_state(VirtualMachine::RUNNING);

                vmpool->update(vm.get());
            }
            else
            {
                vm->log("LCM",Log::ERROR,"snapshot_delete_success, VM in a wrong state");
            }
        }
        else
        {
            return;
        }

        if (snap)
        {
            Template quota_tmpl;

            quota_tmpl.set(snap);
            quota_tmpl.replace("VMS", 0);

            Quotas::quota_del(Quotas::VM, vm_uid, vm_gid, &quota_tmpl);
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_snapshot_delete_failure(int vid)
{
    trigger([this, vid] {
        auto vm = vmpool->get(vid);

        if ( vm == nullptr )
        {
            return;
        }

        if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG_SNAPSHOT )
        {
            vm->clear_active_snapshot();

            vm->set_state(VirtualMachine::RUNNING);

            vmpool->update(vm.get());
        }
        else
        {
            vm->log("LCM",Log::ERROR,"snapshot_delete_failure, VM in a wrong state");
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_attach_nic_success(int vid)
{
    trigger([this, vid] {
        auto vm = vmpool->get(vid);

        if ( vm == nullptr )
        {
            return;
        }

        if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG_NIC )
        {
            vm->clear_attach_nic();

            vm->set_state(VirtualMachine::RUNNING);

            vmpool->update(vm.get());
            vmpool->update_search(vm.get());
        }
        else if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG_NIC_POWEROFF )
        {
            vm->clear_attach_nic();

            vmpool->update(vm.get());
            vmpool->update_search(vm.get());

            dm->trigger_poweroff_success(vid);
        }
        else
        {
            vm->log("LCM",Log::ERROR,"attach_nic_success_action, VM in a wrong state");
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_attach_nic_failure(int vid)
{
    trigger([this, vid] {
        auto vm = vmpool->get(vid);

        if ( vm == nullptr )
        {
            return;
        }

        if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG_NIC )
        {
            vmpool->delete_attach_nic(std::move(vm));

            vm = vmpool->get(vid);

            if ( vm == nullptr )
            {
                return;
            }

            vm->set_state(VirtualMachine::RUNNING);

            vmpool->update(vm.get());
        }
        else if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG_NIC_POWEROFF )
        {
            vmpool->delete_attach_nic(std::move(vm));

            dm->trigger_poweroff_success(vid);
        }
        else
        {
            vm->log("LCM",Log::ERROR,"attach_nic_failure_action, VM in a wrong state");
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_detach_nic_success(int vid)
{
    trigger([this, vid] {
        auto vm = vmpool->get(vid);

        if ( vm == nullptr )
        {
            return;
        }

        if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG_NIC )
        {
            vmpool->delete_attach_nic(std::move(vm));

            vm = vmpool->get(vid);

            if ( vm == nullptr )
            {
                return;
            }

            vm->set_state(VirtualMachine::RUNNING);

            vmpool->update(vm.get());
            vmpool->update_search(vm.get());
        }
        else if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG_NIC_POWEROFF )
        {
            vmpool->delete_attach_nic(std::move(vm));

            vm = vmpool->get(vid);

            if ( vm == nullptr )
            {
                return;
            }

            vmpool->update(vm.get());
            vmpool->update_search(vm.get());

            dm->trigger_poweroff_success(vid);
        }
        else
        {
            vm->log("LCM",Log::ERROR,"detach_nic_success_action, VM in a wrong state");
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_detach_nic_failure(int vid)
{
    trigger([this, vid] {
        auto vm = vmpool->get(vid);

        if ( vm == nullptr )
        {
            return;
        }

        if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG_NIC )
        {
            vm->clear_attach_nic();

            vm->set_state(VirtualMachine::RUNNING);

            vmpool->update(vm.get());
        }
        else if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG_NIC_POWEROFF )
        {
            vm->clear_attach_nic();

            vmpool->update(vm.get());

            dm->trigger_poweroff_success(vid);
        }
        else
        {
            vm->log("LCM",Log::ERROR,"detach_nic_failure_action, VM in a wrong state");
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_saveas_success(int vid)
{
    trigger([this, vid] {
        int image_id;
        int disk_id;
        int rc;
        string tm_mad;
        string snap;
        string ds_id;
        string src;

        if ( auto vm = vmpool->get(vid) )
        {
            rc = vm->get_saveas_disk(disk_id, src, image_id, snap, tm_mad, ds_id);

            vm->clear_saveas_disk();

            if (vm->clear_saveas_state() == -1)
            {
                vm->log("LCM",Log::ERROR, "saveas_success_action, VM in a wrong state");

                vmpool->update(vm.get());

                return;
            }

            vmpool->update(vm.get());
        }
        else
        {
            return;
        }

        if (rc != 0)
        {
            return;
        }

        if ( auto image = ipool->get(image_id) )
        {
            image->clear_saving();

            image->set_state_unlock();

            ipool->update(image.get());
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_saveas_failure(int vid)
{
    trigger([this, vid] {
        int image_id;
        int disk_id;
        int rc;
        string tm_mad;
        string snap;
        string ds_id;
        string src;

        if ( auto vm = vmpool->get(vid) )
        {
            rc = vm->get_saveas_disk(disk_id, src, image_id, snap, tm_mad, ds_id);

            vm->clear_saveas_disk();

            if (vm->clear_saveas_state() == -1)
            {
                vm->log("LCM",Log::ERROR, "saveas_failure_action, VM in a wrong state");

                vmpool->update(vm.get());

                return;
            }

            vmpool->update(vm.get());
        }
        else
        {
            return;
        }

        if (rc != 0)
        {
            return;
        }

        if ( auto image = ipool->get(image_id) )
        {
            image->clear_saving();

            image->set_state(Image::ERROR);

            ipool->update(image.get());
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_disk_snapshot_success(int vid)
{
    trigger([this, vid] {
        string tm_mad;
        int disk_id, ds_id, snap_id;
        int img_id = -1;

        Template *ds_quotas = nullptr;
        Template *vm_quotas = nullptr;

        bool img_owner, vm_owner;

        const VirtualMachineDisk * disk;
        Snapshots           snaps(-1, Snapshots::DENY);
        const Snapshots*    tmp_snaps;
        string              error_str;

        VirtualMachine::LcmState state;

        int vm_uid;
        int vm_gid;

        bool   is_persistent;
        string target;

        if ( auto vm = vmpool->get(vid) )
        {
            if (vm->get_snapshot_disk(ds_id, tm_mad, disk_id, snap_id) == -1)
            {
                vm->log("LCM", Log::ERROR, "Snapshot DISK could not be found");

                return;
            }

            vm_uid = vm->get_uid();
            vm_gid = vm->get_gid();

            state = vm->get_lcm_state();

            switch (state)
            {
                case VirtualMachine::DISK_SNAPSHOT:
                    vm->set_state(VirtualMachine::RUNNING);
                    [[fallthrough]];
                case VirtualMachine::DISK_SNAPSHOT_POWEROFF:
                case VirtualMachine::DISK_SNAPSHOT_SUSPENDED:
                    vm->log("LCM", Log::INFO, "VM disk snapshot operation completed.");
                    vm->revert_disk_snapshot(disk_id, snap_id, false);
                    break;

                case VirtualMachine::DISK_SNAPSHOT_REVERT_POWEROFF:
                    vm->log("LCM", Log::INFO, "VM disk snapshot operation completed.");
                    vm->revert_disk_snapshot(disk_id, snap_id, true);
                    break;

                case VirtualMachine::DISK_SNAPSHOT_DELETE:
                    vm->set_state(VirtualMachine::RUNNING);
                    [[fallthrough]];
                case VirtualMachine::DISK_SNAPSHOT_DELETE_POWEROFF:
                case VirtualMachine::DISK_SNAPSHOT_DELETE_SUSPENDED:
                    vm->log("LCM", Log::INFO, "VM disk snapshot deleted.");
                    vm->delete_disk_snapshot(disk_id, snap_id, &ds_quotas, &vm_quotas,
                            img_owner, vm_owner);
                    break;

                default:
                    vm->log("LCM",Log::ERROR,"disk_snapshot_success, VM in a wrong state");
                    return;
            }

            vm->clear_snapshot_disk();

            tmp_snaps = vm->get_disk_snapshots(disk_id, error_str);
            if (tmp_snaps != nullptr)
            {
                snaps = *tmp_snaps;
            }

            disk = vm->get_disk(disk_id);

            disk->vector_value("IMAGE_ID", img_id);

            is_persistent = disk->is_persistent();
            target        = disk->get_tm_target();

            vmpool->update(vm.get());
        }
        else
        {
            return;
        }

        if ( ds_quotas != nullptr )
        {
            if ( img_owner )
            {
                if (auto img = ipool->get_ro(img_id))
                {
                    int img_uid = img->get_uid();
                    int img_gid = img->get_gid();

                    Quotas::ds_del(img_uid, img_gid, ds_quotas);
                }
            }

            if ( vm_owner )
            {
                Quotas::ds_del(vm_uid, vm_gid, ds_quotas);
            }

            delete ds_quotas;
        }

        if ( vm_quotas != nullptr )
        {
            Quotas::vm_del(vm_uid, vm_gid, vm_quotas);

            delete vm_quotas;
        }

        // Update image if it is persistent and ln mode does not clone it
        if ( img_id != -1 && is_persistent && target == "NONE" )
        {
            imagem->set_image_snapshots(img_id, snaps);
        }

        switch (state)
        {
            case VirtualMachine::DISK_SNAPSHOT_POWEROFF:
            case VirtualMachine::DISK_SNAPSHOT_REVERT_POWEROFF:
            case VirtualMachine::DISK_SNAPSHOT_DELETE_POWEROFF:
                dm->trigger_poweroff_success(vid);
                break;

            case VirtualMachine::DISK_SNAPSHOT_SUSPENDED:
            case VirtualMachine::DISK_SNAPSHOT_DELETE_SUSPENDED:
                dm->trigger_suspend_success(vid);
                break;

            default:
                return;
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_disk_snapshot_failure(int vid)
{
    trigger([this, vid] {
        string tm_mad;
        int disk_id, ds_id, snap_id;
        int img_id = -1;

        Template *ds_quotas = nullptr;
        Template *vm_quotas = nullptr;

        const VirtualMachineDisk* disk;
        Snapshots           snaps(-1, Snapshots::DENY);
        const Snapshots*    tmp_snaps;
        string              error_str;

        bool img_owner, vm_owner;

        VirtualMachine::LcmState state;

        int vm_uid;
        int vm_gid;

        bool is_persistent;
        string target;

        if ( auto vm = vmpool->get(vid) )
        {
            if (vm->get_snapshot_disk(ds_id, tm_mad, disk_id, snap_id) == -1)
            {
                vm->log("LCM", Log::ERROR, "Snapshot DISK could not be found");

                return;
            }

            vm_uid = vm->get_uid();
            vm_gid = vm->get_gid();

            state = vm->get_lcm_state();

            switch (state)
            {
                case VirtualMachine::DISK_SNAPSHOT:
                    vm->set_state(VirtualMachine::RUNNING);
                    [[fallthrough]];
                case VirtualMachine::DISK_SNAPSHOT_POWEROFF:
                case VirtualMachine::DISK_SNAPSHOT_SUSPENDED:
                    vm->log("LCM", Log::ERROR, "Could not take disk snapshot.");
                    vm->delete_disk_snapshot(disk_id, snap_id, &ds_quotas, &vm_quotas,
                            img_owner, vm_owner);
                    break;

                case VirtualMachine::DISK_SNAPSHOT_DELETE:
                    vm->set_state(VirtualMachine::RUNNING);
                    [[fallthrough]];
                case VirtualMachine::DISK_SNAPSHOT_DELETE_POWEROFF:
                case VirtualMachine::DISK_SNAPSHOT_REVERT_POWEROFF:
                case VirtualMachine::DISK_SNAPSHOT_DELETE_SUSPENDED:
                    vm->log("LCM", Log::ERROR, "VM disk snapshot operation failed.");
                    break;

                default:
                    vm->log("LCM",Log::ERROR,"disk_snapshot_failure, VM in a wrong state");
                    return;
            }

            vm->clear_snapshot_disk();

            tmp_snaps = vm->get_disk_snapshots(disk_id, error_str);
            if (tmp_snaps != nullptr)
            {
                snaps = *tmp_snaps;
            }

            disk = vm->get_disk(disk_id);

            disk->vector_value("IMAGE_ID", img_id);

            is_persistent = disk->is_persistent();
            target        = disk->get_tm_target();

            vmpool->update(vm.get());
        }
        else
        {
            return;
        }

        if ( ds_quotas != nullptr )
        {
            if ( img_owner )
            {
                if (auto img = ipool->get_ro(img_id))
                {
                    int img_uid = img->get_uid();
                    int img_gid = img->get_gid();

                    Quotas::ds_del(img_uid, img_gid, ds_quotas);
                }
            }

            if ( vm_owner)
            {
                Quotas::ds_del(vm_uid, vm_gid, ds_quotas);
            }

            delete ds_quotas;
        }

        if ( vm_quotas != nullptr )
        {
            Quotas::vm_del(vm_uid, vm_gid, vm_quotas);

            delete vm_quotas;
        }

        // Update image if it is persistent and ln mode does not clone it
        if ( img_id != -1 && is_persistent && target != "SYSTEM" )
        {
            imagem->set_image_snapshots(img_id, snaps);
        }

        switch (state)
        {
            case VirtualMachine::DISK_SNAPSHOT_POWEROFF:
            case VirtualMachine::DISK_SNAPSHOT_REVERT_POWEROFF:
            case VirtualMachine::DISK_SNAPSHOT_DELETE_POWEROFF:
                dm->trigger_poweroff_success(vid);
                break;

            case VirtualMachine::DISK_SNAPSHOT_SUSPENDED:
            case VirtualMachine::DISK_SNAPSHOT_DELETE_SUSPENDED:
                dm->trigger_suspend_success(vid);
                break;

            default:
                return;
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_disk_lock_success(int vid)
{
    trigger([this, vid] {
        set<int> ids;

        auto vm = vmpool->get(vid);

        if (!vm)
        {
            return;
        }

        if ( vm->get_state() != VirtualMachine::CLONING &&
            vm->get_state() != VirtualMachine::CLONING_FAILURE )
        {
            return;
        }

        vm->get_cloning_image_ids(ids);

        vector<tuple<int, string, string>> ready;
        set<int> error;

        for (auto id : ids)
        {
            if (auto image = ipool->get(id))
            {
                switch (image->get_state()) {
                    case Image::USED:
                    case Image::USED_PERS:
                        ready.push_back(make_tuple(id, image->get_source(), image->get_format()));
                        break;

                    case Image::ERROR:
                        error.insert(id);
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
            }
        }


        for (const auto& rit : ready)
        {
            vm->clear_cloning_image_id(get<0>(rit), get<1>(rit), get<2>(rit));
        }

        if (ids.size() == ready.size())
        {
            bool on_hold = false;

            vm->get_template_attribute("SUBMIT_ON_HOLD", on_hold);

            if (on_hold)
            {
                vm->set_state(VirtualMachine::HOLD);
            }
            else
            {
                // Automatic requirements are not recalculated on purpose

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

        vmpool->update(vm.get());
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_disk_lock_failure(int vid)
{
    trigger_disk_lock_success(vid);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_disk_resize_success(int vid)
{
    trigger([this, vid] {
        int img_id = -1;
        long long size;

        bool is_persistent;
        string target;

        VirtualMachine::LcmState state;

        if ( auto vm = vmpool->get(vid) )
        {
            VirtualMachineDisk * disk = vm->get_resize_disk();

            if ( disk == nullptr )
            {
                return;
            }

            state = vm->get_lcm_state();

            switch (state)
            {
                case VirtualMachine::DISK_RESIZE:
                    vm->set_state(VirtualMachine::RUNNING);
                    [[fallthrough]];

                case VirtualMachine::DISK_RESIZE_POWEROFF:
                case VirtualMachine::DISK_RESIZE_UNDEPLOYED:
                    vm->log("LCM", Log::INFO, "VM disk resize operation completed.");

                    break;

                default:
                    vm->log("LCM",Log::ERROR,"disk_resize_success, VM in a wrong state");
                    return;
            }

            disk->clear_resize(false);

            is_persistent = disk->is_persistent();
            target        = disk->get_tm_target();

            disk->vector_value("IMAGE_ID", img_id);
            disk->vector_value("SIZE", size);

            vmpool->update(vm.get());
        }
        else
        {
            return;
        }

        // Update image if it is persistent and ln mode does not clone it
        if ( img_id != -1 && is_persistent && target == "NONE" )
        {
            imagem->set_image_size(img_id, size);
        }

        switch (state)
        {
            case VirtualMachine::DISK_RESIZE_POWEROFF:
                dm->trigger_poweroff_success(vid);
                break;

            case VirtualMachine::DISK_RESIZE_UNDEPLOYED:
                dm->trigger_undeploy_success(vid);
                break;

            default:
                return;
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_disk_resize_failure(int vid)
{
    trigger([this, vid] {
        Template ds_deltas;
        Template vm_deltas;

        int img_id = -1;
        long long size_prev;

        VirtualMachine::LcmState state;

        int vm_uid;
        int vm_gid;

        bool img_quota, vm_quota;

        if ( auto vm = vmpool->get(vid) )
        {
            VirtualMachineDisk * disk = vm->get_resize_disk();

            state = vm->get_lcm_state();

            switch (state)
            {
                case VirtualMachine::DISK_RESIZE:
                    vm->set_state(VirtualMachine::RUNNING);
                    [[fallthrough]];
                case VirtualMachine::DISK_RESIZE_POWEROFF:
                case VirtualMachine::DISK_RESIZE_UNDEPLOYED:
                    vm->log("LCM", Log::INFO, "VM disk resize operation completed.");

                    break;

                default:
                    vm->log("LCM",Log::ERROR,"disk_resize_success, VM in a wrong state");
                    return;
            }

            vm_uid = vm->get_uid();
            vm_gid = vm->get_gid();

            disk->vector_value("IMAGE_ID", img_id);
            disk->vector_value("SIZE_PREV", size_prev);
            disk->resize_quotas(size_prev, ds_deltas, vm_deltas, img_quota, vm_quota);

            disk->clear_resize(true);

            vmpool->update(vm.get());
        }
        else
        {
            return;
        }

        // Restore quotas
        if ( img_quota && img_id != -1 )
        {
            if (auto img = ipool->get_ro(img_id))
            {
                int img_uid = img->get_uid();
                int img_gid = img->get_gid();

                Quotas::ds_del(img_uid, img_gid, &ds_deltas);
            }
        }

        if ( vm_quota )
        {
            Quotas::ds_del(vm_uid, vm_gid, &ds_deltas);
        }

        if ( !vm_deltas.empty() )
        {
            Quotas::vm_del(vm_uid, vm_gid, &vm_deltas);
        }

        switch (state)
        {
            case VirtualMachine::DISK_RESIZE_POWEROFF:
                dm->trigger_poweroff_success(vid);
                break;

            case VirtualMachine::DISK_RESIZE_UNDEPLOYED:
                dm->trigger_undeploy_success(vid);
                break;

            default:
                return;
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_update_conf_success(int vid)
{
    trigger([this, vid] {
        auto vm = vmpool->get(vid);

        if ( vm == nullptr )
        {
            return;
        }

        if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG )
        {
            vm->set_state(VirtualMachine::RUNNING);

            vmpool->update(vm.get());
        }
        else
        {
            vm->log("LCM",Log::ERROR,"update_conf_success, VM in a wrong state");
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_update_conf_failure(int vid)
{
    trigger([this, vid] {
        auto vm = vmpool->get(vid);

        if ( vm == nullptr )
        {
            return;
        }

        if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG )
        {
            vm->set_state(VirtualMachine::RUNNING);

            vmpool->update(vm.get());
        }
        else
        {
            vm->log("LCM",Log::ERROR,"update_conf_failure, VM in a wrong state");
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_resize_success(int vid)
{
    trigger([this, vid] {
        if ( auto vm = vmpool->get(vid) )
        {
            VirtualMachine::LcmState state = vm->get_lcm_state();

            if (state == VirtualMachine::HOTPLUG_RESIZE)
            {
                vm->set_state(VirtualMachine::RUNNING);
                vm->log("LCM", Log::INFO, "VM resize operation completed.");
            }
            else
            {
                vm->log("LCM", Log::ERROR, "hotplug_resize_success, VM in a wrong state");
                return;
            }

            vm->reset_resize();

            vmpool->update(vm.get());
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_resize_failure(int vid)
{
    trigger([this, vid] {
        Template deltas;
        int vm_uid, vm_gid;

        if ( auto vm = vmpool->get(vid) )
        {
            HostShareCapacity sr, sr_orig;

            VirtualMachine::LcmState lcm_state = vm->get_lcm_state();

            if (lcm_state == VirtualMachine::HOTPLUG_RESIZE)
            {
                vm->set_state(VirtualMachine::RUNNING);
                vm->log("LCM", Log::INFO,
                        "VM hotplug resize operation fails");
            }
            else
            {
                vm->log("LCM", Log::ERROR,
                        "hotplug resize fails, VM in a wrong state");
                return;
            }

            vm->get_capacity(sr);

            auto vattr = vm->get_template_attribute("RESIZE");

            if (vattr)
            {
                vm_uid = vm->get_uid();
                vm_gid = vm->get_gid();

                string error;
                float ocpu, ncpu;
                long omem, nmem;
                unsigned int ovcpu, nvcpu;

                vm->get_template_attribute("MEMORY", nmem);
                vm->get_template_attribute("CPU", ncpu);
                vm->get_template_attribute("VCPU", nvcpu);

                vattr->vector_value("CPU", ocpu);
                vattr->vector_value("VCPU", ovcpu);
                vattr->vector_value("MEMORY", omem);

                deltas.add("MEMORY", nmem - omem);
                deltas.add("CPU", ncpu - ocpu);
                deltas.add("VMS", 0);

                auto state = vm->get_state();

                if (state == VirtualMachine::PENDING || state == VirtualMachine::HOLD ||
                    (state == VirtualMachine::ACTIVE &&
                        vm->get_lcm_state() == VirtualMachine::RUNNING))
                {
                    deltas.add("RUNNING_MEMORY", nmem - omem);
                    deltas.add("RUNNING_CPU", ncpu - ocpu);
                }

                vm->resize(ocpu, omem, ovcpu, error);
            }
            else
            {
                NebulaLog::error("LCM",
                    "HOTPLUG_RESIZE failure, unable to revert VM and quotas");
            }

            vm->get_capacity(sr_orig);

            vm->reset_resize();

            vmpool->update(vm.get());

            // Revert host capacity
            if (auto host = hpool->get(vm->get_hid()))
            {
                host->del_capacity(sr);

                host->add_capacity(sr_orig);

                hpool->update(host.get());
            }
        }
        else
        {
            return;
        }

        // Quota rollback
        Quotas::quota_del(Quotas::VM, vm_uid, vm_gid, &deltas);
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static int create_backup_image(VirtualMachine * vm, string& msg)
{
    Nebula& nd = Nebula::instance();

    auto ipool  = nd.get_ipool();
    auto dspool = nd.get_dspool();

    int i_id;
    string error_str;

    auto& backups = vm->backups();

    /* ------------------------------------------------------------------ */
    /* Get datastore backup information                                   */
    /* ------------------------------------------------------------------ */
    string ds_name, ds_mad, ds_data;

    Datastore::DatastoreType ds_type;
    Image::DiskType          ds_dtype;

    int ds_id = backups.last_datastore_id();

    if (auto ds = dspool->get_ro(ds_id))
    {
        ds_name  = ds->get_name();
        ds_dtype = ds->get_disk_type();
        ds_type  = ds->get_type();
        ds_mad   = ds->get_ds_mad();

        ds->to_xml(ds_data);
    }
    else
    {
        msg = "backup datastore does not exist";

        return -1;
    }

    /* ------------------------------------------------------------------ */
    /* Create Image for the backup snapshot                               */
    /* ------------------------------------------------------------------ */
    time_t the_time;
    char   tbuffer[80];

    struct tm * tinfo;
    ostringstream oss;

    time(&the_time);
    tinfo = localtime(&the_time);

    strftime(tbuffer, 80, "%d-%b %H.%M.%S", tinfo); //18-Jun 08.30.15

    oss << vm->get_oid() << " " << tbuffer;

    auto itmp = make_unique<ImageTemplate>();

    itmp->add("NAME",   oss.str());
    itmp->add("SOURCE", backups.last_backup_id());
    itmp->add("SIZE",   backups.last_backup_size());
    itmp->add("FORMAT", "raw");
    itmp->add("VM_ID",  vm->get_oid());
    itmp->add("TYPE",   Image::type_to_str(Image::BACKUP));

    if (backups.backup_job_id() != -1)
    {
        itmp->add("BACKUP_JOB_ID", backups.backup_job_id());
    }

    int rc = ipool->allocate(vm->get_uid(),
                             vm->get_gid(),
                             vm->get_uname(),
                             vm->get_gname(),
                             0177,
                             move(itmp),
                             ds_id,
                             ds_name,
                             ds_dtype,
                             ds_data,
                             ds_type,
                             ds_mad,
                             "-",
                             "",
                             -1,
                             &i_id,
                             error_str);
    if ( rc < 0 )
    {
        msg = "backup image allocate error: " + error_str;

        return -1;
    }

    return i_id;
}

/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_backup_success(int vid)
{
    trigger([this, vid] {
        auto vm = vmpool->get(vid);

        if ( vm == nullptr )
        {
            return;
        }

        /* ------------------------------------------------------------------ */
        /* State update and Quota values (worst case)                         */
        /* ------------------------------------------------------------------ */
        string error;

        Template  ds_deltas;

        int vm_uid = vm->get_uid();
        int vm_gid = vm->get_gid();

        auto& backups = vm->backups();

        int ds_id = backups.last_datastore_id();
        int bj_id = backups.backup_job_id();

        int incremental_id = backups.incremental_backup_id();
        int keep_last      = backups.keep_last();
        Backups::Mode mode = backups.mode();

        long long reserved_sz = vm->backup_size(ds_deltas);
        long long real_sz     = 0;

        one_util::str_cast(backups.last_backup_size(), real_sz);

        ds_deltas.add("DATASTORE", backups.last_datastore_id());

        if (mode == Backups::FULL || incremental_id == -1)
        {
            ds_deltas.add("IMAGES", 1);
        }
        else
        {
            ds_deltas.add("IMAGES", 0);
        }

        switch(vm->get_lcm_state())
        {
            case VirtualMachine::BACKUP:
                vm->set_state(VirtualMachine::RUNNING);
                break;

            case VirtualMachine::BACKUP_POWEROFF:
                vm->set_state(VirtualMachine::POWEROFF);
                vm->set_state(VirtualMachine::LCM_INIT);
                break;

            default:
                vm->log("LCM", Log::ERROR, "backup_success, VM in wrong state");
                vm.reset();

                Quotas::ds_del(vm_uid, vm_gid, &ds_deltas);
                return;
        }

        /* ------------------------------------------------------------------ */
        /* Create Backup image if needed                                      */
        /* ------------------------------------------------------------------ */
        int image_id   = -1;
        int increments = -1;

        std::set<int> delete_ids;

        if (mode == Backups::FULL || incremental_id == -1)
        {
            image_id = create_backup_image(vm.get(), error);

            if ( image_id == -1 )
            {
                goto error_image_create;
            }

            backups.add(image_id);

            backups.remove_last(delete_ids);
        }

        /* ------------------------------------------------------------------ */
        /* Update backup information for increments                           */
        /* ------------------------------------------------------------------ */

        if (mode == Backups::INCREMENT)
        {
            Increment::Type itype;

            if (incremental_id == -1)
            {
                backups.incremental_backup_id(image_id);
                itype = Increment::FULL;
            }
            else
            {
                image_id = backups.incremental_backup_id();
                itype = Increment::INCREMENT;
            }

            if (auto image = ipool->get(image_id))
            {
                int rc = image->add_increment(backups.last_backup_id(), real_sz, itype);

                if ( rc == -1)
                {
                    error = "cannot add increment to backup image";
                    goto error_increment_update;
                }

                backups.last_increment_id(image->last_increment_id());

                increments = image->increments().total();
                ds_id      = image->get_ds_id();

                ipool->update(image.get());
            }
            else
            {
                error = "backup image does not exists";
                goto error_increment_update;
            }
        }

        backups.last_backup_clear();

        if (delete_ids.size() > 0)
        {
            // FULL & backups > keep_last
            ostringstream oss;

            oss << "Removing backup snapshots:";

            for (int i : delete_ids)
            {
                oss << " " << i;
            }

            vm->log("LCM", Log::INFO, oss.str());
        }
        else if (keep_last > 0 && increments > keep_last)
        {
            // INCREMENTAL & increments > keep_last
            ostringstream oss;

            oss << "Removing " << increments - keep_last << " backup increments";

            vm->log("LCM", Log::INFO, oss.str());

            //Flag the flatten operation to prevent race coditions with backup
            backups.active_flatten(true);
        }

        vmpool->update(vm.get());

        vm.reset();

        /* ------------------------------------------------------------------ */
        /* Add image to the datastore and forget keep_last backups            */
        /* ------------------------------------------------------------------ */
        if (mode == Backups::FULL || incremental_id == -1)
        {
            if ( auto ds = dspool->get(ds_id) )
            {
                ds->add_image(image_id);

                dspool->update(ds.get());
            }

            for (int i : delete_ids)
            {
                if ( imagem->delete_image(i, error) != 0 )
                {
                    ostringstream oss;

                    oss << "backup_success, cannot remove VM backup " << i
                        << " : " << error;

                    NebulaLog::error("LCM", oss.str());
                }
            }
        }
        else if (mode == Backups::INCREMENT && keep_last > 0 && increments > keep_last)
        {
            ostringstream oss;

            oss << "<EXTRA_DATA>"
                << "<KEEP_LAST>" << keep_last << "</KEEP_LAST>"
                << "</EXTRA_DATA>";

            if ( imagem->flatten_increments(image_id, ds_id, oss.str(), error) != 0 )
            {
                oss.str("");

                oss << "backup_success, cannot flatten backup increments for image "
                    << image_id << " : " << error;

                NebulaLog::error("LCM", oss.str());
            }
        }

        /* ------------------------------------------------------------------ */
        /* Update quotas, count real size of the backup                       */
        /* ------------------------------------------------------------------ */
        ds_deltas.replace("SIZE", reserved_sz - real_sz);
        ds_deltas.replace("IMAGES", 0);

        Quotas::ds_del(vm_uid, vm_gid, &ds_deltas);

        /* ------------------------------------------------------------------ */
        /* Remove VM from Backup Job pending list                             */
        /* ------------------------------------------------------------------ */
        if (auto bj = bjpool->get(bj_id))
        {
            bj->backup_finished(vid, true);

            bjpool->update(bj.get());
        }

        return;

        error_increment_update:
            if (incremental_id == -1)
            {
                backups.incremental_backup_id(-1);
                backups.del(image_id);
            }

        error_image_create:
            vm->log("LCM", Log::ERROR, "backup_success, " + error);
            vmpool->update(vm.get());

            vm.reset();

            Quotas::ds_del(vm_uid, vm_gid, &ds_deltas);
            return;
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_backup_failure(int vid)
{
    trigger([this, vid] {
        int vm_uid{0}, vm_gid{0}, bj_id{-1};
        Template ds_deltas;

        if ( auto vm = vmpool->get(vid) )
        {
            switch(vm->get_lcm_state())
            {
                case VirtualMachine::BACKUP:
                    vm->set_state(VirtualMachine::RUNNING);
                    break;

                case VirtualMachine::BACKUP_POWEROFF:
                    vm->set_state(VirtualMachine::POWEROFF);
                    vm->set_state(VirtualMachine::LCM_INIT);
                    break;

                default:
                    vm->log("LCM", Log::ERROR, "backup_failure, VM in a wrong state");
                    break;
            }

            vm_uid = vm->get_uid();
            vm_gid = vm->get_gid();

            auto& backups = vm->backups();
            int incremental_id = backups.incremental_backup_id();
            Backups::Mode mode = backups.mode();
            bj_id = backups.backup_job_id();

            vm->backup_size(ds_deltas);
            ds_deltas.add("DATASTORE", vm->backups().last_datastore_id());

            if (mode == Backups::FULL || incremental_id == -1)
            {
                ds_deltas.add("IMAGES", 1);
            }

            backups.last_backup_clear();

            vmpool->update(vm.get());
        }

        // Quota rollback
        Quotas::ds_del(vm_uid, vm_gid, &ds_deltas);

        /* Remove VM from Backup Job pending list                             */
        /* ------------------------------------------------------------------ */
        if (auto bj = bjpool->get(bj_id))
        {
            bj->backup_finished(vid, false);

            // todo Add failure to BJ?
            bjpool->update(bj.get());
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
