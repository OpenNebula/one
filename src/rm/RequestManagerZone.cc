/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

#include "RequestManagerZone.h"
#include "Nebula.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ZoneAddServer::request_execute(xmlrpc_c::paramList const& paramList,
    RequestAttributes& att)
{
    int    id     = xmlrpc_c::value_int(paramList.getInt(1));
    string zs_str = xmlrpc_c::value_string(paramList.getString(2));

    string error_str;

    if ( basic_authorization(id, att) == false )
    {
        return;
    }

    Template zs_tmpl;

    int rc = zs_tmpl.parse_str_or_xml(zs_str, error_str);

    if ( rc != 0 )
    {
        att.resp_msg = error_str;
        failure_response(ACTION, att);

        return;
    }

    Zone * zone = (static_cast<ZonePool *>(pool))->get(id, true);

    if ( zone == 0 )
    {
        att.resp_id = id;
        failure_response(NO_EXISTS, att);

        return;
    }

    if ( zone->add_server(zs_tmpl, att.resp_msg) == -1 )
    {
        failure_response(ACTION, att);

        return;
    }

    pool->update(zone);

    zone->unlock();

    success_response(id, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ZoneDeleteServer::request_execute(xmlrpc_c::paramList const& paramList,
    RequestAttributes& att)
{
    int id    = xmlrpc_c::value_int(paramList.getInt(1));
    int zs_id = xmlrpc_c::value_int(paramList.getInt(2));

    string error_str;

    if ( basic_authorization(id, att) == false )
    {
        return;
    }

    Zone * zone = (static_cast<ZonePool *>(pool))->get(id, true);

    if ( zone == 0 )
    {
        att.resp_id = id;
        failure_response(NO_EXISTS, att);

        return;
    }

    if ( zone->delete_server(zs_id, att.resp_msg) == -1 )
    {
        failure_response(ACTION, att);
        zone->unlock();

        return;
    }

    pool->update(zone);

    zone->unlock();

    success_response(id, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

