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

#include "RequestManagerVMTemplate.h"
#include "VirtualMachine.h"
#include "VirtualMachineDisk.h"
#include "VirtualMachinePool.h"
#include "ScheduledActionPool.h"
#include "PoolObjectAuth.h"
#include "Nebula.h"
#include "RequestManagerClone.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VMTemplateInstantiate::request_execute(xmlrpc_c::paramList const& paramList,
                                            RequestAttributes& att)
{
    int    id   = xmlrpc_c::value_int(paramList.getInt(1));
    string name = xmlrpc_c::value_string(paramList.getString(2));
    bool   on_hold = false;        //Optional XML-RPC argument
    string str_uattrs;             //Optional XML-RPC argument
    bool   persistent = false;     //Optional XML-RPC argument

    if ( paramList.size() > 3 )
    {
        on_hold    = xmlrpc_c::value_boolean(paramList.getBoolean(3));
        str_uattrs = xmlrpc_c::value_string(paramList.getString(4));
    }

    if ( paramList.size() > 5 )
    {
        persistent = xmlrpc_c::value_boolean(paramList.getBoolean(5));
    }

    bool is_vrouter;
    string original_tmpl_name;

    if ( auto tmpl = pool->get_ro<VMTemplate>(id) )
    {
        is_vrouter = tmpl->is_vrouter();

        original_tmpl_name = tmpl->get_name();
    }
    else
    {
        att.resp_id = id;
        failure_response(NO_EXISTS, att);
        return;
    }

    if (is_vrouter)
    {
        att.resp_msg = "Virtual router templates cannot be instantiated";
        failure_response(ACTION, att);
        return;
    }

    int instantiate_id = id;

    if (persistent)
    {
        // Clone private persistent copy of the template
        int new_id;

        VMTemplateClone tmpl_clone;
        string          tmpl_name = name;

        ostringstream   oss;

        if (tmpl_name.empty())
        {
            tmpl_name = original_tmpl_name + "-copy";
        }

        ErrorCode ec = tmpl_clone.clone(id, tmpl_name, new_id, true, str_uattrs, true, att);

        if (ec != SUCCESS)
        {
            failure_response(ec, att);
            return;
        }

        instantiate_id = new_id;

        oss << "CLONING_TEMPLATE_ID=" << id << "\n";

        str_uattrs = oss.str();
    }

    int       vid;
    ErrorCode ec;

    ec = request_execute(instantiate_id, name, on_hold, str_uattrs, 0, vid, att);

    if ( ec == SUCCESS )
    {
        success_response(vid, att);
    }
    else
    {
        failure_response(ec, att);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VMTemplateInstantiate::request_execute(int id, const string&  name,
                                                          bool on_hold, const string &str_uattrs, Template* extra_attrs, int& vid,
                                                          RequestAttributes& att)
{
    int rc;
    std::string memory, cpu;

    ostringstream sid;

    PoolObjectAuth perms;

    Nebula& nd = Nebula::instance();

    VirtualMachinePool* vmpool  = nd.get_vmpool();
    VMTemplatePool *    tpool   = nd.get_tpool();

    unique_ptr<VirtualMachineTemplate> tmpl;
    VirtualMachineTemplate extended_tmpl;
    VirtualMachineTemplate uattrs;

    string tmpl_name;

    /* ---------------------------------------------------------------------- */
    /* Get, check and clone the template                                      */
    /* ---------------------------------------------------------------------- */
    if ( auto rtmpl = tpool->get_ro(id) )
    {
        tmpl_name = rtmpl->get_name();
        tmpl      = rtmpl->clone_template();

        rtmpl->get_permissions(perms);
    }
    else
    {
        att.resp_id = id;
        return NO_EXISTS;
    }

    ErrorCode ec = merge(tmpl.get(), str_uattrs, att);

    if (ec != SUCCESS)
    {
        return ec;
    }

    if ( extra_attrs != nullptr )
    {
        tmpl->merge(extra_attrs);
    }

    ec = as_uid_gid(tmpl.get(), att);

    if ( ec != SUCCESS )
    {
        return ec;
    }

    /* ---------------------------------------------------------------------- */
    /* Store the template attributes in the VM                                */
    /* ---------------------------------------------------------------------- */
    tmpl->erase("NAME");
    tmpl->erase("TEMPLATE_NAME");
    tmpl->erase("TEMPLATE_ID");

    sid << id;

    tmpl->set(new SingleAttribute("TEMPLATE_NAME", tmpl_name));
    tmpl->set(new SingleAttribute("TEMPLATE_ID", sid.str()));

    if (!name.empty())
    {
        tmpl->set(new SingleAttribute("NAME", name));
    }

    if (VirtualMachine::parse_topology(tmpl.get(), att.resp_msg) != 0)
    {
        return ALLOCATE;
    }

    //--------------------------------------------------------------------------

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(AuthRequest::USE, perms); //USE TEMPLATE

    if (!str_uattrs.empty())
    {
        string tmpl_str;

        tmpl->to_xml(tmpl_str);

        // CREATE TEMPLATE
        ar.add_create_auth(att.uid, att.gid, PoolObjectSQL::TEMPLATE,
                           tmpl_str);
    }

    extended_tmpl = *tmpl;

    VirtualMachineDisks::extended_info(att.uid, &extended_tmpl);

    VirtualMachine::set_auth_request(att.uid, ar, &extended_tmpl, true);

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;

        return AUTHORIZATION;
    }

    extended_tmpl.get("MEMORY", memory);
    extended_tmpl.get("CPU", cpu);

    extended_tmpl.add("RUNNING_MEMORY", memory);
    extended_tmpl.add("RUNNING_CPU", cpu);
    extended_tmpl.add("RUNNING_VMS", 1);
    extended_tmpl.add("VMS", 1);

    QuotaVirtualMachine::add_running_quota_generic(extended_tmpl);

    if (quota_authorization(&extended_tmpl, Quotas::VIRTUALMACHINE, att,
                            att.resp_msg) == false)
    {
        return AUTHORIZATION;
    }

    bool ds_quota_auth = true;

    vector<unique_ptr<Template>> ds_quotas;
    vector<unique_ptr<Template>> applied;

    VirtualMachineDisks::image_ds_quotas(&extended_tmpl, ds_quotas);

    for ( auto& ds : ds_quotas )
    {
        if ( quota_authorization(ds.get(), Quotas::DATASTORE, att, att.resp_msg)
             == false )
        {
            ds_quota_auth = false;
            break;
        }
        else
        {
            applied.push_back(move(ds));
        }
    }

    if ( ds_quota_auth == false )
    {
        quota_rollback(&extended_tmpl, Quotas::VIRTUALMACHINE, att);

        for ( auto& ds : applied )
        {
            quota_rollback(ds.get(), Quotas::DATASTORE, att);
        }

        return AUTHORIZATION;
    }

    /* ---------------------------------------------------------------------- */
    /* Save SCHED_ACTION attributes for allocation                            */
    /* ---------------------------------------------------------------------- */
    std::vector<unique_ptr<VectorAttribute>> sas;

    tmpl->remove("SCHED_ACTION", sas);

    rc = vmpool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
                          move(tmpl), &vid, att.resp_msg, on_hold);

    if ( rc < 0 )
    {
        quota_rollback(&extended_tmpl, Quotas::VIRTUALMACHINE, att);

        for ( auto& ds : applied )
        {
            quota_rollback(ds.get(), Quotas::DATASTORE, att);
        }

        return ALLOCATE;
    }

    /* ---------------------------------------------------------------------- */
    /* Create ScheduleAction and associate to the VM                          */
    /* ---------------------------------------------------------------------- */
    auto sapool = Nebula::instance().get_sapool();

    time_t stime  = time(0);
    bool sa_error = false;

    std::vector<int> sa_ids;

    for (const auto& sa : sas)
    {
        int sa_id = sapool->allocate(PoolObjectSQL::VM, vid, stime, sa.get(), att.resp_msg);

        if (sa_id < 0)
        {
            sa_error = true;
            break;
        }

        sa_ids.push_back(sa_id);
    }

    /* ---------------------------------------------------------------------- */
    /* Error creating a SCHED_ACTION rollback created objects                 */
    /* ---------------------------------------------------------------------- */
    if (sa_error)
    {
        // Consistency check, the VM template should not have parsing errors
        // of Scheduled Actions at this point.
        sapool->drop_sched_actions(sa_ids);

        // Test the rollback quota, not sure if it's correct
        quota_rollback(&extended_tmpl, Quotas::VIRTUALMACHINE, att);

        for ( auto& ds : applied )
        {
            quota_rollback(ds.get(), Quotas::DATASTORE, att);
        }

        return Request::INTERNAL;
    }

    /* ---------------------------------------------------------------------- */
    /* Associate SCHED_ACTIONS to the VM                                      */
    /* ---------------------------------------------------------------------- */
    if ( auto vm = vmpool->get(vid) )
    {
        for (const auto sa_id: sa_ids)
        {
            vm->sched_actions().add(sa_id);
        }

        vmpool->update(vm.get());
    }
    else
    {
        att.resp_msg = "VM deleted while setting up SCHED_ACTION";

        sapool->drop_sched_actions(sa_ids);

        return Request::INTERNAL;
    }

    return SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VMTemplateInstantiate::merge(
        Template *      tmpl,
        const string    &str_uattrs,
        RequestAttributes& att)
{
    int rc;

    VirtualMachineTemplate  uattrs;
    string                  aname;

    rc = uattrs.parse_str_or_xml(str_uattrs, att.resp_msg);

    if ( rc != 0 )
    {
        return INTERNAL;
    }
    else if (uattrs.empty())
    {
        return SUCCESS;
    }

    if (!att.is_admin())
    {
        if (uattrs.check_restricted(aname, tmpl, true))
        {
            att.resp_msg ="User Template includes a restricted attribute " + aname;

            return AUTHORIZATION;
        }
    }

    tmpl->merge(&uattrs);

    return SUCCESS;
}
