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

    if ( arg == nullptr )
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
    pthread_attr_t pattr;

    using namespace std::placeholders; // for _1

    register_action(IPAMManagerMessages::UNDEFINED,
            &IPAMManager::_undefined);

    register_action(IPAMManagerMessages::REGISTER_ADDRESS_RANGE,
            bind(&IPAMManager::_notify_request, this, _1));

    register_action(IPAMManagerMessages::UNREGISTER_ADDRESS_RANGE,
            bind(&IPAMManager::_notify_request, this, _1));

    register_action(IPAMManagerMessages::GET_ADDRESS,
            bind(&IPAMManager::_notify_request, this, _1));

    register_action(IPAMManagerMessages::ALLOCATE_ADDRESS,
            bind(&IPAMManager::_notify_request, this, _1));

    register_action(IPAMManagerMessages::FREE_ADDRESS,
            bind(&IPAMManager::_notify_request, this, _1));

    register_action(IPAMManagerMessages::LOG,
            &IPAMManager::_log);

    string error;
    if ( DriverManager::start(error) != 0 )
    {
        NebulaLog::error("IPM", error);
        return -1;
    }

    NebulaLog::log("IPM",Log::INFO,"Starting IPAM Manager...");

    pthread_attr_init(&pattr);
    pthread_attr_setdetachstate(&pattr, PTHREAD_CREATE_JOINABLE);

    int rc = pthread_create(&ipamm_thread, &pattr, ipamm_action_loop, (void *)this);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void IPAMManager::user_action(const ActionRequest& ar)
{
    const IPMAction& ipam_ar = static_cast<const IPMAction&>(ar);

    IPAMRequest * request = ipam_ar.request();

    if ( request == nullptr )
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

void IPAMManager::send_request(IPAMManagerMessages type, IPAMRequest * ir)
{
    auto ipammd = get();

    if (ipammd == nullptr)
    {
        ir->result  = false;
        ir->message = "Could not find the IPAM driver";

        ir->notify();

        return;
    }

    add_request(ir);

    string action_data;
    ipam_msg_t msg(type, "", ir->id, ir->to_xml64(action_data));

    ipammd->write(msg);
}

/* -------------------------------------------------------------------------- */

void IPAMManager::register_address_range_action(IPAMRequest * ir)
{
    send_request(IPAMManagerMessages::REGISTER_ADDRESS_RANGE, ir);
}

/* -------------------------------------------------------------------------- */

void IPAMManager::unregister_address_range_action(IPAMRequest * ir)
{
    send_request(IPAMManagerMessages::UNREGISTER_ADDRESS_RANGE, ir);
}

/* -------------------------------------------------------------------------- */

void IPAMManager::get_address_action(IPAMRequest * ir)
{
    send_request(IPAMManagerMessages::GET_ADDRESS, ir);
}

/* -------------------------------------------------------------------------- */

void IPAMManager::allocate_address_action(IPAMRequest * ir)
{
    send_request(IPAMManagerMessages::ALLOCATE_ADDRESS, ir);
}

/* -------------------------------------------------------------------------- */

void IPAMManager::free_address_action(IPAMRequest * ir)
{
    send_request(IPAMManagerMessages::FREE_ADDRESS, ir);
}

/* ************************************************************************** */
/* MAD Loading                                                                */
/* ************************************************************************** */

int IPAMManager::load_drivers(const std::vector<const VectorAttribute*>& _mads)
{
    if ( _mads.size() == 0 )
    {
        return 0;
    }

    NebulaLog::log("IPM", Log::INFO, "Loading IPAM Manager driver.");

    const VectorAttribute * vattr = _mads[0];

    if ( vattr == nullptr )
    {
        NebulaLog::log("IPM", Log::ERROR, "Failed to load IPAM Manager driver.");
        return -1;
    }

    VectorAttribute ipam_conf("IPAM_MAD", vattr->value());

    ipam_conf.replace("NAME", ipam_driver_name);

    if ( load_driver(&ipam_conf) != 0 )
    {
        NebulaLog::error("ImM", "Unable to load IPAM Manager driver");
        return -1;
    }

    NebulaLog::log("IPM", Log::INFO, "\tIPAM Manager loaded");

    return 0;
}
