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

#ifndef ACTION_SET_H
#define ACTION_SET_H

/**
 *  This class defines actions sets (for example the set of actions supported
 *  by the driver). Just the basic methods to initialize the set and check if a
 *  an action is included is provided (similar to FD_SET(3) or SIGSETOPS(3))
 *
 *  Types should be enums with uint values.
 */
template <typename T>
class ActionSet
{
public:
    ActionSet():action_set(0UL) {};
    ActionSet(const T * actions, int actions_len):action_set(0)
    {
        for (int i=0; i<actions_len; i++)
        {
            set(actions[i]);
        }
    };

    ~ActionSet() {};

    /* Set the action in the set */
    void set(T action)
    {
        action_set |= 1UL << static_cast<int>(action);
    };

    void clear(T action)
    {
        action_set &= (~ (1UL << static_cast<int>(action)));
    };

    /**
     *  Check if action is included in the set
     *    @param action
     *    @return true if included
     */
    bool is_set(T action) const
    {
        return (action_set & (1UL << static_cast<int>(action))) != 0;
    };

private:
    long long action_set;
};

#endif /*ACTION_SET_H*/
