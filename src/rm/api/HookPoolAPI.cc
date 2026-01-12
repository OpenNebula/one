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

#include "HookPoolAPI.h"
#include "NebulaUtil.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode HookPoolAPI::log_info(int min_ts,
                                         int max_ts,
                                         int hook_id,
                                         int rc_hook,
                                         std::string& xml,
                                         RequestAttributes& att)
{
    Nebula& nd = Nebula::instance();

    HookLog*     hklog  = nd.get_hl();

    PoolObjectAuth hk_perms;

    ostringstream oss;
    bool empty = true;

    int rc;

    /* ---------------------------------------------------------------------- */
    /* Check permissions                                                      */
    /* ---------------------------------------------------------------------- */

    if (!att.is_oneadmin_group())
    {
        att.resp_id  = -1;

        return Request::AUTHORIZATION;
    }

    /* ---------------------------------------------------------------------- */
    /* Build where clause                                                     */
    /* ---------------------------------------------------------------------- */

    if (min_ts >= 0)
    {
        if (!empty)
        {
            oss << " AND ";
        }

        oss << "timestamp > " << min_ts;
        empty = false;
    }
    if (max_ts >= 0)
    {
        if (!empty)
        {
            oss << " AND ";
        }

        oss << "timestamp < " << max_ts;
        empty = false;
    }
    if (hook_id >= 0)
    {
        if (!empty)
        {
            oss << " AND ";
        }

        oss << "hkid = " << hook_id;
        empty = false;
    }
    if (rc_hook == -1 || rc_hook == 1)
    {
        if (!empty)
        {
            oss << " AND ";
        }

        if (rc_hook == -1)
        {
            oss << "rc <> 0";
        }
        else
        {
            oss << "rc = 0";
        }
    }



    rc = hklog->dump_log(oss.str(), xml);

    return (rc != 0) ? Request::INTERNAL : Request::SUCCESS;
}
