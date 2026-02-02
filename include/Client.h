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

#ifndef ONE_CLIENT_H_
#define ONE_CLIENT_H_

#include <string>
#include <set>
#include <cstdint>

class ClientXRPC;
#ifdef GRPC
    class ClientGRPC;
#endif

/**
 * This class represents the connection with the core and handles the
 * rpc calls.
 */
class Client
{
public:
    struct replicate_params
    {
        int leader_id;
        uint32_t leader_term;
        uint64_t leader_commit;
        uint64_t index;
        uint64_t prev_index;
        uint32_t term;
        uint32_t prev_term;
        uint64_t fed_index;
    };

    /**
     *  Singleton accessor
     */
    static Client * client();

    static ClientXRPC * client_xmlrpc()
    {
        return _client_xmlrpc;
    }

#ifdef GRPC
    static ClientGRPC * client_grpc()
    {
        return _client_grpc;
    }
#endif

    /**
     *  Singleton initializer
     */
    static void initialize(const std::string& secret,
                           const std::string& endpoint_xmlrpc,
                           const std::string& endpoint_grpc,
                           size_t message_size,
                           unsigned int tout);

    /**
     *  Reads ONE_AUTH from environment or its default location at
     *  $HOME/.one/one_auth
     */
    static int read_oneauth(std::string &secret, std::string& error);

    static bool is_grpc(const std::string& endpoint)
    {
        return endpoint.find("RPC2") == std::string::npos;
    }

    virtual int market_allocate(const std::string& xml, std::string& error) = 0;
    virtual int market_update(int oid, const std::string& xml) = 0;

    virtual int market_app_allocate(const std::string& xml, std::string& error) = 0;
    virtual int market_app_drop(int oid, std::string& error) = 0;
    virtual int market_app_update(int oid, const std::string& xml) = 0;

    virtual int user_allocate(const std::string& uname,
                              const std::string& passwd,
                              const std::string& driver,
                              const std::set<int>& gids,
                              std::string& error_str) = 0;
    virtual int user_chgrp(int user_id, int group_id, std::string& error_str) = 0;

    virtual int master_update_zone(int oid, const std::string& xml, std::string& error_str) = 0;

    static int fed_replicate(const std::string& endpoint,
                             uint64_t index,
                             uint64_t prev_index,
                             const std::string& sql,
                             time_t timeout_ms,
                             bool& success,
                             uint64_t& last,
                             std::string& error_msg);

    static int replicate(const std::string& endpoint,
                         const replicate_params& params,
                         const std::string& sql,
                         time_t timeout_ms,
                         bool& success,
                         uint32_t& follower_term,
                         std::string& error_msg);

    static int vote_request(const std::string& endpoint,
                            uint32_t term,
                            int candidate_id,
                            uint32_t log_index,
                            uint32_t log_term,
                            time_t timeout_ms,
                            bool& success,
                            uint32_t& follower_term,
                            std::string& error_msg);

protected:
    std::string one_auth;
    std::string one_endpoint;

    unsigned int timeout = 10000; // Timout for rpc calls

    static ClientXRPC * _client_xmlrpc;
#ifdef GRPC
    static ClientGRPC * _client_grpc;
#endif
};

#endif /*ONECLIENT_H_*/
