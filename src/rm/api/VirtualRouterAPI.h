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

#ifndef VIRTUAL_ROUTER_API_H
#define VIRTUAL_ROUTER_API_H

#include "Request.h"
#include "SharedAPI.h"
#include "Nebula.h"
#include "VirtualRouterPool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualRouterAPI: public SharedAPI
{
protected:
    VirtualRouterAPI(Request &r) : SharedAPI(r)
    {
        request.auth_object(PoolObjectSQL::VROUTER);
        request.auth_op(AuthRequest::MANAGE);

        vrpool = Nebula::instance().get_vrouterpool();
        pool = vrpool;
    }

    virtual ~VirtualRouterAPI() = default;

    /* API calls */
    Request::ErrorCode instantiate(int oid,
                                   int n_vms,
                                   int template_id,
                                   std::string& name,
                                   bool hold,
                                   const std::string& str_uattrs,
                                   RequestAttributes& att);

    Request::ErrorCode attach_nic(int oid,
                                  std::string& obj_tmpl,
                                  RequestAttributes& att);

    Request::ErrorCode detach_nic(int oid,
                                  int nic_id,
                                  RequestAttributes& att);

    Request::ErrorCode chmod(int oid,
                             int owner_u, int owner_m, int owner_a,
                             int group_u, int group_m, int group_a,
                             int other_u, int other_m, int other_a,
                             RequestAttributes& att) override;

    /* Helpers */
    int drop(std::unique_ptr<PoolObjectSQL> obj,
             bool recursive,
             RequestAttributes& att) override;

    int exist(const std::string& name, int uid) override
    {
        return -1;
    }

    VirtualRouterPool * vrpool;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualRouterAllocateAPI : public VirtualRouterAPI
{
protected:
    VirtualRouterAllocateAPI(Request &r) : VirtualRouterAPI(r)
    {
        request.auth_op(AuthRequest::CREATE);
    }

    std::unique_ptr<Template> get_object_template() const override
    {
        return std::make_unique<Template>();
    }

    Request::ErrorCode allocate_authorization(Template *obj_template,
                                              RequestAttributes&  att,
                                              PoolObjectAuth *cluster_perms) override;

    Request::ErrorCode pool_allocate(std::unique_ptr<Template> tmpl,
                                     int&                       id,
                                     RequestAttributes&         att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VirtualRouterInfoAPI : public VirtualRouterAPI
{
protected:
    VirtualRouterInfoAPI(Request &r)
        : VirtualRouterAPI(r)
    {
        request.auth_op(AuthRequest::USE_NO_LCK);
        request.leader_only(false);
        request.zone_disabled(true);
    }
};

#endif
