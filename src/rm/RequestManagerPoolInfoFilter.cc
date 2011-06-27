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

const int VirtualMachinePoolInfo::ALL_VM = -2;

const int VirtualMachinePoolInfo::ACTIVE = -1;      

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void RequestManagerPoolInfoFilter::request_execute(xmlrpc_c::paramList const& paramList)
{
    int filter_flag = xmlrpc_c::value_int(paramList.getInt(1));
    int start_id    = xmlrpc_c::value_int(paramList.getInt(2));
    int end_id      = xmlrpc_c::value_int(paramList.getInt(3));

    ostringstream oss;

    bool          empty = true;
    ostringstream where_string;

    ostringstream uid_filter;
    ostringstream state_filter;
    ostringstream id_filter;

    string uid_str;
    string state_str;
    string id_str;

    int rc;

    // ------------ User ID filter -------------- 
    
    if ( filter_flag < MINE )
    {
        failure_response(XML_RPC_API,request_error("Incorrect filter_flag",""));
        return;
    }

    switch(filter_flag)
    {
        case MINE:
            uid_filter << "uid = " << uid;
            auth_op = AuthRequest::INFO_POOL_MINE;
            break;

        case ALL:
            break;

        case MINE_GROUP:
            uid_filter << "uid = " << uid << " OR gid = " << gid;
            auth_op = AuthRequest::INFO_POOL_MINE;
            break;

        default:
            uid_filter << "uid = " << filter_flag;
            break;
    }

    uid_str = uid_filter.str();

    // ------------ Resource ID filter -------------- 
    if ( start_id != -1 )
    {
        id_filter << "oid >= " << start_id;

        if ( end_id != -1 )
        {
            id_filter << " AND oid <= " << end_id;
        }
    }

    id_str = id_filter.str();

    // ------------ State filter for VM -------------- 
    if  ( auth_object == AuthRequest::VM )
    {
        int state = xmlrpc_c::value_int(paramList.getInt(4));

        if (( state < MINE ) || ( state > VirtualMachine::FAILED ))
        {
            failure_response(XML_RPC_API, 
                             request_error("Incorrect filter_flag, state",""));
            return;
        }

        switch(state)
        {
            case VirtualMachinePoolInfo::ALL_VM:
                break;

            case VirtualMachinePoolInfo::ACTIVE:
                state_filter << "state <> " << VirtualMachine::DONE;
                break;

            default:
                state_filter << "state = " << state;
                break;
        }
    }
    
    state_str = state_filter.str();

    // ------------ Compound WHERE clause --------------

    if (!uid_str.empty())
    {
        where_string << "(" << uid_str << ")" ;
        empty = false;
    }

    if (!id_str.empty()) 
    {
        if (!empty)
        {
            where_string << " AND ";
        }

        where_string << "(" << id_str << ")";
        empty = false;
    }

    if (!state_str.empty())
    {
        if (!empty)
        {
            where_string << " AND ";
        }

        where_string << "(" << state_str << ")";
    }


    if ( basic_authorization(-1) == false )
    {
        return;
    }
    
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

