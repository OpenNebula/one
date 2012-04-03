/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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
#include "SSLTools.h"

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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const int Client::MESSAGE_SIZE = 51200;
//
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Client::set_one_auth(string secret)
{
    if (secret.empty())
    {
        read_oneauth(secret);
    }

    one_auth = secret;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Client::read_oneauth(string &secret)
{
    ostringstream oss;
    string        one_auth_file;

    const char *  one_auth_env;
    ifstream      file;

    int rc = -1;

    // Read $ONE_AUTH file and copy its contents into secret.
    one_auth_env = getenv("ONE_AUTH");

    if (!one_auth_env)
    {
        // If $ONE_AUTH doesn't exist, read $HOME/.one/one_auth
        struct passwd * pw_ent;

        pw_ent = getpwuid(getuid());

        if ((pw_ent != NULL) && (pw_ent->pw_dir != NULL))
        {
            one_auth_file = pw_ent->pw_dir;
            one_auth_file += "/.one/one_auth";

            one_auth_env = one_auth_file.c_str();
        }
        else
        {
            oss << "Could not get one_auth file location";
        }
    }

    file.open(one_auth_env);

    if (file.good())
    {
        getline(file, secret);

        if (file.fail())
        {
            oss << "Error reading file: " << one_auth_env;
        }
        else
        {
            rc = 0;
        }
    }
    else
    {
        oss << "Could not open file: " << one_auth_env;
    }

    file.close();

    if (rc != 0)
    {
        NebulaLog::log("XMLRPC",Log::ERROR,oss);
        throw runtime_error( oss.str() );
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Client::set_one_endpoint(string endpoint)
{
    one_endpoint = "http://localhost:2633/RPC2";

    if(endpoint != "")
    {
        one_endpoint = endpoint;
    }
    else
    {
        char *  xmlrpc_env;
        xmlrpc_env = getenv("ONE_XMLRPC");

        if ( xmlrpc_env != 0 )
        {
            one_endpoint = xmlrpc_env;
        }
    }

    // TODO Check url format, and log error (if any)
}



