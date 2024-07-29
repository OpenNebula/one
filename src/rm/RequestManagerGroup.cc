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

#include "RequestManagerGroup.h"

using namespace std;

void GroupSetQuota::
request_execute(xmlrpc_c::paramList const& paramList,
                RequestAttributes& att)
{
    int     id        = xmlrpc_c::value_int(paramList.getInt(1));
    string  quota_str = xmlrpc_c::value_string(paramList.getString(2));

    Template quota_tmpl;
    int      rc;

    if ( id == GroupPool::ONEADMIN_ID )
    {
        att.resp_msg = "Cannot set quotas for oneadmin group";
        failure_response(ACTION, att);
        return;
    }

    if ( basic_authorization(id, att) == false )
    {
        return;
    }

    rc = quota_tmpl.parse_str_or_xml(quota_str, att.resp_msg);

    if ( rc != 0 )
    {
        failure_response(ACTION, att);
        return;
    }

    auto group = pool->get<Group>(id);

    if ( group == nullptr )
    {
        att.resp_id = id;
        failure_response(NO_EXISTS, att);
        return;
    }

    rc = group->quota.set(&quota_tmpl, att.resp_msg);

    static_cast<GroupPool *>(pool)->update_quotas(group.get());

    if ( rc != 0 )
    {
        failure_response(ACTION, att);
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
        att.resp_obj = PoolObjectSQL::USER;
        att.resp_id  = user_id;
        failure_response(NO_EXISTS, att);
        return;
    }

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(AuthRequest::ADMIN, group_perms);   // MANAGE GROUP

    ar.add_auth(AuthRequest::ADMIN, user_perms);    // MANAGE USER

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;
        failure_response(AUTHORIZATION, att);

        return;
    }

    auto group = pool->get<Group>(group_id);

    if ( group == nullptr )
    {
        att.resp_id = group_id;
        failure_response(NO_EXISTS, att);
        return;
    }

    rc = edit_admin(group.get(), user_id, att.resp_msg);

    if (rc == 0)
    {
        pool->update(group.get());
    }

    if (rc != 0)
    {
        att.resp_msg = "Cannot edit group. " + att.resp_msg;
        failure_response(INTERNAL, att);

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
