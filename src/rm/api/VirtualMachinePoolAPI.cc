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

#include "VirtualMachinePoolAPI.h"
#include "NebulaUtil.h"

using namespace std;

const int ALL_VM   = -2;
const int NOT_DONE = -1;

/* -------------------------------------------------------------------------- */
/* API                                                                        */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachinePoolAPI::info(int filter_flag,
                                               int start_id,
                                               int end_id,
                                               int state,
                                               const std::string& json_query,
                                               std::string& xml,
                                               RequestAttributes& att)
{
    if (!json_query.empty() && !vmpool->supports(SqlDB::SqlFeature::JSON_QUERY))
    {
        att.resp_msg = "JSON query search is not supported by the SQL backend";

        return Request::INTERNAL;
    }

    ostringstream and_filter;

    if (( state < ALL_VM ) ||
        ( state > VirtualMachine::CLONING_FAILURE ))
    {
        att.resp_msg = "Incorrect state filter " + to_string(state);

        return Request::RPC_API;
    }

    switch (state)
    {
        case ALL_VM:
            break;

        case NOT_DONE:
            and_filter << "state <> " << VirtualMachine::DONE;
            break;

        default:
            and_filter << "state = " << state;
            break;
    }

    if ( !json_query.empty() )
    {
        char * _json_query = vmpool->escape_str(json_query);

        if ( !_json_query )
        {
            att.resp_msg = "Error building search query";

            return Request::INTERNAL;
        }

        if ( !and_filter.str().empty() )
        {
            and_filter << " AND ";
        }

        vector<string> keys;

        one_util::split(_json_query, '&', keys);

        for(const auto& key: keys)
        {
            vector<string> kv;

            one_util::split(key, '=', kv);

            if (kv.size() == 1)
            {
                // No key specified, search whole json body
                kv.push_back(kv[0]);
                kv[0] = "*";
            }

            and_filter << "JSON_UNQUOTE(JSON_EXTRACT(body_json, '$." << kv[0] << "'))";
            and_filter << " LIKE '%" << kv[1] << "%'";

            if (key != keys.back())
            {
                and_filter << " AND ";
            }
        }

        vmpool->free_str(_json_query);
    }

    return dump(att, filter_flag, start_id, end_id, and_filter.str(), "", xml);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachinePoolAPI::info_extended(int filter_flag,
                                                        int start_id,
                                                        int end_id,
                                                        int state,
                                                        const std::string& json_query,
                                                        std::string& xml,
                                                        RequestAttributes& att)
{
    extended = true;

    return info(filter_flag, start_id, end_id, state, json_query, xml, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachinePoolAPI::info_set(const std::string& ids_str,
                                                   bool _extended,
                                                   std::string& xml,
                                                   RequestAttributes& att)
{
    extended = _extended;

    ostringstream and_filter;
    std::set<unsigned int> ids;

    one_util::split_unique(ids_str, ',', ids);

    if (ids.empty())
    {
        xml = "<VM_POOL></VM_POOL>";

        return Request::SUCCESS;
    }

    and_filter << "oid in (" << one_util::join(ids, ',') << ")";

    return dump(att, -2, -1, -1, and_filter.str(), "", xml);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachinePoolAPI::monitoring(int filter_flag,
                                                     int seconds,
                                                     std::string& xml,
                                                     RequestAttributes& att)
{
    string where;

    if ( filter_flag < PoolSQL::GROUP )
    {
        att.resp_msg = "Incorrect filter_flag";

        return Request::RPC_API;
    }

    where_filter(att, filter_flag, -1, -1, "", "", false, false, false, where);

    int rc = vmpool->dump_monitoring(xml, where, seconds);

    if ( rc != 0 )
    {
        att.resp_msg = "Internal error";

        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachinePoolAPI::accounting(int filter_flag,
                                                     int time_start,
                                                     int time_end,
                                                     std::string& xml,
                                                     RequestAttributes& att)
{
    string where;
    int rc;

    if ( filter_flag < PoolSQL::GROUP )
    {
        att.resp_msg = "Incorrect filter_flag";

        return Request::RPC_API;
    }

    where_filter(att, filter_flag, -1, -1, "", "", false, false, false, where);

    rc = vmpool->dump_acct(xml, where, time_start, time_end);

    if ( rc != 0 )
    {
        att.resp_msg = "Internal error";

        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachinePoolAPI::showback_calc(int start_month,
                                                        int start_year,
                                                        int end_month,
                                                        int end_year,
                                                        RequestAttributes& att)
{
    if ( att.gid != 0 )
    {
        att.resp_msg = "Action reserved for group 0 only";

        return Request::AUTHORIZATION;
    }

    int rc = vmpool->calculate_showback(start_month, start_year,
                                        end_month, end_year,
                                        att.resp_msg);

    if (rc != 0)
    {
        return Request::AUTHORIZATION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachinePoolAPI::showback_list(int filter_flag,
                                                        int start_month,
                                                        int start_year,
                                                        int end_month,
                                                        int end_year,
                                                        std::string& xml,
                                                        RequestAttributes& att)
{
    string where;

    if ( filter_flag < PoolSQL::GROUP )
    {
        att.resp_msg = "Incorrect filter_flag";

        return Request::RPC_API;
    }

    where_filter(att, filter_flag, -1, -1, "", "", false, false, false, where);

    int rc = vmpool->dump_showback(xml,
                                   where,
                                   start_month,
                                   start_year,
                                   end_month,
                                   end_year);

    if ( rc != 0 )
    {
        att.resp_msg = "Internal error";

        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}
