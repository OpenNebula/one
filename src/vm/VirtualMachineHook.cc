/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

void VirtualMachineStateHook::do_hook(void *arg)
{

    VirtualMachine * vm;

    vm = static_cast<VirtualMachine *>(arg);

    if ( vm == 0 )
    {
        return;
    }

    if ( vm->has_changed_state() &&
         vm->get_lcm_state() == lcm &&
         vm->get_state() == this->vm )
    {
        string  parsed_args = args;

        parse_hook_arguments(vm, vm->get_prev_state(), vm->get_prev_lcm_state(),
            parsed_args);

        Nebula& ne        = Nebula::instance();
        HookManager * hm  = ne.get_hm();

        const HookManagerDriver * hmd = hm->get();

        if ( hmd != 0 )
        {
            if ( ! remote )
            {
                hmd->execute(vm->get_oid(), name, cmd, parsed_args);
            }
            else if ( vm->hasHistory() )
            {
                hmd->execute(vm->get_oid(),
                     name,
                     vm->get_hostname(),
                     cmd,
                     parsed_args);
            }
        }
    }
}
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

void VirtualMachineStateHook::parse_hook_arguments(PoolObjectSQL * obj,
            VirtualMachine::VmState prev_dm, VirtualMachine::LcmState prev_lcm,
            string& parsed)
{
    Hook::parse_hook_arguments(obj, parsed);

    size_t  found;

    found = parsed.find("$PREV_STATE");

    if ( found !=string::npos )
    {
        string str;

        parsed.replace(found, 11, VirtualMachine::vm_state_to_str(str, prev_dm));
    }

    found = parsed.find("$PREV_LCM_STATE");

    if ( found != string::npos )
    {
        string str;

        parsed.replace(found, 15, VirtualMachine::lcm_state_to_str(str, prev_lcm));
    }
}
