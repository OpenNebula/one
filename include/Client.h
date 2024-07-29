/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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
 * This class represents the connection with the core and handles the
 * xml-rpc calls.
 */
class Client
{
public:
    /**
     *  Singleton accessor
     */
    static Client * client()
    {
        return _client;
    };

    /**
     *  Singleton initializer
     */
    static Client * initialize(const std::string& secret,
                               const std::string& endpoint, size_t message_size, unsigned int tout)
    {
        if ( _client == 0 )
        {
            _client = new Client(secret, endpoint, message_size, tout);
        }

        return _client;
    };

    size_t get_message_size() const
    {
        return xmlrpc_limit_get(XMLRPC_XML_SIZE_LIMIT_ID);
    };

    /**
     *  Reads ONE_AUTH from environment or its default location at
     *  $HOME/.one/one_auth
     */
    static int read_oneauth(std::string &secret, std::string& error);

    /**
     *  Performs a xmlrpc call to the initialized server
     *    @param method name
     *    @param plist initialized param list
     *    @param result of the xmlrpc call
     */
    void call(const std::string& method, const xmlrpc_c::paramList& plist,
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
    static int call(const std::string& endpoint, const std::string& method,
                    const xmlrpc_c::paramList& plist, unsigned int _timeout,
                    xmlrpc_c::value * const result, std::string& error);

    /**
     *  Performs an xmlrpc call to the initialized server and credentials.
     *  This method automatically adds the credential argument.
     *    @param method name
     *    @param format of the arguments, supported arguments are i:int, s:string
     *    and b:bool
     *    @param result to store the xmlrpc call result
     *    @param ... xmlrpc arguments
     */
    void call(const std::string &method, const std::string &format,
              xmlrpc_c::value * const result, ...);

    void refresh_authentication();

private:
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
    Client(const std::string& secret, const std::string& endpoint, size_t message_size,
           unsigned int tout);

    std::string  one_auth;
    std::string  one_endpoint;

    unsigned int timeout;

    static Client * _client;
};

#endif /*ONECLIENT_H_*/
