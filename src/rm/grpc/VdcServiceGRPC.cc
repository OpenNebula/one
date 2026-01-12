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

#include "VdcServiceGRPC.h"
#include "ClusterPool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

grpc::Status VdcService::Allocate(grpc::ServerContext* context,
                                  const one::vdc::AllocateRequest* request,
                                  one::ResponseID* response)
{
    return VdcAllocateGRPC().execute(context, request, response);
}

grpc::Status VdcService::Delete(grpc::ServerContext* context,
                                const one::vdc::DeleteRequest* request,
                                one::ResponseID* response)
{
    return VdcDeleteGRPC().execute(context, request, response);
}


grpc::Status VdcService::Update(grpc::ServerContext* context,
                                const one::vdc::UpdateRequest* request,
                                one::ResponseID* response)
{
    return VdcUpdateGRPC().execute(context, request, response);
}

grpc::Status VdcService::Rename(grpc::ServerContext* context,
                                const one::vdc::RenameRequest* request,
                                one::ResponseID* response)
{
    return VdcRenameGRPC().execute(context, request, response);
}

grpc::Status VdcService::AddGroup(grpc::ServerContext* context,
                                  const one::vdc::AddGroupRequest* request,
                                  one::ResponseID* response)
{
    return VdcAddGroupGRPC().execute(context, request, response);
}

grpc::Status VdcService::DelGroup(grpc::ServerContext* context,
                                  const one::vdc::DelGroupRequest* request,
                                  one::ResponseID* response)
{
    return VdcDelGroupGRPC().execute(context, request, response);
}

grpc::Status VdcService::AddCluster(grpc::ServerContext* context,
                                    const one::vdc::AddClusterRequest* request,
                                    one::ResponseID* response)
{
    return VdcAddClusterGRPC().execute(context, request, response);
}

grpc::Status VdcService::DelCluster(grpc::ServerContext* context,
                                    const one::vdc::DelClusterRequest* request,
                                    one::ResponseID* response)
{
    return VdcDelClusterGRPC().execute(context, request, response);
}

grpc::Status VdcService::AddHost(grpc::ServerContext* context,
                                 const one::vdc::AddHostRequest* request,
                                 one::ResponseID* response)
{
    return VdcAddHostGRPC().execute(context, request, response);
}

grpc::Status VdcService::DelHost(grpc::ServerContext* context,
                                 const one::vdc::DelHostRequest* request,
                                 one::ResponseID* response)
{
    return VdcDelHostGRPC().execute(context, request, response);
}


grpc::Status VdcService::AddDatastore(grpc::ServerContext* context,
                                      const one::vdc::AddDatastoreRequest* request,
                                      one::ResponseID* response)
{
    return VdcAddDatastoreGRPC().execute(context, request, response);
}

grpc::Status VdcService::DelDatastore(grpc::ServerContext* context,
                                      const one::vdc::DelDatastoreRequest* request,
                                      one::ResponseID* response)
{
    return VdcDelDatastoreGRPC().execute(context, request, response);
}

grpc::Status VdcService::AddVnet(grpc::ServerContext* context,
                                 const one::vdc::AddVnetRequest* request,
                                 one::ResponseID* response)
{
    return VdcAddVnetGRPC().execute(context, request, response);
}

grpc::Status VdcService::DelVnet(grpc::ServerContext* context,
                                 const one::vdc::DelVnetRequest* request,
                                 one::ResponseID* response)
{
    return VdcDelVnetGRPC().execute(context, request, response);
}

grpc::Status VdcService::Info(grpc::ServerContext* context,
                              const one::vdc::InfoRequest* request,
                              one::ResponseXML* response)
{
    return VdcInfoGRPC().execute(context, request, response);
}

