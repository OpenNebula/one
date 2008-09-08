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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::allocate (
    int     uid,
    const string& stemplate,
    int *   oid)
{
    Nebula::log("DiM",Log::DEBUG,"Allocating a new VM");
    
    return vmpool->allocate(uid,stemplate,oid);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::deploy (
    VirtualMachine *    vm)
{
    ostringstream oss;
    int           vid;
    
    if ( vm == 0 )
    {
        return -1;
    }
    
    vid = vm->get_oid();
    
    oss << "Deploying VM " << vid; 
    Nebula::log("DiM",Log::DEBUG,oss);
    
    if ( vm->get_state() == VirtualMachine::PENDING )
    {
        Nebula&             nd  = Nebula::instance();
        LifeCycleManager *  lcm = nd.get_lcm();
             
        vm->set_state(VirtualMachine::ACTIVE);
        
        vmpool->update(vm);
                
        vm->log("DiM", Log::INFO, "New VM state is ACTIVE.");
        
        lcm->trigger(LifeCycleManager::DEPLOY,vid);
    }
    else
    {
        goto error; 
    }
        
    vm->unlock();
    
    return 0;
    
error:

    oss.str("");
    oss << "Could not deploy VM " << vid << ", wrong state.";
    Nebula::log("DiM",Log::ERROR,oss);
    
    vm->unlock();
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::migrate(
    VirtualMachine *    vm)
{
    ostringstream oss;
    int           vid;
        
    if ( vm == 0 )
    {
        return -1;
    }

    vid = vm->get_oid();
        
    oss << "Migrating VM " << vid; 
    Nebula::log("DiM",Log::DEBUG,oss);
    
    if (vm->get_state()     == VirtualMachine::ACTIVE &&
        vm->get_lcm_state() == VirtualMachine::RUNNING )
    {
        Nebula&             nd  = Nebula::instance();
        LifeCycleManager *  lcm = nd.get_lcm();
     
        lcm->trigger(LifeCycleManager::MIGRATE,vid);       
    }
    else
    {
        goto error; 
    }
    
    vm->unlock();
    
    return 0;
    
error:
    oss.str("");
    oss << "Could not migrate VM " << vid << ", wrong state.";
    Nebula::log("DiM",Log::ERROR,oss);
    
    vm->unlock();
    return -1;
}    

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::live_migrate(
    VirtualMachine *    vm)
{
    ostringstream oss;
    int           vid;
        
    if ( vm == 0 )
    {
        return -1;
    }
    
    vid = vm->get_oid();
       
    oss << "Live-migrating VM " << vid; 
    Nebula::log("DiM",Log::DEBUG,oss);
    
    if (vm->get_state()     == VirtualMachine::ACTIVE &&
        vm->get_lcm_state() == VirtualMachine::RUNNING )
    {
        Nebula&             nd  = Nebula::instance();
        LifeCycleManager *  lcm = nd.get_lcm();
     
        lcm->trigger(LifeCycleManager::LIVE_MIGRATE,vid);       
    }
    else
    {
        goto error; 
    }
    
    vm->unlock();
    
    return 0;
    
error:
    oss.str("");
    oss << "Could not live-migrate VM " << vid << ", wrong state.";
    Nebula::log("DiM",Log::ERROR,oss);
    
    vm->unlock();
    return -1;
}    

/* ************************************************************************** */
/* ************************************************************************** */

int DispatchManager::shutdown (
    int vid)
{
    ostringstream       oss;
    VirtualMachine *    vm;
    
    vm = vmpool->get(vid,true);
    
    if ( vm == 0 )
    {
        return -1;
    }
    
    oss << "Shutting down VM " << vid; 
    Nebula::log("DiM",Log::DEBUG,oss);
    
    if (vm->get_state()     == VirtualMachine::ACTIVE &&
        vm->get_lcm_state() == VirtualMachine::RUNNING )
    {
        Nebula&             nd  = Nebula::instance();
        LifeCycleManager *  lcm = nd.get_lcm();
             
        lcm->trigger(LifeCycleManager::SHUTDOWN,vid);       
    }
    else
    {
        goto error; 
    }
    
    vm->unlock();
    
    return 0;
    
error:

    oss.str("");
    oss << "Could not shutdown VM " << vid << ", wrong state.";
    Nebula::log("DiM",Log::ERROR,oss);
    
    vm->unlock();
    return -2;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::hold(
    int vid)
{
    VirtualMachine *    vm;
    ostringstream       oss;
    
    vm = vmpool->get(vid,true);
    
    if ( vm == 0 )
    {
        return -1;
    }
    
    oss << "Holding VM " << vid; 
    Nebula::log("DiM",Log::DEBUG,oss);
    
    if (vm->get_state() == VirtualMachine::PENDING)
    {
        vm->set_state(VirtualMachine::HOLD);
        
        vmpool->update(vm);
        
        vm->log("DiM", Log::INFO, "New VM state is HOLD.");
    }
    else
    {
        goto error; 
    }
    
    vm->unlock();
    
    return 0;
    
error:

    oss.str("");
    oss << "Could not hold VM " << vid << ", wrong state.";
    Nebula::log("DiM",Log::ERROR,oss);
    
    vm->unlock();
    return -2;    
}    

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::release(
    int vid)
{
    VirtualMachine *    vm;
    ostringstream       oss;
        
    vm = vmpool->get(vid,true);
    
    if ( vm == 0 )
    {
        return -1;
    }
    
    oss << "Realising VM " << vid; 
    Nebula::log("DiM",Log::DEBUG,oss);
    
    if (vm->get_state() == VirtualMachine::HOLD)
    {
        vm->set_state(VirtualMachine::PENDING);
        
        vmpool->update(vm);
        
        vm->log("DiM", Log::INFO, "New VM state is PENDING.");
    }
    else
    {
        goto error; 
    }
    
    vm->unlock();
    
    return 0;
    
error:
    oss.str("");
    oss << "Could not release VM " << vid << ", wrong state.";
    Nebula::log("DiM",Log::ERROR,oss);
    
    vm->unlock();
    return -2;
}    

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::stop(
    int vid)
{
    VirtualMachine *    vm;
    ostringstream       oss;
    
    vm = vmpool->get(vid,true);
    
    if ( vm == 0 )
    {
        return -1;
    }

    oss << "Stopping VM " << vid; 
    Nebula::log("DiM",Log::DEBUG,oss);
    
    if (vm->get_state()     == VirtualMachine::ACTIVE &&
        vm->get_lcm_state() == VirtualMachine::RUNNING )
    {
        Nebula&             nd  = Nebula::instance();
        LifeCycleManager *  lcm = nd.get_lcm();
             
        lcm->trigger(LifeCycleManager::STOP,vid);       
    }
    else
    {
        goto error; 
    }
    
    vm->unlock();
    
    return 0;
    
error:
    oss.str("");
    oss << "Could not stop VM " << vid << ", wrong state.";
    Nebula::log("DiM",Log::ERROR,oss);
    
    vm->unlock();
    return -2;
}    

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::cancel(
    int vid)
{
    VirtualMachine *    vm;
    ostringstream       oss;
    
    vm = vmpool->get(vid,true);
    
    if ( vm == 0 )
    {
        return -1;
    }
    
    oss << "Cancelling VM " << vid; 
    Nebula::log("DiM",Log::DEBUG,oss);
    
    if (vm->get_state()     == VirtualMachine::ACTIVE &&
        vm->get_lcm_state() == VirtualMachine::RUNNING )
    {
        Nebula&             nd  = Nebula::instance();
        LifeCycleManager *  lcm = nd.get_lcm();

        vm->unlock();
        
        lcm->trigger(LifeCycleManager::CANCEL,vid);       
    }
    else
    {
        goto error; 
    }
    
    return 0;
    
error:
    oss.str("");
    oss << "Could not cancel VM " << vid << ", wrong state.";
    Nebula::log("DiM",Log::ERROR,oss);
    
    vm->unlock();
    return -2;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::suspend(
    int vid)
{
    VirtualMachine *    vm;
    ostringstream       oss;
    
    vm = vmpool->get(vid,true);
    
    if ( vm == 0 )
    {
        return -1;
    }
    
    oss << "Suspending VM " << vid; 
    Nebula::log("DiM",Log::DEBUG,oss);
    
    if (vm->get_state()     == VirtualMachine::ACTIVE &&
        vm->get_lcm_state() == VirtualMachine::RUNNING )
    {
        Nebula&             nd  = Nebula::instance();
        LifeCycleManager *  lcm = nd.get_lcm();
        
        lcm->trigger(LifeCycleManager::SUSPEND,vid);       
    }
    else
    {
        goto error; 
    }
    
    vm->unlock();
    
    return 0;
    
error:
    oss.str("");
    oss << "Could not suspend VM " << vid << ", wrong state.";
    Nebula::log("DiM",Log::ERROR,oss);
    
    vm->unlock();
    return -2;
}    

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::resume(
    int vid)
{
    VirtualMachine *    vm;
    ostringstream       oss;
    
    vm = vmpool->get(vid,true);
    
    if ( vm == 0 )
    {
        return -1;
    }
    
    oss << "Resuming VM " << vid; 
    Nebula::log("DiM",Log::DEBUG,oss);
    
    if (vm->get_state() == VirtualMachine::STOPPED )
    {
        vm->set_state(VirtualMachine::PENDING);
        
        vmpool->update(vm);
        
        vm->log("DiM", Log::INFO, "New VM state is PENDING.");   
    }
    else if (vm->get_state() == VirtualMachine::SUSPENDED)
    {
        Nebula&             nd  = Nebula::instance();
        LifeCycleManager *  lcm = nd.get_lcm();

        vm->set_state(VirtualMachine::ACTIVE);
        
        vmpool->update(vm);
        
        vm->log("DiM", Log::INFO, "New VM state is ACTIVE.");
        
        lcm->trigger(LifeCycleManager::RESTORE,vid);        
    }
    else
    {
        goto error; 
    }
    
    vm->unlock();
    
    return 0;
    
error:
    oss.str("");
    oss << "Could not resume VM " << vid << ", wrong state.";
    Nebula::log("DiM",Log::ERROR,oss);
    
    vm->unlock();
    return -2;
} 

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::finalize(
    int vid)
{
    VirtualMachine *    vm;
    ostringstream       oss;
    
    vm = vmpool->get(vid,true);
    
    if ( vm == 0 )
    {
        return -1;
    }
    
    if (vm->get_state() != VirtualMachine::ACTIVE && 
        vm->get_state() != VirtualMachine::DONE    )
    {
        oss << "Finalizing VM " << vid; 
        Nebula::log("DiM",Log::DEBUG,oss);
        
        vm->set_state(VirtualMachine::DONE);
        
        vmpool->update(vm);
        
        vm->log("DiM", Log::INFO, "New VM state is DONE.");
        
        vmpool->remove(vm);
        
        return 0;
    }

    oss.str("");
    oss << "Could not finalize VM " << vid << ", wrong state.";
    Nebula::log("DiM",Log::ERROR,oss);
    
    vm->unlock();
    
    return -2;
}   

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
