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

#include "IPAMManager.h"
#include "IPAMRequest.h"

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

    NebulaLog::log("IPM",Log::INFO,"IPAM Manager started.");

    ipamm->am.loop(ipamm->timer_period);

    NebulaLog::log("IPM",Log::INFO,"IPAM Manager stopped.");

    return 0;
}

/* -------------------------------------------------------------------------- */

int IPAMManager::start()
{
    int            rc;
    pthread_attr_t pattr;

    rc = MadManager::start();

    if ( rc != 0 )
    {
        return -1;
    }

    NebulaLog::log("IPM",Log::INFO,"Starting IPAM Manager...");

    pthread_attr_init(&pattr);
    pthread_attr_setdetachstate(&pattr, PTHREAD_CREATE_JOINABLE);

    rc = pthread_create(&ipamm_thread, &pattr, ipamm_action_loop, (void *)this);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void IPAMManager::user_action(const ActionRequest& ar)
{
    const IPMAction& ipam_ar = static_cast<const IPMAction&>(ar);

    IPAMRequest * request = ipam_ar.request();

    if ( request == 0 )
    {
        return;
    }

    switch(ipam_ar.action())
    {
        case IPMAction::REGISTER_ADDRESS_RANGE:
            register_address_range_action(request);
        break;

        case IPMAction::UNREGISTER_ADDRESS_RANGE:
            unregister_address_range_action(request);
        break;

        case IPMAction::ALLOCATE_ADDRESS:
            allocate_address_action(request);
        break;

        case IPMAction::GET_ADDRESS:
            get_address_action(request);
        break;

        case IPMAction::FREE_ADDRESS:
            free_address_action(request);
        break;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const IPAMManagerDriver * IPAMManager::setup_request(IPAMRequest * ir)
{
    const IPAMManagerDriver * ipammd = get();

    if (ipammd == 0)
    {
        ir->result  = false;
        ir->message = "Could not find the IPAM driver";

        ir->notify();

        return 0;
    }

    add_request(ir);

    return ipammd;
}

/* -------------------------------------------------------------------------- */

void IPAMManager::register_address_range_action(IPAMRequest * ir)
{
    std::string action_data;
    const IPAMManagerDriver * ipammd = setup_request(ir);

    if (ipammd == 0)
    {
        return;
    }

    ipammd->register_address_range(ir->id, ir->to_xml64(action_data));
}


/* -------------------------------------------------------------------------- */

void IPAMManager::unregister_address_range_action(IPAMRequest * ir)
{
    std::string action_data;
    const IPAMManagerDriver * ipammd = setup_request(ir);

    if (ipammd == 0)
    {
        return;
    }

    ipammd->unregister_address_range(ir->id, ir->to_xml64(action_data));
}

/* -------------------------------------------------------------------------- */

void IPAMManager::get_address_action(IPAMRequest * ir)
{
    std::string action_data;
    const IPAMManagerDriver * ipammd = setup_request(ir);

    if (ipammd == 0)
    {
        return;
    }

    ipammd->get_address(ir->id, ir->to_xml64(action_data));
}

/* -------------------------------------------------------------------------- */

void IPAMManager::allocate_address_action(IPAMRequest * ir)
{
    std::string action_data;
    const IPAMManagerDriver * ipammd = setup_request(ir);

    if (ipammd == 0)
    {
        return;
    }

    ipammd->allocate_address(ir->id, ir->to_xml64(action_data));
}

/* -------------------------------------------------------------------------- */

void IPAMManager::free_address_action(IPAMRequest * ir)
{
    std::string action_data;
    const IPAMManagerDriver * ipammd = setup_request(ir);

    if (ipammd == 0)
    {
        return;
    }

    ipammd->free_address(ir->id, ir->to_xml64(action_data));
}

/* ************************************************************************** */
/* MAD Loading                                                                */
/* ************************************************************************** */

int IPAMManager::load_mads(int uid)
{
    const VectorAttribute * vattr;
    IPAMManagerDriver *     ipamm_driver;

    if ( mad_conf.size() == 0 )
    {
        return 0;
    }

    NebulaLog::log("IPM", Log::INFO, "Loading IPAM Manager driver.");

    vattr = dynamic_cast<const VectorAttribute *>(mad_conf[0]);

    if ( vattr == 0 )
    {
        NebulaLog::log("IPM", Log::ERROR, "Failed to load IPAM Manager driver.");
        return -1;
    }

    VectorAttribute ipam_conf("IPAM_MAD", vattr->value());

    ipam_conf.replace("NAME", ipam_driver_name);

    ipamm_driver = new IPAMManagerDriver(uid, ipam_conf.value(), false, this);

    if ( add(ipamm_driver) != 0 )
    {
        return -1;
    }

    NebulaLog::log("IPM", Log::INFO, "\tIPAM Manager loaded");

    return 0;
}
