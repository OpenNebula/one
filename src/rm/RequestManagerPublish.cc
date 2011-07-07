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

#include "RequestManagerPublish.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void RequestManagerPublish::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    int             oid   = xmlrpc_c::value_int(paramList.getInt(1));
    bool            pflag = xmlrpc_c::value_boolean(paramList.getBoolean(2));
    PoolObjectSQL * object;

    if ( basic_authorization(oid, att) == false )
    {
        return;
    }

    object = pool->get(oid,true);

    if ( object == 0 )                             
    {                                            
        failure_response(NO_EXISTS,
                get_error(object_name(auth_object),oid),
                att);

        return;
    }    

    int rc = publish(object,pflag);
    
    if ( rc != 0 )
    {
        failure_response(INTERNAL,
                request_error("Can not publish/unpublish resource",""),
                att);

        object->unlock();
        return;
    }

    pool->update(object);

    object->unlock();

    success_response(oid, att);

    return;
}

