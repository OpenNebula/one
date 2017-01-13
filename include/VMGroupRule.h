
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

    /**
     *  Placement policy rules for roles
     *    AFFINED: VMs of all roles are placed in the same hypervisor
     *    ANTI_AFFINED: VMs are placed in different hypervisors (role-wise)
     *    NONE: No additional placement constraints
     */
    enum Policy
    {
        NONE        = 0x00,
        AFFINED     = 0x01,
        ANTI_AFFINED= 0x02
    };


    /**
     *  @return policy name
     */
    static std::string policy_to_s(Policy policy)
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

    /**
     * A specialized set for rules
     */
    typedef std::set<VMGroupRule, VMGroupRule_compare> rule_set;

    /* ---------------------------------------------------------------------- */
    /*  Rule Constructors                                                     */
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
    /* Rule operators                                                         */
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

    /* ---------------------------------------------------------------------- */
    /* Rule interface                                                         */
    /* ---------------------------------------------------------------------- */
    /**
     *  Check if an affined and anti-affined rule set are compatible. Sets are
     *  compatible if there isn't a role in the affined and anti-affined sets
     *  at the same time
     *    @param affined rule set
     *    @param anti affined rule set
     *    @param err a rule with the roles in both sets
     *
     *    @return true if sets are compatible
     */
    static bool compatible(rule_set& affined, rule_set& anti, VMGroupRule& err);

    /**
     *  @return the roles in the rule as a bitset (1 roles is in)
     */
    const std::bitset<VMGroupRoles::MAX_ROLES>& get_roles() const
    {
        return roles;
    }

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

/**
 *  Functor to compre two rules. Two rules are considered equivalent if the
 *  include the same roles.
 */
struct VMGroupRule_compare
{
    bool operator() (const VMGroupRule& lhs, const VMGroupRule& rhs) const
    {
        return lhs.roles.to_ullong() < rhs.roles.to_ullong();
    }
};

#endif /*VMGROUP_RULE_H_*/

