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

#include "HookManager.h"
#include "HookLog.h"
#include "Nebula.h"
#include "NebulaLog.h"
#include <sstream>

using namespace std;


static void log_msg(hook_msg_t *msg)
{
    ostringstream oss;

    oss << "Message received: ";
    msg->write_to(oss);

    NebulaLog::log("HKM", Log::DEBUG, oss);
}

/* ************************************************************************** */
/* Driver Protocol Implementation                                       */
/* ************************************************************************** */

void HookManager::_undefined(unique_ptr<hook_msg_t> msg)
{
    NebulaLog::warn("HKM", "Received UNDEFINED msg: " + msg->payload());
}

/* -------------------------------------------------------------------------- */

void HookManager::_execute(unique_ptr<hook_msg_t> msg)
{
    log_msg(msg.get());

    int hook_id = msg->oid();
    int hook_rc;

    istringstream is(msg->payload());

    is >> hook_rc >> ws;

    if (is.bad())
    {
        NebulaLog::error("HKM", "Error reading hook execution return code.");
        return;
    }

    ostringstream oss;
    if (msg->status() == "SUCCESS")
    {
        oss << "Success executing Hook " << hook_id;
        NebulaLog::log("HKM", Log::INFO, oss);
    }
    else
    {
        oss << "Error executing Hook " << hook_id;
        NebulaLog::log("HKM", Log::ERROR, oss);
    }

    std::string info_b64;
    getline(is, info_b64);

    string info;
    ssl_util::base64_decode(info_b64, info);

    HookLog* hl = Nebula::instance().get_hl();

    hl->add(hook_id, hook_rc, info);
}

/* -------------------------------------------------------------------------- */

void HookManager::_retry(unique_ptr<hook_msg_t> msg)
{
    log_msg(msg.get());
}

/* -------------------------------------------------------------------------- */

void HookManager::_log(unique_ptr<hook_msg_t> msg)
{
    NebulaLog::log("HKM", log_type(msg->status()[0]), msg->payload());
}
