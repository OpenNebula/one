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

#include "RequestLogger.h"
#include "RequestAttributes.h"

#include <netdb.h>
#include <iomanip>

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string RequestLogger::object_name(PoolObjectSQL::ObjectType ob)
{
    switch (ob)
    {
        case PoolObjectSQL::VM:
            return "virtual machine";
        case PoolObjectSQL::HOST:
            return "host";
        case PoolObjectSQL::NET:
            return "virtual network";
        case PoolObjectSQL::IMAGE:
            return "image";
        case PoolObjectSQL::USER:
            return "user";
        case PoolObjectSQL::TEMPLATE:
            return "virtual machine template";
        case PoolObjectSQL::GROUP:
            return "group";
        case PoolObjectSQL::ACL:
            return "ACL";
        case PoolObjectSQL::DATASTORE:
            return "datastore";
        case PoolObjectSQL::CLUSTER:
            return "cluster";
        case PoolObjectSQL::DOCUMENT:
            return "document";
        case PoolObjectSQL::ZONE:
            return "zone";
        case PoolObjectSQL::SECGROUP:
            return "security group";
        case PoolObjectSQL::VDC:
            return "VDC";
        case PoolObjectSQL::VROUTER:
            return "virtual router";
        case PoolObjectSQL::MARKETPLACE:
            return "marketplace";
        case PoolObjectSQL::MARKETPLACEAPP:
            return "marketplaceapp";
        case PoolObjectSQL::VMGROUP:
            return "vm group";
        case PoolObjectSQL::VNTEMPLATE:
            return "virtual network template";
        case PoolObjectSQL::HOOK:
            return "hook";
        case PoolObjectSQL::BACKUPJOB:
            return "backup job";
        case PoolObjectSQL::SCHEDULEDACTION:
            return "scheduled action";
        default:
            return "-";
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestLogger::log_method_invoked(const RequestAttributes& att,
                                       const ParamList& pl,
                                       const std::string& method_name)
{
    std::ostringstream oss;
    std::ostringstream oss_limit;

    unsigned int limit = DEFAULT_LOG_LIMIT;

    char ip[NI_MAXHOST];
    char port[NI_MAXSERV];

    ip[0]   = '\0';
    port[0] = '\0';

    for (unsigned int j = 0 ; j < format_str.length() - 1; j++ )
    {
        if (format_str[j] != '%')
        {
            oss << format_str[j];
        }
        else
        {
            char mod;

            if (j+1 < format_str.length())
            {
                mod = format_str[j+1];
            }
            else
            {
                break;
            }

            switch(mod)
            {
                case '%':
                    oss << "%";
                    break;

                case 'i':
                    oss << std::setw(4) << std::setfill('0') << att.req_id;
                    break;

                case 'u':
                    oss << att.uid;
                    break;

                case 'U':
                    oss << att.uname;
                    break;

                case 'g':
                    oss << att.gid;
                    break;

                case 'G':
                    oss << att.gname;
                    break;

                case 'p':
                    oss << att.password;
                    break;

                case 'a':
                    oss << att.session;
                    break;

                case 'm':
                    oss << method_name;
                    break;

                case 'l':
                    while ((j+2)<format_str.length() && isdigit(format_str[j+2]))
                    {
                        oss_limit << format_str[j+2];
                        j = j+1;
                    }

                    if ( !oss_limit.str().empty() )
                    {
                        limit = stoi(oss_limit.str());
                    }

                    pl.log(oss, limit);
                    break;

                case 'A':
                    if ( ip[0] == '\0' )
                    {
                        client_ip(ip, port);
                    }

                    oss << ip;
                    break;

                case 'P':
                    if ( port[0] == '\0' )
                    {
                        client_ip(ip, port);
                    }

                    oss << port;
                    break;

                default:
                    oss << format_str[j] << format_str[j+1];
                    break;
            }

            j = j+1;
        }
    }

    NebulaLog::log("ReM", Log::DEBUG, oss);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestLogger::log_result(const RequestAttributes& att, const string& method_name)
{
    std::ostringstream oss;

    oss << "Req:" << std::setw(4) << std::setfill('0') << att.req_id << " UID:";

    if ( att.uid != -1 )
    {
        oss << att.uid;
    }
    else
    {
        oss << "-";
    }

    oss << " " << method_name << " result ";

    bool result = log_return_value(oss, att);

    if (result)
    {
        NebulaLog::log("ReM", Log::DEBUG, oss);
    }
    else
    {
        NebulaLog::log("ReM", Log::ERROR, oss);
    }
}

