/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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

    request_execute(oid, tmpl, update_type, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void RequestManagerUpdateTemplate::request_execute(int oid,
                                                   const std::string& tmpl,
                                                   int update_type,
                                                   RequestAttributes& att)
{
    int rc;

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
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void VirtualMachineUpdateTemplate::request_execute(int oid,
                                                   const std::string& tmpl,
                                                   int update_type,
                                                   RequestAttributes& att)
{
    int rc;

    auto vm = pool->get<VirtualMachine>(oid);

    if ( vm == nullptr )
    {
        att.resp_id = oid;
        failure_response(NO_EXISTS, att);

        return;
    }

    // Check if the action is supported for imported VMs
    if (vm->is_imported() && !vm->is_imported_action_supported(VMActions::UPDATE_ACTION))
    {
        att.resp_msg = "Action \"update\" is not supported for imported VMs";
        failure_response(ACTION, att);

        return;
    }

    // Apply generic quota deltas
    auto new_tmpl = make_unique<VirtualMachineTemplate>(false, '=', "USER_TEMPLATE");

    if ( new_tmpl->parse_str_or_xml(tmpl, att.resp_msg) != 0 )
    {
        failure_response(ACTION, att);

        return;
    }

    if ( update_type == 1 ) //append mode
    {
        auto user_tmpl = vm->clone_user_template();

        user_tmpl->merge(new_tmpl.get());

        new_tmpl.swap(user_tmpl);
    }

    // Compute quota deltas (only generic quota may appear in User template)
    bool do_quotas = false;

    for ( const string& metric : QuotaVirtualMachine::generic_metrics())
    {
        float value_new, value_old;

        bool exists_old = vm->get_user_template_attribute(metric, value_old);
        bool exists_new = new_tmpl->get(metric, value_new);

        if ( exists_old || exists_new )
        {
            float delta = value_new - value_old;

            new_tmpl->replace(metric, delta);

            do_quotas |= delta != 0;
        }
    }

    if (vm->is_running_quota())
    {
        QuotaVirtualMachine::add_running_quota_generic(*new_tmpl);
    }

    RequestAttributes att_quota(att);

    att_quota.uid = vm->get_uid();
    att_quota.gid = vm->get_gid();

    vm.reset();

    if ( do_quotas )
    {
        if (!quota_authorization(new_tmpl.get(), Quotas::VIRTUALMACHINE, att_quota, att.resp_msg))
        {
            failure_response(ACTION, att);

            return;
        }
    }

    vm = pool->get<VirtualMachine>(oid);

    if (update_type == 0)
    {
        rc = replace_template(vm.get(), tmpl, att, att.resp_msg);
    }
    else //if (update_type == 1)
    {
        rc = append_template(vm.get(), tmpl, att, att.resp_msg);
    }

    if ( rc != 0 )
    {
        vm.reset();

        if (do_quotas)
        {
            quota_rollback(new_tmpl.get(), Quotas::VIRTUALMACHINE, att_quota);
        }

        att.resp_msg = "Cannot update template. " + att.resp_msg;
        failure_response(INTERNAL, att);

        return;
    }

    pool->update(vm.get());

    success_response(oid, att);
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
