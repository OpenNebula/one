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

#ifndef HOOK_GRPC_H
#define HOOK_GRPC_H

#include "RequestGRPC.h"
#include "RMHookAPI.h"
#include "HookPoolAPI.h"

#include "hook.grpc.pb.h"

#include <grpcpp/grpcpp.h>

class HookService final : public one::hook::HookService::Service
{
    grpc::Status Allocate(grpc::ServerContext* context,
                          const one::hook::AllocateRequest* request,
                          one::ResponseID* response) override;

    grpc::Status Delete(grpc::ServerContext* context,
                        const one::hook::DeleteRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Update(grpc::ServerContext* context,
                        const one::hook::UpdateRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Rename(grpc::ServerContext* context,
                        const one::hook::RenameRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Lock(grpc::ServerContext* context,
                      const one::hook::LockRequest* request,
                      one::ResponseID* response) override;

    grpc::Status Unlock(grpc::ServerContext* context,
                        const one::hook::UnlockRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Retry(grpc::ServerContext* context,
                       const one::hook::RetryRequest* request,
                       one::ResponseID* response) override;

    grpc::Status Info(grpc::ServerContext* context,
                      const one::hook::InfoRequest* request,
                      one::ResponseXML* response) override;

    grpc::Status PoolInfo(grpc::ServerContext* context,
                          const one::hook::PoolInfoRequest* request,
                          one::ResponseXML* response) override;

    grpc::Status LogInfo(grpc::ServerContext* context,
                         const one::hook::LogInfoRequest* request,
                         one::ResponseXML* response) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HookAllocateGRPC : public RequestGRPC, public RMHookAllocateAPI
{
public:
    HookAllocateGRPC() :
        RequestGRPC("one.hook.allocate", "/one.hook.HookService/Allocate"),
        RMHookAllocateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class HookDeleteGRPC : public RequestGRPC, public RMHookAPI
{
public:
    HookDeleteGRPC() :
        RequestGRPC("one.hook.delete", "/one.hook.HookService/Delete"),
        RMHookAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class HookUpdateGRPC : public RequestGRPC, public RMHookAPI
{
public:
    HookUpdateGRPC() :
        RequestGRPC("one.hook.update", "/one.hook.HookService/Update"),
        RMHookAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class HookRenameGRPC : public RequestGRPC, public RMHookAPI
{
public:
    HookRenameGRPC() :
        RequestGRPC("one.hook.rename", "/one.hook.HookService/Rename"),
        RMHookAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class HookLockGRPC : public RequestGRPC, public RMHookAPI
{
public:
    HookLockGRPC() :
        RequestGRPC("one.hook.lock", "/one.hook.HookService/Lock"),
        RMHookAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class HookUnlockGRPC : public RequestGRPC, public RMHookAPI
{
public:
    HookUnlockGRPC() :
        RequestGRPC("one.hook.unlock", "/one.hook.HookService/Unlock"),
        RMHookAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class HookRetryGRPC : public RequestGRPC, public RMHookAPI
{
public:
    HookRetryGRPC() :
        RequestGRPC("one.hook.retry", "/one.hook.HookService/Retry"),
        RMHookAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class HookInfoGRPC : public RequestGRPC, public RMHookInfoAPI
{
public:
    HookInfoGRPC() :
        RequestGRPC("one.hook.info", "/one.hook.HookService/Info"),
        RMHookInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class HookPoolInfoGRPC : public RequestGRPC, public HookPoolAPI
{
public:
    HookPoolInfoGRPC() :
        RequestGRPC("one.hookpool.info", "/one.hook.HookService/PoolInfo"),
        HookPoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* -------------------------------------------------------------------------- */

class HookPoolLogInfoGRPC : public RequestGRPC, public HookPoolAPI
{
public:
    HookPoolLogInfoGRPC() :
        RequestGRPC("one.hooklog.info", "/one.hook.HookService/LogInfo"),
        HookPoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

#endif
