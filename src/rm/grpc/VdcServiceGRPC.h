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

#ifndef VDC_GRPC_H
#define VDC_GRPC_H

#include "RequestGRPC.h"
#include "VdcAPI.h"
#include "VdcPoolAPI.h"

#include "vdc.grpc.pb.h"

#include <grpcpp/grpcpp.h>

class VdcService final : public one::vdc::VdcService::Service
{
    grpc::Status Allocate(grpc::ServerContext* context,
                          const one::vdc::AllocateRequest* request,
                          one::ResponseID* response) override;

    grpc::Status Delete(grpc::ServerContext* context,
                        const one::vdc::DeleteRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Update(grpc::ServerContext* context,
                        const one::vdc::UpdateRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Rename(grpc::ServerContext* context,
                        const one::vdc::RenameRequest* request,
                        one::ResponseID* response) override;

    grpc::Status AddGroup(grpc::ServerContext* context,
                          const one::vdc::AddGroupRequest* request,
                          one::ResponseID* response) override;

    grpc::Status DelGroup(grpc::ServerContext* context,
                          const one::vdc::DelGroupRequest* request,
                          one::ResponseID* response) override;

    grpc::Status AddCluster(grpc::ServerContext* context,
                            const one::vdc::AddClusterRequest* request,
                            one::ResponseID* response) override;

    grpc::Status DelCluster(grpc::ServerContext* context,
                            const one::vdc::DelClusterRequest* request,
                            one::ResponseID* response) override;

    grpc::Status AddHost(grpc::ServerContext* context,
                         const one::vdc::AddHostRequest* request,
                         one::ResponseID* response) override;

    grpc::Status DelHost(grpc::ServerContext* context,
                         const one::vdc::DelHostRequest* request,
                         one::ResponseID* response) override;

    grpc::Status AddDatastore(grpc::ServerContext* context,
                              const one::vdc::AddDatastoreRequest* request,
                              one::ResponseID* response) override;

    grpc::Status DelDatastore(grpc::ServerContext* context,
                              const one::vdc::DelDatastoreRequest* request,
                              one::ResponseID* response) override;

    grpc::Status AddVnet(grpc::ServerContext* context,
                         const one::vdc::AddVnetRequest* request,
                         one::ResponseID* response) override;

    grpc::Status DelVnet(grpc::ServerContext* context,
                         const one::vdc::DelVnetRequest* request,
                         one::ResponseID* response) override;

    grpc::Status Info(grpc::ServerContext* context,
                      const one::vdc::InfoRequest* request,
                      one::ResponseXML* response) override;

    grpc::Status PoolInfo(grpc::ServerContext* context,
                          const one::vdc::PoolInfoRequest* request,
                          one::ResponseXML* response) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcAllocateGRPC : public RequestGRPC, public VdcAllocateAPI
{
public:
    VdcAllocateGRPC() :
        RequestGRPC("one.vdc.allocate", "/one.vdc.VdcService/Allocate"),
        VdcAllocateAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VdcDeleteGRPC : public RequestGRPC, public VdcAPI
{
public:
    VdcDeleteGRPC() :
        RequestGRPC("one.vdc.delete", "/one.vdc.VdcService/Delete"),
        VdcAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VdcUpdateGRPC : public RequestGRPC, public VdcUpdateAPI
{
public:
    VdcUpdateGRPC() :
        RequestGRPC("one.vdc.update", "/one.vdc.VdcService/Update"),
        VdcUpdateAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VdcRenameGRPC : public RequestGRPC, public VdcRenameAPI
{
public:
    VdcRenameGRPC() :
        RequestGRPC("one.vdc.rename", "/one.vdc.VdcService/Rename"),
        VdcRenameAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VdcAddGroupGRPC : public RequestGRPC, public VdcAPI
{
public:
    VdcAddGroupGRPC() :
        RequestGRPC("one.vdc.addgroup", "/one.vdc.VdcService/AddGroup"),
        VdcAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VdcDelGroupGRPC : public RequestGRPC, public VdcAPI
{
public:
    VdcDelGroupGRPC() :
        RequestGRPC("one.vdc.delgroup", "/one.vdc.VdcService/DelGroup"),
        VdcAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VdcAddClusterGRPC : public RequestGRPC, public VdcAPI
{
public:
    VdcAddClusterGRPC() :
        RequestGRPC("one.vdc.addcluster", "/one.vdc.VdcService/AddCluster"),
        VdcAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VdcDelClusterGRPC : public RequestGRPC, public VdcAPI
{
public:
    VdcDelClusterGRPC() :
        RequestGRPC("one.vdc.delcluster", "/one.vdc.VdcService/DelCluster"),
        VdcAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VdcAddHostGRPC : public RequestGRPC, public VdcAPI
{
public:
    VdcAddHostGRPC() :
        RequestGRPC("one.vdc.addhost", "/one.vdc.VdcService/AddHost"),
        VdcAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VdcDelHostGRPC : public RequestGRPC, public VdcAPI
{
public:
    VdcDelHostGRPC() :
        RequestGRPC("one.vdc.delhost", "/one.vdc.VdcService/DelHost"),
        VdcAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VdcAddDatastoreGRPC : public RequestGRPC, public VdcAPI
{
public:
    VdcAddDatastoreGRPC() :
        RequestGRPC("one.vdc.adddatastore", "/one.vdc.VdcService/AddDatastore"),
        VdcAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VdcDelDatastoreGRPC : public RequestGRPC, public VdcAPI
{
public:
    VdcDelDatastoreGRPC() :
        RequestGRPC("one.vdc.deldatastore", "/one.vdc.VdcService/DelDatastore"),
        VdcAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VdcAddVnetGRPC : public RequestGRPC, public VdcAPI
{
public:
    VdcAddVnetGRPC() :
        RequestGRPC("one.vdc.addvnet", "/one.vdc.VdcService/AddVnet"),
        VdcAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VdcDelVnetGRPC : public RequestGRPC, public VdcAPI
{
public:
    VdcDelVnetGRPC() :
        RequestGRPC("one.vdc.delvnet", "/one.vdc.VdcService/DelVnet"),
        VdcAPI(static_cast<Request&>(*this))
    {
        fed_master_only = true;
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class VdcInfoGRPC : public RequestGRPC, public VdcInfoAPI
{
public:
    VdcInfoGRPC() :
        RequestGRPC("one.vdc.info", "/one.vdc.VdcService/Info"),
        VdcInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VdcPoolInfoGRPC : public RequestGRPC, public VdcPoolAPI
{
public:
    VdcPoolInfoGRPC() :
        RequestGRPC("one.vdcpool.info", "/one.vdc.VdcService/PoolInfo"),
        VdcPoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

#endif
