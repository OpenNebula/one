/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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

void HostEnable::request_execute(xmlrpc_c::paramList const& paramList,
                                 RequestAttributes& att)
{
    int     id      = xmlrpc_c::value_int(paramList.getInt(1));
    bool    enable  = xmlrpc_c::value_boolean(paramList.getBoolean(2));

    Host * host;

    HostPool * hpool = static_cast<HostPool *>(pool);

    string error_str;

    if ( basic_authorization(id, att) == false )
    {
        return;
    }

    host = hpool->get(id,true);

    if ( host  == 0 )
    {
        failure_response(NO_EXISTS,
                get_error(object_name(auth_object),id),
                att);

        return;
    }

    if ( enable == true)
    {
        host->enable();
    }
    else
    {
        host->disable();
    }

    hpool->update(host);

    host->unlock();

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

    ostringstream oss;

    if ( basic_authorization(id, att) == false )
    {
        return;
    }

    rc = (static_cast<HostPool *>(pool))->dump_monitoring(oss, id);

    if ( rc != 0 )
    {
        failure_response(INTERNAL,request_error("Internal Error",""), att);
        return;
    }

    success_response(oss.str(), att);

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

