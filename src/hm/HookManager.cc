/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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

    hm->am.loop(0,0);

    NebulaLog::log("HKM",Log::INFO,"Hook Manager stopped.");

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HookManager::load_mads(int uid)
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
        return;
    }

    VectorAttribute hook_conf("HOOK_MAD",vattr->value());

    hook_conf.replace("NAME",hook_driver_name);

    hm_mad = new HookManagerDriver(0,hook_conf.value(),false,vmpool);

    rc = add(hm_mad);

    if ( rc == 0 )
    {
        oss.str("");
        oss << "\tHook Manager loaded";

        NebulaLog::log("HKM",Log::INFO,oss);
    }
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

void HookManager::do_action(const string &action, void * arg)
{
    if (action == ACTION_FINALIZE)
    {
        NebulaLog::log("HKM",Log::INFO,"Stopping Hook Manager...");

        MadManager::stop();
    }
    else
    {
        ostringstream oss;
        oss << "Unknown action name: " << action;

        NebulaLog::log("HKM", Log::ERROR, oss);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

