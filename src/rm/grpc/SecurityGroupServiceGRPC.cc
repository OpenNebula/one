
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

#include "SecurityGroupServiceGRPC.h"
#include "ClusterPool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

grpc::Status SecurityGroupService::Allocate(grpc::ServerContext*              context,
                                            const one::secgroup::AllocateRequest* request,
                                            one::ResponseID*                  response)
{
    return SecurityGroupAllocateGRPC().execute(context, request, response);
}

grpc::Status SecurityGroupService::Delete(grpc::ServerContext* context,
                                          const one::secgroup::DeleteRequest* request,
                                          one::ResponseID* response)
{
    return SecurityGroupDeleteGRPC().execute(context, request, response);
}

grpc::Status SecurityGroupService::Update(grpc::ServerContext* context,
                                          const one::secgroup::UpdateRequest* request,
                                          one::ResponseID* response)
{
    return SecurityGroupUpdateGRPC().execute(context, request, response);
}

grpc::Status SecurityGroupService::Rename(grpc::ServerContext* context,
                                          const one::secgroup::RenameRequest* request,
                                          one::ResponseID* response)
{
    return SecurityGroupRenameGRPC().execute(context, request, response);
}

grpc::Status SecurityGroupService::Chmod(grpc::ServerContext* context,
                                         const one::secgroup::ChmodRequest* request,
                                         one::ResponseID* response)
{
    return SecurityGroupChmodGRPC().execute(context, request, response);
}

grpc::Status SecurityGroupService::Chown(grpc::ServerContext* context,
                                         const one::secgroup::ChownRequest* request,
                                         one::ResponseID* response)
{
    return SecurityGroupChownGRPC().execute(context, request, response);
}

grpc::Status SecurityGroupService::Clone(grpc::ServerContext* context,
                                         const one::secgroup::CloneRequest* request,
                                         one::ResponseID* response)
{
    return SecurityGroupCloneGRPC().execute(context, request, response);
}

grpc::Status SecurityGroupService::Commit(grpc::ServerContext* context,
                                          const one::secgroup::CommitRequest* request,
                                          one::ResponseID* response)
{
    return SecurityGroupCommitGRPC().execute(context, request, response);
}

grpc::Status SecurityGroupService::Info(grpc::ServerContext* context,
                                        const one::secgroup::InfoRequest* request,
                                        one::ResponseXML* response)
{
    return SecurityGroupInfoGRPC().execute(context, request, response);
}

grpc::Status SecurityGroupService::PoolInfo(grpc::ServerContext* context,
                                            const one::secgroup::PoolInfoRequest* request,
                                            one::ResponseXML* response)
{
    return SecurityGroupPoolInfoGRPC().execute(context, request, response);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void SecurityGroupAllocateGRPC::request_execute(const google::protobuf::Message* _request,
                                                google::protobuf::Message*       _response,
                                                RequestAttributesGRPC&           att)
{
    auto request = static_cast<const one::secgroup::AllocateRequest*>(_request);

    int oid;

    auto ec = allocate(request->template_(),
                       ClusterPool::NONE_CLUSTER_ID,
                       oid,
                       att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void SecurityGroupDeleteGRPC::request_execute(const google::protobuf::Message* _request,
                                              google::protobuf::Message*       _response,
                                              RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::secgroup::DeleteRequest*>(_request);

    int oid = request->oid();

    auto ec = del(oid, false, att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void SecurityGroupUpdateGRPC::request_execute(const google::protobuf::Message* _request,
                                              google::protobuf::Message*       _response,
                                              RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::secgroup::UpdateRequest*>(_request);

    int oid = request->oid();

    auto ec = update(request->oid(),
                     request->template_(),
                     request->append(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void SecurityGroupRenameGRPC::request_execute(const google::protobuf::Message* _request,
                                              google::protobuf::Message*       _response,
                                              RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::secgroup::RenameRequest*>(_request);

    int oid = request->oid();

    auto ec = rename(oid,
                     request->name(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void SecurityGroupChmodGRPC::request_execute(const google::protobuf::Message* _request,
                                             google::protobuf::Message*       _response,
                                             RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::secgroup::ChmodRequest*>(_request);

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

void SecurityGroupChownGRPC::request_execute(const google::protobuf::Message* _request,
                                             google::protobuf::Message*       _response,
                                             RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::secgroup::ChownRequest*>(_request);

    int oid = request->oid();

    auto ec = chown(oid,
                    request->user_id(),
                    request->group_id(),
                    att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void SecurityGroupCloneGRPC::request_execute(const google::protobuf::Message* _request,
                                             google::protobuf::Message*       _response,
                                             RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::secgroup::CloneRequest*>(_request);

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

void SecurityGroupCommitGRPC::request_execute(const google::protobuf::Message* _request,
                                              google::protobuf::Message*       _response,
                                              RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::secgroup::CommitRequest*>(_request);

    int oid = request->oid();

    auto ec = commit(oid,
                     request->recovery(),
                     att);

    response(ec,oid, att);
}

/* ------------------------------------------------------------------------- */

void SecurityGroupInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                            google::protobuf::Message*       _response,
                                            RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::secgroup::InfoRequest*>(_request);

    std::string xml;

    auto ec = info(request->oid(),
                   request->decrypt(),
                   xml,
                   att);

    response(ec, xml, att);
}

/* ------------------------------------------------------------------------- */

void SecurityGroupPoolInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                                google::protobuf::Message*       _response,
                                                RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::secgroup::PoolInfoRequest*>(_request);

    std::string xml;

    auto ec = info(request->filter_flag(),
                   request->start(),
                   request->end(),
                   xml,
                   att);

    response(ec, xml, att);
}
