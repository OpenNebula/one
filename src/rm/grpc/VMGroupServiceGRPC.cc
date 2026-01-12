
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

#include "VMGroupServiceGRPC.h"
#include "ClusterPool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

grpc::Status VMGroupService::Allocate(grpc::ServerContext*              context,
                                      const one::vmgroup::AllocateRequest* request,
                                      one::ResponseID*                  response)
{
    return VMGroupAllocateGRPC().execute(context, request, response);
}

grpc::Status VMGroupService::Delete(grpc::ServerContext* context,
                                    const one::vmgroup::DeleteRequest* request,
                                    one::ResponseID* response)
{
    return VMGroupDeleteGRPC().execute(context, request, response);
}

grpc::Status VMGroupService::Update(grpc::ServerContext* context,
                                    const one::vmgroup::UpdateRequest* request,
                                    one::ResponseID* response)
{
    return VMGroupUpdateGRPC().execute(context, request, response);
}

grpc::Status VMGroupService::Rename(grpc::ServerContext* context,
                                    const one::vmgroup::RenameRequest* request,
                                    one::ResponseID* response)
{
    return VMGroupRenameGRPC().execute(context, request, response);
}

grpc::Status VMGroupService::Chmod(grpc::ServerContext* context,
                                   const one::vmgroup::ChmodRequest* request,
                                   one::ResponseID* response)
{
    return VMGroupChmodGRPC().execute(context, request, response);
}

grpc::Status VMGroupService::Chown(grpc::ServerContext* context,
                                   const one::vmgroup::ChownRequest* request,
                                   one::ResponseID* response)
{
    return VMGroupChownGRPC().execute(context, request, response);
}

grpc::Status VMGroupService::Lock(grpc::ServerContext* context,
                                  const one::vmgroup::LockRequest* request,
                                  one::ResponseID* response)
{
    return VMGroupLockGRPC().execute(context, request, response);
}

grpc::Status VMGroupService::Unlock(grpc::ServerContext* context,
                                    const one::vmgroup::UnlockRequest* request,
                                    one::ResponseID* response)
{
    return VMGroupUnlockGRPC().execute(context, request, response);
}

grpc::Status VMGroupService::AddRole(grpc::ServerContext* context,
                                     const one::vmgroup::AddRoleRequest* request,
                                     one::ResponseID* response)
{
    return VMGroupAddRoleGRPC().execute(context, request, response);
}

grpc::Status VMGroupService::DelRole(grpc::ServerContext* context,
                                     const one::vmgroup::DelRoleRequest* request,
                                     one::ResponseID* response)
{
    return VMGroupDelRoleGRPC().execute(context, request, response);
}

grpc::Status VMGroupService::UpdateRole(grpc::ServerContext* context,
                                        const one::vmgroup::UpdateRoleRequest* request,
                                        one::ResponseID* response)
{
    return VMGroupUpdateRoleGRPC().execute(context, request, response);
}

grpc::Status VMGroupService::Info(grpc::ServerContext* context,
                                  const one::vmgroup::InfoRequest* request,
                                  one::ResponseXML* response)
{
    return VMGroupInfoGRPC().execute(context, request, response);
}

grpc::Status VMGroupService::PoolInfo(grpc::ServerContext* context,
                                      const one::vmgroup::PoolInfoRequest* request,
                                      one::ResponseXML* response)
{
    return VMGroupPoolInfoGRPC().execute(context, request, response);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void VMGroupAllocateGRPC::request_execute(const google::protobuf::Message* _request,
                                          google::protobuf::Message*       _response,
                                          RequestAttributesGRPC&           att)
{
    auto request = static_cast<const one::vmgroup::AllocateRequest*>(_request);

    int oid;

    auto ec = allocate(request->template_(),
                       ClusterPool::NONE_CLUSTER_ID,
                       oid,
                       att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VMGroupDeleteGRPC::request_execute(const google::protobuf::Message* _request,
                                        google::protobuf::Message*       _response,
                                        RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vmgroup::DeleteRequest*>(_request);

    int oid = request->oid();

    auto ec = del(oid, false, att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VMGroupUpdateGRPC::request_execute(const google::protobuf::Message* _request,
                                        google::protobuf::Message*       _response,
                                        RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vmgroup::UpdateRequest*>(_request);

    int oid = request->oid();

    auto ec = update(request->oid(),
                     request->template_(),
                     request->append(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VMGroupRenameGRPC::request_execute(const google::protobuf::Message* _request,
                                        google::protobuf::Message*       _response,
                                        RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vmgroup::RenameRequest*>(_request);

    int oid = request->oid();

    auto ec = rename(oid,
                     request->name(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VMGroupChmodGRPC::request_execute(const google::protobuf::Message* _request,
                                       google::protobuf::Message*       _response,
                                       RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vmgroup::ChmodRequest*>(_request);

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

void VMGroupChownGRPC::request_execute(const google::protobuf::Message* _request,
                                       google::protobuf::Message*       _response,
                                       RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vmgroup::ChownRequest*>(_request);

    int oid = request->oid();

    auto ec = chown(oid,
                    request->user_id(),
                    request->group_id(),
                    att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VMGroupLockGRPC::request_execute(const google::protobuf::Message* _request,
                                      google::protobuf::Message*       _response,
                                      RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vmgroup::LockRequest*>(_request);

    int oid = request->oid();

    auto ec = lock(oid,
                   request->level(),
                   request->test(),
                   att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VMGroupUnlockGRPC::request_execute(const google::protobuf::Message* _request,
                                        google::protobuf::Message*       _response,
                                        RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vmgroup::UnlockRequest*>(_request);

    int oid = request->oid();

    auto ec = unlock(oid, att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VMGroupAddRoleGRPC::request_execute(const google::protobuf::Message* _request,
                                         google::protobuf::Message*       _response,
                                         RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vmgroup::AddRoleRequest*>(_request);

    int oid = request->oid();

    auto ec = add_role(oid,
                       request->template_(),
                       att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VMGroupDelRoleGRPC::request_execute(const google::protobuf::Message* _request,
                                         google::protobuf::Message*       _response,
                                         RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vmgroup::DelRoleRequest*>(_request);

    int oid = request->oid();

    auto ec = del_role(oid,
                       request->role_id(),
                       att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VMGroupUpdateRoleGRPC::request_execute(const google::protobuf::Message* _request,
                                            google::protobuf::Message*       _response,
                                            RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vmgroup::UpdateRoleRequest*>(_request);

    int oid = request->oid();

    auto ec = update_role(oid,
                          request->role_id(),
                          request->template_(),
                          att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VMGroupInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                      google::protobuf::Message*       _response,
                                      RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vmgroup::InfoRequest*>(_request);

    std::string xml;

    auto ec = info(request->oid(),
                   request->decrypt(),
                   xml,
                   att);

    response(ec, xml, att);
}

/* ------------------------------------------------------------------------- */

void VMGroupPoolInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                          google::protobuf::Message*       _response,
                                          RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vmgroup::PoolInfoRequest*>(_request);

    std::string xml;

    auto ec = info(request->filter_flag(),
                   request->start(),
                   request->end(),
                   xml,
                   att);

    response(ec, xml, att);
}
