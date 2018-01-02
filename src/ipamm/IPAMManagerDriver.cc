/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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

#include "IPAMManagerDriver.h"
#include "IPAMManager.h"
#include "NebulaLog.h"

#include <sstream>

/* ************************************************************************** */
/* MAD Interface                                                              */
/* ************************************************************************** */

void IPAMManagerDriver::protocol(const string& message) const
{
    istringstream is(message);
    ostringstream os;

    string action;
    string result;
    string info="";

    int id;

    os << "Message received: " << message;
    NebulaLog::log("IPM", Log::DEBUG, os);

    // Parse the driver message
    if ( is.good() )
        is >> action >> ws;
    else
        return;

    if ( is.good() )
        is >> result >> ws;
    else
        return;

    if ( is.good() )
    {
        is >> id >> ws;

        if ( is.fail() )
        {
            if ( action == "LOG" )
            {
                is.clear();
                getline(is,info);

                NebulaLog::log("IPM", log_type(result[0]), info.c_str());
            }

            return;
        }
    }
    else
        return;

    getline(is, info);

    if (action == "LOG")
    {
        NebulaLog::log("IPM", Log::INFO, info.c_str());
    }
    else if (result == "SUCCESS")
    {
        ipamm->notify_request(id, true, info);
    }
    else
    {
        ipamm->notify_request(id, false, info);
    }

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void IPAMManagerDriver::recover()
{
    NebulaLog::log("IPM",Log::INFO,"Recovering IPAM drivers");
}

