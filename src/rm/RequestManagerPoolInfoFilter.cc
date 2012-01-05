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

const int RequestManagerPoolInfoFilter::ALL  = -2;

const int RequestManagerPoolInfoFilter::MINE = -3;      

/* ------------------------------------------------------------------------- */

const int VirtualMachinePoolInfo::ALL_VM   = -2;

const int VirtualMachinePoolInfo::NOT_DONE = -1;      

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void RequestManagerPoolInfoFilter::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    int filter_flag = xmlrpc_c::value_int(paramList.getInt(1));
    int start_id    = xmlrpc_c::value_int(paramList.getInt(2));
    int end_id      = xmlrpc_c::value_int(paramList.getInt(3));

    dump(att, filter_flag, start_id, end_id, "", "");
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void VirtualMachinePoolInfo::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    int filter_flag = xmlrpc_c::value_int(paramList.getInt(1));
    int start_id    = xmlrpc_c::value_int(paramList.getInt(2));
    int end_id      = xmlrpc_c::value_int(paramList.getInt(3));
    int state       = xmlrpc_c::value_int(paramList.getInt(4));

    ostringstream state_filter;

    if (( state < VirtualMachinePoolInfo::ALL_VM ) ||
        ( state > VirtualMachine::FAILED ))
    {
        failure_response(XML_RPC_API,
                         request_error("Incorrect filter_flag, state",""),
                         att);

        return;
    }

    switch(state)
    {
        case VirtualMachinePoolInfo::ALL_VM:
            break;

        case VirtualMachinePoolInfo::NOT_DONE:
            state_filter << "state <> " << VirtualMachine::DONE;
            break;

        default:
            state_filter << "state = " << state;
            break;
    }

    dump(att, filter_flag, start_id, end_id, state_filter.str(), "");
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void HostPoolInfo::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    dump(att, ALL, -1, -1, "", "");
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void GroupPoolInfo::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    dump(att, ALL, -1, -1, "", "");
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void UserPoolInfo::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    dump(att, ALL, -1, -1, "", "");
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void RequestManagerPoolInfoFilter::dump(
        RequestAttributes& att,
        int     filter_flag,
        int     start_id,
        int     end_id,
        string  and_clause,
        string  or_clause)
{
    set<int>::iterator it;

    ostringstream oss;
    bool          empty = true;
    ostringstream where_string;

    ostringstream uid_filter;
    ostringstream id_filter;

    string uid_str;
    string id_str;

    int rc;

    // ------------------------------------------ 
    //              User ID filter              
    // ------------------------------------------ 

    if ( filter_flag < MINE )
    {
        failure_response(XML_RPC_API,
                request_error("Incorrect filter_flag",""),
                att);
        return;
    }

    Nebula&     nd   = Nebula::instance();
    AclManager* aclm = nd.get_aclm();
    bool        all;
    vector<int> oids;
    vector<int> gids;


    if ( att.uid == 0 || att.gid == 0 )
    {
        all = true;
    }
    else
    {
        aclm->reverse_search(att.uid, att.gid, auth_object,
                            AuthRequest::USE, all, oids, gids);
    }

    if ( filter_flag != ALL )
    {
        int uid;

        if ( filter_flag == MINE )
        {
            uid = att.uid;
        }
        else
        {
            uid = filter_flag;
        }

        uid_filter << "uid = " << uid;
    }

    if ( !all ) // If all == true, there is not a uid or gid restriction
    {
        vector<int>::iterator it;

        if ( filter_flag != ALL )
        {
            uid_filter << " AND ";
        }

        // Permissions included in the resources
        uid_filter
            << "("
                << "(uid = " << att.uid << " AND owner_u = 1) OR "
                << "(gid = " << att.gid << " AND group_u = 1) OR "
                << "other_u = 1";

        for ( it=oids.begin(); it< oids.end(); it++ )
        {
            uid_filter << " OR oid = " << *it;
        }

        for ( it=gids.begin(); it< gids.end(); it++ )
        {
            uid_filter << " OR gid = " << *it;
        }

        uid_filter << ")";
    }

    uid_str = uid_filter.str();

    // ------------------------------------------ 
    //              Resource ID filter 
    // ------------------------------------------ 

    if ( start_id != -1 )
    {
        id_filter << "oid >= " << start_id;

        if ( end_id != -1 )
        {
            id_filter << " AND oid <= " << end_id;
        }
    }

    id_str = id_filter.str();

    // ------------------------------------------ 
    //           Compound WHERE clause 
    // ------------------------------------------ 

    // WHERE ( id_str ) AND ( uid_str ) AND ( and_clause ) OR ( or_clause )

    if (!id_str.empty())
    {
        where_string << "(" << id_str << ")" ;
        empty = false;
    }

    if (!uid_str.empty())
    {
        if (!empty)
        {
            where_string << " AND ";
        }

        where_string << "(" << uid_str << ")";
        empty = false;
    }

    if (!and_clause.empty())
    {
        if (!empty)
        {
            where_string << " AND ";
        }

        where_string << "(" << and_clause << ")";
    }

    if (!or_clause.empty())
    {
        if (!empty)
        {
            where_string << " OR ";
        }

        where_string << "(" << or_clause << ")";
    }

    // ------------------------------------------ 
    //           Get the pool
    // ------------------------------------------ 
    
    rc = pool->dump(oss,where_string.str());

    if ( rc != 0 )
    {
        failure_response(INTERNAL,request_error("Internal Error",""), att);
        return;
    }

    success_response(oss.str(), att);

    return;
}

