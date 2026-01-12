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

#ifndef MARKETPLACEAPP_GRPC_H
#define MARKETPLACEAPP_GRPC_H

#include "RequestGRPC.h"
#include "MarketPlaceAppAPI.h"
#include "MarketPlaceAppPoolAPI.h"

#include "marketplaceapp.grpc.pb.h"

#include <grpcpp/grpcpp.h>

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceAppService final : public one::marketapp::MarketPlaceAppService::Service
{
    grpc::Status Allocate(grpc::ServerContext* context,
                          const one::marketapp::AllocateRequest* request,
                          one::ResponseID* response) override;

    grpc::Status Delete(grpc::ServerContext* context,
                        const one::marketapp::DeleteRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Info(grpc::ServerContext* context,
                      const one::marketapp::InfoRequest* request,
                      one::ResponseXML* response) override;

    grpc::Status Update(grpc::ServerContext* context,
                        const one::marketapp::UpdateRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Rename(grpc::ServerContext* context,
                        const one::marketapp::RenameRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Chmod(grpc::ServerContext* context,
                       const one::marketapp::ChmodRequest* request,
                       one::ResponseID* response) override;

    grpc::Status Chown(grpc::ServerContext* context,
                       const one::marketapp::ChownRequest* request,
                       one::ResponseID* response) override;

    grpc::Status Enable(grpc::ServerContext* context,
                        const one::marketapp::EnableRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Lock(grpc::ServerContext* context,
                      const one::marketapp::LockRequest* request,
                      one::ResponseID* response) override;

    grpc::Status Unlock(grpc::ServerContext* context,
                        const one::marketapp::UnlockRequest* request,
                        one::ResponseID* response) override;

    grpc::Status AllocateDB(grpc::ServerContext* context,
                            const one::marketapp::AllocateDBRequest* request,
                            one::ResponseID* response) override;

    grpc::Status UpdateDB(grpc::ServerContext* context,
                          const one::marketapp::UpdateDBRequest* request,
                          one::ResponseID* response) override;

    grpc::Status DropDB(grpc::ServerContext* context,
                        const one::marketapp::DropDBRequest* request,
                        one::ResponseID* response) override;

    grpc::Status PoolInfo(grpc::ServerContext* context,
                          const one::marketapp::PoolInfoRequest* request,
                          one::ResponseXML* response) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceAppAllocateGRPC : public RequestGRPC, public MarketPlaceAppAllocateAPI
{
public:
    MarketPlaceAppAllocateGRPC() :
        RequestGRPC("one.marketapp.allocate", "/one.marketapp.MarketPlaceAppService/Allocate"),
        MarketPlaceAppAllocateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class MarketPlaceAppDeleteGRPC : public RequestGRPC, public MarketPlaceAppAPI
{
public:
    MarketPlaceAppDeleteGRPC() :
        RequestGRPC("one.marketapp.delete", "/one.marketapp.MarketPlaceAppService/Delete"),
        MarketPlaceAppAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class MarketPlaceAppInfoGRPC : public RequestGRPC, public MarketPlaceAppInfoAPI
{
public:
    MarketPlaceAppInfoGRPC() :
        RequestGRPC("one.marketapp.info", "/one.marketapp.MarketPlaceAppService/Info"),
        MarketPlaceAppInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class MarketPlaceAppUpdateGRPC : public RequestGRPC, public MarketPlaceAppAPI
{
public:
    MarketPlaceAppUpdateGRPC() :
        RequestGRPC("one.marketapp.update", "/one.marketapp.MarketPlaceAppService/Update"),
        MarketPlaceAppAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class MarketPlaceAppRenameGRPC : public RequestGRPC, public MarketPlaceAppAPI
{
public:
    MarketPlaceAppRenameGRPC() :
        RequestGRPC("one.marketapp.rename", "/one.marketapp.MarketPlaceAppService/Rename"),
        MarketPlaceAppAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class MarketPlaceAppChmodGRPC : public RequestGRPC, public MarketPlaceAppAPI
{
public:
    MarketPlaceAppChmodGRPC() :
        RequestGRPC("one.marketapp.chmod", "/one.marketapp.MarketPlaceAppService/Chmod"),
        MarketPlaceAppAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class MarketPlaceAppChownGRPC : public RequestGRPC, public MarketPlaceAppAPI
{
public:
    MarketPlaceAppChownGRPC() :
        RequestGRPC("one.marketapp.chown", "/one.marketapp.MarketPlaceAppService/Chown"),
        MarketPlaceAppAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class MarketPlaceAppEnableGRPC : public RequestGRPC, public MarketPlaceAppAPI
{
public:
    MarketPlaceAppEnableGRPC() :
        RequestGRPC("one.marketapp.enable", "/one.marketapp.MarketPlaceAppService/Enable"),
        MarketPlaceAppAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class MarketPlaceAppLockGRPC : public RequestGRPC, public MarketPlaceAppAPI
{
public:
    MarketPlaceAppLockGRPC() :
        RequestGRPC("one.marketapp.lock", "/one.marketapp.MarketPlaceAppService/Lock"),
        MarketPlaceAppAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class MarketPlaceAppUnlockGRPC : public RequestGRPC, public MarketPlaceAppAPI
{
public:
    MarketPlaceAppUnlockGRPC() :
        RequestGRPC("one.marketapp.unlock", "/one.marketapp.MarketPlaceAppService/Unlock"),
        MarketPlaceAppAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class MarketPlaceAppAllocateDBGRPC : public RequestGRPC, public MarketPlaceAppAllocateDBAPI
{
public:
    MarketPlaceAppAllocateDBGRPC() :
        RequestGRPC("one.marketapp.allocatedb", "/one.marketapp.MarketPlaceAppService/AllocateDB"),
        MarketPlaceAppAllocateDBAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class MarketPlaceAppUpdateDBGRPC : public RequestGRPC, public MarketPlaceAppUpdateDBAPI
{
public:
    MarketPlaceAppUpdateDBGRPC() :
        RequestGRPC("one.marketapp.updatedb", "/one.marketapp.MarketPlaceAppService/UpdateDB"),
        MarketPlaceAppUpdateDBAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class MarketPlaceAppDropDBGRPC : public RequestGRPC, public MarketPlaceAppDropDBAPI
{
public:
    MarketPlaceAppDropDBGRPC() :
        RequestGRPC("one.marketapp.dropdb", "/one.marketapp.MarketPlaceAppService/DropDB"),
        MarketPlaceAppDropDBAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceAppPoolInfoGRPC : public RequestGRPC, public MarketPlaceAppPoolAPI
{
public:
    MarketPlaceAppPoolInfoGRPC() :
        RequestGRPC("one.marketpoolapp.info", "/one.marketapp.MarketPlaceAppService/PoolInfo"),
        MarketPlaceAppPoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

#endif
