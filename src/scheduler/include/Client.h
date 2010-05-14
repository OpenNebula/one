/* -------------------------------------------------------------------------- */
/* Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             */
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

#include <iostream>
#include <string>
#include <sstream>

#include "NebulaLog.h"

using namespace std;

// =============================================================================
// Doc:
// http://xmlrpc-c.sourceforge.net/doc/#clientexamplepp
// http://xmlrpc-c.sourceforge.net/doc/libxmlrpc_client++.html#simple_client
// =============================================================================

//TODO add documentation to the Client methods...

/**
 * This class represents the connection with the core and handles the
 * xml-rpc calls.
 */
class Client : public xmlrpc_c::clientSimple
{
public:
    //--------------------------------------------------------------------------
    //  PUBLIC INTERFACE
    //--------------------------------------------------------------------------

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
    Client( string secret   = "",
            string endpoint = "")
    {
        set_one_auth(secret);
        set_one_endpoint(endpoint);
    }

    const string& get_oneauth()
    {
        return one_auth;
    }

    const string& get_endpoint()
    {
        return one_endpoint;
    }

    //--------------------------------------------------------------------------
    //  PRIVATE ATTRIBUTES AND METHODS
    //--------------------------------------------------------------------------

private:

    string  one_auth;
    string  one_endpoint;

    void set_one_auth(string secret);

    void set_one_endpoint(string endpoint);

    int read_oneauth(string &secret);

    int split_secret(const string secret, string& user, string& pass);

    string sha1_digest(const string& pass);
};

#endif /*ONECLIENT_H_*/
