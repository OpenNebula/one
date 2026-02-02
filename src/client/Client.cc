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

#include "Client.h"
#include "ClientXRPC.h"
#include "NebulaLog.h"

#include <pwd.h>
#include <unistd.h>

ClientXRPC * Client::_client_xmlrpc = nullptr;

#ifdef GRPC
    #include "ClientGRPC.h"
    ClientGRPC * Client::_client_grpc   = nullptr;
#endif

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Client* Client::client()
{
#ifdef GRPC
    // Prefer grpc client if defined
    if (_client_grpc)
    {
        return _client_grpc;
    }
#endif

    return _client_xmlrpc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Client::initialize(const std::string& secret,
                        const std::string& endpoint_xmlrpc,
                        const std::string& endpoint_grpc,
                        size_t message_size,
                        unsigned int tout)
{
#ifdef GRPC
    if ( !_client_grpc && !endpoint_grpc.empty() )
    {
        _client_grpc = new ClientGRPC(secret, endpoint_grpc, tout);
    }
#endif

    if ( !_client_xmlrpc && !endpoint_xmlrpc.empty() )
    {
        _client_xmlrpc = new ClientXRPC(secret, endpoint_xmlrpc, message_size, tout);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Client::read_oneauth(string &secret, string& error_msg)
{
    string   one_auth_file;
    ifstream file;
    int rc;

    const char * one_auth_env = getenv("ONE_AUTH");

    if (!one_auth_env) //No $ONE_AUTH, read $HOME/.one/one_auth
    {
        struct passwd pw_ent;
        struct passwd * result;

        char   pwdbuffer[16384];
        size_t pwdlinelen = sizeof(pwdbuffer);

        rc = getpwuid_r(getuid(), &pw_ent, pwdbuffer, pwdlinelen, &result);

        if (result == 0)
        {
            if (rc == 0)
            {
                error_msg = "No matching password record for user";
            }
            else
            {
                error_msg = "Error accessing password file";
            }

            return -1;
        }

        one_auth_file = pw_ent.pw_dir;
        one_auth_file += "/.one/one_auth";

        one_auth_env = one_auth_file.c_str();
    }

    file.open(one_auth_env);

    if (!file.good())
    {
        error_msg = "Could not open file " + string(one_auth_env);
        return -1;
    }

    getline(file, secret);

    if (file.fail())
    {
        error_msg = "Error reading file " + string(one_auth_env);

        file.close();
        return -1;
    }

    file.close();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Client::fed_replicate(const std::string& endpoint,
                          uint64_t index,
                          uint64_t prev_index,
                          const std::string& sql,
                          time_t timeout_ms,
                          bool& success,
                          uint64_t& last,
                          std::string& error_msg)
{
    string secret;

    if ( Client::read_oneauth(secret, error_msg) == -1 )
    {
        return -1;
    }

#ifdef GRPC

    if (is_grpc(endpoint))
    {
        return ClientGRPC::fed_replicate(endpoint, secret, index, prev_index, sql, timeout_ms,
                                         success, last, error_msg);
    }
#endif

    return ClientXRPC::fed_replicate(endpoint, secret, index, prev_index, sql, timeout_ms,
                                         success, last, error_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Client::replicate(const std::string& endpoint,
                      const replicate_params& params,
                      const std::string& sql,
                      time_t timeout_ms,
                      bool& success,
                      uint32_t& follower_term,
                      std::string& error_msg)
{
    string secret;

    if ( Client::read_oneauth(secret, error_msg) == -1 )
    {
        return -1;
    }

#ifdef GRPC
    if (is_grpc(endpoint))
    {
        return ClientGRPC::replicate(endpoint, secret, params, sql, timeout_ms,
                                     success, follower_term, error_msg);
    }
#endif

    return ClientXRPC::replicate(endpoint, secret, params, sql, timeout_ms,
                                     success, follower_term, error_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Client::vote_request(const std::string& endpoint,
                         uint32_t term,
                         int candidate_id,
                         uint32_t log_index,
                         uint32_t log_term,
                         time_t timeout_ms,
                         bool& success,
                         uint32_t& follower_term,
                         std::string& error_msg)
{
    string secret;

    if ( Client::read_oneauth(secret, error_msg) == -1 )
    {
        return -1;
    }

#ifdef GRPC
    if (is_grpc(endpoint))
    {
        return ClientGRPC::vote_request(endpoint, secret, term, candidate_id, log_index, log_term,
                                        timeout_ms, success, follower_term, error_msg);
    }
#endif

    return ClientXRPC::vote_request(endpoint, secret, term, candidate_id, log_index, log_term,
                                        timeout_ms, success, follower_term, error_msg);
}
