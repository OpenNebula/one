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

#ifndef SCHEDULER_POLICY_H_
#define SCHEDULER_POLICY_H_

#include "ObjectXML.h"

#include <cmath>
#include <algorithm>


/**
 *  Abstract class that represents a Scheduling policy
 */
class SchedulerPolicy
{
public:
    SchedulerPolicy(float w=1.0):sw(w) {};

    virtual ~SchedulerPolicy() {};

    /**
     *  Main interface for the class schedule the objects applying the policy.
     *  It returns a reference to a vector of priorities for each "schedulable"
     *  object.
     *    @param obj, pointer to the object to schedule
     *
     */
    void schedule(ObjectXML * obj)
    {
        std::vector<float> priority;
        const std::vector<Resource *>& resources = get_match_resources(obj);

        if (resources.empty())
        {
            return;
        }

        //1. Compute priorities
        policy(obj, priority);

        //2. Scale priorities
        sw.max = fabs(*max_element(priority.begin(), priority.end(), abs_cmp));

        transform(priority.begin(), priority.end(), priority.begin(), sw);

        //3. Aggregate to other policies
        for (unsigned int i=0; i< resources.size(); i++)
        {
            resources[i]->priority += priority[i];
        }
    };

protected:

    /**
     *  Get the vector of matched resources for the Object being schedule
     *    @param obj pointer to the object
     *    @return a reference to the vector
     */
    virtual const std::vector<Resource *>& get_match_resources(ObjectXML *obj) const = 0;

    /**
     *  Implements the actual schedule by computing the priority of each
     *  matching resource.
     */
    virtual void policy(ObjectXML * obj, std::vector<float>& priority) = 0;

private:
    /**
     *  ABS compare to sort priorities
     */
    static bool abs_cmp(float fl1, float fl2)
    {
        return fabs(fl1)<fabs(fl2);
    };

    /**
     *  Private class to scale priorities on resources. Each resource has a
     *  priority assgined by a policy, in order to sort and combine policies
     *  priorities are scaled to 1.0 and weighted.
     */
    class ScaleWeight
    {
    public:
        ScaleWeight(float _weight):weight(_weight) {};

        ~ScaleWeight() {};

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

        float weight;

        float max = 0;
    } sw;
};

#endif /*SCHEDULER_POLICY_H_*/
