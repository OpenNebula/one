/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

#include <fstream>
#include <pwd.h>
#include <stdlib.h>
#include <stdexcept>

#include <limits.h>
#include <string.h>
#include <stdlib.h>

#include <sstream>

#include <unistd.h>
#include <sys/types.h>

Client * Client::_client = 0;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Client::Client(const string& secret, const string& endpoint,
    size_t message_size, unsigned int tout)
{
    string error;
    char * xmlrpc_env;

    if (!secret.empty())
    {
        one_auth = secret;
    }
    else if (read_oneauth(one_auth, error) != 0 )
    {
        NebulaLog::log("XMLRPC", Log::ERROR, error);
        throw runtime_error(error);
    }

    if(!endpoint.empty())
    {
        one_endpoint = endpoint;
    }
    else if ( (xmlrpc_env = getenv("ONE_XMLRPC"))!= 0 )
    {
        one_endpoint = xmlrpc_env;
    }
    else
    {
        one_endpoint = "http://localhost:2633/RPC2";
    }

    xmlrpc_limit_set(XMLRPC_XML_SIZE_LIMIT_ID, message_size);

    timeout = tout * 1000;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Client::read_oneauth(string &secret, string& error_msg)
{
    string   one_auth_file;
    ifstream file;

    const char *  one_auth_env = getenv("ONE_AUTH");

    if (!one_auth_env) //No $ONE_AUTH, read $HOME/.one/one_auth
    {
        struct passwd * pw_ent;

        pw_ent = getpwuid(getuid());

        if ((pw_ent == NULL) || (pw_ent->pw_dir == NULL))
        {
            error_msg = "Could not get one_auth file location";
            return -1;
        }

        one_auth_file = pw_ent->pw_dir;
        one_auth_file += "/.one/one_auth";

        one_auth_env = one_auth_file.c_str();
    }

    file.open(one_auth_env);

    if (!file.good())
    {
        error_msg = "Could not open file " + one_auth_file;
        return -1;
    }

    getline(file, secret);

    if (file.fail())
    {
        error_msg = "Error reading file " + one_auth_file;

        file.close();
        return -1;
    }

    file.close();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Client::call(const std::string &method, const std::string format,
    xmlrpc_c::value * const result, ...)
{
    va_list args;
    va_start(args, result);

    std::string::const_iterator i;

    std::string sval;
    int         ival;
    bool        bval;

    const char* pval;

    xmlrpc_c::paramList plist;

    plist.add(xmlrpc_c::value_string(one_auth));

    for (i = format.begin(); i != format.end(); ++i)
    {
        switch(*i)
        {
            case 's':
                pval = static_cast<const char*>(va_arg(args, char *));
                sval = pval;

                plist.add(xmlrpc_c::value_string(sval));
                break;

            case 'i':
                ival = va_arg(args, int);

                plist.add(xmlrpc_c::value_int(ival));
                break;

            case 'b':
                bval = va_arg(args, int);

                plist.add(xmlrpc_c::value_boolean(bval));
                break;

            default:
                break;
         }
    }

    va_end(args);

    call(method, plist, result);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Client::call(const std::string& method, const xmlrpc_c::paramList& plist,
     xmlrpc_c::value * const result)
{
    xmlrpc_c::clientXmlTransport_curl ctrans;
    xmlrpc_c::client_xml              client(&ctrans);

    xmlrpc_c::rpcPtr rpc(method, plist);
    xmlrpc_c::carriageParm_curl0 cparam(one_endpoint);

    rpc->start(&client, &cparam);

    client.finishAsync(xmlrpc_c::timeout(timeout));

    if (!rpc->isFinished())
    {
        rpc->finishErr(girerr::error("XMLRPC method " + method +
            " timeout, resetting call"));
    }

    if (rpc->isSuccessful())
    {
        *result = rpc->getResult();
    }
    else
    {
        xmlrpc_c::fault failure = rpc->getFault();

        girerr::error(failure.getDescription());
    }
};
