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

#include "RequestManagerDelete.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void RequestManagerDelete::request_execute(xmlrpc_c::paramList const& paramList)
{
    int             oid = xmlrpc_c::value_int(paramList.getInt(1));
    PoolObjectSQL * object;

    if ( basic_authorization(oid) == false )
    {
        return;
    }

    object = pool->get(oid,true);

    if ( object == 0 )                             
    {                                            
        failure_response(NO_EXISTS, get_error("USER",oid));
        return;
    }    

    int rc = pool->drop(object);

    object->unlock();

    if ( rc != 0 )
    {
        failure_response(INTERNAL,"Internal Error");
        return;
    }

    success_response(oid);

    return;
}

