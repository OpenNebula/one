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

#ifndef MARKETPLACE_GRPC_H
#define MARKETPLACE_GRPC_H

#include "RequestGRPC.h"
#include "MarketPlaceAPI.h"
#include "MarketPlacePoolAPI.h"

#include "marketplace.grpc.pb.h"

#include <grpcpp/grpcpp.h>

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceService final : public one::market::MarketPlaceService::Service
{
    grpc::Status Allocate(grpc::ServerContext* context,
                          const one::market::AllocateRequest* request,
                          one::ResponseID* response) override;

    grpc::Status Delete(grpc::ServerContext* context,
                        const one::market::DeleteRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Info(grpc::ServerContext* context,
                      const one::market::InfoRequest* request,
                      one::ResponseXML* response) override;

    grpc::Status Update(grpc::ServerContext* context,
                        const one::market::UpdateRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Rename(grpc::ServerContext* context,
                        const one::market::RenameRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Chmod(grpc::ServerContext* context,
                       const one::market::ChmodRequest* request,
                       one::ResponseID* response) override;

    grpc::Status Chown(grpc::ServerContext* context,
                       const one::market::ChownRequest* request,
                       one::ResponseID* response) override;

    grpc::Status Enable(grpc::ServerContext* context,
                        const one::market::EnableRequest* request,
                        one::ResponseID* response) override;

    grpc::Status AllocateDB(grpc::ServerContext* context,
                            const one::market::AllocateDBRequest* request,
                            one::ResponseID* response) override;

    grpc::Status UpdateDB(grpc::ServerContext* context,
                          const one::market::UpdateDBRequest* request,
                          one::ResponseID* response) override;

    grpc::Status PoolInfo(grpc::ServerContext* context,
                          const one::market::PoolInfoRequest* request,
                          one::ResponseXML* response) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceAllocateGRPC : public RequestGRPC, public MarketPlaceAllocateAPI
{
public:
    MarketPlaceAllocateGRPC() :
        RequestGRPC("one.market.allocate", "/one.market.MarketPlaceService/Allocate"),
        MarketPlaceAllocateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class MarketPlaceDeleteGRPC : public RequestGRPC, public MarketPlaceAPI
{
public:
    MarketPlaceDeleteGRPC() :
        RequestGRPC("one.market.delete", "/one.market.MarketPlaceService/Delete"),
        MarketPlaceAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class MarketPlaceInfoGRPC : public RequestGRPC, public MarketPlaceInfoAPI
{
public:
    MarketPlaceInfoGRPC() :
        RequestGRPC("one.market.info", "/one.market.MarketPlaceService/Info"),
        MarketPlaceInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class MarketPlaceUpdateGRPC : public RequestGRPC, public MarketPlaceAPI
{
public:
    MarketPlaceUpdateGRPC() :
        RequestGRPC("one.market.update", "/one.market.MarketPlaceService/Update"),
        MarketPlaceAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class MarketPlaceRenameGRPC : public RequestGRPC, public MarketPlaceAPI
{
public:
    MarketPlaceRenameGRPC() :
        RequestGRPC("one.market.rename", "/one.market.MarketPlaceService/Rename"),
        MarketPlaceAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class MarketPlaceChmodGRPC : public RequestGRPC, public MarketPlaceAPI
{
public:
    MarketPlaceChmodGRPC() :
        RequestGRPC("one.market.chmod", "/one.market.MarketPlaceService/Chmod"),
        MarketPlaceAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class MarketPlaceChownGRPC : public RequestGRPC, public MarketPlaceAPI
{
public:
    MarketPlaceChownGRPC() :
        RequestGRPC("one.market.chown", "/one.market.MarketPlaceService/Chown"),
        MarketPlaceAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class MarketPlaceEnableGRPC : public RequestGRPC, public MarketPlaceAPI
{
public:
    MarketPlaceEnableGRPC() :
        RequestGRPC("one.market.enable", "/one.market.MarketPlaceService/Enable"),
        MarketPlaceAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class MarketPlaceAllocateDBGRPC : public RequestGRPC, public MarketPlaceAllocateDBAPI
{
public:
    MarketPlaceAllocateDBGRPC() :
        RequestGRPC("one.market.allocatedb", "/one.market.MarketPlaceService/AllocateDB"),
        MarketPlaceAllocateDBAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class MarketPlaceUpdateDBGRPC : public RequestGRPC, public MarketPlaceUpdateDBAPI
{
public:
    MarketPlaceUpdateDBGRPC() :
        RequestGRPC("one.market.updatedb", "/one.market.MarketPlaceService/UpdateDB"),
        MarketPlaceUpdateDBAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlacePoolInfoGRPC : public RequestGRPC, public MarketPlacePoolAPI
{
public:
    MarketPlacePoolInfoGRPC() :
        RequestGRPC("one.marketpool.info", "/one.market.MarketPlaceService/PoolInfo"),
        MarketPlacePoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

#endif
