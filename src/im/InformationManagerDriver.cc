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
#include "Util.h"
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

void InformationManagerDriver::protocol(
    string&     message)
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

        host = hpool->get(id,true);

        if ( host == 0 )
        {
            goto error_host;
        }

        vm_ids = host->get_running_vms();

        if (result != "SUCCESS")
        {
            goto error_driver_info;
        }

        int     rc;
        string  hinfo64;
        string* hinfo;

        ostringstream oss;

        int     vmid;
        char *  error_msg;
        string  monitor_str;

        VectorAttribute*                vatt;
        vector<Attribute*>              vm_att;
        vector<Attribute*>::iterator    it;

        getline (is, hinfo64);

        hinfo = one_util::base64_decode(hinfo64);

        oss << "Host " << id << " successfully monitored.";
        NebulaLog::log("InM", Log::DEBUG, oss);

        rc = host->update_info(*hinfo);

        if (rc != 0)
        {
            ess << "Error parsing host information: " << *hinfo;
            delete hinfo;

            goto  error_common_info;
        }

        // TODO The hinfo string is parsed again because HostTemplate has
        // replace_mode set to true, but we expect several VM vector attributes
        Template* tmpl = new Template();
        tmpl->parse(*hinfo, &error_msg);

        tmpl->remove("VM", vm_att);

        delete hinfo;

        host->get_template_attribute("VM_POLL", vm_poll);

        host->remove_template_attribute("VM_POLL");
        host->remove_template_attribute("VM");

        host->touch(true);

        hpool->update(host);
        hpool->update_monitoring(host);

        host->unlock();

        for (it=vm_att.begin(); it != vm_att.end(); it++)
        {
            vatt = dynamic_cast<VectorAttribute*>(*it);

            if (vatt == 0)
            {
                delete *it;
                continue;
            }

            rc = vatt->vector_value("ID", vmid);

            if (rc == 0)
            {
                if (vm_ids.erase(vmid) == 1)
                {
                    monitor_str = vatt->vector_value("POLL");

                    VirtualMachineManagerDriver::process_poll(vmid, monitor_str);
                }
                else
                {
                    // TODO: This VM shoulnd't be running on this host
                }
            }
            else
            {
                // TODO: unknown VM found running on this host
            }

            delete *it;
        }

        if (vm_poll)
        {
            for (set<int>::iterator it = vm_ids.begin(); it != vm_ids.end(); it++)
            {
                // This VM should be running on this host, but it was not reported

                VirtualMachineManagerDriver::process_failed_poll(*it);
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

error_driver_info:
    ess << "Error monitoring host " << id << " : " << is.str();

    for (set<int>::iterator it = vm_ids.begin(); it != vm_ids.end(); it++)
    {
        VirtualMachineManagerDriver::process_failed_poll(*it);
    }

    goto  error_common_info;

error_common_info:
    NebulaLog::log("InM",Log::ERROR,ess);

    host->set_template_error_message(ess.str());

    host->touch(false);

    hpool->update(host);

    host->unlock();

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
