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

#ifndef HOOK_POOL_API_H
#define HOOK_POOL_API_H

#include "PoolSharedAPI.h"
#include "Nebula.h"
#include "HookPool.h"
#include "HookLog.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HookPoolAPI : public PoolSharedAPI
{
protected:

    HookPoolAPI(Request &r) : PoolSharedAPI(r)
    {
        request.auth_object(PoolObjectSQL::HOOK);

        pool = Nebula::instance().get_hkpool();
    }

    /* API calls */
    Request::ErrorCode log_info(int min_ts,
                                int max_ts,
                                int hook_id,
                                int rc_hook,
                                std::string& xml,
                                RequestAttributes& att);
    /* Helpers */
};

#endif
