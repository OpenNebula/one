/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

#ifndef SCHED_ACTION_ATTRIBUTE_H_
#define SCHED_ACTION_ATTRIBUTE_H_

#include <set>

#include "VirtualMachineAttribute.h"

/**
 * The VirtualMachine SCHED_ACTION attribute
 */
class SchedAction: public VirtualMachineAttribute
{
public:
    enum Repeat
    {
        NONE    = -1,
        WEEKLY  = 0,
        MONTHLY = 1,
        YEARLY  = 2,
        HOURLY  = 3
    };

    enum EndOn
    {
        END_NONE = -1,
        NEVER    = 0,
        TIMES    = 1,
        DATE     = 2
    };

    SchedAction(VectorAttribute *va, int id):VirtualMachineAttribute(va, id){};

    virtual ~SchedAction(){};

    /**
     *  Returns the REPEAT value of the SCHED_ACTION
     *    @param r repeat WEEKLY, MONTHLY, YEARLY or HOURLY
     *    @return -1 if REPEAT not found or in wrong format 0 on success
     */
    int repeat(Repeat& r);

    /**
     *  Returns the END_TYPE value of the SCHED_ACTION
     *    @param eo ends on TIMES   WEEKLY, MONTHLY, YEARLY or HOURLY
     *    @return -1 if REPEAT not found or in wrong format 0 on success
     */
    int endon(EndOn& eo);

    /**
     *  Parse the DAYS attribute of the sched action
     *    @param d set of days (unique)
     *    @return -1 if not found (d will be empty) 0 otherwise
     */
    int days(std::set<int>& _d);

    /**
     *  This function checks that the DAYS attributes are in range
     *  according to the Repeat value:
     *    @param r repeat type (hourly, weekly...)
     *    @param error in case of error
     *
     *    @return true if days are in range false (error) if not
     */
    bool days_in_range(Repeat r, std::string& error);

    /**
     *  This function checks that END_VALUE is properly defined for the
     *  associated END_TYPE
     *    @param eo end type (date, times)
     *    @param error in case of error
     *
     *    @return 0 if days are in range -1 (error) if not or -2 (not defined)
     */
    int ends_in_range(EndOn eo, std::string& error);

    /**
     *  This function parse and checks the sched action attributes: REPEAT, DAYS
     *  , END_TYPE, END_DATE. It also removed DONE and MESSAGE.
     *    @param error
     *    @param clean indicates if the user wants to remove DONE and MESSAGE
     *    @return 0 if success -1 otherwise
     */
    int parse(std::string& error, bool clean);

    /**
     *  @param stime time when the time was started for relative time specs
     *  @return true if the action needs to be executed.
     */
    bool is_due(time_t stime);

    /**
     *  Compute the next action, updating the TIME attribute for this action
     *    @return time for next action, if ended or error -1
     */
    time_t next_action();
};

/**
 *  Set of VirtualMachine SCHED_ACTION attributes
 */
class SchedActions : public VirtualMachineAttributeSet
{
public:
    /* ---------------------------------------------------------------------- */
    /* Constructor and Initialization functions                               */
    /* ---------------------------------------------------------------------- */
    /**
     *  Creates the SchedAction set from a Template with SCHED_ACTION=[...]
     *  attributes, id's are auto-assigned for internal use
     *    @param tmpl template with DISK
     */
    SchedActions(Template * tmpl): VirtualMachineAttributeSet(false)
    {
        std::vector<VectorAttribute *> vas;

        tmpl->get("SCHED_ACTION", vas);

        init_attribute_map("TIME", vas);
    };

    virtual ~SchedActions(){};

    /* ---------------------------------------------------------------------- */

    /**
     *  Parse the ScheduleActions of a template
     *    @param error
     *    @param clean indicates if the user wants to remove DONE and MESSAGE
     *    @return -1 in case of error 0 otherwise
     */
    int parse(std::string& error, bool clean)
    {
        for ( schedaction_iterator action = begin(); action != end(); ++action)
        {
            if ( (*action)->parse(error, clean) == -1 )
            {
                return -1;
            }
        }

        return 0;
    }

    bool empty()
    {
        return a_set.empty();
    }

    /* ---------------------------------------------------------------------- */
    /* Iterators                                                              */
    /* ---------------------------------------------------------------------- */
    /**
     *  Generic iterator for the SchedActions set.
     */
    class SchedActionIterator : public AttributeIterator
    {
    public:
        SchedActionIterator():AttributeIterator(){};
        SchedActionIterator(const AttributeIterator& i):AttributeIterator(i){};
        virtual ~SchedActionIterator(){};

        SchedAction * operator*() const
        {
            return static_cast<SchedAction *>(map_it->second);
        }
    };

    SchedActionIterator begin()
    {
        SchedActionIterator it(ExtendedAttributeSet::begin());
        return it;
    }

    SchedActionIterator end()
    {
        SchedActionIterator it(ExtendedAttributeSet::end());
        return it;
    }

    typedef class SchedActionIterator schedaction_iterator;

protected:
    VirtualMachineAttribute * attribute_factory(VectorAttribute * va,
        int id) const
    {
        return new SchedAction(va, id);
    };
};

#endif  /*SCHED_ACTION_ATTRIBUTE_H_*/

