/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

    RankPolicy(PoolXML * _pool, const string&  dr, float  w = 1.0):
            SchedulerPolicy(w), default_rank(dr), pool(_pool) {};

    virtual ~RankPolicy(){};

protected:

    /**
     *  Gets the rank to apply.
     */
    virtual const string& get_rank(ObjectXML *obj) = 0;

    /**
     *  Default rank for resources
     */
    string default_rank;

    /**
     *  Pool of matched resources
     */
    PoolXML * pool;

private:
    /**
     *  Implements the Match-Making policy by computing the rank of each resource
     *    @param obj The Schedulable object
     *    @param priority for each resource.
     */
    void policy(ObjectXML * obj, vector<float>& priority)
    {
        ObjectXML * resource;
        char *      errmsg = 0;

        int rc, rank = 0;

        const vector<Resource *> resources = get_match_resources(obj);

        string srank = get_rank(obj);

        priority.clear();

        if (srank.empty())
        {
            priority.resize(resources.size(),0);
            return;
        }

        for (unsigned int i=0; i<resources.size(); rank=0, i++)
        {
            resource = pool->get(resources[i]->oid);

            if ( resource != 0 )
            {
                rc = resource->eval_arith(srank, rank, &errmsg);

                if (rc != 0)
                {
                    ostringstream oss;

                    oss << "Computing rank, expression: " << srank;

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


class RankHostPolicy : public RankPolicy
{
public:

    RankHostPolicy(HostPoolXML * pool, const string&  dr, float  w = 1.0):
            RankPolicy(pool, dr, w){};

    ~RankHostPolicy(){};

private:

    const vector<Resource *> get_match_resources(ObjectXML *obj)
    {
        VirtualMachineXML * vm = dynamic_cast<VirtualMachineXML *>(obj);

        return vm->get_match_hosts();
    };

    const string& get_rank(ObjectXML *obj)
    {
        VirtualMachineXML * vm = dynamic_cast<VirtualMachineXML *>(obj);

        if (vm->get_rank().empty())
        {
            return default_rank;
        }

        return vm->get_rank();
    };
};


class RankDatastorePolicy : public RankPolicy
{
public:

    RankDatastorePolicy(DatastorePoolXML * pool, const string&  dr,float w=1.0):
            RankPolicy(pool, dr, w){};

    ~RankDatastorePolicy(){};

private:

    const vector<Resource *> get_match_resources(ObjectXML *obj)
    {
        VirtualMachineXML * vm = dynamic_cast<VirtualMachineXML *>(obj);

        return vm->get_match_datastores();
    };

    const string& get_rank(ObjectXML *obj)
    {
        VirtualMachineXML * vm = dynamic_cast<VirtualMachineXML *>(obj);

        if (vm->get_ds_rank().empty())
        {
            return default_rank;
        }

        return vm->get_ds_rank();
    };
};

#endif /*RANK_POLICY_H_*/
