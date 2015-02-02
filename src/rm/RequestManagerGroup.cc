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

    static_cast<GroupPool *>(pool)->update_quotas(group);

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

void GroupEditAdmin::request_execute(
        xmlrpc_c::paramList const&  paramList,
        RequestAttributes&          att)
{
    int group_id    = xmlrpc_c::value_int(paramList.getInt(1));
    int user_id     = xmlrpc_c::value_int(paramList.getInt(2));

    PoolObjectAuth group_perms;
    PoolObjectAuth user_perms;

    string group_name;
    string user_name;
    string error_str;

    Group* group;

    int rc;

    // -------------------------------------------------------------------------
    // Authorize the action
    // -------------------------------------------------------------------------

    rc = get_info(pool, group_id, PoolObjectSQL::GROUP,
                    att, group_perms, group_name, true);

    if ( rc == -1 )
    {
        return;
    }

    rc = get_info(upool, user_id, PoolObjectSQL::USER, att, user_perms,
                    user_name, false);

    if ( rc == -1 )
    {
        failure_response(NO_EXISTS, get_error(object_name(PoolObjectSQL::USER),
                user_id), att);

        return;
    }

    if ( att.uid != 0 )
    {
        AuthRequest ar(att.uid, att.group_ids);

        ar.add_auth(AuthRequest::ADMIN, group_perms);   // MANAGE GROUP

        ar.add_auth(AuthRequest::ADMIN, user_perms);    // MANAGE USER

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

    rc = edit_admin(group, user_id, error_str);

    if (rc == 0)
    {
        pool->update(group);
    }

    group->unlock();

    if (rc != 0)
    {
        failure_response(INTERNAL,
                request_error("Cannot edit group", error_str),
                att);

        return;
    }

    success_response(group_id, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int GroupAddAdmin::edit_admin(Group* group, int user_id, string& error_msg)
{
    return group->add_admin(user_id, error_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int GroupDelAdmin::edit_admin(Group* group, int user_id, string& error_msg)
{
    return group->del_admin(user_id, error_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
