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

#include "UserServiceGRPC.h"
#include "ClusterPool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

grpc::Status UserService::Allocate(grpc::ServerContext*              context,
                                   const one::user::AllocateRequest* request,
                                   one::ResponseID*                  response)
{

    return UserAllocateGRPC().execute(context, request, response);
}

grpc::Status UserService::Password(grpc::ServerContext* context,
                                   const one::user::PasswordRequest* request,
                                   one::ResponseID* response)
{
    return UserChangePasswordGRPC().execute(context, request, response);
}

grpc::Status UserService::ChangeAuth(grpc::ServerContext* context,
                                     const one::user::ChangeAuthRequest* request,
                                     one::ResponseID* response)
{
    return UserChangeAuthGRPC().execute(context, request, response);
}

grpc::Status UserService::Quota(grpc::ServerContext* context,
                                const one::user::QuotaRequest* request,
                                one::ResponseID* response)
{
    return UserSetQuotaGRPC().execute(context, request, response);
}

grpc::Status UserService::Enable(grpc::ServerContext* context,
                                 const one::user::EnableRequest* request,
                                 one::ResponseID* response)
{
    return UserEnableGRPC().execute(context, request, response);
}

grpc::Status UserService::Info(grpc::ServerContext* context,
                                 const one::user::InfoRequest* request,
                                 one::ResponseXML* response)
{
    return UserInfoGRPC().execute(context, request, response);
}

grpc::Status UserService::Delete(grpc::ServerContext* context,
                                 const one::user::DeleteRequest* request,
                                 one::ResponseID* response)
{
    return UserDeleteGRPC().execute(context, request, response);
}

grpc::Status UserService::Update(grpc::ServerContext* context,
                                 const one::user::UpdateRequest* request,
                                 one::ResponseID* response)
{
    return UserUpdateGRPC().execute(context, request, response);
}

grpc::Status UserService::Login(grpc::ServerContext* context,
                                const one::user::LoginRequest* request,
                                one::ResponseXML* response)
{
    return UserLoginGRPC().execute(context, request, response);
}

grpc::Status UserService::ChangeGroup(grpc::ServerContext* context,
                                      const one::user::ChangeGroupRequest* request,
                                      one::ResponseID* response)
{
    return UserChangeGroupGRPC().execute(context, request, response);
}

grpc::Status UserService::AddGroup(grpc::ServerContext* context,
                                   const one::user::AddGroupRequest* request,
                                   one::ResponseID* response)
{
    return UserAddGroupGRPC().execute(context, request, response);
}

grpc::Status UserService::DelGroup(grpc::ServerContext* context,
                                   const one::user::DelGroupRequest* request,
                                   one::ResponseID* response)
{
    return UserDelGroupGRPC().execute(context, request, response);
}

grpc::Status UserService::DefaultQuotaInfo(grpc::ServerContext* context,
                                           const one::user::PoolInfoRequest* request,
                                           one::ResponseXML* response)
{
    return UserQuotaInfoGRPC().execute(context, request, response);
}

grpc::Status UserService::DefaultQuotaUpdate(grpc::ServerContext* context,
                                             const one::user::DefaultQuotaUpdateRequest* request,
                                             one::ResponseXML* response)
{

    return UserQuotaUpdateGRPC().execute(context, request, response);
}

