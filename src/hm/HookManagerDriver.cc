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

#include "HookManagerDriver.h"
#include "Nebula.h"
#include "NebulaLog.h"
#include <sstream>

/* ************************************************************************** */
/* Driver ASCII Protocol Implementation                                       */
/* ************************************************************************** */

void HookManagerDriver::execute(
        int             oid,
        const string&   hook_name,
        const string&   command,
        const string&   arguments ) const
{
    ostringstream oss;

    oss << "EXECUTE " << oid << " " << hook_name << " LOCAL " << command << " ";

    if ( arguments.empty() )
    {
        oss << "-" << endl;
    }
    else
    {
        oss << arguments << endl;
    }

    write(oss);
}


// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------

void HookManagerDriver::execute(
        const string&   message ) const
{
    ostringstream oss;

    oss << "EXECUTE " << message << endl;

    write(oss);
}

// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------

void HookManagerDriver::execute(
        int             oid,
        const string&   hook_name,
        const string&   host_name,
        const string&   command,
        const string&   arguments ) const
{
    ostringstream oss;

    oss << "EXECUTE " << oid << " " << hook_name << " " << host_name << " "
        << command << " ";

    if ( arguments.empty() )
    {
        oss << "-" << endl;
    }
    else
    {
        oss << arguments << endl;
    }

    write(oss);
}

// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------

void HookManagerDriver::retry(
        const string&   message ) const
{
    ostringstream oss;

    oss << "RETRY " << message << endl;

    write(oss);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HookManagerDriver::protocol(const string& message) const
{
    std::string error_str;
    std::istringstream is(message);

    //stores the action name
    std::string action;
    std::string result;

    NebulaLog::log("HKM", Log::DEBUG, "Message received: " + message);

    Nebula& nd  = Nebula::instance();
    HookLog* hl = nd.get_hl();

    // Parse the driver message
    if ( is.good() )
    {
        is >> action >> ws;
    }
    else
    {
        error_str = "Error reading driver action.";
        goto error_common;
    }

    if ( is.good() )
    {
        is >> result >> ws;
    }
    else
    {
        error_str = "Error reading action result.";
        goto error_common;
    }

    // -------------------------------------------------------------------------
    // Protocol implementation
    // -------------------------------------------------------------------------

    if ( action == "EXECUTE" )
    {
        std::ostringstream oss;

        std::string info_b64;
        std::string *info;

        int hook_id;
        int hook_rc;

        // Parse the hook info
        if ( is.good() )
        {
            is >> hook_id >> ws;
        }
        else
        {
            error_str = "Error reading hook id.";
            goto error_common;
        }

        if ( is.good() )
        {
            is >> hook_rc >> ws;
        }
        else
        {
            error_str = "Error reading hook execution return code.";
            goto error_common;
        }

        getline(is, info_b64);

        if (result == "SUCCESS")
        {
            oss << "Success executing Hook " <<  hook_id;
            NebulaLog::log("HKM",Log::INFO,oss);
        }
        else
        {
            oss << "Error executing Hook " << hook_id;
            NebulaLog::log("HKM",Log::ERROR,oss);
        }

        info = one_util::base64_decode(info_b64);

        if ( info != 0 )
        {
            hl->add(hook_id, hook_rc, *info);
            delete info;
        }

    }

    return;

error_common:
    NebulaLog::log("HKM", Log::ERROR, error_str);
    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HookManagerDriver::recover()
{
    NebulaLog::log("HKM", Log::ERROR, "Hook driver crashed, recovering...");

}
