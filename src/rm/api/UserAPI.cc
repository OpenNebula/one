/* -------------------------------------------------------------------------- */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                */
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

#include "UserAPI.h"
#include "AclManager.h"
#include "RequestLogger.h"

#include "PoolObjectSQL.h"
#include "VirtualMachinePool.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode UserAPI::authorize_user(int oid, RequestAttributes& att)
{
    return basic_authorization(oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
Request::ErrorCode UserAPI::password(int oid,
                                     const std::string& new_pass,
                                     RequestAttributes& att)
{
    Request::ErrorCode ec = authorize_user(oid, att);

    if (ec != Request::SUCCESS)
    {
        return ec;
    }

    auto user = upool->get(oid);

    if ( user == nullptr )
    {
        return Request::ACTION;
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
        att.resp_msg = "Password for driver " + driver +
        " cannot be changed.";

        return Request::ACTION;
    }

    int rc = user->set_password(new_pass, att.resp_msg);

    if ( rc == 0 )
    {
        upool->update(user.get());
    }
    else
    {
        return Request::ACTION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode UserAPI::change_auth(int oid,
                                        const std::string& new_auth,
                                        const std::string& new_pass,
                                        RequestAttributes& att)
{
    Request::ErrorCode ec = authorize_user(oid, att);

    if (ec != Request::SUCCESS)
    {
        return ec;
    }

    auto user = upool->get(oid);;

    if ( user == nullptr )
    {
        return Request::ACTION;
    }

    string old_auth = user->get_auth_driver();

    user->set_auth_driver(new_auth, att.resp_msg);

    if ( !new_pass.empty() )
    {
        if (user->set_password(new_pass, att.resp_msg) != 0)
        {
            string tmp_str;

            user->set_auth_driver(old_auth, tmp_str);

            return Request::ACTION;
        }
    }

    upool->update(user.get());

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode UserAPI::quota(int oid,
                                  const std::string& quota,
                                  RequestAttributes& att)
{
    Request::ErrorCode ec = authorize_user(oid, att);

    if (ec != Request::SUCCESS)
    {
        return ec;
    }

    Template quota_tmpl;

    int    rc;

    if ( oid == UserPool::ONEADMIN_ID )
    {
        att.resp_msg = "Cannot set quotas for oneadmin user";

        return Request::ACTION;
    }

    rc = quota_tmpl.parse_str_or_xml(quota, att.resp_msg);

    if ( rc != 0 )
    {
        return Request::ACTION;
    }

    vector<VectorAttribute*> vm_quotas;
    quota_tmpl.get("VM", vm_quotas);

    for (auto* va : vm_quotas)
    {
        va->replace("UID", oid);
    }

    auto user = upool->get(oid);

    if ( user == nullptr )
    {
        return Request::ACTION;
    }

    rc = user->quota.set(&quota_tmpl, att.resp_msg);

    if ( rc == 0 )
    {
        upool->update_quotas(user.get());
    }
    else
    {
        return Request::ACTION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode UserAPI::enable(int oid,
                                   bool enable,
                                   RequestAttributes& att)
{
    Request::ErrorCode ec = authorize_user(oid, att);

    if (ec != Request::SUCCESS)
    {
        return ec;
    }

    if ( oid == UserPool::ONEADMIN_ID )
    {
        att.resp_msg = "Cannot enable/disable oneadmin user";

        return Request::ACTION;
    }

    auto user = upool->get(oid);

    if ( user == nullptr )
    {
        att.resp_msg = "User not found";

        return Request::ACTION;
    }

    if (user->isEnabled() == enable)
    {
        return Request::SUCCESS;
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

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode UserAPI::login(const std::string& uname,
                                  std::string& token,
                                  time_t valid,
                                  int egid,
                                  RequestAttributes& att)
{
    /* ---------------------------------------------------------------------- */
    /* Authorize request                                                      */
    /* ---------------------------------------------------------------------- */

    PoolObjectAuth perms;

    if (auto user = upool->get_ro(uname))
    {
        user->get_permissions(perms);
    }
    else
    {
        return Request::NO_EXISTS;
    }

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(att.auth_op, perms);

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;

        return Request::AUTHORIZATION;
    }

    auto user = upool->get(uname);

    if ( user == nullptr )
    {
        return Request::NO_EXISTS;
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

        // Reset any active token
        user->login_tokens.reset();
        upool->update(user.get());

        return Request::ACTION;
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

            return Request::RPC_API;
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

            return Request::RPC_API;
        }

        if ( egid == -1 && user->get_groups() != att.group_ids )
        {
            att.resp_msg = "Cannot create a full token with a specific group token";

            return Request::RPC_API;
        }

        if ( user->login_tokens.set(token, valid, egid) != 0 )
        {
            att.resp_msg = "Max number of tokens limit reached.";

            return Request::RPC_API;
        };
    }
    else
    {
        att.resp_msg = "Wrong valid period for token";

        return Request::RPC_API;
    }

    upool->update(user.get());

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode UserAPI::chown(int oid,
                                  int new_uid,
                                  int new_gid,
                                  RequestAttributes& att)
{
    int old_gid;
    int rc;
    bool remove_old_group;

    string ngname;
    string auth_driver;

    PoolObjectAuth uperms;
    PoolObjectAuth ngperms;

    bool driver_managed_groups;
    bool new_group;

    if ( new_gid < 0 )
    {
        att.resp_msg = "Wrong group ID";

        return Request::RPC_API;
    }

    if ( auto user = upool->get_ro(oid) )
    {
        user->get_permissions(uperms);

        auth_driver = user->get_auth_driver();
        new_group   = user->get_groups().count(new_gid) != 1;
    }
    else
    {
        att.resp_obj = PoolObjectSQL::USER;
        att.resp_id  = oid;

        return Request::NO_EXISTS;
    }

    if ( Nebula::instance().get_auth_conf_attribute(auth_driver,
                                                    "DRIVER_MANAGED_GROUPS", driver_managed_groups) != 0 )
    {
        driver_managed_groups = false;
    }

    if (driver_managed_groups && new_group)
    {
        att.resp_msg = "Groups cannot be manually managed for auth driver " +
                       auth_driver;

        return Request::RPC_API;
    }

    rc = get_info(gpool, new_gid, PoolObjectSQL::GROUP, att, ngperms, ngname, true);

    if ( rc == -1 )
    {
        return Request::NO_EXISTS;
    }

    if ( oid == UserPool::ONEADMIN_ID )
    {
        ostringstream oss;

        oss << RequestLogger::object_name(PoolObjectSQL::USER) << " ["
            << UserPool::ONEADMIN_ID << "] " << UserPool::oneadmin_name
            << " cannot be moved outside of the "
            << RequestLogger::object_name(PoolObjectSQL::GROUP)
            << " [" << GroupPool::ONEADMIN_ID << "] "
            << GroupPool::ONEADMIN_NAME;

        att.resp_msg = oss.str();

        return Request::INTERNAL;
    }

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(att.auth_op, uperms);       // MANAGE USER
    ar.add_auth(AuthRequest::USE, ngperms); // USE GROUP

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;

        return Request::AUTHORIZATION;
    }

    // ------------- Change users primary group ---------------------

    if ( auto user = upool->get(oid) )
    {
        if ((old_gid = user->get_gid()) == new_gid)
        {
            return Request::SUCCESS;
        }

        user->set_group(new_gid, ngname);

        // The user is removed from the old group only if the new group is not a
        // secondary one

        rc = user->add_group(new_gid);

        remove_old_group = (rc == 0);

        if (remove_old_group)
        {
            user->del_group(old_gid);
        }

        upool->update(user.get());
    }
    else
    {
        att.resp_obj = PoolObjectSQL::USER;
        att.resp_id  = oid;

        return Request::NO_EXISTS;
    }

    // ------------- Updates new group with this new user ---------------------

    if ( auto group = gpool->get(new_gid) )
    {
        group->add_user(oid);

        gpool->update(group.get());
    }
    else
    {
        //TODO Rollback
        att.resp_obj = PoolObjectSQL::GROUP;
        att.resp_id  = new_gid;

        return Request::NO_EXISTS;
    }

    // ------------- Updates old group removing the user ---------------------

    if (remove_old_group)
    {
        if ( auto group = gpool->get(old_gid) )
        {
            group->del_user(oid);

            gpool->update(group.get());
        }
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode UserAPI::edit_group(int oid,
                                       int group_id,
                                       RequestAttributes& att)
{
    int rc;

    string gname;
    string auth_driver;

    PoolObjectAuth uperms;
    PoolObjectAuth gperms;

    if ( auto user = upool->get_ro(oid) )
    {
        user->get_permissions(uperms);

        auth_driver = user->get_auth_driver();
    }
    else
    {
        att.resp_obj = PoolObjectSQL::USER;
        att.resp_id  = oid;

        return Request::NO_EXISTS;
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

        return Request::ACTION;
    }

    rc = get_info(gpool, group_id, PoolObjectSQL::GROUP, att, gperms, gname, true);

    if ( rc == -1 )
    {
        return Request::NO_EXISTS;
    }

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(AuthRequest::MANAGE, uperms);   // MANAGE USER
    ar.add_auth(AuthRequest::MANAGE, gperms);   // MANAGE GROUP

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;

        return Request::AUTHORIZATION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode UserAPI::add_group(int oid,
                                      int group_id,
                                      RequestAttributes& att)
{
    Request::ErrorCode ec = edit_group(oid, group_id, att);

    if (ec != Request::SUCCESS)
    {
        return ec;
    }

    int rc;

    if ( auto user = upool->get(oid) )
    {
        rc = user->add_group(group_id);

        if ( rc != 0 )
        {
            att.resp_msg = "User is already in this group";

            return Request::ACTION;
        }

        upool->update(user.get());
    }
    else
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }


    auto group = gpool->get(group_id);

    if ( group == nullptr )
    {
        if ( auto user = upool->get(oid) )
        {
            user->del_group(group_id);

            upool->update(user.get());
        }

        att.resp_id = group_id;

        return Request::NO_EXISTS;
    }

    group->add_user(oid);

    gpool->update(group.get());

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode UserAPI::del_group(int oid,
                                      int group_id,
                                      RequestAttributes& att)
{
    Request::ErrorCode ec = edit_group(oid, group_id, att);

    if (ec != Request::SUCCESS)
    {
        return ec;
    }

    int rc;

    if ( auto user = upool->get(oid) )
    {
        rc = user->del_group(group_id);

        if ( rc != 0 )
        {
            if ( rc == -1 )
            {
                att.resp_msg = "User is not part of this group";
            }
            else if ( rc == -2 )
            {
                att.resp_msg = "Cannot remove user from the primary group";
            }
            else
            {
                att.resp_msg = "Cannot remove user from group";
            }

            return Request::ACTION;
        }

        upool->update(user.get());
    }

    auto group = gpool->get(group_id);

    if ( group == nullptr )
    {
        //Group does not exist, should never occur
        att.resp_msg = "Cannot remove user from group";

        return Request::ACTION;
    }

    group->del_user(oid);

    gpool->update(group.get());

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode UserAllocateAPI::allocate(const std::string& uname,
                                             const std::string& passwd,
                                             const std::string& driver,
                                             const std::vector<int>& group_ids,
                                             int                cluster_id,
                                             int&               oid,
                                             RequestAttributes& att)
{
    _uname     = uname;
    _passwd    = passwd;
    _driver    = driver;
    _group_ids = group_ids;

    return SharedAPI::allocate("", cluster_id, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode UserAllocateAPI::allocate_authorization(Template *            tmpl,
                                                           RequestAttributes&    att,
                                                           PoolObjectAuth *      cluster_perms)
{
    AuthRequest ar(att.uid, att.group_ids);

    ar.add_create_auth(att.uid, att.gid, request.auth_object(), "");

    for (int tmp_gid : _group_ids)
    {
        auto group = gpool->get_ro(tmp_gid);
        if (group == nullptr)
        {
            att.resp_id  = tmp_gid;
            att.resp_obj = PoolObjectSQL::GROUP;

            return Request::NO_EXISTS;
        }

        if (att.gid != tmp_gid)
        {
            PoolObjectAuth perms;

            group->get_permissions(perms);

            ar.add_auth(AuthRequest::MANAGE, perms);
        }
    }

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;

        return Request::AUTHORIZATION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode UserAllocateAPI::pool_allocate(std::unique_ptr<Template> tmpl,
                                 int&                       id,
                                 RequestAttributes&         att)
{
    // Build the set of group IDs
    std::set<int> gids(_group_ids.begin(), _group_ids.end());
    std::set<int> agids;

    int gid = -1;
    if (!gids.empty())
    {
        // First in the vector is primary
        gid = _group_ids.front();
    }
    else
    {
        // Default to USERS or requester's group
        if (att.gid == GroupPool::ONEADMIN_ID)
        {
            gid = GroupPool::USERS_ID;
            gids.insert(GroupPool::USERS_ID);
        }
        else
        {
            gid = att.gid;
            gids.insert(att.gid);
        }
    }

    if (_driver.empty())
    {
        _driver = UserPool::CORE_AUTH;
    }

    int rc = upool->allocate(&id,
                             _uname,
                             gid,
                             _passwd,
                             _driver,
                             true,
                             gids,
                             agids,
                             att.resp_msg);

    return (rc < 0) ? Request::INTERNAL : Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int UserAPI::drop(std::unique_ptr<PoolObjectSQL> object,
                  bool recursive,
                  RequestAttributes& att)
{
    AclManager * aclm = Nebula::instance().get_aclm();

    User * user = static_cast<User *>(object.get());

    set<int> group_set = user->get_groups();

    int oid = user->get_oid();

    if (oid == 0)
    {
        att.resp_msg = "oneadmin cannot be deleted.";

        return -1;
    }

    int rc = upool->drop(object.get(), att.resp_msg);

    object.reset();

    if ( rc == 0 )
    {
        for (auto gid : group_set)
        {
            if ( auto group = gpool->get(gid) )
            {
                group->del_user(oid);
                gpool->update(group.get());
            }
        }
        aclm->del_uid_rules(oid);
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode UserAPI::quota_info(std::string& xml,
                                       RequestAttributes& att)
{
    Nebula::instance().get_default_user_quota().to_xml(xml);

    return Request::SUCCESS;
}
