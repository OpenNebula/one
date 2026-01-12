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

#include "ClientGRPC.h"
#include "NebulaLog.h"
#include "marketplace.grpc.pb.h"
#include "marketplaceapp.grpc.pb.h"
#include "user.grpc.pb.h"
#include "zone.grpc.pb.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

ClientGRPC::ClientGRPC(const string& secret,
                       const string& endpoint,
                       unsigned int tout)
{
    string error;
    char * grpc_env;

    if (!secret.empty())
    {
        one_auth = secret;
    }
    else if (read_oneauth(one_auth, error) != 0 )
    {
        NebulaLog::log("GRPC", Log::ERROR, error);
        throw runtime_error(error);
    }

    if(!endpoint.empty())
    {
        one_endpoint = endpoint;
    }
    else if ( (grpc_env = getenv("ONE_GRPC"))!= 0 )
    {
        one_endpoint = grpc_env;
    }
    else
    {
        one_endpoint = "localhost:2634";
    }

    channel = grpc::CreateChannel(endpoint, grpc::InsecureChannelCredentials());

    // todo: set timeout
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClientGRPC::market_allocate(const string& xml, string& error_str)
{
    one::ResponseID response;
    ostringstream oss("Cannot allocate market at federation master: ", ios::ate);

    try
    {
        auto stub = one::market::MarketPlaceService::NewStub(channel);

        grpc::ClientContext context;
        one::market::AllocateDBRequest request;

        request.set_session_id(one_auth);
        request.set_xml(xml);

        auto status = stub->AllocateDB(&context, request, &response);

        if (!status.ok())
        {
            oss << status.error_message();
            error_str = oss.str();

            return -1;
        }
    }
    catch (exception const& e)
    {
        oss << e.what();
        error_str = oss.str();

        return -1;
    }

    return response.oid();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClientGRPC::market_update(int oid, const string& xml)
{
    one::ResponseID response;
    ostringstream oss("Cannot update market in federation master db: ", ios::ate);

    try
    {
        auto stub = one::market::MarketPlaceService::NewStub(channel);

        grpc::ClientContext context;
        one::market::UpdateDBRequest request;

        request.set_session_id(one_auth);
        request.set_oid(oid);
        request.set_xml(xml);

        auto status = stub->UpdateDB(&context, request, &response);

        if (!status.ok())
        {
            oss << status.error_message();
            NebulaLog::log("MKP", Log::ERROR, oss);

            return -1;
        }
    }
    catch (exception const& e)
    {
        oss << e.what();
        NebulaLog::log("MKP", Log::ERROR, oss);

        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClientGRPC::market_app_allocate(const string& xml, string& error)
{
    one::ResponseID response;
    ostringstream oss("Cannot allocate marketapp at federation master: ", ios::ate);

    try
    {
        auto stub = one::marketapp::MarketPlaceAppService::NewStub(channel);

        grpc::ClientContext context;
        one::marketapp::AllocateDBRequest request;

        request.set_session_id(one_auth);
        request.set_xml(xml);

        auto status = stub->AllocateDB(&context, request, &response);

        if (!status.ok())
        {
            oss << status.error_message();
            NebulaLog::log("MKP", Log::ERROR, oss);

            return -1;
        }
    }
    catch (exception const& e)
    {
        oss << e.what();
        error = oss.str();

        return -1;
    }

    return response.oid();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClientGRPC::market_app_drop(int oid, string& error_msg)
{
    one::ResponseID response;
    ostringstream oss("Cannot drop marketapp at federation master: ", ios::ate);

    try
    {
        auto stub = one::marketapp::MarketPlaceAppService::NewStub(channel);

        grpc::ClientContext context;
        one::marketapp::DropDBRequest request;

        request.set_session_id(one_auth);
        request.set_oid(oid);

        auto status = stub->DropDB(&context, request, &response);

        if (!status.ok())
        {
            oss << status.error_message();
            NebulaLog::log("MKP", Log::ERROR, oss);

            return -1;
        }
    }
    catch (exception const& e)
    {
        oss << e.what();
        error_msg = oss.str();

        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClientGRPC::market_app_update(int oid, const string& xml)
{
    one::ResponseID response;
    ostringstream oss("Cannot update marketapp at federation master: ", ios::ate);

    try
    {
        auto stub = one::marketapp::MarketPlaceAppService::NewStub(channel);

        grpc::ClientContext context;
        one::marketapp::UpdateDBRequest request;

        request.set_session_id(one_auth);
        request.set_oid(oid);
        request.set_xml(xml);

        auto status = stub->UpdateDB(&context, request, &response);

        if (!status.ok())
        {
            oss << status.error_message();
            NebulaLog::log("MKP", Log::ERROR, oss);

            return -1;
        }
    }
    catch (exception const& e)
    {
        oss << e.what();
        NebulaLog::log("MKP", Log::ERROR, oss);

        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClientGRPC::user_allocate(const string& uname,
                              const string& passwd,
                              const string& driver,
                              const set<int>& gids,
                              string& error_str)
{
    one::ResponseID response;
    ostringstream oss("Cannot allocate user at federation master: ", ios::ate);

    try
    {
        auto stub = one::user::UserService::NewStub(channel);

        grpc::ClientContext context;
        one::user::AllocateRequest request;

        request.set_session_id(one_auth);
        request.set_username(uname);
        request.set_password(passwd);
        request.set_driver(driver);
        request.mutable_group_ids()->Add(gids.begin(), gids.end());

        auto status = stub->Allocate(&context, request, &response);

        if (!status.ok())
        {
            oss << status.error_message();
            NebulaLog::log("MKP", Log::ERROR, oss);

            return -1;
        }
    }
    catch (exception const& e)
    {
        oss << e.what();
        error_str = oss.str();

        return -1;
    }

    return response.oid();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClientGRPC::user_chgrp(int user_id, int group_id, string& error_str)
{
    one::ResponseID response;
    ostringstream oss("Cannot change user group at federation master: ", ios::ate);

    try
    {
        auto stub = one::user::UserService::NewStub(channel);

        grpc::ClientContext context;
        one::user::ChangeGroupRequest request;

        request.set_session_id(one_auth);
        request.set_oid(user_id);
        request.set_new_gid(group_id);

        auto status = stub->ChangeGroup(&context, request, &response);

        if (!status.ok())
        {
            oss << status.error_message();
            NebulaLog::log("MKP", Log::ERROR, oss);

            return -1;
        }
    }
    catch (exception const& e)
    {
        oss << e.what();
        error_str = oss.str();

        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClientGRPC::master_update_zone(int oid, const string& xml, string& error_str)
{
    one::ResponseID response;
    ostringstream oss("Cannot update zone at federation master: ", ios::ate);

    try
    {
        auto stub = one::zone::ZoneService::NewStub(channel);

        grpc::ClientContext context;
        one::zone::UpdateDBRequest request;

        request.set_session_id(one_auth);
        request.set_oid(oid);
        request.set_xml(xml);

        auto status = stub->UpdateDB(&context, request, &response);

        if (!status.ok())
        {
            oss << status.error_message();
            NebulaLog::log("MKP", Log::ERROR, oss);

            return -1;
        }
    }
    catch (exception const& e)
    {
        oss << e.what();
        error_str = oss.str();

        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClientGRPC::fed_replicate(const std::string& endpoint,
                              const std::string& secret,
                              uint64_t index,
                              uint64_t prev_index,
                              const std::string& sql,
                              time_t timeout_ms,
                              bool& success,
                              uint64_t& last,
                              std::string& error_msg)
{
    // todo: set timeout
    // Creating channel is expensive operation, consider caching channels
    auto ch = grpc::CreateChannel(endpoint, grpc::InsecureChannelCredentials());
    auto stub = one::zone::ZoneService::NewStub(ch);

    grpc::ClientContext context;
    one::zone::ReplicateFedLogRequest request;
    one::zone::ResponseReplicateFedLog response;

    request.set_session_id(secret);
    request.set_index(index);
    request.set_prev(prev_index);
    request.set_sql(sql);

    auto status = stub->ReplicateFedLog(&context, request, &response);

    if (!status.ok())
    {
        error_msg = status.error_message();

        return -1;
    }

    success = response.success();
    last = response.index();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClientGRPC::replicate(const std::string& endpoint,
                          const std::string& secret,
                          const replicate_params& params,
                          const std::string& sql,
                          time_t timeout_ms,
                          bool& success,
                          uint32_t& follower_term,
                          std::string& error_msg)
{
    // todo: set timeout
    auto ch = grpc::CreateChannel(endpoint, grpc::InsecureChannelCredentials());
    auto stub = one::zone::ZoneService::NewStub(ch);

    grpc::ClientContext context;
    one::zone::ReplicateLogRequest request;
    one::zone::ResponseReplicateLog response;

    request.set_session_id(secret);
    request.set_leader_id(params.leader_id);
    request.set_leader_commit(params.leader_commit);
    request.set_leader_term(params.leader_term);
    request.set_index(params.index);
    request.set_term(params.term);
    request.set_prev_index(params.prev_index);
    request.set_prev_term(params.prev_term);
    request.set_fed_index(params.fed_index);
    request.set_sql(sql);

    auto status = stub->ReplicateLog(&context, request, &response);

    if (!status.ok())
    {
        error_msg = status.error_message();

        return -1;
    }

    success = response.success();
    follower_term = response.term();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClientGRPC::vote_request(const std::string& endpoint,
                             const std::string& secret,
                             uint32_t term,
                             int candidate_id,
                             uint32_t log_index,
                             uint32_t log_term,
                             time_t timeout_ms,
                             bool& success,
                             uint32_t& follower_term,
                             std::string& error_msg)
{
    // todo: set timeout
    auto ch = grpc::CreateChannel(endpoint, grpc::InsecureChannelCredentials());
    auto stub = one::zone::ZoneService::NewStub(ch);

    grpc::ClientContext context;
    one::zone::VoteRequest request;
    one::zone::ResponseVote response;

    request.set_session_id(secret);
    request.set_candidate_term(term);
    request.set_candidate_id(candidate_id);
    request.set_candidate_log_index(log_index);
    request.set_candidate_log_term(log_term);

    auto status = stub->Vote(&context, request, &response);

    if (!status.ok())
    {
        error_msg = status.error_message();

        return -1;
    }

    success = response.success();
    follower_term = response.term();

    return 0;
}
