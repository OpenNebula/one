
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

#include "VirtualRouterServiceGRPC.h"
#include "ClusterPool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

grpc::Status VirtualRouterService::Allocate(grpc::ServerContext*              context,
                                            const one::vrouter::AllocateRequest* request,
                                            one::ResponseID*                  response)
{

    return VirtualRouterAllocateGRPC().execute(context, request, response);
}

grpc::Status VirtualRouterService::Delete(grpc::ServerContext* context,
                                          const one::vrouter::DeleteRequest* request,
                                          one::ResponseID* response)
{
    return VirtualRouterDeleteGRPC().execute(context, request, response);
}

grpc::Status VirtualRouterService::Update(grpc::ServerContext* context,
                                          const one::vrouter::UpdateRequest* request,
                                          one::ResponseID* response)
{
    return VirtualRouterUpdateGRPC().execute(context, request, response);
}

grpc::Status VirtualRouterService::Rename(grpc::ServerContext* context,
                                          const one::vrouter::RenameRequest* request,
                                          one::ResponseID* response)
{
    return VirtualRouterRenameGRPC().execute(context, request, response);
}

grpc::Status VirtualRouterService::Instantiate(grpc::ServerContext* context,
                                               const one::vrouter::InstantiateRequest* request,
                                               one::ResponseID* response)
{
    return VirtualRouterInstantiateGRPC().execute(context, request, response);
}

grpc::Status VirtualRouterService::AttachNic(grpc::ServerContext* context,
                                             const one::vrouter::AttachNicRequest* request,
                                             one::ResponseID* response)
{
    return VirtualRouterAttachNicGRPC().execute(context, request, response);
}

grpc::Status VirtualRouterService::DetachNic(grpc::ServerContext* context,
                                             const one::vrouter::DetachNicRequest* request,
                                             one::ResponseID* response)
{
    return VirtualRouterDetachNicGRPC().execute(context, request, response);
}

grpc::Status VirtualRouterService::Lock(grpc::ServerContext* context,
                                        const one::vrouter::LockRequest* request,
                                        one::ResponseID* response)
{
    return VirtualRouterLockGRPC().execute(context, request, response);
}

grpc::Status VirtualRouterService::Unlock(grpc::ServerContext* context,
                                          const one::vrouter::UnlockRequest* request,
                                          one::ResponseID* response)
{
    return VirtualRouterUnlockGRPC().execute(context, request, response);
}

grpc::Status VirtualRouterService::Chown(grpc::ServerContext* context,
                                         const one::vrouter::ChownRequest* request,
                                         one::ResponseID* response)
{
    return VirtualRouterChownGRPC().execute(context, request, response);
}

grpc::Status VirtualRouterService::Chmod(grpc::ServerContext* context,
                                         const one::vrouter::ChmodRequest* request,
                                         one::ResponseID* response)
{
    return VirtualRouterChmodGRPC().execute(context, request, response);
}

grpc::Status VirtualRouterService::Info(grpc::ServerContext* context,
                                        const one::vrouter::InfoRequest* request,
                                        one::ResponseXML* response)
{
    return VirtualRouterInfoGRPC().execute(context, request, response);
}

grpc::Status VirtualRouterService::PoolInfo(grpc::ServerContext* context,
                                            const one::vrouter::PoolInfoRequest* request,
                                            one::ResponseXML* response)
{
    return VirtualRouterPoolInfoGRPC().execute(context, request, response);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void VirtualRouterAllocateGRPC::request_execute(const google::protobuf::Message* _request,
                                                google::protobuf::Message*       _response,
                                                RequestAttributesGRPC&           att)
{
    auto request = static_cast<const one::vrouter::AllocateRequest*>(_request);

    int oid;

    auto ec = allocate(request->template_(),
                       ClusterPool::NONE_CLUSTER_ID,
                       oid,
                       att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualRouterDeleteGRPC::request_execute(const google::protobuf::Message* _request,
                                              google::protobuf::Message*       _response,
                                              RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vrouter::DeleteRequest*>(_request);

    int oid = request->oid();

    auto ec = del(oid, false, att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualRouterUpdateGRPC::request_execute(const google::protobuf::Message* _request,
                                              google::protobuf::Message*       _response,
                                              RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vrouter::UpdateRequest*>(_request);

    int oid = request->oid();

    auto ec = update(request->oid(),
                     request->template_(),
                     request->append(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualRouterRenameGRPC::request_execute(const google::protobuf::Message* _request,
                                              google::protobuf::Message*       _response,
                                              RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vrouter::RenameRequest*>(_request);

    int oid = request->oid();

    auto ec = rename(oid,
                     request->name(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualRouterInstantiateGRPC::request_execute(const google::protobuf::Message* _request,
                                                   google::protobuf::Message*       _response,
                                                   RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vrouter::InstantiateRequest*>(_request);

    int oid = request->oid();
    std::string name = request->name();

    auto ec = instantiate(oid,
                          request->n_vms(),
                          request->template_id(),
                          name,
                          request->hold(),
                          request->str_uattrs(),
                          att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualRouterAttachNicGRPC::request_execute(const google::protobuf::Message* _request,
                                                 google::protobuf::Message*       _response,
                                                 RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vrouter::AttachNicRequest*>(_request);

    int oid = request->oid();
    std::string tmpl = request->template_();

    auto ec = attach_nic(oid, tmpl, att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualRouterDetachNicGRPC::request_execute(const google::protobuf::Message* _request,
                                                 google::protobuf::Message*       _response,
                                                 RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vrouter::DetachNicRequest*>(_request);

    int oid = request->oid();

    auto ec = detach_nic(oid,
                         request->nic_id(),
                         att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualRouterLockGRPC::request_execute(const google::protobuf::Message* _request,
                                            google::protobuf::Message*       _response,
                                            RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vrouter::LockRequest*>(_request);

    int oid = request->oid();

    auto ec = lock(oid,
        request->level(),
        request->test(),
        att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualRouterUnlockGRPC::request_execute(const google::protobuf::Message* _request,
                                              google::protobuf::Message*       _response,
                                              RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vrouter::UnlockRequest*>(_request);

    int oid = request->oid();

    auto ec = unlock(oid, att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualRouterChownGRPC::request_execute(const google::protobuf::Message* _request,
                                             google::protobuf::Message*       _response,
                                             RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vrouter::ChownRequest*>(_request);

    int oid = request->oid();

    auto ec = chown(oid,
                    request->user_id(),
                    request->group_id(),
                    att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VirtualRouterChmodGRPC::request_execute(const google::protobuf::Message* _request,
                                             google::protobuf::Message*       _response,
                                             RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vrouter::ChmodRequest*>(_request);

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

void VirtualRouterInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                            google::protobuf::Message*       _response,
                                            RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vrouter::InfoRequest*>(_request);

    std::string xml;

    auto ec = info(request->oid(),
                   request->decrypt(),
                   xml,
                   att);

    response(ec, xml, att);
}

/* ------------------------------------------------------------------------- */

void VirtualRouterPoolInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                                google::protobuf::Message*       _response,
                                                RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vrouter::PoolInfoRequest*>(_request);

    std::string xml;

    auto ec = info(request->filter_flag(),
                   request->start(),
                   request->end(),
                   xml,
                   att);

    response(ec, xml, att);
}
