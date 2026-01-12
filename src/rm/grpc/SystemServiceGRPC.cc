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

#include "SystemServiceGRPC.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

grpc::Status SystemService::Version(grpc::ServerContext* context,
                                    const one::system::VersionRequest* request,
                                    one::ResponseXML* response)
{
    return SystemVersionGRPC().execute(context, request, response);
}

grpc::Status SystemService::Config(grpc::ServerContext* context,
                                   const one::system::ConfigRequest* request,
                                   one::ResponseXML* response)
{
    return SystemConfigGRPC().execute(context, request, response);
}

grpc::Status SystemService::Sql(grpc::ServerContext* context,
                                const one::system::SqlRequest* request,
                                one::ResponseID* response)
{
    return SystemSqlGRPC().execute(context, request, response);
}

grpc::Status SystemService::SqlQuery(grpc::ServerContext* context,
                                     const one::system::SqlQueryRequest* request,
                                     one::ResponseXML* response)
{
    return SystemSqlQueryGRPC().execute(context, request, response);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void SystemVersionGRPC::request_execute(const google::protobuf::Message* _request,
                                        google::protobuf::Message*       _response,
                                        RequestAttributesGRPC& att)
{
    std::string version_str;

    auto ec = version(version_str, att);

    response(ec, version_str, att);
}

/* ------------------------------------------------------------------------- */

void SystemConfigGRPC::request_execute(const google::protobuf::Message* _request,
                                      google::protobuf::Message*       _response,
                                      RequestAttributesGRPC& att)
{
    std::string config_xml;

    auto ec = config(config_xml, att);

    response(ec, config_xml, att);
}

/* ------------------------------------------------------------------------- */

void SystemSqlGRPC::request_execute(const google::protobuf::Message* _request,
                                    google::protobuf::Message*       _response,
                                    RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::system::SqlRequest*>(_request);

    auto ec = sql(request->sql(),
                  request->federate(),
                  att);

    response(ec, 0, att);
}

/* ------------------------------------------------------------------------- */

void SystemSqlQueryGRPC::request_execute(const google::protobuf::Message* _request,
                                         google::protobuf::Message*       _response,
                                         RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::system::SqlQueryRequest*>(_request);

    std::string sql_str = request->sql();

    auto ec = sql_query(sql_str, att);

    response(ec, sql_str, att);
}
