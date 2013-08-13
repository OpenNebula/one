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

#include <algorithm>

#include "VirtualMachineXML.h"
#include "NebulaUtil.h"

void VirtualMachineXML::init_attributes()
{
    vector<string>     result;
    vector<xmlNodePtr> nodes;

    oid = atoi(((*this)["/VM/ID"] )[0].c_str());
    uid = atoi(((*this)["/VM/UID"])[0].c_str());
    gid = atoi(((*this)["/VM/GID"])[0].c_str());

    result = ((*this)["/VM/TEMPLATE/MEMORY"]);

    if (result.size() > 0)
    {
        memory = atoi(result[0].c_str());
    }
    else
    {
        memory = 0;
    }

    result = ((*this)["/VM/TEMPLATE/CPU"]);

    if (result.size() > 0)
    {
        istringstream   iss;
        iss.str( result[0] );
        iss >> cpu;
    }
    else
    {
        cpu = 0;
    }

    result = ((*this)["/VM/USER_TEMPLATE/SCHED_RANK"]);

    if (result.size() > 0)
    {
        rank = result[0];
    }
    else
    {
        // Compatibility with previous versions
        result = ((*this)["/VM/USER_TEMPLATE/RANK"]);

        if (result.size() > 0)
        {
            rank = result[0];
        }
        else
        {
            rank = "";
        }
    }

    result = ((*this)["/VM/TEMPLATE/AUTOMATIC_REQUIREMENTS"]);

    if (result.size() > 0)
    {
        requirements = result[0];
    }

    result = ((*this)["/VM/USER_TEMPLATE/SCHED_REQUIREMENTS"]);

    if (result.size() > 0)
    {
        if ( !requirements.empty() )
        {
            ostringstream oss;

            oss << requirements << " & ( " << result[0] << " )";

            requirements = oss.str();
        }
        else
        {
            requirements = result[0];
        }
    }

    result = ((*this)["/VM/HISTORY_RECORDS/HISTORY/HID"]);

    if (result.size() > 0)
    {
        hid = atoi(result[0].c_str());
    }
    else
    {
        hid = -1;
    }

    result = ((*this)["/VM/RESCHED"]);

    if (result.size() > 0)
    {
        resched = atoi(result[0].c_str());
    }
    else
    {
        resched = 0;
    }

    if (get_nodes("/VM/USER_TEMPLATE", nodes) > 0)
    {
        vm_template = new VirtualMachineTemplate;

        vm_template->from_xml_node(nodes[0]);

        free_nodes(nodes);
    }
    else
    {
        vm_template = 0;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

ostream& operator<<(ostream& os, VirtualMachineXML& vm)
{
    const vector<Resource *> resources = vm.match_hosts.get_resources();

    vector<Resource *>::const_reverse_iterator  i;

    if (resources.empty())
    {
        return os;
    }

    os  << "\t PRI\tHID  VM: " << vm.oid << endl
        << "\t-----------------------"  << endl;

    for (i = resources.rbegin(); i != resources.rend() ; i++)
    {
        os << "\t" << (*i)->priority << "\t" << (*i)->oid << endl;
    }

    os << endl;

    return os;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineXML::get_requirements (int& cpu, int& memory, int& disk)
{
    if (this->memory == 0 || this->cpu == 0)
    {
        cpu    = 0;
        memory = 0;
        disk   = 0;

        return;
    }

    cpu    = (int) (this->cpu * 100);//now in 100%
    memory = this->memory * 1024;    //now in Kilobytes
    disk   = 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineXML::log(const string &st)
{
    if (vm_template == 0 || st.empty())
    {
        return;
    }
    ostringstream oss;

    oss << one_util::log_time() << " : " << st;

    vm_template->replace("SCHED_MESSAGE", oss.str());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachineXML::parse_action_name(string& action_st)
{
    one_util::tolower(action_st);

    if (   action_st != "shutdown"
        && action_st != "shutdown-hard"
        && action_st != "undeploy"
        && action_st != "undeploy-hard"
        && action_st != "hold"
        && action_st != "release"
        && action_st != "stop"
        && action_st != "suspend"
        && action_st != "resume"
        && action_st != "boot"
        && action_st != "delete"
        && action_st != "delete-recreate"
        && action_st != "reboot"
        && action_st != "reboot-hard"
        && action_st != "poweroff"
        && action_st != "poweroff-hard"
        && action_st != "snapshot-create")
    {
        return -1;
    }

    return 0;
};
