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

#ifndef REQUEST_LOGGER_H_
#define REQUEST_LOGGER_H_

#include <string>
#include <sstream>

#include "PoolObjectSQL.h"

class RequestAttributes;

class ParamList;

/**
 *  The Request Class represents the basic abstraction for the OpenNebula
 *  XML-RPC API. This interface must be implemented by any XML-RPC API call
 */
class RequestLogger
{
public:
    RequestLogger() = default;

    virtual ~RequestLogger() = default;

    /**
     *  Gets a string representation for the Auth object in the
     *  request.
     *    @param ob object for the auth operation
     *    @return string equivalent of the object
     */
    static std::string object_name(PoolObjectSQL::ObjectType ob);

    /**
     *  Sets the format string to log xml-rpc method calls. The format string
     *  interprets the following sequences:
     *    %i -- request id
     *    %m -- method name
     *    %u -- user id
     *    %U -- user name
     *    %l -- param list
     *    %p -- user password
     *    %g -- group id
     *    %G -- group name
     *    %a -- auth token
     *    %A -- client IP address (only IPv4)
     *    %a -- client port (only IPv4)
     *    %% -- %
     */
    static void set_call_log_format(const std::string& log_format)
    {
        format_str = log_format;
    }

    /**
     * Logs the method invocation, including the arguments
     * @param att the specific request attributes
     * @param paramList list of XML parameters
     * @param hidden_params params not to be shown
     * @param callInfoP information of client
     */
    void log_method_invoked(const RequestAttributes& att,
                            const ParamList& pl,
                            const std::string& method_name);

    /**
     * Logs the method result, including the output data or error message
     *
     * @param att the specific request attributes
     * @param method_name that produced the error
     */
    void log_result(const RequestAttributes& att, const std::string& method_name);

protected:
    // Default number of character to show in the log. Option %l<number>
    const static inline int DEFAULT_LOG_LIMIT = 20;

    static inline std::string format_str;

    virtual void client_ip(char * const ip, char * const port) = 0;

    virtual bool log_return_value(std::ostringstream& oss,
                                  const RequestAttributes& att) = 0;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif //REQUEST_LOGGER_H_

