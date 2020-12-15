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
#include "NebulaLog.h"

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

void IPAMManager::_log(unique_ptr<ipam_msg_t> msg)
{
    NebulaLog::log("IPM", log_type(msg->status()[0]), msg->payload());
}
