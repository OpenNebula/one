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

#include "InformationManagerDriver.h"
#include "NebulaLog.h"
#include "Nebula.h"
#include "NebulaUtil.h"
#include "VirtualMachineManagerDriver.h"
#include "MonitorThread.h"

#include <sstream>

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

InformationManagerDriver::InformationManagerDriver(
        int                       userid,
        const map<string,string>& attrs,
        bool                      sudo,
        MonitorThreadPool *       _mtpool):
            Mad(userid,attrs,sudo), mtpool(_mtpool){};

InformationManagerDriver::~InformationManagerDriver(){};

/* ************************************************************************** */
/* Driver ASCII Protocol Implementation                                       */
/* ************************************************************************** */

void InformationManagerDriver::monitor(int           oid,
                                       const string& host,
                                       const string& dsloc,
                                       bool          update) const
{
    ostringstream os;

    os << "MONITOR " << oid << " " << host << " " << dsloc << " " << update << endl;

    write(os);
}

void InformationManagerDriver::stop_monitor(int oid, const string& host) const
{
    ostringstream os;

    os << "STOPMONITOR " << oid << " " << host << " " << endl;

    write(os);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void InformationManagerDriver::protocol(const string& message) const
{
    istringstream   is(message);
    //stores the action name
    string          action;
    //stores the action result
    string          result;
    //stores the action id of the associated HOST
    int             id;

    ostringstream   ess;

    set<int>        vm_ids;

    // Parse the driver message

    if ( is.good() )
    {
        is >> action >> ws;
    }
    else
    {
        goto error_parse;
    }

    if ( is.good() )
    {
        is >> result >> ws;
    }
    else
    {
        goto error_parse;
    }

    if ( is.good() )
    {
        is >> id >> ws;
    }
    else
    {
        goto error_parse;
    }

    // -------------------------------------------------------------------------
    // Protocol implementation
    // -------------------------------------------------------------------------

    if ( action == "MONITOR" )
    {
        string  hinfo64;

        getline (is, hinfo64);

        if (hinfo64.empty())
        {
            return;
        }

        mtpool->do_message(id, result, hinfo64);
    }
    else if (action == "LOG")
    {
        string info;

        getline(is,info);
        NebulaLog::log("InM",log_type(result[0]),info.c_str());
    }
    else if (action == "STOPMONITOR")
    {
        string error;

        if (result != "SUCCESS")
        {
            ostringstream oss;
            string info;

            getline (is, info);

            oss << "Could not stop monitor on host " << id << " " << info;
            NebulaLog::log("InM", Log::ERROR, oss.str());
        }
    }

    return;

error_parse:
    ess << "Error while parsing driver message: " << message;
    NebulaLog::log("InM",Log::ERROR,ess);

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void InformationManagerDriver::recover()
{
    NebulaLog::log("InM", Log::ERROR,
                   "Information driver crashed, recovering...");
}
