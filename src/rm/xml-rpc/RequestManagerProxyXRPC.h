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

#ifndef REQUEST_MANAGER_PROXY_XRPC_H_
#define REQUEST_MANAGER_PROXY_XRPC_H_

#include "RequestXRPC.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerProxyXRPC: public RequestXRPC
{
public:
    RequestManagerProxyXRPC(const std::string& _method)
        : RequestXRPC("RequestManagerProxy",
                      "Forwards the request to another OpenNebula",
                      "?")
        , method(_method)
    {
        _method_name = method;
    }

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;

    void hide_argument(int arg)
    {
        _hidden_params.insert(arg);
    }

private:
    std::string method;
};

#endif
