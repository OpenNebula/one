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

#ifndef TEMPLATE_GRPC_H
#define TEMPLATE_GRPC_H

#include "RequestGRPC.h"
#include "TemplateAPI.h"
#include "TemplatePoolAPI.h"

#include "template.grpc.pb.h"

#include <grpcpp/grpcpp.h>

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplateService final : public one::tmpl::TemplateService::Service
{
    grpc::Status Allocate(grpc::ServerContext* context,
                          const one::tmpl::AllocateRequest* request,
                          one::ResponseID* response) override;

    grpc::Status Delete(grpc::ServerContext* context,
                        const one::tmpl::DeleteRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Info(grpc::ServerContext* context,
                      const one::tmpl::InfoRequest* request,
                      one::ResponseXML* response) override;

    grpc::Status Update(grpc::ServerContext* context,
                        const one::tmpl::UpdateRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Rename(grpc::ServerContext* context,
                        const one::tmpl::RenameRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Clone(grpc::ServerContext* context,
                       const one::tmpl::CloneRequest* request,
                       one::ResponseID* response) override;

    grpc::Status Instantiate(grpc::ServerContext* context,
                             const one::tmpl::InstantiateRequest* request,
                             one::ResponseID* response) override;

    grpc::Status Chmod(grpc::ServerContext* context,
                       const one::tmpl::ChmodRequest* request,
                       one::ResponseID* response) override;

    grpc::Status Chown(grpc::ServerContext* context,
                       const one::tmpl::ChownRequest* request,
                       one::ResponseID* response) override;

    grpc::Status Lock(grpc::ServerContext* context,
                      const one::tmpl::LockRequest* request,
                      one::ResponseID* response) override;

    grpc::Status Unlock(grpc::ServerContext* context,
                        const one::tmpl::UnlockRequest* request,
                        one::ResponseID* response) override;

    grpc::Status PoolInfo(grpc::ServerContext* context,
                          const one::tmpl::PoolInfoRequest* request,
                          one::ResponseXML* response) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplateAllocateGRPC : public RequestGRPC, public TemplateAllocateAPI
{
public:
    TemplateAllocateGRPC() :
        RequestGRPC("one.template.allocate", "/one.tmpl.TemplateService/Allocate"),
        TemplateAllocateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class TemplateDeleteGRPC : public RequestGRPC, public TemplateAPI
{
public:
    TemplateDeleteGRPC() :
        RequestGRPC("one.template.delete", "/one.tmpl.TemplateService/Delete"),
        TemplateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class TemplateInfoGRPC : public RequestGRPC, public TemplateInfoAPI
{
public:
    TemplateInfoGRPC() :
        RequestGRPC("one.template.info", "/one.tmpl.TemplateService/Info"),
        TemplateInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class TemplateUpdateGRPC : public RequestGRPC, public TemplateAPI
{
public:
    TemplateUpdateGRPC() :
        RequestGRPC("one.template.update", "/one.tmpl.TemplateService/Update"),
        TemplateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class TemplateRenameGRPC : public RequestGRPC, public TemplateAPI
{
public:
    TemplateRenameGRPC() :
        RequestGRPC("one.template.rename", "/one.tmpl.TemplateService/Rename"),
        TemplateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class TemplateCloneGRPC : public RequestGRPC, public TemplateAPI
{
public:
    TemplateCloneGRPC() :
        RequestGRPC("one.template.clone", "/one.tmpl.TemplateService/Clone"),
        TemplateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class TemplateInstantiateGRPC : public RequestGRPC, public TemplateAPI
{
public:
    TemplateInstantiateGRPC() :
        RequestGRPC("one.template.instantiate", "/one.tmpl.TemplateService/Instantiate"),
        TemplateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class TemplateChmodGRPC : public RequestGRPC, public TemplateAPI
{
public:
    TemplateChmodGRPC() :
        RequestGRPC("one.template.chmod", "/one.tmpl.TemplateService/Chmod"),
        TemplateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class TemplateChownGRPC : public RequestGRPC, public TemplateAPI
{
public:
    TemplateChownGRPC() :
        RequestGRPC("one.template.chown", "/one.tmpl.TemplateService/Chown"),
        TemplateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class TemplateLockGRPC : public RequestGRPC, public TemplateAPI
{
public:
    TemplateLockGRPC() :
        RequestGRPC("one.template.lock", "/one.tmpl.TemplateService/Lock"),
        TemplateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class TemplateUnlockGRPC : public RequestGRPC, public TemplateAPI
{
public:
    TemplateUnlockGRPC() :
        RequestGRPC("one.template.unlock", "/one.tmpl.TemplateService/Unlock"),
        TemplateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class TemplatePoolInfoGRPC : public RequestGRPC, public TemplatePoolAPI
{
public:
    TemplatePoolInfoGRPC() :
        RequestGRPC("one.templatepool.info", "/one.tmpl.TemplateService/PoolInfo"),
        TemplatePoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

#endif
