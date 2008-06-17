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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::save_success_action(int vid)
{
    VirtualMachine *    vm;
    ostringstream       os;
    
    vm = vmpool->get(vid,true);
    
    if ( vm == 0 )
    {
        return;
    }
    
    if ( vm->get_lcm_state() == VirtualMachine::SAVE_MIGRATE )
    {
        Nebula&             nd = Nebula::instance();
        TransferManager *   tm = nd.get_tm();

        time_t              the_time = time(0);
        
        //----------------------------------------------------
        //                PROLOG_MIGRATE STATE
        //----------------------------------------------------
     
        vm->set_prolog_stime(the_time);
                    
        vm->set_state(VirtualMachine::PROLOG_MIGRATE);
                              
        vmpool->update(vm);
        
        vmpool->update_history(vm);
        
        vm->log("LCM", Log::INFO, "New VM state is PROLOG_MIGRATE");
                         
        //----------------------------------------------------
        
        tm->trigger(TransferManager::PROLOG,vid);
    }
    else if ( vm->get_lcm_state() == VirtualMachine::SAVE_SUSPEND)
    {
        Nebula&             nd = Nebula::instance();
        DispatchManager *   dm = nd.get_dm();
                
        vm->set_running_etime(time(0));        

        vmpool->update_history(vm);
        
        dm->trigger(DispatchManager::SUSPEND_SUCCESS,vid);
    }
    else if ( vm->get_lcm_state() == VirtualMachine::SAVE_STOP)
    {
        Nebula&             nd = Nebula::instance();
        TransferManager *   tm = nd.get_tm();

        //----------------------------------------------------
        //                 EPILOG_STOP STATE
        //----------------------------------------------------
        
        vm->set_state(VirtualMachine::EPILOG_STOP);
        
        time_t the_time = time(0);
        
        vm->set_epilog_stime(the_time);
        vm->set_running_etime(the_time);
        
        vmpool->update(vm);
        vmpool->update_history(vm);
        
        vm->log("LCM", Log::INFO, "New VM state is EPILOG_STOP");
        
        //----------------------------------------------------
        
        tm->trigger(TransferManager::EPILOG,vid);
    }
    else
    {
        vm->log("LCM",Log::ERROR,"save_success_action, VM in a wrong state");
    }
    
    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::save_failure_action(int vid)
{
    
    Nebula&             nd = Nebula::instance();
    DispatchManager *   dm = nd.get_dm();
    VirtualMachine *    vm;
    
    DispatchManager::Actions action;
    
    vm = vmpool->get(vid,true);
    
    if ( vm == 0 )
    {
        return;
    }
    
    if ( vm->get_lcm_state() == VirtualMachine::SAVE_MIGRATE )
    {
        action = DispatchManager::MIGRATE_FAILURE;
        
    }
    else if ( vm->get_lcm_state() == VirtualMachine::SAVE_SUSPEND)
    {
        action = DispatchManager::SUSPEND_FAILURE;
        
        vm->set_running_etime(time(0));
        
        vmpool->update_history(vm);
    }
    else if ( vm->get_lcm_state() == VirtualMachine::SAVE_STOP)
    {
        action = DispatchManager::STOP_FAILURE;
        
        vm->set_running_etime(time(0));
        
        vmpool->update_history(vm);
    }
        
    dm->trigger(action,vid);
            
    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::deploy_success_action(int vid)
{
    VirtualMachine *    vm;
    
    vm = vmpool->get(vid,true);
    
    if ( vm == 0 )
    {
        return;
    }

    //----------------------------------------------------
    //                 RUNNING STATE
    //----------------------------------------------------

    if ( vm->get_lcm_state() == VirtualMachine::MIGRATE )
    {
        vm->set_running_stime(time(0));
        
        vmpool->update_history(vm);                
    }
    
    vm->set_state(VirtualMachine::RUNNING);
    
    vmpool->update(vm);

    vm->log("LCM", Log::INFO, "New VM state is RUNNING");
        
    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::deploy_failure_action(int vid)
{
    Nebula&             nd = Nebula::instance();
    DispatchManager *   dm = nd.get_dm();
    VirtualMachine *    vm;

    vm = vmpool->get(vid,true);
    
    if ( vm == 0 )
    {
        return;
    }
    
    // TODO if ( vm->get_lcm_state() == VirtualMachine::MIGRATE )
    // Is the VM still running? roll back history and keep running?
            
    vm->set_running_etime(time(0));

    vmpool->update_history(vm);

    dm->trigger(DispatchManager::FAILED,vid);
        
    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::shutdown_success_failure_action(int vid)
{
    Nebula&             nd = Nebula::instance();
    TransferManager *   tm = nd.get_tm();
    VirtualMachine *    vm;
    time_t              the_time = time(0);
                 
    vm = vmpool->get(vid,true);
    
    if ( vm == 0 )
    {
        return;
    }
    
    //----------------------------------------------------
    //                   EPILOG STATE
    //----------------------------------------------------
    
    vm->set_state(VirtualMachine::EPILOG);
    
    vm->set_epilog_stime(the_time);
    
    vm->set_running_etime(the_time);
        
    vmpool->update(vm);
    
    vmpool->update_history(vm);
    
    vm->log("LCM", Log::INFO, "New VM state is EPILOG");
    
    //----------------------------------------------------
        
    tm->trigger(TransferManager::EPILOG,vid);
    
    vm->unlock();    
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::prolog_success_action(int vid)
{
    Nebula&                 nd = Nebula::instance();
    VirtualMachineManager * vmm = nd.get_vmm();
    VirtualMachine *        vm;
    time_t                  the_time = time(0);
    ostringstream           os;
    
    VirtualMachineManager::Actions action;

    vm = vmpool->get(vid, true);

    if ( vm == 0 )
    {
        return;
    }
            
    if (vm->get_lcm_state()==VirtualMachine::PROLOG)
    {
        action = VirtualMachineManager::DEPLOY;    
    }
    else if (vm->get_lcm_state()==VirtualMachine::PROLOG_MIGRATE)
    {
        action = VirtualMachineManager::RESTORE;        
    }
    else
    {
        goto error;
    }

    //----------------------------------------------------
    //                     BOOT STATE
    //----------------------------------------------------

    vm->set_state(VirtualMachine::BOOT);
    
    vm->set_prolog_etime(the_time);
    
    vm->set_running_stime(the_time);
    
    vmpool->update(vm);
    
    vmpool->update_history(vm);

    vm->log("LCM", Log::INFO, "New VM state is BOOT");
    
    //----------------------------------------------------
    
    vmm->trigger(action,vid);
        
    vm->unlock();
    
    return;
    
error:
    vm->log("LCM",Log::ERROR,"prolog_success_action, VM in a wrong state");        
    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::prolog_failure_action(int vid)
{
    Nebula&             nd = Nebula::instance();
    DispatchManager *   dm = nd.get_dm();
    VirtualMachine *    vm;
    
    DispatchManager::Actions action;
    
    vm = vmpool->get(vid,true);
    
    if ( vm == 0 )
    {
        return;
    }
    
    if ( vm->get_lcm_state() == VirtualMachine::PROLOG_MIGRATE )
    {
        action = DispatchManager::MIGRATE_FAILURE;
    }
    else if ( vm->get_lcm_state() == VirtualMachine::PROLOG)
    {
        action = DispatchManager::FAILED;
    }
    else
    {
        goto error;
    }
    
    vm->set_prolog_etime(time(0));
    
    vmpool->update_history(vm);

    //----------------------------------------------------

    dm->trigger(action,vid);
    
    vm->unlock();
    
    return;
    
error:
    vm->log("LCM",Log::ERROR,"prolog_failure_action, VM in a wrong state");
    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::epilog_success_action(int vid)
{
    Nebula&             nd = Nebula::instance();
    DispatchManager *   dm = nd.get_dm();
    VirtualMachine *    vm;
    time_t              the_time = time(0);
    
    DispatchManager::Actions action;
    
    vm = vmpool->get(vid,true);
    
    if ( vm == 0 )
    {
        return;
    }
    
    if ( vm->get_lcm_state() == VirtualMachine::EPILOG_STOP )
    {
        action = DispatchManager::STOP_SUCCESS;
    }
    else if ( vm->get_lcm_state() == VirtualMachine::EPILOG)
    {
        action = DispatchManager::DONE;
    }
    else
    {
        goto error;
    }
    
    vm->set_epilog_etime(the_time);
        
    vmpool->update_history(vm);
    
    //----------------------------------------------------
    
    dm->trigger(action,vid);
    
    vm->unlock();
    
    return;
        
error:
    vm->log("LCM",Log::ERROR,"epilog_success_action, VM in a wrong state");
    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::epilog_failure_action(int vid)
{
    Nebula&             nd = Nebula::instance();
    DispatchManager *   dm = nd.get_dm();
    VirtualMachine *    vm;
    
    DispatchManager::Actions action;
    
    vm = vmpool->get(vid,true);
    
    if ( vm == 0 )
    {
        return;
    }
    
    if ( vm->get_lcm_state() == VirtualMachine::EPILOG_STOP )
    {
        action = DispatchManager::STOP_FAILURE;
    }
    else if ( vm->get_lcm_state() == VirtualMachine::EPILOG)
    {
        action = DispatchManager::FAILED;   
    }
    else
    {
        goto error;
    }
    
    vm->set_epilog_etime(time(0));
            
    vmpool->update_history(vm);
    
    dm->trigger(action,vid);
    
    vm->unlock();
    
    return;
        
error:
    vm->log("LCM",Log::ERROR,"epilog_failure_action, VM in a wrong state");
    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void  LifeCycleManager::cancel_success_failure_action(int vid)
{
    VirtualMachine *    vm;
    Nebula&             nd = Nebula::instance();
    DispatchManager *   dm = nd.get_dm();
    
    vm = vmpool->get(vid,true);
    
    if ( vm == 0 )
    {
        return;
    }
    
    dm->trigger(DispatchManager::DONE,vid);
    
    vm->unlock();
}

