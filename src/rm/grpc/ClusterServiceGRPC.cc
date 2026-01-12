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

#include "ClusterServiceGRPC.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

grpc::Status ClusterService::Allocate(grpc::ServerContext* context,
                                      const one::cluster::AllocateRequest* request,
                                      one::ResponseID* response)
{
    return ClusterAllocateGRPC().execute(context, request, response);
}

grpc::Status ClusterService::Delete(grpc::ServerContext* context,
                                    const one::cluster::DeleteRequest* request,
                                    one::ResponseID* response)
{
    return ClusterDeleteGRPC().execute(context, request, response);
}

grpc::Status ClusterService::Info(grpc::ServerContext* context,
                                  const one::cluster::InfoRequest* request,
                                  one::ResponseXML* response)
{
    return ClusterInfoGRPC().execute(context, request, response);
}

grpc::Status ClusterService::Update(grpc::ServerContext* context,
                                    const one::cluster::UpdateRequest* request,
                                    one::ResponseID* response)
{
    return ClusterUpdateGRPC().execute(context, request, response);
}

grpc::Status ClusterService::Rename(grpc::ServerContext* context,
                                    const one::cluster::RenameRequest* request,
                                    one::ResponseID* response)
{
    return ClusterRenameGRPC().execute(context, request, response);
}

grpc::Status ClusterService::AddHost(grpc::ServerContext* context,
                                     const one::cluster::AddHostRequest* request,
                                     one::ResponseID* response)
{
    return ClusterAddHostGRPC().execute(context, request, response);
}

grpc::Status ClusterService::DelHost(grpc::ServerContext* context,
                                     const one::cluster::DelHostRequest* request,
                                     one::ResponseID* response)
{
    return ClusterDelHostGRPC().execute(context, request, response);
}

grpc::Status ClusterService::AddDatastore(grpc::ServerContext* context,
                                          const one::cluster::AddDatastoreRequest* request,
                                          one::ResponseID* response)
{
    return ClusterAddDatastoreGRPC().execute(context, request, response);
}

grpc::Status ClusterService::DelDatastore(grpc::ServerContext* context,
                                          const one::cluster::DelDatastoreRequest* request,
                                          one::ResponseID* response)
{
    return ClusterDelDatastoreGRPC().execute(context, request, response);
}

grpc::Status ClusterService::AddVNet(grpc::ServerContext* context,
                                     const one::cluster::AddVNetRequest* request,
                                     one::ResponseID* response)
{
    return ClusterAddVNetGRPC().execute(context, request, response);
}

grpc::Status ClusterService::DelVNet(grpc::ServerContext* context,
                                     const one::cluster::DelVNetRequest* request,
                                     one::ResponseID* response)
{
    return ClusterDelVNetGRPC().execute(context, request, response);
}

grpc::Status ClusterService::Optimize(grpc::ServerContext* context,
                                      const one::cluster::OptimizeRequest* request,
                                      one::ResponseID* response)
{
    return ClusterOptimizeGRPC().execute(context, request, response);
}

grpc::Status ClusterService::PlanExecute(grpc::ServerContext* context,
                                         const one::cluster::PlanExecuteRequest* request,
                                         one::ResponseID* response)
{
    return ClusterPlanExecuteGRPC().execute(context, request, response);
}

grpc::Status ClusterService::PlanDelete(grpc::ServerContext* context,
                                        const one::cluster::PlanDeleteRequest* request,
                                        one::ResponseID* response)
{
    return ClusterPlanDeleteGRPC().execute(context, request, response);
}

/* ------------------------------------------------------------------------- */

