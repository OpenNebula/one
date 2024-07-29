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

#include "Client.h"
#include "NebulaLog.h"

#include <fstream>
#include <pwd.h>
#include <stdlib.h>
#include <stdexcept>
#include <set>
#include <sstream>

#include <unistd.h>
#include <sys/types.h>

using namespace std;

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

void Client::call(const std::string &method, const std::string &format,
                  xmlrpc_c::value * const result, ...)
{
    va_list args;
    va_start(args, result);

    std::string  sval;
    int          ival;
    bool         bval;

    std::set<int> * vval;

    const char* pval;
    vector<xmlrpc_c::value> x_vval;

    xmlrpc_c::paramList plist;

    plist.add(xmlrpc_c::value_string(one_auth));

    for (auto ch : format)
    {
        switch(ch)
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

            case 'I':
                vval = static_cast<std::set<int> *>(va_arg(args,
                                                           std::set<int> *));

                for (auto it = vval->begin(); it != vval->end(); ++it)
                {
                    x_vval.push_back(xmlrpc_c::value_int(*it));
                }

                plist.add(xmlrpc_c::value_array(x_vval));
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
    xmlrpc_c::clientXmlTransport_curl ctrans(
            xmlrpc_c::clientXmlTransport_curl::constrOpt().timeout(timeout));

    xmlrpc_c::carriageParm_curl0 cparam(one_endpoint);

    xmlrpc_c::client_xml client(&ctrans);
    xmlrpc_c::rpcPtr     rpc(method, plist);

    rpc->start(&client, &cparam);

    client.finishAsync(xmlrpc_c::timeout());

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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Client::call(const std::string& endpoint, const std::string& method,
                 const xmlrpc_c::paramList& plist, unsigned int _timeout,
                 xmlrpc_c::value * const result, std::string& error)
{
// Transport timeouts are not reliably implemented, interrupt flag and async
// client performs better.
//    xmlrpc_c::clientXmlTransport_curl transport(
//        xmlrpc_c::clientXmlTransport_curl::constrOpt().timeout(_timeout));
    xmlrpc_c::clientXmlTransport_curl transport;

    xmlrpc_c::carriageParm_curl0  carriage(endpoint);

    xmlrpc_c::client_xml client(&transport);
    xmlrpc_c::rpcPtr     rpc_client(method, plist);

    int xml_rc   = 0;
    int int_flag = 0;

    try
    {
        rpc_client->start(&client, &carriage);

        client.setInterrupt(&int_flag);

        if ( _timeout == 0 )
        {
            client.finishAsync(xmlrpc_c::timeout());
        }
        else
        {
            client.finishAsync(_timeout);
        }

        if ( rpc_client->isFinished() )
        {
            if ( rpc_client->isSuccessful() )
            {
                *result = rpc_client->getResult();
            }
            else //RPC failed
            {
                xmlrpc_c::fault failure = rpc_client->getFault();

                error  = failure.getDescription();
                xml_rc = -1;
            }
        }
        else //rpc not finished. Interrupt it
        {
            int_flag = 1;

            error  = "RPC call timed out and aborted";
            xml_rc = -1;

            client.finishAsync(xmlrpc_c::timeout());
        }
    }
    catch (exception const& e)
    {
        error  = e.what();
        xml_rc = -1;
    }

    return xml_rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Client::refresh_authentication()
{
    string err;

    if (read_oneauth(one_auth, err) != 0 )
    {
        NebulaLog::log("XMLRPC", Log::ERROR, err);
    }
}