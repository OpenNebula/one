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

#include "RequestManagerPoolInfo.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void RequestManagerPoolInfo::request_execute(xmlrpc_c::paramList const& paramList)
{
    ostringstream oss;
    int rc;

    //Authorize the operation
    if ( uid != 0 ) // uid == 0 means oneadmin
    {
        AuthRequest ar(uid);

        ar.add_auth(auth_object,
                    -1,
                    AuthRequest::INFO_POOL,
                    0,
                    false);

        if (UserPool::authorize(ar) == -1)
        {
            goto error_authorize;
        }
    }

    // Call the template pool dump
    rc = pool->dump(oss,"");

    if ( rc != 0 )
    {
        goto error_dump;
    }

    success_response(oss.str());

    return;
//TODO Get the object name from the AuthRequest Class
error_authorize:
    failure_response(AUTHORIZATION,
                     authorization_error("INFO","USER",uid,-1));
    return;

error_dump: //TBD Improve Error messages for DUMP
    failure_response(INTERNAL,"Internal Error");
    return;
}

