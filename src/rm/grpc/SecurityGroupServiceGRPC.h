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

#ifndef SECURITY_GROUP_GRPC_H
#define SECURITY_GROUP_GRPC_H

#include "RequestGRPC.h"
#include "SecurityGroupAPI.h"
#include "SecurityGroupPoolAPI.h"

#include "secgroup.grpc.pb.h"

#include <grpcpp/grpcpp.h>

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SecurityGroupService final : public one::secgroup::SecurityGroupService::Service
{
    grpc::Status Allocate(grpc::ServerContext* context,
                          const one::secgroup::AllocateRequest* request,
                          one::ResponseID* response) override;

    grpc::Status Delete(grpc::ServerContext* context,
                        const one::secgroup::DeleteRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Update(grpc::ServerContext* context,
                        const one::secgroup::UpdateRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Rename(grpc::ServerContext* context,
                        const one::secgroup::RenameRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Chmod(grpc::ServerContext* context,
                       const one::secgroup::ChmodRequest* request,
                       one::ResponseID* response) override;

    grpc::Status Chown(grpc::ServerContext* context,
                       const one::secgroup::ChownRequest* request,
                       one::ResponseID* response) override;

    grpc::Status Clone(grpc::ServerContext* context,
                       const one::secgroup::CloneRequest* request,
                       one::ResponseID* response) override;

    grpc::Status Commit(grpc::ServerContext* context,
                        const one::secgroup::CommitRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Info(grpc::ServerContext* context,
                      const one::secgroup::InfoRequest* request,
                      one::ResponseXML* response) override;

    grpc::Status PoolInfo(grpc::ServerContext* context,
                          const one::secgroup::PoolInfoRequest* request,
                          one::ResponseXML* response) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SecurityGroupAllocateGRPC : public RequestGRPC, public SecurityGroupAllocateAPI
{
public:
    SecurityGroupAllocateGRPC() :
        RequestGRPC("one.secgroup.allocate", "/one.secgroup.SecurityGroupService/Allocate"),
        SecurityGroupAllocateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class SecurityGroupDeleteGRPC : public RequestGRPC, public SecurityGroupAPI
{
public:
    SecurityGroupDeleteGRPC() :
        RequestGRPC("one.secgroup.delete", "/one.secgroup.SecurityGroupService/Delete"),
        SecurityGroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class SecurityGroupUpdateGRPC : public RequestGRPC, public SecurityGroupAPI
{
public:
    SecurityGroupUpdateGRPC() :
        RequestGRPC("one.secgroup.update", "/one.secgroup.SecurityGroupService/Update"),
        SecurityGroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class SecurityGroupRenameGRPC : public RequestGRPC, public SecurityGroupAPI
{
public:
    SecurityGroupRenameGRPC() :
        RequestGRPC("one.secgroup.rename", "/one.secgroup.SecurityGroupService/Rename"),
        SecurityGroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class SecurityGroupChmodGRPC : public RequestGRPC, public SecurityGroupAPI
{
public:
    SecurityGroupChmodGRPC() :
        RequestGRPC("one.secgroup.chmod", "/one.secgroup.SecurityGroupService/Chmod"),
        SecurityGroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class SecurityGroupChownGRPC : public RequestGRPC, public SecurityGroupAPI
{
public:
    SecurityGroupChownGRPC() :
        RequestGRPC("one.secgroup.chown", "/one.secgroup.SecurityGroupService/Chown"),
        SecurityGroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class SecurityGroupCloneGRPC : public RequestGRPC, public SecurityGroupAPI
{
public:
    SecurityGroupCloneGRPC() :
        RequestGRPC("one.secgroup.clone", "/one.secgroup.SecurityGroupService/Clone"),
        SecurityGroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class SecurityGroupCommitGRPC : public RequestGRPC, public SecurityGroupAPI
{
public:
    SecurityGroupCommitGRPC() :
        RequestGRPC("one.secgroup.commit", "/one.secgroup.SecurityGroupService/Commit"),
        SecurityGroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class SecurityGroupInfoGRPC : public RequestGRPC, public SecurityGroupInfoAPI
{
public:
    SecurityGroupInfoGRPC() :
        RequestGRPC("one.secgroup.info", "/one.secgroup.SecurityGroupService/Info"),
        SecurityGroupInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class SecurityGroupPoolInfoGRPC : public RequestGRPC, public SecurityGroupPoolAPI
{
public:
    SecurityGroupPoolInfoGRPC() :
        RequestGRPC("one.secgrouppool.info", "/one.secgroup.SecurityGroupService/PoolInfo"),
        SecurityGroupPoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

#endif
