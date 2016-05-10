/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

#include "Hook.h"
#include "VirtualMachine.h"

using namespace std;

/**
 *  This class is a general VM State Hook that executes a command locally or
 *  remotelly when the VM gets into a given state (one shot). The VirtualMachine
 *  object is looked when the hook is invoked.
 */
class VirtualMachineStateHook : public Hook
{
public:
    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    /**
     *  Creates a VirtualMachineStateHook
     *    @param name of the hook
     *    @param cmd for the hook
     *    @param args for the hook
     *    @param _state the hook will be executed when the VM enters this state
     *    @param remote the hook will be executed on the target resource
     */
    VirtualMachineStateHook(const string&            name,
                            const string&            cmd,
                            const string&            args,
                            bool                     remote,
                            VirtualMachine::LcmState _lcm,
                            VirtualMachine::VmState  _vm):
        Hook(name, cmd, args, Hook::UPDATE | Hook::ALLOCATE, remote),
        lcm(_lcm),
        vm(_vm){};

    ~VirtualMachineStateHook(){};

    // -------------------------------------------------------------------------
    // Hook methods
    // -------------------------------------------------------------------------
    void do_hook(void *arg);

    /**
     *  Parses the arguments of the hook using: $ID, $TEMPLATE, $PREV_DM_STATE
     *  and $PREV_LCM_STATE
     *    @param obj pointer to the object executing the hook for
     *    @param the resulting parser arguments
     */
    void parse_hook_arguments(PoolObjectSQL *          obj,
                              VirtualMachine::VmState  prev_dm,
                              VirtualMachine::LcmState prev_lcm,
                              string&                  parsed);
private:
    /**
     *  The target LCM state
     */
    VirtualMachine::LcmState lcm;

    /**
     *  The target DM state
     */
    VirtualMachine::VmState  vm;
};

#endif
