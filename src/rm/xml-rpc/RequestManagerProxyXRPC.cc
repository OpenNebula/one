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

#include "RequestManagerProxyXRPC.h"
#include "Nebula.h"
#include "ClientXRPC.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManagerProxyXRPC::request_execute(xmlrpc_c::paramList const& _paramList,
                                              RequestAttributesXRPC& att)
{
    try
    {
        ClientXRPC *client = Client::client_xmlrpc();

        if (client)
        {
            xmlrpc_c::value return_value;

            client->call(method, _paramList, &return_value);

            *(att.retval) = return_value;
        }
        else
        {
            att.resp_msg = "Conversion from XRPC call to GRPC proxy not implemented";

            Request::failure_response(Request::INTERNAL, att);
        }
    }
    catch(std::exception const& e)
    {
        att.resp_msg = "Could not connect to the federation master oned";

        Request::failure_response(Request::INTERNAL, att);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

