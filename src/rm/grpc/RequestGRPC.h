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

#ifndef REQUEST_GRPC_H_
#define REQUEST_GRPC_H_

#include "Request.h"
#include "RequestLoggerGRPC.h"
#include "RequestAttributesGRPC.h"

#include <google/protobuf/message.h>
#include <grpcpp/grpcpp.h>
#include <grpcpp/server_context.h>

#include <string>

class RequestGRPC : public Request
{
public:
    RequestGRPC(const std::string& mn,
                const std::string& grpc_name)
        : Request(mn)
        , method_full_name(grpc_name)
    {}

    virtual ~RequestGRPC() = default;

    ErrorCode to_error_code(grpc::StatusCode gsc)
    {
        switch (gsc)
        {
            case grpc::StatusCode::OK:                  return SUCCESS; break;
            case grpc::StatusCode::CANCELLED:           return INTERNAL; break;
            case grpc::StatusCode::UNKNOWN:             return INTERNAL; break;
            case grpc::StatusCode::INVALID_ARGUMENT:    return RPC_API; break;
            case grpc::StatusCode::DEADLINE_EXCEEDED:   return INTERNAL; break;
            case grpc::StatusCode::NOT_FOUND:           return NO_EXISTS; break;
            case grpc::StatusCode::ALREADY_EXISTS:      return ALLOCATE; break;
            case grpc::StatusCode::PERMISSION_DENIED:   return AUTHORIZATION; break;
            case grpc::StatusCode::RESOURCE_EXHAUSTED:  return INTERNAL; break;
            case grpc::StatusCode::FAILED_PRECONDITION: return INTERNAL; break;
            case grpc::StatusCode::ABORTED:             return INTERNAL; break;
            case grpc::StatusCode::OUT_OF_RANGE:        return INTERNAL; break;
            case grpc::StatusCode::UNIMPLEMENTED:       return INTERNAL; break;
            case grpc::StatusCode::INTERNAL:            return INTERNAL; break;
            case grpc::StatusCode::UNAVAILABLE:         return INTERNAL; break;
            case grpc::StatusCode::DATA_LOSS:           return INTERNAL; break;
            case grpc::StatusCode::UNAUTHENTICATED:     return AUTHENTICATION; break;
            //
            default: return INTERNAL; break;
        }
    }

    grpc::StatusCode to_status_code(ErrorCode ec)
    {
        switch (ec)
        {
            case SUCCESS:        return grpc::StatusCode::OK; break;
            case AUTHENTICATION: return grpc::StatusCode::UNAUTHENTICATED; break;
            case AUTHORIZATION:  return grpc::StatusCode::PERMISSION_DENIED; break;
            case NO_EXISTS:      return grpc::StatusCode::NOT_FOUND; break;
            case ACTION:         return grpc::StatusCode::INTERNAL; break;
            case RPC_API:        return grpc::StatusCode::INVALID_ARGUMENT; break;
            case INTERNAL:       return grpc::StatusCode::INTERNAL; break;
            case ALLOCATE:       return grpc::StatusCode::ALREADY_EXISTS; break;
            case LOCKED:         return grpc::StatusCode::PERMISSION_DENIED; break;
            case REPLICATION:    return grpc::StatusCode::INTERNAL; break;
            //
            default: return grpc::StatusCode::INTERNAL; break;
        }
    };


    /* ---------------------------------------------------------------------- */
    /* Entry code for grpc calls                                              */
    /* ---------------------------------------------------------------------- */
    /**
     *  Actual Execution method for the request. Must be implemented by the
     *  XML-RPC requests
     *    @param _paramlist of the XML-RPC call (complete list)
     *    @param att the specific request attributes
     */
    virtual void request_execute(const google::protobuf::Message* request,
                                 google::protobuf::Message*       response,
                                 RequestAttributesGRPC& att) = 0;
    /**
     *  Wraps the actual execution function by authorizing the user
     *  and calling the request_execute virtual function
     *    @param
     *    @param
     */
    grpc::Status execute(grpc::ServerContext* context,
                         const google::protobuf::Message* request,
                         google::protobuf::Message*       response);

protected:
    bool fed_master_only = false;

private:
    void make_response(ErrorCode ec,
                       const std::string& value,
                       RequestAttributes& _att) override;

    void make_response(ErrorCode ec,
                       int value,
                       RequestAttributes& _att) override;

    void make_response(ErrorCode ec,
                       uint64_t value,
                       RequestAttributes& _att) override;

    grpc::Status call(const std::string& endpoint,
                      const std::string& method_name,
                      const google::protobuf::Message& request,
                      google::protobuf::Message*       response,
                      std::string& error_msg);

    const std::string method_full_name;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif //REQUEST_GRPC_H_
