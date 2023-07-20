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

#include "LifeCycleManager.h"
#include "TransferManager.h"
#include "DispatchManager.h"
#include "VirtualMachineManager.h"
#include "ClusterPool.h"
#include "HostPool.h"
#include "ImagePool.h"
#include "SecurityGroupPool.h"
#include "VirtualMachinePool.h"
#include "VirtualNetworkPool.h"
#include "Request.h"

using namespace std;

void LifeCycleManager::trigger_deploy(int vid)
{
    trigger([this, vid] {
        ostringstream       os;

        auto vm = vmpool->get(vid);

        if ( vm == nullptr )
        {
            return;
        }

        if ( vm->get_state() == VirtualMachine::ACTIVE )
        {
            HostShareCapacity sr;

            time_t thetime = time(0);
            int rc;

            VirtualMachine::LcmState vm_state;

            //----------------------------------------------------
            //                 PROLOG STATE
            //----------------------------------------------------

            vm->get_capacity(sr);

            vm_state  = VirtualMachine::PROLOG;

            void (TransferManager::*tm_action)(VirtualMachine *) =
                    &TransferManager::trigger_prolog;

            if (vm->hasPreviousHistory())
            {
                if (vm->get_previous_action() == VMActions::STOP_ACTION)
                {
                    vm_state  = VirtualMachine::PROLOG_RESUME;
                    tm_action = &TransferManager::trigger_prolog_resume;
                }
                else if (vm->get_previous_action() == VMActions::UNDEPLOY_ACTION ||
                        vm->get_previous_action() == VMActions::UNDEPLOY_HARD_ACTION)
                {
                    vm_state  = VirtualMachine::PROLOG_UNDEPLOY;
                    tm_action = &TransferManager::trigger_prolog_resume;
                }
            }

            vm->set_state(vm_state);

            rc = hpool->add_capacity(vm->get_hid(), sr);

            vm->set_stime(thetime);

            vm->set_prolog_stime(thetime);

            vmpool->update_history(vm.get());

            vmpool->update(vm.get());

            if ( rc == -1)
            {
                //The host has been deleted, move VM to FAILURE
                trigger_prolog_failure(vid);
            }
            else
            {
                (tm->*tm_action)(vm.get());
            }
        }
        else
        {
            vm->log("LCM", Log::ERROR, "deploy_action, VM in a wrong state.");
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_suspend(int vid, const RequestAttributes& ra)
{
    int uid = ra.uid;
    int gid = ra.gid;
    int req_id = ra.req_id;

    trigger([this, vid, uid, gid, req_id] {
        auto vm = vmpool->get(vid);

        if ( vm == nullptr )
        {
            return;
        }

        if (vm->get_state()     == VirtualMachine::ACTIVE &&
            vm->get_lcm_state() == VirtualMachine::RUNNING)
        {
            //----------------------------------------------------
            //                SAVE_SUSPEND STATE
            //----------------------------------------------------

            vm->set_state(VirtualMachine::SAVE_SUSPEND);

            vm->set_resched(false);

            vm->set_action(VMActions::SUSPEND_ACTION, uid, gid, req_id);

            vmpool->update_history(vm.get());

            vmpool->update(vm.get());

            //----------------------------------------------------

            vmm->trigger_save(vid);
        }
        else
        {
            vm->log("LCM", Log::ERROR, "suspend_action, VM in a wrong state.");
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_stop(int vid, const RequestAttributes& ra)
{
    int uid = ra.uid;
    int gid = ra.gid;
    int req_id = ra.req_id;

    trigger([this, vid, uid, gid, req_id] {
        auto vm = vmpool->get(vid);

        if ( vm == nullptr )
        {
            return;
        }

        if (vm->get_state()     == VirtualMachine::ACTIVE &&
            vm->get_lcm_state() == VirtualMachine::RUNNING)
        {
            //----------------------------------------------------
            //                SAVE_STOP STATE
            //----------------------------------------------------

            vm->set_state(VirtualMachine::SAVE_STOP);

            vm->set_resched(false);

            vm->set_action(VMActions::STOP_ACTION, uid, gid, req_id);

            vmpool->update_history(vm.get());

            vmpool->update(vm.get());

            //----------------------------------------------------

            vmm->trigger_save(vid);
        }
        else if (vm->get_state() == VirtualMachine::SUSPENDED)
        {
            //----------------------------------------------------
            //   Bypass SAVE_STOP
            //----------------------------------------------------
            vm->set_state(VirtualMachine::ACTIVE);
            vm->set_state(VirtualMachine::EPILOG_STOP);

            vm->set_action(VMActions::STOP_ACTION, uid, gid, req_id);

            vm->set_epilog_stime(time(0));

            vmpool->update_history(vm.get());

            vmpool->update(vm.get());

            //----------------------------------------------------

            tm->trigger_epilog_stop(vm.get());
        }
        else
        {
            vm->log("LCM", Log::ERROR, "stop_action, VM in a wrong state.");
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_migrate(int vid, const RequestAttributes& ra,
                                       VMActions::Action vm_action)
{
    int uid = ra.uid;
    int gid = ra.gid;
    int req_id = ra.req_id;

    trigger([this, vid, uid, gid, req_id, vm_action] {
        HostShareCapacity sr;
        Template quota_tmpl;

        time_t the_time = time(0);

        auto vm = vmpool->get(vid);

        if ( vm == nullptr )
        {
            return;
        }

        if (vm->get_state()     == VirtualMachine::ACTIVE &&
            vm->get_lcm_state() == VirtualMachine::RUNNING)
        {
            //----------------------------------------------------
            //                SAVE_MIGRATE STATE
            //----------------------------------------------------

            vm->set_state(VirtualMachine::SAVE_MIGRATE);

            vm->set_resched(false);

            vm->get_capacity(sr);

            hpool->add_capacity(vm->get_hid(), sr);

            vm->set_stime(the_time);

            vm->set_action(vm_action, uid, gid, req_id);

            vmpool->update_history(vm.get());

            vm->set_previous_action(vm_action, uid, gid, req_id);

            vmpool->update_previous_history(vm.get());

            vmpool->update(vm.get());

            //----------------------------------------------------

            switch (vm_action)
            {
                case VMActions::POFF_MIGRATE_ACTION:
                    vmm->trigger_shutdown(vid);
                    break;
                case VMActions::POFF_HARD_MIGRATE_ACTION:
                    vmm->trigger_cancel(vid);
                    break;
                default:
                    vmm->trigger_save(vid);
                    break;
            }
        }
        else if (vm->get_state() == VirtualMachine::POWEROFF ||
                vm->get_state() == VirtualMachine::SUSPENDED ||
                (vm->get_state() == VirtualMachine::ACTIVE &&
                vm->get_lcm_state() == VirtualMachine::UNKNOWN ))
        {
            //----------------------------------------------------------------------
            // Bypass SAVE_MIGRATE & go to PROLOG_MIGRATE_POWEROFF/SUSPENDED/UNKNOWN
            //----------------------------------------------------------------------
            if (vm->get_state() == VirtualMachine::POWEROFF)
            {
                vm->set_state(VirtualMachine::PROLOG_MIGRATE_POWEROFF);
            }
            else if (vm->get_state() == VirtualMachine::SUSPENDED)
            {
                vm->set_state(VirtualMachine::PROLOG_MIGRATE_SUSPEND);
            }
            else //VirtualMachine::UNKNOWN
            {
                vm->set_state(VirtualMachine::PROLOG_MIGRATE_UNKNOWN);

                vm->set_previous_action(VMActions::MIGRATE_ACTION, uid,
                        gid, req_id);
            }

            vm->set_previous_running_etime(the_time);

            vm->set_previous_etime(the_time);

            vmpool->update_previous_history(vm.get());

            vm->set_state(VirtualMachine::ACTIVE);

            vm->set_resched(false);

            if ( !vmm->is_keep_snapshots(vm->get_vmm_mad()) )
            {
                vm->delete_snapshots(quota_tmpl);
            }

            vm->set_action(VMActions::MIGRATE_ACTION, uid, gid, req_id);

            vm->get_capacity(sr);

            hpool->add_capacity(vm->get_hid(), sr);

            if ( vm->get_hid() != vm->get_previous_hid() )
            {
                hpool->del_capacity(vm->get_previous_hid(), sr);

                vm->release_previous_vnc_port();
            }

            vm->set_stime(the_time);

            vm->set_prolog_stime(the_time);

            vmpool->update_history(vm.get());

            vmpool->update(vm.get());

            //----------------------------------------------------

            tm->trigger_prolog_migr(vm.get());
        }
        else
        {
            vm->log("LCM", Log::ERROR, "migrate_action, VM in a wrong state.");
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

void LifeCycleManager::trigger_live_migrate(int vid, const RequestAttributes& ra)
{
    int uid = ra.uid;
    int gid = ra.gid;
    int req_id = ra.req_id;

    trigger([this, vid, uid, gid, req_id] {
        ostringstream os;

        auto vm = vmpool->get(vid);

        if ( vm == nullptr )
        {
            return;
        }

        if (vm->get_state()     == VirtualMachine::ACTIVE &&
            vm->get_lcm_state() == VirtualMachine::RUNNING)
        {
            HostShareCapacity sr;

            //----------------------------------------------------
            //                   MIGRATE STATE
            //----------------------------------------------------

            vm->set_state(VirtualMachine::MIGRATE);

            vm->set_resched(false);

            vm->get_capacity(sr);

            hpool->add_capacity(vm->get_hid(), sr);

            vm->set_stime(time(0));

            vmpool->update_history(vm.get());

            vm->set_previous_action(VMActions::LIVE_MIGRATE_ACTION, uid, gid,
                        req_id);

            vmpool->update_previous_history(vm.get());

            vmpool->update(vm.get());

            //----------------------------------------------------

            vmm->trigger_migrate(vid);
        }
        else
        {
            vm->log("LCM", Log::ERROR, "live_migrate_action, VM in a wrong state.");
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_shutdown(int vid, bool hard,
                                        const RequestAttributes& ra)
{
    int uid = ra.uid;
    int gid = ra.gid;
    int req_id = ra.req_id;

    trigger([this, hard, vid, uid, gid, req_id] {
        auto vm = vmpool->get(vid);
        VirtualMachineTemplate quota_tmpl;
        string error;

        if ( vm == nullptr )
        {
            return;
        }

        int uid = vm->get_uid();
        int gid = vm->get_gid();

        std::string memory, cpu;

        vm->get_template_attribute("MEMORY", memory);
        vm->get_template_attribute("CPU", cpu);

        if ((vm->get_state() == VirtualMachine::SUSPENDED) ||
            (vm->get_state() == VirtualMachine::POWEROFF) ||
            (vm->get_state() == VirtualMachine::STOPPED) ||
            (vm->get_state() == VirtualMachine::UNDEPLOYED))
        {
            quota_tmpl.add("RUNNING_MEMORY", memory);
            quota_tmpl.add("RUNNING_CPU", cpu);
            quota_tmpl.add("RUNNING_VMS", 1);

            quota_tmpl.add("MEMORY", 0);
            quota_tmpl.add("CPU", 0);
            quota_tmpl.add("VMS", 0);
        }

        auto lcm_state = vm->get_lcm_state();

        if (hard && (vm->get_state() == VirtualMachine::ACTIVE &&
                     lcm_state == VirtualMachine::SHUTDOWN))
        {
            // Cancel previous shutdown action
            vmm->trigger_driver_cancel(vid);

            lcm_state = VirtualMachine::RUNNING; // Force execute of hard shutdown
        }

        if (vm->get_state() == VirtualMachine::ACTIVE &&
            (lcm_state == VirtualMachine::RUNNING ||
             lcm_state == VirtualMachine::UNKNOWN))
        {
            //----------------------------------------------------
            //                  SHUTDOWN STATE
            //----------------------------------------------------

            vm->set_state(VirtualMachine::SHUTDOWN);

            if (hard)
            {
                vm->set_action(VMActions::TERMINATE_HARD_ACTION, uid, gid,
                        req_id);

                vmm->trigger_cancel(vid);
            }
            else
            {
                vm->set_action(VMActions::TERMINATE_ACTION, uid, gid,
                        req_id);

                vmm->trigger_shutdown(vid);
            }

            vm->set_resched(false);

            vmpool->update_history(vm.get());

            vmpool->update(vm.get());
        }
        else if (vm->get_state() == VirtualMachine::SUSPENDED ||
                vm->get_state() == VirtualMachine::POWEROFF)
        {
            vm->set_state(VirtualMachine::ACTIVE);
            vm->set_state(VirtualMachine::EPILOG);

            Quotas::vm_check(uid, gid, &quota_tmpl, error);

            vm->set_action(VMActions::TERMINATE_ACTION, uid, gid, req_id);

            vm->set_epilog_stime(time(0));

            vmpool->update_history(vm.get());

            vmpool->update(vm.get());

            //----------------------------------------------------

            tm->trigger_epilog(false, vm.get());
        }
        else if (vm->get_state() == VirtualMachine::STOPPED ||
                vm->get_state() == VirtualMachine::UNDEPLOYED)
        {
            vm->set_state(VirtualMachine::ACTIVE);
            vm->set_state(VirtualMachine::EPILOG);

            Quotas::vm_check(uid, gid, &quota_tmpl, error);

            vm->set_action(VMActions::TERMINATE_ACTION, uid, gid, req_id);

            vm->set_epilog_stime(time(0));

            vmpool->update_history(vm.get());

            vmpool->update(vm.get());

            //----------------------------------------------------

            tm->trigger_epilog(true, vm.get());
        }
        else
        {
            vm->log("LCM", Log::ERROR, "shutdown_action, VM in a wrong state.");
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_undeploy(int vid, bool hard,
                                        const RequestAttributes& ra)
{
    int uid = ra.uid;
    int gid = ra.gid;
    int req_id = ra.req_id;

    trigger([this, hard, vid, uid, gid, req_id] {
        auto vm = vmpool->get(vid);

        if ( vm == nullptr )
        {
            return;
        }

        auto lcm_state = vm->get_lcm_state();

        if (hard && (vm->get_state() == VirtualMachine::ACTIVE &&
                     lcm_state == VirtualMachine::SHUTDOWN_UNDEPLOY))
        {
            // Cancel previous undeploy action
            vmm->trigger_driver_cancel(vid);

            lcm_state = VirtualMachine::RUNNING; // Force execute of hard shutdown
        }

        if (vm->get_state() == VirtualMachine::ACTIVE &&
            (lcm_state == VirtualMachine::RUNNING ||
             lcm_state == VirtualMachine::UNKNOWN))
        {
            //----------------------------------------------------
            //             SHUTDOWN_UNDEPLOY STATE
            //----------------------------------------------------

            vm->set_state(VirtualMachine::SHUTDOWN_UNDEPLOY);

            vm->set_resched(false);

            if (hard)
            {
                vm->set_action(VMActions::UNDEPLOY_HARD_ACTION, uid, gid,
                        req_id);

                vmm->trigger_cancel(vid);
            }
            else
            {
                vm->set_action(VMActions::UNDEPLOY_ACTION, uid, gid,
                        req_id);

                vmm->trigger_shutdown(vid);
            }

            vmpool->update_history(vm.get());

            vmpool->update(vm.get());
        }
        else if (vm->get_state() == VirtualMachine::POWEROFF)
        {
            //----------------------------------------------------
            //   Bypass SHUTDOWN_UNDEPLOY
            //----------------------------------------------------

            vm->set_state(VirtualMachine::ACTIVE);
            vm->set_state(VirtualMachine::EPILOG_UNDEPLOY);

            vm->set_action(VMActions::UNDEPLOY_ACTION, uid, gid, req_id);

            vm->set_epilog_stime(time(0));

            vmpool->update_history(vm.get());

            vmpool->update(vm.get());

            //----------------------------------------------------

            tm->trigger_epilog_stop(vm.get());
        }
        else
        {
            vm->log("LCM", Log::ERROR, "undeploy_action, VM in a wrong state.");
        }
    });
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_poweroff(int vid, const RequestAttributes& ra)
{
    trigger_poweroff(vid, false, ra);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_poweroff_hard(int vid, const RequestAttributes& ra)
{
    trigger_poweroff(vid, true, ra);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_poweroff(int vid, bool hard,
                                        const RequestAttributes& ra)
{
    int uid = ra.uid;
    int gid = ra.gid;
    int req_id = ra.req_id;

    trigger([this, hard, vid, uid, gid, req_id] {
        auto vm = vmpool->get(vid);

        if ( vm == nullptr )
        {
            return;
        }

        auto lcm_state = vm->get_lcm_state();

        if (hard && (vm->get_state() == VirtualMachine::ACTIVE &&
                     lcm_state == VirtualMachine::SHUTDOWN_POWEROFF))
        {
            // Cancel previous shutdown action
            vmm->trigger_driver_cancel(vid);

            lcm_state = VirtualMachine::RUNNING; // Force execute of hard shutdown
        }

        if (vm->get_state() == VirtualMachine::ACTIVE &&
            (lcm_state == VirtualMachine::RUNNING ||
             lcm_state == VirtualMachine::UNKNOWN))
        {
            //----------------------------------------------------
            //             SHUTDOWN_POWEROFF STATE
            //----------------------------------------------------

            vm->set_state(VirtualMachine::SHUTDOWN_POWEROFF);

            vm->set_resched(false);

            if (hard)
            {
                vm->set_action(VMActions::POWEROFF_HARD_ACTION, uid, gid,
                        req_id);

                vmm->trigger_cancel(vid);
            }
            else
            {
                vm->set_action(VMActions::POWEROFF_ACTION, uid, gid, req_id);

                vmm->trigger_shutdown(vid);
            }

            vmpool->update_history(vm.get());

            vmpool->update(vm.get());
        }
        else
        {
            vm->log("LCM", Log::ERROR, "poweroff_action, VM in a wrong state.");
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_restore(int vid, const RequestAttributes& ra)
{
    int uid = ra.uid;
    int gid = ra.gid;
    int req_id = ra.req_id;

    trigger([this, vid, uid, gid, req_id] {
        ostringstream os;

        auto vm = vmpool->get(vid);

        if ( vm == nullptr )
        {
            return;
        }

        if (vm->get_state() == VirtualMachine::SUSPENDED)
        {
            time_t the_time = time(0);

            vm->log("LCM", Log::INFO, "Restoring VM");

            //----------------------------------------------------
            //            BOOT STATE (FROM SUSPEND)
            //----------------------------------------------------
            vm->set_state(VirtualMachine::ACTIVE);

            vm->set_state(VirtualMachine::BOOT_SUSPENDED);

            vm->set_etime(the_time);

            vmpool->update_history(vm.get());

            vm->cp_history();

            vm->set_stime(the_time);

            vm->set_running_stime(the_time);

            vm->set_action(VMActions::RESUME_ACTION, uid, gid, req_id);

            vmpool->insert_history(vm.get());

            vmpool->update(vm.get());

            //----------------------------------------------------

            vmm->trigger_restore(vid);
        }
        else
        {
            vm->log("LCM", Log::ERROR, "restore_action, VM in a wrong state.");
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_restart(int vid, const RequestAttributes& ra)
{
    int uid = ra.uid;
    int gid = ra.gid;
    int req_id = ra.req_id;

    trigger([this, vid, uid, gid, req_id] {
        auto vm = vmpool->get(vid);

        if ( vm == nullptr )
        {
            return;
        }

        if (vm->get_state() == VirtualMachine::ACTIVE &&
            vm->get_lcm_state() == VirtualMachine::UNKNOWN)
        {
            vm->set_state(VirtualMachine::BOOT_UNKNOWN);

            vmpool->update(vm.get());

            vmm->trigger_deploy(vid);
        }
        else if ( vm->get_state() == VirtualMachine::POWEROFF )
        {
            time_t the_time = time(0);

            vm->set_state(VirtualMachine::ACTIVE);

            vm->set_state(VirtualMachine::BOOT_POWEROFF);

            vm->set_etime(the_time);

            vmpool->update_history(vm.get());

            vm->cp_history();

            vm->set_stime(the_time);

            vm->set_running_stime(the_time);

            vm->set_action(VMActions::RESUME_ACTION, uid, gid, req_id);

            vmpool->insert_history(vm.get());

            vmpool->update(vm.get());

            vmm->trigger_deploy(vid);
        }
        else
        {
            vm->log("LCM", Log::ERROR, "restart_action, VM in a wrong state.");
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_delete(int vid, const RequestAttributes& ra)
{
    int uid = ra.uid;
    int gid = ra.gid;
    int req_id = ra.req_id;

    trigger([this, vid, uid, gid, req_id] {
        int image_id = -1;
        Template quota_tmpl;

        if ( auto vm = vmpool->get(vid) )
        {
            if ( vm->get_state() != VirtualMachine::ACTIVE )
            {
                vm->log("LCM", Log::ERROR, "clean_action, VM in a wrong state.");

                return;
            }

            switch (vm->get_lcm_state())
            {
                case VirtualMachine::CLEANUP_RESUBMIT:
                    vm->set_state(VirtualMachine::CLEANUP_DELETE);
                    vmpool->update(vm.get());

                    [[fallthrough]];

                case VirtualMachine::CLEANUP_DELETE:
                    dm->trigger_done(vid);
                break;

                default:
                    clean_up_vm(vm.get(), true, image_id, uid, gid, req_id, quota_tmpl);
                    dm->trigger_done(vid);
                break;
            }
        }
        else
        {
            return;
        }

        if ( image_id != -1 )
        {
            if ( auto image = ipool->get(image_id) )
            {
                image->set_state(Image::ERROR);

                ipool->update(image.get());
            }
        }

        if (!quota_tmpl.empty())
        {
            Quotas::quota_del(Quotas::VM, uid, gid, &quota_tmpl);
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_delete_recreate(int vid,
                                               const RequestAttributes& ra)
{
    int uid = ra.uid;
    int gid = ra.gid;
    int req_id = ra.req_id;

    trigger([this, vid, uid, gid, req_id] {
        Template vm_quotas_snp;

        vector<Template *> ds_quotas_snp;

        int vm_uid, vm_gid;

        int image_id = -1;

        if ( auto vm = vmpool->get(vid) )
        {
            if ( vm->get_state() != VirtualMachine::ACTIVE )
            {
                vm->log("LCM", Log::ERROR, "clean_action, VM in a wrong state.");

                return;
            }

            switch (vm->get_lcm_state())
            {
                case VirtualMachine::CLEANUP_DELETE:
                    vm->log("LCM", Log::ERROR, "clean_action, VM in a wrong state.");
                break;

                case VirtualMachine::CLEANUP_RESUBMIT:
                    dm->trigger_resubmit(vid);
                break;

                default:
                    vm_uid = vm->get_uid();
                    vm_gid = vm->get_gid();

                    clean_up_vm(vm.get(), false, image_id, uid, gid, req_id, vm_quotas_snp);

                    vm->delete_non_persistent_disk_snapshots(vm_quotas_snp,
                            ds_quotas_snp);

                    vm->delete_snapshots(vm_quotas_snp);

                    vmpool->update(vm.get());
                break;
            }
        }
        else
        {
            return;
        }

        if ( image_id != -1 )
        {
            if ( auto image = ipool->get(image_id) )
            {
                image->set_state(Image::ERROR);

                ipool->update(image.get());
            }
        }

        if ( !ds_quotas_snp.empty() )
        {
            Quotas::ds_del_recreate(vm_uid, vm_gid, ds_quotas_snp);
        }

        if ( !vm_quotas_snp.empty())
        {
            Quotas::vm_del(vm_uid, vm_gid, &vm_quotas_snp);
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::clean_up_vm(VirtualMachine * vm, bool dispose,
        int& image_id, int uid, int gid, int req_id, Template& quota_tmpl)
{
    HostShareCapacity sr;

    unsigned int port;

    time_t the_time = time(0);

    VirtualMachine::LcmState state = vm->get_lcm_state();
    int vid   = vm->get_oid();

    if (dispose)
    {
        vm->set_state(VirtualMachine::CLEANUP_DELETE);
        vm->set_action(VMActions::DELETE_ACTION, uid, gid, req_id);
    }
    else
    {
        vm->set_state(VirtualMachine::CLEANUP_RESUBMIT);
        vm->set_action(VMActions::DELETE_RECREATE_ACTION, uid, gid, req_id);
    }

    vm->set_resched(false);

    if ( !vmm->is_keep_snapshots(vm->get_vmm_mad()) )
    {
        vm->delete_snapshots(quota_tmpl);
    }

    if (vm->get_etime() == 0)
    {
        vm->set_etime(the_time);
    }

    vm->get_capacity(sr);

    hpool->del_capacity(vm->get_hid(), sr);

    VectorAttribute * graphics = vm->get_template_attribute("GRAPHICS");

    if ( graphics != 0 && (graphics->vector_value("PORT", port) == 0))
    {
        graphics->remove("PORT");
        clpool->release_vnc_port(vm->get_cid(), port);
    }

    switch (state)
    {
        case VirtualMachine::PROLOG:
        case VirtualMachine::PROLOG_RESUME:
        case VirtualMachine::PROLOG_RESUME_FAILURE:
        case VirtualMachine::PROLOG_UNDEPLOY:
        case VirtualMachine::PROLOG_UNDEPLOY_FAILURE:
        case VirtualMachine::PROLOG_FAILURE:
            vm->set_prolog_etime(the_time);

            tm->trigger_driver_cancel(vid);
            tm->trigger_epilog_delete(vm);
        break;

        case VirtualMachine::BOOT:
        case VirtualMachine::BOOT_UNKNOWN:
        case VirtualMachine::BOOT_POWEROFF:
        case VirtualMachine::BOOT_SUSPENDED:
        case VirtualMachine::BOOT_STOPPED:
        case VirtualMachine::BOOT_UNDEPLOY:
        case VirtualMachine::BOOT_MIGRATE:
        case VirtualMachine::BOOT_FAILURE:
        case VirtualMachine::BOOT_MIGRATE_FAILURE:
        case VirtualMachine::BOOT_UNDEPLOY_FAILURE:
        case VirtualMachine::BOOT_STOPPED_FAILURE:
        case VirtualMachine::RUNNING:
        case VirtualMachine::UNKNOWN:
        case VirtualMachine::SHUTDOWN:
        case VirtualMachine::SHUTDOWN_POWEROFF:
        case VirtualMachine::SHUTDOWN_UNDEPLOY:
        case VirtualMachine::HOTPLUG_SNAPSHOT:
            vm->set_running_etime(the_time);

            vmm->trigger_driver_cancel(vid);
            vmm->trigger_cleanup(vid, false);
        break;

        case VirtualMachine::BACKUP:
            vm->set_running_etime(the_time);

            vmm->trigger_backup_cancel(vid);
            vmm->trigger_cleanup(vid, false);
        break;

        case VirtualMachine::HOTPLUG:
            vm->clear_attach_disk();

            vm->set_running_etime(the_time);

            vmm->trigger_driver_cancel(vid);
            vmm->trigger_cleanup(vid, false);
        break;

        case VirtualMachine::HOTPLUG_NIC:
        case VirtualMachine::HOTPLUG_NIC_POWEROFF:
            vm->clear_attach_nic();

            vm->set_running_etime(the_time);

            vmm->trigger_driver_cancel(vid);
            vmm->trigger_cleanup(vid, false);
        break;

        case VirtualMachine::HOTPLUG_SAVEAS:
            image_id = vm->clear_saveas_disk();

            vm->set_running_etime(the_time);

            vmm->trigger_driver_cancel(vid);
            vmm->trigger_cleanup(vid, false);
        break;

        case VirtualMachine::HOTPLUG_SAVEAS_POWEROFF:
        case VirtualMachine::HOTPLUG_SAVEAS_SUSPENDED:
            image_id = vm->clear_saveas_disk();

            vm->set_running_etime(the_time);

            tm->trigger_driver_cancel(vid);
            tm->trigger_epilog_delete(vm);
        break;

        case VirtualMachine::HOTPLUG_SAVEAS_UNDEPLOYED:
        case VirtualMachine::HOTPLUG_SAVEAS_STOPPED:
            image_id = vm->clear_saveas_disk();
        break;

        case VirtualMachine::HOTPLUG_PROLOG_POWEROFF:
        case VirtualMachine::HOTPLUG_EPILOG_POWEROFF:
            vm->clear_attach_disk();

            tm->trigger_driver_cancel(vid);
            tm->trigger_epilog_delete(vm);
        break;

        case VirtualMachine::HOTPLUG_RESIZE:
            vm->reset_resize();

            vm->set_running_etime(the_time);

            vmm->trigger_driver_cancel(vid);
            vmm->trigger_cleanup(vid, false);
        break;

        case VirtualMachine::DISK_SNAPSHOT_POWEROFF:
        case VirtualMachine::DISK_SNAPSHOT_REVERT_POWEROFF:
        case VirtualMachine::DISK_SNAPSHOT_DELETE_POWEROFF:
        case VirtualMachine::DISK_SNAPSHOT_SUSPENDED:
        case VirtualMachine::DISK_SNAPSHOT_DELETE_SUSPENDED:
        case VirtualMachine::DISK_SNAPSHOT_DELETE:
            vm->clear_snapshot_disk();

            tm->trigger_driver_cancel(vid);
            tm->trigger_epilog_delete(vm);
            break;

        case VirtualMachine::BACKUP_POWEROFF:
            vmm->trigger_driver_cancel(vid);
            tm->trigger_epilog_delete(vm);
        break;

        case VirtualMachine::DISK_SNAPSHOT:
            vm->clear_snapshot_disk();

            vm->set_running_etime(the_time);

            vmm->trigger_driver_cancel(vid);
            vmm->trigger_cleanup(vid, false);
        break;

        case VirtualMachine::DISK_RESIZE:
            vm->clear_resize_disk(true);

            vm->set_running_etime(the_time);

            vmm->trigger_driver_cancel(vid);
            vmm->trigger_cleanup(vid, false);
        break;

        case VirtualMachine::DISK_RESIZE_POWEROFF:
        case VirtualMachine::DISK_RESIZE_UNDEPLOYED:
            vm->clear_resize_disk(true);

            tm->trigger_driver_cancel(vid);
            tm->trigger_epilog_delete(vm);
        break;

        case VirtualMachine::MIGRATE:
            vm->set_running_etime(the_time);

            vm->set_previous_etime(the_time);
            vm->set_previous_vm_info();
            vm->set_previous_running_etime(the_time);

            hpool->del_capacity(vm->get_previous_hid(), sr);

            vmpool->update_previous_history(vm);

            vmm->trigger_driver_cancel(vid);
            vmm->trigger_cleanup(vid, true);
        break;

        case VirtualMachine::SAVE_STOP:
        case VirtualMachine::SAVE_SUSPEND:
            vm->set_running_etime(the_time);

            vmm->trigger_driver_cancel(vid);
            vmm->trigger_cleanup(vid, false);
        break;

        case VirtualMachine::SAVE_MIGRATE:
            vm->set_running_etime(the_time);

            vm->set_previous_etime(the_time);
            vm->set_previous_vm_info();
            vm->set_previous_running_etime(the_time);

            hpool->del_capacity(vm->get_previous_hid(), sr);

            vmpool->update_previous_history(vm);

            vmm->trigger_driver_cancel(vid);
            vmm->trigger_cleanup_previous(vid);
        break;

        case VirtualMachine::PROLOG_MIGRATE:
        case VirtualMachine::PROLOG_MIGRATE_FAILURE:
        case VirtualMachine::PROLOG_MIGRATE_POWEROFF:
        case VirtualMachine::PROLOG_MIGRATE_POWEROFF_FAILURE:
        case VirtualMachine::PROLOG_MIGRATE_SUSPEND:
        case VirtualMachine::PROLOG_MIGRATE_SUSPEND_FAILURE:
        case VirtualMachine::PROLOG_MIGRATE_UNKNOWN:
        case VirtualMachine::PROLOG_MIGRATE_UNKNOWN_FAILURE:
            vm->set_prolog_etime(the_time);

            tm->trigger_driver_cancel(vid);
            tm->trigger_epilog_delete_both(vm);
        break;

        case VirtualMachine::EPILOG_STOP:
        case VirtualMachine::EPILOG_UNDEPLOY:
        case VirtualMachine::EPILOG:
        case VirtualMachine::EPILOG_FAILURE:
        case VirtualMachine::EPILOG_STOP_FAILURE:
        case VirtualMachine::EPILOG_UNDEPLOY_FAILURE:
            vm->set_epilog_etime(the_time);

            tm->trigger_driver_cancel(vid);
            tm->trigger_epilog_delete(vm);
        break;

        case VirtualMachine::LCM_INIT:
        case VirtualMachine::CLEANUP_RESUBMIT:
        case VirtualMachine::CLEANUP_DELETE:
        break;
    }

    vmpool->update_history(vm);

    vmpool->update(vm);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::recover(VirtualMachine * vm, bool success,
        const RequestAttributes& ra)
{
    string action;
    int vim = vm->get_oid();

    switch (vm->get_lcm_state())
    {
        //----------------------------------------------------------------------
        // Direct recovery states
        //----------------------------------------------------------------------
        case VirtualMachine::LCM_INIT:
        case VirtualMachine::RUNNING:
            return;

        case VirtualMachine::CLEANUP_DELETE:
            dm->trigger_done(vm->get_oid());
            return;

        case VirtualMachine::CLEANUP_RESUBMIT:
            dm->trigger_resubmit(vm->get_oid());
            return;

        case VirtualMachine::UNKNOWN:
            vm->set_state(VirtualMachine::RUNNING);
            vmpool->update(vm);
            return;

        //----------------------------------------------------------------------
        // Recover through re-triggering LCM events
        //----------------------------------------------------------------------
        case VirtualMachine::PROLOG:
        case VirtualMachine::PROLOG_MIGRATE:
        case VirtualMachine::PROLOG_MIGRATE_FAILURE:
        case VirtualMachine::PROLOG_RESUME:
        case VirtualMachine::PROLOG_RESUME_FAILURE:
        case VirtualMachine::PROLOG_UNDEPLOY:
        case VirtualMachine::PROLOG_UNDEPLOY_FAILURE:
        case VirtualMachine::PROLOG_FAILURE:
        case VirtualMachine::PROLOG_MIGRATE_POWEROFF:
        case VirtualMachine::PROLOG_MIGRATE_POWEROFF_FAILURE:
        case VirtualMachine::PROLOG_MIGRATE_SUSPEND:
        case VirtualMachine::PROLOG_MIGRATE_SUSPEND_FAILURE:
        case VirtualMachine::PROLOG_MIGRATE_UNKNOWN:
        case VirtualMachine::PROLOG_MIGRATE_UNKNOWN_FAILURE:
            if (success)
            {
                trigger_prolog_success(vim);
            }
            else
            {
                trigger_prolog_failure(vim);
            }
        break;

        case VirtualMachine::EPILOG:
        case VirtualMachine::EPILOG_STOP:
        case VirtualMachine::EPILOG_UNDEPLOY:
        case VirtualMachine::EPILOG_FAILURE:
        case VirtualMachine::EPILOG_STOP_FAILURE:
        case VirtualMachine::EPILOG_UNDEPLOY_FAILURE:
            if (success)
            {
                trigger_epilog_success(vim);
            }
            else
            {
                trigger_epilog_failure(vim);
            }
        break;

        case VirtualMachine::HOTPLUG_SAVEAS:
        case VirtualMachine::HOTPLUG_SAVEAS_POWEROFF:
        case VirtualMachine::HOTPLUG_SAVEAS_SUSPENDED:
        case VirtualMachine::HOTPLUG_SAVEAS_UNDEPLOYED:
        case VirtualMachine::HOTPLUG_SAVEAS_STOPPED:
            if (success)
            {
                trigger_saveas_success(vim);
            }
            else
            {
                trigger_saveas_failure(vim);
            }
        break;

        case VirtualMachine::HOTPLUG_PROLOG_POWEROFF:
            if (success)
            {
                trigger_attach_success(vim);
            }
            else
            {
                trigger_attach_failure(vim);
            }
        break;

        case VirtualMachine::HOTPLUG_EPILOG_POWEROFF:
            if (success)
            {
                trigger_detach_success(vim);
            }
            else
            {
                trigger_detach_failure(vim);
            }
        break;

        case VirtualMachine::BOOT:
        case VirtualMachine::BOOT_UNKNOWN:
        case VirtualMachine::BOOT_POWEROFF:
        case VirtualMachine::BOOT_SUSPENDED:
        case VirtualMachine::BOOT_STOPPED:
        case VirtualMachine::BOOT_UNDEPLOY:
        case VirtualMachine::MIGRATE:
        case VirtualMachine::BOOT_MIGRATE:
        case VirtualMachine::BOOT_MIGRATE_FAILURE:
        case VirtualMachine::BOOT_FAILURE:
        case VirtualMachine::BOOT_STOPPED_FAILURE:
        case VirtualMachine::BOOT_UNDEPLOY_FAILURE:
            if (success)
            {
                //Auto-generate deploy-id it'll work for Xen, KVM and VMware
                if (vm->get_deploy_id().empty())
                {
                    ostringstream oss;

                    oss << "one-" << vm->get_oid();

                    vm->set_deploy_id(oss.str());
                }

                trigger_deploy_success(vim);
            }
            else
            {
                trigger_deploy_failure(vim);
            }
        break;

        case VirtualMachine::BACKUP:
        case VirtualMachine::BACKUP_POWEROFF:
            if (success)
            {
                trigger_backup_success(vim);
            }
            else
            {
                trigger_backup_failure(vim);
            }
        break;

        case VirtualMachine::SHUTDOWN:
        case VirtualMachine::SHUTDOWN_POWEROFF:
        case VirtualMachine::SHUTDOWN_UNDEPLOY:
            if (success)
            {
                trigger_shutdown_success(vim);
            }
            else
            {
                trigger_shutdown_failure(vim);
            }
        break;

        case VirtualMachine::SAVE_STOP:
        case VirtualMachine::SAVE_SUSPEND:
        case VirtualMachine::SAVE_MIGRATE:
            if (success)
            {
                trigger_save_success(vim);
            }
            else
            {
                trigger_save_failure(vim);
            }
        break;

        case VirtualMachine::HOTPLUG:
            if (success)
            {
                trigger_attach_success(vim);
            }
            else
            {
                trigger_attach_failure(vim);
            }
        break;

        case VirtualMachine::HOTPLUG_NIC:
        case VirtualMachine::HOTPLUG_NIC_POWEROFF:
            if (success)
            {
                trigger_attach_nic_success(vim);
            }
            else
            {
                trigger_attach_nic_failure(vim);
            }
        break;

        //This is for all snapshot actions (create, delete & revert)
        case VirtualMachine::HOTPLUG_SNAPSHOT:
            action = vm->get_snapshot_action();

            if ( success )
            {
                if ( action == "CREATE" )
                {
                    vm->update_snapshot_id();

                    vmpool->update(vm);

                    trigger_snapshot_create_success(vim);
                }
                else if ( action == "REVERT" )
                {
                    trigger_snapshot_revert_success(vim);
                }
                else if  ( action == "DELETE" )
                {
                    trigger_snapshot_delete_success(vim);
                }
            }
            else
            {
                if ( action == "CREATE" )
                {
                    trigger_snapshot_create_failure(vim);
                }
                else if ( action == "REVERT" )
                {
                    trigger_snapshot_revert_failure(vim);
                }
                else if  ( action == "DELETE" )
                {
                    trigger_snapshot_delete_failure(vim);
                }
            }
        break;

        case VirtualMachine::HOTPLUG_RESIZE:
            if (success)
            {
                trigger_resize_success(vim);
            }
            else
            {
                trigger_resize_failure(vim);
            }
        break;

        case VirtualMachine::DISK_SNAPSHOT_POWEROFF:
        case VirtualMachine::DISK_SNAPSHOT_REVERT_POWEROFF:
        case VirtualMachine::DISK_SNAPSHOT_DELETE_POWEROFF:
        case VirtualMachine::DISK_SNAPSHOT_SUSPENDED:
        case VirtualMachine::DISK_SNAPSHOT_DELETE_SUSPENDED:
        case VirtualMachine::DISK_SNAPSHOT:
        case VirtualMachine::DISK_SNAPSHOT_DELETE:
            if (success)
            {
                trigger_disk_snapshot_success(vim);
            }
            else
            {
                trigger_disk_snapshot_failure(vim);
            }
        break;

        case VirtualMachine::DISK_RESIZE_POWEROFF:
        case VirtualMachine::DISK_RESIZE_UNDEPLOYED:
        case VirtualMachine::DISK_RESIZE:
            if (success)
            {
                trigger_disk_resize_success(vim);
            }
            else
            {
                trigger_disk_resize_failure(vim);
            }
        break;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::retry(VirtualMachine * vm)
{
    int vid = vm->get_oid();

    if ( vm->get_state() != VirtualMachine::ACTIVE )
    {
        return;
    }

    VirtualMachine::LcmState state = vm->get_lcm_state();

    switch (state)
    {
        case VirtualMachine::BOOT_FAILURE:
            vm->set_state(VirtualMachine::BOOT);

            vmpool->update(vm);

            vmm->trigger_deploy(vid);
            break;

        case VirtualMachine::BOOT_MIGRATE_FAILURE:
            vm->set_state(VirtualMachine::BOOT_MIGRATE);

            vmpool->update(vm);

            vmm->trigger_restore(vid);
            break;

        case VirtualMachine::BOOT_UNDEPLOY_FAILURE:
            vm->set_state(VirtualMachine::BOOT_UNDEPLOY);

            vmpool->update(vm);

            vmm->trigger_deploy(vid);
            break;

        case VirtualMachine::BOOT_STOPPED_FAILURE:
            vm->set_state(VirtualMachine::BOOT_STOPPED);

            vmpool->update(vm);

            vmm->trigger_restore(vid);
            break;

        case VirtualMachine::PROLOG_MIGRATE_FAILURE:
            vm->set_state(VirtualMachine::PROLOG_MIGRATE);

            vmpool->update(vm);

            tm->trigger_prolog_migr(vm);
            break;

        case VirtualMachine::PROLOG_MIGRATE_POWEROFF_FAILURE:
            vm->set_state(VirtualMachine::PROLOG_MIGRATE_POWEROFF);

            vmpool->update(vm);

            tm->trigger_prolog_migr(vm);
            break;


        case VirtualMachine::PROLOG_MIGRATE_SUSPEND_FAILURE:
            vm->set_state(VirtualMachine::PROLOG_MIGRATE_SUSPEND);

            vmpool->update(vm);

            tm->trigger_prolog_migr(vm);
            break;

        case VirtualMachine::PROLOG_MIGRATE_UNKNOWN_FAILURE:
            vm->set_state(VirtualMachine::PROLOG_MIGRATE_UNKNOWN);

            vmpool->update(vm);

            tm->trigger_prolog_migr(vm);
            break;

        case VirtualMachine::PROLOG_RESUME_FAILURE:
            vm->set_state(VirtualMachine::PROLOG_RESUME);

            vmpool->update(vm);

            tm->trigger_prolog_resume(vm);
            break;

        case VirtualMachine::PROLOG_UNDEPLOY_FAILURE:
            vm->set_state(VirtualMachine::PROLOG_UNDEPLOY);

            vmpool->update(vm);

            tm->trigger_prolog_resume(vm);
            break;

        case VirtualMachine::PROLOG_FAILURE:
            vm->set_state(VirtualMachine::PROLOG);

            vmpool->update(vm);

            tm->trigger_prolog(vm);
            break;

        case VirtualMachine::EPILOG_FAILURE:
            vm->set_state(VirtualMachine::EPILOG);

            vmpool->update(vm);

            tm->trigger_epilog(false, vm);
            break;

        case VirtualMachine::EPILOG_STOP_FAILURE:
            vm->set_state(VirtualMachine::EPILOG_STOP);

            vmpool->update(vm);

            tm->trigger_epilog_stop(vm);
            break;

       case VirtualMachine::EPILOG_UNDEPLOY_FAILURE:
            vm->set_state(VirtualMachine::EPILOG_UNDEPLOY);

            vmpool->update(vm);

            tm->trigger_epilog_stop(vm);
            break;

        case VirtualMachine::BOOT_MIGRATE:
        case VirtualMachine::BOOT_SUSPENDED:
        case VirtualMachine::BOOT_STOPPED:
        case VirtualMachine::BOOT_UNDEPLOY:
            vmm->trigger_restore(vid);
            break;

        case VirtualMachine::BOOT:
        case VirtualMachine::BOOT_POWEROFF:
        case VirtualMachine::BOOT_UNKNOWN:
            vmm->trigger_deploy(vid);
            break;

        case VirtualMachine::SHUTDOWN:
        case VirtualMachine::SHUTDOWN_POWEROFF:
        case VirtualMachine::SHUTDOWN_UNDEPLOY:
            if (vm->get_action() == VMActions::TERMINATE_ACTION)
            {
                vmm->trigger_shutdown(vid);
            }
            else
            {
                vmm->trigger_cancel(vid);
            }
            break;

        case VirtualMachine::SAVE_STOP:
        case VirtualMachine::SAVE_SUSPEND:
        case VirtualMachine::SAVE_MIGRATE:
            vmm->trigger_save(vid);
            break;

        case VirtualMachine::MIGRATE:
            vmm->trigger_migrate(vid);
            break;

        case VirtualMachine::PROLOG:
            tm->trigger_prolog(vm);
            break;

        case VirtualMachine::PROLOG_MIGRATE:
        case VirtualMachine::PROLOG_MIGRATE_POWEROFF:
        case VirtualMachine::PROLOG_MIGRATE_SUSPEND:
        case VirtualMachine::PROLOG_MIGRATE_UNKNOWN:
            tm->trigger_prolog_migr(vm);
            break;

        case VirtualMachine::PROLOG_RESUME:
        case VirtualMachine::PROLOG_UNDEPLOY:
            tm->trigger_prolog_resume(vm);
            break;

        case VirtualMachine::EPILOG:
            tm->trigger_epilog(false, vm);
            break;

        case VirtualMachine::EPILOG_STOP:
        case VirtualMachine::EPILOG_UNDEPLOY:
            tm->trigger_epilog_stop(vm);
            break;

        case VirtualMachine::LCM_INIT:
        case VirtualMachine::CLEANUP_RESUBMIT:
        case VirtualMachine::CLEANUP_DELETE:
        case VirtualMachine::HOTPLUG:
        case VirtualMachine::HOTPLUG_NIC:
        case VirtualMachine::HOTPLUG_NIC_POWEROFF:
        case VirtualMachine::HOTPLUG_SNAPSHOT:
        case VirtualMachine::HOTPLUG_SAVEAS:
        case VirtualMachine::HOTPLUG_SAVEAS_POWEROFF:
        case VirtualMachine::HOTPLUG_SAVEAS_SUSPENDED:
        case VirtualMachine::HOTPLUG_SAVEAS_UNDEPLOYED:
        case VirtualMachine::HOTPLUG_SAVEAS_STOPPED:
        case VirtualMachine::HOTPLUG_PROLOG_POWEROFF:
        case VirtualMachine::HOTPLUG_EPILOG_POWEROFF:
        case VirtualMachine::HOTPLUG_RESIZE:
        case VirtualMachine::DISK_SNAPSHOT_POWEROFF:
        case VirtualMachine::DISK_SNAPSHOT_REVERT_POWEROFF:
        case VirtualMachine::DISK_SNAPSHOT_DELETE_POWEROFF:
        case VirtualMachine::DISK_SNAPSHOT_SUSPENDED:
        case VirtualMachine::DISK_SNAPSHOT_DELETE_SUSPENDED:
        case VirtualMachine::DISK_SNAPSHOT:
        case VirtualMachine::DISK_SNAPSHOT_DELETE:
        case VirtualMachine::DISK_RESIZE:
        case VirtualMachine::DISK_RESIZE_POWEROFF:
        case VirtualMachine::DISK_RESIZE_UNDEPLOYED:
        case VirtualMachine::RUNNING:
        case VirtualMachine::UNKNOWN:
        case VirtualMachine::BACKUP:
        case VirtualMachine::BACKUP_POWEROFF:
            break;
    }

    return;
}

/*  -------------------------------------------------------------------------- */
/*  -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_updatesg(int sgid)
{
    trigger([this, sgid] {
        int  vmid, rc;

        auto sg = sgpool->get(sgid);

        if ( sg == nullptr )
        {
            return;
        }

        // -------------------------------------------------------------------------
        // Iterate over SG VMs, rules at hypervisor are updated one by one
        // -------------------------------------------------------------------------
        do
        {
            bool is_error  = false;
            bool is_tmpl   = false;
            bool is_update = false;

            rc = sg->get_outdated(vmid);

            sgpool->update(sg.get());

            sg.reset();

            if ( rc != 0 )
            {
                return;
            }

            if ( auto vm = vmpool->get(vmid) )
            {
                VirtualMachine::LcmState lstate = vm->get_lcm_state();
                VirtualMachine::VmState  state  = vm->get_state();

                if ( state != VirtualMachine::ACTIVE ) //Update just VM info
                {
                    is_tmpl = true;
                }
                else
                {
                    switch (lstate)
                    {
                        //Cannnot update VM, SG rules being updated/created
                        case VirtualMachine::BOOT:
                        case VirtualMachine::BOOT_MIGRATE:
                        case VirtualMachine::BOOT_SUSPENDED:
                        case VirtualMachine::BOOT_STOPPED:
                        case VirtualMachine::BOOT_UNDEPLOY:
                        case VirtualMachine::BOOT_POWEROFF:
                        case VirtualMachine::BOOT_UNKNOWN:
                        case VirtualMachine::BOOT_FAILURE:
                        case VirtualMachine::BOOT_MIGRATE_FAILURE:
                        case VirtualMachine::BOOT_UNDEPLOY_FAILURE:
                        case VirtualMachine::BOOT_STOPPED_FAILURE:
                        case VirtualMachine::MIGRATE:
                        case VirtualMachine::HOTPLUG_NIC:
                        case VirtualMachine::HOTPLUG_NIC_POWEROFF:
                        case VirtualMachine::UNKNOWN:
                            is_error = true;
                            break;

                        //Update just VM information
                        case VirtualMachine::LCM_INIT:
                        case VirtualMachine::PROLOG:
                        case VirtualMachine::PROLOG_MIGRATE_FAILURE:
                        case VirtualMachine::PROLOG_MIGRATE_POWEROFF_FAILURE:
                        case VirtualMachine::PROLOG_MIGRATE_SUSPEND_FAILURE:
                        case VirtualMachine::PROLOG_RESUME_FAILURE:
                        case VirtualMachine::PROLOG_UNDEPLOY_FAILURE:
                        case VirtualMachine::PROLOG_MIGRATE_UNKNOWN_FAILURE:
                        case VirtualMachine::PROLOG_FAILURE:
                        case VirtualMachine::PROLOG_MIGRATE:
                        case VirtualMachine::PROLOG_MIGRATE_POWEROFF:
                        case VirtualMachine::PROLOG_MIGRATE_SUSPEND:
                        case VirtualMachine::PROLOG_MIGRATE_UNKNOWN:
                        case VirtualMachine::PROLOG_RESUME:
                        case VirtualMachine::PROLOG_UNDEPLOY:
                        case VirtualMachine::EPILOG:
                        case VirtualMachine::EPILOG_STOP:
                        case VirtualMachine::EPILOG_UNDEPLOY:
                        case VirtualMachine::EPILOG_FAILURE:
                        case VirtualMachine::EPILOG_STOP_FAILURE:
                        case VirtualMachine::EPILOG_UNDEPLOY_FAILURE:
                        case VirtualMachine::SHUTDOWN:
                        case VirtualMachine::SHUTDOWN_POWEROFF:
                        case VirtualMachine::SHUTDOWN_UNDEPLOY:
                        case VirtualMachine::SAVE_STOP:
                        case VirtualMachine::SAVE_SUSPEND:
                        case VirtualMachine::SAVE_MIGRATE:
                        case VirtualMachine::CLEANUP_RESUBMIT:
                        case VirtualMachine::CLEANUP_DELETE:
                        case VirtualMachine::DISK_RESIZE_POWEROFF:
                        case VirtualMachine::DISK_RESIZE_UNDEPLOYED:
                        case VirtualMachine::DISK_SNAPSHOT_POWEROFF:
                        case VirtualMachine::DISK_SNAPSHOT_REVERT_POWEROFF:
                        case VirtualMachine::DISK_SNAPSHOT_DELETE_POWEROFF:
                        case VirtualMachine::DISK_SNAPSHOT_SUSPENDED:
                        case VirtualMachine::DISK_SNAPSHOT_DELETE_SUSPENDED:
                        case VirtualMachine::HOTPLUG_SAVEAS_POWEROFF:
                        case VirtualMachine::HOTPLUG_SAVEAS_SUSPENDED:
                        case VirtualMachine::HOTPLUG_SAVEAS_UNDEPLOYED:
                        case VirtualMachine::HOTPLUG_SAVEAS_STOPPED:
                        case VirtualMachine::HOTPLUG_PROLOG_POWEROFF:
                        case VirtualMachine::HOTPLUG_EPILOG_POWEROFF:
                        case VirtualMachine::BACKUP_POWEROFF:
                            is_tmpl = true;
                            break;

                        //Update VM information + SG rules at host
                        case VirtualMachine::RUNNING:
                        case VirtualMachine::HOTPLUG:
                        case VirtualMachine::HOTPLUG_SNAPSHOT:
                        case VirtualMachine::HOTPLUG_SAVEAS:
                        case VirtualMachine::HOTPLUG_RESIZE:
                        case VirtualMachine::DISK_SNAPSHOT:
                        case VirtualMachine::DISK_SNAPSHOT_DELETE:
                        case VirtualMachine::DISK_RESIZE:
                        case VirtualMachine::BACKUP:
                            is_update = true;
                            break;
                    }
                }

                // -------------------------------------------------------------
                // Update VM template with the new SG rules & trigger update
                // -------------------------------------------------------------
                if ( is_tmpl || is_update )
                {
                    vector<VectorAttribute *> sg_rules;

                    sgpool->get_security_group_rules(-1, sgid, sg_rules);

                    vm->remove_security_group(sgid);

                    vm->add_template_attribute(sg_rules);

                    vmpool->update(vm.get());
                }

                if ( is_update )
                {
                    vmm->updatesg(vm.get(), sgid);
                }
            }
            else
            {
                continue;
            }

            sg = sgpool->get(sgid);

            if ( sg == nullptr )
            {
                return;
            }

            // ---------------------------------------------------------------------
            // Update VM status in the security group and exit
            // ---------------------------------------------------------------------
            if ( is_error )
            {
                sg->add_error(vmid);
            }
            else if ( is_tmpl )
            {
                sg->add_vm(vmid);
            }
            else if ( is_update )
            {
                sg->add_updating(vmid);
            }

            sgpool->update(sg.get());

            if (is_update)
            {
                return;
            }
        } while (true);
    });
}

/*  -------------------------------------------------------------------------- */
/*  -------------------------------------------------------------------------- */

void LifeCycleManager::trigger_updatevnet(int vnid)
{
    trigger([this, vnid] {
        int  vmid, rc;

        auto vnet = vnpool->get(vnid);

        if ( vnet == nullptr )
        {
            return;
        }

        // -------------------------------------------------------------------------
        // Iterate over VNET VMs, networks at hypervisor are updated one by one
        // -------------------------------------------------------------------------
        do
        {
            bool is_error  = false;
            bool is_tmpl   = false;
            bool is_update = false;

            rc = vnet->get_outdated(vmid);

            if ( rc != 0 )
            {
                vnet->remove_template_attribute("VNET_UPDATE");

                vnpool->update(vnet.get());
                return;
            }

            vnpool->update(vnet.get());

            vnet.reset();

            if ( auto vm = vmpool->get(vmid) )
            {
                VirtualMachine::LcmState lstate = vm->get_lcm_state();
                VirtualMachine::VmState  state  = vm->get_state();

                if ( state != VirtualMachine::ACTIVE ) // Update just VM info
                {
                    is_tmpl = true;
                }
                else
                {
                    switch (lstate)
                    {
                        // Can't live update the NIC, wrong VM state
                        case VirtualMachine::BOOT:
                        case VirtualMachine::BOOT_MIGRATE:
                        case VirtualMachine::BOOT_SUSPENDED:
                        case VirtualMachine::BOOT_STOPPED:
                        case VirtualMachine::BOOT_UNDEPLOY:
                        case VirtualMachine::BOOT_POWEROFF:
                        case VirtualMachine::BOOT_UNKNOWN:
                        case VirtualMachine::BOOT_FAILURE:
                        case VirtualMachine::BOOT_MIGRATE_FAILURE:
                        case VirtualMachine::BOOT_UNDEPLOY_FAILURE:
                        case VirtualMachine::BOOT_STOPPED_FAILURE:
                        case VirtualMachine::MIGRATE:
                        case VirtualMachine::HOTPLUG_NIC:
                        case VirtualMachine::HOTPLUG_NIC_POWEROFF:
                        case VirtualMachine::HOTPLUG:
                        case VirtualMachine::HOTPLUG_SNAPSHOT:
                        case VirtualMachine::HOTPLUG_SAVEAS:
                        case VirtualMachine::HOTPLUG_RESIZE:
                        case VirtualMachine::DISK_SNAPSHOT:
                        case VirtualMachine::DISK_SNAPSHOT_DELETE:
                        case VirtualMachine::DISK_RESIZE:
                        case VirtualMachine::UNKNOWN:
                            is_error = true;
                            break;

                        // Update VM information + virtual network at host
                        case VirtualMachine::RUNNING:
                            is_update = true;
                            break;

                        // Update just VM information
                        default:
                            is_tmpl = true;
                            break;
                    }
                }

                // -------------------------------------------------------------
                // Update VM template with the new NIC attributes & trigger update
                // -------------------------------------------------------------
                if ( is_tmpl || is_update )
                {
                    rc = vm->nic_update(vnid);

                    if (rc < 0)
                    {
                        NebulaLog::error("LCM", "VM " + to_string(vm->get_oid())
                            + ": Unable to update Virtual Network " + to_string(vnid));

                        is_error = true;
                        is_tmpl = is_update = false;
                    }

                    if (is_update && vm->get_template_attribute("VNET_UPDATE") == nullptr)
                    {
                        // Do not trigger driver update in case no attribute was updated
                        is_update = false;
                        is_tmpl = true;
                    }

                    if (is_update)
                    {
                        vm->set_state(VirtualMachine::HOTPLUG_NIC);

                        RequestAttributes ra(AuthRequest::NONE);
                        ra.uid = vm->get_uid();
                        ra.gid = vm->get_gid();
                        ra.req_id = 0;

                        DispatchManager::close_cp_history(vmpool, vm.get(),
                            VMActions::NIC_UPDATE_ACTION, ra);
                    }

                    vmpool->update(vm.get());
                }

                if ( is_update )
                {
                    vmm->updatenic(vm.get(), vnid);
                }
            }
            else
            {
                continue;
            }

            vnet = vnpool->get(vnid);

            if ( vnet == nullptr )
            {
                return;
            }

            // ---------------------------------------------------------------------
            // Update VM status in the security group and exit
            // ---------------------------------------------------------------------
            if ( is_error )
            {
                vnet->add_error(vmid);
            }
            else if ( is_tmpl )
            {
                vnet->add_updated(vmid);
            }
            else if ( is_update )
            {
                vnet->add_updating(vmid);
            }

            vnpool->update(vnet.get());

            if (is_update)
            {
                return;
            }
        } while (true);
    });
}
