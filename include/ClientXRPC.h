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

#ifndef ONE_CLIENT_XRPC_H_
#define ONE_CLIENT_XRPC_H_

#include "Client.h"

#include <xmlrpc-c/base.hpp>
#include <xmlrpc-c/client_simple.hpp>
#include <xmlrpc-c/girerr.hpp>

#include <string>

// =============================================================================
// Doc:
// http://xmlrpc-c.sourceforge.net/doc/#clientexamplepp
// http://xmlrpc-c.sourceforge.net/doc/libxmlrpc_client++.html#simple_client
// =============================================================================

/**
 * This class handles xml-rpc calls.
 */
class ClientXRPC : public Client
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
     * @param message_size for XML elements in the client library (in bytes)
     * @throws Exception if the authorization options are invalid
     */
    ClientXRPC(const std::string& secret,
               const std::string& endpoint,
               size_t message_size,
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

     /**
     *  Performs a xmlrpc call to the initialized server
     *    @param method name
     *    @param plist initialized param list
     *    @param result of the xmlrpc call
     */
    void call(const std::string& method,
              const xmlrpc_c::paramList& plist,
              xmlrpc_c::value * const result);

    /**
     *  Performs a xmlrpc call
     *    @param endpoint of server
     *    @param method name
     *    @param plist initialized param list
     *    @param timeout (ms) for the request, set 0 for global xml_rpc timeout
     *    @param result of the xmlrpc call
     *    @param error string if any
     *    @return 0
     */
    static int call(const std::string& endpoint,
                    const std::string& method,
                    const xmlrpc_c::paramList& plist,
                    unsigned int _timeout,
                    xmlrpc_c::value * const result,
                    std::string& error);

    /**
     *  Performs an xmlrpc call to the initialized server and credentials.
     *  This method automatically adds the credential argument.
     *    @param method name
     *    @param format of the arguments, supported arguments are i:int, s:string
     *    and b:bool
     *    @param result to store the xmlrpc call result
     *    @param ... xmlrpc arguments
     */
    void call(const std::string &method,
              const std::string &format,
              xmlrpc_c::value * const result,
              ...);

private:
};

#endif
