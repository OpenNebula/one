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

#include "HookServiceGRPC.h"
#include "ClusterPool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

grpc::Status HookService::Allocate(grpc::ServerContext* context,
                                   const one::hook::AllocateRequest* request,
                                   one::ResponseID* response)
{
    return HookAllocateGRPC().execute(context, request, response);
}

grpc::Status HookService::Delete(grpc::ServerContext* context,
                                 const one::hook::DeleteRequest* request,
                                 one::ResponseID* response)
{
    return HookDeleteGRPC().execute(context, request, response);
}


grpc::Status HookService::Update(grpc::ServerContext* context,
                                 const one::hook::UpdateRequest* request,
                                 one::ResponseID* response)
{
    return HookUpdateGRPC().execute(context, request, response);
}

grpc::Status HookService::Rename(grpc::ServerContext* context,
                                 const one::hook::RenameRequest* request,
                                 one::ResponseID* response)
{
    return HookRenameGRPC().execute(context, request, response);
}

grpc::Status HookService::Lock(grpc::ServerContext* context,
                               const one::hook::LockRequest* request,
                               one::ResponseID* response)
{
    return HookLockGRPC().execute(context, request, response);
}

grpc::Status HookService::Unlock(grpc::ServerContext* context,
                                 const one::hook::UnlockRequest* request,
                                 one::ResponseID* response)
{
    return HookUnlockGRPC().execute(context, request, response);
}

grpc::Status HookService::Retry(grpc::ServerContext* context,
                                const one::hook::RetryRequest* request,
                                one::ResponseID* response)
{
    return HookRetryGRPC().execute(context, request, response);
}

grpc::Status HookService::Info(grpc::ServerContext* context,
                               const one::hook::InfoRequest* request,
                               one::ResponseXML* response)
{
    return HookInfoGRPC().execute(context, request, response);
}

grpc::Status HookService::PoolInfo(grpc::ServerContext* context,
                                   const one::hook::PoolInfoRequest* request,
                                   one::ResponseXML* response)
{
    return HookPoolInfoGRPC().execute(context, request, response);
}

grpc::Status HookService::LogInfo(grpc::ServerContext* context,
                                  const one::hook::LogInfoRequest* request,
                                  one::ResponseXML* response)
{
    return HookPoolLogInfoGRPC().execute(context, request, response);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void HookAllocateGRPC::request_execute(const google::protobuf::Message* _request,
                                       google::protobuf::Message*       _response,
                                       RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::hook::AllocateRequest*>(_request);

    int oid;

    auto ec = allocate(request->template_(),
                       ClusterPool::NONE_CLUSTER_ID,
                       oid,
                       att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void HookDeleteGRPC::request_execute(const google::protobuf::Message* _request,
                                     google::protobuf::Message*       _response,
                                     RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::hook::DeleteRequest*>(_request);

    int oid = request->oid();

    auto ec = del(oid, false, att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void HookUpdateGRPC::request_execute(const google::protobuf::Message* _request,
                                     google::protobuf::Message*       _response,
                                     RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::hook::UpdateRequest*>(_request);

    int oid = request->oid();

    auto ec = update(request->oid(),
                     request->template_(),
                     request->append(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void HookRenameGRPC::request_execute(const google::protobuf::Message* _request,
                                     google::protobuf::Message*       _response,
                                     RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::hook::RenameRequest*>(_request);

    int oid = request->oid();

    auto ec = rename(oid,
                     request->name(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void HookLockGRPC::request_execute(const google::protobuf::Message* _request,
                                   google::protobuf::Message*       _response,
                                   RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::hook::LockRequest*>(_request);

    int oid = request->oid();

    auto ec = lock(oid,
                   request->level(),
                   request->test(),
                   att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void HookUnlockGRPC::request_execute(const google::protobuf::Message* _request,
                                     google::protobuf::Message*       _response,
                                     RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::hook::UnlockRequest*>(_request);

    int oid = request->oid();

    auto ec = unlock(oid, att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void HookRetryGRPC::request_execute(const google::protobuf::Message* _request,
                                    google::protobuf::Message*       _response,
                                    RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::hook::RetryRequest*>(_request);

    int oid = request->oid();

    auto ec = retry(oid,
                    request->hk_exe_id(),
                    att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void HookInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                   google::protobuf::Message*       _response,
                                   RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::hook::InfoRequest*>(_request);

    std::string xml;

    auto ec = info(request->oid(),
                   request->decrypt(),
                   xml,
                   att);

    response(ec, xml, att);
}

/* ------------------------------------------------------------------------- */

void HookPoolInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                       google::protobuf::Message*       _response,
                                       RequestAttributesGRPC& att)
{
    std::string xml;

    auto ec = info(PoolSQL::ALL, -1, -1, xml, att);

    response(ec, xml, att);
}

/* ------------------------------------------------------------------------- */

void HookPoolLogInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                          google::protobuf::Message*       _response,
                                          RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::hook::LogInfoRequest*>(_request);

    std::string xml;

    auto ec = log_info(request->min_ts(),
                       request->max_ts(),
                       request->hook_id(),
                       request->rc_hook(),
                       xml,
                       att);

    response(ec, xml, att);
}