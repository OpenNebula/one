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

#include "SchedulerTemplate.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const char * SchedulerTemplate::conf_name="sched.conf";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void SchedulerTemplate::set_conf_default()
{
    VectorAttribute *   vattribute;
    map<string, string>  vvalue;

    /*
    #*******************************************************************************
    # Daemon configuration attributes
    #-------------------------------------------------------------------------------
    #  MESSAGE_SIZE
    #  TIMEOUT
    #  SCHED_INTERVAL
    #  MAX_VM
    #  MAX_DISPATCH
    #  MAX_HOST
    #  DEFAULT_SCHED
    #  DEFAULT_DS_SCHED
    #  LIVE_RESCHEDS
    #  COLD_MIGRATE_MODE
    #  LOG
    #-------------------------------------------------------------------------------
    */
    set_conf_single("MESSAGE_SIZE", "1073741824");
    set_conf_single("TIMEOUT", "60");
    set_conf_single("ONE_XMLRPC", "http://localhost:2633/RPC2");
    set_conf_single("SCHED_INTERVAL", "30");
    set_conf_single("MAX_VM", "300");
    set_conf_single("MAX_DISPATCH", "30");
    set_conf_single("MAX_HOST", "1");
    set_conf_single("LIVE_RESCHEDS", "0");
    set_conf_single("COLD_MIGRATE_MODE", "0");

    //DEFAULT_SCHED
    vvalue.clear();
    vvalue.insert(make_pair("POLICY", "1"));

    vattribute = new VectorAttribute("DEFAULT_SCHED", vvalue);
    conf_default.insert(make_pair(vattribute->name(), vattribute));

    //DEFAULT_DS_SCHED
    vvalue.clear();
    vvalue.insert(make_pair("POLICY", "1"));

    vattribute = new VectorAttribute("DEFAULT_DS_SCHED", vvalue);
    conf_default.insert(make_pair(vattribute->name(), vattribute));

    //DEFAULT_NIC_SCHED
    vvalue.clear();
    vvalue.insert(make_pair("POLICY", "1"));

    vattribute = new VectorAttribute("DEFAULT_NIC_SCHED", vvalue);
    conf_default.insert(make_pair(vattribute->name(), vattribute));

    set_conf_single("MEMORY_SYSTEM_DS_SCALE", "0");
    set_conf_single("DIFFERENT_VNETS", "YES");

    //LOG CONFIGURATION
    vvalue.clear();
    vvalue.insert(make_pair("SYSTEM", "file"));
    vvalue.insert(make_pair("DEBUG_LEVEL", "3"));

    vattribute = new VectorAttribute("LOG", vvalue);
    conf_default.insert(make_pair(vattribute->name(), vattribute));
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string SchedulerTemplate::get_policy() const
{
    int    policy;
    string rank;

    istringstream iss;

    const  VectorAttribute * sched = get("DEFAULT_SCHED");

    if (sched == 0)
    {
        return "";
    }

    iss.str(sched->vector_value("POLICY"));
    iss >> policy;

    switch (policy)
    {
        case 0: //Packing
            rank = "RUNNING_VMS";
            break;

        case 1: //Striping
            rank = "- RUNNING_VMS";
            break;

        case 2: //Load-aware
            rank = "FREE_CPU";
            break;

        case 3: //Custom
            rank = sched->vector_value("RANK");
            break;

        case 4: //Fixed
            rank = "PRIORITY";
            break;

        default:
            rank = "";
    }

    return rank;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string SchedulerTemplate::get_ds_policy() const
{
    int    policy;
    string rank;

    istringstream iss;

    const  VectorAttribute * sched = get("DEFAULT_DS_SCHED");

    if (sched == 0)
    {
        return "";
    }

    iss.str(sched->vector_value("POLICY"));
    iss >> policy;

    switch (policy)
    {
        case 0: //Packing
            rank = "- FREE_MB";
            break;

        case 1: //Striping
            rank = "FREE_MB";
            break;

        case 2: //Custom
            rank = sched->vector_value("RANK");
            break;

        case 3: //Fixed
            rank = "PRIORITY";
            break;

        default:
            rank = "";
    }

    return rank;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string SchedulerTemplate::get_nics_policy() const
{
    int    policy;
    string rank;

    istringstream iss;

    const  VectorAttribute * sched = get("DEFAULT_NIC_SCHED");

    if (sched == 0)
    {
        return "";
    }

    iss.str(sched->vector_value("POLICY"));
    iss >> policy;

    switch (policy)
    {
        case 0: //Packing
            rank = "USED_LEASES";
            break;

        case 1: //Striping
            rank = "- USED_LEASES";
            break;

        case 2: //Custom
            rank = sched->vector_value("RANK");
            break;

        case 3: //Fixed
            rank = "PRIORITY";
            break;

        default:
            rank = "";
    }

    return rank;
}
