/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

#ifndef REQUEST_MANAGER_PROXY_H_
#define REQUEST_MANAGER_PROXY_H_

#include "Request.h"
#include "Client.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerProxy: public Request
{
public:
    RequestManagerProxy(string _method): Request("RequestManagerProxy", "?",
        "Forwards the request to another OpenNebula"), method(_method)
    {
        method_name = ("RequestManagerProxy." + method);
    };

    ~RequestManagerProxy(){};

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);

    void hide_argument(int arg)
    {
        hidden_params.insert(arg);
    };

private:
    string    method;
};

#endif
