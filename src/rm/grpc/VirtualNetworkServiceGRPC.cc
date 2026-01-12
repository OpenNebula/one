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

#include "VirtualNetworkServiceGRPC.h"
#include "ClusterPool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

grpc::Status VirtualNetworkService::Allocate(grpc::ServerContext* context,
                                             const one::vn::AllocateRequest* request,
                                             one::ResponseID* response)
{
    return VirtualNetworkAllocateGRPC().execute(context, request, response);
}

grpc::Status VirtualNetworkService::Delete(grpc::ServerContext* context,
                                           const one::vn::DeleteRequest* request,
                                           one::ResponseID* response)
{
    return VirtualNetworkDeleteGRPC().execute(context, request, response);
}

grpc::Status VirtualNetworkService::Info(grpc::ServerContext* context,
                                         const one::vn::InfoRequest* request,
                                         one::ResponseXML* response)
{
    return VirtualNetworkInfoGRPC().execute(context, request, response);
}

grpc::Status VirtualNetworkService::Update(grpc::ServerContext* context,
                                           const one::vn::UpdateRequest* request,
                                           one::ResponseID* response)
{
    return VirtualNetworkUpdateGRPC().execute(context, request, response);
}

grpc::Status VirtualNetworkService::Rename(grpc::ServerContext* context,
                                           const one::vn::RenameRequest* request,
                                           one::ResponseID* response)
{
    return VirtualNetworkRenameGRPC().execute(context, request, response);
}

grpc::Status VirtualNetworkService::Chmod(grpc::ServerContext* context,
                                          const one::vn::ChmodRequest* request,
                                          one::ResponseID* response)
{
    return VirtualNetworkChmodGRPC().execute(context, request, response);
}

grpc::Status VirtualNetworkService::Chown(grpc::ServerContext* context,
                                          const one::vn::ChownRequest* request,
                                          one::ResponseID* response)
{
    return VirtualNetworkChownGRPC().execute(context, request, response);
}

grpc::Status VirtualNetworkService::Lock(grpc::ServerContext* context,
                                         const one::vn::LockRequest* request,
                                         one::ResponseID* response)
{
    return VirtualNetworkLockGRPC().execute(context, request, response);
}

grpc::Status VirtualNetworkService::Unlock(grpc::ServerContext* context,
                                           const one::vn::UnlockRequest* request,
                                           one::ResponseID* response)
{
    return VirtualNetworkUnlockGRPC().execute(context, request, response);
}

grpc::Status VirtualNetworkService::AddAR(grpc::ServerContext* context,
                                          const one::vn::AddARRequest* request,
                                          one::ResponseID* response)
{
    return VirtualNetworkAddARGRPC().execute(context, request, response);
}

grpc::Status VirtualNetworkService::RmAR(grpc::ServerContext* context,
                                         const one::vn::RmARRequest* request,
                                         one::ResponseID* response)
{
    return VirtualNetworkRmARGRPC().execute(context, request, response);
}

grpc::Status VirtualNetworkService::UpdateAR(grpc::ServerContext* context,
                                             const one::vn::UpdateARRequest* request,
                                             one::ResponseID* response)
{
    return VirtualNetworkUpdateARGRPC().execute(context, request, response);
}

grpc::Status VirtualNetworkService::Reserve(grpc::ServerContext* context,
                                            const one::vn::ReserveRequest* request,
                                            one::ResponseID* response)
{
    return VirtualNetworkReserveGRPC().execute(context, request, response);
}

grpc::Status VirtualNetworkService::FreeAR(grpc::ServerContext* context,
                                           const one::vn::FreeARRequest* request,
                                           one::ResponseID* response)
{
    return VirtualNetworkFreeARGRPC().execute(context, request, response);
}

grpc::Status VirtualNetworkService::Hold(grpc::ServerContext* context,
                                         const one::vn::HoldRequest* request,
                                         one::ResponseID* response)
{
    return VirtualNetworkHoldGRPC().execute(context, request, response);
}

grpc::Status VirtualNetworkService::Release(grpc::ServerContext* context,
                                            const one::vn::ReleaseRequest* request,
                                            one::ResponseID* response)
{
    return VirtualNetworkReleaseGRPC().execute(context, request, response);
}

grpc::Status VirtualNetworkService::Recover(grpc::ServerContext* context,
                                            const one::vn::RecoverRequest* request,
                                            one::ResponseID* response)
{
    return VirtualNetworkRecoverGRPC().execute(context, request, response);
}

