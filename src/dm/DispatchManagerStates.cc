/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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

#include "DispatchManager.h"
#include "NebulaLog.h"
#include "Quotas.h"
#include "Nebula.h"

void  DispatchManager::suspend_success_action(int vid)
{
    VirtualMachine *    vm;
    VirtualMachineTemplate * clone_tmpl;
    string error_str;

    int uid, gid;

    vm = vmpool->get(vid);

    if ( vm == 0 )
    {
        return;
    }

    clone_tmpl = vm->clone_template();

    if ((vm->get_state() == VirtualMachine::ACTIVE) &&
        (vm->get_lcm_state() == VirtualMachine::SAVE_SUSPEND ||
         vm->get_lcm_state() == VirtualMachine::PROLOG_MIGRATE_SUSPEND ||
         vm->get_lcm_state() == VirtualMachine::PROLOG_MIGRATE_SUSPEND_FAILURE||
         vm->get_lcm_state() == VirtualMachine::DISK_SNAPSHOT_SUSPENDED ||
         vm->get_lcm_state() == VirtualMachine::DISK_SNAPSHOT_REVERT_SUSPENDED||
         vm->get_lcm_state() == VirtualMachine::DISK_SNAPSHOT_DELETE_SUSPENDED))
    {
        vm->set_state(VirtualMachine::SUSPENDED);

        vm->set_state(VirtualMachine::LCM_INIT);

        vmpool->update(vm);
    }
    else
    {
        ostringstream oss;

        oss << "suspend_success action received but VM " << vid
            << " not in ACTIVE state";
        NebulaLog::log("DiM",Log::ERROR,oss);

        vm->unlock();
        return;
    }

    clone_tmpl->add("PREV_STATE", vm->get_prev_state());
    clone_tmpl->add("STATE", vm->get_state());

    uid = vm->get_uid();
    gid = vm->get_gid();

    vm->unlock();

    Quotas::vm_del(uid, gid, clone_tmpl);

    delete clone_tmpl;

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  DispatchManager::stop_success_action(int vid)
{
    VirtualMachine *    vm;
    VirtualMachineTemplate * clone_tmpl;
    string error_str;

    int uid, gid;

    vm = vmpool->get(vid);

    if ( vm == 0 )
    {
        return;
    }

    clone_tmpl = vm->clone_template();

    if ((vm->get_state() == VirtualMachine::ACTIVE) &&
        (vm->get_lcm_state() == VirtualMachine::EPILOG_STOP ||
         vm->get_lcm_state() == VirtualMachine::PROLOG_RESUME))
    {
        vm->set_state(VirtualMachine::STOPPED);

        vm->set_state(VirtualMachine::LCM_INIT);

        //Set history action field to perform the right TM command on resume
        if (vm->get_action() == History::NONE_ACTION)
        {
            vm->set_internal_action(History::STOP_ACTION);

            vmpool->update_history(vm);
        }

        vmpool->update(vm);
    }
    else
    {
        ostringstream oss;

        oss << "stop_success action received but VM " << vid
            << " not in ACTIVE state";
        NebulaLog::log("DiM",Log::ERROR,oss);
        vm->unlock();
        return;
    }

    clone_tmpl->add("PREV_STATE", vm->get_prev_state());
    clone_tmpl->add("STATE", vm->get_state());

    uid = vm->get_uid();
    gid = vm->get_gid();

    vm->unlock();

    Quotas::vm_del(uid, gid, clone_tmpl);

    delete clone_tmpl;

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  DispatchManager::undeploy_success_action(int vid)
{
    VirtualMachine *    vm;
    VirtualMachineTemplate * clone_tmpl;
    string error_str;

    int uid, gid;

    vm = vmpool->get(vid);

    if ( vm == 0 )
    {
        return;
    }

    clone_tmpl = vm->clone_template();

    if ((vm->get_state() == VirtualMachine::ACTIVE) &&
        (vm->get_lcm_state() == VirtualMachine::EPILOG_UNDEPLOY ||
         vm->get_lcm_state() == VirtualMachine::DISK_RESIZE_UNDEPLOYED ||
         vm->get_lcm_state() == VirtualMachine::PROLOG_UNDEPLOY))
    {
        vm->set_state(VirtualMachine::UNDEPLOYED);

        vm->set_state(VirtualMachine::LCM_INIT);

        //Set history action field to perform the right TM command on resume
        if (vm->get_action() == History::NONE_ACTION)
        {
            vm->set_internal_action(History::UNDEPLOY_ACTION);

            vmpool->update_history(vm);
        }

        vmpool->update(vm);
    }
    else
    {
        ostringstream oss;

        oss << "undeploy_success action received but VM " << vid
            << " not in ACTIVE state";
        NebulaLog::log("DiM",Log::ERROR,oss);

        vm->unlock();
        return;
    }

    clone_tmpl->add("PREV_STATE", vm->get_prev_state());
    clone_tmpl->add("STATE", vm->get_state());

    uid = vm->get_uid();
    gid = vm->get_gid();

    vm->unlock();

    Quotas::vm_del(uid, gid, clone_tmpl);

    delete clone_tmpl;

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  DispatchManager::poweroff_success_action(int vid)
{
    VirtualMachine *    vm;
    VirtualMachineTemplate * clone_tmpl;
    string error_str;

    int uid, gid;

    vm = vmpool->get(vid);

    if ( vm == 0 )
    {
        return;
    }

    clone_tmpl = vm->clone_template();
    clone_tmpl->add("STATE", vm->get_state());

    if ((vm->get_state() == VirtualMachine::ACTIVE) &&
        (vm->get_lcm_state() == VirtualMachine::SHUTDOWN_POWEROFF ||
         vm->get_lcm_state() == VirtualMachine::HOTPLUG_PROLOG_POWEROFF ||
         vm->get_lcm_state() == VirtualMachine::HOTPLUG_EPILOG_POWEROFF ||
         vm->get_lcm_state() == VirtualMachine::PROLOG_MIGRATE_POWEROFF ||
         vm->get_lcm_state() == VirtualMachine::DISK_SNAPSHOT_POWEROFF ||
         vm->get_lcm_state() == VirtualMachine::DISK_SNAPSHOT_REVERT_POWEROFF ||
         vm->get_lcm_state() == VirtualMachine::DISK_SNAPSHOT_DELETE_POWEROFF ||
         vm->get_lcm_state() == VirtualMachine::DISK_RESIZE_POWEROFF ||
         vm->get_lcm_state() == VirtualMachine::PROLOG_MIGRATE_POWEROFF_FAILURE))
    {
        vm->set_state(VirtualMachine::POWEROFF);

        vm->set_state(VirtualMachine::LCM_INIT);

        vmpool->update(vm);
    }
    else
    {
        ostringstream oss;

        oss << "poweroff_success action received but VM " << vid
            << " not in ACTIVE state";
        NebulaLog::log("DiM",Log::ERROR,oss);

        vm->unlock();
        return;
    }

    clone_tmpl->add("PREV_STATE", vm->get_prev_state());
    clone_tmpl->add("STATE", vm->get_state());

    uid = vm->get_uid();
    gid = vm->get_gid();

    vm->unlock();

    Quotas::vm_del(uid, gid, clone_tmpl);

    delete clone_tmpl;

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  DispatchManager::done_action(int vid)
{
    VirtualMachine * vm;
    VirtualMachineTemplate * clone_tmpl;
    string error_str;

    int uid, gid;

    VirtualMachine::LcmState lcm_state;
    VirtualMachine::VmState  dm_state;

    vm = vmpool->get(vid);

    if ( vm == 0 )
    {
        return;
    }

    clone_tmpl = vm->clone_template();

    lcm_state = vm->get_lcm_state();
    dm_state  = vm->get_state();

    clone_tmpl->add("PREV_STATE", dm_state);
    clone_tmpl->add("STATE", VirtualMachine::DONE);

    uid = vm->get_uid();
    gid = vm->get_gid();

    if ((dm_state == VirtualMachine::ACTIVE) &&
          (lcm_state == VirtualMachine::EPILOG ||
           lcm_state == VirtualMachine::CLEANUP_DELETE))
    {
        free_vm_resources(vm);
    }
    else
    {
        ostringstream oss;

        oss << "done action received but VM " << vid << " not in ACTIVE state";
        NebulaLog::log("DiM",Log::ERROR,oss);

        vm->unlock();
    }

    Quotas::vm_del(uid, gid, clone_tmpl);

    delete clone_tmpl;

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  DispatchManager::resubmit_action(int vid)
{
    VirtualMachine * vm;
    VirtualMachineTemplate * clone_tmpl;
    User * user;
    string error_str;

    int uid, rc;

    vm = vmpool->get(vid);

    if ( vm == 0 )
    {
        return;
    }

    if (vm->get_lcm_state() == VirtualMachine::CLEANUP_RESUBMIT)
    {
        // Automatic requirements are not recalculated on purpose

        vm->set_state(VirtualMachine::LCM_INIT);

        vm->set_state(VirtualMachine::PENDING);

        clone_tmpl = vm->clone_template();

        vmpool->update(vm);

        uid = vm->get_uid();

        vm->unlock();

        user = upool->get(uid);

        if ( user == 0 )
        {
            return;
        }

        DefaultQuotas default_quotas = Nebula::instance().get_default_user_quota();

        rc = user->quota.quota_check(Quotas::VIRTUALMACHINE, clone_tmpl, default_quotas, error_str);

        if (rc == true)
        {
            upool->update_quotas(user);
        }

        delete clone_tmpl;

        user->unlock();
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
