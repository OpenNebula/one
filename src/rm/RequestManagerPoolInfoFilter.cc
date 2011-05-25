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

#include "RequestManagerPoolInfoFilter.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

const int RequestManagerPoolInfoFilter::ALL = -2;

const int RequestManagerPoolInfoFilter::MINE = -3;      

const int RequestManagerPoolInfoFilter::MINE_GROUP = -1; 

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void RequestManagerPoolInfoFilter::request_execute(xmlrpc_c::paramList const& paramList)
{
    int filter_flag = xmlrpc_c::value_int(paramList.getInt(1));

    ostringstream oss, where_string;

    int rc;
 
    switch(filter_flag)
    {
        case MINE:
            where_string << "UID=" << uid;
            break;

        case ALL:
            break;

        case MINE_GROUP:
            where_string << "UID=" << uid << " OR GID=" << gid;
            break;

        default:
            if ( filter_flag >= 0 )
            {
                where_string << "UID=" << filter_flag;
            }
            else
            {
                goto error_filter;
            }
            break;
    }

    //Authorize the operation
    if ( uid != 0 ) // uid == 0 means oneadmin
    {
        if (filter_flag == ALL || filter_flag >= 0) 
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
    }

    // Call the template pool dump
    rc = pool->dump(oss,where_string.str());

    if ( rc != 0 )
    {
        goto error_dump;
    }

    success_response(oss.str());

    return;

error_filter:
    failure_response(XML_RPC_API, "Incorrect filter_flag, must be >= -3.");
    return;

//TODO Get the object name from the AuthRequest Class
error_authorize:
    failure_response(AUTHORIZATION,
                     authorization_error("INFO","USER",uid,-1));
    return;

error_dump: //TBD Improve Error messages for DUMP
    oss.str();
    failure_response(INTERNAL,"Internal Error");
    return;
}