grpc::Status VirtualNetworkService::PoolInfo(grpc::ServerContext* context,
                                             const one::vn::PoolInfoRequest* request,
                                             one::ResponseXML* response)
{
    return VirtualNetworkPoolInfoGRPC().execute(context, request, response);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void VirtualNetworkAllocateGRPC::request_execute(const google::protobuf::Message* _request,
                                        google::protobuf::Message*       _response,
                                        RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vn::AllocateRequest*>(_request);

    int oid;

    auto ec = allocate(request->template_(),
                       request->cluster_id(),
                       oid,
                       att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualNetworkDeleteGRPC::request_execute(const google::protobuf::Message* _request,
                                      google::protobuf::Message*       _response,
                                      RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vn::DeleteRequest*>(_request);

    int oid = request->oid();

    auto ec = del(oid, false, att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualNetworkInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                    google::protobuf::Message*       _response,
                                    RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vn::InfoRequest*>(_request);

    std::string xml;

    auto ec = info(request->oid(),
                   request->decrypt(),
                   xml,
                   att);

    response(ec, xml, att);
}

/* ------------------------------------------------------------------------- */

void VirtualNetworkUpdateGRPC::request_execute(const google::protobuf::Message* _request,
                                      google::protobuf::Message*       _response,
                                      RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vn::UpdateRequest*>(_request);

    int oid = request->oid();

    auto ec = update(request->oid(),
                     request->template_(),
                     request->append(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualNetworkRenameGRPC::request_execute(const google::protobuf::Message* _request,
                                      google::protobuf::Message*       _response,
                                      RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vn::RenameRequest*>(_request);

    int oid = request->oid();

    auto ec = rename(oid,
                     request->name(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualNetworkChmodGRPC::request_execute(const google::protobuf::Message* _request,
                                     google::protobuf::Message*       _response,
                                     RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vn::ChmodRequest*>(_request);

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

void VirtualNetworkChownGRPC::request_execute(const google::protobuf::Message* _request,
                                     google::protobuf::Message*       _response,
                                     RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vn::ChownRequest*>(_request);

    int oid = request->oid();

    auto ec = chown(oid,
                    request->user_id(),
                    request->group_id(),
                    att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualNetworkLockGRPC::request_execute(const google::protobuf::Message* _request,
                                    google::protobuf::Message*       _response,
                                    RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vn::LockRequest*>(_request);

    int oid = request->oid();

    auto ec = lock(oid,
                   request->level(),
                   request->test(),
                   att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualNetworkUnlockGRPC::request_execute(const google::protobuf::Message* _request,
                                      google::protobuf::Message*       _response,
                                      RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vn::UnlockRequest*>(_request);

    int oid = request->oid();

    auto ec = unlock(oid,
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualNetworkAddARGRPC::request_execute(const google::protobuf::Message* _request,
                                              google::protobuf::Message*       _response,
                                              RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vn::AddARRequest*>(_request);

    int oid = request->oid();

    auto ec = add_ar(oid,
                     request->template_(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualNetworkRmARGRPC::request_execute(const google::protobuf::Message* _request,
                                             google::protobuf::Message*       _response,
                                             RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vn::RmARRequest*>(_request);

    int oid = request->oid();

    auto ec = rm_ar(oid,
                    request->ar_id(),
                    request->force(),
                    att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualNetworkUpdateARGRPC::request_execute(const google::protobuf::Message* _request,
                                                 google::protobuf::Message*       _response,
                                                 RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vn::UpdateARRequest*>(_request);

    int oid = request->oid();

    auto ec = update_ar(oid,
                        request->template_(),
                        att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualNetworkReserveGRPC::request_execute(const google::protobuf::Message* _request,
                                                google::protobuf::Message*       _response,
                                                RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vn::ReserveRequest*>(_request);

    int net_id = -1;

    auto ec = reserve(request->oid(),
                      request->template_(),
                      net_id,
                      att);

    response(ec, net_id, att);
}

/* ------------------------------------------------------------------------- */

void VirtualNetworkFreeARGRPC::request_execute(const google::protobuf::Message* _request,
                                               google::protobuf::Message*       _response,
                                               RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vn::FreeARRequest*>(_request);

    int oid = request->oid();

    auto ec = free_ar(oid,
                      request->ar_id(),
                      att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualNetworkHoldGRPC::request_execute(const google::protobuf::Message* _request,
                                             google::protobuf::Message*       _response,
                                             RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vn::HoldRequest*>(_request);

    int oid = request->oid();

    auto ec = hold(oid,
                   request->template_(),
                   att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualNetworkReleaseGRPC::request_execute(const google::protobuf::Message* _request,
                                                google::protobuf::Message*       _response,
                                                RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vn::ReleaseRequest*>(_request);

    int oid = request->oid();

    auto ec = release(oid,
                      request->template_(),
                      att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualNetworkRecoverGRPC::request_execute(const google::protobuf::Message* _request,
                                                google::protobuf::Message*       _response,
                                                RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vn::RecoverRequest*>(_request);

    int oid = request->oid();

    auto ec = recover(oid,
                      request->operation(),
                      att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualNetworkPoolInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                        google::protobuf::Message*       _response,
                                        RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vn::PoolInfoRequest*>(_request);

    std::string xml;

    auto ec = info(request->filter_flag(),
                   request->start(),
                   request->end(),
                   xml,
                   att);

    response(ec, xml, att);
}
