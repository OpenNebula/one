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

#include "Request.h"
#include "Nebula.h"

#include "PoolObjectAuth.h"

#include "RequestLogger.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Request::failure_response(ErrorCode ec, RequestAttributes& att)
{
    failure_response(ec, failure_message(ec, att, _method_name, _auth_object), att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string Request::failure_message(ErrorCode ec,
                                RequestAttributes& att,
                                const std::string& method_name,
                                PoolObjectSQL::ObjectType auth_object)
{
    std::ostringstream oss;
    std::string obname;

    if ( att.resp_obj == PoolObjectSQL::NONE )
    {
        obname = RequestLogger::object_name(auth_object);
    }
    else
    {
        obname = RequestLogger::object_name(att.resp_obj);
    }

    oss << "[" << method_name << "] ";

    switch(ec)
    {
        case ErrorCode::SUCCESS:
            return "";

        case ErrorCode::AUTHORIZATION:
            oss << "User [" << att.uid << "] ";

            if (att.resp_msg.empty())
            {
                oss << "not authorized to perform action on " << obname << ".";
            }
            else
            {
                oss << ": " << att.resp_msg << ".";
            }
            break;

        case ErrorCode::AUTHENTICATION:
            oss << "User couldn't be authenticated, aborting call.";
            break;

        case ErrorCode::ACTION:
        case ErrorCode::RPC_API:
        case ErrorCode::INTERNAL:
            oss << att.resp_msg;
            break;

        case ErrorCode::NO_EXISTS:
            oss << "Error getting " << obname;

            if ( att.resp_id != -1 )
            {
                oss << " [" << att.resp_id << "].";
            }
            else
            {
                oss << " Pool.";
            }
            break;

        case ErrorCode::ALLOCATE:
            oss << "Error allocating a new " << obname << ".";

            if (!att.resp_msg.empty())
            {
                oss << " " << att.resp_msg;
            }
            break;

        case ErrorCode::LOCKED:
            oss << "The resource " << obname << " is locked.";

            if ( att.resp_id != -1 )
            {
                oss << " [" << att.resp_id << "].";
            }
            break;

        case ErrorCode::REPLICATION:
            oss << "Error replicating log entry " << att.replication_idx;

            if (att.resp_msg.empty())
            {
                oss << ".";
            }
            else
            {
                oss << ": " << att.resp_msg << ".";
            }
            break;
    }

    return oss.str();
}
