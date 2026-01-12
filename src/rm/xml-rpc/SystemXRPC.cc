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

#include "SystemXRPC.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void SystemVersionXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                        RequestAttributesXRPC& att)
{
    string version_str;

    auto ec = version(version_str, att);

    response(ec, version_str, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void SystemConfigXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                       RequestAttributesXRPC& att)
{
    string config_str;

    auto ec = config(config_str, att);

    response(ec, config_str, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void SystemSqlXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                    RequestAttributesXRPC& att)
{
    auto ec = sql(paramList.getString(1),   // sql
                  paramList.getBoolean(2),  // federated
                  att);

    response(ec, 0, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void SystemSqlQueryXRPC::request_execute(xmlrpc_c::paramList const& paramList,
                                         RequestAttributesXRPC& att)
{
    string sql_str = paramList.getString(1);

    auto ec = sql_query(sql_str, att);

    response(ec, sql_str, att);
}
