/* -------------------------------------------------------------------------- */
/* Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                */
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

#include "RequestManagerUpdateTemplate.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int RequestManagerUpdateTemplate::replace_template(
        PoolObjectSQL * object,
        const string & tmpl,
        const RequestAttributes &att,
        string &error_str)
{
    if (!att.is_admin())
    {
        return object->replace_template(tmpl, true, error_str);
    }
    else
    {
        return object->replace_template(tmpl, false, error_str);
    }
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int RequestManagerUpdateTemplate::append_template(
        PoolObjectSQL * object,
        const string & tmpl,
        const RequestAttributes &att,
        string &error_str)
{
    if (!att.is_admin())
    {
        return object->append_template(tmpl, true, error_str);
    }
    else
    {
        return object->append_template(tmpl, false, error_str);
    }
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void RequestManagerUpdateTemplate::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    int    rc;

    int    oid  = xmlrpc_c::value_int(paramList.getInt(1));
    string tmpl = xmlrpc_c::value_string(paramList.getString(2));

    int update_type = 0;

    if ( paramList.size() > 3 )
    {
        update_type = xmlrpc_c::value_int(paramList.getInt(3));
    }

    if ( basic_authorization(oid, att) == false )
    {
        return;
    }

    if ( update_type < 0 || update_type > 1 )
    {
        att.resp_msg = "Wrong update type";
        failure_response(XML_RPC_API, att);
        return;
    }


    auto object = pool->get<PoolObjectSQL>(oid);

    if ( object == nullptr )
    {
        att.resp_id = oid;
        failure_response(NO_EXISTS, att);
        return;
    }

    if (update_type == 0)
    {
        rc = replace_template(object.get(), tmpl, att, att.resp_msg);
    }
    else //if (update_type == 1)
    {
        rc = append_template(object.get(), tmpl, att, att.resp_msg);
    }

    if ( rc != 0 )
    {
        att.resp_msg = "Cannot update template. " + att.resp_msg;
        failure_response(INTERNAL, att);

        return;
    }

    pool->update(object.get());

    extra_updates(object.get());

    success_response(oid, att);

    return;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int ClusterUpdateTemplate::extra_updates(PoolObjectSQL * obj)
{
    // -------------------------------------------------------------------------
    // Update host capacity reservations
    // -------------------------------------------------------------------------
    auto hpool = Nebula::instance().get_hpool();

    string ccpu;
    string cmem;

    auto cluster = static_cast<Cluster*>(obj);

    const std::set<int>& hosts = cluster->get_host_ids();

    cluster->get_reserved_capacity(ccpu, cmem);

    for (auto hid : hosts)
    {
        auto host = hpool->get(hid);

        if (host == nullptr)
        {
            continue;
        }

        if (host->update_reserved_capacity(ccpu, cmem))
        {
            hpool->update(host.get());
        }
    }

    return 0;
}
