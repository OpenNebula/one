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

#ifndef VNTEMPLATE_API_H
#define VNTEMPLATE_API_H

#include "Request.h"
#include "SharedAPI.h"
#include "Nebula.h"
#include "VNTemplatePool.h"
#include "ClusterPool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VNTemplateAPI : public SharedAPI
{
protected:
    VNTemplateAPI(Request &r)
        : SharedAPI(r)
    {
        request.auth_object(PoolObjectSQL::VNTEMPLATE);
        request.auth_op(AuthRequest::MANAGE);

        vntpool = Nebula::instance().get_vntpool();
        pool = vntpool;
    }

    /* API calls */
    Request::ErrorCode instantiate(int oid,
                                   const std::string& name,
                                   const std::string& str_tmpl,
                                   int& net_id,
                                   RequestAttributes& att);

    /* Helpers */
    std::unique_ptr<Template> clone_template(PoolObjectSQL* obj) override
    {
        return static_cast<VNTemplate*>(obj)->clone_template();
    }

    Request::ErrorCode pool_allocate(
            std::unique_ptr<Template> tmpl,
            int& id,
            RequestAttributes& att) override;

    /**
     * Parse & merge user attributes (check if the request user is not oneadmin)
     *  @param tmpl to merge the attributes to
     *  @param s_uattr Template supplied by user to merge with the original
     *  contents. Can be empty
     *  @param att the specific request attributes
     */
    Request::ErrorCode merge(Template * tmpl,
                             const std::string &str_uattr,
                             RequestAttributes& att) override;

    VNTemplatePool* vntpool;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VNTemplateAllocateAPI : public VNTemplateAPI
{
protected:
    VNTemplateAllocateAPI(Request &r)
        : VNTemplateAPI(r)
    {
        request.auth_op(AuthRequest::CREATE);

        clpool = Nebula::instance().get_clpool();
    }

    std::unique_ptr<Template> get_object_template() const override
    {
        return std::make_unique<VirtualNetworkTemplate>();
    }

private:
    ClusterPool* clpool;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VNTemplateInfoAPI : public VNTemplateAPI
{
protected:
    VNTemplateInfoAPI(Request &r)
        : VNTemplateAPI(r)
    {
        request.auth_op(AuthRequest::USE_NO_LCK);
        request.leader_only(false);
        request.zone_disabled(true);
    }
};

#endif
