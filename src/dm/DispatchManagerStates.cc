/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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
#include "VirtualMachinePool.h"

using namespace std;


void DispatchManager::trigger_suspend_success(int vid)
{
    trigger([this, vid]
    {
        auto vm = vmpool->get(vid);

        if (!vm)
        {
            return;
        }

        if ((vm->get_state() == VirtualMachine::ACTIVE) &&
            (vm->get_lcm_state() == VirtualMachine::SAVE_SUSPEND ||
             vm->get_lcm_state() == VirtualMachine::PROLOG_MIGRATE_SUSPEND ||
             vm->get_lcm_state() == VirtualMachine::PROLOG_MIGRATE_SUSPEND_FAILURE||
             vm->get_lcm_state() == VirtualMachine::DISK_SNAPSHOT_SUSPENDED ||
             vm->get_lcm_state() == VirtualMachine::DISK_SNAPSHOT_DELETE_SUSPENDED))
        {
            VirtualMachineTemplate quota_tmpl;

            vm->get_quota_template(quota_tmpl, false, true);

            vm->set_state(VirtualMachine::SUSPENDED);

            vm->set_state(VirtualMachine::LCM_INIT);

            time_t the_time = time(0);

            vm->set_running_etime(the_time);

            vmpool->update_history(vm.get());

            vmpool->update(vm.get());

            int uid = vm->get_uid();
            int gid = vm->get_gid();

            vm.reset();

            Quotas::vm_del(uid, gid, &quota_tmpl);
        }
        else
        {
            ostringstream oss;

            oss << "suspend_success action received but VM " << vid
                << " not in ACTIVE state";
            NebulaLog::log("DiM", Log::ERROR, oss);

            return;
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void DispatchManager::trigger_stop_success(int vid)
{
    trigger([this, vid]
    {
        auto vm = vmpool->get(vid);

        if (!vm)
        {
            return;
        }

        if ((vm->get_state() == VirtualMachine::ACTIVE) &&
            (vm->get_lcm_state() == VirtualMachine::EPILOG_STOP ||
             vm->get_lcm_state() == VirtualMachine::PROLOG_RESUME))
        {
            VirtualMachineTemplate quota_tmpl;

            vm->get_quota_template(quota_tmpl, false, true);

            vm->set_state(VirtualMachine::STOPPED);

            vm->set_state(VirtualMachine::LCM_INIT);

            //Set history action field to perform the right TM command on resume
            if (vm->get_action() == VMActions::NONE_ACTION)
            {
                vm->set_internal_action(VMActions::STOP_ACTION);

                vmpool->update_history(vm.get());
            }

            vmpool->update(vm.get());

            int uid = vm->get_uid();
            int gid = vm->get_gid();

            vm.reset();

            Quotas::vm_del(uid, gid, &quota_tmpl);
        }
        else
        {
            ostringstream oss;

            oss << "stop_success action received but VM " << vid
                << " not in ACTIVE state";
            NebulaLog::log("DiM", Log::ERROR, oss);
            return;
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void DispatchManager::trigger_undeploy_success(int vid)
{
    trigger([this, vid]
    {
        auto vm = vmpool->get(vid);

        if (!vm)
        {
            return;
        }

        if ((vm->get_state() == VirtualMachine::ACTIVE) &&
            (vm->get_lcm_state() == VirtualMachine::EPILOG_UNDEPLOY ||
             vm->get_lcm_state() == VirtualMachine::DISK_RESIZE_UNDEPLOYED ||
             vm->get_lcm_state() == VirtualMachine::PROLOG_UNDEPLOY))
        {
            VirtualMachineTemplate quota_tmpl;

            // Bug: From the LCM state we don't know if we undeploy from RUNNING or POWEROFF
            //      state. In first case we should remove RUNNING_* quotas, in the second not
            vm->get_quota_template(quota_tmpl, false, vm->is_running_quota());

            vm->set_state(VirtualMachine::UNDEPLOYED);

            vm->set_state(VirtualMachine::LCM_INIT);

            //Set history action field to perform the right TM command on resume
            if (vm->get_action() == VMActions::NONE_ACTION)
            {
                vm->set_internal_action(VMActions::UNDEPLOY_ACTION);

                vmpool->update_history(vm.get());
            }

            vmpool->update(vm.get());

            int uid = vm->get_uid();
            int gid = vm->get_gid();

            vm.reset();

            Quotas::vm_del(uid, gid, &quota_tmpl);
        }
        else
        {
            ostringstream oss;

            oss << "undeploy_success action received but VM " << vid
                << " not in ACTIVE state";
            NebulaLog::log("DiM", Log::ERROR, oss);

            return;
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void DispatchManager::trigger_poweroff_success(int vid)
{
    trigger([this, vid]
    {
        auto vm = vmpool->get(vid);

        if (!vm)
        {
            return;
        }

        if ((vm->get_state() == VirtualMachine::ACTIVE) &&
            (vm->get_lcm_state() == VirtualMachine::SHUTDOWN_POWEROFF ||
             vm->get_lcm_state() == VirtualMachine::HOTPLUG_PROLOG_POWEROFF ||
             vm->get_lcm_state() == VirtualMachine::HOTPLUG_EPILOG_POWEROFF ||
             vm->get_lcm_state() == VirtualMachine::PROLOG_MIGRATE_POWEROFF ||
             vm->get_lcm_state() == VirtualMachine::DISK_SNAPSHOT_POWEROFF ||
             vm->get_lcm_state() == VirtualMachine::DISK_SNAPSHOT_REVERT_POWEROFF ||
             vm->get_lcm_state() == VirtualMachine::DISK_SNAPSHOT_DELETE_POWEROFF ||
             vm->get_lcm_state() == VirtualMachine::DISK_RESIZE_POWEROFF ||
             vm->get_lcm_state() == VirtualMachine::HOTPLUG_NIC_POWEROFF ||
             vm->get_lcm_state() == VirtualMachine::PROLOG_MIGRATE_POWEROFF_FAILURE))
        {
            VirtualMachineTemplate quota_tmpl;

            vm->get_quota_template(quota_tmpl, false, vm->is_running_quota());

            vm->set_state(VirtualMachine::POWEROFF);

            vm->set_state(VirtualMachine::LCM_INIT);

            time_t the_time = time(0);

            vm->set_running_etime(the_time);

            vmpool->update_history(vm.get());

            vmpool->update(vm.get());

            int uid = vm->get_uid();
            int gid = vm->get_gid();

            vm.reset();

            if (!quota_tmpl.empty())
            {
                Quotas::vm_del(uid, gid, &quota_tmpl);
            }
        }
        else
        {
            ostringstream oss;

            oss << "poweroff_success action received but VM " << vid
                << " not in ACTIVE state";
            NebulaLog::log("DiM", Log::ERROR, oss);

            return;
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void DispatchManager::trigger_done(int vid)
{
    trigger([this, vid]
    {
        auto vm = vmpool->get(vid);

        if (!vm)
        {
            return;
        }

        VirtualMachine::LcmState lcm_state = vm->get_lcm_state();
        VirtualMachine::VmState  dm_state  = vm->get_state();

        if ((dm_state == VirtualMachine::ACTIVE) &&
            (lcm_state == VirtualMachine::EPILOG ||
             lcm_state == VirtualMachine::CLEANUP_DELETE))
        {
            free_vm_resources(std::move(vm), true);
        }
        else
        {
            ostringstream oss;

            oss << "done action received but VM " << vid << " not in ACTIVE state";
            NebulaLog::log("DiM", Log::ERROR, oss);
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void DispatchManager::trigger_resubmit(int vid)
{
    trigger([this, vid]
    {
        auto vm = vmpool->get(vid);

        if (!vm)
        {
            return;
        }

        if (vm->get_lcm_state() == VirtualMachine::CLEANUP_RESUBMIT)
        {
            // Automatic requirements are not recalculated on purpose

            vm->set_state(VirtualMachine::LCM_INIT);

            vm->set_state(VirtualMachine::PENDING);

            vm->set_deploy_id(""); //reset the deploy-id

            vmpool->update(vm.get());
        }
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
