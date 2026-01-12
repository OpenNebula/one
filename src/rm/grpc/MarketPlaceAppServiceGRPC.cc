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

#include "MarketPlaceAppServiceGRPC.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

grpc::Status MarketPlaceAppService::Allocate(grpc::ServerContext* context,
                                             const one::marketapp::AllocateRequest* request,
                                             one::ResponseID* response)
{
    return MarketPlaceAppAllocateGRPC().execute(context, request, response);
}

grpc::Status MarketPlaceAppService::Delete(grpc::ServerContext* context,
                                           const one::marketapp::DeleteRequest* request,
                                           one::ResponseID* response)
{
    return MarketPlaceAppDeleteGRPC().execute(context, request, response);
}

grpc::Status MarketPlaceAppService::Info(grpc::ServerContext* context,
                                         const one::marketapp::InfoRequest* request,
                                         one::ResponseXML* response)
{
    return MarketPlaceAppInfoGRPC().execute(context, request, response);
}

grpc::Status MarketPlaceAppService::Update(grpc::ServerContext* context,
                                           const one::marketapp::UpdateRequest* request,
                                           one::ResponseID* response)
{
    return MarketPlaceAppUpdateGRPC().execute(context, request, response);
}

grpc::Status MarketPlaceAppService::Rename(grpc::ServerContext* context,
                                           const one::marketapp::RenameRequest* request,
                                           one::ResponseID* response)
{
    return MarketPlaceAppRenameGRPC().execute(context, request, response);
}

grpc::Status MarketPlaceAppService::Chmod(grpc::ServerContext* context,
                                          const one::marketapp::ChmodRequest* request,
                                          one::ResponseID* response)
{
    return MarketPlaceAppChmodGRPC().execute(context, request, response);
}

grpc::Status MarketPlaceAppService::Chown(grpc::ServerContext* context,
                                          const one::marketapp::ChownRequest* request,
                                          one::ResponseID* response)
{
    return MarketPlaceAppChownGRPC().execute(context, request, response);
}

grpc::Status MarketPlaceAppService::Enable(grpc::ServerContext* context,
                                           const one::marketapp::EnableRequest* request,
                                           one::ResponseID* response)
{
    return MarketPlaceAppEnableGRPC().execute(context, request, response);
}

grpc::Status MarketPlaceAppService::Lock(grpc::ServerContext* context,
                                         const one::marketapp::LockRequest* request,
                                         one::ResponseID* response)
{
    return MarketPlaceAppLockGRPC().execute(context, request, response);
}

grpc::Status MarketPlaceAppService::Unlock(grpc::ServerContext* context,
                                           const one::marketapp::UnlockRequest* request,
                                           one::ResponseID* response)
{
    return MarketPlaceAppUnlockGRPC().execute(context, request, response);
}

grpc::Status MarketPlaceAppService::AllocateDB(grpc::ServerContext* context,
                                               const one::marketapp::AllocateDBRequest* request,
                                               one::ResponseID* response)
{
    return MarketPlaceAppAllocateDBGRPC().execute(context, request, response);
}

grpc::Status MarketPlaceAppService::UpdateDB(grpc::ServerContext* context,
                                             const one::marketapp::UpdateDBRequest* request,
                                             one::ResponseID* response)
{
    return MarketPlaceAppUpdateDBGRPC().execute(context, request, response);
}

grpc::Status MarketPlaceAppService::DropDB(grpc::ServerContext* context,
                                           const one::marketapp::DropDBRequest* request,
                                           one::ResponseID* response)
{
    return MarketPlaceAppDropDBGRPC().execute(context, request, response);
}

