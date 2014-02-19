/* -------------------------------------------------------------------------- */
/* Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#include "RequestManagerGroup.h"

using namespace std;

void GroupSetQuota::
    request_execute(xmlrpc_c::paramList const& paramList,
                    RequestAttributes& att)
{
    int     id        = xmlrpc_c::value_int(paramList.getInt(1));
    string  quota_str = xmlrpc_c::value_string(paramList.getString(2));

    Group * group;
    string  error_str;

    Template quota_tmpl;
    int      rc;

    if ( id == GroupPool::ONEADMIN_ID )
    {
        failure_response(ACTION, 
                       request_error("Cannot set quotas for oneadmin group",""), 
                       att);
        return;
    }

    if ( basic_authorization(id, att) == false )
    {
        return;
    }

    rc = quota_tmpl.parse_str_or_xml(quota_str, error_str);

    if ( rc != 0 )
    {
        failure_response(ACTION, request_error(error_str,""), att);
        return;
    }

    group = static_cast<Group *>(pool->get(id,true));

    if ( group == 0 )
    {
        failure_response(NO_EXISTS,
                get_error(object_name(auth_object),id),
                att);

        return;
    }

    group->quota.set(&quota_tmpl, error_str);

    pool->update(group);

    group->unlock();

    if ( rc != 0 )
    {
        failure_response(ACTION, request_error(error_str,""), att);
    }
    else
    {
        success_response(id, att);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void GroupEditProvider::request_execute(
        xmlrpc_c::paramList const&  paramList,
        RequestAttributes&          att)
{
    int group_id    = xmlrpc_c::value_int(paramList.getInt(1));
    int zone_id     = xmlrpc_c::value_int(paramList.getInt(2));
    int cluster_id  = xmlrpc_c::value_int(paramList.getInt(3));

    PoolObjectAuth group_perms;
    PoolObjectAuth zone_perms;
    PoolObjectAuth cluster_perms;

    string group_name;
    string zone_name;
    string cluster_name;
    string error_str;

    Group* group;

    int rc;
    bool zone_exists = false;
    bool cluster_exists = false;

    // -------------------------------------------------------------------------
    // Authorize the action
    // -------------------------------------------------------------------------

    rc = get_info(pool, group_id, PoolObjectSQL::GROUP,
                    att, group_perms, group_name);

    if ( rc == -1 )
    {
        return;
    }

    rc = get_info(zonepool, zone_id, PoolObjectSQL::ZONE,
                    att, zone_perms, zone_name);

    zone_exists = (rc == 0);

    if ( rc == -1 && check_obj_exist )
    {
        return;
    }

    // TODO: cluster must exist in target zone, this code only checks locally

    if (cluster_id != ClusterPool::ALL_RESOURCES && zone_id == local_zone_id)
    {
        rc = get_info(clpool, cluster_id, PoolObjectSQL::CLUSTER,
                        att, cluster_perms, cluster_name);

        cluster_exists = (rc == 0);

        if ( rc == -1 && check_obj_exist )
        {
            return;
        }
    }

    if ( att.uid != 0 )
    {
        AuthRequest ar(att.uid, att.group_ids);

        ar.add_auth(AuthRequest::ADMIN, group_perms);       // ADMIN GROUP

        if (zone_exists)
        {
            ar.add_auth(AuthRequest::ADMIN, zone_perms);    // ADMIN ZONE
        }

        if (cluster_exists)
        {
            ar.add_auth(AuthRequest::ADMIN, cluster_perms); // ADMIN CLUSTER
        }

        if (UserPool::authorize(ar) == -1)
        {
            failure_response(AUTHORIZATION,
                             authorization_error(ar.message, att),
                             att);

            return;
        }
    }

    group = static_cast<GroupPool*>(pool)->get(group_id, true);

    if ( group  == 0 )
    {
        failure_response(NO_EXISTS,
                get_error(object_name(auth_object),group_id),
                att);

        return;
    }

    rc = edit_resource_provider(group, zone_id, cluster_id, error_str);

    if (rc == 0)
    {
        pool->update(group);
    }

    group->unlock();

    if (rc != 0)
    {
        failure_response(INTERNAL,
                request_error("Cannot edit resources", error_str),
                att);

        return;
    }

    edit_acl_rules(group_id, zone_id, cluster_id, error_str);

    success_response(cluster_id, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int GroupAddProvider::edit_resource_provider(
        Group* group, int zone_id, int cluster_id, string& error_msg)
{
    return group->add_resource_provider(zone_id, cluster_id, error_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int GroupAddProvider::edit_acl_rules(
        int group_id, int zone_id, int cluster_id, string& error_msg)
{
    int rc = 0;

    long long mask_prefix;

    if (cluster_id == ClusterPool::ALL_RESOURCES)
    {
        mask_prefix = AclRule::ALL_ID;
    }
    else
    {
        mask_prefix = AclRule::CLUSTER_ID | cluster_id;
    }

    // @<gid> HOST/%<cid> MANAGE #<zone>
    rc += aclm->add_rule(
            AclRule::GROUP_ID |
            group_id,

            mask_prefix |
            PoolObjectSQL::HOST,

            AuthRequest::MANAGE,

            AclRule::INDIVIDUAL_ID |
            zone_id,

            error_msg);

    // @<gid> DATASTORE+NET/%<cid> USE #<zone>
    rc += aclm->add_rule(
            AclRule::GROUP_ID |
            group_id,

            mask_prefix |
            PoolObjectSQL::DATASTORE |
            PoolObjectSQL::NET,

            AuthRequest::USE,

            AclRule::INDIVIDUAL_ID |
            zone_id,

            error_msg);

    if (rc != 0)
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int GroupDelProvider::edit_resource_provider(
        Group* group, int zone_id, int cluster_id, string& error_msg)
{
    return group->del_resource_provider(zone_id, cluster_id, error_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int GroupDelProvider::edit_acl_rules(
        int group_id, int zone_id, int cluster_id, string& error_msg)
{
    int rc = 0;

    long long mask_prefix;

    if (cluster_id == ClusterPool::ALL_RESOURCES)
    {
        mask_prefix = AclRule::ALL_ID;
    }
    else
    {
        mask_prefix = AclRule::CLUSTER_ID | cluster_id;
    }

    // @<gid> HOST/%<cid> MANAGE #<zid>
    rc += aclm->del_rule(
            AclRule::GROUP_ID |
            group_id,

            mask_prefix |
            PoolObjectSQL::HOST,

            AuthRequest::MANAGE,

            AclRule::INDIVIDUAL_ID |
            zone_id,

            error_msg);

    // @<gid> DATASTORE+NET/%<cid> USE #<zid>
    rc += aclm->del_rule(
            AclRule::GROUP_ID |
            group_id,

            mask_prefix |
            PoolObjectSQL::DATASTORE |
            PoolObjectSQL::NET,

            AuthRequest::USE,

            AclRule::INDIVIDUAL_ID |
            zone_id,

            error_msg);

    if (rc != 0)
    {
        return -1;
    }

    return 0;
}
