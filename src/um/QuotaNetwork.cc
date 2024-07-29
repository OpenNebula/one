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

#include "QuotaNetwork.h"
#include "Quotas.h"
#include "VirtualMachineNic.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const std::vector<std::string> QuotaNetwork::NET_METRICS = {"LEASES"};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool QuotaNetwork::check(PoolObjectSQL::ObjectType otype, Template * tmpl,
                         Quotas& default_quotas, string& error)
{
    bool uses_lease;

    map<string, float> net_request;

    net_request.insert(make_pair("LEASES", 1));

    VirtualMachineNics *nics = new VirtualMachineNics(tmpl);
    VirtualMachineNics::NicIterator nic;

    for (nic = nics->begin() ; nic != nics->end() ; ++nic)
    {
        std::string net_mode = (*nic)->vector_value("NETWORK_MODE");

        std::string net_id   = (*nic)->vector_value("NETWORK_ID");

        if ( one_util::icasecmp(net_mode, "AUTO") && net_id.empty() )
        {
            continue;
        }

        uses_lease = true;

        if ( otype == PoolObjectSQL::VROUTER )
        {
            (*nic)->vector_value("FLOATING_IP", uses_lease);
        }

        if ( !net_id.empty() && uses_lease )
        {
            if ( !check_quota(net_id, net_request, default_quotas, error) )
            {
                delete nics;

                return false;
            }
        }
    }

    delete nics;

    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void QuotaNetwork::del(PoolObjectSQL::ObjectType otype, Template * tmpl)
{
    string net_id;
    bool uses_lease;

    map<string, float> net_request;

    net_request.insert(make_pair("LEASES", 1));

    VirtualMachineNics *nics = new VirtualMachineNics(tmpl);
    VirtualMachineNics::NicIterator nic;

    for (nic = nics->begin() ; nic != nics->end() ; ++nic)
    {
        net_id = (*nic)->vector_value("NETWORK_ID");

        uses_lease = true;

        if ( otype == PoolObjectSQL::VROUTER )
        {
            (*nic)->vector_value("FLOATING_IP", uses_lease);
        }

        if (uses_lease)
        {
            del_quota(net_id, net_request);
        }
    }

    delete nics;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int QuotaNetwork::get_default_quota(
        const string& id,
        Quotas& default_quotas,
        VectorAttribute **va)
{
    return default_quotas.network_get(id, va);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
