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

#ifndef GROUP_GRPC_H
#define GROUP_GRPC_H

#include "RequestGRPC.h"
#include "GroupAPI.h"
#include "GroupPoolAPI.h"

#include "group.grpc.pb.h"

#include <grpcpp/grpcpp.h>

class GroupService final : public one::group::GroupService::Service
{
    grpc::Status Allocate(grpc::ServerContext* context,
                          const one::group::AllocateRequest* request,
                          one::ResponseID* response) override;

    grpc::Status Delete(grpc::ServerContext* context,
                        const one::group::DeleteRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Quota(grpc::ServerContext* context,
                       const one::group::QuotaRequest* request,
                       one::ResponseID* response) override;

    grpc::Status Update(grpc::ServerContext* context,
                         const one::group::UpdateRequest* request,
                         one::ResponseID* response) override;

    grpc::Status AddAdmin(grpc::ServerContext* context,
                          const one::group::AddAdminRequest* request,
                          one::ResponseID* response) override;

    grpc::Status DelAdmin(grpc::ServerContext* context,
                          const one::group::DelAdminRequest* request,
                          one::ResponseID* response) override;

    grpc::Status Info(grpc::ServerContext* context,
                      const one::group::InfoRequest* request,
                      one::ResponseXML* response) override;

    grpc::Status DefaultQuotaInfo(grpc::ServerContext* context,
                                  const one::group::PoolInfoRequest* request,
                                  one::ResponseXML* response) override;

    grpc::Status DefaultQuotaUpdate(grpc::ServerContext* context,
                                    const one::group::DefaultQuotaUpdateRequest* request,
                                    one::ResponseXML* response) override;

    grpc::Status PoolInfo(grpc::ServerContext* context,
                          const one::group::PoolInfoRequest* request,
                          one::ResponseXML* response) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class GroupAllocateGRPC : public RequestGRPC, public GroupAllocateAPI
{
public:
    GroupAllocateGRPC() :
        RequestGRPC("one.group.allocate", "/one.group.GroupService/Allocate"),
        GroupAllocateAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class GroupDeleteGRPC : public RequestGRPC, public GroupAPI
{
public:
    GroupDeleteGRPC() :
        RequestGRPC("one.group.delete", "/one.group.GroupService/Delete"),
        GroupAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class GroupSetQuotaGRPC : public RequestGRPC, public GroupAPI
{
public:
    GroupSetQuotaGRPC() :
        RequestGRPC("one.group.quota", "/one.group.GroupService/Quota"),
        GroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class GroupUpdateGRPC : public RequestGRPC, public GroupAPI
{
public:
    GroupUpdateGRPC() :
        RequestGRPC("one.group.update", "/one.group.GroupService/Update"),
        GroupAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class GroupAddAdminGRPC : public RequestGRPC, public GroupAPI
{
public:
    GroupAddAdminGRPC() :
        RequestGRPC("one.group.addadmin", "/one.group.GroupService/AddAdmin"),
        GroupAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class GroupDelAdminGRPC : public RequestGRPC, public GroupAPI
{
public:
    GroupDelAdminGRPC() :
        RequestGRPC("one.group.deladmin", "/one.group.GroupService/DelAdmin"),
        GroupAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class GroupInfoGRPC : public RequestGRPC, public GroupInfoAPI
{
public:
    GroupInfoGRPC() :
        RequestGRPC("one.group.info", "/one.group.GroupService/Info"),
        GroupInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class GroupQuotaInfoGRPC : public RequestGRPC, public GroupQuotaInfoAPI
{
public:
    GroupQuotaInfoGRPC() :
        RequestGRPC("one.groupquota.info", "/one.group.GroupService/QuotaInfo"),
        GroupQuotaInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class GroupQuotaUpdateGRPC : public RequestGRPC, public GroupAPI
{
public:
    GroupQuotaUpdateGRPC() :
        RequestGRPC("one.groupquota.update", "/one.group.GroupService/QuotaUpdate"),
        GroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class GroupPoolInfoGRPC : public RequestGRPC, public GroupPoolAPI
{
public:
    GroupPoolInfoGRPC() :
        RequestGRPC("one.grouppool.info", "/one.group.GroupService/PoolInfo"),
        GroupPoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

#endif
