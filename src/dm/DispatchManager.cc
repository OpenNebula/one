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

#include "DispatchManager.h"
#include "Nebula.h"
#include "NebulaLog.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" void * dm_action_loop(void *arg)
{
    DispatchManager *  dm;

    if ( arg == 0 )
    {
        return 0;
    }

    dm = static_cast<DispatchManager *>(arg);

    NebulaLog::log("DiM",Log::INFO,"Dispatch Manager started.");

    dm->am.loop(0,0);

    NebulaLog::log("DiM",Log::INFO,"Dispatch Manager stopped.");

    return 0;
}

/* -------------------------------------------------------------------------- */

int DispatchManager::start()
{
    int               rc;
    pthread_attr_t    pattr;

    pthread_attr_init (&pattr);
    pthread_attr_setdetachstate (&pattr, PTHREAD_CREATE_JOINABLE);

    NebulaLog::log("DiM",Log::INFO,"Starting Dispatch Manager...");

    rc = pthread_create(&dm_thread,&pattr,dm_action_loop,(void *) this);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void DispatchManager::trigger(Actions action, int _vid)
{
    int *   vid;
    string  aname;

    vid = new int(_vid);

    switch (action)
    {
    case SUSPEND_SUCCESS:
        aname = "SUSPEND_SUCCESS";
        break;

    case STOP_SUCCESS:
        aname = "STOP_SUCCESS";
        break;

    case UNDEPLOY_SUCCESS:
        aname = "UNDEPLOY_SUCCESS";
        break;

    case POWEROFF_SUCCESS:
        aname = "POWEROFF_SUCCESS";
        break;

    case DONE:
        aname = "DONE";
        break;

    case RESUBMIT:
        aname = "RESUBMIT";
        break;

    case FINALIZE:
        aname = ACTION_FINALIZE;
        break;

    default:
        delete vid;
        return;
    }

    am.trigger(aname,vid);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void DispatchManager::do_action(const string &action, void * arg)
{
    int             vid;
    ostringstream   oss;

    if (arg == 0)
    {
        return;
    }

    vid  = *(static_cast<int *>(arg));

    delete static_cast<int *>(arg);

    if (action == "SUSPEND_SUCCESS")
    {
        suspend_success_action(vid);
    }
    else if (action == "STOP_SUCCESS")
    {
        stop_success_action(vid);
    }
    else if (action == "UNDEPLOY_SUCCESS")
    {
        undeploy_success_action(vid);
    }
    else if (action == "POWEROFF_SUCCESS")
    {
        poweroff_success_action(vid);
    }
    else if (action == "DONE")
    {
        done_action(vid);
    }
    else if (action == "RESUBMIT")
    {
        resubmit_action(vid);
    }
    else if (action == ACTION_FINALIZE)
    {
        NebulaLog::log("DiM",Log::INFO,"Stopping Dispatch Manager...");
    }
    else
    {
        ostringstream oss;
        oss << "Unknown action name: " << action;

        NebulaLog::log("DiM", Log::ERROR, oss);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void DispatchManager::init_managers()
{
    Nebula& nd = Nebula::instance();

    tm  = nd.get_tm();
    vmm = nd.get_vmm();
    lcm = nd.get_lcm();

    imagem = nd.get_imagem();

    hpool       = nd.get_hpool();
    vmpool      = nd.get_vmpool();
    vrouterpool = nd.get_vrouterpool();
}

