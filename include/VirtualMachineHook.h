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

#ifndef VIRTUAL_MACHINE_HOOK_H_
#define VIRTUAL_MACHINE_HOOK_H_

#include <vector>
#include <string>
#include <VirtualMachine.h>

using namespace std;

/**
 *  This class is general VM Allocate Hook that executes a command locally 
 *  when the VM is inserted in the database. The VirtualMachine object is
 *  looked
 */
class VirtualMachineAllocateHook : public Hook
{
public:
    // -------------------------------------------------------------------------
    // Init a LOCAL hook of ALLOCATE type
    // -------------------------------------------------------------------------
    VirtualMachineAllocateHook(const string& cmd, const string& args):
        Hook(cmd, args, Hook::ALLOCATE, false){};
        
    virtual ~VirtualMachineAllocateHook(){};

    // -------------------------------------------------------------------------
    // Hook methods
    // -------------------------------------------------------------------------
    bool check_hook(void *arg)
    {
        return true;
    }

    void do_hook(void *arg)
    {    
        VirtualMachine * vm;
        int              rc;
        string           parsed_args;
        
        vm = static_cast<VirtualMachine *>(arg);
        
        if ( vm == 0 )
        {
            return;
        }
        
        rc = vm->parse_template_attribute(args, parsed_args);
        
        if ( rc == 0)
        {
            ostringstream oss;
            
            oss << "Will execute hook: " << cmd << " " << parsed_args;
            Nebula::log("ONE", Log::DEBUG, oss);
        }            
    }
};

#endif
