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

#ifndef REQUEST_XRPC_H_
#define REQUEST_XRPC_H_

#include <xmlrpc-c/base.hpp>
#include <xmlrpc-c/registry.hpp>

#include "Request.h"
#include "RequestAttributesXRPC.h"
#include "RequestLoggerXRPC.h"

class RequestXRPC : public xmlrpc_c::method2, public Request
{
public:

    RequestXRPC(const std::string& mn,
            const std::string& help,
            const std::string& signature):
        Request(mn)
    {
        _signature = signature;
        _help      = help;
    }

    virtual ~RequestXRPC() = default;

    /* ---------------------------------------------------------------------- */
    /* Entry code for xml-rpc calls                                           */
    /* ---------------------------------------------------------------------- */
    /**
     *  Wraps the actual execution function by authorizing the user
     *  and calling the request_execute virtual function
     *    @param _paramlist list of XML parameters
     *    @param _retval value to be returned to the client
     */
    void execute(xmlrpc_c::paramList const& _paramList,
                 const xmlrpc_c::callInfo * _callInfoP,
                 xmlrpc_c::value * const    _retval) override;

    /**
     *  Actual Execution method for the request. Must be implemented by the
     *  XML-RPC requests
     *    @param _paramlist of the XML-RPC call (complete list)
     *    @param att the specific request attributes
     */
    virtual void request_execute(xmlrpc_c::paramList const& _paramList,
                                 RequestAttributesXRPC& att) = 0;

protected:
    //Timeout (ms) for request forwarding
    static inline const long long rpc_timeout = 10000;

private:
    void make_response(ErrorCode ec,
                       const std::string& value,
                       RequestAttributes& _att) override;

    void make_response(ErrorCode ec,
                       int value,
                       RequestAttributes& _att) override;

    void make_response(ErrorCode ec,
                       uint64_t value,
                       RequestAttributes& _att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif //REQUEST_XRPC_H_

