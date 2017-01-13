
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

#ifndef VMGROUP_RULE_H_
#define VMGROUP_RULE_H_

#include <bitset>
#include "VMGroupRole.h"

struct VMGroupRule_compare;

/**
 *  A rule represents a role placement policy
 */
class VMGroupRule
{
public:
    enum Policy
    {
        NONE        = 0x00,
        AFFINED     = 0x01,
        ANTI_AFFINED= 0x02
    };

    /* ---------------------------------------------------------------------- */
    /* ---------------------------------------------------------------------- */

    VMGroupRule():policy(NONE),roles(){};

    VMGroupRule(Policy p, std::set<int> roles_id):policy(p)
    {
        std::set<int>::iterator it;

        for ( it = roles_id.begin(); it != roles_id.end(); ++it )
        {
            if ( *it < VMGroupRoles::MAX_ROLES )
            {
                roles[*it] = 1;
            }
        }
    };

    VMGroupRule(Policy p, std::bitset<VMGroupRoles::MAX_ROLES> _roles)
        :policy(p), roles(_roles){};

    VMGroupRule(const VMGroupRule& other)
    {
        policy = other.policy;
        roles  = other.roles;
    }

    /* ---------------------------------------------------------------------- */
    /* ---------------------------------------------------------------------- */

    typedef std::set<VMGroupRule, VMGroupRule_compare> rule_set;

    /* ---------------------------------------------------------------------- */
    /* ---------------------------------------------------------------------- */

    VMGroupRule& operator=(const VMGroupRule& other)
    {
        if ( this != &other )
        {
            policy = other.policy;
            roles  = other.roles;
        }

        return *this;
    }

    VMGroupRule& operator&= (const VMGroupRule& other)
    {
        roles &= other.roles;
        return *this;
    }

    VMGroupRule operator& (const VMGroupRule& other)
    {
        return VMGroupRule(policy, other.roles & roles );
    }

    VMGroupRule& operator|= (const VMGroupRule& other)
    {
        roles |= other.roles;
        return *this;
    }

    VMGroupRule operator| (const VMGroupRule& other)
    {
        return VMGroupRule(policy, other.roles | roles );
    }

    bool none()
    {
        return roles.none();
    }

    static bool compatible(rule_set& affined, rule_set& anti, VMGroupRule& err);

private:

    friend class VMGroupRule_compare;

    /**
     *  Type of the rule
     */
    Policy policy;

    /**
     *  Roles participating in the rule
     */
    std::bitset<VMGroupRoles::MAX_ROLES> roles;
};

struct VMGroupRule_compare
{
    bool operator() (const VMGroupRule& lhs, const VMGroupRule& rhs) const
    {
        return lhs.roles.to_ullong() < rhs.roles.to_ullong();
    }
};

#endif /*VMGROUP_RULE_H_*/

