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

#include "TemplateServiceGRPC.h"
#include "ClusterPool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

grpc::Status TemplateService::Allocate(grpc::ServerContext* context,
                                       const one::tmpl::AllocateRequest* request,
                                       one::ResponseID* response)
{
    return TemplateAllocateGRPC().execute(context, request, response);
}

grpc::Status TemplateService::Delete(grpc::ServerContext* context,
                                     const one::tmpl::DeleteRequest* request,
                                     one::ResponseID* response)
{
    return TemplateDeleteGRPC().execute(context, request, response);
}

grpc::Status TemplateService::Info(grpc::ServerContext* context,
                                   const one::tmpl::InfoRequest* request,
                                   one::ResponseXML* response)
{
    return TemplateInfoGRPC().execute(context, request, response);
}

grpc::Status TemplateService::Update(grpc::ServerContext* context,
                                     const one::tmpl::UpdateRequest* request,
                                     one::ResponseID* response)
{
    return TemplateUpdateGRPC().execute(context, request, response);
}

grpc::Status TemplateService::Rename(grpc::ServerContext* context,
                                     const one::tmpl::RenameRequest* request,
                                     one::ResponseID* response)
{
    return TemplateRenameGRPC().execute(context, request, response);
}

grpc::Status TemplateService::Clone(grpc::ServerContext* context,
                                    const one::tmpl::CloneRequest* request,
                                    one::ResponseID* response)
{
    return TemplateCloneGRPC().execute(context, request, response);
}

grpc::Status TemplateService::Instantiate(grpc::ServerContext* context,
                                          const one::tmpl::InstantiateRequest* request,
                                          one::ResponseID* response)
{
    return TemplateInstantiateGRPC().execute(context, request, response);
}

grpc::Status TemplateService::Chmod(grpc::ServerContext* context,
                                    const one::tmpl::ChmodRequest* request,
                                    one::ResponseID* response)
{
    return TemplateChmodGRPC().execute(context, request, response);
}

grpc::Status TemplateService::Chown(grpc::ServerContext* context,
                                    const one::tmpl::ChownRequest* request,
                                    one::ResponseID* response)
{
    return TemplateChownGRPC().execute(context, request, response);
}

grpc::Status TemplateService::Lock(grpc::ServerContext* context,
                                   const one::tmpl::LockRequest* request,
                                   one::ResponseID* response)
{
    return TemplateLockGRPC().execute(context, request, response);
}

grpc::Status TemplateService::Unlock(grpc::ServerContext* context,
                                     const one::tmpl::UnlockRequest* request,
                                     one::ResponseID* response)
{
    return TemplateUnlockGRPC().execute(context, request, response);
}

grpc::Status TemplateService::PoolInfo(grpc::ServerContext* context,
                                       const one::tmpl::PoolInfoRequest* request,
                                       one::ResponseXML* response)
{
    return TemplatePoolInfoGRPC().execute(context, request, response);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void TemplateAllocateGRPC::request_execute(const google::protobuf::Message* _request,
                                           google::protobuf::Message*       _response,
                                           RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::tmpl::AllocateRequest*>(_request);

    int oid;

    auto ec = allocate(request->template_(),
                       ClusterPool::NONE_CLUSTER_ID,
                       oid,
                       att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void TemplateDeleteGRPC::request_execute(const google::protobuf::Message* _request,
                                         google::protobuf::Message*       _response,
                                         RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::tmpl::DeleteRequest*>(_request);

    int oid = request->oid();

    auto ec = del(oid,
                  request->recursive(),
                  att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void TemplateInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                       google::protobuf::Message*       _response,
                                       RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::tmpl::InfoRequest*>(_request);

    std::string xml;

    auto ec = info(request->oid(),
                   request->extended(),
                   request->decrypt(),
                   xml,
                   att);

    response(ec, xml, att);
}

/* ------------------------------------------------------------------------- */

void TemplateUpdateGRPC::request_execute(const google::protobuf::Message* _request,
                                         google::protobuf::Message*       _response,
                                         RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::tmpl::UpdateRequest*>(_request);

    int oid = request->oid();

    auto ec = update(request->oid(),
                     request->template_(),
                     request->append(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void TemplateRenameGRPC::request_execute(const google::protobuf::Message* _request,
                                         google::protobuf::Message*       _response,
                                         RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::tmpl::RenameRequest*>(_request);

    int oid = request->oid();

    auto ec = rename(oid,
                     request->name(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void TemplateCloneGRPC::request_execute(const google::protobuf::Message* _request,
                                        google::protobuf::Message*       _response,
                                        RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::tmpl::CloneRequest*>(_request);

    int new_id = -1;

    auto ec = clone(request->oid(),
                    request->name(),
                    request->recursive(),
                    "",
                    false,
                    new_id,
                    att);

    response(ec, new_id, att);
}

/* ------------------------------------------------------------------------- */

void TemplateInstantiateGRPC::request_execute(const google::protobuf::Message* _request,
                                              google::protobuf::Message*       _response,
                                              RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::tmpl::InstantiateRequest*>(_request);

    int vid = -1;

    auto ec = instantiate(request->oid(),
                          request->name(),
                          request->hold(),
                          request->extra_template(),
                          request->persistent(),
                          vid,
                          att);

    response(ec, vid, att);
}

/* ------------------------------------------------------------------------- */

void TemplateChmodGRPC::request_execute(const google::protobuf::Message* _request,
                                        google::protobuf::Message*       _response,
                                        RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::tmpl::ChmodRequest*>(_request);

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
                    request->recursive(),
                    att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void TemplateChownGRPC::request_execute(const google::protobuf::Message* _request,
                                        google::protobuf::Message*       _response,
                                        RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::tmpl::ChownRequest*>(_request);

    int oid = request->oid();

    auto ec = chown(oid,
                    request->user_id(),
                    request->group_id(),
                    att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void TemplateLockGRPC::request_execute(const google::protobuf::Message* _request,
                                       google::protobuf::Message*       _response,
                                       RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::tmpl::LockRequest*>(_request);

    int oid = request->oid();

    auto ec = lock(oid,
                   request->level(),
                   request->test(),
                   att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void TemplateUnlockGRPC::request_execute(const google::protobuf::Message* _request,
                                         google::protobuf::Message*       _response,
                                         RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::tmpl::UnlockRequest*>(_request);

    int oid = request->oid();

    auto ec = unlock(oid,
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void TemplatePoolInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                           google::protobuf::Message*       _response,
                                           RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::tmpl::PoolInfoRequest*>(_request);

    std::string xml;

    auto ec = info(request->filter_flag(),
                   request->start(),
                   request->end(),
                   xml,
                   att);

    response(ec, xml, att);
}

