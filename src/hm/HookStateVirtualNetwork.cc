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

#include "HookStateVirtualNetwork.h"
#include "NebulaLog.h"
#include "SSLUtil.h"

using std::string;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool HookStateVirtualNetwork::trigger(VirtualNetwork * vn)
{
    return vn->has_changed_state();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string HookStateVirtualNetwork::format_message(VirtualNetwork * vn)
{
    std::ostringstream oss;
    string vn_xml;

    oss << "<HOOK_MESSAGE>"
        << "<HOOK_TYPE>STATE</HOOK_TYPE>"
        << "<HOOK_OBJECT>NET</HOOK_OBJECT>"
        << "<STATE>" << VirtualNetwork::state_to_str(vn->get_state()) << "</STATE>"
        << "<RESOURCE_ID>" << vn->get_oid() << "</RESOURCE_ID>"
        << vn->to_xml(vn_xml)
        << "</HOOK_MESSAGE>";

    string base64;
    ssl_util::base64_encode(oss.str(), base64);

    return base64;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HookStateVirtualNetwork::parse_template(Template * tmpl, string& error_str)
{
    string state_str;

    tmpl->get("STATE", state_str);
    tmpl->erase("STATE");

    state = VirtualNetwork::str_to_state(state_str);
    if (state == VirtualNetwork::INIT)
    {
        error_str = "Invalid STATE: " + state_str;
        return -1;
    }

    tmpl->add("STATE", VirtualNetwork::state_to_str(state));

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HookStateVirtualNetwork::from_template(const Template * tmpl, string& error_str)
{
    string state_str;

    if ( tmpl->get("STATE", state_str) )
    {
        VirtualNetwork::VirtualNetworkState _state = VirtualNetwork::str_to_state(state_str);

        if (_state == VirtualNetwork::INIT)
        {
            error_str = "Invalid or unknown STATE attribute";
            return -1;
        }
    }
    else
    {
        error_str = "STATE attribute not found or invalid";
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HookStateVirtualNetwork::post_update_template(Template * tmpl, string& error)
{
    string new_state_str;

    if ( tmpl->get("STATE", new_state_str) )
    {
        VirtualNetwork::VirtualNetworkState new_state = VirtualNetwork::str_to_state(new_state_str);

        if ( new_state != VirtualNetwork::INIT )
        {
            state = new_state;
            tmpl->replace("STATE", new_state_str);
        }
    }
    else
    {
        error = "The STATE attribute is not defined or it's invalid.";
        return -1;
    }

    return 0;
}
