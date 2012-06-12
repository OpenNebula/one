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
        (vm->get_lcm_state() == VirtualMachine::SAVE_SUSPEND))
    {
        vm->set_state(VirtualMachine::SUSPENDED);

        vm->set_state(VirtualMachine::LCM_INIT);

        vmpool->update(vm);

        vm->log("DiM", Log::INFO, "New VM state is SUSPENDED");
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
        (vm->get_lcm_state() == VirtualMachine::EPILOG_STOP))
    {
        vm->set_state(VirtualMachine::STOPPED);

        vm->set_state(VirtualMachine::LCM_INIT);

        vmpool->update(vm);

        vm->log("DiM", Log::INFO, "New VM state is STOPPED");
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

void  DispatchManager::done_action(int vid)
{
    VirtualMachine * vm;
    Template *       tmpl;

    int uid;
    int gid;

    VirtualMachine::LcmState lcm_state;
    VirtualMachine::VmState  dm_state;

    Nebula&    nd    = Nebula::instance();
    UserPool * upool = nd.get_upool();
    GroupPool* gpool = nd.get_gpool();

    User *  user;
    Group * group;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    lcm_state = vm->get_lcm_state();
    dm_state  = vm->get_state();

    if ((dm_state == VirtualMachine::ACTIVE) &&
          (lcm_state == VirtualMachine::EPILOG ||
           lcm_state == VirtualMachine::CANCEL ||
           lcm_state == VirtualMachine::CLEANUP ))
    {
        vm->set_state(VirtualMachine::DONE);

        vm->set_state(VirtualMachine::LCM_INIT);

        vm->set_exit_time(time(0));

        vmpool->update(vm);

        vm->log("DiM", Log::INFO, "New VM state is DONE");

        vm->release_network_leases();

        vm->release_disk_images();

        uid  = vm->get_uid();
        gid  = vm->get_gid();
        tmpl = vm->clone_template();
    
        vm->unlock();

        /* ---------------- Update Group & User quota counters -------------- */

        if ( uid != UserPool::ONEADMIN_ID )
        {
            user = upool->get(uid, true);

            if ( user != 0 )
            {
                user->quota.vm_del(tmpl);
                
                upool->update(user);
                 
                user->unlock();
            }
        }

        if ( gid != GroupPool::ONEADMIN_ID )
        {
            group = gpool->get(gid, true);

            if ( group != 0 )
            {
                group->quota.vm_del(tmpl);

                gpool->update(group);

                group->unlock();
            } 
        }
        
        delete tmpl;
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

void  DispatchManager::failed_action(int vid)
{
    VirtualMachine *    vm;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return;
    }

    if (vm->get_lcm_state() == VirtualMachine::FAILURE)
    {

        vm->set_state(VirtualMachine::LCM_INIT);

        vm->set_state(VirtualMachine::FAILED);

        vm->set_exit_time(time(0));

        vmpool->update(vm);

        vm->log("DiM", Log::INFO, "New VM state is FAILED");

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

    if (vm->get_lcm_state() == VirtualMachine::CLEANUP)
    {

        vm->set_state(VirtualMachine::LCM_INIT);

        vm->set_state(VirtualMachine::PENDING);

        vmpool->update(vm);

        vm->log("DiM", Log::INFO, "New VM state is PENDING");

        vm->unlock();
    }

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
