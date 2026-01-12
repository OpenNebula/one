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

#ifndef VIRTUAL_ROUTER_GRPC_H
#define VIRTUAL_ROUTER_GRPC_H

#include "RequestGRPC.h"
#include "VirtualRouterAPI.h"
#include "VirtualRouterPoolAPI.h"

#include "vrouter.grpc.pb.h"

#include <grpcpp/grpcpp.h>

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualRouterService final : public one::vrouter::VirtualRouterService::Service
{
    grpc::Status Allocate(grpc::ServerContext* context,
                          const one::vrouter::AllocateRequest* request,
                          one::ResponseID* response) override;

    grpc::Status Delete(grpc::ServerContext* context,
                        const one::vrouter::DeleteRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Update(grpc::ServerContext* context,
                        const one::vrouter::UpdateRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Rename(grpc::ServerContext* context,
                        const one::vrouter::RenameRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Instantiate(grpc::ServerContext* context,
                             const one::vrouter::InstantiateRequest* request,
                             one::ResponseID* response) override;

    grpc::Status AttachNic(grpc::ServerContext* context,
                           const one::vrouter::AttachNicRequest* request,
                           one::ResponseID* response) override;

    grpc::Status DetachNic(grpc::ServerContext* context,
                           const one::vrouter::DetachNicRequest* request,
                           one::ResponseID* response) override;

    grpc::Status Lock(grpc::ServerContext* context,
                      const one::vrouter::LockRequest* request,
                      one::ResponseID* response) override;

    grpc::Status Unlock(grpc::ServerContext* context,
                        const one::vrouter::UnlockRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Chown(grpc::ServerContext* context,
                       const one::vrouter::ChownRequest* request,
                       one::ResponseID* response) override;

    grpc::Status Chmod(grpc::ServerContext* context,
                       const one::vrouter::ChmodRequest* request,
                       one::ResponseID* response) override;

    grpc::Status Info(grpc::ServerContext* context,
                      const one::vrouter::InfoRequest* request,
                      one::ResponseXML* response) override;

    grpc::Status PoolInfo(grpc::ServerContext* context,
                          const one::vrouter::PoolInfoRequest* request,
                          one::ResponseXML* response) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualRouterAllocateGRPC : public RequestGRPC, public VirtualRouterAllocateAPI
{
public:
    VirtualRouterAllocateGRPC() :
        RequestGRPC("one.vrouter.allocate", "/one.vrouter.VirtualRouterService/Allocate"),
        VirtualRouterAllocateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualRouterDeleteGRPC : public RequestGRPC, public VirtualRouterAPI
{
public:
    VirtualRouterDeleteGRPC() :
        RequestGRPC("one.vrouter.delete", "/one.vrouter.VirtualRouterService/Delete"),
        VirtualRouterAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualRouterUpdateGRPC : public RequestGRPC, public VirtualRouterAPI
{
public:
    VirtualRouterUpdateGRPC() :
        RequestGRPC("one.vrouter.update", "/one.vrouter.VirtualRouterService/Update"),
        VirtualRouterAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualRouterRenameGRPC : public RequestGRPC, public VirtualRouterAPI
{
public:
    VirtualRouterRenameGRPC() :
        RequestGRPC("one.vrouter.rename", "/one.vrouter.VirtualRouterService/Rename"),
        VirtualRouterAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualRouterInstantiateGRPC : public RequestGRPC, public VirtualRouterAPI
{
public:
    VirtualRouterInstantiateGRPC() :
        RequestGRPC("one.vrouter.instantiate", "/one.vrouter.VirtualRouterService/Instantiate"),
        VirtualRouterAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualRouterAttachNicGRPC : public RequestGRPC, public VirtualRouterAPI
{
public:
    VirtualRouterAttachNicGRPC() :
        RequestGRPC("one.vrouter.attachnic", "/one.vrouter.VirtualRouterService/AttachNic"),
        VirtualRouterAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualRouterDetachNicGRPC : public RequestGRPC, public VirtualRouterAPI
{
public:
    VirtualRouterDetachNicGRPC() :
        RequestGRPC("one.vrouter.detachnic", "/one.vrouter.VirtualRouterService/DetachNic"),
        VirtualRouterAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualRouterLockGRPC : public RequestGRPC, public VirtualRouterAPI
{
public:
    VirtualRouterLockGRPC() :
        RequestGRPC("one.vrouter.lock", "/one.vrouter.VirtualRouterService/Lock"),
        VirtualRouterAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualRouterUnlockGRPC : public RequestGRPC, public VirtualRouterAPI
{
public:
    VirtualRouterUnlockGRPC() :
        RequestGRPC("one.vrouter.unlock", "/one.vrouter.VirtualRouterService/Unlock"),
        VirtualRouterAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualRouterChownGRPC : public RequestGRPC, public VirtualRouterAPI
{
public:
    VirtualRouterChownGRPC() :
        RequestGRPC("one.vrouter.chown", "/one.vrouter.VirtualRouterService/Chown"),
        VirtualRouterAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualRouterChmodGRPC : public RequestGRPC, public VirtualRouterAPI
{
public:
    VirtualRouterChmodGRPC() :
        RequestGRPC("one.vrouter.chmod", "/one.vrouter.VirtualRouterService/Chmod"),
        VirtualRouterAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualRouterInfoGRPC : public RequestGRPC, public VirtualRouterInfoAPI
{
public:
    VirtualRouterInfoGRPC() :
        RequestGRPC("one.vrouter.info", "/one.vrouter.VirtualRouterService/Info"),
        VirtualRouterInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VirtualRouterPoolInfoGRPC : public RequestGRPC, public VirtualRouterPoolAPI
{
public:
    VirtualRouterPoolInfoGRPC() :
        RequestGRPC("one.vrouterpool.info", "/one.vrouter.VirtualRouterService/PoolInfo"),
        VirtualRouterPoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

#endif
