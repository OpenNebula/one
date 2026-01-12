
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

#include "DocumentServiceGRPC.h"
#include "ClusterPool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

grpc::Status DocumentService::Allocate(grpc::ServerContext*              context,
                                       const one::document::AllocateRequest* request,
                                       one::ResponseID*                  response)
{

    return DocumentAllocateGRPC().execute(context, request, response);
}

grpc::Status DocumentService::Delete(grpc::ServerContext* context,
                                     const one::document::DeleteRequest* request,
                                     one::ResponseID* response)
{
    return DocumentDeleteGRPC().execute(context, request, response);
}


grpc::Status DocumentService::Update(grpc::ServerContext* context,
                                     const one::document::UpdateRequest* request,
                                     one::ResponseID* response)
{
    return DocumentUpdateGRPC().execute(context, request, response);
}

grpc::Status DocumentService::Rename(grpc::ServerContext* context,
                                     const one::document::RenameRequest* request,
                                     one::ResponseID* response)
{
    return DocumentRenameGRPC().execute(context, request, response);
}

grpc::Status DocumentService::Chmod(grpc::ServerContext* context,
                                    const one::document::ChmodRequest* request,
                                    one::ResponseID* response)
{
    return DocumentChmodGRPC().execute(context, request, response);
}

grpc::Status DocumentService::Chown(grpc::ServerContext* context,
                                    const one::document::ChownRequest* request,
                                    one::ResponseID* response)
{
    return DocumentChownGRPC().execute(context, request, response);
}

grpc::Status DocumentService::Lock(grpc::ServerContext* context,
                                   const one::document::LockRequest* request,
                                   one::ResponseID* response)
{
    return DocumentLockGRPC().execute(context, request, response);
}

grpc::Status DocumentService::Unlock(grpc::ServerContext* context,
                                     const one::document::UnlockRequest* request,
                                     one::ResponseID* response)
{
    return DocumentUnlockGRPC().execute(context, request, response);
}

grpc::Status DocumentService::Clone(grpc::ServerContext* context,
                                    const one::document::CloneRequest* request,
                                    one::ResponseID* response)
{
    return DocumentCloneGRPC().execute(context, request, response);
}

grpc::Status DocumentService::Info(grpc::ServerContext* context,
                                   const one::document::InfoRequest* request,
                                   one::ResponseXML* response)
{
    return DocumentInfoGRPC().execute(context, request, response);
}

grpc::Status DocumentService::PoolInfo(grpc::ServerContext* context,
                                       const one::document::PoolInfoRequest* request,
                                       one::ResponseXML* response)
{
    return DocumentPoolInfoGRPC().execute(context, request, response);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void DocumentAllocateGRPC::request_execute(const google::protobuf::Message* _request,
                                       google::protobuf::Message*       _response,
                                       RequestAttributesGRPC&           att)
{
    auto request = static_cast<const one::document::AllocateRequest*>(_request);

    int oid;

    auto ec = allocate(request->template_(),
                       request->type(),
                       ClusterPool::NONE_CLUSTER_ID,
                       oid,
                       att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void DocumentDeleteGRPC::request_execute(const google::protobuf::Message* _request,
                                         google::protobuf::Message*       _response,
                                         RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::document::DeleteRequest*>(_request);

    int oid = request->oid();

    auto ec = del(oid, false, att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void DocumentUpdateGRPC::request_execute(const google::protobuf::Message* _request,
                                         google::protobuf::Message*       _response,
                                         RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::document::UpdateRequest*>(_request);

    int oid = request->oid();

    auto ec = update(request->oid(),
                     request->template_(),
                     request->append(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void DocumentRenameGRPC::request_execute(const google::protobuf::Message* _request,
                                         google::protobuf::Message*       _response,
                                         RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::document::RenameRequest*>(_request);

    int oid = request->oid();

    auto ec = rename(oid,
                     request->name(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void DocumentChmodGRPC::request_execute(const google::protobuf::Message* _request,
                                        google::protobuf::Message*       _response,
                                        RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::document::ChmodRequest*>(_request);

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

void DocumentChownGRPC::request_execute(const google::protobuf::Message* _request,
                                        google::protobuf::Message*       _response,
                                        RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::document::ChownRequest*>(_request);

    int oid = request->oid();

    auto ec = chown(oid,
                    request->user_id(),
                    request->group_id(),
                    att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void DocumentLockGRPC::request_execute(const google::protobuf::Message* _request,
                                       google::protobuf::Message*       _response,
                                       RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::document::LockRequest*>(_request);

    int oid = request->oid();

    auto ec = lock(oid,
                   request->level(),
                   request->test(),
                   att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void DocumentUnlockGRPC::request_execute(const google::protobuf::Message* _request,
                                         google::protobuf::Message*       _response,
                                         RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::document::UnlockRequest*>(_request);

    int oid = request->oid();

    auto ec = unlock(oid, att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void DocumentCloneGRPC::request_execute(const google::protobuf::Message* _request,
                                        google::protobuf::Message*       _response,
                                        RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::document::CloneRequest*>(_request);

    int new_id = -1;

    auto ec = clone(request->oid(),
                    request->name(),
                    false,           // recursive
                    "",
                    new_id,
                    att);

    response(ec, new_id, att);
}

/* ------------------------------------------------------------------------- */

void DocumentInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                       google::protobuf::Message*       _response,
                                       RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::document::InfoRequest*>(_request);

    std::string xml;

    auto ec = info(request->oid(),
                   request->decrypt(),
                   xml,
                   att);

    response(ec, xml, att);
}

/* ------------------------------------------------------------------------- */

void DocumentPoolInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                           google::protobuf::Message*       _response,
                                           RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::document::PoolInfoRequest*>(_request);

    int filter_flag = request->filter_flag();
    int start_id    = request->start_id();
    int end_id      = request->end_id();
    int type        = request->type();

    std::ostringstream oss;
    oss << "type = " << type;

    std::string xml;
    auto ec = dump(att, filter_flag, start_id, end_id, oss.str(), "", xml);

    response(ec, xml, att);
}
