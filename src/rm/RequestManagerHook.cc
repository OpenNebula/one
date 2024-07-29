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

#include "RequestManagerHook.h"
#include "PoolObjectAuth.h"
#include "Nebula.h"
#include "HookLog.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HookRetry::request_execute(xmlrpc_c::paramList const& _paramList,
                                RequestAttributes& att)
{
    int    hk_id     = xmlrpc_c::value_int(_paramList.getInt(1));
    int    hk_exe_id = xmlrpc_c::value_int(_paramList.getInt(2));

    Nebula& nd = Nebula::instance();

    HookPool*    hkpool = nd.get_hkpool();
    HookLog*     hklog  = nd.get_hl();

    PoolObjectAuth hk_perms;

    int rc;

    /* ---------------------------------------------------------------------- */
    /* Get Hook                                                               */
    /* ---------------------------------------------------------------------- */
    auto hook = hkpool->get_ro(hk_id);

    if (hook == nullptr)
    {
        att.resp_id = hk_id;
        failure_response(NO_EXISTS, att);
        return;
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
        failure_response(AUTHORIZATION, att);

        return;
    }

    //How is the execution managed? what does the driver needs?
    rc = hklog->retry(hk_id, hk_exe_id, att.resp_msg);

    if (rc != 0)
    {
        failure_response(INTERNAL, att);
        return;
    }

    success_response(hk_id, att);

    return;
}