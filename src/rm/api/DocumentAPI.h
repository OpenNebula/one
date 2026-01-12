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

#ifndef DOCUMENT_API_H
#define DOCUMENT_API_H

#include "Request.h"
#include "SharedAPI.h"
#include "Nebula.h"
#include "DocumentPool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentAPI: public SharedAPI
{
protected:
    DocumentAPI(Request &r) : SharedAPI(r)
    {
        request.auth_object(PoolObjectSQL::DOCUMENT);
        request.auth_op(AuthRequest::MANAGE);

        docpool = Nebula::instance().get_docpool();
        pool = docpool;
    };

    virtual ~DocumentAPI() = default;

    /* API calls */

    /* Helpers */
    int exist(const std::string& name, int uid) override
    {
        return -1;
    }

    Request::ErrorCode check_name_unique(int oid, int noid, RequestAttributes& att) override
    {
        return Request::SUCCESS;
    }

    std::unique_ptr<Template> clone_template(PoolObjectSQL* obj) override
    {
        return static_cast<Document*>(obj)->clone_template();
    }

    Request::ErrorCode pool_allocate(int sid,
                                     std::unique_ptr<Template> tmpl,
                                     int& id,
                                     RequestAttributes& att) override;

    DocumentPool * docpool;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentAllocateAPI : public DocumentAPI
{
protected:
    DocumentAllocateAPI(Request &r) : DocumentAPI(r)
    {
        request.auth_op(AuthRequest::CREATE);
    }

    Request::ErrorCode allocate(const std::string& str_tmpl,
                                int                type,
                                int                cluster_id,
                                int&               oid,
                                RequestAttributes& att);


    std::unique_ptr<Template> get_object_template() const override
    {
        return std::make_unique<DocumentTemplate>();
    }

    Request::ErrorCode pool_allocate(std::unique_ptr<Template> tmpl,
                                     int&                       id,
                                     RequestAttributes&         att) override;
private:
    int _type  = -1;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DocumentInfoAPI : public DocumentAPI
{
protected:
    DocumentInfoAPI(Request &r)
        : DocumentAPI(r)
    {
        request.auth_op(AuthRequest::USE_NO_LCK);
        request.leader_only(false);
        request.zone_disabled(true);
    }
};

#endif
