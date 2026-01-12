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

#include "ZoneServiceGRPC.h"
#include "ClusterPool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

grpc::Status ZoneService::Allocate(grpc::ServerContext*              context,
                                   const one::zone::AllocateRequest* request,
                                   one::ResponseID*                  response)
{

    return ZoneAllocateGRPC().execute(context, request, response);
}

grpc::Status ZoneService::Delete(grpc::ServerContext* context,
                                 const one::zone::DeleteRequest* request,
                                 one::ResponseID* response)
{
    return ZoneDeleteGRPC().execute(context, request, response);
}

grpc::Status ZoneService::Update(grpc::ServerContext* context,
                                 const one::zone::UpdateRequest* request,
                                 one::ResponseID* response)
{
    return ZoneUpdateGRPC().execute(context, request, response);
}

grpc::Status ZoneService::Rename(grpc::ServerContext* context,
                                 const one::zone::RenameRequest* request,
                                 one::ResponseID* response)
{
    return ZoneRenameGRPC().execute(context, request, response);
}

grpc::Status ZoneService::AddServer(grpc::ServerContext* context,
                                    const one::zone::AddServerRequest* request,
                                    one::ResponseID* response)
{
    return ZoneAddServerGRPC().execute(context, request, response);
}

grpc::Status ZoneService::DelServer(grpc::ServerContext* context,
                                    const one::zone::DelServerRequest* request,
                                    one::ResponseID* response)
{
    return ZoneDelServerGRPC().execute(context, request, response);
}

grpc::Status ZoneService::ResetServer(grpc::ServerContext* context,
                                      const one::zone::ResetServerRequest* request,
                                      one::ResponseID* response)
{
    return ZoneResetServerGRPC().execute(context, request, response);
}

grpc::Status ZoneService::Enable(grpc::ServerContext* context,
                                 const one::zone::EnableRequest* request,
                                 one::ResponseID* response)
{
    return ZoneEnableGRPC().execute(context, request, response);
}

grpc::Status ZoneService::ReplicateLog(grpc::ServerContext* context,
                                       const one::zone::ReplicateLogRequest* request,
                                       one::zone::ResponseReplicateLog* response)
{
    return ZoneReplicateLogGRPC().execute(context, request, response);
}

grpc::Status ZoneService::Vote(grpc::ServerContext* context,
                               const one::zone::VoteRequest* request,
                               one::zone::ResponseVote* response)
{
    return ZoneVoteGRPC().execute(context, request, response);
}

grpc::Status ZoneService::RaftStatus(grpc::ServerContext* context,
                                     const one::zone::RaftStatusRequest* request,
                                     one::ResponseXML* response)
{
    return ZoneRaftStatusGRPC().execute(context, request, response);
}

grpc::Status ZoneService::ReplicateFedLog(grpc::ServerContext* context,
                                          const one::zone::ReplicateFedLogRequest* request,
                                          one::zone::ResponseReplicateFedLog* response)
{
    return ZoneReplicateFedLogGRPC().execute(context, request, response);
}

grpc::Status ZoneService::UpdateDB(grpc::ServerContext* context,
                                   const one::zone::UpdateDBRequest* request,
                                   one::ResponseID* response)
{
    return ZoneUpdateDBGRPC().execute(context, request, response);
}

grpc::Status ZoneService::Info(grpc::ServerContext* context,
                               const one::zone::InfoRequest* request,
                               one::ResponseXML* response)
{
    return ZoneInfoGRPC().execute(context, request, response);
}

