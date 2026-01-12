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

#include "RMHookAPI.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode RMHookAllocateAPI::pool_allocate(std::unique_ptr<Template> tmpl,
                                                  int&                       id,
                                                  RequestAttributes&         att)
{
    std::string hk_type;

    tmpl->get("TYPE", hk_type);

    if (Hook::str_to_hook_type(hk_type) == Hook::UNDEFINED)
    {
        ostringstream oss;

        oss << "Invalid Hook type: " << hk_type;
        att.resp_msg = oss.str();

        return Request::INTERNAL;
    }

    id = hkpool->allocate(move(tmpl), att.resp_msg);

    return (id < 0) ? Request::INTERNAL : Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode RMHookAPI::retry(int oid, int hk_exe_id, RequestAttributes& att)
{
    Nebula& nd = Nebula::instance();

    HookLog*     hklog  = nd.get_hl();

    PoolObjectAuth hk_perms;

    int rc;

    /* ---------------------------------------------------------------------- */
    /* Get Hook                                                               */
    /* ---------------------------------------------------------------------- */
    auto hook = hkpool->get_ro(oid);

    if (hook == nullptr)
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    /* ---------------------------------------------------------------------- */
    /* Check permissions                                                      */
    /* ---------------------------------------------------------------------- */
    AuthRequest ar(att.uid, att.group_ids);

    hook->get_permissions(hk_perms);
    ar.add_auth(AuthRequest::MANAGE, hk_perms);

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;

        return Request::AUTHORIZATION;
    }

    //How is the execution managed? what does the driver needs?
    rc = hklog->retry(oid, hk_exe_id, att.resp_msg);

    return (rc != 0) ? Request::INTERNAL : Request::SUCCESS;
}
