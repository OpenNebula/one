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

#include "HookManager.h"
#include "NebulaLog.h"

const char * HookManager::hook_driver_name = "hook_exe";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" void * hm_action_loop(void *arg)
{
    HookManager *  hm;

    if ( arg == 0 )
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
    int               rc;
    pthread_attr_t    pattr;

    rc = MadManager::start();

    if ( rc != 0 )
    {
        return -1;
    }

    NebulaLog::log("HKM",Log::INFO,"Starting Hook Manager...");

    pthread_attr_init (&pattr);
    pthread_attr_setdetachstate (&pattr, PTHREAD_CREATE_JOINABLE);

    rc = pthread_create(&hm_thread,&pattr,hm_action_loop,(void *) this);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HookManager::load_mads(int uid)
{
    HookManagerDriver *     hm_mad;
    ostringstream           oss;
    const VectorAttribute * vattr = 0;
    int                     rc;

    NebulaLog::log("HKM",Log::INFO,"Loading Hook Manager driver.");

    if ( mad_conf.size() > 0 )
    {
        vattr = static_cast<const VectorAttribute *>(mad_conf[0]);
    }

    if ( vattr == 0 )
    {
        NebulaLog::log("HKM",Log::INFO,"Failed to load Hook Manager driver.");
        return -1;
    }

    VectorAttribute hook_conf("HOOK_MAD",vattr->value());

    hook_conf.replace("NAME",hook_driver_name);

    hm_mad = new HookManagerDriver(0,hook_conf.value(),false);

    rc = add(hm_mad);

    if ( rc == 0 )
    {
        oss.str("");
        oss << "\tHook Manager loaded";

        NebulaLog::log("HKM",Log::INFO,oss);
    }

    return rc;
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
    const HookManagerDriver* hmd = get();

    if ( hmd == nullptr )
    {
        return;
    }

    hmd->execute(message);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HookManager::retry_action(const std::string& message)
{
    const HookManagerDriver* hmd = get();

    if ( hmd == nullptr )
    {
        return;
    }

    hmd->retry(message);
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
