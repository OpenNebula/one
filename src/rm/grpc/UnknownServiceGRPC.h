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

#ifndef UNKNOWN_GRPC_H
#define UNKNOWN_GRPC_H

#include <grpcpp/grpcpp.h>

/**
 * This class provides a handler for any gRPC methods that are not explicitly
 * registered with the server. It uses the CallbackGenericService to catch
 * all unknown RPCs, log them, and return a standard UNIMPLEMENTED error.
 */
class UnknownService : public grpc::CallbackGenericService
{
public:
    grpc::ServerGenericBidiReactor* CreateReactor(
            grpc::GenericCallbackServerContext* context) override
    {
        // Log the unknown method for debugging purposes.
        std::string err = context->method() + ": Method not implemented";
        NebulaLog::warn("ReM", err);

        // This reactor immediately responds with an UNIMPLEMENTED error.
        class UnimplementedReactor : public grpc::ServerGenericBidiReactor
        {
        public:
            UnimplementedReactor(const std::string& msg)
            {
                Finish(grpc::Status(grpc::StatusCode::UNIMPLEMENTED, msg));
            }

            void OnDone() override { delete this; }
        };

        return new UnimplementedReactor(err);
    }
};

#endif
