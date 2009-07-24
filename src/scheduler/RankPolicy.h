/* -------------------------------------------------------------------------- */
/* Copyright 2002-2009, Distributed Systems Architecture Group, Universidad   */
/* Complutense de Madrid (dsa-research.org)                                   */
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
        SchedulerVirtualMachinePool *   vmpool,
        SchedulerHostPool *             hpool,
        float w=1.0):SchedulerHostPolicy(vmpool,hpool,w){};
    
    ~RankPolicy(){};

private:

    void policy(
        SchedulerVirtualMachine * vm)
    {        
        string  srank;
        int     rank;
        
        char *  errmsg;
        int     rc;
        
        vector<int>     hids;
        unsigned int    i;
        
        SchedulerHost * host;
        
        vm->get_matching_hosts(hids);
 
        vm->get_template_attribute("RANK",srank);
        
        if (srank == "")
        {
            Scheduler::log("RANK",Log::WARNING,"No rank defined for VM");
        }

        for (i=0;i<hids.size();i++)
        {       
        	rank = 0;
        	
            if (srank != "")
            {
                host = hpool->get(hids[i],false);
                
                if ( host != 0 )
                {                
                	rc = host->rank(srank, rank, &errmsg);
                
                	if (rc != 0)
                	{
                		ostringstream oss;
                    
                		oss << "Computing host rank, expression: " << srank
                        	<< ", error: " << errmsg;                        
                		Scheduler::log("RANK",Log::ERROR,oss);
                    
                		free(errmsg);
                	}
                }
            }
            
            priority.push_back(rank);            
        }
    }
};

#endif /*RANK_POLICY_H_*/
