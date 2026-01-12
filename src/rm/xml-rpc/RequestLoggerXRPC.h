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

#ifndef REQUEST_LOGGER_XRPC_H_
#define REQUEST_LOGGER_XRPC_H_

#include "RequestLogger.h"
#include "RequestAttributesXRPC.h"

#include <xmlrpc-c/base.hpp>
#include <xmlrpc-c/registry.hpp>


/**
 *  The Request Class represents the basic abstraction for the OpenNebula
 *  XML-RPC API. This interface must be implemented by any XML-RPC API call
 */
class RequestLoggerXRPC : public RequestLogger
{
protected:
    void client_ip(char * const ip,
                   char * const port) override;

    bool log_return_value(std::ostringstream& oss,
                          const RequestAttributes& _att) override;
    /**
     * Formats and adds a xmlrpc_c::value to oss.
     *
     * @param v value to format
     * @param oss stream to write v
     * @param limit of characters to wirte
     */
     void log_xmlrpc_value(const xmlrpc_c::value& v,
                           std::ostringstream& oss,
                           const int limit);
};

#endif //REQUEST_LOGGER_XRPC_H_

