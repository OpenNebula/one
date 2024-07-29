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

#include "HookManager.h"
#include "NebulaLog.h"

using namespace std;

const char * HookManager::hook_driver_name = "hook_exe";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HookManager::start()
{
    using namespace std::placeholders; // for _1

    register_action(HookManagerMessages::UNDEFINED,
                    &HookManager::_undefined);

    register_action(HookManagerMessages::EXECUTE,
                    bind(&HookManager::_execute, this, _1));

    register_action(HookManagerMessages::RETRY,
                    bind(&HookManager::_retry, this, _1));

    register_action(HookManagerMessages::LOG,
                    &HookManager::_log);

    string error;
    if ( DriverManager::start(error) != 0 )
    {
        NebulaLog::error("HKM", error);
        return -1;
    }

    NebulaLog::log("HKM", Log::INFO, "Starting Hook Manager...");

    Listener::start();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HookManager::load_drivers(const std::vector<const VectorAttribute*>& _mads)
{
    const VectorAttribute * vattr = nullptr;

    NebulaLog::log("HKM", Log::INFO, "Loading Hook Manager driver.");

    if ( _mads.size() > 0 )
    {
        vattr = static_cast<const VectorAttribute *>(_mads[0]);
    }

    if ( vattr == nullptr )
    {
        NebulaLog::log("HKM", Log::INFO, "Failed to load Hook Manager driver.");
        return -1;
    }

    VectorAttribute hook_conf("HOOK_MAD", vattr->value());

    hook_conf.replace("NAME", hook_driver_name);

    if ( load_driver(&hook_conf) != 0 )
    {
        NebulaLog::error("HKM", "Unable to load Hook Manager driver");
        return -1;
    }

    NebulaLog::log("HKM", Log::INFO, "\tHook Manager loaded");

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HookManager::trigger_send_event(const std::string& message)
{
    trigger([this, message]
    {
        auto hmd = get();

        if ( hmd == nullptr )
        {
            return;
        }

        hook_msg_t msg(HookManagerMessages::EXECUTE, "", -1, message);
        hmd->write(msg);
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HookManager::trigger_retry(const std::string& message)
{
    trigger([this, message]
    {
        auto hmd = get();

        if ( hmd == nullptr )
        {
            return;
        }

        hook_msg_t msg(HookManagerMessages::RETRY, "", -1, message);
        hmd->write(msg);
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string HookManager::format_message(const string& args, const string&remote_host,
                                   int hook_id)
{
    std::ostringstream oss;

    oss << "<HOOK_MESSAGE>"
        << "<ARGUMENTS>"   << args        << "</ARGUMENTS>"
        << "<HOOK_ID>"     << hook_id     << "</HOOK_ID>";

    if (!remote_host.empty())
    {
        oss << "<REMOTE_HOST>" << remote_host << "</REMOTE_HOST>";
    }

    oss << "</HOOK_MESSAGE>";

    string base64;
    ssl_util::base64_encode(oss.str(), base64);

    return base64;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
