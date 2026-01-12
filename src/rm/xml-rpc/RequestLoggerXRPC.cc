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

#include "RequestLoggerXRPC.h"
#include "RequestAttributesXRPC.h"
#include "RequestManagerXRPC.h"

#include <xmlrpc-c/server_abyss.hpp>

#include <netdb.h>
#include <vector>

using namespace std;

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

void RequestLoggerXRPC::client_ip(char * const ip,
                                  char * const port)
{
    // 1. Get the socket id and prepare the address structure
    auto client_fd = Nebula::instance().get_rm_xrpc()->get_socket();

    struct sockaddr_storage addr_storage;
    socklen_t               addr_len = sizeof(addr_storage);

    // 2. This fills addr_storage with the remote address information.
    if ( getpeername(client_fd, (struct sockaddr*)&addr_storage, &addr_len) != 0 )
    {
        ip[0] = '-';
        ip[1] = '\0';

        port[0] = '-';
        port[1] = '\0';

        return;
    }

    // 3. Read the IP and Port from addr_storage
    int rc = getnameinfo((struct sockaddr*)&addr_storage,
                         addr_len,
                         ip,
                         NI_MAXHOST, port, NI_MAXSERV, NI_NUMERICHOST|NI_NUMERICSERV);

    if ( rc != 0 )
    {
        ip[0] = '-';
        ip[1] = '\0';

        port[0] = '-';
        port[1] = '\0';
    }
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

bool RequestLoggerXRPC::log_return_value(std::ostringstream& oss,
                                         const RequestAttributes& _att)
{
    auto& att = static_cast<const RequestAttributesXRPC&>(_att);

    xmlrpc_c::value_array array1(*att.retval);
    std::vector<xmlrpc_c::value> const vvalue(array1.vectorValueValue());

    bool result = static_cast<bool>(xmlrpc_c::value_boolean(vvalue[0]));

    if (result)
    {
        oss << "SUCCESS";

        for (unsigned int i=1; i<vvalue.size()-1; i++)
        {
            log_xmlrpc_value(vvalue[i], oss, DEFAULT_LOG_LIMIT);
        }
    }
    else
    {
        oss << "FAILURE "
            << static_cast<std::string>(xmlrpc_c::value_string(vvalue[1]));
    }

    return result;
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

void RequestLoggerXRPC::log_xmlrpc_value(const xmlrpc_c::value& v,
                                         std::ostringstream& oss,
                                         const int limit)
{
   size_t st_limit = limit;
   size_t st_newline;

   switch (v.type())
   {
       case xmlrpc_c::value::TYPE_INT:
           oss << ", " << static_cast<int>(xmlrpc_c::value_int(v));
           break;

       case xmlrpc_c::value::TYPE_BOOLEAN:
           if ( static_cast<bool>(xmlrpc_c::value_boolean(v)) )
           {
               oss << ", true";
           }
           else
           {
               oss << ", false";
           }

           break;

       case xmlrpc_c::value::TYPE_STRING:
           st_newline = static_cast<std::string>(xmlrpc_c::value_string(v)).length();

           if ( st_newline < st_limit )
           {
               st_limit = st_newline;
           }

           oss << ", \"" <<
               static_cast<std::string>(xmlrpc_c::value_string(v)).substr(0, st_limit);

           if ( static_cast<std::string>(xmlrpc_c::value_string(v)).size() > st_limit )
           {
               oss << "...";
           }

           oss << "\"";
           break;

       case xmlrpc_c::value::TYPE_DOUBLE:
           oss << ", " << static_cast<double>(xmlrpc_c::value_double(v));
           break;

       case xmlrpc_c::value::TYPE_I8:
           oss << ", " << static_cast<uint64_t>(xmlrpc_c::value_i8(v));
           break;

       default:
           oss  << ", unknown param type";
           break;
   }

}

