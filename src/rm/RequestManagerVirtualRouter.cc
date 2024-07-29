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

#include "RequestManagerVirtualRouter.h"
#include "RequestManagerVMTemplate.h"
#include "RequestManagerVirtualMachine.h"
#include "PoolObjectAuth.h"
#include "Nebula.h"
#include "DispatchManager.h"
#include "VirtualRouterPool.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

RequestManagerVirtualRouter::RequestManagerVirtualRouter(const string& method_name,
                                                         const string& help,
                                                         const string& params)
    : Request(method_name, params, help)
{
    Nebula& nd  = Nebula::instance();
    pool        = nd.get_vrouterpool();

    auth_object = PoolObjectSQL::VROUTER;
    auth_op     = AuthRequest::MANAGE;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualRouterInstantiate::request_execute(
        xmlrpc_c::paramList const& paramList, RequestAttributes& att)
{
    int    vrid       = xmlrpc_c::value_int(paramList.getInt(1));
    int    n_vms      = xmlrpc_c::value_int(paramList.getInt(2));
    int    tmpl_id    = xmlrpc_c::value_int(paramList.getInt(3));
    string name       = xmlrpc_c::value_string(paramList.getString(4));
    bool   on_hold    = xmlrpc_c::value_boolean(paramList.getBoolean(5));
    string str_uattrs = xmlrpc_c::value_string(paramList.getString(6));

    Nebula& nd = Nebula::instance();

    VirtualRouterPool*  vrpool = nd.get_vrouterpool();
    DispatchManager*    dm = nd.get_dm();
    VMTemplatePool*     tpool = nd.get_tpool();

    PoolObjectAuth vr_perms;
    string         vr_name, tmp_name;
    ostringstream  oss;

    vector<int>           vms;

    int vid;

    std::unique_ptr<Template> extra_attrs;

    /* ---------------------------------------------------------------------- */
    /* Get the Virtual Router NICs                                            */
    /* ---------------------------------------------------------------------- */
    if ( auto vr = vrpool->get_ro(vrid) )
    {
        vr->get_permissions(vr_perms);

        extra_attrs.reset(vr->get_vm_template());
        vr_name     = vr->get_name();

        if (tmpl_id == -1)
        {
            tmpl_id = vr->get_template_id();
        }
    }
    else
    {
        att.resp_id = vrid;
        failure_response(NO_EXISTS, att);
        return;
    }

    if (tmpl_id == -1)
    {
        att.resp_msg = "A template ID was not provided, and the virtual router "
                       "does not have a default one";
        failure_response(ACTION, att);
        return;
    }

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(AuthRequest::MANAGE, vr_perms); // MANAGE VROUTER

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;
        failure_response(AUTHORIZATION, att);
        return;
    }

    bool is_vrouter;

    if ( auto tmpl = tpool->get_ro(tmpl_id) )
    {
        is_vrouter = tmpl->is_vrouter();
    }
    else
    {
        att.resp_id = tmpl_id;
        att.resp_obj = PoolObjectSQL::TEMPLATE;
        failure_response(NO_EXISTS, att);
        return;
    }

    if (!is_vrouter)
    {
        att.resp_msg = "Only virtual router templates are allowed";
        failure_response(ACTION, att);
        return;
    }

    if (name.empty())
    {
        name = "vr-" + vr_name + "-%i";
    }

    VMTemplateInstantiate tmpl_instantiate;

    for (int i=0; i<n_vms; oss.str(""), i++)
    {
        oss << i;

        tmp_name = one_util::gsub(name, "%i", oss.str());

        ErrorCode ec = tmpl_instantiate.request_execute(tmpl_id, tmp_name,
                                                        true, str_uattrs, extra_attrs.get(), vid, att);

        if (ec != SUCCESS)
        {
            failure_response(ec, att);

            for (auto vmid : vms)
            {
                dm->delete_vm(vmid, att, att.resp_msg);
            }

            return;
        }

        vms.push_back(vid);
    }

    if (auto vr = vrpool->get(vrid))
    {
        for (auto vmid : vms)
        {
            vr->add_vmid(vmid);
        }

        vr->set_template_id(tmpl_id);

        vrpool->update(vr.get());
    }

    // VMs are created on hold to wait for all of them to be created
    // successfully, to avoid the rollback dm->finalize call on prolog
    if (!on_hold)
    {
        for (auto vmid : vms)
        {
            dm->release(vmid, att, att.resp_msg);
        }
    }

    success_response(vrid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualRouterAttachNic::request_execute(
        xmlrpc_c::paramList const& paramList, RequestAttributes& att)
{
    VirtualRouterPool*  vrpool = static_cast<VirtualRouterPool*>(pool);
    VectorAttribute*    nic;
    VectorAttribute*    nic_bck;

    VirtualMachineTemplate  tmpl;
    PoolObjectAuth          vr_perms;

    set<int> vms;

    int    rc;

    int    vrid     = xmlrpc_c::value_int(paramList.getInt(1));
    string str_tmpl = xmlrpc_c::value_string(paramList.getString(2));

    // -------------------------------------------------------------------------
    // Parse NIC template
    // -------------------------------------------------------------------------
    rc = tmpl.parse_str_or_xml(str_tmpl, att.resp_msg);

    if ( rc != 0 )
    {
        failure_response(INTERNAL, att);
        return;
    }

    // -------------------------------------------------------------------------
    // Authorize the operation & check quotas
    // -------------------------------------------------------------------------
    if (auto vr = vrpool->get_ro(vrid))
    {
        vr->get_permissions(vr_perms);
    }
    else
    {
        att.resp_id = vrid;
        failure_response(NO_EXISTS, att);
        return;
    }

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(AuthRequest::MANAGE, vr_perms); // MANAGE VROUTER

    VirtualRouter::set_auth_request(att.uid, ar, &tmpl, true); // USE VNET

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;
        failure_response(AUTHORIZATION, att);
        return;
    }

    RequestAttributes att_quota(vr_perms.uid, vr_perms.gid, att);

    if ( quota_authorization(&tmpl, Quotas::VIRTUALROUTER, att_quota) == false )
    {
        return;
    }

    // -------------------------------------------------------------------------
    // Attach NIC to the Virtual Router
    // -------------------------------------------------------------------------
    if ( auto vr = vrpool->get(vrid) )
    {
        nic = vr->attach_nic(&tmpl, att.resp_msg);

        if ( nic != nullptr )
        {
            nic_bck = nic->clone();
        }

        vms = vr->get_vms();

        vrpool->update(vr.get());
    }
    else
    {
        quota_rollback(&tmpl, Quotas::VIRTUALROUTER, att_quota);

        att.resp_id = vrid;
        failure_response(NO_EXISTS, att);
        return;
    }

    if (nic == 0)
    {
        quota_rollback(&tmpl, Quotas::VIRTUALROUTER, att_quota);

        failure_response(ACTION, att);
        return;
    }

    // -------------------------------------------------------------------------
    // Attach NIC to each VM
    // -------------------------------------------------------------------------
    VirtualMachineAttachNic vm_attach_nic;

    for (auto vmid : vms)
    {
        VirtualMachineTemplate vm_tmpl;

        vm_tmpl.set(nic_bck->clone());

        ErrorCode ec = vm_attach_nic.request_execute(vmid, vm_tmpl, att);

        if (ec != SUCCESS) //TODO: manage individual attach error, do rollback?
        {
            delete nic_bck;

            failure_response(ACTION, att);

            return;
        }
    }

    delete nic_bck;

    success_response(vrid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualRouterDetachNic::request_execute(
        xmlrpc_c::paramList const& paramList, RequestAttributes& att)
{
    VirtualRouterPool*  vrpool = static_cast<VirtualRouterPool*>(pool);
    PoolObjectAuth      vr_perms;

    int rc;

    int vrid    = xmlrpc_c::value_int(paramList.getInt(1));
    int nic_id  = xmlrpc_c::value_int(paramList.getInt(2));

    set<int> vms;

    // -------------------------------------------------------------------------
    // Authorize the operation
    // -------------------------------------------------------------------------
    if (auto vr = vrpool->get_ro(vrid))
    {
        vr->get_permissions(vr_perms);
    }
    else
    {
        att.resp_id = vrid;
        failure_response(NO_EXISTS, att);
        return;
    }

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(AuthRequest::MANAGE, vr_perms); // MANAGE VROUTER

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;
        failure_response(AUTHORIZATION, att);
        return;
    }

    // -------------------------------------------------------------------------
    // Detach the NIC from the Virtual Router
    // -------------------------------------------------------------------------
    if (auto vr = vrpool->get(vrid))
    {
        rc = vr->detach_nic(nic_id);

        vms = vr->get_vms();

        vrpool->update(vr.get());
    }
    else
    {
        att.resp_id = vrid;
        failure_response(NO_EXISTS, att);
        return;
    }

    if (rc != 0)
    {
        ostringstream oss;

        oss << "NIC with NIC_ID " << nic_id << " does not exist.";

        att.resp_msg = oss.str();
        failure_response(Request::ACTION, att);

        return;
    }

    // -------------------------------------------------------------------------
    // Detach NIC from each VM
    // -------------------------------------------------------------------------
    VirtualMachineDetachNic vm_detach_nic;

    for (auto vmid : vms)
    {
        ErrorCode ec = vm_detach_nic.request_execute(vmid, nic_id, att);

        if (ec != SUCCESS) //TODO: manage individual attach error, do rollback?
        {
            failure_response(Request::ACTION, att);
            return;
        }
    }

    success_response(vrid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

