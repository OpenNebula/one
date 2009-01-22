/* -------------------------------------------------------------------------- */
/* Copyright 2002-2009, Distributed Systems Architecture Group, Universidad   */
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
        time_t				thetime = time(0);
        int					cpu,mem,disk;
        
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
        int						cpu,mem,disk;
        
        //----------------------------------------------------
        //                SAVE_MIGRATE STATE
        //----------------------------------------------------

        vm->set_state(VirtualMachine::SAVE_MIGRATE);
        
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
        int						cpu,mem,disk;
        
        //----------------------------------------------------
        //                   MIGRATE STATE
        //----------------------------------------------------

        vm->set_state(VirtualMachine::MIGRATE);

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
        
        vm->log("LCM",Log::INFO,"New VM state is SHUTDOWN");

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
        int						cpu,mem,disk;
        time_t					the_time = time(0);
        
        vm->log("LCM", Log::INFO, "Restoring VM");
        
        //----------------------------------------------------
        //            BOOT STATE (FROM SUSPEND)
        //----------------------------------------------------        

        vm->set_state(VirtualMachine::BOOT);

        vmpool->update(vm);
        
        vm->cp_history();
                        
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
        
        vmpool->update(vm);

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
