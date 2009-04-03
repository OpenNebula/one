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

#include "VirtualMachineHook.h"
#include "VirtualMachine.h"
#include "Nebula.h"

void VirtualMachineAllocateHook::do_hook(void *arg)
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
        Nebula& ne                    = Nebula::instance();
        HookManager * hm              = ne.get_hm();
        const HookManagerDriver * hmd = hm->get();
        
        if ( hmd != 0 )
        {
            hmd->execute(vm->get_oid(),name,cmd,parsed_args);
        }
    }            
}

