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

#ifndef VM_GROUP_API_H
#define VM_GROUP_API_H

#include "Request.h"
#include "SharedAPI.h"
#include "Nebula.h"
#include "VMGroupPool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VMGroupAPI: public SharedAPI
{
protected:
    VMGroupAPI(Request &r) : SharedAPI(r)
    {
        request.auth_object(PoolObjectSQL::VMGROUP);
        request.auth_op(AuthRequest::MANAGE);

        vmgpool = Nebula::instance().get_vmgrouppool();
        pool = vmgpool;
    };

    virtual ~VMGroupAPI() = default;

    /* API calls */
    Request::ErrorCode add_role(int oid,
                                const std::string& tmpl_str,
                                RequestAttributes& att);

    Request::ErrorCode del_role(int oid,
                                int role_id,
                                RequestAttributes& att);

    Request::ErrorCode update_role(int oid,
                                   int role_id,
                                   const std::string& tmpl_str,
                                   RequestAttributes& att);

    /* Helpers */

    VMGroupPool * vmgpool;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VMGroupAllocateAPI : public VMGroupAPI
{
protected:
    VMGroupAllocateAPI(Request &r) : VMGroupAPI(r)
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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VMGroupInfoAPI : public VMGroupAPI
{
protected:
    VMGroupInfoAPI(Request &r)
        : VMGroupAPI(r)
    {
        request.auth_op(AuthRequest::USE_NO_LCK);
        request.leader_only(false);
        request.zone_disabled(true);
    }
};

#endif
