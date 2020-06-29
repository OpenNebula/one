/* -------------------------------------------------------------------------- */
/* Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                */
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

const char * HookManager::hook_driver_name = "hook_exe";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" void * hm_action_loop(void *arg)
{
    HookManager *  hm;

    if ( arg == nullptr )
    {
        return 0;
    }

    NebulaLog::log("HKM",Log::INFO,"Hook Manager started.");

    hm = static_cast<HookManager *>(arg);

    hm->am.loop();

    NebulaLog::log("HKM",Log::INFO,"Hook Manager stopped.");

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HookManager::start()
{
    pthread_attr_t    pattr;

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

    NebulaLog::log("HKM",Log::INFO,"Starting Hook Manager...");

    pthread_attr_init(&pattr);
    pthread_attr_setdetachstate(&pattr, PTHREAD_CREATE_JOINABLE);

    int rc = pthread_create(&hm_thread,&pattr,hm_action_loop,(void *) this);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HookManager::load_drivers(const std::vector<const VectorAttribute*>& _mads)
{
    const VectorAttribute * vattr = nullptr;

    NebulaLog::log("HKM",Log::INFO,"Loading Hook Manager driver.");

    if ( _mads.size() > 0 )
    {
        vattr = static_cast<const VectorAttribute *>(_mads[0]);
    }

    if ( vattr == nullptr )
    {
        NebulaLog::log("HKM",Log::INFO,"Failed to load Hook Manager driver.");
        return -1;
    }

    VectorAttribute hook_conf("HOOK_MAD",vattr->value());

    hook_conf.replace("NAME",hook_driver_name);

    if ( load_driver(&hook_conf) != 0 )
    {
        NebulaLog::error("HKM", "Unable to load Hook Manager driver");
        return -1;
    }

    NebulaLog::log("HKM",Log::INFO,"\tHook Manager loaded");

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HookManager::user_action(const ActionRequest& ar)
{
    const HMAction& hm_ar      = static_cast<const HMAction& >(ar);
    const std::string& message = hm_ar.message();

    switch (hm_ar.action())
    {
        case HMAction::SEND_EVENT:
            send_event_action(message);
            break;
        case HMAction::RETRY:
            retry_action(message);
            break;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HookManager::send_event_action(const std::string& message)
{
    auto hmd = get();

    if ( hmd == nullptr )
    {
        return;
    }

    hook_msg_t msg(HookManagerMessages::EXECUTE, "", -1, message);
    hmd->write(msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HookManager::retry_action(const std::string& message)
{
    auto hmd = get();

    if ( hmd == nullptr )
    {
        return;
    }

    hook_msg_t msg(HookManagerMessages::RETRY, "", -1, message);
    hmd->write(msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string * HookManager::format_message(const string& args, const string&remote_host,
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

    return one_util::base64_encode(oss.str());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
