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

#ifndef RANK_POLICY_H_
#define RANK_POLICY_H_

#include "SchedulerPolicy.h"
#include "Scheduler.h"

using namespace std;

class RankPolicy : public SchedulerHostPolicy
{
public:

    RankPolicy(
        VirtualMachinePoolXML *   vmpool,
        HostPoolXML *             hpool,
        const string&             dr,
        float                     w = 1.0)
            :SchedulerHostPolicy(vmpool,hpool,w), default_rank(dr){};

    ~RankPolicy(){};

private:

    string default_rank;

    void policy(
        VirtualMachineXML * vm)
    {
        string  srank;
        int     rank;

        char *  errmsg;
        int     rc;

        vector<int>     hids;
        unsigned int    i;

        HostXML * host;

        vm->get_matching_hosts(hids);

        srank = vm->get_rank();

        if (srank.empty())
        {
            srank = default_rank;
        } 

        for (i=0;i<hids.size();i++)
        {
            rank = 0;

            if (srank != "")
            {
                host = hpool->get(hids[i]);

                if ( host != 0 )
                {
                    rc = host->eval_arith(srank, rank, &errmsg);

                    if (rc != 0)
                    {
                        ostringstream oss;

                        oss << "Computing host rank, expression: " << srank
                            << ", error: " << errmsg;
                        NebulaLog::log("RANK",Log::ERROR,oss);

                        free(errmsg);
                    }
                }
            }

            priority.push_back(rank);
        }
    }
};

#endif /*RANK_POLICY_H_*/
