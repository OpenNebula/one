/* -------------------------------------------------------------------------- */
/* Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

bool RequestManagerPoolInfoFilter::use_filter(RequestAttributes& att,
    PoolObjectSQL::ObjectType aobj,
    string& where_str)
{
    bool all;

    string acl_str;

    PoolSQL::acl_filter(att.uid, att.group_ids, aobj, all, acl_str);

    PoolSQL::usr_filter(att.uid, att.group_ids, ALL, all, acl_str, where_str);

    return all;
};

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

void VirtualMachinePoolAccounting::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    int filter_flag = xmlrpc_c::value_int(paramList.getInt(1));
    int time_start  = xmlrpc_c::value_int(paramList.getInt(2));
    int time_end    = xmlrpc_c::value_int(paramList.getInt(3));

    ostringstream oss;
    string        where;
    int           rc;

    if ( filter_flag < MINE )
    {
        failure_response(XML_RPC_API,
                request_error("Incorrect filter_flag",""),
                att);
        return;
    }

    where_filter(att, filter_flag, -1, -1, "", "", where);

    rc = (static_cast<VirtualMachinePool *>(pool))->dump_acct(oss,
                                                              where,
                                                              time_start,
                                                              time_end);
    if ( rc != 0 )
    {
        failure_response(INTERNAL,request_error("Internal Error",""), att);
        return;
    }

    success_response(oss.str(), att);

    return;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void VirtualMachinePoolMonitoring::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    int filter_flag = xmlrpc_c::value_int(paramList.getInt(1));

    ostringstream oss;
    string        where;
    int           rc;

    if ( filter_flag < MINE )
    {
        failure_response(XML_RPC_API,
                request_error("Incorrect filter_flag",""),
                att);
        return;
    }

    where_filter(att, filter_flag, -1, -1, "", "", where);

    rc = (static_cast<VirtualMachinePool *>(pool))->dump_monitoring(oss, where);

    if ( rc != 0 )
    {
        failure_response(INTERNAL,request_error("Internal Error",""), att);
        return;
    }

    success_response(oss.str(), att);

    return;
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

void HostPoolMonitoring::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    ostringstream oss;
    string        where;
    int           rc;

    where_filter(att, ALL, -1, -1, "", "", where);

    rc = (static_cast<HostPool *>(pool))->dump_monitoring(oss, where);

    if ( rc != 0 )
    {
        failure_response(INTERNAL,request_error("Internal Error",""), att);
        return;
    }

    success_response(oss.str(), att);

    return;
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

void DocumentPoolInfo::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    int filter_flag = xmlrpc_c::value_int(paramList.getInt(1));
    int start_id    = xmlrpc_c::value_int(paramList.getInt(2));
    int end_id      = xmlrpc_c::value_int(paramList.getInt(3));
    int type        = xmlrpc_c::value_int(paramList.getInt(4));

    ostringstream oss;
    oss << "type = " << type;

    dump(att, filter_flag, start_id, end_id, oss.str(), "");
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void ZonePoolInfo::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    dump(att, ALL, -1, -1, "", "");
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void RequestManagerPoolInfoFilter::where_filter(
        RequestAttributes& att,
        int                filter_flag,
        int                start_id,
        int                end_id,
        const string&      and_clause,
        const string&      or_clause,
        string&            filter_str)
{
    bool empty = true;
    bool all;

    string acl_str;
    string uid_str;
    string oid_str;

    ostringstream filter;

    PoolSQL::acl_filter(att.uid, att.group_ids, auth_object, all, acl_str);

    PoolSQL::usr_filter(att.uid, att.group_ids, filter_flag, all, acl_str, uid_str);

    PoolSQL::oid_filter(start_id, end_id, oid_str);

    // -------------------------------------------------------------------------
    //                          Compound WHERE clause
    //   WHERE ( id_str ) AND ( uid_str ) AND ( and_clause ) OR ( or_clause )
    // -------------------------------------------------------------------------

    if (!oid_str.empty())
    {
        filter << "(" << oid_str << ")" ;
        empty = false;
    }

    if (!uid_str.empty())
    {
        if (!empty)
        {
            filter << " AND ";
        }

        filter << "(" << uid_str << ")";
        empty = false;
    }

    if (!and_clause.empty())
    {
        if (!empty)
        {
            filter << " AND ";
        }

        filter << "(" << and_clause << ")";
        empty = false;
    }

    if (!or_clause.empty())
    {
        if (!empty)
        {
            filter << " OR ";
        }

        filter << "(" << or_clause << ")";
    }

    filter_str = filter.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManagerPoolInfoFilter::dump(
        RequestAttributes& att,
        int                filter_flag,
        int                start_id,
        int                end_id,
        const string&      and_clause,
        const string&      or_clause)
{
    ostringstream oss;
    string        where_string, limit_clause;
    int           rc;

    if ( filter_flag < MINE )
    {
        failure_response(XML_RPC_API,
                request_error("Incorrect filter_flag",""),
                att);
        return;
    }

    where_filter(att,
                 filter_flag,
                 start_id,
                 end_id,
                 and_clause,
                 or_clause,
                 where_string);

    if ( end_id < -1 )
    {
        oss << start_id << "," << -end_id;
        limit_clause = oss.str();
        oss.str("");
    }

    rc = pool->dump(oss, where_string, limit_clause);

    if ( rc != 0 )
    {
        failure_response(INTERNAL,request_error("Internal Error",""), att);
        return;
    }

    success_response(oss.str(), att);

    return;
}
