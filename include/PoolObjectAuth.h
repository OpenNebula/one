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

#ifndef POOL_OBJECT_AUTH_H_
#define POOL_OBJECT_AUTH_H_

#include "PoolObjectSQL.h"

class AclRule;

/**
 *  This class abstracts the authorization attributes of a PoolObject. It is
 *  used to check permissions and access rights of requests
 */
class PoolObjectAuth
{
public:
    /* ------------------- Constructor and Methods -------------------------- */

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
        other_a(0) {};

    void get_acl_rules(AclRule& owner_rule,
                       AclRule& group_rule,
                       AclRule& other_rule) const;

    string type_to_str() const
    {
        return PoolObjectSQL::type_to_str(obj_type);    
    };

    /* --------------------------- Attributes ------------------------------- */

    PoolObjectSQL::ObjectType obj_type;

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
