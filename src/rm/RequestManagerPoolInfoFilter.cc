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

#include "RequestManagerPoolInfoFilter.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

const int RequestManagerPoolInfoFilter::ALL  = -2;

const int RequestManagerPoolInfoFilter::MINE = -3;      

const int RequestManagerPoolInfoFilter::MINE_GROUP = -1;

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

void DatastorePoolInfo::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    dump(att, ALL, -1, -1, "", "");
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void ClusterPoolInfo::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    dump(att, ALL, -1, -1, "", "");
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void RequestManagerPoolInfoFilter::dump(
        RequestAttributes& att,
        int                filter_flag,
        int                start_id,
        int                end_id,
        const string&      and_clause,
        const string&      or_clause)
{
    set<int>::iterator it;

    ostringstream oss;
    bool          empty = true;
    ostringstream where_string;

    ostringstream uid_filter;
    ostringstream id_filter;

    string uid_str;
    string acl_str;
    string id_str;

    int rc;

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

    // -------------------------------------------------------------------------
    //                             User ID filter              
    // ------------------------------------------------------------------------- 

    if ( att.uid == 0 || att.gid == 0 )
    {
        all = true;
    }
    else
    {
        ostringstream         acl_filter;
        vector<int>::iterator it;   

        aclm->reverse_search(att.uid, 
                             att.gid, 
                             auth_object,
                             AuthRequest::USE, 
                             all, 
                             oids, 
                             gids);

        for ( it = oids.begin(); it < oids.end(); it++ )
        {
            acl_filter << " OR oid = " << *it;
        }

        for ( it = gids.begin(); it < gids.end(); it++ )
        {
            acl_filter << " OR gid = " << *it;
        }

        acl_str = acl_filter.str();
    }

    switch ( filter_flag )
    {
        case MINE:
            uid_filter << "uid = " << att.uid;
            break;

        case MINE_GROUP:
            uid_filter << " uid = " << att.uid 
                       << " OR ( gid = " << att.gid << " AND group_u = 1 )";
            break;

        case ALL:
            if (!all)
            {
                uid_filter << " uid = " << att.uid 
                           << " OR ( gid = " << att.gid << " AND group_u = 1 )"
                           << " OR other_u = 1"
                           << acl_str;
            }
            break;

        default:
            uid_filter << "uid = " << filter_flag;

            if ( filter_flag != att.uid && !all )
            {
                uid_filter << " AND ("
                           << " ( gid = " << att.gid << " AND group_u = 1)"
                           << " OR other_u = 1"
                           << acl_str
                           << ")";
            }
            break;
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
        empty = false;
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

