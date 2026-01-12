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

#ifndef RM_HOOK_API_H
#define RM_HOOK_API_H

#include "Request.h"
#include "SharedAPI.h"
#include "Nebula.h"
#include "HookPool.h"
#include "HookLog.h"
#include "PoolObjectAuth.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RMHookAPI : public SharedAPI
{
protected:
    RMHookAPI(Request &r) : SharedAPI(r)
    {
        Nebula& nd = Nebula::instance();
        hkpool     = nd.get_hkpool();
        pool       = hkpool;

        request.auth_object(PoolObjectSQL::HOOK);
        request.auth_op(AuthRequest::MANAGE);
    }

    virtual ~RMHookAPI() = default;

    /* API calls */
    Request::ErrorCode retry(int oid,
                             int hk_exe_id,
                             RequestAttributes& att);

    /* Helpers */
    void to_xml(RequestAttributes& att, PoolObjectSQL * object,
                std::string& str) override
    {
        (static_cast<Hook *>(object))->to_xml_extended(str);
    };

    int exist(const std::string& name, int uid) override
    {
        return hkpool->exist(name, uid);
    }

    HookPool * hkpool;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RMHookAllocateAPI : public RMHookAPI
{
protected:
    RMHookAllocateAPI(Request &r) : RMHookAPI(r)
    {
        request.auth_op(AuthRequest::CREATE);
    }

    std::unique_ptr<Template> get_object_template() const override
    {
        return std::make_unique<Template>();
    }

    Request::ErrorCode pool_allocate(std::unique_ptr<Template> tmpl,
                                     int&                       id,
                                     RequestAttributes&         att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RMHookInfoAPI : public RMHookAPI
{
protected:
    RMHookInfoAPI(Request &r) : RMHookAPI(r)
    {
        request.auth_op(AuthRequest::USE_NO_LCK);
        request.leader_only(false);
        request.zone_disabled(true);
    }
};

#endif
