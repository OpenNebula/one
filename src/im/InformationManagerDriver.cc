/* -------------------------------------------------------------------------- */
/* Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        */
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
#include <sstream>


/* ************************************************************************** */
/* Driver ASCII Protocol Implementation                                       */
/* ************************************************************************** */

void InformationManagerDriver::monitor(int           oid,
                                       const string& host,
                                       bool          update) const
{
    ostringstream os;

    os << "MONITOR " << oid << " " << host << " " << update << endl;

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

    Host *          host;

    set<int>        vm_ids;

    string  hinfo64;
    string* hinfo;

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

    // -----------------------
    // Protocol implementation
    // -----------------------

    if ( action == "MONITOR" )
    {
        bool vm_poll;

        set<int>        lost;
        map<int,string> found;

        int rc;

        host = hpool->get(id,true);

        if ( host == 0 )
        {
            goto error_host;
        }

        getline (is, hinfo64);

        hinfo = one_util::base64_decode(hinfo64);

        if (result != "SUCCESS")
        {
            set<int> vm_ids;

            host->error_info(*hinfo, vm_ids);

            Nebula           &ne  = Nebula::instance();
            LifeCycleManager *lcm = ne.get_lcm();

            for (set<int>::iterator it = vm_ids.begin(); it != vm_ids.end(); it++)
            {
                lcm->trigger(LifeCycleManager::MONITOR_DONE, *it);
            }

            delete hinfo;

            hpool->update(host);
            host->unlock();

            return;
        }

        rc = host->update_info(*hinfo, vm_poll, lost, found);

        delete hinfo;

        hpool->update(host);

        if (rc != 0)
        {
            host->unlock();

            return;
        }

        hpool->update_monitoring(host);

        ess << "Host " << host->get_name() << " (" << host->get_oid() << ")"
            << " successfully monitored.";

        NebulaLog::log("InM", Log::DEBUG, ess);

        host->unlock();

        if (vm_poll)
        {
            set<int>::iterator         its;
            map<int,string>::iterator  itm;

            Nebula           &ne  = Nebula::instance();
            LifeCycleManager *lcm = ne.get_lcm();

            for (its = lost.begin(); its != lost.end(); its++)
            {
                lcm->trigger(LifeCycleManager::MONITOR_DONE, *its);
            }

            for (itm = found.begin(); itm != found.end(); itm++)
            {
                VirtualMachineManagerDriver::process_poll(itm->first, itm->second);
            }
        }
    }
    else if (action == "LOG")
    {
        string info;

        getline(is,info);
        NebulaLog::log("InM",log_type(result[0]),info.c_str());
    }

    return;

error_host:
    ess << "Could not get host " << id;
    NebulaLog::log("InM",Log::ERROR,ess);

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
