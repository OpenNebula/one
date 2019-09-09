/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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
#include "Request.h"

void  LifeCycleManager::deploy_action(const LCMAction& la)
{
    VirtualMachine *    vm;
    ostringstream       os;

    int vid = la.vm_id();

    vm = vmpool->get(vid);

    if ( vm == 0 )
    {
        return;
    }

    if ( vm->get_state() == VirtualMachine::ACTIVE )
    {
        HostShareCapacity sr;

        time_t thetime = time(0);
        int rc;

        VirtualMachine::LcmState vm_state;
        TMAction::Actions tm_action;

        //----------------------------------------------------
        //                 PROLOG STATE
        //----------------------------------------------------

        vm->get_capacity(sr);

        vm_state  = VirtualMachine::PROLOG;
        tm_action = TMAction::PROLOG;

        if (vm->hasPreviousHistory())
        {
            if (vm->get_previous_action() == VMActions::STOP_ACTION)
            {
                vm_state  = VirtualMachine::PROLOG_RESUME;
                tm_action = TMAction::PROLOG_RESUME;
            }
            else if (vm->get_previous_action() == VMActions::UNDEPLOY_ACTION ||
                     vm->get_previous_action() == VMActions::UNDEPLOY_HARD_ACTION)
            {
                vm_state  = VirtualMachine::PROLOG_UNDEPLOY;
                tm_action = TMAction::PROLOG_RESUME;
            }
        }

        vm->set_state(vm_state);

        rc = hpool->add_capacity(vm->get_hid(), sr);

        vm->set_stime(thetime);

        vm->set_prolog_stime(thetime);

        vmpool->update_history(vm);

        vmpool->update(vm);

        if ( rc == -1)
        {
            //The host has been deleted, move VM to FAILURE
            this->trigger(LCMAction::PROLOG_FAILURE, vid);
        }
        else
        {
            tm->trigger(tm_action, vid);
        }
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

void  LifeCycleManager::suspend_action(const LCMAction& la)
{
    int vid = la.vm_id();

    VirtualMachine * vm = vmpool->get(vid);

    if ( vm == 0 )
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

        vm->set_action(VMActions::SUSPEND_ACTION, la.uid(), la.gid(), la.req_id());

        vmpool->update_history(vm);

        vmpool->update(vm);

        //----------------------------------------------------

        vmm->trigger(VMMAction::SAVE,vid);
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

void  LifeCycleManager::stop_action(const LCMAction& la)
{
    int vid = la.vm_id();

    VirtualMachine * vm = vmpool->get(vid);

    if ( vm == 0 )
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

        vm->set_action(VMActions::STOP_ACTION, la.uid(), la.gid(), la.req_id());

        vmpool->update_history(vm);

        vmpool->update(vm);

        //----------------------------------------------------

        vmm->trigger(VMMAction::SAVE,vid);
    }
    else if (vm->get_state() == VirtualMachine::SUSPENDED)
    {
        //----------------------------------------------------
        //   Bypass SAVE_STOP
        //----------------------------------------------------
        vm->set_state(VirtualMachine::ACTIVE);
        vm->set_state(VirtualMachine::EPILOG_STOP);

        vm->set_action(VMActions::STOP_ACTION, la.uid(), la.gid(), la.req_id());

        vm->set_epilog_stime(time(0));

        vmpool->update_history(vm);

        vmpool->update(vm);

        //----------------------------------------------------

        tm->trigger(TMAction::EPILOG_STOP,vid);
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

void  LifeCycleManager::migrate_action(const LCMAction& la)
{
    HostShareCapacity sr;

    time_t the_time = time(0);

    int vid = la.vm_id();

    VirtualMachine * vm = vmpool->get(vid);

    if ( vm == 0 )
    {
        return;
    }

    if (vm->get_state()     == VirtualMachine::ACTIVE &&
        vm->get_lcm_state() == VirtualMachine::RUNNING)
    {
        //----------------------------------------------------
        //                SAVE_MIGRATE STATE
        //----------------------------------------------------

        VMActions::Action action;

        switch (la.action())
        {
            case LCMAction::POFF_MIGRATE :
                action = VMActions::POFF_MIGRATE_ACTION;
                break;
            case LCMAction::POFF_HARD_MIGRATE :
                action = VMActions::POFF_HARD_MIGRATE_ACTION;
                break;
            default :
                action = VMActions::MIGRATE_ACTION;
                break;
        }

        vm->set_state(VirtualMachine::SAVE_MIGRATE);

        vm->set_resched(false);

        vm->get_capacity(sr);

        hpool->add_capacity(vm->get_hid(), sr);

        vm->set_stime(the_time);

        vm->set_action(action, la.uid(), la.gid(), la.req_id());

        vmpool->update_history(vm);

        vm->set_previous_action(action, la.uid(), la.gid(), la.req_id());

        vmpool->update_previous_history(vm);

        vmpool->update(vm);

        //----------------------------------------------------

        switch (la.action())
        {
            case LCMAction::POFF_MIGRATE :
                vmm->trigger(VMMAction::SHUTDOWN,vid);
                break;
            case LCMAction::POFF_HARD_MIGRATE :
                vmm->trigger(VMMAction::CANCEL,vid);
                break;
            default :
                vmm->trigger(VMMAction::SAVE,vid);
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
            vm->set_action(VMActions::MIGRATE_ACTION, la.uid(), la.gid(),
                    la.req_id());

        }
        else if (vm->get_state() == VirtualMachine::SUSPENDED)
        {
            vm->set_state(VirtualMachine::PROLOG_MIGRATE_SUSPEND);
            vm->set_action(VMActions::MIGRATE_ACTION, la.uid(), la.gid(),
                    la.req_id());
        }
        else //VirtualMachine::UNKNOWN
        {
            vm->set_state(VirtualMachine::PROLOG_MIGRATE_UNKNOWN);

            vm->set_previous_running_etime(the_time);

            vm->set_previous_etime(the_time);

            vm->set_previous_action(VMActions::MIGRATE_ACTION, la.uid(), la.gid(),
                    la.req_id());

            vm->set_previous_vm_info();

            vmpool->update_previous_history(vm);
        }

        vm->set_state(VirtualMachine::ACTIVE);

        vm->set_resched(false);

        if ( !vmm->is_keep_snapshots(vm->get_vmm_mad()) )
        {
            vm->delete_snapshots();
        }

        vm->reset_info();

        vm->get_capacity(sr);

        hpool->add_capacity(vm->get_hid(), sr);

        if ( vm->get_hid() != vm->get_previous_hid() )
        {
            hpool->del_capacity(vm->get_previous_hid(), sr);
        }

        vm->set_stime(the_time);

        vm->set_prolog_stime(the_time);

        vmpool->update_history(vm);

        vmpool->update(vm);

        //----------------------------------------------------

        tm->trigger(TMAction::PROLOG_MIGR,vid);
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

void  LifeCycleManager::live_migrate_action(const LCMAction& la)
{
    ostringstream os;

    int vid = la.vm_id();

    VirtualMachine * vm = vmpool->get(vid);

    if ( vm == 0 )
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

        vm->set_action(VMActions::LIVE_MIGRATE_ACTION, la.uid(), la.gid(),
                    la.req_id());

        vmpool->update_history(vm);

        vm->set_previous_action(VMActions::LIVE_MIGRATE_ACTION, la.uid(),la.gid(),
                    la.req_id());

        vmpool->update_previous_history(vm);

        vmpool->update(vm);

        //----------------------------------------------------

        vmm->trigger(VMMAction::MIGRATE,vid);
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

void  LifeCycleManager::shutdown_action(const LCMAction& la, bool hard)
{
    int vid = la.vm_id();
    VirtualMachine * vm = vmpool->get(vid);
    VirtualMachineTemplate quota_tmpl;
    string error;

    if ( vm == 0 )
    {
        return;
    }

    int uid = vm->get_uid();
    int gid = vm->get_gid();

    std::string memory, cpu;

    vm->get_template_attribute("MEMORY", memory);
    vm->get_template_attribute("CPU", cpu);

    if ( (vm->get_state() == VirtualMachine::SUSPENDED) ||
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

    if (vm->get_state()     == VirtualMachine::ACTIVE &&
        (vm->get_lcm_state() == VirtualMachine::RUNNING ||
         vm->get_lcm_state() == VirtualMachine::UNKNOWN))
    {
        //----------------------------------------------------
        //                  SHUTDOWN STATE
        //----------------------------------------------------

        vm->set_state(VirtualMachine::SHUTDOWN);

        if (hard)
        {
            vm->set_action(VMActions::TERMINATE_HARD_ACTION, la.uid(), la.gid(),
                    la.req_id());

            vmm->trigger(VMMAction::CANCEL,vid);
        }
        else
        {
            vm->set_action(VMActions::TERMINATE_ACTION, la.uid(), la.gid(),
                    la.req_id());

            vmm->trigger(VMMAction::SHUTDOWN,vid);
        }

        vm->set_resched(false);

        vmpool->update_history(vm);

        vmpool->update(vm);
    }
    else if (vm->get_state() == VirtualMachine::SUSPENDED ||
             vm->get_state() == VirtualMachine::POWEROFF)
    {
        vm->set_state(VirtualMachine::ACTIVE);
        vm->set_state(VirtualMachine::EPILOG);

        Quotas::vm_check(uid, gid, &quota_tmpl, error);

        vm->set_action(VMActions::TERMINATE_ACTION, la.uid(), la.gid(),
                    la.req_id());

        vm->set_epilog_stime(time(0));

        vmpool->update_history(vm);

        vmpool->update(vm);

        //----------------------------------------------------

        tm->trigger(TMAction::EPILOG, vid);
    }
    else if (vm->get_state() == VirtualMachine::STOPPED ||
             vm->get_state() == VirtualMachine::UNDEPLOYED)
    {
        vm->set_state(VirtualMachine::ACTIVE);
        vm->set_state(VirtualMachine::EPILOG);

        Quotas::vm_check(uid, gid, &quota_tmpl, error);

        vm->set_action(VMActions::TERMINATE_ACTION, la.uid(), la.gid(),
                    la.req_id());

        vm->set_epilog_stime(time(0));

        vmpool->update_history(vm);

        vmpool->update(vm);

        //----------------------------------------------------

        tm->trigger(TMAction::EPILOG_LOCAL, vid);
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

void  LifeCycleManager::undeploy_action(const LCMAction& la, bool hard)
{
    int vid = la.vm_id();
    unsigned int port;
    VirtualMachine * vm = vmpool->get(vid);

    if ( vm == 0 )
    {
        return;
    }

    if (vm->get_state()     == VirtualMachine::ACTIVE &&
        (vm->get_lcm_state() == VirtualMachine::RUNNING ||
         vm->get_lcm_state() == VirtualMachine::UNKNOWN))
    {
        //----------------------------------------------------
        //             SHUTDOWN_UNDEPLOY STATE
        //----------------------------------------------------

        vm->set_state(VirtualMachine::SHUTDOWN_UNDEPLOY);

        vm->set_resched(false);

        if (hard)
        {
            vm->set_action(VMActions::UNDEPLOY_HARD_ACTION, la.uid(), la.gid(),
                    la.req_id());

            vmm->trigger(VMMAction::CANCEL,vid);
        }
        else
        {
            vm->set_action(VMActions::UNDEPLOY_ACTION, la.uid(), la.gid(),
                    la.req_id());

            vmm->trigger(VMMAction::SHUTDOWN,vid);
        }

        VectorAttribute * graphics = vm->get_template_attribute("GRAPHICS");

        if ( graphics != 0 && (graphics->vector_value("PORT", port) == 0))
        {
            graphics->remove("PORT");
            clpool->release_vnc_port(vm->get_cid(), port);
        }

        vmpool->update_history(vm);

        vmpool->update(vm);
    }
    else if (vm->get_state() == VirtualMachine::POWEROFF)
    {
        //----------------------------------------------------
        //   Bypass SHUTDOWN_UNDEPLOY
        //----------------------------------------------------

        vm->set_state(VirtualMachine::ACTIVE);
        vm->set_state(VirtualMachine::EPILOG_UNDEPLOY);

        vm->set_action(VMActions::UNDEPLOY_ACTION, la.uid(), la.gid(),
                    la.req_id());

        vm->set_epilog_stime(time(0));

        vmpool->update_history(vm);

        vmpool->update(vm);

        //----------------------------------------------------

        tm->trigger(TMAction::EPILOG_STOP,vid);
    }
    else
    {
        vm->log("LCM", Log::ERROR, "undeploy_action, VM in a wrong state.");
    }

    vm->unlock();

    return;
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::poweroff_action(const LCMAction& la)
{
    int vid = la.vm_id();

    poweroff_action(vid, false, la);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::poweroff_hard_action(const LCMAction& la)
{
    int vid = la.vm_id();

    poweroff_action(vid, true, la);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::poweroff_action(int vid, bool hard, const LCMAction& la)
{
    VirtualMachine * vm = vmpool->get(vid);

    if ( vm == 0 )
    {
        return;
    }

    if (vm->get_state()     == VirtualMachine::ACTIVE &&
        (vm->get_lcm_state() == VirtualMachine::RUNNING ||
         vm->get_lcm_state() == VirtualMachine::UNKNOWN))
    {
        //----------------------------------------------------
        //             SHUTDOWN_POWEROFF STATE
        //----------------------------------------------------

        vm->set_state(VirtualMachine::SHUTDOWN_POWEROFF);

        vm->set_resched(false);

        if (hard)
        {
            vm->set_action(VMActions::POWEROFF_HARD_ACTION, la.uid(), la.gid(),
                    la.req_id());

            vmm->trigger(VMMAction::CANCEL,vid);
        }
        else
        {
            vm->set_action(VMActions::POWEROFF_ACTION, la.uid(), la.gid(),
                    la.req_id());

            vmm->trigger(VMMAction::SHUTDOWN,vid);
        }

        vmpool->update_history(vm);

        vmpool->update(vm);
    }
    else
    {
        vm->log("LCM", Log::ERROR, "poweroff_action, VM in a wrong state.");
    }

    vm->unlock();

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::restore_action(const LCMAction& la)
{
    ostringstream os;

    int vid = la.vm_id();

    VirtualMachine * vm = vmpool->get(vid);

    if ( vm == 0 )
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

        vm->cp_history();

        vm->set_stime(the_time);

        vm->set_last_poll(0);

        vm->set_running_stime(the_time);

        vm->set_action(VMActions::RESUME_ACTION, la.uid(), la.gid(), la.req_id());

        vmpool->insert_history(vm);

        vmpool->update(vm);

        //----------------------------------------------------

        vmm->trigger(VMMAction::RESTORE,vid);
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

void  LifeCycleManager::restart_action(const LCMAction& la)
{
    int vid = la.vm_id();

    VirtualMachine * vm = vmpool->get(vid);

    if ( vm == 0 )
    {
        return;
    }

    if (vm->get_state() == VirtualMachine::ACTIVE &&
        vm->get_lcm_state() == VirtualMachine::UNKNOWN)
    {
        vm->set_state(VirtualMachine::BOOT_UNKNOWN);

        vmpool->update(vm);

        vmm->trigger(VMMAction::DEPLOY, vid);
    }
    else if ( vm->get_state() == VirtualMachine::POWEROFF )
    {
        time_t the_time = time(0);

        vm->set_state(VirtualMachine::ACTIVE);

        vm->set_state(VirtualMachine::BOOT_POWEROFF);

        vm->cp_history();

        vm->set_stime(the_time);

        vm->set_last_poll(0);

        vm->set_running_stime(the_time);

        vm->set_action(VMActions::RESUME_ACTION, la.uid(), la.gid(), la.req_id());

        vmpool->insert_history(vm);

        vmpool->update(vm);

        vmm->trigger(VMMAction::DEPLOY, vid);
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

void LifeCycleManager::delete_action(const LCMAction& la)
{
    int image_id = -1;
    int vid      = la.vm_id();

    VirtualMachine * vm = vmpool->get(vid);

    if ( vm == 0 )
    {
        return;
    }

    if ( vm->get_state() != VirtualMachine::ACTIVE )
    {
        vm->log("LCM", Log::ERROR, "clean_action, VM in a wrong state.");
        vm->unlock();

        return;
    }

    switch(vm->get_lcm_state())
    {
        case VirtualMachine::CLEANUP_RESUBMIT:
            vm->set_state(VirtualMachine::CLEANUP_DELETE);
            vmpool->update(vm);

        case VirtualMachine::CLEANUP_DELETE:
            dm->trigger(DMAction::DONE, vid);
        break;

        default:
            clean_up_vm(vm, true, image_id, la);
            dm->trigger(DMAction::DONE, vid);
        break;
    }

    vm->unlock();

    if ( image_id != -1 )
    {
        Image * image = ipool->get(image_id);

        if ( image != 0 )
        {
            image->set_state(Image::ERROR);

            ipool->update(image);

            image->unlock();
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::delete_recreate_action(const LCMAction& la)
{
    Template * vm_quotas_snp = 0;

    vector<Template *> ds_quotas_snp;

    int vm_uid, vm_gid;

    VirtualMachine * vm;

    int image_id = -1;

    int vid = la.vm_id();

    vm = vmpool->get(vid);

    if ( vm == 0 )
    {
        return;
    }

    if ( vm->get_state() != VirtualMachine::ACTIVE )
    {
        vm->log("LCM", Log::ERROR, "clean_action, VM in a wrong state.");
        vm->unlock();

        return;
    }

    switch(vm->get_lcm_state())
    {
        case VirtualMachine::CLEANUP_DELETE:
            vm->log("LCM", Log::ERROR, "clean_action, VM in a wrong state.");
        break;

        case VirtualMachine::CLEANUP_RESUBMIT:
            dm->trigger(DMAction::RESUBMIT, vid);
        break;

        default:
            vm_uid = vm->get_uid();
            vm_gid = vm->get_gid();

            clean_up_vm(vm, false, image_id, la);

            vm->delete_non_persistent_disk_snapshots(&vm_quotas_snp,
                    ds_quotas_snp);

            vmpool->update(vm);
        break;
    }

    vm->unlock();

    if ( image_id != -1 )
    {
        Image* image = ipool->get(image_id);

        if ( image != 0 )
        {
            image->set_state(Image::ERROR);

            ipool->update(image);

            image->unlock();
        }
    }

    if ( !ds_quotas_snp.empty() )
    {
        Quotas::ds_del_recreate(vm_uid, vm_gid, ds_quotas_snp);
    }

    if ( vm_quotas_snp != 0 )
    {
        Quotas::vm_del(vm_uid, vm_gid, vm_quotas_snp);

        delete vm_quotas_snp;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void LifeCycleManager::clean_up_vm(VirtualMachine * vm, bool dispose,
        int& image_id, const LCMAction& la)
{
    HostShareCapacity sr;

    unsigned int port;

    time_t the_time = time(0);

    VirtualMachine::LcmState state = vm->get_lcm_state();
    int vid   = vm->get_oid();

    if (dispose)
    {
        vm->set_state(VirtualMachine::CLEANUP_DELETE);
        vm->set_action(VMActions::DELETE_ACTION, la.uid(), la.gid(), la.req_id());
    }
    else
    {
        vm->set_state(VirtualMachine::CLEANUP_RESUBMIT);
        vm->set_action(VMActions::DELETE_RECREATE_ACTION, la.uid(), la.gid(),
                    la.req_id());
    }

    vm->set_resched(false);

    if ( !vmm->is_keep_snapshots(vm->get_vmm_mad()) )
    {
        vm->delete_snapshots();
    }

    vm->reset_info();

    vm->set_etime(the_time);
    vm->set_vm_info();

    vm->get_capacity(sr);

    hpool->del_capacity(vm->get_hid(), sr);

    const VectorAttribute * graphics = vm->get_template_attribute("GRAPHICS");

    if ( graphics != 0 && (graphics->vector_value("PORT", port) == 0))
    {
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

            tm->trigger(TMAction::DRIVER_CANCEL,vid);
            tm->trigger(TMAction::EPILOG_DELETE,vid);
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

            vmm->trigger(VMMAction::DRIVER_CANCEL,vid);
            vmm->trigger(VMMAction::CLEANUP,vid);
        break;

        case VirtualMachine::HOTPLUG:
            vm->clear_attach_disk();

            vm->set_running_etime(the_time);

            vmm->trigger(VMMAction::DRIVER_CANCEL,vid);
            vmm->trigger(VMMAction::CLEANUP,vid);
        break;

        case VirtualMachine::HOTPLUG_NIC:
            vm->clear_attach_nic();

            vm->set_running_etime(the_time);

            vmm->trigger(VMMAction::DRIVER_CANCEL,vid);
            vmm->trigger(VMMAction::CLEANUP,vid);
        break;

        case VirtualMachine::HOTPLUG_SAVEAS:
            image_id = vm->clear_saveas_disk();

            vm->set_running_etime(the_time);

            vmm->trigger(VMMAction::DRIVER_CANCEL,vid);
            vmm->trigger(VMMAction::CLEANUP,vid);
        break;

        case VirtualMachine::HOTPLUG_SAVEAS_POWEROFF:
        case VirtualMachine::HOTPLUG_SAVEAS_SUSPENDED:
            image_id = vm->clear_saveas_disk();

            vm->set_running_etime(the_time);

            tm->trigger(TMAction::DRIVER_CANCEL, vid);
            tm->trigger(TMAction::EPILOG_DELETE, vid);
        break;

        case VirtualMachine::HOTPLUG_PROLOG_POWEROFF:
        case VirtualMachine::HOTPLUG_EPILOG_POWEROFF:
            vm->clear_attach_disk();

            tm->trigger(TMAction::DRIVER_CANCEL,vid);
            tm->trigger(TMAction::EPILOG_DELETE,vid);
        break;

        case VirtualMachine::DISK_SNAPSHOT_POWEROFF:
        case VirtualMachine::DISK_SNAPSHOT_REVERT_POWEROFF:
        case VirtualMachine::DISK_SNAPSHOT_DELETE_POWEROFF:
        case VirtualMachine::DISK_SNAPSHOT_SUSPENDED:
        case VirtualMachine::DISK_SNAPSHOT_REVERT_SUSPENDED:
        case VirtualMachine::DISK_SNAPSHOT_DELETE_SUSPENDED:
        case VirtualMachine::DISK_SNAPSHOT_DELETE:
            vm->clear_snapshot_disk();

            tm->trigger(TMAction::DRIVER_CANCEL, vid);
            tm->trigger(TMAction::EPILOG_DELETE,vid);
        break;

        case VirtualMachine::DISK_SNAPSHOT:
            vm->clear_snapshot_disk();

            vm->set_running_etime(the_time);

            vmm->trigger(VMMAction::DRIVER_CANCEL,vid);
            vmm->trigger(VMMAction::CLEANUP,vid);
        break;

        case VirtualMachine::DISK_RESIZE:
            vm->clear_resize_disk(true);

            vm->set_running_etime(the_time);

            vmm->trigger(VMMAction::DRIVER_CANCEL,vid);
            vmm->trigger(VMMAction::CLEANUP,vid);
        break;

        case VirtualMachine::DISK_RESIZE_POWEROFF:
        case VirtualMachine::DISK_RESIZE_UNDEPLOYED:
            vm->clear_resize_disk(true);

            tm->trigger(TMAction::DRIVER_CANCEL, vid);
            tm->trigger(TMAction::EPILOG_DELETE,vid);
        break;

        case VirtualMachine::MIGRATE:
            vm->set_running_etime(the_time);

            vm->set_previous_etime(the_time);
            vm->set_previous_vm_info();
            vm->set_previous_running_etime(the_time);

            hpool->del_capacity(vm->get_previous_hid(), sr);

            vmpool->update_previous_history(vm);

            vmm->trigger(VMMAction::DRIVER_CANCEL,vid);
            vmm->trigger(VMMAction::CLEANUP_BOTH,vid);
        break;

        case VirtualMachine::SAVE_STOP:
        case VirtualMachine::SAVE_SUSPEND:
            vm->set_running_etime(the_time);

            vmm->trigger(VMMAction::DRIVER_CANCEL,vid);
            vmm->trigger(VMMAction::CLEANUP,vid);
        break;

        case VirtualMachine::SAVE_MIGRATE:
            vm->set_running_etime(the_time);

            vm->set_previous_etime(the_time);
            vm->set_previous_vm_info();
            vm->set_previous_running_etime(the_time);

            hpool->del_capacity(vm->get_previous_hid(), sr);

            vmpool->update_previous_history(vm);

            vmm->trigger(VMMAction::DRIVER_CANCEL,vid);
            vmm->trigger(VMMAction::CLEANUP_PREVIOUS,vid);
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

            tm->trigger(TMAction::DRIVER_CANCEL,vid);
            tm->trigger(TMAction::EPILOG_DELETE_BOTH,vid);
        break;

        case VirtualMachine::EPILOG_STOP:
        case VirtualMachine::EPILOG_UNDEPLOY:
        case VirtualMachine::EPILOG:
        case VirtualMachine::EPILOG_FAILURE:
        case VirtualMachine::EPILOG_STOP_FAILURE:
        case VirtualMachine::EPILOG_UNDEPLOY_FAILURE:
            vm->set_epilog_etime(the_time);

            tm->trigger(TMAction::DRIVER_CANCEL,vid);
            tm->trigger(TMAction::EPILOG_DELETE,vid);
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
    LCMAction::Actions lcm_action = LCMAction::NONE;

    switch (vm->get_lcm_state())
    {
        //----------------------------------------------------------------------
        // Direct recovery states
        //----------------------------------------------------------------------
        case VirtualMachine::LCM_INIT:
        case VirtualMachine::RUNNING:
            return;

        case VirtualMachine::CLEANUP_DELETE:
            dm->trigger(DMAction::DONE, vm->get_oid());
            return;

        case VirtualMachine::CLEANUP_RESUBMIT:
            dm->trigger(DMAction::RESUBMIT, vm->get_oid());
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
                lcm_action = LCMAction::PROLOG_SUCCESS;
            }
            else
            {
                lcm_action = LCMAction::PROLOG_FAILURE;
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
                lcm_action = LCMAction::EPILOG_SUCCESS;
            }
            else
            {
                lcm_action = LCMAction::EPILOG_FAILURE;
            }
        break;

        case VirtualMachine::HOTPLUG_SAVEAS:
        case VirtualMachine::HOTPLUG_SAVEAS_POWEROFF:
        case VirtualMachine::HOTPLUG_SAVEAS_SUSPENDED:
            if (success)
            {
                lcm_action = LCMAction::SAVEAS_SUCCESS;
            }
            else
            {
                lcm_action = LCMAction::SAVEAS_FAILURE;
            }
        break;

        case VirtualMachine::HOTPLUG_PROLOG_POWEROFF:
            if (success)
            {
                lcm_action = LCMAction::ATTACH_SUCCESS;
            }
            else
            {
                lcm_action = LCMAction::ATTACH_FAILURE;
            }
        break;

        case VirtualMachine::HOTPLUG_EPILOG_POWEROFF:
            if (success)
            {
                lcm_action = LCMAction::DETACH_SUCCESS;
            }
            else
            {
                lcm_action = LCMAction::DETACH_FAILURE;
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

                lcm_action = LCMAction::DEPLOY_SUCCESS;
            }
            else
            {
                lcm_action = LCMAction::DEPLOY_FAILURE;
            }
        break;

        case VirtualMachine::SHUTDOWN:
        case VirtualMachine::SHUTDOWN_POWEROFF:
        case VirtualMachine::SHUTDOWN_UNDEPLOY:
            if (success)
            {
                lcm_action = LCMAction::SHUTDOWN_SUCCESS;
            }
            else
            {
                lcm_action = LCMAction::SHUTDOWN_FAILURE;
            }
        break;

        case VirtualMachine::SAVE_STOP:
        case VirtualMachine::SAVE_SUSPEND:
        case VirtualMachine::SAVE_MIGRATE:
            if (success)
            {
                lcm_action = LCMAction::SAVE_SUCCESS;
            }
            else
            {
                lcm_action = LCMAction::SAVE_FAILURE;
            }
        break;

        case VirtualMachine::HOTPLUG:
            if (success)
            {
                lcm_action = LCMAction::ATTACH_SUCCESS;
            }
            else
            {
                lcm_action = LCMAction::ATTACH_FAILURE;
            }
        break;

        case VirtualMachine::HOTPLUG_NIC:
            if (success)
            {
                lcm_action = LCMAction::ATTACH_NIC_SUCCESS;
            }
            else
            {
                lcm_action = LCMAction::ATTACH_NIC_FAILURE;
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

                    lcm_action = LCMAction::SNAPSHOT_CREATE_SUCCESS;
                }
                else if ( action == "REVERT" )
                {
                    lcm_action = LCMAction::SNAPSHOT_REVERT_SUCCESS;
                }
                else if  ( action == "DELETE" )
                {
                    lcm_action = LCMAction::SNAPSHOT_DELETE_SUCCESS;
                }
            }
            else
            {
                if ( action == "CREATE" )
                {
                    lcm_action = LCMAction::SNAPSHOT_CREATE_FAILURE;
                }
                else if ( action == "REVERT" )
                {
                    lcm_action = LCMAction::SNAPSHOT_REVERT_FAILURE;
                }
                else if  ( action == "DELETE" )
                {
                    lcm_action = LCMAction::SNAPSHOT_DELETE_FAILURE;
                }
            }
        break;

        case VirtualMachine::DISK_SNAPSHOT_POWEROFF:
        case VirtualMachine::DISK_SNAPSHOT_REVERT_POWEROFF:
        case VirtualMachine::DISK_SNAPSHOT_DELETE_POWEROFF:
        case VirtualMachine::DISK_SNAPSHOT_SUSPENDED:
        case VirtualMachine::DISK_SNAPSHOT_REVERT_SUSPENDED:
        case VirtualMachine::DISK_SNAPSHOT_DELETE_SUSPENDED:
        case VirtualMachine::DISK_SNAPSHOT:
        case VirtualMachine::DISK_SNAPSHOT_DELETE:
            if (success)
            {
                lcm_action = LCMAction::DISK_SNAPSHOT_SUCCESS;
            }
            else
            {
                lcm_action = LCMAction::DISK_SNAPSHOT_FAILURE;
            }
        break;

        case VirtualMachine::DISK_RESIZE_POWEROFF:
        case VirtualMachine::DISK_RESIZE_UNDEPLOYED:
        case VirtualMachine::DISK_RESIZE:
            if (success)
            {
                lcm_action = LCMAction::DISK_RESIZE_SUCCESS;
            }
            else
            {
                lcm_action = LCMAction::DISK_RESIZE_FAILURE;
            }
        break;
    }

    if (lcm_action != LCMAction::NONE)
    {
        trigger(lcm_action, vm->get_oid(), ra);
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

            vmm->trigger(VMMAction::DEPLOY, vid);
            break;

        case VirtualMachine::BOOT_MIGRATE_FAILURE:
            vm->set_state(VirtualMachine::BOOT_MIGRATE);

            vmpool->update(vm);

            vmm->trigger(VMMAction::RESTORE, vid);
            break;

        case VirtualMachine::BOOT_UNDEPLOY_FAILURE:
            vm->set_state(VirtualMachine::BOOT_UNDEPLOY);

            vmpool->update(vm);

            vmm->trigger(VMMAction::DEPLOY, vid);
            break;

        case VirtualMachine::BOOT_STOPPED_FAILURE:
            vm->set_state(VirtualMachine::BOOT_STOPPED);

            vmpool->update(vm);

            vmm->trigger(VMMAction::RESTORE, vid);
            break;

        case VirtualMachine::PROLOG_MIGRATE_FAILURE:
            vm->set_state(VirtualMachine::PROLOG_MIGRATE);

            vmpool->update(vm);

            tm->trigger(TMAction::PROLOG_MIGR, vid);
            break;

        case VirtualMachine::PROLOG_MIGRATE_POWEROFF_FAILURE:
            vm->set_state(VirtualMachine::PROLOG_MIGRATE_POWEROFF);

            vmpool->update(vm);

            tm->trigger(TMAction::PROLOG_MIGR, vid);
            break;


        case VirtualMachine::PROLOG_MIGRATE_SUSPEND_FAILURE:
            vm->set_state(VirtualMachine::PROLOG_MIGRATE_SUSPEND);

            vmpool->update(vm);

            tm->trigger(TMAction::PROLOG_MIGR, vid);
            break;

        case VirtualMachine::PROLOG_MIGRATE_UNKNOWN_FAILURE:
            vm->set_state(VirtualMachine::PROLOG_MIGRATE_UNKNOWN);

            vmpool->update(vm);

            tm->trigger(TMAction::PROLOG_MIGR, vid);
            break;

        case VirtualMachine::PROLOG_RESUME_FAILURE:
            vm->set_state(VirtualMachine::PROLOG_RESUME);

            vmpool->update(vm);

            tm->trigger(TMAction::PROLOG_RESUME,vid);
            break;

        case VirtualMachine::PROLOG_UNDEPLOY_FAILURE:
            vm->set_state(VirtualMachine::PROLOG_UNDEPLOY);

            vmpool->update(vm);

            tm->trigger(TMAction::PROLOG_RESUME,vid);
            break;

        case VirtualMachine::PROLOG_FAILURE:
            vm->set_state(VirtualMachine::PROLOG);

            vmpool->update(vm);

            tm->trigger(TMAction::PROLOG,vid);
            break;

        case VirtualMachine::EPILOG_FAILURE:
            vm->set_state(VirtualMachine::EPILOG);

            vmpool->update(vm);

            tm->trigger(TMAction::EPILOG,vid);
            break;

        case VirtualMachine::EPILOG_STOP_FAILURE:
            vm->set_state(VirtualMachine::EPILOG_STOP);

            vmpool->update(vm);

            tm->trigger(TMAction::EPILOG_STOP,vid);
            break;

       case VirtualMachine::EPILOG_UNDEPLOY_FAILURE:
            vm->set_state(VirtualMachine::EPILOG_UNDEPLOY);

            vmpool->update(vm);

            tm->trigger(TMAction::EPILOG_STOP,vid);
            break;

        case VirtualMachine::BOOT_MIGRATE:
        case VirtualMachine::BOOT_SUSPENDED:
        case VirtualMachine::BOOT_STOPPED:
        case VirtualMachine::BOOT_UNDEPLOY:
            vmm->trigger(VMMAction::RESTORE, vid);
            break;

        case VirtualMachine::BOOT:
        case VirtualMachine::BOOT_POWEROFF:
        case VirtualMachine::BOOT_UNKNOWN:
            vmm->trigger(VMMAction::DEPLOY, vid);
            break;

        case VirtualMachine::SHUTDOWN:
        case VirtualMachine::SHUTDOWN_POWEROFF:
        case VirtualMachine::SHUTDOWN_UNDEPLOY:
            if (vm->get_action() == VMActions::TERMINATE_ACTION)
            {
                vmm->trigger(VMMAction::SHUTDOWN,vid);
            }
            else
            {
                vmm->trigger(VMMAction::CANCEL,vid);
            }
            break;

        case VirtualMachine::SAVE_STOP:
        case VirtualMachine::SAVE_SUSPEND:
        case VirtualMachine::SAVE_MIGRATE:
            vmm->trigger(VMMAction::SAVE,vid);
            break;

        case VirtualMachine::MIGRATE:
            vmm->trigger(VMMAction::MIGRATE,vid);
            break;

        case VirtualMachine::PROLOG:
            tm->trigger(TMAction::PROLOG,vid);
            break;

        case VirtualMachine::PROLOG_MIGRATE:
        case VirtualMachine::PROLOG_MIGRATE_POWEROFF:
        case VirtualMachine::PROLOG_MIGRATE_SUSPEND:
        case VirtualMachine::PROLOG_MIGRATE_UNKNOWN:
            tm->trigger(TMAction::PROLOG_MIGR,vid);
            break;

        case VirtualMachine::PROLOG_RESUME:
        case VirtualMachine::PROLOG_UNDEPLOY:
            tm->trigger(TMAction::PROLOG_RESUME,vid);
            break;

        case VirtualMachine::EPILOG:
            tm->trigger(TMAction::EPILOG,vid);
            break;

        case VirtualMachine::EPILOG_STOP:
        case VirtualMachine::EPILOG_UNDEPLOY:
            tm->trigger(TMAction::EPILOG_STOP,vid);
            break;

        case VirtualMachine::LCM_INIT:
        case VirtualMachine::CLEANUP_RESUBMIT:
        case VirtualMachine::CLEANUP_DELETE:
        case VirtualMachine::HOTPLUG:
        case VirtualMachine::HOTPLUG_NIC:
        case VirtualMachine::HOTPLUG_SNAPSHOT:
        case VirtualMachine::HOTPLUG_SAVEAS:
        case VirtualMachine::HOTPLUG_SAVEAS_POWEROFF:
        case VirtualMachine::HOTPLUG_SAVEAS_SUSPENDED:
        case VirtualMachine::HOTPLUG_PROLOG_POWEROFF:
        case VirtualMachine::HOTPLUG_EPILOG_POWEROFF:
        case VirtualMachine::DISK_SNAPSHOT_POWEROFF:
        case VirtualMachine::DISK_SNAPSHOT_REVERT_POWEROFF:
        case VirtualMachine::DISK_SNAPSHOT_DELETE_POWEROFF:
        case VirtualMachine::DISK_SNAPSHOT_SUSPENDED:
        case VirtualMachine::DISK_SNAPSHOT_REVERT_SUSPENDED:
        case VirtualMachine::DISK_SNAPSHOT_DELETE_SUSPENDED:
        case VirtualMachine::DISK_SNAPSHOT:
        case VirtualMachine::DISK_SNAPSHOT_DELETE:
        case VirtualMachine::DISK_RESIZE:
        case VirtualMachine::DISK_RESIZE_POWEROFF:
        case VirtualMachine::DISK_RESIZE_UNDEPLOYED:
        case VirtualMachine::RUNNING:
        case VirtualMachine::UNKNOWN:
            break;
    }

    return;
}

/*  -------------------------------------------------------------------------- */
/*  -------------------------------------------------------------------------- */

void  LifeCycleManager::updatesg_action(const LCMAction& la)
{
    int  vmid, rc;
    VirtualMachine * vm;

    int sgid = la.vm_id();
    SecurityGroup  * sg = sgpool->get(sgid);

    if ( sg == 0 )
    {
        return;
    }

    // -------------------------------------------------------------------------
    // Iterate over SG VMs, rules at hypervisor are updated one by one
    // -------------------------------------------------------------------------
    do
    {
        bool is_error = false;
        bool is_tmpl  = false;
        bool is_update= false;

        rc = sg->get_outdated(vmid);

        sgpool->update(sg);

        sg->unlock();

        if ( rc != 0 )
        {
            return;
        }

        vm = vmpool->get(vmid);

        if ( vm == 0 )
        {
            continue;
        }

        VirtualMachine::LcmState lstate = vm->get_lcm_state();
        VirtualMachine::VmState  state  = vm->get_state();

        if ( state != VirtualMachine::ACTIVE ) //Update just VM information
        {
            is_tmpl = true;
        }
        else
        {
            switch (lstate)
            {
                //Cannnot update these VMs, SG rules being updated/created
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
                case VirtualMachine::DISK_SNAPSHOT_REVERT_SUSPENDED:
                case VirtualMachine::DISK_SNAPSHOT_DELETE_SUSPENDED:
                case VirtualMachine::HOTPLUG_SAVEAS_POWEROFF:
                case VirtualMachine::HOTPLUG_SAVEAS_SUSPENDED:
                case VirtualMachine::HOTPLUG_PROLOG_POWEROFF:
                case VirtualMachine::HOTPLUG_EPILOG_POWEROFF:
                    is_tmpl = true;
                    break;

                //Update VM information + SG rules at host
                case VirtualMachine::RUNNING:
                case VirtualMachine::HOTPLUG:
                case VirtualMachine::HOTPLUG_SNAPSHOT:
                case VirtualMachine::HOTPLUG_SAVEAS:
                case VirtualMachine::DISK_SNAPSHOT:
                case VirtualMachine::DISK_SNAPSHOT_DELETE:
                case VirtualMachine::DISK_RESIZE:
                    is_update = true;
                    break;
            }
        }

        // ---------------------------------------------------------------------
        // Update VM template with the new security group rules & trigger update
        // ---------------------------------------------------------------------
        if ( is_tmpl || is_update )
        {
            vector<VectorAttribute *> sg_rules;

            sgpool->get_security_group_rules(-1, sgid, sg_rules);

            vm->remove_security_group(sgid);

            vm->add_template_attribute(sg_rules);

            vmpool->update(vm);
        }

        if ( is_update )
        {
            vmm->updatesg(vm, sgid);
        }

        vm->unlock();

        sg = sgpool->get(sgid);

        if ( sg == 0 )
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

        sgpool->update(sg);

        if (is_update)
        {
            sg->unlock();
            return;
        }
    } while (true);
}

