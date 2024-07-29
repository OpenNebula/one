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

    PoolObjectAuth()
        : obj_type(PoolObjectSQL::NONE)
        , oid(-1)
        , uid(-1)
        , gid(-1)
        , owner_u(1)
        , owner_m(1)
        , owner_a(0)
        , group_u(0)
        , group_m(0)
        , group_a(0)
        , other_u(0)
        , other_m(0)
        , other_a(0)
        , disable_all_acl(false)
        , disable_cluster_acl(false)
        , disable_group_acl(false)
        , locked(0)
    {}

    void get_acl_rules(AclRule& owner_rule,
                       AclRule& group_rule,
                       AclRule& other_rule,
                       int zone_id) const;

    std::string type_to_str() const
    {
        return PoolObjectSQL::type_to_str(obj_type);
    };

    /* --------------------------- Attributes ------------------------------- */

    PoolObjectSQL::ObjectType obj_type;

    int oid;
    int uid;
    int gid;
    std::set<int> cids;

    int owner_u;
    int owner_m;
    int owner_a;

    int group_u;
    int group_m;
    int group_a;

    int other_u;
    int other_m;
    int other_a;

    bool disable_all_acl;     // All objects of this type (e.g. NET/*)
    bool disable_cluster_acl; // All objects in a cluster (e.g. NET/%100)
    bool disable_group_acl;   // All objects own by this group (e.g. NET/@101)

    int locked;
};

#endif /*POOL_OBJECT_AUTH_H_*/
