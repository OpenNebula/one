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

#include "VNTemplateServiceGRPC.h"
#include "ClusterPool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

grpc::Status VNTemplateService::Allocate(grpc::ServerContext* context,
                                         const one::vntemplate::AllocateRequest* request,
                                         one::ResponseID* response)
{
    return VNTemplateAllocateGRPC().execute(context, request, response);
}

grpc::Status VNTemplateService::Delete(grpc::ServerContext* context,
                                       const one::vntemplate::DeleteRequest* request,
                                       one::ResponseID* response)
{
    return VNTemplateDeleteGRPC().execute(context, request, response);
}

grpc::Status VNTemplateService::Info(grpc::ServerContext* context,
                                     const one::vntemplate::InfoRequest* request,
                                     one::ResponseXML* response)
{
    return VNTemplateInfoGRPC().execute(context, request, response);
}

grpc::Status VNTemplateService::Update(grpc::ServerContext* context,
                                       const one::vntemplate::UpdateRequest* request,
                                       one::ResponseID* response)
{
    return VNTemplateUpdateGRPC().execute(context, request, response);
}

grpc::Status VNTemplateService::Rename(grpc::ServerContext* context,
                                       const one::vntemplate::RenameRequest* request,
                                       one::ResponseID* response)
{
    return VNTemplateRenameGRPC().execute(context, request, response);
}

grpc::Status VNTemplateService::Chmod(grpc::ServerContext* context,
                                      const one::vntemplate::ChmodRequest* request,
                                      one::ResponseID* response)
{
    return VNTemplateChmodGRPC().execute(context, request, response);
}

grpc::Status VNTemplateService::Chown(grpc::ServerContext* context,
                                      const one::vntemplate::ChownRequest* request,
                                      one::ResponseID* response)
{
    return VNTemplateChownGRPC().execute(context, request, response);
}

grpc::Status VNTemplateService::Lock(grpc::ServerContext* context,
                                     const one::vntemplate::LockRequest* request,
                                     one::ResponseID* response)
{
    return VNTemplateLockGRPC().execute(context, request, response);
}

grpc::Status VNTemplateService::Unlock(grpc::ServerContext* context,
                                       const one::vntemplate::UnlockRequest* request,
                                       one::ResponseID* response)
{
    return VNTemplateUnlockGRPC().execute(context, request, response);
}

grpc::Status VNTemplateService::Clone(grpc::ServerContext* context,
                                      const one::vntemplate::CloneRequest* request,
                                      one::ResponseID* response)
{
    return VNTemplateCloneGRPC().execute(context, request, response);
}

grpc::Status VNTemplateService::Instantiate(grpc::ServerContext* context,
                                            const one::vntemplate::InstantiateRequest* request,
                                            one::ResponseID* response)
{
    return VNTemplateInstantiateGRPC().execute(context, request, response);
}

grpc::Status VNTemplateService::PoolInfo(grpc::ServerContext* context,
                                         const one::vntemplate::PoolInfoRequest* request,
                                         one::ResponseXML* response)
{
    return VNTemplatePoolInfoGRPC().execute(context, request, response);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void VNTemplateAllocateGRPC::request_execute(const google::protobuf::Message* _request,
                                             google::protobuf::Message*       _response,
                                             RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vntemplate::AllocateRequest*>(_request);

    int oid;

    auto ec = allocate(request->template_(),
                       ClusterPool::NONE_CLUSTER_ID,
                       oid,
                       att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VNTemplateDeleteGRPC::request_execute(const google::protobuf::Message* _request,
                                           google::protobuf::Message*       _response,
                                           RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vntemplate::DeleteRequest*>(_request);

    int oid = request->oid();

    auto ec = del(oid, false, att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VNTemplateInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                         google::protobuf::Message*       _response,
                                         RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vntemplate::InfoRequest*>(_request);

    std::string xml;

    auto ec = info(request->oid(),
                   request->decrypt(),
                   xml,
                   att);

    response(ec, xml, att);
}

/* ------------------------------------------------------------------------- */

void VNTemplateUpdateGRPC::request_execute(const google::protobuf::Message* _request,
                                           google::protobuf::Message*       _response,
                                           RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vntemplate::UpdateRequest*>(_request);

    int oid = request->oid();

    auto ec = update(request->oid(),
                     request->template_(),
                     request->append(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VNTemplateRenameGRPC::request_execute(const google::protobuf::Message* _request,
                                           google::protobuf::Message*       _response,
                                           RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vntemplate::RenameRequest*>(_request);

    int oid = request->oid();

    auto ec = rename(oid,
                     request->name(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VNTemplateChmodGRPC::request_execute(const google::protobuf::Message* _request,
                                          google::protobuf::Message*       _response,
                                          RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vntemplate::ChmodRequest*>(_request);

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

void VNTemplateChownGRPC::request_execute(const google::protobuf::Message* _request,
                                          google::protobuf::Message*       _response,
                                          RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vntemplate::ChownRequest*>(_request);

    int oid = request->oid();

    auto ec = chown(oid,
                    request->user_id(),
                    request->group_id(),
                    att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VNTemplateLockGRPC::request_execute(const google::protobuf::Message* _request,
                                         google::protobuf::Message*       _response,
                                         RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vntemplate::LockRequest*>(_request);

    int oid = request->oid();

    auto ec = lock(oid,
                   request->level(),
                   request->test(),
                   att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VNTemplateUnlockGRPC::request_execute(const google::protobuf::Message* _request,
                                           google::protobuf::Message*       _response,
                                           RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vntemplate::UnlockRequest*>(_request);

    int oid = request->oid();

    auto ec = unlock(oid,
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VNTemplateCloneGRPC::request_execute(const google::protobuf::Message* _request,
                                          google::protobuf::Message*       _response,
                                          RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vntemplate::CloneRequest*>(_request);

    int new_id = -1;

    auto ec = clone(request->oid(),
                    request->name(),
                    false,
                    "",
                    new_id,
                    att);

    response(ec, new_id, att);
}

/* ------------------------------------------------------------------------- */

void VNTemplateInstantiateGRPC::request_execute(const google::protobuf::Message* _request,
                                                google::protobuf::Message*       _response,
                                                RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vntemplate::InstantiateRequest*>(_request);

    int net_id = -1;

    auto ec = instantiate(request->oid(),
                          request->name(),
                          request->extra_template(),
                          net_id,
                          att);

    response(ec, net_id, att);
}

/* ------------------------------------------------------------------------- */

void VNTemplatePoolInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                             google::protobuf::Message*       _response,
                                             RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vntemplate::PoolInfoRequest*>(_request);

    std::string xml;

    auto ec = info(request->filter_flag(),
                   request->start(),
                   request->end(),
                   xml,
                   att);

    response(ec, xml, att);
}
