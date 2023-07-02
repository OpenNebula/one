/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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

#ifndef HOOK_STATE_VM_H_
#define HOOK_STATE_VM_H_

#include "VirtualMachine.h"
#include "HookImplementation.h"

class HookStateVM : public HookImplementation
{
public:
    /**
     *  @return true if an state hook needs to be trigger for this VM
     */
    static bool trigger(VirtualMachine * vm);

    /**
     *  Function to build a XML message for a state hook
     */
    static std::string format_message(VirtualMachine * vm);

private:
    friend class Hook;

    // *************************************************************************
    // Constructor/Destructor
    // *************************************************************************

    HookStateVM():state(VirtualMachine::INIT),
        lcm_state(VirtualMachine::LCM_INIT){};

    virtual ~HookStateVM() = default;

    /**
     *  Check if type dependent attributes are well defined.
     *    @param tmpl pointer to the Hook template
     *    @param error_str string with error information
     *    @return 0 on success
     */
    int parse_template(Template *tmpl, std::string& error_str) override;

    /**
     *  Rebuilds the object from a template
     *    @param tmpl The template
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_template(const Template * tmpl, std::string& error) override;

    /* Checks the mandatory template attributes
     *    @param tmpl The hook template
     *    @param error string describing the error if any
     *    @return 0 on success
     */
    int post_update_template(Template * tmpl, std::string& error) override;

    // -------------------------------------------------------------------------
    // Hook API Attributes
    // -------------------------------------------------------------------------
    /**
     * VirtualMachine::VmState custom_state VM state which trigger the hook
     * if hook_state is set to CUSTOM
     */
    VirtualMachine::VmState state;

    /**
     * VirtualMachine::LcmState custom_lcm_state VM LCM state which trigger the hook
     * if hook_state is set to CUSTOM
     */
    VirtualMachine::LcmState lcm_state;
};

#endif
