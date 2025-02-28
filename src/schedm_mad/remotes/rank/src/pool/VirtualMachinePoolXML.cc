/* -------------------------------------------------------------------------- */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                */
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

#include "VirtualMachinePoolXML.h"
#include <stdexcept>
#include <iomanip>
#include <queue>

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachinePoolXML::set_up()
{
    ostringstream   oss;

    PoolXML::set_up();

    vm_resources.clear();

    for ( auto it = objects.begin(); it != objects.end(); ++it )
    {
        vm_resources.add_resource(it->first);
    }

    if (NebulaLog::log_level() >= Log::DDDEBUG)
    {
        oss << "Pending/rescheduling VM and capacity requirements:" << endl;

        oss << right << setw(8)  << "ACTION"    << " "
            << right << setw(8)  << "VM"        << " "
            << right << setw(4)  << "CPU"       << " "
            << right << setw(11) << "Memory"    << " "
            << right << setw(3)  << "PCI"       << " "
            << right << setw(11) << "System DS" << " "
            << " Image DS" << endl
            << setw(60) << setfill('-') << "-" << setfill(' ') << endl;

        for (auto it = objects.begin() ; it != objects.end() ; ++it)
        {
            HostShareCapacity sr;

            string action = "DEPLOY";

            VirtualMachineXML * vm;

            vm = static_cast<VirtualMachineXML *>(it->second);

            vm->get_capacity(sr);

            if (vm->is_resched())
            {
                action = "RESCHED";
            }
            else if (vm->is_resume())
            {
                action = "RESUME";
            }

            oss << right << setw(8)  << action      << " "
                << right << setw(8)  << it->first   << " "
                << right << setw(4)  << sr.cpu        << " "
                << right << setw(11) << sr.mem        << " "
                << right << setw(3)  << sr.pci.size() << " "
                << right << setw(11) << sr.disk       << " ";

            map<int, long long> ds_usage = vm->get_storage_usage();

            for ( auto ds_it = ds_usage.begin(); ds_it != ds_usage.end(); ds_it++)
            {
                oss << " DS " << ds_it->first << ": " << ds_it->second <<" ";
            }

            oss << endl;
        }
    }
    else
    {
        oss << "Found " << objects.size() << " pending/rescheduling VMs.";
    }

    NebulaLog::log("VM", Log::DEBUG, oss);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachinePoolXML::add_object(xmlNodePtr node)
{
    if ( node == 0 || node->children == 0 || node->children->next==0 )
    {
        NebulaLog::log("VM", Log::ERROR,
                       "XML Node does not represent a valid Virtual Machine");
        return;
    }

    VirtualMachineXML* vm = new VirtualMachineXML(node, requirements);

    objects.insert(pair<int, ObjectXML*>(vm->get_oid(), vm));
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineRolePoolXML::set_up()
{
    PoolXML::set_up();

    ostringstream oss;

    oss << "VMs in VMGroups:" << endl;

    for (auto it=objects.begin(); it!=objects.end(); it++)
    {
        oss << " " << it->first;
    }

    NebulaLog::log("VM", Log::DEBUG, oss);
}

