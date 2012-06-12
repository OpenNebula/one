/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const char * QuotaNetwork::NET_METRICS[] = {"LEASES"};

const int QuotaNetwork::NUM_NET_METRICS  = 1;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool QuotaNetwork::check(Template * tmpl,  string& error)
{
    vector<Attribute*> nics;
    VectorAttribute *  nic;

    string net_id;
    int num;

    map<string, int> net_request;

    net_request.insert(make_pair("LEASES",1));

    num = tmpl->get("NIC", nics);

    for (int i = 0 ; i < num ; i++)
    {
        nic = dynamic_cast<VectorAttribute *>(nics[i]);

        if ( nic == 0 )
        {
            continue;
        }

        net_id = nic->vector_value("NETWORK_ID");
        
        if ( !check_quota(net_id, net_request, error) )
        {
            return false;
        }
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void QuotaNetwork::del(Template * tmpl)
{

    vector<Attribute*> nics;
    VectorAttribute *  nic;

    string net_id;
    int num;

    map<string, int> net_request;

    net_request.insert(make_pair("LEASES",1));

    num = tmpl->get("NIC", nics);

    for (int i = 0 ; i < num ; i++)
    {
        nic = dynamic_cast<VectorAttribute *>(nics[i]);

        if ( nic == 0 )
        {
            continue;
        }

        net_id = nic->vector_value("NETWORK_ID");
        
        del_quota(net_id, net_request);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
