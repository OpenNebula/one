/* ------------------------------------------------------------------------ */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems              */
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

bool VMGroupRule::compatible(rule_set& affined, rule_set& anti, VMGroupRule& err)
{
    VMGroupRule ta, taa;

    for (const auto& rule : affined)
    {
        ta |= rule;
    }

    for (const auto& rule : anti)
    {
        taa |= rule;
    }

    err = ta & taa;

    return err.none();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VMGroupRule::reduce(rule_set affined, rule_set& reduced_set)
{
    if (affined.empty())
    {
        return;
    }

    VMGroupRule::rule_set::iterator it, jt;

    VMGroupRule reduced_rule;

    for ( it = affined.begin(), reduced_rule = (*it) ; it != affined.end() ; )
    {
        bool reduced = false;

        for ( jt = affined.begin() ; jt != affined.end() ; )
        {
            if ( it == jt || (reduced_rule & *jt).none() )
            {
                ++jt;
            }
            else
            {
                reduced_rule |= *jt;

                jt = affined.erase(jt);

                reduced = true;
            }
        }

        if (!reduced)
        {
            reduced_set.insert(reduced_rule);

            ++it;
            if (it != affined.end())
            {
                reduced_rule = *it;
            }
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

std::ostream& operator<<(std::ostream& os, VMGroupPolicy policy)
{
    switch(policy)
    {
        case VMGroupPolicy::AFFINED:
            os << "AFFINED";
            break;

        case VMGroupPolicy::ANTI_AFFINED:
            os << "ANTI_AFFINED";
            break;

        case VMGroupPolicy::NONE:
            os << "NONE";
            break;
    }

    return os;
}