grpc::Status ZoneService::PoolInfo(grpc::ServerContext* context,
                                   const one::zone::PoolInfoRequest* request,
                                   one::ResponseXML* response)
{
    return ZonePoolInfoGRPC().execute(context, request, response);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void ZoneAllocateGRPC::request_execute(const google::protobuf::Message* _request,
                                       google::protobuf::Message*       _response,
                                       RequestAttributesGRPC&           att)
{
    auto request = static_cast<const one::zone::AllocateRequest*>(_request);

    int oid;

    auto ec = allocate(request->template_(),
                       ClusterPool::NONE_CLUSTER_ID,
                       oid,
                       att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void ZoneDeleteGRPC::request_execute(const google::protobuf::Message* _request,
                                     google::protobuf::Message*       _response,
                                     RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::zone::DeleteRequest*>(_request);

    int oid = request->oid();

    auto ec = del(oid, false, att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void ZoneUpdateGRPC::request_execute(const google::protobuf::Message* _request,
                                     google::protobuf::Message*       _response,
                                     RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::zone::UpdateRequest*>(_request);

    int oid = request->oid();

    auto ec = update(request->oid(),
                     request->template_(),
                     request->append(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void ZoneRenameGRPC::request_execute(const google::protobuf::Message* _request,
                                     google::protobuf::Message*       _response,
                                     RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::zone::RenameRequest*>(_request);

    int oid = request->oid();

    auto ec = rename(oid,
                     request->name(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void ZoneAddServerGRPC::request_execute(const google::protobuf::Message* _request,
                                        google::protobuf::Message*       _response,
                                        RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::zone::AddServerRequest*>(_request);

    int oid = request->oid();

    auto ec = add_server(oid,
                         request->zs_str(),
                         att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void ZoneDelServerGRPC::request_execute(const google::protobuf::Message* _request,
                                        google::protobuf::Message*       _response,
                                        RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::zone::DelServerRequest*>(_request);

    int oid = request->oid();

    auto ec = del_server(oid,
                         request->zs_id(),
                         att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void ZoneResetServerGRPC::request_execute(const google::protobuf::Message* _request,
                                          google::protobuf::Message*       _response,
                                          RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::zone::ResetServerRequest*>(_request);

    int oid = request->oid();

    auto ec = reset_server(oid,
                           request->zs_id(),
                           att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void ZoneEnableGRPC::request_execute(const google::protobuf::Message* _request,
                                     google::protobuf::Message*       _response,
                                     RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::zone::EnableRequest*>(_request);

    int oid = request->oid();

    auto ec = enable(oid,
                     request->enable(),
                     att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void ZoneReplicateLogGRPC::request_execute(const google::protobuf::Message* _request,
                                           google::protobuf::Message*       _response,
                                           RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::zone::ReplicateLogRequest*>(_request);

    ReplicateLogParams params{
        request->leader_id(),
        request->leader_commit(),
        request->leader_term(),
        request->index(),
        request->term(),
        request->prev_index(),
        request->prev_term(),
        request->fed_index(),
        request->sql(),
    };

    auto ec = replicate_log(params, att);

    // Special handling, even in case of failure we return grpc::Status::OK
    // The failure is stored in the response->success
    if (HookAPI::supported_call(_method_name))
    {
        make_xml_response(ec, att.resp_id, att);
    }

    auto response = static_cast<one::zone::ResponseReplicateLog*>(att.response);

    att.retval = grpc::Status::OK;
    response->set_success(ec == Request::SUCCESS);
    response->set_term(att.resp_id);
}

/* ------------------------------------------------------------------------- */

void ZoneVoteGRPC::request_execute(const google::protobuf::Message* _request,
                                   google::protobuf::Message*       _response,
                                   RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::zone::VoteRequest*>(_request);

    auto ec = vote(request->candidate_term(),
                   request->candidate_id(),
                   request->candidate_log_index(),
                   request->candidate_log_term(),
                   att);

    // Special handling, even in case of failure we return grpc::Status::OK
    // The failure is stored in the response->success
    if (HookAPI::supported_call(_method_name))
    {
        make_xml_response(ec, att.resp_id, att);
    }

    auto response = static_cast<one::zone::ResponseVote*>(att.response);

    att.retval = grpc::Status::OK;
    response->set_success(ec == Request::SUCCESS);
    response->set_term(att.resp_id);
}

/* ------------------------------------------------------------------------- */

void ZoneRaftStatusGRPC::request_execute(const google::protobuf::Message* _request,
                                         google::protobuf::Message*       _response,
                                         RequestAttributesGRPC& att)
{
    std::string xml;

    auto ec = raft_status(xml, att);

    response(ec, xml, att);
}

/* ------------------------------------------------------------------------- */

void ZoneReplicateFedLogGRPC::request_execute(const google::protobuf::Message* _request,
                                             google::protobuf::Message*       _response,
                                             RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::zone::ReplicateFedLogRequest*>(_request);

    auto ec = replicate_fed_log(request->index(),
                                request->prev(),
                                request->sql(),
                                att);

    // Special handling, even in case of failure we return grpc::Status::OK
    // The failure is stored in the response->success
    if (HookAPI::supported_call(_method_name))
    {
        make_xml_response(ec, att.resp_id, att);
    }

    auto response = static_cast<one::zone::ResponseReplicateFedLog*>(att.response);

    att.retval = grpc::Status::OK;
    response->set_success(ec == Request::SUCCESS);
    response->set_index(att.replication_idx);
}

/* ------------------------------------------------------------------------- */

void ZoneUpdateDBGRPC::request_execute(const google::protobuf::Message* _request,
                                     google::protobuf::Message*       _response,
                                     RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::zone::UpdateDBRequest*>(_request);

    int oid = request->oid();

    auto ec = update_db(oid,
                        request->xml(),
                        att);

    response(ec, oid, att);
}

/* ------------------------------------------------------------------------- */

void ZoneInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                   google::protobuf::Message*       _response,
                                   RequestAttributesGRPC& att)
{
    auto request = static_cast<const one::zone::InfoRequest*>(_request);

    std::string xml;

    auto ec = info(request->oid(),
                   request->decrypt(),
                   xml,
                   att);

    response(ec, xml, att);
}

/* ------------------------------------------------------------------------- */

void ZonePoolInfoGRPC::request_execute(const google::protobuf::Message* _request,
                                       google::protobuf::Message*       _response,
                                       RequestAttributesGRPC& att)
{
    std::string xml;

    auto ec = info(PoolSQL::ALL, -1, -1, xml, att);

    response(ec, xml, att);
}
