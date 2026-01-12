
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

#include "RequestLoggerGRPC.h"

#include <netdb.h>
#include <arpa/inet.h>

#include "RequestAttributesGRPC.h"
#include "NebulaLog.h"

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

void RequestLoggerGRPC::client_ip(char * const ip,
                                  char * const port)
{
    std::string peer = context->peer(); // "ipv4:192.168.0.1:12345"

    ip[0] = '-';
    ip[1] = '\0';

    port[0] = '-';
    port[1] = '\0';

    // Parse the peer string
    if (peer.rfind("ipv4:", 0) == 0)
    {
        std::string address = peer.substr(peer.find(":") + 1);
        size_t      colon   = address.rfind(':');

        if (colon != std::string::npos)
        {
            std::string ip_str   = address.substr(0, colon);
            std::string port_str = address.substr(colon + 1);

            strncpy(ip, ip_str.c_str(), NI_MAXHOST - 1);
            ip[NI_MAXHOST - 1] = '\0';

            strncpy(port, port_str.c_str(), NI_MAXSERV - 1);
            port[NI_MAXSERV - 1] = '\0';
        }
    }
    else if (peer.rfind("ipv6:", 0) == 0)
    {
        // Handles URL-encoded "ipv6:%5Baddress%5D:port" format
        const std::string open_bracket_enc = "%5B";
        const std::string close_bracket_enc = "%5D";

        size_t open_pos = peer.find(open_bracket_enc);
        size_t close_pos = peer.find(close_bracket_enc);

        if (open_pos != std::string::npos && close_pos != std::string::npos && close_pos > open_pos)
        {
            // Extract IP from between the encoded brackets
            std::string ip_str = peer.substr(open_pos + open_bracket_enc.length(),
                                             close_pos - (open_pos + open_bracket_enc.length()));
            strncpy(ip, ip_str.c_str(), NI_MAXHOST - 1);
            ip[NI_MAXHOST - 1] = '\0';

            // Port is after the closing bracket and a colon
            size_t last_colon = peer.rfind(':');
            if (last_colon != std::string::npos && last_colon > close_pos)
            {
                std::string port_str = peer.substr(last_colon + 1);
                strncpy(port, port_str.c_str(), NI_MAXSERV - 1);
                port[NI_MAXSERV - 1] = '\0';
            }
        }
    }
    else if (peer.rfind("unix:", 0) == 0)
    {
        std::string path = peer.substr(peer.find(":") + 1);

        strncpy(ip, path.c_str(), NI_MAXHOST - 1);
        ip[NI_MAXHOST - 1] = '\0';
        // port remains "-"
    }
    else
    {
        NebulaLog::warn("GRPC", "Unknown peer format: " + peer);
    }

    return;
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

bool RequestLoggerGRPC::log_return_value(std::ostringstream& oss,
                        const RequestAttributes& _att)
{
    auto& att = static_cast<const RequestAttributesGRPC&>(_att);

    bool result = att.retval.ok();

    if (result)
    {
        oss << "SUCCESS";

        ParamListGRPC pl(att.response, std::set<int>());
        std::string msg = pl.param_value(0);

        if (msg.length() > DEFAULT_LOG_LIMIT)
        {
            msg.replace(msg.begin(), msg.end(), msg.substr(0, DEFAULT_LOG_LIMIT) + "...");
        }

        oss << ", " << msg;
    }
    else
    {
        oss << "FAILURE "
            << att.retval.error_message();
    }

    return result;
}
