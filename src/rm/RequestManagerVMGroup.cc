/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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

#include "RequestManagerVMGroup.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VMGroupAddRole::request_execute(xmlrpc_c::paramList const& paramList,
                                     RequestAttributes& att)
{
    int    oid      = paramList.getInt(1);
    string tmpl_str = paramList.getString(2);

    if (!basic_authorization(oid, att))
    {
        return;
    }

    Template tmpl;

    if (tmpl.parse_str_or_xml(tmpl_str, att.resp_msg) != 0)
    {
        failure_response(ACTION, att);
        return;
    }

    VectorAttribute * va = tmpl.get("ROLE");

    if (!va)
    {
        att.resp_msg = "No ROLE attribute in template";

        failure_response(ACTION, att);
        return;
    }

    auto vmgroup = pool->get<VMGroup>(oid);

    if (!vmgroup)
    {
        att.resp_id = oid;
        failure_response(NO_EXISTS, att);

        return;
    }

    if (vmgroup->add_role(va, att.resp_msg) != 0)
    {
        failure_response(ACTION, att);
        return;
    }

    pool->update(vmgroup.get());

    success_response(oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VMGroupDelRole::request_execute(xmlrpc_c::paramList const& paramList,
                                     RequestAttributes& att)
{
    int    oid      = paramList.getInt(1);
    int    role_id  = paramList.getInt(2);

    if (!basic_authorization(oid, att))
    {
        return;
    }

    auto vmgroup = pool->get<VMGroup>(oid);

    if (!vmgroup)
    {
        att.resp_id = oid;
        failure_response(NO_EXISTS, att);

        return;
    }

    if (vmgroup->del_role(role_id, att.resp_msg) != 0)
    {
        failure_response(ACTION, att);
        return;
    }

    pool->update(vmgroup.get());

    success_response(oid, att);

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VMGroupUpdateRole::request_execute(xmlrpc_c::paramList const& paramList,
                                        RequestAttributes& att)
{
    int    oid      = paramList.getInt(1);
    int    role_id  = paramList.getInt(2);
    string tmpl_str = paramList.getString(3);

    if (!basic_authorization(oid, att))
    {
        return;
    }

    Template tmpl;

    if (tmpl.parse_str_or_xml(tmpl_str, att.resp_msg) != 0)
    {
        failure_response(ACTION, att);
        return;
    }

    VectorAttribute * va = tmpl.get("ROLE");

    if (!va)
    {
        att.resp_msg = "No ROLE attribute in template";

        failure_response(ACTION, att);
        return;
    }

    auto vmgroup = pool->get<VMGroup>(oid);

    if (vmgroup->update_role(role_id, va, att.resp_msg) != 0)
    {
        failure_response(ACTION, att);
        return;
    }

    pool->update(vmgroup.get());

    success_response(oid, att);
}
