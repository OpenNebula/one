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

#ifndef RANK_POLICY_H_
#define RANK_POLICY_H_

#include "SchedulerPolicy.h"
#include "Scheduler.h"

using namespace std;

class RankPolicy : public SchedulerPolicy
{
public:

    RankPolicy(
        VirtualMachinePoolXML *   _vmpool,
        HostPoolXML *             _hpool,
        const string&             dr,
        float                     w = 1.0):
            SchedulerPolicy(w),
            default_rank(dr),
            vmpool(_vmpool),
            hpool(_hpool)
    {};

    ~RankPolicy(){};

private:
    /**
     *  Default rank for resources
     */
    string default_rank;

    VirtualMachinePoolXML * vmpool;
    HostPoolXML *           hpool;

    /**
     *  Implements the Match-Making policy by computing the rank of each resource
     *    @param obj The Schedulable object
     *    @param priority for each resource.
     */
    void policy(Schedulable * obj, vector<float>& priority)
    {
        HostXML * host;
        char *    errmsg = 0;

        int rc, rank = 0;

        const vector<Resource *> resources = obj->get_resources();

        VirtualMachineXML * vm = dynamic_cast<VirtualMachineXML *>(obj);
        string  srank          = vm->get_rank();

        if (srank.empty())
        {
            srank = default_rank;
        }

        priority.clear();

        if (srank.empty())
        {
            priority.resize(resources.size(),0);
            return;
        }

        for (unsigned int i=0; i<resources.size(); rank=0, i++)
        {
            host = hpool->get(resources[i]->oid);

            if ( host != 0 )
            {
                rc = host->eval_arith(srank, rank, &errmsg);

                if (rc != 0)
                {
                    ostringstream oss;

                    oss << "Computing host rank, expression: " << srank;

                    if (errmsg != 0)
                    {
                        oss << ", error: " << errmsg;
                        errmsg = 0;

                        free(errmsg);
                    }

                    NebulaLog::log("RANK",Log::ERROR,oss);
                }
            }

            priority.push_back(rank);
        }
    };
};

#endif /*RANK_POLICY_H_*/
