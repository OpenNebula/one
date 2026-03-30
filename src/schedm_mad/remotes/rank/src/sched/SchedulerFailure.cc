/* -------------------------------------------------------------------------- */
/* Copyright 2002-2026, OpenNebula Project, OpenNebula Systems                */
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

#include "SchedulerFailure.h"
#include "NebulaLog.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

namespace
{
    std::string ids_to_string(const std::vector<int>& ids)
    {
        if (ids.empty())
        {
            return "";
        }

        std::ostringstream oss;

        oss << ids[0];

        for (size_t i = 1; i < ids.size(); ++i)
        {
            oss << "," << ids[i];
        }

        return oss.str();
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string SchedulerFailure::failure_to_string(FailureType ft)
{
    switch(ft)
    {
        case NONE:              return "NONE";
        case HOST_NULL:         return "HOST_NULL";
        case HOST_REQUIREMENTS: return "HOST_REQUIREMENTS";
        case HOST_CPU:          return "HOST_CPU";
        case HOST_MEMORY:       return "HOST_MEMORY";
        case HOST_NUMA:         return "HOST_NUMA";
        case HOST_PCI:          return "HOST_PCI";
        case HOST_DISPATCH:     return "HOST_DISPATCH_LIMIT";
        case HOST_AFFINITY:     return "HOST_AFFINITY";
        case DS_NULL:           return "DATASTORE_NULL";
        case DS_CLUSTER:        return "DATASTORE_UNAVAILABLE_IN_CLUSTER";
        case DS_CAPACITY:       return "DATASTORE_CAPACITY";
        case DS_NONE:           return "DATASTORE_NONE";
        case DS_MONITOR:        return "DATASTORE_MONITOR";
        case NET_NULL:          return "NETWORK_NULL";
        case NET_CLUSTER:       return "NETWORK_UNAVAILABLE_IN_CLUSTER";
        case NET_LEASES:        return "NETWORK_LEASES";
        case NET_ROLLBACK:      return "NETWORK_ROLLBACK";
        default:                return "";
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */


SchedulerFailure::FailureType SchedulerFailure::str_to_failure_type(string& str_type)
{
    FailureType ft = NONE;

    if (str_type.empty())
    {
        return ft;
    }

    one_util::toupper(str_type);

    if (str_type == "NONE")
    {
        ft = NONE;
    }
    else if (str_type == "HOST_NULL")
    {
        ft = HOST_NULL;
    }
    else if (str_type == "HOST_REQUIREMENTS")
    {
        ft = HOST_REQUIREMENTS;
    }
    else if (str_type == "HOST_CPU")
    {
        ft = HOST_CPU;
    }
    else if (str_type == "HOST_MEMORY")
    {
        ft = HOST_MEMORY;
    }
    else if (str_type == "HOST_NUMA")
    {
        ft = HOST_NUMA;
    }
    else if (str_type == "HOST_PCI")
    {
        ft = HOST_PCI;
    }
    else if (str_type == "HOST_DISPATCH_LIMIT")
    {
        ft = HOST_DISPATCH;
    }
    else if (str_type == "HOST_AFFINITY")
    {
        ft = HOST_AFFINITY;
    }
    else if (str_type == "DATASTORE_NULL")
    {
        ft = DS_NULL;
    }
    else if (str_type == "DATASTORE_UNAVAILABLE_IN_CLUSTER")
    {
        ft = DS_CLUSTER;
    }
    else if (str_type == "DATASTORE_CAPACITY")
    {
        ft = DS_CAPACITY;
    }
    else if (str_type == "DATASTORE_NONE")
    {
        ft = DS_NONE;
    }
    else if (str_type == "DATASTORE_MONITOR")
    {
        ft = DS_MONITOR;
    }
    else if (str_type == "NETWORK_NULL")
    {
        ft = NET_NULL;
    }
    else if (str_type == "NETWORK_UNAVAILABLE_IN_CLUSTER")
    {
        ft = NET_CLUSTER;
    }
    else if (str_type == "NETWORK_LEASES")
    {
        ft = NET_LEASES;
    }
    else if (str_type == "NETWORK_ROLLBACK")
    {
        ft = NET_ROLLBACK;
    }

    return ft;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

ostringstream SchedulerFailure::log_failures(map<FailureType, set<int>> &host_failures)
{
    ostringstream oss;

    for (auto& [ft, ids] : host_failures)
    {
        if (ids.empty())
        {
            continue;
        }

        switch(ft)
        {
            // ------------------ HOST ------------------
            case HOST_NULL:         oss << "[HOST] No existing hosts: "; break;
            case HOST_CPU:          oss << "[HOST] Not enough CPU on hosts: "; break;
            case HOST_MEMORY:       oss << "[HOST] Not enough MEMORY on hosts: "; break;
            case HOST_NUMA:         oss << "[HOST] Cannot allocate NUMA on hosts: "; break;
            case HOST_PCI:          oss << "[HOST] Unavailable PCI devices on hosts: "; break;
            case HOST_REQUIREMENTS: oss << "[HOST] Requirements not met on hosts: "; break;
            case HOST_DISPATCH:     oss << "[HOST] Dispatch limit reached on hosts: "; break;
            case HOST_AFFINITY:     oss << "[HOST] Cannot fulfill affinity constraints on hosts: "; break;

            // ------------------ DATASTORE ------------------
            case DS_NULL:     oss << "[DS] No existing datastores: "; break;
            case DS_CLUSTER:  oss << "[DS] Unavailable datastores: "; break;
            case DS_CAPACITY: oss << "[DS] Not enough capacity on datastores: "; break;
            case DS_MONITOR:  oss << "[DS] Unmonitored datastores: "; break;
            case DS_NONE:     oss << "[DS] No datastores matched the VM requirements";
                                     ids.clear();
                                     break;

            // ------------------ NETWORK ------------------
            case NET_NULL:     oss << "[VNET] No existing vnets: "; break;
            case NET_CLUSTER:  oss << "[VNET] Unavailable vnets: "; break;
            case NET_LEASES:   oss << "[VNET] Unavailable leases on vnets: "; break;
            case NET_ROLLBACK: oss << "[VNET] Cannot satisfy all NETWORK requirements. "
                                      "Only available vnets: ";
                                      break;
            default: continue;
        }

        oss << ids_to_string(vector<int>(ids.begin(), ids.end()));

    }

    return oss;
}
