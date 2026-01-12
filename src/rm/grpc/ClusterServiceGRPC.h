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

#ifndef CLUSTER_GRPC_H
#define CLUSTER_GRPC_H

#include "RequestGRPC.h"
#include "ClusterAPI.h"
#include "ClusterPoolAPI.h"

#include "cluster.grpc.pb.h"

#include <grpcpp/grpcpp.h>

class ClusterService final : public one::cluster::ClusterService::Service
{
    grpc::Status Allocate(grpc::ServerContext* context,
                          const one::cluster::AllocateRequest* request,
                          one::ResponseID* response) override;

    grpc::Status Delete(grpc::ServerContext* context,
                        const one::cluster::DeleteRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Info(grpc::ServerContext* context,
                      const one::cluster::InfoRequest* request,
                      one::ResponseXML* response) override;

    grpc::Status Update(grpc::ServerContext* context,
                        const one::cluster::UpdateRequest* request,
                        one::ResponseID* response) override;

    grpc::Status Rename(grpc::ServerContext* context,
                        const one::cluster::RenameRequest* request,
                        one::ResponseID* response) override;

    grpc::Status AddHost(grpc::ServerContext* context,
                         const one::cluster::AddHostRequest* request,
                         one::ResponseID* response) override;

    grpc::Status DelHost(grpc::ServerContext* context,
                         const one::cluster::DelHostRequest* request,
                         one::ResponseID* response) override;

    grpc::Status AddDatastore(grpc::ServerContext* context,
                              const one::cluster::AddDatastoreRequest* request,
                              one::ResponseID* response) override;

    grpc::Status DelDatastore(grpc::ServerContext* context,
                              const one::cluster::DelDatastoreRequest* request,
                              one::ResponseID* response) override;

    grpc::Status AddVNet(grpc::ServerContext* context,
                         const one::cluster::AddVNetRequest* request,
                         one::ResponseID* response) override;

    grpc::Status DelVNet(grpc::ServerContext* context,
                         const one::cluster::DelVNetRequest* request,
                         one::ResponseID* response) override;

    grpc::Status Optimize(grpc::ServerContext* context,
                          const one::cluster::OptimizeRequest* request,
                          one::ResponseID* response) override;

    grpc::Status PlanExecute(grpc::ServerContext* context,
                             const one::cluster::PlanExecuteRequest* request,
                             one::ResponseID* response) override;

    grpc::Status PlanDelete(grpc::ServerContext* context,
                            const one::cluster::PlanDeleteRequest* request,
                            one::ResponseID* response) override;

    grpc::Status PoolInfo(grpc::ServerContext* context,
                          const one::cluster::PoolInfoRequest* request,
                          one::ResponseXML* response) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterAllocateGRPC : public RequestGRPC, public ClusterAllocateAPI
{
public:
    ClusterAllocateGRPC() :
        RequestGRPC("one.cluster.allocate", "/one.cluster.ClusterService/Allocate"),
        ClusterAllocateAPI(static_cast<Request&>(*this))
    {
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ClusterDeleteGRPC : public RequestGRPC, public ClusterAPI
{
public:
    ClusterDeleteGRPC() :
        RequestGRPC("one.cluster.delete", "/one.cluster.ClusterService/Delete"),
        ClusterAPI(static_cast<Request&>(*this))
    {
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ClusterInfoGRPC : public RequestGRPC, public ClusterInfoAPI
{
public:
    ClusterInfoGRPC() :
        RequestGRPC("one.cluster.info", "/one.cluster.ClusterService/Info"),
        ClusterInfoAPI(static_cast<Request&>(*this))
    {
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ClusterUpdateGRPC : public RequestGRPC, public ClusterUpdateAPI
{
public:
    ClusterUpdateGRPC() :
        RequestGRPC("one.cluster.update", "/one.cluster.ClusterService/Update"),
        ClusterUpdateAPI(static_cast<Request&>(*this))
    {
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ClusterRenameGRPC : public RequestGRPC, public ClusterRenameAPI
{
public:
    ClusterRenameGRPC() :
        RequestGRPC("one.cluster.rename", "/one.cluster.ClusterService/Rename"),
        ClusterRenameAPI(static_cast<Request&>(*this))
    {
    }

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ClusterAddHostGRPC : public RequestGRPC, public ClusterAPI
{
public:
    ClusterAddHostGRPC() :
        RequestGRPC("one.cluster.addhost", "/one.cluster.ClusterService/AddHost"),
        ClusterAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ClusterDelHostGRPC : public RequestGRPC, public ClusterAPI
{
public:
    ClusterDelHostGRPC() :
        RequestGRPC("one.cluster.delhost", "/one.cluster.ClusterService/DelHost"),
        ClusterAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ClusterAddDatastoreGRPC : public RequestGRPC, public ClusterAPI
{
public:
    ClusterAddDatastoreGRPC() :
        RequestGRPC("one.cluster.adddatastore", "/one.cluster.ClusterService/AddDatastore"),
        ClusterAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ClusterDelDatastoreGRPC : public RequestGRPC, public ClusterAPI
{
public:
    ClusterDelDatastoreGRPC() :
        RequestGRPC("one.cluster.deldatastore", "/one.cluster.ClusterService/DelDatastore"),
        ClusterAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ClusterAddVNetGRPC : public RequestGRPC, public ClusterAPI
{
public:
    ClusterAddVNetGRPC() :
        RequestGRPC("one.cluster.addvnet", "/one.cluster.ClusterService/AddVNet"),
        ClusterAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ClusterDelVNetGRPC : public RequestGRPC, public ClusterAPI
{
public:
    ClusterDelVNetGRPC() :
        RequestGRPC("one.cluster.delvnet", "/one.cluster.ClusterService/DelVNet"),
        ClusterAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ClusterOptimizeGRPC : public RequestGRPC, public ClusterAPI
{
public:
    ClusterOptimizeGRPC() :
        RequestGRPC("one.cluster.optimize", "/one.cluster.ClusterService/Optimize"),
        ClusterAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ClusterPlanExecuteGRPC : public RequestGRPC, public ClusterAPI
{
public:
    ClusterPlanExecuteGRPC() :
        RequestGRPC("one.cluster.planexecute", "/one.cluster.ClusterService/PlanExecute"),
        ClusterAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */

class ClusterPlanDeleteGRPC : public RequestGRPC, public ClusterAPI
{
public:
    ClusterPlanDeleteGRPC() :
        RequestGRPC("one.cluster.plandelete", "/one.cluster.ClusterService/PlanDelete"),
        ClusterAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ClusterPoolInfoGRPC : public RequestGRPC, public ClusterPoolAPI
{
public:
    ClusterPoolInfoGRPC() :
        RequestGRPC("one.clusterpool.info", "/one.cluster.ClusterService/PoolInfo"),
        ClusterPoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(const google::protobuf::Message* _request,
                         google::protobuf::Message*       _response,
                         RequestAttributesGRPC& att) override;
};

#endif
