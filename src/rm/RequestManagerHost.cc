/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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

#include "RequestManagerHost.h"
#include "Nebula.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostStatus::request_execute(xmlrpc_c::paramList const& paramList,
                                 RequestAttributes& att)
{
    int     id = xmlrpc_c::value_int(paramList.getInt(1));
    int status = xmlrpc_c::value_int(paramList.getInt(2));

    HostPool * hpool = static_cast<HostPool *>(pool);

    if ( basic_authorization(id, att) == false )
    {
        return;
    }

    auto host = hpool->get(id);

    if ( host == nullptr )
    {
        att.resp_id = id;
        failure_response(NO_EXISTS, att);

        return;
    }

    switch (status)
    {
        case ENABLED:
            host->enable();
            break;
        case DISABLED:
            host->disable();
            break;
        case OFFLINE:
            host->offline();
            break;
        default:
            att.resp_msg = "Wrong status code";
            failure_response(INTERNAL, att);

            return;
    }

    hpool->update(host.get());

    success_response(id, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostMonitoring::request_execute(
        xmlrpc_c::paramList const&  paramList,
        RequestAttributes&          att)
{
    int id  = xmlrpc_c::value_int(paramList.getInt(1));
    int rc;

    std::string oss;

    if ( basic_authorization(id, att) == false )
    {
        return;
    }

    rc = (static_cast<HostPool *>(pool))->dump_monitoring(oss, id);

    if ( rc != 0 )
    {
        att.resp_msg = "Internal error";
        failure_response(INTERNAL, att);
        return;
    }

    success_response(oss, att);

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

