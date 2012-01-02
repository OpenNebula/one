/* -------------------------------------------------------------------------- */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             */
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

#ifndef POOL_OBJECT_AUTH_H_
#define POOL_OBJECT_AUTH_H_

#include "PoolObjectSQL.h"
#include "AuthManager.h"
#include "AclRule.h"

class PoolObjectAuth
{
public:
    PoolObjectAuth(PoolObjectSQL* obj)
    {
        obj_type = obj->obj_type;

        oid     = obj->oid;
        uid     = obj->uid;
        gid     = obj->gid;

        owner_u = obj->owner_u;
        owner_m = obj->owner_m;
        owner_a = obj->owner_a;

        group_u = obj->group_u;
        group_m = obj->group_m;
        group_a = obj->group_a;

        other_u = obj->other_u;
        other_m = obj->other_m;
        other_a = obj->other_a;
    };

    PoolObjectAuth():
        oid(-1),
        uid(-1),
        gid(-1),
        owner_u(1),
        owner_m(1),
        owner_a(0),
        group_u(0),
        group_m(0),
        group_a(0),
        other_u(0),
        other_m(0),
        other_a(0)
    {};

    void get_acl_rules( AclRule* owner_rule,
                        AclRule* group_rule,
                        AclRule* other_rule)
    {
        long long perm_user, perm_resource, perm_rights;

        perm_resource = obj_type | AclRule::INDIVIDUAL_ID | oid;

        // Rule     "#uid  ob_type/#oid  user_rights"

        perm_user       = AclRule::INDIVIDUAL_ID | uid;
        perm_rights     = 0;
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

        owner_rule = new AclRule(0, perm_user, perm_resource, perm_rights);


        // Rule     "@gid  ob_type/#oid  group_rights"
        perm_user       = AclRule::GROUP_ID | gid;
        perm_rights     = 0;

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

        group_rule = new AclRule(0, perm_user, perm_resource, perm_rights);

        // Rule     "*     ob_type/#oid  others_rights"
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

        other_rule = new AclRule(0, perm_user, perm_resource, perm_rights);
    };

    AuthRequest::Object obj_type;

    int oid;
    int uid;
    int gid;

    int owner_u;
    int owner_m;
    int owner_a;

    int group_u;
    int group_m;
    int group_a;

    int other_u;
    int other_m;
    int other_a;
};

#endif /*POOL_OBJECT_AUTH_H_*/
