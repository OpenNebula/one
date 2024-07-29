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

#ifndef USER_PRIORITY_POLICY_H_
#define USER_PRIORITY_POLICY_H_

#include "SchedulerPolicy.h"


/**
 * The UserPriority Scheduler prioritizes  PENDING and RESCHEDULER VMs according
 * to a fixed priority. This priority can be set manually or by external program
 *
 *
 */
class UserPriorityPolicy : public SchedulerPolicy
{
public:

    UserPriorityPolicy(VirtualMachinePoolXML * _pool, float  w = 1.0):
        SchedulerPolicy(w), vm_pool(_pool) {};

    virtual ~UserPriorityPolicy() {};

protected:
    /**
     *  Get the vector of matched resources for the Object being schedule
     *    @param obj pointer to the object
     *    @return a reference to the vector
     */
    const std::vector<Resource *>& get_match_resources(ObjectXML *null) const override
    {
        return vm_pool->get_vm_resources();
    }

    /**
     *  Implements the actual schedule by computing the priority of each
     *  matching resource.
     */
    void policy(ObjectXML * null, std::vector<float>& priority) override
    {
        float up;

        const std::vector<Resource *>& resources = get_match_resources(0);

        priority.clear();

        for (unsigned int i=0; i<resources.size(); up = 0.0, i++)
        {
            VirtualMachineXML * vm = vm_pool->get(resources[i]->oid);

            if ( vm != 0 )
            {
                vm->xpath(up, "/VM/USER_TEMPLATE/USER_PRIORITY", (float) 0.0);
            }

            priority.push_back(up);
        }
    }

private:
    /**
     *  Pool of matched resources
     */
    VirtualMachinePoolXML * vm_pool;
};

#endif /*USER_PRIORITY_POLICY_H_*/
