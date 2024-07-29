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

#include "HookStateHost.h"
#include "NebulaLog.h"
#include "Host.h"
#include "SSLUtil.h"

using std::string;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool HookStateHost::trigger(Host * host)
{
    return host->has_changed_state();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string HookStateHost::format_message(Host * host)
{
    std::ostringstream oss;
    std::string host_xml;

    oss << "<HOOK_MESSAGE>"
        << "<HOOK_TYPE>STATE</HOOK_TYPE>"
        << "<HOOK_OBJECT>HOST</HOOK_OBJECT>"
        << "<STATE>" << Host::state_to_str(host->get_state()) << "</STATE>"
        << "<REMOTE_HOST>" << host->get_name() << "</REMOTE_HOST>"
        << "<RESOURCE_ID>" << host->get_oid() << "</RESOURCE_ID>"
        << host->to_xml(host_xml)
        << "</HOOK_MESSAGE>";

    string base64;
    ssl_util::base64_encode(oss.str(), base64);

    return base64;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HookStateHost::parse_template(Template * tmpl, std::string& error_str)
{
    std::string state_str;

    tmpl->get("STATE", state_str);
    tmpl->erase("STATE");

    if (Host::str_to_state(state_str, state) != 0)
    {
        error_str = "Invalid STATE: " + state_str;
        return -1;
    }

    tmpl->add("STATE", Host::state_to_str(state));

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */


int HookStateHost::from_template(const Template * tmpl, std::string& error_str)
{
    std::string state_str;

    tmpl->get("STATE", state_str);

    if (Host::str_to_state(state_str, state) != 0)
    {
        error_str = "Invalid STATE: " + state_str;
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HookStateHost::post_update_template(Template * tmpl, string& error)
{
    std::string     new_state_str;
    Host::HostState new_state;

    tmpl->get("STATE", new_state_str);

    if (Host::str_to_state(new_state_str, new_state) != 0)
    {
        error = "The STATE attribute is not defined or it's invalid.";
        return -1;
    }

    state = new_state;
    tmpl->replace("STATE", new_state_str);

    return 0;
}
