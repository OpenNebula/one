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

#include "SchedulerTemplate.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const char * SchedulerTemplate::conf_name="sched.conf";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void SchedulerTemplate::set_conf_default()
{
    SingleAttribute *   attribute;
    VectorAttribute *   vattribute;
    string              value;
    map<string,string>  vvalue;

/*
#*******************************************************************************
# Daemon configuration attributes
#-------------------------------------------------------------------------------
#  XML_RPC_MESSAGE_SIZE
#  ONED_PORT
#  SCHED_INTERVAL
#  MAX_VM
#  MAX_DISPATCH
#  MAX_HOST
#  DEFAULT_SCHED
#  DEFAULT_DS_SCHED
#  LIVE_RESCHEDS
#  LOG
#-------------------------------------------------------------------------------
*/
    // XML_RPC_MESSAGE_SIZE
    value = "1073741824";

    attribute = new SingleAttribute("MESSAGE_SIZE",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    // ONED_PORT
    value = "2633";

    attribute = new SingleAttribute("ONED_PORT",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    // SCHED_INTERVAL
    value = "30";

    attribute = new SingleAttribute("SCHED_INTERVAL",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    // MAX_VM
    value = "300";

    attribute = new SingleAttribute("MAX_VM",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    // MAX_DISPATCH
    value = "30";

    attribute = new SingleAttribute("MAX_DISPATCH",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    //MAX_HOST
    value = "1";

    attribute = new SingleAttribute("MAX_HOST",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    //LIVE_RESCHEDS
    value = "0";

    attribute = new SingleAttribute("LIVE_RESCHEDS",value);
    conf_default.insert(make_pair(attribute->name(),attribute));

    //DEFAULT_SCHED
    vvalue.clear();
    vvalue.insert(make_pair("POLICY","1"));

    vattribute = new VectorAttribute("DEFAULT_SCHED",vvalue);
    conf_default.insert(make_pair(vattribute->name(),vattribute));

    //DEFAULT_DS_SCHED
    vvalue.clear();
    vvalue.insert(make_pair("POLICY","1"));

    vattribute = new VectorAttribute("DEFAULT_DS_SCHED",vvalue);
    conf_default.insert(make_pair(vattribute->name(),vattribute));

    //LOG CONFIGURATION
    vvalue.clear();
    vvalue.insert(make_pair("SYSTEM","file"));
    vvalue.insert(make_pair("DEBUG_LEVEL","3"));

    vattribute = new VectorAttribute("LOG",vvalue);
    conf_default.insert(make_pair(vattribute->name(),vattribute));
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
