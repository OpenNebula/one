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

#ifndef VIRTUALNETWORK_GRPC_H
#define VIRTUALNETWORK_GRPC_H

#include "RequestGRPC.h"
#include "VirtualNetworkAPI.h"
#include "VirtualNetworkPoolAPI.h"

#include "vn.grpc.pb.h"

#include <grpcpp/grpcpp.h>

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkService final : public one::vn::VirtualNetworkService::Service
{
    grpc::Status Allocate(grpc::ServerContext* context,
                          const one::vn::AllocateRequest* request,
                          one::ResponseID* response) override;

    grpc::Status Delete(grpc::ServerContext* context,
                        const one::vn::DeleteRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Info(grpc::ServerContext* context,
                      const one::vn::InfoRequest* request,
                      one::ResponseXML* response) override;

    grpc::Status Update(grpc::ServerContext* context,
                        const one::vn::UpdateRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Rename(grpc::ServerContext* context,
                        const one::vn::RenameRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Chmod(grpc::ServerContext* context,
                       const one::vn::ChmodRequest* request,
                       one::ResponseID* response) override;

    grpc::Status Chown(grpc::ServerContext* context,
                       const one::vn::ChownRequest* request,
                       one::ResponseID* response) override;

    grpc::Status Lock(grpc::ServerContext* context,
                      const one::vn::LockRequest* request,
                      one::ResponseID* response) override;

    grpc::Status Unlock(grpc::ServerContext* context,
                        const one::vn::UnlockRequest* request,
                        one::ResponseID* response) override;

    grpc::Status AddAR(grpc::ServerContext* context,
                       const one::vn::AddARRequest* request,
                       one::ResponseID* response) override;

    grpc::Status RmAR(grpc::ServerContext* context,
                      const one::vn::RmARRequest* request,
                      one::ResponseID* response) override;

    grpc::Status UpdateAR(grpc::ServerContext* context,
                          const one::vn::UpdateARRequest* request,
                          one::ResponseID* response) override;

    grpc::Status Reserve(grpc::ServerContext* context,
                         const one::vn::ReserveRequest* request,
                         one::ResponseID* response) override;

    grpc::Status FreeAR(grpc::ServerContext* context,
                        const one::vn::FreeARRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Hold(grpc::ServerContext* context,
                      const one::vn::HoldRequest* request,
                      one::ResponseID* response) override;

    grpc::Status Release(grpc::ServerContext* context,
                         const one::vn::ReleaseRequest* request,
                         one::ResponseID* response) override;

    grpc::Status Recover(grpc::ServerContext* context,
                         const one::vn::RecoverRequest* request,
                         one::ResponseID* response) override;

    grpc::Status PoolInfo(grpc::ServerContext* context,
                          const one::vn::PoolInfoRequest* request,
                          one::ResponseXML* response) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkAllocateGRPC : public RequestGRPC, public VirtualNetworkAllocateAPI
{
public:
    VirtualNetworkAllocateGRPC() :
        RequestGRPC("one.vn.allocate", "/one.vn.VirtualNetworkService/Allocate"),
        VirtualNetworkAllocateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualNetworkDeleteGRPC : public RequestGRPC, public VirtualNetworkAPI
{
public:
    VirtualNetworkDeleteGRPC() :
        RequestGRPC("one.vn.delete", "/one.vn.VirtualNetworkService/Delete"),
        VirtualNetworkAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualNetworkInfoGRPC : public RequestGRPC, public VirtualNetworkInfoAPI
{
public:
    VirtualNetworkInfoGRPC() :
        RequestGRPC("one.vn.info", "/one.vn.VirtualNetworkService/Info"),
        VirtualNetworkInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualNetworkUpdateGRPC : public RequestGRPC, public VirtualNetworkAPI
{
public:
    VirtualNetworkUpdateGRPC() :
        RequestGRPC("one.vn.update", "/one.vn.VirtualNetworkService/Update"),
        VirtualNetworkAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualNetworkRenameGRPC : public RequestGRPC, public VirtualNetworkAPI
{
public:
    VirtualNetworkRenameGRPC() :
        RequestGRPC("one.vn.rename", "/one.vn.VirtualNetworkService/Rename"),
        VirtualNetworkAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualNetworkChmodGRPC : public RequestGRPC, public VirtualNetworkAPI
{
public:
    VirtualNetworkChmodGRPC() :
        RequestGRPC("one.vn.chmod", "/one.vn.VirtualNetworkService/Chmod"),
        VirtualNetworkAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualNetworkChownGRPC : public RequestGRPC, public VirtualNetworkAPI
{
public:
    VirtualNetworkChownGRPC() :
        RequestGRPC("one.vn.chown", "/one.vn.VirtualNetworkService/Chown"),
        VirtualNetworkAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualNetworkLockGRPC : public RequestGRPC, public VirtualNetworkAPI
{
public:
    VirtualNetworkLockGRPC() :
        RequestGRPC("one.vn.lock", "/one.vn.VirtualNetworkService/Lock"),
        VirtualNetworkAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualNetworkUnlockGRPC : public RequestGRPC, public VirtualNetworkAPI
{
public:
    VirtualNetworkUnlockGRPC() :
        RequestGRPC("one.vn.unlock", "/one.vn.VirtualNetworkService/Unlock"),
        VirtualNetworkAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualNetworkAddARGRPC : public RequestGRPC, public VirtualNetworkAPI
{
public:
    VirtualNetworkAddARGRPC() :
        RequestGRPC("one.vn.add_ar", "/one.vn.VirtualNetworkService/AddAR"),
        VirtualNetworkAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualNetworkRmARGRPC : public RequestGRPC, public VirtualNetworkRmARAPI
{
public:
    VirtualNetworkRmARGRPC() :
        RequestGRPC("one.vn.rm_ar", "/one.vn.VirtualNetworkService/RmAR"),
        VirtualNetworkRmARAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualNetworkUpdateARGRPC : public RequestGRPC, public VirtualNetworkAPI
{
public:
    VirtualNetworkUpdateARGRPC() :
        RequestGRPC("one.vn.update_ar", "/one.vn.VirtualNetworkService/UpdateAR"),
        VirtualNetworkAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualNetworkReserveGRPC : public RequestGRPC, public VirtualNetworkAPI
{
public:
    VirtualNetworkReserveGRPC() :
        RequestGRPC("one.vn.reserve", "/one.vn.VirtualNetworkService/Reserve"),
        VirtualNetworkAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualNetworkFreeARGRPC : public RequestGRPC, public VirtualNetworkAPI
{
public:
    VirtualNetworkFreeARGRPC() :
        RequestGRPC("one.vn.free_ar", "/one.vn.VirtualNetworkService/FreeAR"),
        VirtualNetworkAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualNetworkHoldGRPC : public RequestGRPC, public VirtualNetworkAPI
{
public:
    VirtualNetworkHoldGRPC() :
        RequestGRPC("one.vn.hold", "/one.vn.VirtualNetworkService/Hold"),
        VirtualNetworkAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualNetworkReleaseGRPC : public RequestGRPC, public VirtualNetworkAPI
{
public:
    VirtualNetworkReleaseGRPC() :
        RequestGRPC("one.vn.release", "/one.vn.VirtualNetworkService/Release"),
        VirtualNetworkAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VirtualNetworkRecoverGRPC : public RequestGRPC, public VirtualNetworkAPI
{
public:
    VirtualNetworkRecoverGRPC() :
        RequestGRPC("one.vn.recover", "/one.vn.VirtualNetworkService/Recover"),
        VirtualNetworkAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkPoolInfoGRPC : public RequestGRPC, public VirtualNetworkPoolAPI
{
public:
    VirtualNetworkPoolInfoGRPC() :
        RequestGRPC("one.vnpool.info", "/one.vn.VirtualNetworkService/PoolInfo"),
        VirtualNetworkPoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

#endif
