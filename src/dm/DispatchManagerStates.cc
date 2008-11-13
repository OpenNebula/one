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

#include "DispatchManager.h"
#include "Nebula.h"

void  DispatchManager::suspend_success_action(int vid)
{
    VirtualMachine *    vm;
    
    vm = vmpool->get(vid,true);
    
    if ( vm == 0 )
    {
        return;
    }
    
    if (vm->get_state() == VirtualMachine::ACTIVE )
    {        
        vm->set_state(VirtualMachine::SUSPENDED);
        
        vm->set_state(VirtualMachine::LCM_INIT);
        
        vmpool->update(vm);
                
        vm->log("DiM", Log::INFO, "New VM state is SUSPENDED");
    }
    else
    {
        goto error; 
    }
    
    vm->unlock();
    
    return;
    
error:
    ostringstream oss;
    
    oss << "suspend_success action received but VM " << vid 
        << " not in ACTIVE state";    
    Nebula::log("DiM",Log::ERROR,oss);
    
    vm->unlock();
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
    
    if (vm->get_state() == VirtualMachine::ACTIVE )
    {        
        vm->set_state(VirtualMachine::STOPPED);
        
        vm->set_state(VirtualMachine::LCM_INIT);
                
        vmpool->update(vm);
                
        vm->log("DiM", Log::INFO, "New VM state is STOPPED");
    }
    else
    {
        goto error; 
    }
    
    vm->unlock();
    
    return;
    
error:
    ostringstream oss;
    
    oss << "stop_success action received but VM " << vid 
        << " not in ACTIVE state";    
    Nebula::log("DiM",Log::ERROR,oss);
    
    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  DispatchManager::done_action(int vid)
{
    VirtualMachine *      vm;
    
    vm = vmpool->get(vid,true);
    
    if ( vm == 0 )
    {
        return;
    }
    
    if ( vm->get_state() == VirtualMachine::ACTIVE )
    {
        vm->set_state(VirtualMachine::DONE);
        
        vm->set_state(VirtualMachine::LCM_INIT);
                
        vm->set_exit_time(time(0));
                
        vmpool->update(vm);
        
        vm->log("DiM", Log::INFO, "New VM state is DONE");
        
        vm->release_leases();
        
        vmpool->remove(vm);
    }
    else
    {
        goto error; 
    }
        
    return;
    
error:
    ostringstream oss;
    
    oss << "done action received but VM " << vid << " not in ACTIVE state";    
    Nebula::log("DiM",Log::ERROR,oss);
    
    vm->unlock();
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
        
    vm->set_state(VirtualMachine::LCM_INIT);

    vm->set_state(VirtualMachine::FAILED);

    vm->set_exit_time(time(0));
                        
    vmpool->update(vm);
    
    vm->log("DiM", Log::INFO, "New VM state is FAILED");
    
    vm->unlock();
    
    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
