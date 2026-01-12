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

#ifndef VNTEMPLATE_GRPC_H
#define VNTEMPLATE_GRPC_H

#include "RequestGRPC.h"
#include "VNTemplateAPI.h"
#include "VNTemplatePoolAPI.h"

#include "vntemplate.grpc.pb.h"

#include <grpcpp/grpcpp.h>

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VNTemplateService final : public one::vntemplate::VNTemplateService::Service
{
    grpc::Status Allocate(grpc::ServerContext* context,
                          const one::vntemplate::AllocateRequest* request,
                          one::ResponseID* response) override;

    grpc::Status Delete(grpc::ServerContext* context,
                        const one::vntemplate::DeleteRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Info(grpc::ServerContext* context,
                      const one::vntemplate::InfoRequest* request,
                      one::ResponseXML* response) override;

    grpc::Status Update(grpc::ServerContext* context,
                        const one::vntemplate::UpdateRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Rename(grpc::ServerContext* context,
                        const one::vntemplate::RenameRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Chmod(grpc::ServerContext* context,
                       const one::vntemplate::ChmodRequest* request,
                       one::ResponseID* response) override;

    grpc::Status Chown(grpc::ServerContext* context,
                       const one::vntemplate::ChownRequest* request,
                       one::ResponseID* response) override;

    grpc::Status Lock(grpc::ServerContext* context,
                      const one::vntemplate::LockRequest* request,
                      one::ResponseID* response) override;

    grpc::Status Unlock(grpc::ServerContext* context,
                        const one::vntemplate::UnlockRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Clone(grpc::ServerContext* context,
                       const one::vntemplate::CloneRequest* request,
                       one::ResponseID* response) override;

    grpc::Status Instantiate(grpc::ServerContext* context,
                             const one::vntemplate::InstantiateRequest* request,
                             one::ResponseID* response) override;

    grpc::Status PoolInfo(grpc::ServerContext* context,
                          const one::vntemplate::PoolInfoRequest* request,
                          one::ResponseXML* response) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VNTemplateAllocateGRPC : public RequestGRPC, public VNTemplateAllocateAPI
{
public:
    VNTemplateAllocateGRPC() :
        RequestGRPC("one.vntemplate.allocate", "/one.vntemplate.VNTemplateService/Allocate"),
        VNTemplateAllocateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VNTemplateDeleteGRPC : public RequestGRPC, public VNTemplateAPI
{
public:
    VNTemplateDeleteGRPC() :
        RequestGRPC("one.vntemplate.delete", "/one.vntemplate.VNTemplateService/Delete"),
        VNTemplateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VNTemplateInfoGRPC : public RequestGRPC, public VNTemplateInfoAPI
{
public:
    VNTemplateInfoGRPC() :
        RequestGRPC("one.vntemplate.info", "/one.vntemplate.VNTemplateService/Info"),
        VNTemplateInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VNTemplateUpdateGRPC : public RequestGRPC, public VNTemplateAPI
{
public:
    VNTemplateUpdateGRPC() :
        RequestGRPC("one.vntemplate.update", "/one.vntemplate.VNTemplateService/Update"),
        VNTemplateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VNTemplateRenameGRPC : public RequestGRPC, public VNTemplateAPI
{
public:
    VNTemplateRenameGRPC() :
        RequestGRPC("one.vntemplate.rename", "/one.vntemplate.VNTemplateService/Rename"),
        VNTemplateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VNTemplateChmodGRPC : public RequestGRPC, public VNTemplateAPI
{
public:
    VNTemplateChmodGRPC() :
        RequestGRPC("one.vntemplate.chmod", "/one.vntemplate.VNTemplateService/Chmod"),
        VNTemplateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VNTemplateChownGRPC : public RequestGRPC, public VNTemplateAPI
{
public:
    VNTemplateChownGRPC() :
        RequestGRPC("one.vntemplate.chown", "/one.vntemplate.VNTemplateService/Chown"),
        VNTemplateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VNTemplateLockGRPC : public RequestGRPC, public VNTemplateAPI
{
public:
    VNTemplateLockGRPC() :
        RequestGRPC("one.vntemplate.lock", "/one.vntemplate.VNTemplateService/Lock"),
        VNTemplateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VNTemplateUnlockGRPC : public RequestGRPC, public VNTemplateAPI
{
public:
    VNTemplateUnlockGRPC() :
        RequestGRPC("one.vntemplate.unlock", "/one.vntemplate.VNTemplateService/Unlock"),
        VNTemplateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VNTemplateCloneGRPC : public RequestGRPC, public VNTemplateAPI
{
public:
    VNTemplateCloneGRPC() :
        RequestGRPC("one.vntemplate.clone", "/one.vntemplate.VNTemplateService/Clone"),
        VNTemplateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VNTemplateInstantiateGRPC : public RequestGRPC, public VNTemplateAPI
{
public:
    VNTemplateInstantiateGRPC() :
        RequestGRPC("one.vntemplate.instantiate", "/one.vntemplate.VNTemplateService/Instantiate"),
        VNTemplateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VNTemplatePoolInfoGRPC : public RequestGRPC, public VNTemplatePoolAPI
{
public:
    VNTemplatePoolInfoGRPC() :
        RequestGRPC("one.vntemplatepool.info", "/one.vntemplate.VNTemplateService/PoolInfo"),
        VNTemplatePoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

#endif
