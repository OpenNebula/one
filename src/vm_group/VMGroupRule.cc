/* ------------------------------------------------------------------------ */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems              */
/*                                                                          */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may  */
/* not use this file except in compliance with the License. You may obtain  */
/* a copy of the License at                                                 */
/*                                                                          */
/* http://www.apache.org/licenses/LICENSE-2.0                               */
/*                                                                          */
/* Unless required by applicable law or agreed to in writing, software      */
/* distributed under the License is distributed on an "AS IS" BASIS,        */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. */
/* See the License for the specific language governing permissions and      */
/* limitations under the License.                                           */
/* -------------------------------------------------------------------------*/

#include "VMGroup.h"
#include "VMGroupRole.h"
#include "VMGroupRule.h"

#include <iomanip>

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*  VMGroupRule                                                               */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool VMGroupRule::compatible(VMGroupRule::rule_set& affined,
        VMGroupRule::rule_set& anti, VMGroupRule& err)
{
    VMGroupRule ta, taa;

    rule_set::iterator it;

    for (it=affined.begin() ; it != affined.end(); ++it)
    {
        ta |= *it;
    }

    for (it=anti.begin() ; it != anti.end(); ++it)
    {
        taa |= *it;
    }

    err = ta & taa;

    return err.none();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

std::string VMGroupRule::policy_to_s(Policy policy)
{
    std::string name;

    switch(policy)
    {
        case AFFINED:
            name="AFFINED";
            break;

        case ANTI_AFFINED:
            name="ANTI_AFFINED";
            break;

        case NONE:
            name="NONE";
            break;
    }

    return name;
}

/* -------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

ostream& operator<<(ostream& os, const VMGroupRule& rule)
{
    os << right << setw(14) << VMGroupRule::policy_to_s(rule.policy) << " ";

    for (int i = 0 ; i <VMGroupRoles::MAX_ROLES ; ++i)
    {
        if ( rule.roles[i] == 1 )
        {
            os << right << setw(3) << i << " ";
        }
    }

    os << '\n';

    return os;
}

