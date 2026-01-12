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

#ifndef USER_GRPC_H
#define USER_GRPC_H

#include "RequestGRPC.h"
#include "UserAPI.h"
#include "UserPoolAPI.h"

#include "user.grpc.pb.h"

#include <grpcpp/grpcpp.h>

class UserService final : public one::user::UserService::Service
{
    grpc::Status Allocate(grpc::ServerContext* context,
                          const one::user::AllocateRequest* request,
                          one::ResponseID* response) override;

    grpc::Status Update(grpc::ServerContext* context,
                         const one::user::UpdateRequest* request,
                         one::ResponseID* response) override;

    grpc::Status Login(grpc::ServerContext* context,
                       const one::user::LoginRequest* request,
                       one::ResponseXML* response) override;

    grpc::Status Delete(grpc::ServerContext* context,
                        const one::user::DeleteRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Enable(grpc::ServerContext* context,
                        const one::user::EnableRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Password(grpc::ServerContext* context,
                          const one::user::PasswordRequest* request,
                          one::ResponseID* response) override;

    grpc::Status ChangeAuth(grpc::ServerContext* context,
                            const one::user::ChangeAuthRequest* request,
                            one::ResponseID* response) override;

    grpc::Status Quota(grpc::ServerContext* context,
                       const one::user::QuotaRequest* request,
                       one::ResponseID* response) override;

    grpc::Status ChangeGroup(grpc::ServerContext* context,
                             const one::user::ChangeGroupRequest* request,
                             one::ResponseID* response) override;

    grpc::Status AddGroup(grpc::ServerContext* context,
                          const one::user::AddGroupRequest* request,
                          one::ResponseID* response) override;

    grpc::Status DelGroup(grpc::ServerContext* context,
                          const one::user::DelGroupRequest* request,
                          one::ResponseID* response) override;

    grpc::Status Info(grpc::ServerContext* context,
                      const one::user::InfoRequest* request,
                      one::ResponseXML* response) override;

    grpc::Status DefaultQuotaInfo(grpc::ServerContext* context,
                                  const one::user::PoolInfoRequest* request,
                                  one::ResponseXML* response) override;

    grpc::Status DefaultQuotaUpdate(grpc::ServerContext* context,
                                    const one::user::DefaultQuotaUpdateRequest* request,
                                    one::ResponseXML* response) override;

    grpc::Status PoolInfo(grpc::ServerContext* context,
                          const one::user::PoolInfoRequest* request,
                          one::ResponseXML* response) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class UserAllocateGRPC : public RequestGRPC, public UserAllocateAPI
{
public:
    UserAllocateGRPC() :
        RequestGRPC("one.user.allocate", "/one.user.UserService/Allocate"),
        UserAllocateAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class UserChangeGroupGRPC : public RequestGRPC, public UserAPI
{
public:
    UserChangeGroupGRPC() :
        RequestGRPC("one.user.chgrp", "/one.user.UserService/ChangeGroup"),
        UserAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};


/* ------------------------------------------------------------------------- */

class UserChangePasswordGRPC : public RequestGRPC, public UserChangePasswordAPI
{
public:
    UserChangePasswordGRPC() :
        RequestGRPC("one.user.passwd", "/one.user.UserService/Password"),
        UserChangePasswordAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class UserChangeAuthGRPC : public RequestGRPC, public UserChangeAuthAPI
{
public:
    UserChangeAuthGRPC() :
        RequestGRPC("one.user.chauth", "/one.user.UserService/ChangeAuth"),
        UserChangeAuthAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class UserSetQuotaGRPC : public RequestGRPC, public UserSetQuotaAPI
{
public:
    UserSetQuotaGRPC() :
        RequestGRPC("one.user.quota", "/one.user.UserService/Quota"),
        UserSetQuotaAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class UserEnableGRPC : public RequestGRPC, public UserEnableAPI
{
public:
    UserEnableGRPC() :
        RequestGRPC("one.user.enable", "/one.user.UserService/Enable"),
        UserEnableAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class UserLoginGRPC : public RequestGRPC, public UserLoginAPI
{
public:
    UserLoginGRPC() :
        RequestGRPC("one.user.login", "/one.user.UserService/Login"),
        UserLoginAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class UserInfoGRPC : public RequestGRPC, public UserInfoAPI
{
public:
    UserInfoGRPC() :
        RequestGRPC("one.user.info", "/one.user.UserService/Info"),
        UserInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class UserDeleteGRPC : public RequestGRPC, public UserDeleteAPI
{
public:
    UserDeleteGRPC() :
        RequestGRPC("one.user.delete", "/one.user.UserService/Delete"),
        UserDeleteAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class UserUpdateGRPC : public RequestGRPC, public UserAPI
{
public:
    UserUpdateGRPC() :
        RequestGRPC("one.user.update", "/one.user.UserService/Update"),
        UserAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class UserAddGroupGRPC : public RequestGRPC, public UserAPI
{
public:
    UserAddGroupGRPC() :
        RequestGRPC("one.user.addgroup", "/one.user.UserService/AddGroup"),
        UserAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class UserDelGroupGRPC : public RequestGRPC, public UserAPI
{
public:
    UserDelGroupGRPC() :
        RequestGRPC("one.user.delgroup", "/one.user.UserService/DelGroup"),
        UserAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class UserQuotaInfoGRPC : public RequestGRPC, public UserQuotaInfoAPI
{
public:
    UserQuotaInfoGRPC() :
        RequestGRPC("one.userquota.info", "/one.user.UserService/QuotaInfo"),
        UserQuotaInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class UserQuotaUpdateGRPC : public RequestGRPC, public UserAPI
{
public:
    UserQuotaUpdateGRPC() :
        RequestGRPC("one.userquota.update", "/one.user.UserService/QuotaUpdate"),
        UserAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class UserPoolInfoGRPC : public RequestGRPC, public UserPoolAPI
{
public:
    UserPoolInfoGRPC() :
        RequestGRPC("one.userpool.info", "/one.user.UserService/PoolInfo"),
        UserPoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

#endif
