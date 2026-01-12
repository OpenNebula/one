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

#ifndef TEMPLATE_API_H
#define TEMPLATE_API_H

#include "Request.h"
#include "SharedAPI.h"
#include "Nebula.h"
#include "VMTemplatePool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplateAPI : public SharedAPI
{
public:
    TemplateAPI(Request &r)
        : SharedAPI(r)
    {
        request.auth_object(PoolObjectSQL::TEMPLATE);
        request.auth_op(AuthRequest::MANAGE);

        tpool = Nebula::instance().get_tpool();
        pool = tpool;
    }

    Request::ErrorCode instantiate_helper(int oid,
                                          const std::string& name,
                                          bool on_hold,
                                          const std::string& str_uattrs,
                                          Template* extra_tmpl,
                                          int& vid,
                                          RequestAttributes& att);

protected:
    /* API calls */
    Request::ErrorCode instantiate(int oid,
                                   const std::string& name,
                                   bool hold,
                                   std::string extra_tmpl,
                                   bool persistent,
                                   int& vid,
                                   RequestAttributes& att);

    Request::ErrorCode clone(int source_id,
                             const std::string& name,
                             bool recursive,
                             const std::string& s_uattr,
                             bool persistent,
                             int &new_id,
                             RequestAttributes& att);

    Request::ErrorCode chmod(int oid,
                             int owner_u, int owner_m, int owner_a,
                             int group_u, int group_m, int group_a,
                             int other_u, int other_m, int other_a,
                             bool recursive,
                             RequestAttributes& att);

    /* Helpers */
    Request::ErrorCode pool_allocate(std::unique_ptr<Template> tmpl,
                                     int& id,
                                     RequestAttributes& att) override;

    std::unique_ptr<Template> clone_template(PoolObjectSQL* obj) override
    {
        return static_cast<VMTemplate*>(obj)->clone_template();
    }

    /**
     * Parse & merge user attributes (check if the request user is not oneadmin)
     *  @param tmpl to merge the attributes to
     *  @param str_uattrs Template supplied by user to merge with the original
     *  contents. Can be empty
     *  @param att the specific request attributes
     */
    Request::ErrorCode merge(Template * tmpl,
                             const std::string &str_uattrs,
                             RequestAttributes& att) override;

    int drop(std::unique_ptr<PoolObjectSQL> obj,
             bool recursive,
             RequestAttributes& att) override;

    VMTemplatePool* tpool;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class TemplateAllocateAPI : public TemplateAPI
{
protected:
    TemplateAllocateAPI(Request &r)
        : TemplateAPI(r)
    {
        request.auth_op(AuthRequest::CREATE);
    }

    std::unique_ptr<Template> get_object_template() const override
    {
        return std::make_unique<VirtualMachineTemplate>();
    };

    Request::ErrorCode allocate_authorization(Template *obj_template,
                                              RequestAttributes&  att,
                                              PoolObjectAuth *cluster_perms) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class TemplateInfoAPI : public TemplateAPI
{
protected:
    TemplateInfoAPI(Request &r)
        : TemplateAPI(r)
    {
        request.auth_op(AuthRequest::USE_NO_LCK);
        request.leader_only(false);
        request.zone_disabled(true);
    }

    Request::ErrorCode info(int oid,
                            bool extended,
                            bool decrypt,
                            std::string& xml,
                            RequestAttributes& att);
};

#endif
