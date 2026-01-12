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

#ifndef VM_GROUP_GRPC_H
#define VM_GROUP_GRPC_H

#include "RequestGRPC.h"
#include "VMGroupAPI.h"
#include "VMGroupPoolAPI.h"

#include "vmgroup.grpc.pb.h"

#include <grpcpp/grpcpp.h>

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VMGroupService final : public one::vmgroup::VMGroupService::Service
{
    grpc::Status Allocate(grpc::ServerContext* context,
                          const one::vmgroup::AllocateRequest* request,
                          one::ResponseID* response) override;

    grpc::Status Delete(grpc::ServerContext* context,
                        const one::vmgroup::DeleteRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Update(grpc::ServerContext* context,
                        const one::vmgroup::UpdateRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Rename(grpc::ServerContext* context,
                        const one::vmgroup::RenameRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Chmod(grpc::ServerContext* context,
                       const one::vmgroup::ChmodRequest* request,
                       one::ResponseID* response) override;

    grpc::Status Chown(grpc::ServerContext* context,
                       const one::vmgroup::ChownRequest* request,
                       one::ResponseID* response) override;

    grpc::Status Lock(grpc::ServerContext* context,
                      const one::vmgroup::LockRequest* request,
                      one::ResponseID* response) override;

    grpc::Status Unlock(grpc::ServerContext* context,
                        const one::vmgroup::UnlockRequest* request,
                        one::ResponseID* response) override;

    grpc::Status AddRole(grpc::ServerContext* context,
                         const one::vmgroup::AddRoleRequest* request,
                         one::ResponseID* response) override;

    grpc::Status DelRole(grpc::ServerContext* context,
                         const one::vmgroup::DelRoleRequest* request,
                         one::ResponseID* response) override;

    grpc::Status UpdateRole(grpc::ServerContext* context,
                            const one::vmgroup::UpdateRoleRequest* request,
                            one::ResponseID* response) override;

    grpc::Status Info(grpc::ServerContext* context,
                      const one::vmgroup::InfoRequest* request,
                      one::ResponseXML* response) override;

    grpc::Status PoolInfo(grpc::ServerContext* context,
                          const one::vmgroup::PoolInfoRequest* request,
                          one::ResponseXML* response) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VMGroupAllocateGRPC : public RequestGRPC, public VMGroupAllocateAPI
{
public:
    VMGroupAllocateGRPC() :
        RequestGRPC("one.vmgroup.allocate", "/one.vmgroup.VMGroupService/Allocate"),
        VMGroupAllocateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VMGroupDeleteGRPC : public RequestGRPC, public VMGroupAPI
{
public:
    VMGroupDeleteGRPC() :
        RequestGRPC("one.vmgroup.delete", "/one.vmgroup.VMGroupService/Delete"),
        VMGroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VMGroupUpdateGRPC : public RequestGRPC, public VMGroupAPI
{
public:
    VMGroupUpdateGRPC() :
        RequestGRPC("one.vmgroup.update", "/one.vmgroup.VMGroupService/Update"),
        VMGroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VMGroupRenameGRPC : public RequestGRPC, public VMGroupAPI
{
public:
    VMGroupRenameGRPC() :
        RequestGRPC("one.vmgroup.rename", "/one.vmgroup.VMGroupService/Rename"),
        VMGroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VMGroupChmodGRPC : public RequestGRPC, public VMGroupAPI
{
public:
    VMGroupChmodGRPC() :
        RequestGRPC("one.vmgroup.chmod", "/one.vmgroup.VMGroupService/Chmod"),
        VMGroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VMGroupChownGRPC : public RequestGRPC, public VMGroupAPI
{
public:
    VMGroupChownGRPC() :
        RequestGRPC("one.vmgroup.chown", "/one.vmgroup.VMGroupService/Chown"),
        VMGroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VMGroupLockGRPC : public RequestGRPC, public VMGroupAPI
{
public:
    VMGroupLockGRPC() :
        RequestGRPC("one.vmgroup.lock", "/one.vmgroup.VMGroupService/Lock"),
        VMGroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VMGroupUnlockGRPC : public RequestGRPC, public VMGroupAPI
{
public:
    VMGroupUnlockGRPC() :
        RequestGRPC("one.vmgroup.unlock", "/one.vmgroup.VMGroupService/Unlock"),
        VMGroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VMGroupAddRoleGRPC : public RequestGRPC, public VMGroupAPI
{
public:
    VMGroupAddRoleGRPC() :
        RequestGRPC("one.vmgroup.roleadd", "/one.vmgroup.VMGroupService/AddRole"),
        VMGroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VMGroupDelRoleGRPC : public RequestGRPC, public VMGroupAPI
{
public:
    VMGroupDelRoleGRPC() :
        RequestGRPC("one.vmgroup.roledelete", "/one.vmgroup.VMGroupService/DelRole"),
        VMGroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VMGroupUpdateRoleGRPC : public RequestGRPC, public VMGroupAPI
{
public:
    VMGroupUpdateRoleGRPC() :
        RequestGRPC("one.vmgroup.roleupdate", "/one.vmgroup.VMGroupService/UpdateRole"),
        VMGroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VMGroupInfoGRPC : public RequestGRPC, public VMGroupInfoAPI
{
public:
    VMGroupInfoGRPC() :
        RequestGRPC("one.vmgroup.info", "/one.vmgroup.VMGroupService/Info"),
        VMGroupInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VMGroupPoolInfoGRPC : public RequestGRPC, public VMGroupPoolAPI
{
public:
    VMGroupPoolInfoGRPC() :
        RequestGRPC("one.vmgrouppool.info", "/one.vmgroup.VMGroupService/PoolInfo"),
        VMGroupPoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

#endif