grpc::Status UserService::PoolInfo(grpc::ServerContext* context,
                                   const one::user::PoolInfoRequest* request,
                                   one::ResponseXML* response)
{
    return UserPoolInfoGRPC().execute(context, request, response);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void UserAllocateGRPC::request_execute(const google::protobuf::Message* _request,
                                       google::protobuf::Message*       _response,
                                       RequestAttributesGRPC&           att)
{
    auto request = static_cast<const one::user::AllocateRequest*>(_request);

    int oid;

    std::vector<int> group_ids(request->group_ids().begin(),
                               request->group_ids().end());

    auto ec = allocate(request->username(),
                       request->password(),
                       request->driver(),
                       group_ids,
                       ClusterPool::NONE_CLUSTER_ID,
                       oid,
                       att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void UserChangeGroupGRPC::request_execute(const google::protobuf::Message* _request,
                                       google::protobuf::Message*       _response,
                                       RequestAttributesGRPC&           att)
{
    auto request = static_cast<const one::user::ChangeGroupRequest*>(_request);

    int oid = request->oid();

    auto ec = chown(oid,
                    -1,
                    request->new_gid(),
                    att);

    response(ec, oid, att);
}


/* ------------------------------------------------------------------------- */

void UserChangePasswordGRPC::request_execute(const google::protobuf::Message* _request,
                                             google::protobuf::Message*       _response,
                                             RequestAttributesGRPC&           att)
{
    auto request = static_cast<const one::user::PasswordRequest*>(_request);

    int oid = request->oid();

    auto ec = password(oid,
                       request->new_password(),
                       att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void UserChangeAuthGRPC::request_execute(const google::protobuf::Message* _request,
                                         google::protobuf::Message*       _response,
                                         RequestAttributesGRPC&           att)
{
    auto request = static_cast<const one::user::ChangeAuthRequest*>(_request);

    int oid = request->oid();

    auto ec = change_auth(oid,
                         request->new_auth(),
                         request->new_password(),
                         att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void UserSetQuotaGRPC::request_execute(const google::protobuf::Message* _request,
                                       google::protobuf::Message*       _response,
                                       RequestAttributesGRPC&           att)
{
    auto request = static_cast<const one::user::QuotaRequest*>(_request);

    int oid = request->oid();

    auto ec = quota(oid,
                    request->quota(),
                    att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void UserEnableGRPC::request_execute(const google::protobuf::Message* _request,
                                     google::protobuf::Message*       _response,
                                     RequestAttributesGRPC&           att)
{
    auto request = static_cast<const one::user::EnableRequest*>(_request);

    int oid = request->oid();

    auto ec = enable(oid,
                     request->enable(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void UserLoginGRPC::request_execute(const google::protobuf::Message* _request,
                                    google::protobuf::Message*       _response,
                                    RequestAttributesGRPC&           att)
{
    auto request = static_cast<const one::user::LoginRequest*>(_request);

    std::string token = request->token();

    auto ec = login(request->uname(),
                    token,
                    request->valid(),
                    request->egid(),
                    att);

    response(ec, token, att);
}

/* ------------------------------------------------------------------------- */

void UserInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                   google::protobuf::Message*       _response,
                                   RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::user::InfoRequest*>(_request);

    std::string xml;

    auto ec = info(request->oid(),
                   request->decrypt(),
                   xml,
                   att);

    response(ec, xml, att);
}

/* ------------------------------------------------------------------------- */

void UserDeleteGRPC::request_execute(const google::protobuf::Message* _request,
                                     google::protobuf::Message*       _response,
                                     RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::user::DeleteRequest*>(_request);

    int oid = request->oid();

    auto ec = del(oid, false, att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void UserUpdateGRPC::request_execute(const google::protobuf::Message* _request,
                                     google::protobuf::Message*       _response,
                                     RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::user::UpdateRequest*>(_request);

    int oid = request->oid();

    auto ec = update(request->oid(),
                     request->template_(),
                     request->append(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void UserAddGroupGRPC::request_execute(const google::protobuf::Message* _request,
                                       google::protobuf::Message*       _response,
                                       RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::user::AddGroupRequest*>(_request);

    int oid = request->oid();

    auto ec = add_group(oid,
                        request->group_id(),
                        att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void UserDelGroupGRPC::request_execute(const google::protobuf::Message* _request,
                                       google::protobuf::Message*       _response,
                                       RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::user::DelGroupRequest*>(_request);

    int oid = request->oid();

    auto ec = del_group(oid,
                        request->group_id(),
                        att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void UserQuotaInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                        google::protobuf::Message*       _response,
                                        RequestAttributesGRPC& att)
{
    std::string xml;

    auto ec = quota_info(xml, att);

    response(ec, xml, att);
}

/* ------------------------------------------------------------------------- */

void UserQuotaUpdateGRPC::request_execute(const google::protobuf::Message* _request,
                                          google::protobuf::Message*       _response,
                                          RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::user::DefaultQuotaUpdateRequest*>(_request);

    std::string quota_template = request->quota();

    auto ec = quota_update(quota_template, att);

    response(ec, quota_template, att);
}

/* ------------------------------------------------------------------------- */

void UserPoolInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                       google::protobuf::Message*       _response,
                                       RequestAttributesGRPC& att)
{
    std::string xml;

    auto ec = info(PoolSQL::ALL, -1, -1, xml, att);

    response(ec, xml, att);
}
