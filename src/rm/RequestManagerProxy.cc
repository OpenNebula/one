/* -------------------------------------------------------------------------- */
/* Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#include "RequestManagerProxy.h"
#include "Nebula.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

RequestManagerProxy::RequestManagerProxy(string _method)
    :Request("RequestManagerProxy", "?",
            "Forwards the request to another OpenNebula")
{
    Nebula& nd = Nebula::instance();

    long long msg_size;
    const string& master_endpoint = nd.get_master_oned();

    nd.get_configuration_attribute("MESSAGE_SIZE", msg_size);

    method = _method;
    client = new Client("none", master_endpoint, msg_size);

    method_name = ("RequestManagerProxy." + method);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

RequestManagerProxy::~RequestManagerProxy()
{
    delete client;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManagerProxy::request_execute(xmlrpc_c::paramList const& _paramList,
        RequestAttributes& att)
{
    xmlrpc_c::value return_value;

    try
    {
        client->call(client->get_endpoint(), method, _paramList, &return_value);

        *(att.retval) = return_value;
    }
    catch(exception const& e)
    {
        failure_response(INTERNAL, request_error("Could not connect to the federation master oned", ""), att);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManagerProxy::hide_argument(int arg)
{
    hidden_arg = arg;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManagerProxy::log_xmlrpc_param(
            const xmlrpc_c::value&  v,
            ostringstream&          oss,
            const int&              index)
{
    if (index == hidden_arg)
    {
        oss << ", ****";
    }
    else
    {
        Request::log_xmlrpc_param(v, oss, index);
    }
}
