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

#include "AuthManager.h"
#include "NebulaLog.h"

using namespace std;

/* ************************************************************************** */
/* Driver Protocol Implementation                                             */
/* ************************************************************************** */

void AuthManager::_undefined(unique_ptr<auth_msg_t> msg)
{
    NebulaLog::warn("AuM", "Received UNDEFINED msg: " + msg->payload());
}

/* -------------------------------------------------------------------------- */

void AuthManager::_authorize(unique_ptr<auth_msg_t> msg)
{
    NebulaLog::debug("AuM", "_authorize: " + msg->payload());

    if (msg->status() == "SUCCESS")
    {
        notify_request(msg->oid(), true, msg->payload());
    }
    else
    {
        notify_request(msg->oid(), false, msg->payload());
    }
}

/* -------------------------------------------------------------------------- */

void AuthManager::_authenticate(unique_ptr<auth_msg_t> msg)
{
    NebulaLog::debug("AuM", "_authenticate: " + msg->payload());

    if (msg->status() == "SUCCESS")
    {
        notify_request(msg->oid(), true, msg->payload());
    }
    else
    {
        notify_request(msg->oid(), false, msg->payload());
    }
}

/* -------------------------------------------------------------------------- */

void AuthManager::_log(unique_ptr<auth_msg_t> msg)
{
    NebulaLog::log("AuM", log_type(msg->status()[0]), msg->payload());
}
