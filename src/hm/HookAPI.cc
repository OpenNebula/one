/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

#include "HookAPI.h"
#include "Nebula.h"
#include "Request.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

std::string * HookAPI::format_message(std::string method, ParamList& paramList,
            const RequestAttributes& att)
{
    ostringstream oss;

    oss << "<HOOK_MESSAGE>"
        << "<HOOK_TYPE>API</HOOK_TYPE>"
        << "<CALL>" << method << "</CALL>"
        << "<CALL_INFO>"
        << "<RESULT>" << att.success << "</RESULT>"
        << "<PARAMETERS>";

        for (int i = 0; i < paramList.size(); i++)
        {
            oss << "<PARAMETER" << i + 1 << ">"
                << paramList.get_value_as_string(i)
                << "</PARAMETER" << i + 1 << ">";
        }

    oss << "</PARAMETERS>"
        << att.retval_xml
        << "</CALL_INFO>"
        << "</HOOK_MESSAGE>";

    return one_util::base64_encode(oss.str());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HookAPI::parse_template(Template * tmpl, string& error_str)
{
    tmpl->get("CALL", call);
    tmpl->erase("CALL");

    if (!call_exist(call))
    {
        error_str = "API call does not exist: " + call;
        return -1;
    }

    tmpl->add("CALL", call);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HookAPI::from_template(const Template * tmpl, string& error_str)
{
    tmpl->get("CALL", call);

    if (!call_exist(call))
    {
        error_str = "API call does not exist: " + call;
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HookAPI::post_update_template(Template * tmpl, string& error)
{
    string new_call;

    tmpl->get("CALL", new_call);

    if (call_exist(new_call))
    {
        call = new_call;
        tmpl->replace("CALL", call);
    }
    else
    {
        error = "The CALL attribute is not defined or it's invalid.";
        return -1;
    }


    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool HookAPI::call_exist(const string& api_call)
{
    RequestManager * rm = Nebula::instance().get_rm();

    return rm->exist_method(api_call);
}
