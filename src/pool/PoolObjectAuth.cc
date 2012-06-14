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

#include "PoolObjectAuth.h"
#include "AuthRequest.h"
#include "AclRule.h"

void PoolObjectAuth::get_acl_rules(AclRule& owner_rule,
                                   AclRule& group_rule,
                                   AclRule& other_rule) const
{
    long long perm_user, perm_resource, perm_rights;

    perm_resource = obj_type | AclRule::INDIVIDUAL_ID | oid;

    // -------------------------------------------------------------------------
    // Rule     "#uid  ob_type/#oid  user_rights"
    // -------------------------------------------------------------------------

    perm_user   = AclRule::INDIVIDUAL_ID | uid;
    perm_rights = 0;

    if ( owner_u == 1 )
    {
        perm_rights = perm_rights | AuthRequest::USE;
    }

    if ( owner_m == 1 )
    {
        perm_rights = perm_rights | AuthRequest::MANAGE;
    }

    if ( owner_a == 1 )
    {
        perm_rights = perm_rights | AuthRequest::ADMIN;
    }

    owner_rule.set(0, perm_user, perm_resource, perm_rights);

    // -------------------------------------------------------------------------
    // Rule "@gid  ob_type/#oid  group_rights"
    // -------------------------------------------------------------------------

    perm_user   = AclRule::GROUP_ID | gid;
    perm_rights = 0;

    if ( group_u == 1 )
    {
        perm_rights = perm_rights | AuthRequest::USE;
    }

    if ( group_m == 1 )
    {
        perm_rights = perm_rights | AuthRequest::MANAGE;
    }

    if ( group_a == 1 )
    {
        perm_rights = perm_rights | AuthRequest::ADMIN;
    }

    group_rule.set(0, perm_user, perm_resource, perm_rights);

    // -------------------------------------------------------------------------
    // Rule  "*     ob_type/#oid  others_rights"
    // -------------------------------------------------------------------------
    
    perm_user       = AclRule::ALL_ID;
    perm_rights     = 0;

    if ( other_u == 1 )
    {
        perm_rights = perm_rights | AuthRequest::USE;
    }

    if ( other_m == 1 )
    {
        perm_rights = perm_rights | AuthRequest::MANAGE;
    }

    if ( other_a == 1 )
    {
        perm_rights = perm_rights | AuthRequest::ADMIN;
    }

    other_rule.set(0, perm_user, perm_resource, perm_rights);
};

