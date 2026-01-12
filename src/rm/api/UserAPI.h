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

#ifndef USER_API_H
#define USER_API_H

#include "Request.h"
#include "SharedAPI.h"
#include "Nebula.h"
#include "UserPool.h"
#include "GroupPool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserAPI : public SharedAPI
{
protected:
    UserAPI(Request &r) : SharedAPI(r)
    {
        request.auth_object(PoolObjectSQL::USER);
        request.auth_op(AuthRequest::MANAGE);

        upool = Nebula::instance().get_upool();
        gpool = Nebula::instance().get_gpool();
        pool = upool;
    };

    virtual ~UserAPI() = default;

    /* API calls */
    Request::ErrorCode edit_group(int oid,
                                  int group_id,
                                  RequestAttributes& att);

    Request::ErrorCode password(int oid,
                                const std::string& passwd,
                                RequestAttributes& att);

    Request::ErrorCode change_auth(int oid,
                                   const std::string& new_auth,
                                   const std::string& new_pass,
                                   RequestAttributes& att);

    Request::ErrorCode quota(int oid,
                             const std::string& quota,
                             RequestAttributes& att);

    Request::ErrorCode enable(int oid,
                              bool enable,
                              RequestAttributes& att);

    Request::ErrorCode add_group(int oid,
                                 int group_id,
                                 RequestAttributes& att);

    Request::ErrorCode del_group(int oid,
                                 int group_id,
                                 RequestAttributes& att);

    Request::ErrorCode login(const std::string& uname,
                             std::string& token,
                             time_t valid,
                             int egid,
                             RequestAttributes& att);

    Request::ErrorCode chown(int oid,
                             int new_uid,
                             int new_gid,
                             RequestAttributes& att) override;

    /* Helpers */
    Request::ErrorCode authorize_user(int oid,
                                      RequestAttributes& att);

    Request::ErrorCode check_name_unique(int oid,
                                         int nuid,
                                         RequestAttributes& att) override
    {
        return Request::SUCCESS;
    }

    Request::ErrorCode quota_info(std::string& xml,
                                  RequestAttributes& att);

    void to_xml(RequestAttributes& att, PoolObjectSQL * object,
                std::string& str) override
    {
        static_cast<User*>(object)->to_xml_extended(str);
    };

    int drop(std::unique_ptr<PoolObjectSQL> obj,
             bool recursive,
             RequestAttributes& att) override;

    int set_default_quota(Template *tmpl, RequestAttributes& att) override
    {
        return Nebula::instance().set_default_user_quota(tmpl, att.resp_msg);
    }

    const DefaultQuotas* get_default_quota() override
    {
        return &Nebula::instance().get_default_user_quota();
    }

    UserPool * upool;
    GroupPool * gpool;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class UserInfoAPI : public UserAPI
{
protected:
    UserInfoAPI(Request &r)
        : UserAPI(r)
    {
        request.auth_op(AuthRequest::USE_NO_LCK);
        request.leader_only(false);
        request.zone_disabled(true);
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class UserChangePasswordAPI : public UserAPI
{
protected:
    UserChangePasswordAPI(Request &r) : UserAPI(r)
    {
        request.hidden_params({2});
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class UserChangeAuthAPI : public UserAPI
{
protected:
    UserChangeAuthAPI(Request &r) : UserAPI(r)
    {
        request.auth_op(AuthRequest::ADMIN);
        request.hidden_params({3});
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class UserSetQuotaAPI : public UserAPI
{
protected:
    UserSetQuotaAPI(Request &r) : UserAPI(r)
    {
        request.auth_op(AuthRequest::ADMIN);
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class UserEnableAPI : public UserAPI
{
protected:
    UserEnableAPI(Request &r) : UserAPI(r)
    {
        request.auth_op(AuthRequest::ADMIN);
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class UserLoginAPI : public UserAPI
{
protected:
    UserLoginAPI(Request &r) : UserAPI(r)
    {
        request.hidden_params({2});
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class UserAllocateAPI : public UserAPI
{
protected:
    UserAllocateAPI(Request &r) : UserAPI(r)
    {
        request.auth_op(AuthRequest::CREATE);
        request.hidden_params({2});
    }

    Request::ErrorCode allocate(const std::string& uname,
                                const std::string& passwd,
                                const std::string& driver,
                                const std::vector<int>& group_ids,
                                int                cluster_id,
                                int&               oid,
                                RequestAttributes& att);

    Request::ErrorCode allocate_authorization(Template *obj_template,
                                              RequestAttributes&  att,
                                              PoolObjectAuth *cluster_perms) override;

    Request::ErrorCode pool_allocate(std::unique_ptr<Template> tmpl,
                                     int&                       id,
                                     RequestAttributes&         att) override;

private:
    std::string _uname;
    std::string _passwd;
    std::string _driver;
    std::vector<int> _group_ids;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class UserDeleteAPI : public UserAPI
{
protected:
    UserDeleteAPI(Request &r) : UserAPI(r)
    {
        request.auth_op(AuthRequest::ADMIN);
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class UserQuotaInfoAPI : public UserAPI
{
protected:
    UserQuotaInfoAPI(Request &r) : UserAPI(r)
    {
        request.zone_disabled(true);
    }
};

#endif
