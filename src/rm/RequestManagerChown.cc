/* -------------------------------------------------------------------------- */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             */
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

#include "RequestManagerChown.h"

#include "NebulaLog.h"
#include "Nebula.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManagerChown::request_execute(xmlrpc_c::paramList const& paramList)
{
    int oid  = xmlrpc_c::value_int(paramList.getInt(1));
    int noid = xmlrpc_c::value_int(paramList.getInt(2));
    int ngid = xmlrpc_c::value_int(paramList.getInt(3));

    PoolObjectSQL * object;
    string          str;

    Nebula&     nd    = Nebula::instance();
    GroupPool * gpool = nd.get_gpool();
    UserPool  * upool = nd.get_upool();

    string      error_msg;
    int         rc;

    // TODO: maybe this authorization should include new user and new group
    // tokens
    if ( basic_authorization(oid) == false )
    {
        return;
    }

    // ------------- Check new user and group id's ---------------------

    if ( noid > -1 && upool->get(noid,false) == 0 )
    {
        failure_response(NO_EXISTS,
                get_error(object_name(AuthRequest::USER),noid));
        return;
    }

    if ( ngid > -1 && gpool->get(ngid,false) == 0 )
    {
        failure_response(NO_EXISTS, 
                get_error(object_name(AuthRequest::GROUP),ngid));
        return;
    }

    // ------------- Update the object ---------------------

    object = pool->get(oid,true);

    if ( object == 0 )                             
    {                                            
        failure_response(NO_EXISTS, get_error(object_name(auth_object),oid)); 
        return;
    }    

    if ( noid > -1 )
    {
        rc = set_uid(noid, object, error_msg);
    }
    if ( rc == 0 && ngid > -1 )
    {
        rc = set_gid(ngid, object, error_msg);
    }

    if ( rc != 0 )
    {
        failure_response(INTERNAL, request_error(error_msg,""));
        return;
    }

    success_response(oid);

    return;
}

