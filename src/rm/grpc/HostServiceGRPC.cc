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

#include "HostServiceGRPC.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

grpc::Status HostService::Allocate(grpc::ServerContext* context,
                                   const one::host::AllocateRequest* request,
                                   one::ResponseID* response)
{
    return HostAllocateGRPC().execute(context, request, response);
}

grpc::Status HostService::Delete(grpc::ServerContext* context,
                                 const one::host::DeleteRequest* request,
                                 one::ResponseID* response)
{
    return HostDeleteGRPC().execute(context, request, response);
}

grpc::Status HostService::Info(grpc::ServerContext* context,
                               const one::host::InfoRequest* request,
                               one::ResponseXML* response)
{
    return HostInfoGRPC().execute(context, request, response);
}

grpc::Status HostService::Update(grpc::ServerContext* context,
                                 const one::host::UpdateRequest* request,
                                 one::ResponseID* response)
{
    return HostUpdateGRPC().execute(context, request, response);
}

grpc::Status HostService::Rename(grpc::ServerContext* context,
                                 const one::host::RenameRequest* request,
                                 one::ResponseID* response)
{
    return HostRenameGRPC().execute(context, request, response);
}

grpc::Status HostService::Status(grpc::ServerContext* context,
                                 const one::host::StatusRequest* request,
                                 one::ResponseID* response)
{
    return HostStatusGRPC().execute(context, request, response);
}

grpc::Status HostService::Monitoring(grpc::ServerContext* context,
                                      const one::host::MonitoringRequest* request,
                                      one::ResponseXML* response)
{
    return HostMonitoringGRPC().execute(context, request, response);
}

grpc::Status HostService::PoolInfo(grpc::ServerContext* context,
                                   const one::host::PoolInfoRequest* request,
                                   one::ResponseXML* response)
{
    return HostPoolInfoGRPC().execute(context, request, response);
}

grpc::Status HostService::PoolMonitoring(grpc::ServerContext* context,
                                         const one::host::PoolMonitoringRequest* request,
                                         one::ResponseXML* response)
{
    return HostPoolMonitoringGRPC().execute(context, request, response);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void HostAllocateGRPC::request_execute(const google::protobuf::Message* _request,
                                       google::protobuf::Message*       _response,
                                       RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::host::AllocateRequest*>(_request);

    int oid;

    auto ec = allocate(
        request->name(),
        request->im_mad(),
        request->vm_mad(),
        request->cluster_id(),
        oid,
        att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void HostDeleteGRPC::request_execute(const google::protobuf::Message* _request,
                                     google::protobuf::Message*       _response,
                                     RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::host::DeleteRequest*>(_request);

    int oid = request->oid();

    auto ec = del(oid, false, att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void HostInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                   google::protobuf::Message*       _response,
                                   RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::host::InfoRequest*>(_request);

    std::string xml;

    auto ec = info(request->oid(),
                   request->decrypt(),
                   xml,
                   att);

    response(ec, xml, att);
}

/* ------------------------------------------------------------------------- */

void HostUpdateGRPC::request_execute(const google::protobuf::Message* _request,
                                     google::protobuf::Message*       _response,
                                     RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::host::UpdateRequest*>(_request);

    int oid = request->oid();

    auto ec = update(request->oid(),
                     request->template_(),
                     request->append(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void HostRenameGRPC::request_execute(const google::protobuf::Message* _request,
                                     google::protobuf::Message*       _response,
                                     RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::host::RenameRequest*>(_request);

    int oid = request->oid();

    auto ec = rename(oid,
                     request->name(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void HostStatusGRPC::request_execute(const google::protobuf::Message* _request,
                                     google::protobuf::Message*       _response,
                                     RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::host::StatusRequest*>(_request);

    int oid = request->oid();

    auto ec = status(request->oid(),
                     request->status(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void HostMonitoringGRPC::request_execute(const google::protobuf::Message* _request,
                                         google::protobuf::Message*       _response,
                                         RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::host::MonitoringRequest*>(_request);

    std::string xml;

    auto ec = monitoring(request->oid(),
                         xml,
                         att);

    response(ec, xml, att);
}

/* ------------------------------------------------------------------------- */

void HostPoolInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                       google::protobuf::Message*       _response,
                                       RequestAttributesGRPC& att)
{
    std::string xml;

    auto ec = info(PoolSQL::ALL, -1, -1, xml, att);

    response(ec, xml, att);
}

/* ------------------------------------------------------------------------- */

void HostPoolMonitoringGRPC::request_execute(const google::protobuf::Message* _request,
                                             google::protobuf::Message*       _response,
                                             RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::host::PoolMonitoringRequest*>(_request);

    std::string xml;

    auto ec = monitoring(request->seconds(),
                         xml,
                         att);

    response(ec, xml, att);
}

