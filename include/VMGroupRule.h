
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

#ifndef VMGROUP_RULE_H_
#define VMGROUP_RULE_H_

#include <bitset>
#include "VMGroupRole.h"

struct VMGroupRule_compare;

/**
 *  Placement policy rules for roles
 *    AFFINED: VMs of all roles are placed in the same hypervisor
 *    ANTI_AFFINED: VMs are placed in different hypervisors (role-wise)
 *    NONE: No additional placement constraints
 */
enum class VMGroupPolicy
{
    NONE        = 0x00,
    AFFINED     = 0x01,
    ANTI_AFFINED= 0x02
};

std::ostream& operator<<(std::ostream& os, VMGroupPolicy policy);

/**
 *  A rule represents a role placement policy
 */
class VMGroupRule
{
public:
    /**
     * A specialized set for rules
     */
    typedef std::set<VMGroupRule, VMGroupRule_compare> rule_set;

    typedef std::bitset<VMGroupRoles::MAX_ROLES> role_bitset;

    /* ---------------------------------------------------------------------- */
    /*  Rule Constructors                                                     */
    /* ---------------------------------------------------------------------- */
    VMGroupRule():policy(VMGroupPolicy::NONE), roles() {};

    VMGroupRule(VMGroupPolicy p, std::set<int> roles_id):policy(p)
    {
        for ( auto rid : roles_id )
        {
            if ( rid < VMGroupRoles::MAX_ROLES )
            {
                roles[rid] = 1;
            }
        }
    };

    VMGroupRule(VMGroupPolicy p, const role_bitset& _roles)
        : policy(p)
        , roles(_roles)
    {}

    VMGroupRule(const VMGroupRule& other) = default;

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

    VMGroupRule operator& (const VMGroupRule& other) const
    {
        return VMGroupRule(policy, other.roles & roles );
    }

    VMGroupRule& operator|= (const VMGroupRule& other)
    {
        roles |= other.roles;
        return *this;
    }

    VMGroupRule operator| (const VMGroupRule& other) const
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
     *  Reduce a set of affinity rules merging rules affecting the same roles
     *  Example:
     *    AFFINED = a, b
     *    AFFINED = b, c   ------->  AFFINED = a, b, c
     *    AFFINED = e, d             AFFINED = e, d
     *
     *   @param affined set of rules to be reduced
     *   @param reduced set
     */
    static void reduce(rule_set affined, rule_set& reduced);

    /**
     *  @return the roles in the rule as a bitset (1 roles is in)
     */
    const role_bitset& get_roles() const
    {
        return roles;
    }

    VMGroupPolicy get_policy() const
    {
        return policy;
    }

private:

    friend class VMGroupRule_compare;

    /**
     *  Type of the rule
     */
    VMGroupPolicy policy;

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

