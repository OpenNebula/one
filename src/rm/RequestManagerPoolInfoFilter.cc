/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

const int RequestManagerPoolInfoFilter::GROUP = -4;

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
    bool disable_all_acl,
    bool disable_cluster_acl,
    bool disable_group_acl,
    const string& and_str,
    string& where_str)
{
    bool all;

    string acl_str;
    string usr_str;


    PoolSQL::acl_filter(att.uid, att.group_ids, aobj, all,
        disable_all_acl, disable_cluster_acl, disable_group_acl, acl_str);

    PoolSQL::usr_filter(att.uid, att.gid, att.group_ids, ALL, all, acl_str,
        where_str);

    if (!and_str.empty())
    {
        ostringstream filter;

        filter << "( " << where_str << " ) AND ( " << and_str << " )";

        where_str = filter.str();
    }

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

    std::string fts_query;

    if (paramList.size() > 5)
    {
        fts_query = xmlrpc_c::value_string(paramList.getString(5));

        if (!fts_query.empty() && !pool->is_fts_available())
        {
            att.resp_msg = "Full text search is not supported by the SQL backend";

            failure_response(INTERNAL, att);
            return;
        }
    }

    ostringstream and_filter;

    if (( state < VirtualMachinePoolInfo::ALL_VM ) ||
        ( state > VirtualMachine::CLONING_FAILURE ))
    {
        att.resp_msg = "Incorrect filter_flag, state";

        failure_response(XML_RPC_API, att);
        return;
    }

    switch(state)
    {
        case VirtualMachinePoolInfo::ALL_VM:
            break;

        case VirtualMachinePoolInfo::NOT_DONE:
            and_filter << "state <> " << VirtualMachine::DONE;
            break;

        default:
            and_filter << "state = " << state;
            break;
    }

    if (!fts_query.empty())
    {
        char * _fts_query = pool->escape_str(fts_query);

        if ( _fts_query == 0 )
        {
            att.resp_msg = "Error building search query";

            failure_response(INTERNAL, att);
            return;
        }

        if (!and_filter.str().empty())
        {
            and_filter << " AND ";
        }

        and_filter << "MATCH(search_token) AGAINST ('+\"";
        one_util::escape_token(_fts_query, and_filter);
        and_filter << "\"' in boolean mode)";

        pool->free_str(_fts_query);
    }

    dump(att, filter_flag, start_id, end_id, and_filter.str(), "");
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

    string oss;
    string where;
    int rc;

    if ( filter_flag < GROUP )
    {
        att.resp_msg = "Incorrect filter_flag";
        failure_response(XML_RPC_API, att);
        return;
    }

    where_filter(att, filter_flag, -1, -1, "", "", false, false, false, where);

    rc = (static_cast<VirtualMachinePool *>(pool))->dump_acct(oss,
                                                              where,
                                                              time_start,
                                                              time_end);
    if ( rc != 0 )
    {
        att.resp_msg = "Internal error";
        failure_response(INTERNAL, att);
        return;
    }

    success_response(oss, att);

    return;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void VirtualMachinePoolShowback::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    int filter_flag = xmlrpc_c::value_int(paramList.getInt(1));
    int start_month = xmlrpc_c::value_int(paramList.getInt(2));
    int start_year  = xmlrpc_c::value_int(paramList.getInt(3));
    int end_month   = xmlrpc_c::value_int(paramList.getInt(4));
    int end_year    = xmlrpc_c::value_int(paramList.getInt(5));

    string oss;
    string        where;
    int           rc;

    if ( filter_flag < GROUP )
    {
        att.resp_msg = "Incorrect filter_flag";
        failure_response(XML_RPC_API, att);
        return;
    }

    where_filter(att, filter_flag, -1, -1, "", "", false, false, false, where);

    rc = (static_cast<VirtualMachinePool *>(pool))->dump_showback(oss,
                                                              where,
                                                              start_month,
                                                              start_year,
                                                              end_month,
                                                              end_year);
    if ( rc != 0 )
    {
        att.resp_msg = "Internal error";
        failure_response(INTERNAL, att);
        return;
    }

    success_response(oss, att);

    return;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void VirtualMachinePoolMonitoring::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    int filter_flag = xmlrpc_c::value_int(paramList.getInt(1));

    string oss;
    string        where;
    int           rc;

    if ( filter_flag < GROUP )
    {
        att.resp_msg = "Incorrect filter_flag";
        failure_response(XML_RPC_API, att);
        return;
    }

    where_filter(att, filter_flag, -1, -1, "", "", false, false, false, where);

    rc = (static_cast<VirtualMachinePool *>(pool))->dump_monitoring(oss, where);

    if ( rc != 0 )
    {
        att.resp_msg = "Internal error";
        failure_response(INTERNAL, att);
        return;
    }

    success_response(oss, att);

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
    string oss;
    string where;

    int rc;

    where_filter(att, ALL, -1, -1, "", "", false, false, false, where);

    rc = (static_cast<HostPool *>(pool))->dump_monitoring(oss, where);

    if ( rc != 0 )
    {
        att.resp_msg = "Internal error";
        failure_response(INTERNAL, att);
        return;
    }

    success_response(oss, att);

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
        bool               disable_all_acl,
        bool               disable_cluster_acl,
        bool               disable_group_acl,
        string&            filter_str)
{
    bool empty = true;
    bool all;

    string acl_str;
    string uid_str;
    string oid_str;

    ostringstream filter;

    PoolSQL::acl_filter(att.uid, att.group_ids, auth_object, all,
        disable_all_acl, disable_cluster_acl, disable_group_acl, acl_str);

    PoolSQL::usr_filter(att.uid, att.gid, att.group_ids, filter_flag, all,
        acl_str, uid_str);

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
    std::string str;

    std::ostringstream oss;

    std::string where_string, limit_clause;
    std::string desc;

    int rc;

    if ( filter_flag < GROUP )
    {
        att.resp_msg = "Incorrect filter_flag";
        failure_response(XML_RPC_API, att);
        return;
    }

    where_filter(att,
                 filter_flag,
                 start_id,
                 end_id,
                 and_clause,
                 or_clause,
                 false,
                 false,
                 false,
                 where_string);

    if ( end_id < -1 )
    {
        oss << start_id << "," << -end_id;
        limit_clause = oss.str();
    }

    Nebula::instance().get_configuration_attribute(att.uid, att.gid,
            "API_LIST_ORDER", desc);

    rc = pool->dump(str, where_string, limit_clause,
            one_util::toupper(desc) == "DESC");

    if ( rc != 0 )
    {
        att.resp_msg = "Internal error";
        failure_response(INTERNAL, att);
        return;
    }

    success_response(str, att);

    return;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void VirtualNetworkPoolInfo::request_execute(
        xmlrpc_c::paramList const& paramList, RequestAttributes& att)
{
    int filter_flag = xmlrpc_c::value_int(paramList.getInt(1));
    int start_id    = xmlrpc_c::value_int(paramList.getInt(2));
    int end_id      = xmlrpc_c::value_int(paramList.getInt(3));

    if ( filter_flag < GROUP )
    {
        att.resp_msg = "Incorrect filter_flag";
        failure_response(XML_RPC_API, att);
        return;
    }

    /* ---------------------------------------------------------------------- */
    /*  Build where filters to get ois from:                                  */
    /*    - vnets (owner, permissions & ACL)                                  */
    /*    - reservations (owner, permission & not VNET\* nor VNET/% ACLs)     */
    /* ---------------------------------------------------------------------- */

    string  where_vnets, where_reserv;
    ostringstream where_string;

    where_filter(att, filter_flag, start_id, end_id, "pid = -1", "", false,
        false, false, where_vnets);

    where_filter(att, filter_flag, start_id, end_id, "pid != -1", "", true,
        true, false, where_reserv);

    where_string << "( " << where_vnets << " ) OR ( " << where_reserv << " ) ";

    /* ---------------------------------------------------------------------- */
    /*  Build pagination limits                                               */
    /* ---------------------------------------------------------------------- */

    ostringstream limit_clause;

    if ( end_id < -1 )
    {
        limit_clause << start_id << "," << -end_id;
    }

    /* ---------------------------------------------------------------------- */
    /*  Get the VNET pool                                                     */
    /* ---------------------------------------------------------------------- */
    std::string pool_oss;
    std::string desc;

    Nebula::instance().get_configuration_attribute(att.uid, att.gid, 
            "API_LIST_ORDER", desc);

    int rc = pool->dump(pool_oss, where_string.str(), limit_clause.str(),
            one_util::toupper(desc) == "DESC");

    if ( rc != 0 )
    {
        att.resp_msg = "Internal error";
        failure_response(INTERNAL, att);
        return;
    }

    success_response(pool_oss, att);

    return;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void VdcPoolInfo::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    dump(att, ALL, -1, -1, "", "");
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void MarketPlacePoolInfo::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    dump(att, ALL, -1, -1, "", "");
}

