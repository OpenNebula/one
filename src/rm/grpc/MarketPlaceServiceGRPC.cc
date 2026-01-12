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

#include "MarketPlaceServiceGRPC.h"
#include "ClusterPool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

grpc::Status MarketPlaceService::Allocate(grpc::ServerContext* context,
                                          const one::market::AllocateRequest* request,
                                          one::ResponseID* response)
{
    return MarketPlaceAllocateGRPC().execute(context, request, response);
}

grpc::Status MarketPlaceService::Delete(grpc::ServerContext* context,
                                        const one::market::DeleteRequest* request,
                                        one::ResponseID* response)
{
    return MarketPlaceDeleteGRPC().execute(context, request, response);
}

grpc::Status MarketPlaceService::Info(grpc::ServerContext* context,
                                      const one::market::InfoRequest* request,
                                      one::ResponseXML* response)
{
    return MarketPlaceInfoGRPC().execute(context, request, response);
}

grpc::Status MarketPlaceService::Update(grpc::ServerContext* context,
                                        const one::market::UpdateRequest* request,
                                        one::ResponseID* response)
{
    return MarketPlaceUpdateGRPC().execute(context, request, response);
}

grpc::Status MarketPlaceService::Rename(grpc::ServerContext* context,
                                        const one::market::RenameRequest* request,
                                        one::ResponseID* response)
{
    return MarketPlaceRenameGRPC().execute(context, request, response);
}

grpc::Status MarketPlaceService::Chmod(grpc::ServerContext* context,
                                       const one::market::ChmodRequest* request,
                                       one::ResponseID* response)
{
    return MarketPlaceChmodGRPC().execute(context, request, response);
}

grpc::Status MarketPlaceService::Chown(grpc::ServerContext* context,
                                       const one::market::ChownRequest* request,
                                       one::ResponseID* response)
{
    return MarketPlaceChownGRPC().execute(context, request, response);
}

grpc::Status MarketPlaceService::Enable(grpc::ServerContext* context,
                                        const one::market::EnableRequest* request,
                                        one::ResponseID* response)
{
    return MarketPlaceEnableGRPC().execute(context, request, response);
}

grpc::Status MarketPlaceService::AllocateDB(grpc::ServerContext* context,
                                            const one::market::AllocateDBRequest* request,
                                            one::ResponseID* response)
{
    return MarketPlaceAllocateDBGRPC().execute(context, request, response);
}

grpc::Status MarketPlaceService::UpdateDB(grpc::ServerContext* context,
                                          const one::market::UpdateDBRequest* request,
                                          one::ResponseID* response)
{
    return MarketPlaceUpdateDBGRPC().execute(context, request, response);
}

grpc::Status MarketPlaceService::PoolInfo(grpc::ServerContext* context,
                                          const one::market::PoolInfoRequest* request,
                                          one::ResponseXML* response)
{
    return MarketPlacePoolInfoGRPC().execute(context, request, response);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void MarketPlaceAllocateGRPC::request_execute(const google::protobuf::Message* _request,
                                              google::protobuf::Message*       _response,
                                              RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::market::AllocateRequest*>(_request);

    int oid;

    auto ec = allocate(
        request->template_(),
        ClusterPool::NONE_CLUSTER_ID,
        oid,
        att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void MarketPlaceDeleteGRPC::request_execute(const google::protobuf::Message* _request,
                                            google::protobuf::Message*       _response,
                                            RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::market::DeleteRequest*>(_request);

    int oid = request->oid();

    auto ec = del(oid, false, att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void MarketPlaceInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                          google::protobuf::Message*       _response,
                                          RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::market::InfoRequest*>(_request);

    std::string xml;

    auto ec = info(request->oid(),
                   request->decrypt(),
                   xml,
                   att);

    response(ec, xml, att);
}

/* ------------------------------------------------------------------------- */

void MarketPlaceUpdateGRPC::request_execute(const google::protobuf::Message* _request,
                                            google::protobuf::Message*       _response,
                                            RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::market::UpdateRequest*>(_request);

    int oid = request->oid();

    auto ec = update(request->oid(),
                     request->template_(),
                     request->append(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void MarketPlaceRenameGRPC::request_execute(const google::protobuf::Message* _request,
                                            google::protobuf::Message*       _response,
                                            RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::market::RenameRequest*>(_request);

    int oid = request->oid();

    auto ec = rename(oid,
                     request->name(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void MarketPlaceChmodGRPC::request_execute(const google::protobuf::Message* _request,
                                           google::protobuf::Message*       _response,
                                           RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::market::ChmodRequest*>(_request);

    int oid = request->oid();

    auto ec = chmod(oid,
                    request->user_use(),
                    request->user_manage(),
                    request->user_admin(),
                    request->group_use(),
                    request->group_manage(),
                    request->group_admin(),
                    request->other_use(),
                    request->other_manage(),
                    request->other_admin(),
                    att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void MarketPlaceChownGRPC::request_execute(const google::protobuf::Message* _request,
                                           google::protobuf::Message*       _response,
                                           RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::market::ChownRequest*>(_request);

    int oid = request->oid();

    auto ec = chown(oid,
                    request->user_id(),
                    request->group_id(),
                    att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void MarketPlaceEnableGRPC::request_execute(const google::protobuf::Message* _request,
                                            google::protobuf::Message*       _response,
                                            RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::market::EnableRequest*>(_request);

    int oid = request->oid();

    auto ec = enable(oid,
                     request->enable(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void MarketPlaceAllocateDBGRPC::request_execute(const google::protobuf::Message* _request,
                                                google::protobuf::Message*       _response,
                                                RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::market::AllocateDBRequest*>(_request);

    int oid;

    auto ec = allocate_db(oid,
                          request->xml(),
                          att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void MarketPlaceUpdateDBGRPC::request_execute(const google::protobuf::Message* _request,
                                              google::protobuf::Message*       _response,
                                              RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::market::UpdateDBRequest*>(_request);

    int oid = request->oid();

    auto ec = update_db(oid,
                        request->xml(),
                        att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void MarketPlacePoolInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                              google::protobuf::Message*       _response,
                                              RequestAttributesGRPC& att)
{
    std::string xml;

    auto ec = info(PoolSQL::ALL, -1, -1, xml, att);

    response(ec, xml, att);
}

