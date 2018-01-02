/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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

#ifndef REQUEST_MANAGER_HOST_H
#define REQUEST_MANAGER_HOST_H

#include "Request.h"
#include "Nebula.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerHost: public Request
{
protected:
    RequestManagerHost(const string& method_name,
                       const string& help,
                       const string& params)
        :Request(method_name,params,help)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_hpool();

        auth_object = PoolObjectSQL::HOST;
    };

    ~RequestManagerHost(){};

    /* -------------------------------------------------------------------- */

    virtual void request_execute(xmlrpc_c::paramList const& _paramList,
                                 RequestAttributes& att) = 0;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HostStatus : public RequestManagerHost
{
public:
    enum Status
    {
        ENABLED  = 0,
        DISABLED = 1,
        OFFLINE  = 2
    };

    HostStatus():
        RequestManagerHost("one.host.status", "Sets the status of the host", "A:sii")
    {
        auth_op = AuthRequest::ADMIN;
    };

    ~HostStatus(){};

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HostMonitoring : public RequestManagerHost
{
public:
    HostMonitoring():
        RequestManagerHost("one.host.monitoring",
                            "Returns the host monitoring records",
                            "A:si")
    {
        auth_op = AuthRequest::USE;
    };

    ~HostMonitoring(){};

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif
