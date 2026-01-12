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

#ifndef ONE_CLIENT_GRPC_H_
#define ONE_CLIENT_GRPC_H_

#include "Client.h"

#include <grpcpp/grpcpp.h>
#include <google/protobuf/message.h>

/**
 * This class handles gRPC calls.
 */
class ClientGRPC : public Client
{
public:
    /**
     * Creates a new xml-rpc client with specified options.
     *
     * @param secret A string containing the ONE user:password tuple.
     * If not set, the auth. file will be assumed to be at $ONE_AUTH
     * @param endpoint Where the rpc server is listening, must be something
     * like "http://localhost:2633/RPC2". If not set, the endpoint will be set
     * to $ONE_XMLRPC.
     * @throws Exception if the authorization options are invalid
     */
    ClientGRPC(const std::string& secret,
               const std::string& endpoint,
               unsigned int tout);

    int market_allocate(const std::string& xml, std::string& error) override;
    int market_update(int oid, const std::string& xml) override;

    int market_app_allocate(const std::string& xml, std::string& error) override;
    int market_app_drop(int oid, std::string& error) override;
    int market_app_update(int oid, const std::string& xml) override;

    int user_allocate(const std::string& uname,
                      const std::string& passwd,
                      const std::string& driver,
                      const std::set<int>& gids,
                      std::string& error_str) override;
    int user_chgrp(int user_id, int group_id, std::string& error_str) override;

    int master_update_zone(int oid, const std::string& xml, std::string& error_str) override;

    static int fed_replicate(const std::string& endpoint,
                             const std::string& secret,
                             uint64_t index,
                             uint64_t prev_index,
                             const std::string& sql,
                             time_t timeout_ms,
                             bool& success,
                             uint64_t& last,
                             std::string& error_msg);

    static int replicate(const std::string& endpoint,
                         const std::string& secret,
                         const replicate_params& params,
                         const std::string& sql,
                         time_t timeout_ms,
                         bool& success,
                         uint32_t& follower_term,
                         std::string& error_msg);

    static int vote_request(const std::string& endpoint,
                            const std::string& secret,
                            uint32_t term,
                            int candidate_id,
                            uint32_t log_index,
                            uint32_t log_term,
                            time_t timeout_ms,
                            bool& success,
                            uint32_t& follower_term,
                            std::string& error_msg);

private:
    std::shared_ptr<grpc::Channel> channel;
};

#endif
