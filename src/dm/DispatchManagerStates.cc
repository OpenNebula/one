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

#include "DispatchManager.h"
#include "NebulaLog.h"

#include "Nebula.h"

void  DispatchManager::suspend_success_action(int vid)
{
    VirtualMachine *    vm;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if ((vm->get_state() == VirtualMachine::ACTIVE) &&
        (vm->get_lcm_state() == VirtualMachine::SAVE_SUSPEND ||
         vm->get_lcm_state() == VirtualMachine::PROLOG_MIGRATE_SUSPEND ||
         vm->get_lcm_state() == VirtualMachine::PROLOG_MIGRATE_SUSPEND_FAILURE))
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
    }

    vm->unlock();

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  DispatchManager::stop_success_action(int vid)
{
    VirtualMachine *    vm;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if ((vm->get_state() == VirtualMachine::ACTIVE) &&
        (vm->get_lcm_state() == VirtualMachine::EPILOG_STOP ||
         vm->get_lcm_state() == VirtualMachine::PROLOG_RESUME))
    {
        vm->set_state(VirtualMachine::STOPPED);

        vm->set_state(VirtualMachine::LCM_INIT);

        //Set history action field to perform the right TM command on resume
        if (vm->get_action() == History::NONE_ACTION)
        {
            vm->set_action(History::STOP_ACTION);

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
    }

    vm->unlock();

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  DispatchManager::undeploy_success_action(int vid)
{
    VirtualMachine *    vm;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if ((vm->get_state() == VirtualMachine::ACTIVE) &&
        (vm->get_lcm_state() == VirtualMachine::EPILOG_UNDEPLOY ||
         vm->get_lcm_state() == VirtualMachine::PROLOG_UNDEPLOY))
    {
        vm->set_state(VirtualMachine::UNDEPLOYED);

        vm->set_state(VirtualMachine::LCM_INIT);

        //Set history action field to perform the right TM command on resume
        if (vm->get_action() == History::NONE_ACTION)
        {
            vm->set_action(History::UNDEPLOY_ACTION);

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
    }

    vm->unlock();

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  DispatchManager::poweroff_success_action(int vid)
{
    VirtualMachine *    vm;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
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
    }

    vm->unlock();

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  DispatchManager::done_action(int vid)
{
    VirtualMachine * vm;
    Template *       tmpl;

    int uid;
    int gid;
    string deploy_id;

    VirtualMachine::LcmState lcm_state;
    VirtualMachine::VmState  dm_state;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    lcm_state = vm->get_lcm_state();
    dm_state  = vm->get_state();

    if ((dm_state == VirtualMachine::ACTIVE) &&
          (lcm_state == VirtualMachine::EPILOG ||
           lcm_state == VirtualMachine::CLEANUP_DELETE))
    {
        vm->release_network_leases();

        vm->release_disk_images();

        vm->set_state(VirtualMachine::DONE);

        vm->set_state(VirtualMachine::LCM_INIT);

        vm->set_exit_time(time(0));

        vmpool->update(vm);

        uid  = vm->get_uid();
        gid  = vm->get_gid();
        tmpl = vm->clone_template();

        if (vm->is_imported())
        {
            deploy_id = vm->get_deploy_id();
        }

        vm->unlock();

        Quotas::vm_del(uid, gid, tmpl);

        delete tmpl;

        if (!deploy_id.empty())
        {
            vmpool->drop_index(deploy_id);
        }
    }
    else
    {
        ostringstream oss;

        oss << "done action received but VM " << vid << " not in ACTIVE state";
        NebulaLog::log("DiM",Log::ERROR,oss);

        vm->unlock();
    }

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  DispatchManager::resubmit_action(int vid)
{
    VirtualMachine *    vm;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if (vm->get_lcm_state() == VirtualMachine::CLEANUP_RESUBMIT)
    {

        vm->set_state(VirtualMachine::LCM_INIT);

        vm->set_state(VirtualMachine::PENDING);

        vmpool->update(vm);

        vm->unlock();
    }

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
