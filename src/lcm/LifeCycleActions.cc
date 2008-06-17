/* -------------------------------------------------------------------------- */
/* Copyright 2002-2008, Distributed Systems Architecture Group, Universidad   */
/* Complutense de Madrid (dsa-research.org)                                   */
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

        //----------------------------------------------------
        //                 PROLOG STATE
        //----------------------------------------------------

        vm->set_state(VirtualMachine::PROLOG);
        
        vm->set_prolog_stime(time(0));
        
        vmpool->update(vm);
        
        vmpool->update_history(vm);

        vm->log("LCM", Log::INFO, "New VM state is PROLOG.");
        
        //----------------------------------------------------

        tm->trigger(TransferManager::PROLOG,vid);
    }
    else
    {
        goto error; 
    }
    
    vm->unlock();
    
    return;
    
error:
    vm->log("LCM", Log::ERROR, "deploy_action, VM in a wrong state.");
    vm->unlock();
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
        
        vmpool->update(vm);

        vm->log("LCM", Log::INFO, "New VM state is SAVE_SUSPEND");
        
        //----------------------------------------------------
        
        vmm->trigger(VirtualMachineManager::SAVE,vid);       
    }
    else
    {
        goto error; 
    }
    
    vm->unlock();
    
    return;
    
error:
    vm->log("LCM", Log::ERROR, "suspend_action, VM in a wrong state.");
    vm->unlock();
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
        
        vmpool->update(vm);

        vm->log("LCM", Log::INFO, "New VM state is SAVE_STOP");
        
        //----------------------------------------------------

        vmm->trigger(VirtualMachineManager::SAVE,vid);       
    }
    else
    {
        goto error; 
    }
    
    vm->unlock();
    
    return;
    
error:
    vm->log("LCM", Log::ERROR, "stop_action, VM in a wrong state.");  
    vm->unlock();
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

        //----------------------------------------------------
        //                SAVE_MIGRATE STATE
        //----------------------------------------------------

        vm->set_state(VirtualMachine::SAVE_MIGRATE);
        
        vmpool->update(vm);

        vm->log("LCM", Log::INFO, "New VM state is SAVE_MIGRATE");
        
        //----------------------------------------------------

        vmm->trigger(VirtualMachineManager::SAVE,vid);       
    }
    else
    {
        goto error; 
    }
    
    vm->unlock();
    
    return;
    
error:
    vm->log("LCM", Log::ERROR, "migrate_action, VM in a wrong state.");
    vm->unlock();
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

        //----------------------------------------------------
        //                   MIGRATE STATE
        //----------------------------------------------------

        vm->set_state(VirtualMachine::MIGRATE);

        vmpool->update(vm);
        
        vm->log("LCM",Log::INFO,"New VM state is MIGRATE");
        
        //----------------------------------------------------
        
        vmm->trigger(VirtualMachineManager::MIGRATE,vid);       
    }
    else
    {
        os << "VM not in a suitable state to migrate";
        vm->log("LCM", Log::ERROR, os);

        goto error; 
    }
    
    vm->unlock();
    
    return;
    
error:
    vm->log("LCM", Log::ERROR, "live_migrate_action, VM in a wrong state.");
    vm->unlock();
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

        vmpool->update(vm);

        //----------------------------------------------------
        
        vmm->trigger(VirtualMachineManager::SHUTDOWN,vid);       
    }
    else
    {
        goto error; 
    }
    
    vm->unlock();
    
    return;
    
error:
    vm->log("LCM", Log::ERROR, "shutdown_action, VM in a wrong state.");
    vm->unlock();
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

        vm->log("LCM", Log::INFO, "Restoring VM");
        
        vm->log("LCM", Log::INFO, "New state is BOOT");
        
        vm->set_state(VirtualMachine::BOOT);

        vmpool->update(vm);
        
        vmm->trigger(VirtualMachineManager::RESTORE,vid);       
    }
    else
    {
        goto error; 
    }
    
    vm->unlock();
    
    return;
    
error:
    vm->log("LCM", Log::ERROR, "restore_action, VM in a wrong state.");
    vm->unlock();
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
        
        vm->set_running_etime(time(0));
        
        vmpool->update(vm);
        
        vmpool->update_history(vm);

        vm->log("LCM", Log::INFO, "New state is CANCEL");
        
        //----------------------------------------------------
        
        vmm->trigger(VirtualMachineManager::CANCEL,vid);       
    }
    else
    {
        goto error; 
    }
    
    vm->unlock();
    
    return;
    
error:
    vm->log("LCM", Log::ERROR, "cancel_action, VM in a wrong state.");
    vm->unlock();
}

