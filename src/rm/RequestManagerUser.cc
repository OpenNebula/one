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

#include "RequestManagerUser.h"

using namespace std;

void RequestManagerUser::
request_execute(xmlrpc_c::paramList const& paramList,
                RequestAttributes& att)
{
    int    id  = xmlrpc_c::value_int(paramList.getInt(1));

    if ( basic_authorization(id, att) == false )
    {
        return;
    }

    if ( pool->exist(id) == -1 )
    {
        att.resp_id = id;
        failure_response(NO_EXISTS, att);
        return;
    }

    if ( user_action(id, paramList, att, att.resp_msg) < 0 )
    {
        failure_response(ACTION, att);
        return;
    }

    success_response(id, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int UserChangePassword::user_action(int     user_id,
                                    xmlrpc_c::paramList const& paramList,
                                    RequestAttributes&         att,
                                    string& error_str)
{

    string new_pass = xmlrpc_c::value_string(paramList.getString(2));

    auto user = static_cast<UserPool *>(pool)->get(user_id);

    if ( user == nullptr )
    {
        return -1;
    }

    string driver = user->get_auth_driver();
    bool allowed  = false;

    if ( Nebula::instance().get_auth_conf_attribute(driver, "PASSWORD_CHANGE",
                                                    allowed) != 0)
    {
        allowed = false;
    }

    if (!allowed && !att.is_admin())
    {
        error_str = "Password for driver " + user->get_auth_driver() +
                    " cannot be changed.";
        return -1;
    }

    int rc = user->set_password(new_pass, error_str);

    if ( rc == 0 )
    {
        pool->update(user.get());
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int UserChangeAuth::user_action(int     user_id,
                                xmlrpc_c::paramList const& paramList,
                                RequestAttributes&         att,
                                string& error_str)
{
    string new_auth = xmlrpc_c::value_string(paramList.getString(2));
    string new_pass = xmlrpc_c::value_string(paramList.getString(3));

    int    rc = 0;

    auto user = static_cast<UserPool *>(pool)->get(user_id);;

    if ( user == nullptr )
    {
        return -1;
    }

    string old_auth = user->get_auth_driver();

    rc = user->set_auth_driver(new_auth, error_str);

    if ( rc == 0 && !new_pass.empty() )
    {
        rc = user->set_password(new_pass, error_str);

        if (rc != 0)
        {
            string tmp_str;

            user->set_auth_driver(old_auth, tmp_str);
        }
    }

    if ( rc == 0 )
    {
        pool->update(user.get());
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int UserSetQuota::user_action(int     user_id,
                              xmlrpc_c::paramList const& paramList,
                              RequestAttributes&         att,
                              string& error_str)
{

    string   quota_str = xmlrpc_c::value_string(paramList.getString(2));
    Template quota_tmpl;

    int    rc;

    if ( user_id == UserPool::ONEADMIN_ID )
    {
        error_str = "Cannot set quotas for oneadmin user";
        return -1;
    }

    rc = quota_tmpl.parse_str_or_xml(quota_str, error_str);

    if ( rc != 0 )
    {
        return -1;
    }

    auto upool = static_cast<UserPool *>(pool);
    auto user = upool->get(user_id);

    if ( user == nullptr )
    {
        return -1;
    }

    rc = user->quota.set(&quota_tmpl, error_str);

    upool->update_quotas(user.get());

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int UserEnable::user_action(int     user_id,
                            xmlrpc_c::paramList const& paramList,
                            RequestAttributes&         att,
                            string& error_str)
{
    bool enable = paramList.getBoolean(2);

    if ( user_id == UserPool::ONEADMIN_ID )
    {
        error_str = "Cannot enable/disable oneadmin user";
        return -1;
    }

    auto upool = static_cast<UserPool *>(pool);
    auto user = upool->get(user_id);

    if ( user == nullptr )
    {
        error_str = "User not found";
        return -1;
    }

    if (user->isEnabled() == enable)
    {
        return 0;
    }

    if (enable)
    {
        user->enable();
    }
    else
    {
        user->disable();
    }

    upool->update(user.get());

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void UserEditGroup::
request_execute(xmlrpc_c::paramList const& paramList,
                RequestAttributes& att)
{
    int user_id  = xmlrpc_c::value_int(paramList.getInt(1));
    int group_id = xmlrpc_c::value_int(paramList.getInt(2));

    int rc;

    string gname;
    string auth_driver;

    PoolObjectAuth uperms;
    PoolObjectAuth gperms;

    if ( auto user = upool->get_ro(user_id) )
    {
        user->get_permissions(uperms);

        auth_driver = user->get_auth_driver();
    }
    else
    {
        att.resp_obj = PoolObjectSQL::USER;
        att.resp_id  = user_id;
        failure_response(NO_EXISTS, att);

        return;
    }

    bool driver_managed_groups;

    if (Nebula::instance().get_auth_conf_attribute(auth_driver,
                                                   "DRIVER_MANAGED_GROUPS", driver_managed_groups) != 0)
    {
        driver_managed_groups = false;
    }

    if (driver_managed_groups)
    {
        att.resp_msg = "Groups cannot be manually managed for auth driver " +
                       auth_driver;
        failure_response(ACTION, att);
        return;
    }

    rc = get_info(gpool, group_id, PoolObjectSQL::GROUP, att, gperms, gname, true);

    if ( rc == -1 )
    {
        return;
    }

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(AuthRequest::MANAGE, uperms);   // MANAGE USER
    ar.add_auth(AuthRequest::MANAGE, gperms);   // MANAGE GROUP

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;
        failure_response(AUTHORIZATION, att);
        return;
    }

    if ( secondary_group_action(user_id, group_id, paramList, att.resp_msg) < 0 )
    {
        failure_response(ACTION, att);
        return;
    }

    success_response(user_id, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int UserAddGroup::secondary_group_action(
        int                        user_id,
        int                        group_id,
        xmlrpc_c::paramList const& _paramList,
        string&                    error_str)
{
    int rc;

    if ( auto user = upool->get(user_id) )
    {
        rc = user->add_group(group_id);

        if ( rc != 0 )
        {
            error_str = "User is already in this group";
            return -1;
        }

        upool->update(user.get());
    }
    else
    {
        return -1;
    }


    auto group = gpool->get(group_id);

    if ( group == nullptr )
    {
        if ( auto user = upool->get(user_id) )
        {
            user->del_group(group_id);

            upool->update(user.get());
        }

        error_str = "Group does not exist";
        return -1;
    }

    group->add_user(user_id);

    gpool->update(group.get());

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int UserDelGroup::secondary_group_action(
        int                        user_id,
        int                        group_id,
        xmlrpc_c::paramList const& _paramList,
        string&                    error_str)
{
    int rc;

    if ( auto user = upool->get(user_id) )
    {
        rc = user->del_group(group_id);

        if ( rc != 0 )
        {
            if ( rc == -1 )
            {
                error_str = "User is not part of this group";
            }
            else if ( rc == -2 )
            {
                error_str = "Cannot remove user from the primary group";
            }
            else
            {
                error_str = "Cannot remove user from group";
            }

            return rc;
        }

        upool->update(user.get());
    }

    auto group = gpool->get(group_id);

    if ( group == nullptr )
    {
        //Group does not exist, should never occur
        error_str = "Cannot remove user from group";
        return -1;
    }

    group->del_user(user_id);

    gpool->update(group.get());

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void UserLogin::request_execute(xmlrpc_c::paramList const& paramList,
                                RequestAttributes& att)
{
    /* ---------------------------------------------------------------------- */
    /* Parse request attributes and authorize request                         */
    /* ---------------------------------------------------------------------- */
    string uname = xmlrpc_c::value_string(paramList.getString(1));
    string token = xmlrpc_c::value_string(paramList.getString(2));
    time_t valid = xmlrpc_c::value_int(paramList.getInt(3));
    int    egid  = -1;

    if ( paramList.size() > 4 )
    {
        egid = xmlrpc_c::value_int(paramList.getInt(4));
    }

    PoolObjectAuth perms;

    auto upool = static_cast<UserPool *>(pool);

    if (auto user = upool->get_ro(uname))
    {
        user->get_permissions(perms);
    }
    else
    {
        failure_response(NO_EXISTS, att);
        return;
    }

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(att.auth_op, perms);

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;
        failure_response(AUTHORIZATION, att);
        return;
    }

    auto user = upool->get(uname);

    if ( user == nullptr )
    {
        failure_response(NO_EXISTS, att);
        return;
    }

    /* ---------------------------------------------------------------------- */
    /* Build login attributes                                                 */
    /* ---------------------------------------------------------------------- */
    string auth_driver = user->get_auth_driver();
    time_t max_token_time;

    if (Nebula::instance().get_auth_conf_attribute(auth_driver, "MAX_TOKEN_TIME",
                                                   max_token_time) != 0)
    {
        max_token_time = -1;
    }

    if (max_token_time == 0)
    {
        att.resp_msg = "Login tokens are disabled for driver " + auth_driver;
        failure_response(ACTION,  att);

        // Reset any active token
        user->login_tokens.reset();
        pool->update(user.get());

        return;
    }
    else if (max_token_time > 0 && ( valid > max_token_time || valid == -1))
    {
        valid = max_token_time;
    }

    if (valid == 0) //Reset token
    {
        if ( token.empty() )
        {
            user->login_tokens.reset();
        }
        else if ( user->login_tokens.reset(token) != 0 )
        {
            att.resp_msg = "Could not find token: " + token;
            failure_response(XML_RPC_API,  att);

            return;
        }
    }
    else if (valid > 0 || valid == -1)
    {
        /**
         * Scoped token checks
         * 1. user is in the target group
         * 2. Authenticated groups for the user include the target group
         * 3. user is not oneadmin or admin group
         */
        if ( egid != -1 && !att.is_admin() && ( !user->is_in_group(egid) ||
                                                att.group_ids.count(egid) == 0) )
        {
            att.resp_msg = "EGID is not in user group list";
            failure_response(XML_RPC_API,  att);

            return;
        }

        if ( egid == -1 && user->get_groups() != att.group_ids )
        {
            att.resp_msg = "Cannot create a full token with a specific group token";
            failure_response(XML_RPC_API,  att);

            return;
        }

        if ( user->login_tokens.set(token, valid, egid) != 0 )
        {
            att.resp_msg = "Max number of tokens limit reached.";
            failure_response(XML_RPC_API,  att);

            return;

        };
    }
    else
    {
        att.resp_msg = "Wrong valid period for token";
        failure_response(XML_RPC_API,  att);

        return;
    }

    pool->update(user.get());

    success_response(token, att);
}
