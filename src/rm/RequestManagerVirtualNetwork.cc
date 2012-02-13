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

#include "RequestManagerVirtualNetwork.h"
#include "VirtualNetworkTemplate.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string RequestManagerVirtualNetwork::leases_error (const string& error)
{
    return request_error("Error modifying network leases",error);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void RequestManagerVirtualNetwork::
    request_execute(xmlrpc_c::paramList const& paramList,
                    RequestAttributes& att)
{
    int    id       = xmlrpc_c::value_int    (paramList.getInt(1));
    string str_tmpl = xmlrpc_c::value_string (paramList.getString(2));

    VirtualNetworkTemplate tmpl;
    VirtualNetwork *       vn;

    string error_str;
    int    rc;

    if ( basic_authorization(id, att) == false )
    {
        return;
    }

    rc = tmpl.parse_str_or_xml(str_tmpl, error_str);

    if ( rc != 0 )
    {
        failure_response(INTERNAL, leases_error(error_str), att);
        return;
    }

    vn = static_cast<VirtualNetwork *>(pool->get(id,true));

    if ( vn == 0 )
    {
        failure_response(NO_EXISTS, get_error(object_name(auth_object),id),att);
        return;
    }

    rc = leases_action(vn,&tmpl,error_str);

    if ( rc < 0 )
    {
        failure_response(INTERNAL, 
                request_error("Error modifying network leases",error_str),
                att);
        
        vn->unlock();
        return;
    }

    pool->update(vn);

    vn->unlock();
 
    success_response(id, att);
}

