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

#include "RequestGRPC.h"
#include "Nebula.h"

#include "PoolObjectAuth.h"
#include "HookAPI.h"
#include "HookManager.h"
#include "RaftManager.h"
#include "ZonePool.h"
#include "ClientGRPC.h"

#include "shared.pb.h"

#include <grpcpp/generic/generic_stub.h>
#include <grpcpp/generic/async_generic_service.h>
#include <grpcpp/support/proto_buffer_writer.h>
#include <grpcpp/support/proto_buffer_reader.h>
#include <unistd.h>

#include <future>

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* Request Methods                                                            */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

grpc::Status RequestGRPC::execute(grpc::ServerContext* context,
                                  const google::protobuf::Message* request,
                                  google::protobuf::Message*       response)
{
    RequestLoggerGRPC logger(context);

    ParamListGRPC pl(request, _hidden_params);

    RequestAttributesGRPC att(_auth_op, pl, response);

    Nebula& nd  = Nebula::instance();

    RaftManager * raftm = nd.get_raftm();
    UserPool* upool     = nd.get_upool();

    HookManager * hm = nd.get_hm();

    bool authenticated = upool->authenticate(att.session,
                                             att.password,
                                             att.uid,
                                             att.gid,
                                             att.uname,
                                             att.gname,
                                             att.group_ids,
                                             att.umask);

    if ( _log_method_call )
    {
        logger.log_method_invoked(att, pl, _method_name);
    }

    if ( authenticated == false )
    {
        Request::failure_response(AUTHENTICATION, att);

        logger.log_result(att, _method_name);

        return att.retval;
    }

    if ( (raftm->is_follower() || nd.is_cache()) && _leader_only)
    {
        std::string leader_endpoint, error;

        if ( nd.is_cache() )
        {
            leader_endpoint = nd.get_master_oned_grpc();
        }
        else if ( raftm->get_leader_endpoint(leader_endpoint) != 0 )
        {
            att.resp_msg = "Cannot process request, no leader found";
            Request::failure_response(INTERNAL, att);

            logger.log_result(att, _method_name);

            return att.retval;
        }

        if (Client::is_grpc(leader_endpoint))
        {
            att.retval = call(leader_endpoint,
                              method_full_name,
                              *request,
                              response,
                              att.resp_msg);

            att.success = att.retval.ok();
        }
        else
        {
            if (nd.is_cache())
            {
                att.resp_msg = "Master gRPC endpoint not defined, add MASTER_ONED_GRPC to oned.conf";
            }
            else
            {
                att.resp_msg = "ENDPOINT_GRPC for zone server not defined, update zone servers";
            }
            att.retval = grpc::Status(grpc::UNIMPLEMENTED, att.resp_msg);
        }

        if ( !att.retval.ok() )
        {
            Request::failure_response(INTERNAL, att);

            logger.log_result(att, _method_name);

            return att.retval;
        }
    }
    else if ( raftm->is_candidate() && _leader_only)
    {
        att.resp_msg = "Cannot process request, oned cluster in election mode";
        Request::failure_response(INTERNAL, att);

        return att.retval;
    }
    else if ( raftm->is_reconciling() && _leader_only)
    {
        att.resp_msg = "Cannot process request, oned cluster is replicating log";
        Request::failure_response(INTERNAL, att);

        return att.retval;
    }
    else //leader or solo or !leader_only
    {
        if ( !_zone_disabled && nd.get_zone_state() == Zone::DISABLED )
        {
            att.resp_msg = "Cannot process request, zone disabled";
            Request::failure_response(INTERNAL, att);

            logger.log_result(att, _method_name);

            return att.retval;
        }

        if ( fed_master_only && nd.is_federation_slave() )
        {
            string endpoint = nd.get_master_oned_grpc();

            if (endpoint.empty())
            {
                endpoint = nd.get_master_oned_xmlrpc();

                if (!Client::is_grpc(endpoint))
                {
                    att.retval = grpc::Status(grpc::UNIMPLEMENTED,
                        "Unknown gRPC endpoint for federation master, setup MASTER_ONED_GRPC in oned.conf");

                    return att.retval;
                }
            }

            // Execute on federation master
            att.retval = call(endpoint,
                              method_full_name,
                              *request,
                              response,
                              att.resp_msg);

            att.success = att.retval.ok();
        }
        else
        {
            // Execute locally
            request_execute(request, response, att);
        }
    }

    //--------------------------------------------------------------------------
    // Register API hook event & log call
    //--------------------------------------------------------------------------
    std::string event = HookAPI::format_message(_method_name, pl, att);

    if (!nd.is_cache())
    {
        if (!event.empty())
        {
            hm->trigger_send_event(event);
        }
    }

    if ( _log_method_call )
    {
        logger.log_result(att, _method_name);
    }

    return att.retval;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestGRPC::make_response(ErrorCode ec,
                                const std::string& value,
                                RequestAttributes& _att)
{
    auto& att = static_cast<RequestAttributesGRPC&>(_att);

    if (ec != SUCCESS)
    {
        att.retval = grpc::Status(to_status_code(ec), value);

        return;
    }

    auto response = dynamic_cast<one::ResponseXML*>(att.response);

    if ( !response )
    {
        att.retval = grpc::Status(to_status_code(Request::RPC_API),
                                    "Wrong return message type, check proto definition for " + _method_name);

        return;
    }

    att.retval = grpc::Status::OK;
    response->set_xml(value);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestGRPC::make_response(ErrorCode ec,
                                int value,
                                RequestAttributes& _att)
{
    if (ec != SUCCESS)
    {
        // This code should be unreachable, as the int value is only used
        // for SUCCESS responses.
        NebulaLog::error("GRPC", "Wrong use of make response with int parameter. ");

        auto& att = static_cast<RequestAttributesGRPC&>(_att);
        att.retval = grpc::Status(to_status_code(ec), std::to_string(value));

        return;
    }

    auto& att = static_cast<RequestAttributesGRPC&>(_att);
    auto response = dynamic_cast<one::ResponseID*>(att.response);

    if ( !response )
    {
        att.retval = grpc::Status(to_status_code(Request::RPC_API),
                                  "Wrong return message type, check proto definition for " + _method_name);

        return;
    }

    att.retval = grpc::Status::OK;
    response->set_oid(value);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestGRPC::make_response(ErrorCode ec,
                                uint64_t value,
                                RequestAttributes& _att)
{
    if (ec != SUCCESS)
    {
        // This code should be unreachable, as the uint64_t value is only used
        // for SUCCESS responses.
        NebulaLog::error("GRPC", "Wrong use of make response with uint64 parameter. ");

        auto& att = static_cast<RequestAttributesGRPC&>(_att);
        att.retval = grpc::Status(to_status_code(ec), std::to_string(value));

        return;
    }

    // Temporary return failure to bring attention to the missing implementation
    NebulaLog::error("GRPC", "Make response with uint64_t NOT IMPLEMENTED. ");
    auto& att = static_cast<RequestAttributesGRPC&>(_att);
    att.retval = grpc::Status(grpc::StatusCode::UNIMPLEMENTED, "Not Implemented: ");
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

grpc::Status RequestGRPC::call(const std::string& endpoint,
                               const std::string& method_name,
                               const google::protobuf::Message& request,
                               google::protobuf::Message*       response,
                               std::string& error_msg)
{
    // Step 1: Create a generic stub for the channel.
    // TODO: consider caching channels and stub
    auto channel = grpc::CreateChannel(endpoint, grpc::InsecureChannelCredentials());
    grpc::GenericStub generic_stub(channel);

    // Step 2: Serialize the request message.
    grpc::ByteBuffer request_buffer;
    auto size = request.ByteSizeLong();
    grpc::ProtoBufferWriter writer(&request_buffer, grpc::kProtoBufferWriterMaxBufferLength, size);

    if ( !request.SerializeToZeroCopyStream(&writer) )
    {
        return grpc::Status(grpc::StatusCode::INTERNAL,
                            "Failed to serialize message to ByteBuffer.");
    }

#if NEW_GRPC
    // Step 3: Make the generic unary call.
    grpc::ByteBuffer response_buffer;
    grpc::ClientContext context;
    grpc::Status rpc_status;

    auto cq = std::make_unique<grpc::CompletionQueue>();

    std::unique_ptr<grpc::ClientAsyncResponseReader<grpc::ByteBuffer>> reader(
        generic_stub.PrepareUnaryCall(&context, method_name, request_buffer, cq.get()));

    reader->StartCall();
    reader->Finish(&response_buffer, &rpc_status, (void*)1);

    void* got_tag;
    bool ok = false;

    GPR_ASSERT(cq->Next(&got_tag, &ok));
    GPR_ASSERT(got_tag == (void*)1);
    GPR_ASSERT(ok);
#else
    // Step 3: Make the generic unary call (older gRPC versions).
    grpc::ByteBuffer response_buffer;
    std::promise<grpc::Status> status_promise;
    std::future<grpc::Status> status_future = status_promise.get_future();

    grpc::ClientContext context;

    generic_stub.UnaryCall(
        &context,
        method_name,
        &request_buffer,
        &response_buffer,
        [&status_promise](grpc::Status s) {
            status_promise.set_value(s);
        });

    grpc::Status rpc_status = status_future.get();
#endif

    // Step 4: Handle the RPC status.
    if (!rpc_status.ok()) {
        return rpc_status; // Propagate the error.
    }

    // Step 5: Deserialize the response buffer into the response message.
    grpc::ProtoBufferReader response_reader(&response_buffer);
    if ( !response->ParseFromZeroCopyStream(&response_reader) )
    {
        return grpc::Status(grpc::StatusCode::INTERNAL,
                            "Failed to parse Protobuf message from ByteBuffer.");
    }

    return grpc::Status::OK;
}
