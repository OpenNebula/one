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

#include "GroupServiceGRPC.h"
#include "ClusterPool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

grpc::Status GroupService::Allocate(grpc::ServerContext*              context,
                                    const one::group::AllocateRequest* request,
                                    one::ResponseID*                  response)
{

    return GroupAllocateGRPC().execute(context, request, response);
}

grpc::Status GroupService::Delete(grpc::ServerContext* context,
                                  const one::group::DeleteRequest* request,
                                  one::ResponseID* response)
{
    return GroupDeleteGRPC().execute(context, request, response);
}

grpc::Status GroupService::Quota(grpc::ServerContext* context,
                                 const one::group::QuotaRequest* request,
                                 one::ResponseID* response)
{
    return GroupSetQuotaGRPC().execute(context, request, response);
}

grpc::Status GroupService::Update(grpc::ServerContext* context,
                                  const one::group::UpdateRequest* request,
                                  one::ResponseID* response)
{
    return GroupUpdateGRPC().execute(context, request, response);
}

grpc::Status GroupService::AddAdmin(grpc::ServerContext* context,
                                    const one::group::AddAdminRequest* request,
                                    one::ResponseID* response)
{
    return GroupAddAdminGRPC().execute(context, request, response);
}

grpc::Status GroupService::DelAdmin(grpc::ServerContext* context,
                                    const one::group::DelAdminRequest* request,
                                    one::ResponseID* response)
{
    return GroupDelAdminGRPC().execute(context, request, response);
}

grpc::Status GroupService::Info(grpc::ServerContext* context,
                                const one::group::InfoRequest* request,
                                one::ResponseXML* response)
{
    return GroupInfoGRPC().execute(context, request, response);
}

grpc::Status GroupService::DefaultQuotaInfo(grpc::ServerContext* context,
                                            const one::group::PoolInfoRequest* request,
                                            one::ResponseXML* response)
{
    return GroupQuotaInfoGRPC().execute(context, request, response);
}

grpc::Status GroupService::DefaultQuotaUpdate(grpc::ServerContext* context,
                                              const one::group::DefaultQuotaUpdateRequest* request,
                                              one::ResponseXML* response)
{

    return GroupQuotaUpdateGRPC().execute(context, request, response);
}

grpc::Status GroupService::PoolInfo(grpc::ServerContext* context,
                                    const one::group::PoolInfoRequest* request,
                                    one::ResponseXML* response)
{
    return GroupPoolInfoGRPC().execute(context, request, response);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void GroupAllocateGRPC::request_execute(const google::protobuf::Message* _request,
                                        google::protobuf::Message*       _response,
                                        RequestAttributesGRPC&           att)
{
    auto request = static_cast<const one::group::AllocateRequest*>(_request);

    int oid;

    auto ec = allocate(request->gname(),
                       ClusterPool::NONE_CLUSTER_ID,
                       oid,
                       att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void GroupDeleteGRPC::request_execute(const google::protobuf::Message* _request,
                                      google::protobuf::Message*       _response,
                                      RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::group::DeleteRequest*>(_request);

    int oid = request->oid();

    auto ec = del(oid, false, att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void GroupSetQuotaGRPC::request_execute(const google::protobuf::Message* _request,
                                        google::protobuf::Message*       _response,
                                        RequestAttributesGRPC&           att)
{
    auto request = static_cast<const one::group::QuotaRequest*>(_request);

    int oid = request->oid();

    auto ec = quota(oid,
                    request->quota(),
                    att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void GroupUpdateGRPC::request_execute(const google::protobuf::Message* _request,
                                      google::protobuf::Message*       _response,
                                      RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::group::UpdateRequest*>(_request);

    int oid = request->oid();

    auto ec = update(request->oid(),
                     request->template_(),
                     request->append(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void GroupAddAdminGRPC::request_execute(const google::protobuf::Message* _request,
                                        google::protobuf::Message*       _response,
                                        RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::group::AddAdminRequest*>(_request);

    int oid = request->oid();

    auto ec = add_admin(oid,
                        request->user_id(),
                        att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void GroupDelAdminGRPC::request_execute(const google::protobuf::Message* _request,
                                        google::protobuf::Message*       _response,
                                        RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::group::DelAdminRequest*>(_request);

    int oid = request->oid();

    auto ec = del_admin(oid,
                        request->user_id(),
                        att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void GroupInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                    google::protobuf::Message*       _response,
                                    RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::group::InfoRequest*>(_request);

    std::string xml;

    auto ec = info(request->oid(),
                   request->decrypt(),
                   xml,
                   att);

    response(ec, xml, att);
}

/* ------------------------------------------------------------------------- */

void GroupQuotaInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                         google::protobuf::Message*       _response,
                                         RequestAttributesGRPC& att)
{
    std::string xml;

    auto ec = quota_info(xml, att);

    response(ec, xml, att);
}

/* ------------------------------------------------------------------------- */

void GroupQuotaUpdateGRPC::request_execute(const google::protobuf::Message* _request,
                                           google::protobuf::Message*       _response,
                                           RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::group::DefaultQuotaUpdateRequest*>(_request);

    std::string quota_template = request->quota();

    auto ec = quota_update(quota_template, att);

    response(ec, quota_template, att);
}
/* ------------------------------------------------------------------------- */

void GroupPoolInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                        google::protobuf::Message*       _response,
                                        RequestAttributesGRPC& att)
{
    std::string xml;

    auto ec = info(PoolSQL::ALL, -1, -1, xml, att);

    response(ec, xml, att);
}
