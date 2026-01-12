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

#ifndef ZONE_GRPC_H
#define ZONE_GRPC_H

#include "RequestGRPC.h"
#include "ZoneAPI.h"
#include "ZonePoolAPI.h"

#include "zone.grpc.pb.h"

#include <grpcpp/grpcpp.h>

class ZoneService final : public one::zone::ZoneService::Service
{
    grpc::Status Allocate(grpc::ServerContext* context,
                          const one::zone::AllocateRequest* request,
                          one::ResponseID* response) override;

    grpc::Status Delete(grpc::ServerContext* context,
                        const one::zone::DeleteRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Update(grpc::ServerContext* context,
                         const one::zone::UpdateRequest* request,
                         one::ResponseID* response) override;

    grpc::Status Rename(grpc::ServerContext* context,
                        const one::zone::RenameRequest* request,
                        one::ResponseID* response) override;

    grpc::Status AddServer(grpc::ServerContext* context,
                           const one::zone::AddServerRequest* request,
                           one::ResponseID* response) override;

    grpc::Status DelServer(grpc::ServerContext* context,
                           const one::zone::DelServerRequest* request,
                           one::ResponseID* response) override;

    grpc::Status ResetServer(grpc::ServerContext* context,
                             const one::zone::ResetServerRequest* request,
                             one::ResponseID* response) override;

    grpc::Status Enable(grpc::ServerContext* context,
                        const one::zone::EnableRequest* request,
                        one::ResponseID* response) override;

    grpc::Status ReplicateLog(grpc::ServerContext* context,
                              const one::zone::ReplicateLogRequest* request,
                              one::zone::ResponseReplicateLog* response) override;

    grpc::Status Vote(grpc::ServerContext* context,
                      const one::zone::VoteRequest* request,
                      one::zone::ResponseVote* response) override;

    grpc::Status RaftStatus(grpc::ServerContext* context,
                            const one::zone::RaftStatusRequest* request,
                            one::ResponseXML* response) override;

    grpc::Status ReplicateFedLog(grpc::ServerContext* context,
                                 const one::zone::ReplicateFedLogRequest* request,
                                 one::zone::ResponseReplicateFedLog* response) override;

    grpc::Status UpdateDB(grpc::ServerContext* context,
                          const one::zone::UpdateDBRequest* request,
                          one::ResponseID* response) override;

    grpc::Status Info(grpc::ServerContext* context,
                      const one::zone::InfoRequest* request,
                      one::ResponseXML* response) override;

    grpc::Status PoolInfo(grpc::ServerContext* context,
                          const one::zone::PoolInfoRequest* request,
                          one::ResponseXML* response) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ZoneAllocateGRPC : public RequestGRPC, public ZoneAPI
{
public:
    ZoneAllocateGRPC() :
        RequestGRPC("one.zone.allocate", "/one.zone.ZoneService/Allocate"),
        ZoneAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ZoneDeleteGRPC : public RequestGRPC, public ZoneAPI
{
public:
    ZoneDeleteGRPC() :
        RequestGRPC("one.zone.delete", "/one.zone.ZoneService/Delete"),
        ZoneAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ZoneUpdateGRPC : public RequestGRPC, public ZoneUpdateAPI
{
public:
    ZoneUpdateGRPC() :
        RequestGRPC("one.zone.update", "/one.zone.ZoneService/Update"),
        ZoneUpdateAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ZoneRenameGRPC : public RequestGRPC, public ZoneRenameAPI
{
public:
    ZoneRenameGRPC() :
        RequestGRPC("one.zone.rename", "/one.zone.ZoneService/Rename"),
        ZoneRenameAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ZoneAddServerGRPC : public RequestGRPC, public ZoneAPI
{
public:
    ZoneAddServerGRPC() :
        RequestGRPC("one.zone.addserver", "/one.zone.ZoneService/AddServer"),
        ZoneAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ZoneDelServerGRPC : public RequestGRPC, public ZoneAPI
{
public:
    ZoneDelServerGRPC() :
        RequestGRPC("one.zone.delserver", "/one.zone.ZoneService/DelServer"),
        ZoneAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ZoneResetServerGRPC : public RequestGRPC, public ZoneAPI
{
public:
    ZoneResetServerGRPC() :
        RequestGRPC("one.zone.resetserver", "/one.zone.ZoneService/ResetServer"),
        ZoneAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ZoneEnableGRPC : public RequestGRPC, public ZoneEnableAPI
{
public:
    ZoneEnableGRPC() :
        RequestGRPC("one.zone.enable", "/one.zone.ZoneService/Enable"),
        ZoneEnableAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ZoneReplicateLogGRPC : public RequestGRPC, public ZoneReplicateLogAPI
{
public:
    ZoneReplicateLogGRPC() :
        RequestGRPC("one.zone.replicate", "/one.zone.ZoneService/ReplicateLog"),
        ZoneReplicateLogAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ZoneVoteGRPC : public RequestGRPC, public ZoneVoteAPI
{
public:
    ZoneVoteGRPC() :
        RequestGRPC("one.zone.voterequest", "/one.zone.ZoneService/Vote"),
        ZoneVoteAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ZoneRaftStatusGRPC : public RequestGRPC, public ZoneRaftStatusAPI
{
public:
    ZoneRaftStatusGRPC() :
        RequestGRPC("one.zone.raftstatus", "/one.zone.ZoneService/RaftStatus"),
        ZoneRaftStatusAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ZoneReplicateFedLogGRPC : public RequestGRPC, public ZoneReplicateFedLogAPI
{
public:
    ZoneReplicateFedLogGRPC() :
        RequestGRPC("one.zone.fedreplicate", "/one.zone.ZoneService/ReplicateFedLog"),
        ZoneReplicateFedLogAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ZoneUpdateDBGRPC : public RequestGRPC, public ZoneAPI
{
public:
    ZoneUpdateDBGRPC() :
        RequestGRPC("one.zone.updatedb", "/one.zone.ZoneService/UpdateDB"),
        ZoneAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ZoneInfoGRPC : public RequestGRPC, public ZoneInfoAPI
{
public:
    ZoneInfoGRPC() :
        RequestGRPC("one.zone.info", "/one.zone.ZoneService/Info"),
        ZoneInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class ZonePoolInfoGRPC : public RequestGRPC, public ZonePoolAPI
{
public:
    ZonePoolInfoGRPC() :
        RequestGRPC("one.zonepool.info", "/one.zone.ZoneService/PoolInfo"),
        ZonePoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

#endif
