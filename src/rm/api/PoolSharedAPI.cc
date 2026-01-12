/* -------------------------------------------------------------------------- */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                */
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

#include "PoolSharedAPI.h"
#include "Request.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

Request::ErrorCode PoolSharedAPI::info(int filter_flag,
                                       int start_id,
                                       int end_id,
                                       string& xml,
                                       RequestAttributes& att)
{
    return dump(att, filter_flag, start_id, end_id, "", "", xml);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void PoolSharedAPI::where_filter(
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

    PoolSQL::acl_filter(att.uid, att.group_ids, request.auth_object(), all,
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
        filter << "(" << oid_str << ")";
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

Request::ErrorCode PoolSharedAPI::dump(
        RequestAttributes& att,
        int                filter_flag,
        int                start_id,
        int                end_id,
        const string&      and_clause,
        const string&      or_clause,
        string&            xml)
{
    std::string where_string;
    std::string desc;

    int limit_end_id = -1;

    int rc;

    if ( filter_flag < PoolSQL::GROUP )
    {
        att.resp_msg = "Incorrect filter_flag";

        return Request::RPC_API;
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
        limit_end_id = -end_id;
    }

    Nebula::instance().get_configuration_attribute(att.uid, att.gid,
                                                   "API_LIST_ORDER", desc);

    if ( extended )
    {
        rc = pool->dump_extended(xml,
                                 where_string,
                                 start_id,
                                 limit_end_id,
                                 one_util::icasecmp(desc, "DESC"));
    }
    else
    {
        rc = pool->dump(xml,
                        where_string,
                        start_id,
                        limit_end_id,
                        one_util::icasecmp(desc, "DESC"));
    }

    if ( rc != 0 )
    {
        att.resp_msg = "Internal error";

        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}