grpc::Status MarketPlaceAppService::PoolInfo(grpc::ServerContext* context,
                                             const one::marketapp::PoolInfoRequest* request,
                                             one::ResponseXML* response)
{
    return MarketPlaceAppPoolInfoGRPC().execute(context, request, response);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void MarketPlaceAppAllocateGRPC::request_execute(const google::protobuf::Message* _request,
                                                 google::protobuf::Message*       _response,
                                                 RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::marketapp::AllocateRequest*>(_request);

    int oid;

    auto ec = allocate(request->template_(),
                       request->market_id(),
                       oid,
                       att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void MarketPlaceAppDeleteGRPC::request_execute(const google::protobuf::Message* _request,
                                               google::protobuf::Message*       _response,
                                               RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::marketapp::DeleteRequest*>(_request);

    int oid = request->oid();

    auto ec = del(oid, false, att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void MarketPlaceAppInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                             google::protobuf::Message*       _response,
                                             RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::marketapp::InfoRequest*>(_request);

    std::string xml;

    auto ec = info(request->oid(),
                   request->decrypt(),
                   xml,
                   att);

    response(ec, xml, att);
}

/* ------------------------------------------------------------------------- */

void MarketPlaceAppUpdateGRPC::request_execute(const google::protobuf::Message* _request,
                                               google::protobuf::Message*       _response,
                                               RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::marketapp::UpdateRequest*>(_request);

    int oid = request->oid();

    auto ec = update(request->oid(),
                     request->template_(),
                     request->append(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void MarketPlaceAppRenameGRPC::request_execute(const google::protobuf::Message* _request,
                                               google::protobuf::Message*       _response,
                                               RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::marketapp::RenameRequest*>(_request);

    int oid = request->oid();

    auto ec = rename(oid,
                     request->name(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void MarketPlaceAppChmodGRPC::request_execute(const google::protobuf::Message* _request,
                                              google::protobuf::Message*       _response,
                                              RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::marketapp::ChmodRequest*>(_request);

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

void MarketPlaceAppChownGRPC::request_execute(const google::protobuf::Message* _request,
                                              google::protobuf::Message*       _response,
                                              RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::marketapp::ChownRequest*>(_request);

    int oid = request->oid();

    auto ec = chown(oid,
                    request->user_id(),
                    request->group_id(),
                    att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void MarketPlaceAppEnableGRPC::request_execute(const google::protobuf::Message* _request,
                                               google::protobuf::Message*       _response,
                                               RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::marketapp::EnableRequest*>(_request);

    int oid = request->oid();

    auto ec = enable(oid,
                     request->enable(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void MarketPlaceAppLockGRPC::request_execute(const google::protobuf::Message* _request,
                                             google::protobuf::Message*       _response,
                                             RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::marketapp::LockRequest*>(_request);

    int oid = request->oid();

    auto ec = lock(oid,
                   request->level(),
                   request->test(),
                   att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void MarketPlaceAppUnlockGRPC::request_execute(const google::protobuf::Message* _request,
                                               google::protobuf::Message*       _response,
                                               RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::marketapp::UnlockRequest*>(_request);

    int oid = request->oid();

    auto ec = unlock(oid, att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void MarketPlaceAppAllocateDBGRPC::request_execute(const google::protobuf::Message* _request,
                                                   google::protobuf::Message*       _response,
                                                   RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::marketapp::AllocateDBRequest*>(_request);

    int oid;

    auto ec = allocate_db(oid,
                          request->xml(),
                          att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void MarketPlaceAppUpdateDBGRPC::request_execute(const google::protobuf::Message* _request,
                                                 google::protobuf::Message*       _response,
                                                 RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::marketapp::UpdateDBRequest*>(_request);

    int oid = request->oid();

    auto ec = update_db(oid,
                        request->xml(),
                        att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void MarketPlaceAppDropDBGRPC::request_execute(const google::protobuf::Message* _request,
                                               google::protobuf::Message*       _response,
                                               RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::marketapp::DropDBRequest*>(_request);

    int oid = request->oid();

    auto ec = drop_db(oid, att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void MarketPlaceAppPoolInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                                 google::protobuf::Message*       _response,
                                                 RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::marketapp::PoolInfoRequest*>(_request);

    std::string xml;

    auto ec = info(request->filter_flag(),
                   request->start(),
                   request->end(),
                   xml,
                   att);

    response(ec, xml, att);
}

