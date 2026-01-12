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

#ifndef GROUP_API_H
#define GROUP_API_H

#include "Request.h"
#include "SharedAPI.h"
#include "Nebula.h"
#include "GroupPool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class GroupAPI : public SharedAPI
{
protected:
    GroupAPI(Request &r) : SharedAPI(r)
    {
        request.auth_object(PoolObjectSQL::GROUP);
        request.auth_op(AuthRequest::ADMIN);

        gpool = Nebula::instance().get_gpool();
        pool = gpool;
    };

    virtual ~GroupAPI() = default;

    /* API calls */
    Request::ErrorCode quota(int oid,
                             const std::string& quota,
                             RequestAttributes& att);

    Request::ErrorCode add_admin(int oid,
                                 int user_id,
                                 RequestAttributes& att);

    Request::ErrorCode del_admin(int oid,
                                 int user_id,
                                 RequestAttributes& att);

    Request::ErrorCode quota_info(std::string& xml,
                                  RequestAttributes& att);

    /* Helpers */
    Request::ErrorCode edit_admin(int oid,
                                  int user_id,
                                  RequestAttributes& att);

    void to_xml(RequestAttributes& att, PoolObjectSQL * object,
                std::string& str) override
    {
        static_cast<Group*>(object)->to_xml_extended(str);
    };

    int drop(std::unique_ptr<PoolObjectSQL> obj,
             bool recursive,
             RequestAttributes& att) override;

    int set_default_quota(Template *tmpl, RequestAttributes& att) override
    {
        return Nebula::instance().set_default_group_quota(tmpl, att.resp_msg);
    }

    const DefaultQuotas* get_default_quota() override
    {
        return &Nebula::instance().get_default_group_quota();
    }

    GroupPool * gpool;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class GroupAllocateAPI : public GroupAPI
{
protected:
    GroupAllocateAPI(Request &r) : GroupAPI(r)
    {
        request.auth_op(AuthRequest::CREATE);
    }

    Request::ErrorCode allocate(const std::string& gname,
                                int                cluster_id,
                                int&               oid,
                                RequestAttributes& att) override;

    Request::ErrorCode pool_allocate(std::unique_ptr<Template> tmpl,
                                     int&                       id,
                                     RequestAttributes&         att) override;

private:
    std::string _gname;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class GroupInfoAPI : public GroupAPI
{
protected:
    GroupInfoAPI(Request &r)
        : GroupAPI(r)
    {
        request.auth_op(AuthRequest::USE_NO_LCK);
        request.leader_only(false);
        request.zone_disabled(true);
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class GroupQuotaInfoAPI : public GroupAPI
{
protected:
    GroupQuotaInfoAPI(Request &r) : GroupAPI(r)
    {
        request.zone_disabled(true);
    }
};

#endif
