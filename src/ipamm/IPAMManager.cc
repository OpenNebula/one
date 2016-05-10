/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

#include "IPAMManager.h"
#include "IPAMRequest.h"
#include "NebulaLog.h"
#include "NebulaUtil.h"
#include "Nebula.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const char * IPAMManager::ipam_driver_name = "ipam_exe";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" void * ipamm_action_loop(void *arg)
{
    IPAMManager * ipamm;

    if ( arg == 0 )
    {
        return 0;
    }

    ipamm = static_cast<IPAMManager *>(arg);

    NebulaLog::log("IpamM",Log::INFO,"IPAM Manager started.");

    ipamm->am.loop(ipamm->timer_period, 0);

    NebulaLog::log("IpamM",Log::INFO,"IPAM Manager stopped.");

    return 0;
}

/* -------------------------------------------------------------------------- */

int IPAMManager::start()
{
    int               rc;
    pthread_attr_t    pattr;

    rc = MadManager::start();

    if ( rc != 0 )
    {
        return -1;
    }

    NebulaLog::log("IpamM",Log::INFO,"Starting IPAM Manager...");

    pthread_attr_init (&pattr);
    pthread_attr_setdetachstate (&pattr, PTHREAD_CREATE_JOINABLE);

    rc = pthread_create(&ipamm_thread,&pattr,ipamm_action_loop,(void *) this);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void IPAMManager::trigger(Actions action, IPAMRequest * request)
{
    string  aname;

    switch (action)
    {
    case GET_USED_ADDR:
        aname = "GET_USED_ADDR";
        break;

    case GET_FREE_ADDR_RANGE:
        aname = "GET_FREE_ADDR_RANGE";
        break;

    case REGISTER_ADDR_RANGE:
        aname = "REGISTER_ADDR_RANGE";
        break;

    case FREE_ADDR:
        aname = "FREE_ADDR";
        break;

    case FINALIZE:
        aname = ACTION_FINALIZE;
        break;

    default:
        return;
    }

    am.trigger(aname,request);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void IPAMManager::do_action(const string &action, void * arg)
{
    IPAMRequest * request;

    request = static_cast<IPAMRequest *>(arg);
  
    if (action == "GET_USED_ADDR" && request != 0)
    {
        get_used_addr_action(request);
    }
    else if (action == "GET_FREE_ADDR_RANGE" && request != 0)
    {
        get_free_addr_range_action(request);
    }
    else if (action == "REGISTER_ADDR_RANGE" && request != 0)
    {
        register_addr_range_action(request); 
    }
    else if (action == "FREE_ADDR" && request != 0)
    {
        free_addr_action(request);
    }
    else if (action == ACTION_TIMER)
    {
        check_time_outs_action();
    }
    else if (action == ACTION_FINALIZE)
    {
        NebulaLog::log("IpamM",Log::INFO,"Stopping IPAM Manager...");

        MadManager::stop();
    }
    else
    {
        ostringstream oss;
        oss << "Unknown action name: " << action;

        NebulaLog::log("IpamM", Log::ERROR, oss);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
void IPAMManager::get_used_addr_action(IPAMRequest * ir)
{
    const IPAMManagerDriver * ipamm_md;

    ipamm_md = get();

    if (ipamm_md == 0)
    {
        goto error_driver;
    }

    add_request(ir);

    ipamm_md->get_used_addr(ir->id, ir->params);

    return;

error_driver:
    ir->result = false;
    ir->message = "Could not find IPAM driver";
    ir->notify();
}

void IPAMManager::get_free_addr_range_action(IPAMRequest * ir)
{
    const IPAMManagerDriver * ipamm_md;

    ipamm_md = get();

    if (ipamm_md == 0)
    {
        goto error_driver;
    }

    add_request(ir);

    ipamm_md->get_free_addr_range(ir->id, ir->params);

    return;

error_driver:
    ir->result = false;
    ir->message = "Could not find IPAM driver";
    ir->notify();
}

void IPAMManager::register_addr_range_action(IPAMRequest * ir)
{
    const IPAMManagerDriver * ipamm_md;

    ipamm_md = get();

    if (ipamm_md == 0)
    {
        goto error_driver;
    }

    add_request(ir);

    ipamm_md->register_addr_range(ir->id, ir->params);

    return;

error_driver:
    ir->result = false;
    ir->message = "Could not find IPAM driver";
    ir->notify();
}

void IPAMManager::free_addr_action(IPAMRequest * ir)
{
    const IPAMManagerDriver * ipamm_md;

    ipamm_md = get();

    if (ipamm_md == 0)
    {
        goto error_driver;
    }

    add_request(ir);

    ipamm_md->free_addr(ir->id, ir->params);

    return;

error_driver:
    ir->result = false;
    ir->message = "Could not find IPAM driver";
    ir->notify();
}

/* ************************************************************************** */
/* MAD Loading                                                                */
/* ************************************************************************** */

int IPAMManager::load_mads(int uid)
{
    ostringstream                   oss;
    const VectorAttribute *         vattr = 0;
    int                             rc;
    IPAMManagerDriver *             ipamm_driver = 0;

    NebulaLog::log("IpamM",Log::INFO,"Loading IPAM Manager driver.");

    if ( mad_conf.size() > 0 )
    {
        vattr = static_cast<const VectorAttribute *>(mad_conf[0]);
    }

    if ( vattr == 0 )
    {
        NebulaLog::log("IpamM",Log::ERROR,"Failed to load IPAM Manager driver.");
        return -1;
    }

    VectorAttribute ipam_conf("IPAM_MAD",vattr->value());

    ipam_conf.replace("NAME",ipam_driver_name);

    ipamm_driver = new IPAMManagerDriver(uid,ipam_conf.value(),false,this);

    rc = add(ipamm_driver);

    if ( rc == 0 )
    {
        oss.str("");
        oss << "\tIPAM Manager loaded";

        NebulaLog::log("IpamM",Log::INFO,oss);
    }

    return rc;
}
