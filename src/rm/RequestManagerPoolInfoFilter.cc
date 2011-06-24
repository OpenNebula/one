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
    int start_id    = xmlrpc_c::value_int(paramList.getInt(2));
    int end_id      = xmlrpc_c::value_int(paramList.getInt(3));

    ostringstream oss, where_string;

    int rc;

    if ( filter_flag < MINE )
    {
        failure_response(XML_RPC_API, request_error("Incorrect filter_flag",""));
        return;
    }
 
    switch(filter_flag)
    {
        case MINE:
            where_string << "uid = " << uid;
            auth_op = AuthRequest::INFO_POOL_MINE;
            break;

        case ALL:
            break;

        case MINE_GROUP:
            where_string << "( uid = " << uid << " OR gid= " << gid << " )";
            auth_op = AuthRequest::INFO_POOL_MINE;
            break;

        default:
            where_string << "uid = " << filter_flag;
            break;
    }

    if ( start_id != -1 )
    {
        if (filter_flag != ALL)
        {
            where_string << " AND ";
        }

        where_string << "( oid >= " << start_id;

        if ( end_id != -1 )
        {
            where_string << " AND oid <= " << end_id << " )";
        }
        else
        {
            where_string << " )";
        }
    }

    if ( basic_authorization(-1) == false )
    {
        return;
    }
    
    auth_object = AuthRequest::VM;
    // Call the template pool dump
    rc = pool->dump(oss,where_string.str());

    if ( rc != 0 )
    {
        failure_response(INTERNAL,request_error("Internal Error",""));
        return;
    }

    success_response(oss.str());

    return;
}

