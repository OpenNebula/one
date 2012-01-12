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

#ifndef SCHEDULER_POLICY_H_
#define SCHEDULER_POLICY_H_

#include "HostPoolXML.h"
#include "VirtualMachinePoolXML.h"
#include <cmath>
#include <algorithm>

using namespace std;

class SchedulerHostPolicy
{
public:

    SchedulerHostPolicy(
        VirtualMachinePoolXML *   _vmpool,
        HostPoolXML *             _hpool,
        float w=1.0):
            vmpool(_vmpool),hpool(_hpool),sw(w){};

    virtual ~SchedulerHostPolicy(){};

    const vector<float>& get(
        VirtualMachineXML * vm)
    {
        priority.clear();

        policy(vm);

        if(priority.empty()!=true)
        {
            sw.max = fabs(*max_element(
                priority.begin(),
                priority.end(),
                SchedulerHostPolicy::abs_cmp));

            transform(
                priority.begin(),
                priority.end(),
                priority.begin(),
                sw);
        }

        return priority;
    };

protected:

    vector<float>   priority;

    virtual void policy(VirtualMachineXML * vm) = 0;

    VirtualMachinePoolXML *   vmpool;
    HostPoolXML *             hpool;

private:

    static bool abs_cmp(float fl1, float fl2)
    {
        return fabs(fl1)<fabs(fl2);
    };

    //--------------------------------------------------------------------------
    class ScaleWeight
    {
    public:
    	ScaleWeight(float _weight):weight(_weight){};

        ~ScaleWeight(){};

        float operator() (float pr)
        {
            if ( max == 0 )
            {
                return 0;
            }
            else
            {
                return weight * pr / max;
            }
        };

    private:
        friend class SchedulerHostPolicy;

        float   weight;
        float   max;
    };
    //--------------------------------------------------------------------------

    ScaleWeight    sw;
};

/* -------------------------------------------------------------------------- */

#endif /*SCHEDULER_POLICY_H_*/
