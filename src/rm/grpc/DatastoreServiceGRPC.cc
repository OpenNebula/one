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

#include "DatastoreServiceGRPC.h"
#include "ClusterPool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

grpc::Status DatastoreService::Allocate(grpc::ServerContext* context,
                                        const one::datastore::AllocateRequest* request,
                                        one::ResponseID* response)
{
    return DatastoreAllocateGRPC().execute(context, request, response);
}

grpc::Status DatastoreService::Delete(grpc::ServerContext* context,
                                      const one::datastore::DeleteRequest* request,
                                      one::ResponseID* response)
{
    return DatastoreDeleteGRPC().execute(context, request, response);
}

grpc::Status DatastoreService::Info(grpc::ServerContext* context,
                                    const one::datastore::InfoRequest* request,
                                    one::ResponseXML* response)
{
    return DatastoreInfoGRPC().execute(context, request, response);
}

grpc::Status DatastoreService::Update(grpc::ServerContext* context,
                                      const one::datastore::UpdateRequest* request,
                                      one::ResponseID* response)
{
    return DatastoreUpdateGRPC().execute(context, request, response);
}

grpc::Status DatastoreService::Rename(grpc::ServerContext* context,
                                      const one::datastore::RenameRequest* request,
                                      one::ResponseID* response)
{
    return DatastoreRenameGRPC().execute(context, request, response);
}

grpc::Status DatastoreService::Chmod(grpc::ServerContext* context,
                                     const one::datastore::ChmodRequest* request,
                                     one::ResponseID* response)
{
    return DatastoreChmodGRPC().execute(context, request, response);
}

grpc::Status DatastoreService::Chown(grpc::ServerContext* context,
                                     const one::datastore::ChownRequest* request,
                                     one::ResponseID* response)
{
    return DatastoreChownGRPC().execute(context, request, response);
}

grpc::Status DatastoreService::Enable(grpc::ServerContext* context,
                                      const one::datastore::EnableRequest* request,
                                      one::ResponseID* response)
{
    return DatastoreEnableGRPC().execute(context, request, response);
}

grpc::Status DatastoreService::PoolInfo(grpc::ServerContext* context,
                                        const one::datastore::PoolInfoRequest* request,
                                        one::ResponseXML* response)
{
    return DatastorePoolInfoGRPC().execute(context, request, response);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void DatastoreAllocateGRPC::request_execute(const google::protobuf::Message* _request,
                                            google::protobuf::Message*       _response,
                                            RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::datastore::AllocateRequest*>(_request);

    int oid;

    auto ec = allocate(request->template_(),
                       request->cluster_id(),
                       oid,
                       att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void DatastoreDeleteGRPC::request_execute(const google::protobuf::Message* _request,
                                          google::protobuf::Message*       _response,
                                          RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::datastore::DeleteRequest*>(_request);

    int oid = request->oid();

    auto ec = del(oid,
                  false,
                  att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void DatastoreInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                        google::protobuf::Message*       _response,
                                        RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::datastore::InfoRequest*>(_request);

    std::string xml;

    auto ec = info(request->oid(),
                   request->decrypt(),
                   xml,
                   att);

    response(ec, xml, att);
}

/* ------------------------------------------------------------------------- */

void DatastoreUpdateGRPC::request_execute(const google::protobuf::Message* _request,
                                          google::protobuf::Message*       _response,
                                          RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::datastore::UpdateRequest*>(_request);

    int oid = request->oid();

    auto ec = update(request->oid(),
                     request->template_(),
                     request->append(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void DatastoreRenameGRPC::request_execute(const google::protobuf::Message* _request,
                                          google::protobuf::Message*       _response,
                                          RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::datastore::RenameRequest*>(_request);

    int oid = request->oid();

    auto ec = rename(oid,
                     request->name(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void DatastoreChmodGRPC::request_execute(const google::protobuf::Message* _request,
                                         google::protobuf::Message*       _response,
                                         RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::datastore::ChmodRequest*>(_request);

    int oid = request->oid();

    auto ec = chmod(oid,
                    request->user_use(),
                    request->user_manage(),
                    request->user_admin(),
                    request->group_use(),
                    request->group_manage(),
                    request->group_admin(),
                    request->other_use(),
                    request->other_manage(),
                    request->other_admin(),
                    att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void DatastoreChownGRPC::request_execute(const google::protobuf::Message* _request,
                                         google::protobuf::Message*       _response,
                                         RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::datastore::ChownRequest*>(_request);

    int oid = request->oid();

    auto ec = chown(oid,
                    request->user_id(),
                    request->group_id(),
                    att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void DatastoreEnableGRPC::request_execute(const google::protobuf::Message* _request,
                                          google::protobuf::Message*       _response,
                                          RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::datastore::EnableRequest*>(_request);

    int oid = request->oid();

    auto ec = enable(oid,
                     request->enable(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void DatastorePoolInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                            google::protobuf::Message*       _response,
                                            RequestAttributesGRPC& att)
{
    std::string xml;

    auto ec = info(PoolSQL::ALL, -1, -1, xml, att);

    response(ec, xml, att);
}
