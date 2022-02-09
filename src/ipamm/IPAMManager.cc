/* -------------------------------------------------------------------------- */
/* Copyright 2002-2022, OpenNebula Project, OpenNebula Systems                */
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

using std::string;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const char * IPAMManager::ipam_driver_name = "ipam_exe";

/* -------------------------------------------------------------------------- */

int IPAMManager::start()
{
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

    Listener::start();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void IPAMManager::send_request(IPAMManagerMessages type, IPAMRequest& ir)
{
    auto ipammd = get();

    if (ipammd == nullptr)
    {
        ir.result  = false;
        ir.message = "Could not find the IPAM driver";

        ir.notify();

        return;
    }

    add_request(&ir);

    string action_data;
    ipam_msg_t msg(type, "", ir.id, ir.to_xml64(action_data));

    ipammd->write(msg);
}

/* -------------------------------------------------------------------------- */

void IPAMManager::trigger_register_address_range(IPAMRequest& ir)
{
    trigger([&] {
        send_request(IPAMManagerMessages::REGISTER_ADDRESS_RANGE, ir);
    });
}

/* -------------------------------------------------------------------------- */

void IPAMManager::trigger_unregister_address_range(IPAMRequest& ir)
{
    trigger([&] {
        send_request(IPAMManagerMessages::UNREGISTER_ADDRESS_RANGE, ir);
    });
}

/* -------------------------------------------------------------------------- */

void IPAMManager::trigger_get_address(IPAMRequest& ir)
{
    trigger([&] {
        send_request(IPAMManagerMessages::GET_ADDRESS, ir);
    });
}

/* -------------------------------------------------------------------------- */

void IPAMManager::trigger_allocate_address(IPAMRequest& ir)
{
    trigger([&] {
        send_request(IPAMManagerMessages::ALLOCATE_ADDRESS, ir);
    });
}

/* -------------------------------------------------------------------------- */

void IPAMManager::trigger_free_address(IPAMRequest& ir)
{
    trigger([&] {
        send_request(IPAMManagerMessages::FREE_ADDRESS, ir);
    });
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
