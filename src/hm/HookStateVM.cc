/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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

#include "HookStateVM.h"
#include "VirtualMachine.h"
#include "NebulaUtil.h"
#include "SSLUtil.h"

using namespace std;


bool HookStateVM::trigger(VirtualMachine * vm)
{
    return vm->has_changed_state();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string HookStateVM::format_message(VirtualMachine * vm)
{
    std::ostringstream oss;
    std::string vm_xml;
    std::string state, lcm_state, service_id;

    oss << "<HOOK_MESSAGE>"
        << "<HOOK_TYPE>STATE</HOOK_TYPE>"
        << "<HOOK_OBJECT>VM</HOOK_OBJECT>"
        << "<STATE>" << VirtualMachine::vm_state_to_str(state, vm->get_state()) << "</STATE>"
        << "<LCM_STATE>" << VirtualMachine::lcm_state_to_str(lcm_state, vm->get_lcm_state()) << "</LCM_STATE>"
        << "<RESOURCE_ID>" << vm->get_oid() << "</RESOURCE_ID>";

    vm->get_user_template_attribute("SERVICE_ID", service_id);

    if ( !service_id.empty() )
    {
        oss << "<SERVICE_ID>" << service_id << "</SERVICE_ID>";
    }

    if ( vm->hasHistory() )
    {
        oss << "<REMOTE_HOST>" << vm->get_hostname() << "</REMOTE_HOST>";
    }
    else
    {
        oss << "<REMOTE_HOST/>";
    }

    oss << vm->to_xml_extended(vm_xml)
        << "</HOOK_MESSAGE>";

    string base64;
    ssl_util::base64_encode(oss.str(), base64);

    return base64;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HookStateVM::parse_template(Template * tmpl, std::string& error_str)
{
    std::string on;

    std::string lcm_str;
    std::string vm_str;

    tmpl->get("ON", on);
    tmpl->erase("ON");

    one_util::toupper(on);

    if ( on == "PROLOG" )
    {
        state = VirtualMachine::ACTIVE;
        lcm_state = VirtualMachine::PROLOG;
    }
    else if ( on == "RUNNING" )
    {
        state = VirtualMachine::ACTIVE;
        lcm_state = VirtualMachine::RUNNING;
    }
    else if ( on == "SHUTDOWN" )
    {
        state = VirtualMachine::ACTIVE;
        lcm_state = VirtualMachine::EPILOG;
    }
    else if ( on == "STOP" )
    {
        state = VirtualMachine::STOPPED;
        lcm_state = VirtualMachine::LCM_INIT;
    }
    else if ( on == "DONE" )
    {
        state = VirtualMachine::DONE;
        lcm_state = VirtualMachine::LCM_INIT;
    }
    else if ( on == "UNKNOWN" )
    {
        state = VirtualMachine::ACTIVE;
        lcm_state = VirtualMachine::UNKNOWN;
    }
    else if ( on == "CUSTOM" )
    {
        bool rc;

        rc = tmpl->get("STATE", vm_str);

        if (!rc || VirtualMachine::vm_state_from_str(vm_str, state) != 0)
        {
            error_str = "Wrong STATE: " + vm_str;
            return -1;
        }

        rc = tmpl->get("LCM_STATE", lcm_str);

        if (!rc || VirtualMachine::lcm_state_from_str(lcm_str, lcm_state) != 0)
        {
            error_str = "Wrong LCM_STATE: " + lcm_str;
            return -1;
        }
    }
    else
    {
        error_str = "Unkown state condition: " + on;
        return -1;
    }

    tmpl->replace("STATE", VirtualMachine::vm_state_to_str(vm_str, state));
    tmpl->replace("LCM_STATE", VirtualMachine::lcm_state_to_str(lcm_str, lcm_state));

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HookStateVM::from_template(const Template * tmpl, string& error)
{
    std::string state_str;
    std::string lcm_state_str;

    int rc;

    tmpl->get("STATE", state_str);
    tmpl->get("LCM_STATE", lcm_state_str);

    rc  = VirtualMachine::vm_state_from_str(state_str, state);
    rc += VirtualMachine::lcm_state_from_str(lcm_state_str, lcm_state);

    if ( rc != 0 )
    {
        error = "Invalid VM state";
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HookStateVM::post_update_template(Template * tmpl, std::string& error)
{
    std::string new_state_str, new_lcm_str;

    VirtualMachine::VmState new_state;
    VirtualMachine::LcmState new_lcm;

    if ( tmpl->get("STATE", new_state_str) &&
         VirtualMachine::vm_state_from_str(new_state_str, new_state) == 0)
    {
        state = new_state;
        tmpl->replace("STATE", new_state_str);
    }
    else
    {
        error = "The STATE attribute is not defined or it's invalid.";
        return -1;
    }

    if ( tmpl->get("LCM_STATE", new_lcm_str) &&
         VirtualMachine::lcm_state_from_str(new_lcm_str, new_lcm) == 0)
    {
        lcm_state = new_lcm;
        tmpl->replace("LCM_STATE", new_lcm_str);
    }
    else
    {
        error = "The LCM_STATE attribute is not defined or it's invalid.";
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
