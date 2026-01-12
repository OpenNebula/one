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

#ifndef SYSTEM_GRPC_H
#define SYSTEM_GRPC_H

#include "RequestGRPC.h"
#include "SystemAPI.h"

#include "system.grpc.pb.h"

#include <grpcpp/grpcpp.h>

class SystemService final : public one::system::SystemService::Service
{
    grpc::Status Version(grpc::ServerContext* context,
                         const one::system::VersionRequest* request,
                         one::ResponseXML* response) override;

    grpc::Status Config(grpc::ServerContext* context,
                        const one::system::ConfigRequest* request,
                        one::ResponseXML* response) override;

    grpc::Status Sql(grpc::ServerContext* context,
                     const one::system::SqlRequest* request,
                     one::ResponseID* response) override;

    grpc::Status SqlQuery(grpc::ServerContext* context,
                          const one::system::SqlQueryRequest* request,
                          one::ResponseXML* response) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SystemVersionGRPC : public RequestGRPC, public SystemVersionAPI
{
public:
    SystemVersionGRPC() :
        RequestGRPC("one.system.version", "/one.system.SystemService/Version"),
        SystemVersionAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class SystemConfigGRPC : public RequestGRPC, public SystemConfigAPI
{
public:
    SystemConfigGRPC() :
        RequestGRPC("one.system.config", "/one.system.SystemService/Config"),
        SystemConfigAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class SystemSqlGRPC : public RequestGRPC, public SystemAPI
{
public:
    SystemSqlGRPC() :
        RequestGRPC("one.system.sql", "/one.system.SystemService/Sql"),
        SystemAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class SystemSqlQueryGRPC : public RequestGRPC, public SystemAPI
{
public:
    SystemSqlQueryGRPC() :
        RequestGRPC("one.system.sqlquery", "/one.system.SystemService/SqlQuery"),
        SystemAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

#endif