grpc::Status VdcService::PoolInfo(grpc::ServerContext* context,
                                  const one::vdc::PoolInfoRequest* request,
                                  one::ResponseXML* response)
{
    return VdcPoolInfoGRPC().execute(context, request, response);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void VdcAllocateGRPC::request_execute(const google::protobuf::Message* _request,
                                      google::protobuf::Message*       _response,
                                      RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vdc::AllocateRequest*>(_request);

    int oid;

    auto ec = allocate(request->template_(),
                       ClusterPool::NONE_CLUSTER_ID,
                       oid,
                       att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VdcDeleteGRPC::request_execute(const google::protobuf::Message* _request,
                                    google::protobuf::Message*       _response,
                                    RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vdc::DeleteRequest*>(_request);

    int oid = request->oid();

    auto ec = del(oid, false, att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VdcUpdateGRPC::request_execute(const google::protobuf::Message* _request,
                                    google::protobuf::Message*       _response,
                                    RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vdc::UpdateRequest*>(_request);

    int oid = request->oid();

    auto ec = update(request->oid(),
                     request->template_(),
                     request->append(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VdcRenameGRPC::request_execute(const google::protobuf::Message* _request,
                                    google::protobuf::Message*       _response,
                                    RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vdc::RenameRequest*>(_request);

    int oid = request->oid();

    auto ec = rename(oid,
                     request->name(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VdcAddGroupGRPC::request_execute(const google::protobuf::Message* _request,
                                      google::protobuf::Message*       _response,
                                      RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vdc::AddGroupRequest*>(_request);

    int oid = request->oid();

    auto ec = add_group(oid,
                        request->group_id(),
                        att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VdcDelGroupGRPC::request_execute(const google::protobuf::Message* _request,
                                      google::protobuf::Message*       _response,
                                      RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vdc::DelGroupRequest*>(_request);

    int oid = request->oid();

    auto ec = del_group(oid,
                        request->group_id(),
                        att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VdcAddClusterGRPC::request_execute(const google::protobuf::Message* _request,
                                        google::protobuf::Message*       _response,
                                        RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vdc::AddClusterRequest*>(_request);

    int oid = request->oid();

    auto ec = add_cluster(oid,
                          request->zone_id(),
                          request->cluster_id(),
                          att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VdcDelClusterGRPC::request_execute(const google::protobuf::Message* _request,
                                        google::protobuf::Message*       _response,
                                        RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vdc::DelClusterRequest*>(_request);

    int oid = request->oid();

    auto ec = del_cluster(oid,
                          request->zone_id(),
                          request->cluster_id(),
                          att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VdcAddHostGRPC::request_execute(const google::protobuf::Message* _request,
                                     google::protobuf::Message*       _response,
                                     RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vdc::AddHostRequest*>(_request);

    int oid = request->oid();

    auto ec = add_host(oid,
                       request->zone_id(),
                       request->host_id(),
                       att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VdcDelHostGRPC::request_execute(const google::protobuf::Message* _request,
                                     google::protobuf::Message*       _response,
                                     RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vdc::DelHostRequest*>(_request);

    int oid = request->oid();

    auto ec = del_host(oid,
                       request->zone_id(),
                       request->host_id(),
                       att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VdcAddDatastoreGRPC::request_execute(const google::protobuf::Message* _request,
                                          google::protobuf::Message*       _response,
                                          RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vdc::AddDatastoreRequest*>(_request);

    int oid = request->oid();

    auto ec = add_datastore(oid,
                            request->zone_id(),
                            request->ds_id(),
                            att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VdcDelDatastoreGRPC::request_execute(const google::protobuf::Message* _request,
                                          google::protobuf::Message*       _response,
                                          RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vdc::DelDatastoreRequest*>(_request);

    int oid = request->oid();

    auto ec = del_datastore(oid,
                            request->zone_id(),
                            request->ds_id(),
                            att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VdcAddVnetGRPC::request_execute(const google::protobuf::Message* _request,
                                     google::protobuf::Message*       _response,
                                     RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vdc::AddVnetRequest*>(_request);

    int oid = request->oid();

    auto ec = add_vnet(oid,
                       request->zone_id(),
                       request->vnet_id(),
                       att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VdcDelVnetGRPC::request_execute(const google::protobuf::Message* _request,
                                     google::protobuf::Message*       _response,
                                     RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vdc::DelVnetRequest*>(_request);

    int oid = request->oid();

    auto ec = del_vnet(oid,
                       request->zone_id(),
                       request->vnet_id(),
                       att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void VdcInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                  google::protobuf::Message*       _response,
                                  RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::vdc::InfoRequest*>(_request);

    std::string xml;

    auto ec = info(request->oid(),
                   request->decrypt(),
                   xml,
                   att);

    response(ec, xml, att);
}

/* ------------------------------------------------------------------------- */

void VdcPoolInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                      google::protobuf::Message*       _response,
                                      RequestAttributesGRPC& att)
{
    std::string xml;

    auto ec = info(PoolSQL::ALL, -1, -1, xml, att);

    response(ec, xml, att);
}
