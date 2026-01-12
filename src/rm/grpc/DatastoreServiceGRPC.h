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

#ifndef DATASTORE_GRPC_H
#define DATASTORE_GRPC_H

#include "RequestGRPC.h"
#include "DatastoreAPI.h"
#include "DatastorePoolAPI.h"

#include "datastore.grpc.pb.h"

#include <grpcpp/grpcpp.h>

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DatastoreService final : public one::datastore::DatastoreService::Service
{
    grpc::Status Allocate(grpc::ServerContext* context,
                          const one::datastore::AllocateRequest* request,
                          one::ResponseID* response) override;

    grpc::Status Delete(grpc::ServerContext* context,
                        const one::datastore::DeleteRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Info(grpc::ServerContext* context,
                      const one::datastore::InfoRequest* request,
                      one::ResponseXML* response) override;

    grpc::Status Update(grpc::ServerContext* context,
                        const one::datastore::UpdateRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Rename(grpc::ServerContext* context,
                        const one::datastore::RenameRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Chmod(grpc::ServerContext* context,
                       const one::datastore::ChmodRequest* request,
                       one::ResponseID* response) override;

    grpc::Status Chown(grpc::ServerContext* context,
                       const one::datastore::ChownRequest* request,
                       one::ResponseID* response) override;

    grpc::Status Enable(grpc::ServerContext* context,
                        const one::datastore::EnableRequest* request,
                        one::ResponseID* response) override;

    grpc::Status PoolInfo(grpc::ServerContext* context,
                          const one::datastore::PoolInfoRequest* request,
                          one::ResponseXML* response) override;

};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DatastoreAllocateGRPC : public RequestGRPC, public DatastoreAllocateAPI
{
public:
    DatastoreAllocateGRPC() :
        RequestGRPC("one.datastore.allocate", "/one.datastore.DatastoreService/Allocate"),
        DatastoreAllocateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class DatastoreDeleteGRPC : public RequestGRPC, public DatastoreAPI
{
public:
    DatastoreDeleteGRPC() :
        RequestGRPC("one.datastore.delete", "/one.datastore.DatastoreService/Delete"),
        DatastoreAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class DatastoreInfoGRPC : public RequestGRPC, public DatastoreInfoAPI
{
public:
    DatastoreInfoGRPC() :
        RequestGRPC("one.datastore.info", "/one.datastore.DatastoreService/Info"),
        DatastoreInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class DatastoreUpdateGRPC : public RequestGRPC, public DatastoreAPI
{
public:
    DatastoreUpdateGRPC() :
        RequestGRPC("one.datastore.update", "/one.datastore.DatastoreService/Update"),
        DatastoreAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class DatastoreRenameGRPC : public RequestGRPC, public DatastoreAPI
{
public:
    DatastoreRenameGRPC() :
        RequestGRPC("one.datastore.rename", "/one.datastore.DatastoreService/Rename"),
        DatastoreAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class DatastoreChmodGRPC : public RequestGRPC, public DatastoreAPI
{
public:
    DatastoreChmodGRPC() :
        RequestGRPC("one.datastore.chmod", "/one.datastore.DatastoreService/Chmod"),
        DatastoreAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class DatastoreChownGRPC : public RequestGRPC, public DatastoreAPI
{
public:
    DatastoreChownGRPC() :
        RequestGRPC("one.datastore.chown", "/one.datastore.DatastoreService/Chown"),
        DatastoreAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class DatastoreEnableGRPC : public RequestGRPC, public DatastoreAPI
{
public:
    DatastoreEnableGRPC() :
        RequestGRPC("one.datastore.enable", "/one.datastore.DatastoreService/Enable"),
        DatastoreAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DatastorePoolInfoGRPC : public RequestGRPC, public DatastorePoolAPI
{
public:
    DatastorePoolInfoGRPC() :
        RequestGRPC("one.datastorepool.info", "/one.datastore.DatastoreService/PoolInfo"),
        DatastorePoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

#endif
