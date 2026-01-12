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

#include "GroupAPI.h"
#include "AclManager.h"
#include "UserPool.h"
#include "VdcPool.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode GroupAPI::quota(int oid,
                                   const std::string& quota,
                                   RequestAttributes& att)
{
    Template quota_tmpl;
    int      rc;

    if ( oid == GroupPool::ONEADMIN_ID )
    {
        att.resp_msg = "Cannot set quotas for oneadmin group";

        return Request::ACTION;
    }

    if ( auto ec = basic_authorization(oid, att); ec != Request::SUCCESS )
    {
        return Request::AUTHORIZATION;
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
        va->replace("GID", oid);
    }

    auto group = gpool->get(oid);

    if ( group == nullptr )
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    rc = group->quota.set(&quota_tmpl, att.resp_msg);

    if ( rc != 0 )
    {
        return Request::ACTION;
    }

    gpool->update_quotas(group.get());

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode GroupAPI::edit_admin(int oid,
                                        int user_id,
                                        RequestAttributes& att)
{
    PoolObjectAuth group_perms;
    PoolObjectAuth user_perms;

    string group_name;
    string user_name;

    // -------------------------------------------------------------------------
    // Authorize the action
    // -------------------------------------------------------------------------

    int rc = get_info(gpool, oid, PoolObjectSQL::GROUP, att, group_perms, group_name, true);

    if ( rc == -1 )
    {
        return Request::NO_EXISTS;
    }

    auto upool = Nebula::instance().get_upool();

    rc = get_info(upool, user_id, PoolObjectSQL::USER, att, user_perms, user_name, true);

    if ( rc == -1 )
    {
        return Request::NO_EXISTS;
    }

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(AuthRequest::ADMIN, group_perms);   // MANAGE GROUP
    ar.add_auth(AuthRequest::ADMIN, user_perms);    // MANAGE USER

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;

        return Request::AUTHORIZATION;
    }

    auto group = gpool->get(oid);

    if ( group == nullptr )
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    return Request::SUCCESS;
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode GroupAPI::add_admin(int oid,
                                       int user_id,
                                       RequestAttributes& att)
{
    Request::ErrorCode ec = edit_admin(oid, user_id, att);

    if (ec != Request::SUCCESS)
    {
        return ec;
    }

    int rc;
    auto group = gpool->get(oid);

    rc = group->add_admin(user_id, att.resp_msg);

    if ( rc != 0 )
    {
        att.resp_msg = "Cannot edit group. " + att.resp_msg;

        return Request::INTERNAL;
    }

    gpool->update(group.get());

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode GroupAPI::del_admin(int oid,
                                       int user_id,
                                       RequestAttributes& att)
{
    Request::ErrorCode ec = edit_admin(oid, user_id, att);

    if (ec != Request::SUCCESS)
    {
        return ec;
    }

    int rc;
    auto group = gpool->get(oid);

    rc = group->del_admin(user_id, att.resp_msg);

    if ( rc != 0 )
    {
        att.resp_msg = "Cannot edit group. " + att.resp_msg;

        return Request::INTERNAL;
    }

    gpool->update(group.get());

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode GroupAllocateAPI::allocate(const std::string& gname,
                                             int                cluster_id,
                                             int&               oid,
                                             RequestAttributes& att)
{
    _gname = gname;

    return SharedAPI::allocate("", cluster_id, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode GroupAllocateAPI::pool_allocate(std::unique_ptr<Template> tmpl,
                                                   int&                       id,
                                                   RequestAttributes&         att)
{
    int rc = gpool->allocate(_gname, &id, att.resp_msg);

    if (rc == -1)
    {
        return Request::INTERNAL;
    }

    auto vdcpool = Nebula::instance().get_vdcpool();

    if (auto vdc = vdcpool->get(VdcPool::DEFAULT_ID))
    {
        rc = vdc->add_group(id, att.resp_msg);

        vdcpool->update(vdc.get());
    }

    return (rc < 0) ? Request::INTERNAL : Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int GroupAPI::drop(std::unique_ptr<PoolObjectSQL> object,
                   bool recursive,
                   RequestAttributes& att)
{
    AclManager * aclm = Nebula::instance().get_aclm();

    int oid = object->get_oid();
    int rc  = SharedAPI::drop(std::move(object), false, att);

    if ( rc != 0 )
    {
        return rc;
    }

    aclm->del_gid_rules(oid);

    std::string error;
    std::vector<int> vdcs;

    auto vdcpool = Nebula::instance().get_vdcpool();

    vdcpool->list(vdcs);

    for (int vdcId : vdcs)
    {
        if ( auto vdc = vdcpool->get(vdcId) )
        {
            if ( vdc->del_group(oid, error) == 0 )
            {
                vdcpool->update(vdc.get());
            }
        }
    }

    return rc;
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode GroupAPI::quota_info(std::string& xml,
                                        RequestAttributes& att)
{
    Nebula::instance().get_default_group_quota().to_xml(xml);

    return Request::SUCCESS;
}