grpc::Status ClusterService::PoolInfo(grpc::ServerContext* context,
                                      const one::cluster::PoolInfoRequest* request,
                                      one::ResponseXML* response)
{
    return ClusterPoolInfoGRPC().execute(context, request, response);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void ClusterAllocateGRPC::request_execute(const google::protobuf::Message* _request,
                                          google::protobuf::Message*       _response,
                                          RequestAttributesGRPC& att)
{
    auto request  = static_cast<const one::cluster::AllocateRequest*>(_request);

    int oid;

    auto ec = allocate(request->name(), oid, att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void ClusterDeleteGRPC::request_execute(const google::protobuf::Message* _request,
                                        google::protobuf::Message*       _response,
                                        RequestAttributesGRPC& att)
{
    auto request  = static_cast<const one::cluster::DeleteRequest*>(_request);

    int oid = request->oid();

    auto ec = del(oid, false, att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void ClusterInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                      google::protobuf::Message*       _response,
                                      RequestAttributesGRPC& att)
{
    auto request  = static_cast<const one::cluster::InfoRequest*>(_request);

    string xml;

    auto ec = info(request->oid(),
                   request->decrypt(),
                   xml,
                   att);

    response(ec, xml, att);
}

/* ------------------------------------------------------------------------- */

void ClusterUpdateGRPC::request_execute(const google::protobuf::Message* _request,
                                        google::protobuf::Message*       _response,
                                        RequestAttributesGRPC& att)
{
    auto request  = static_cast<const one::cluster::UpdateRequest*>(_request);

    int oid = request->oid();

    auto ec = update(oid,
                     request->template_(),
                     request->append(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void ClusterRenameGRPC::request_execute(const google::protobuf::Message* _request,
                                        google::protobuf::Message*       _response,
                                        RequestAttributesGRPC& att)
{
    auto request  = static_cast<const one::cluster::RenameRequest*>(_request);

    int oid = request->oid();

    auto ec = rename(oid,
                     request->name(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void ClusterAddHostGRPC::request_execute(const google::protobuf::Message* _request,
                                         google::protobuf::Message*       _response,
                                         RequestAttributesGRPC& att)
{
    auto request  = static_cast<const one::cluster::AddHostRequest*>(_request);

    int oid = request->oid();

    auto ec = AddHost(oid,
                      request->host_id(),
                      att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void ClusterDelHostGRPC::request_execute(const google::protobuf::Message* _request,
                                         google::protobuf::Message*       _response,
                                         RequestAttributesGRPC& att)
{
    auto request  = static_cast<const one::cluster::DelHostRequest*>(_request);

    int oid = request->oid();

    auto ec = DelHost(oid,
                      request->host_id(),
                      att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void ClusterAddDatastoreGRPC::request_execute(const google::protobuf::Message* _request,
                                              google::protobuf::Message*       _response,
                                              RequestAttributesGRPC& att)
{
    auto request  = static_cast<const one::cluster::AddDatastoreRequest*>(_request);

    int oid = request->oid();

    auto ec = AddDatastore(oid,
                           request->ds_id(),
                           att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void ClusterDelDatastoreGRPC::request_execute(const google::protobuf::Message* _request,
                                              google::protobuf::Message*       _response,
                                              RequestAttributesGRPC& att)
{
    auto request  = static_cast<const one::cluster::DelDatastoreRequest*>(_request);

    int oid = request->oid();

    auto ec = DelDatastore(oid,
                           request->ds_id(),
                           att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void ClusterAddVNetGRPC::request_execute(const google::protobuf::Message* _request,
                                         google::protobuf::Message*       _response,
                                         RequestAttributesGRPC& att)
{
    auto request  = static_cast<const one::cluster::AddVNetRequest*>(_request);

    int oid = request->oid();

    auto ec = AddVNet(oid,
                      request->vnet_id(),
                      att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void ClusterDelVNetGRPC::request_execute(const google::protobuf::Message* _request,
                                         google::protobuf::Message*       _response,
                                         RequestAttributesGRPC& att)
{
    auto request  = static_cast<const one::cluster::DelVNetRequest*>(_request);

    int oid = request->oid();

    auto ec = DelVNet(oid,
                      request->vnet_id(),
                      att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void ClusterOptimizeGRPC::request_execute(const google::protobuf::Message* _request,
                                          google::protobuf::Message*       _response,
                                          RequestAttributesGRPC& att)
{
    auto request  = static_cast<const one::cluster::OptimizeRequest*>(_request);

    int oid = request->oid();

    auto ec = Optimize(oid, att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void ClusterPlanExecuteGRPC::request_execute(const google::protobuf::Message* _request,
                                             google::protobuf::Message*       _response,
                                             RequestAttributesGRPC& att)
{
    auto request  = static_cast<const one::cluster::PlanExecuteRequest*>(_request);

    int oid = request->oid();

    auto ec = PlanExecute(oid, att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void ClusterPlanDeleteGRPC::request_execute(const google::protobuf::Message* _request,
                                            google::protobuf::Message*       _response,
                                            RequestAttributesGRPC& att)
{
    auto request  = static_cast<const one::cluster::PlanDeleteRequest*>(_request);

    int oid = request->oid();

    auto ec = PlanDelete(oid, att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void ClusterPoolInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                          google::protobuf::Message*       _response,
                                          RequestAttributesGRPC& att)
{
    string xml;

    auto ec = info(PoolSQL::ALL, -1, -1, xml, att);

    response(ec, xml, att);
}
