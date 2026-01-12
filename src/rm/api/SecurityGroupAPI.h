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

#ifndef SECURITY_GROUP_API_H
#define SECURITY_GROUP_API_H

#include "Request.h"
#include "SharedAPI.h"
#include "Nebula.h"
#include "SecurityGroupPool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SecurityGroupAPI: public SharedAPI
{
protected:
    SecurityGroupAPI(Request &r) : SharedAPI(r)
    {
        request.auth_object(PoolObjectSQL::SECGROUP);
        request.auth_op(AuthRequest::MANAGE);

        sgpool = Nebula::instance().get_secgrouppool();
        pool = sgpool;
    };

    virtual ~SecurityGroupAPI() = default;

    /* API calls */
    Request::ErrorCode commit(int oid,
                              bool recover,
                              RequestAttributes& att);

    /* Helpers */
    int drop(std::unique_ptr<PoolObjectSQL> obj,
             bool recursive,
             RequestAttributes& att) override;

    int exist(const std::string& name, int uid) override
    {
        return sgpool->exist(name, uid);
    }

    std::unique_ptr<Template> clone_template(PoolObjectSQL* obj) override
    {
        return static_cast<SecurityGroup*>(obj)->clone_template();
    }

    Request::ErrorCode pool_allocate(std::unique_ptr<Template> tmpl,
                                     int& id,
                                     RequestAttributes& att) override;

    SecurityGroupPool * sgpool;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SecurityGroupAllocateAPI : public SecurityGroupAPI
{
protected:
    SecurityGroupAllocateAPI(Request &r) : SecurityGroupAPI(r)
    {
        request.auth_op(AuthRequest::CREATE);
    }

    std::unique_ptr<Template> get_object_template() const override
    {
        return std::make_unique<Template>();
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class SecurityGroupInfoAPI : public SecurityGroupAPI
{
protected:
    SecurityGroupInfoAPI(Request &r)
        : SecurityGroupAPI(r)
    {
        request.auth_op(AuthRequest::USE_NO_LCK);
        request.leader_only(false);
        request.zone_disabled(true);
    }
};

#endif
