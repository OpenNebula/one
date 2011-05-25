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

#include "RequestManagerInfo.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void RequestManagerInfo::request_execute(
    int uid, 
    int gid,
    xmlrpc_c::paramList const& paramList)
{
    ostringstream oss;

    int  oid = xmlrpc_c::value_int(paramList.getInt(1));
    int  ouid;
    bool pub;

    PoolObjectSQL * object;

    object = pool->get(oid,true);

    if ( object == 0 )                             
    {                                            
        goto error_get;                     
    }    

    ouid = object->get_uid();
    pub  = isPublic(object);

    object->unlock();

    //Authorize the operation
    if ( uid != 0 ) // uid == 0 means oneadmin
    {
        AuthRequest ar(uid);

        ar.add_auth(auth_object,
                    oid,
                    AuthRequest::INFO,
                    ouid,
                    pub);

        if (UserPool::authorize(ar) == -1)
        {
            goto error_authorize;
        }
    }

    object = pool->get(oid,true);

    if ( object == 0 )                             
    {                                            
        goto error_get;                     
    }    

    oss << *object;

    object->unlock();

    success_response(oss.str());

    return;

error_get: //TBD Improve Error messages for DUMP
    failure_response(INTERNAL,"Internal Error");
    return;

//TODO Get the object name from the AuthRequest Class
error_authorize:
    failure_response(NO_EXISTS, get_error("USER",oid));
    return;

}

