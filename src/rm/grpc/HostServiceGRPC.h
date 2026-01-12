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

#ifndef HOST_GRPC_H
#define HOST_GRPC_H

#include "RequestGRPC.h"
#include "HostAPI.h"
#include "HostPoolAPI.h"

#include "host.grpc.pb.h"

#include <grpcpp/grpcpp.h>

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HostService final : public one::host::HostService::Service
{
    grpc::Status Allocate(grpc::ServerContext* context,
                          const one::host::AllocateRequest* request,
                          one::ResponseID* response) override;

    grpc::Status Delete(grpc::ServerContext* context,
                        const one::host::DeleteRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Info(grpc::ServerContext* context,
                      const one::host::InfoRequest* request,
                      one::ResponseXML* response) override;

    grpc::Status Update(grpc::ServerContext* context,
                        const one::host::UpdateRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Rename(grpc::ServerContext* context,
                        const one::host::RenameRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Status(grpc::ServerContext* context,
                        const one::host::StatusRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Monitoring(grpc::ServerContext* context,
                            const one::host::MonitoringRequest* request,
                            one::ResponseXML* response) override;

    grpc::Status PoolInfo(grpc::ServerContext* context,
                          const one::host::PoolInfoRequest* request,
                          one::ResponseXML* response) override;

    grpc::Status PoolMonitoring(grpc::ServerContext* context,
                                const one::host::PoolMonitoringRequest* request,
                                one::ResponseXML* response) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HostAllocateGRPC : public RequestGRPC, public HostAllocateAPI
{
public:
    HostAllocateGRPC() :
        RequestGRPC("one.host.allocate", "/one.host.HostService/Allocate"),
        HostAllocateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class HostDeleteGRPC : public RequestGRPC, public HostAPI
{
public:
    HostDeleteGRPC() :
        RequestGRPC("one.host.delete", "/one.host.HostService/Delete"),
        HostAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class HostInfoGRPC : public RequestGRPC, public HostInfoAPI
{
public:
    HostInfoGRPC() :
        RequestGRPC("one.host.info", "/one.host.HostService/Info"),
        HostInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class HostUpdateGRPC : public RequestGRPC, public HostAPI
{
public:
    HostUpdateGRPC() :
        RequestGRPC("one.host.update", "/one.host.HostService/Update"),
        HostAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class HostRenameGRPC : public RequestGRPC, public HostAPI
{
public:
    HostRenameGRPC() :
        RequestGRPC("one.host.rename", "/one.host.HostService/Rename"),
        HostAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class HostStatusGRPC : public RequestGRPC, public HostAPI
{
public:
    HostStatusGRPC() :
        RequestGRPC("one.host.status", "/one.host.HostService/Status"),
        HostAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class HostMonitoringGRPC : public RequestGRPC, public HostMonitoringAPI
{
public:
    HostMonitoringGRPC() :
        RequestGRPC("one.host.monitoring", "/one.host.HostService/Monitoring"),
        HostMonitoringAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HostPoolInfoGRPC : public RequestGRPC, public HostPoolAPI
{
public:
    HostPoolInfoGRPC() :
        RequestGRPC("one.hostpool.info", "/one.host.HostService/PoolInfo"),
        HostPoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class HostPoolMonitoringGRPC : public RequestGRPC, public HostPoolAPI
{
public:
    HostPoolMonitoringGRPC() :
        RequestGRPC("one.host.monitoring", "/one.host.HostService/PoolMonitoring"),
        HostPoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

#endif
