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

#include "IPAMManager.h"
#include "NebulaLog.h"
#include "Nebula.h"
#include "ClusterPool.h"
#include "VirtualNetworkPool.h"

#include <sstream>

using namespace std;

/* ************************************************************************** */
/* Driver Protocol Implementation                                             */
/* ************************************************************************** */

void IPAMManager::_undefined(unique_ptr<ipam_msg_t> msg)
{
    NebulaLog::warn("IPM", "Received UNDEFINED msg: " + msg->payload());
}

/* -------------------------------------------------------------------------- */

void IPAMManager::_notify_request(unique_ptr<ipam_msg_t> msg)
{
    ostringstream os;

    os << "Message received: ";
    msg->write_to(os);

    NebulaLog::log("IPM", Log::DEBUG, os);

    if (msg->status() == "SUCCESS")
    {
        notify_request(msg->oid(), true, msg->payload());
    }
    else
    {
        string buffer;

        ssl_util::base64_decode(msg->payload(), buffer);
        notify_request(msg->oid(), false, buffer);
    }

    return;
}

/* -------------------------------------------------------------------------- */

void IPAMManager::_vnet_create(unique_ptr<ipam_msg_t> msg)
{
    ostringstream os;

    os << "Message received: ";
    msg->write_to(os);

    NebulaLog::debug("IPM", os.str());

    auto vnpool = Nebula::instance().get_vnpool();

    int  vn_id = msg->oid();
    auto vn    = vnpool->get(vn_id);

    if (!vn)
    {
        NebulaLog::error("IPM", "Received VNET_CREATE response for non-existing "
                         "VNET " + to_string(vn_id));
        return;
    }

    if (vn->get_state() != VirtualNetwork::LOCK_CREATE)
    {
        NebulaLog::error("IPM", "Received VNET_CREATE but VNET " + to_string(vn_id)
                         + " is in wrong state " + VirtualNetwork::state_to_str(vn->get_state()));
        return;
    }

    std::string info = msg->payload64();

    if (msg->status() == "SUCCESS")
    {
        string error_str;

        if (!info.empty())
        {
            if ( vn->append_template(info, false, error_str) != 0 )
            {
                vn->set_state(VirtualNetwork::ERROR);

                vn->set_template_error_message(error_str);

                return;
            }
        }

        vn->set_state(VirtualNetwork::READY);

        vn->clear_template_error_message();

        // Get the Address Ranges
        vector<VectorAttribute *> ars;

        int num_ars = vn->remove_template_attribute("AR", ars);
        int rc      = vn->add_var(ars, error_str);

        for (int i=0; i < num_ars; i++)
        {
            delete ars[i];
        }

        if (rc != 0)
        {
            vn->set_state(VirtualNetwork::ERROR);

            vn->set_template_error_message(error_str);

            NebulaLog::error("IPM", "Error creating address range for VNET "
                             + to_string(vn->get_oid()) + ": " + error_str);
        }
    }
    else
    {
        vn->set_state(VirtualNetwork::ERROR);

        vn->set_template_error_message(info);

        NebulaLog::error("IPM", "VNET " + to_string(vn_id) +
                         ", vnet_create failed: " + info);
    }

    vnpool->update(vn.get());

    return;
}

/* -------------------------------------------------------------------------- */

void IPAMManager::_vnet_delete(unique_ptr<ipam_msg_t> msg)
{
    ostringstream os;

    os << "Message received: ";
    msg->write_to(os);

    NebulaLog::debug("IPM", os.str());

    auto vnpool = Nebula::instance().get_vnpool();

    auto oid  = msg->oid();
    auto vn   = vnpool->get(oid);

    if (!vn)
    {
        NebulaLog::error("IPM", "Received VNET_DELETE response for non-existing "
                         "VNET " + to_string(oid));
        return;
    }

    if (vn->get_state() != VirtualNetwork::LOCK_DELETE)
    {
        NebulaLog::error("IPM", "Received VNET_DELETE but VNET " + to_string(oid)
                         + " is in wrong state " + VirtualNetwork::state_to_str(vn->get_state()));
        return;
    }

    if (msg->status() == "SUCCESS")
    {
        vnpool->delete_success(move(vn));
    }
    else
    {
        std::string info = msg->payload64();

        vn->set_state(VirtualNetwork::ERROR);
        vn->set_template_error_message(info);

        vnpool->update(vn.get());

        NebulaLog::error("IPM", "VNET " + to_string(oid) +
                         ", vnet_delete failed: " + info);
    }

    return;
}

/* -------------------------------------------------------------------------- */

void IPAMManager::_log(unique_ptr<ipam_msg_t> msg)
{
    NebulaLog::log("IPM", log_type(msg->status()[0]), msg->payload());
}
