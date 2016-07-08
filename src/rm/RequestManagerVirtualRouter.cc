/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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
    VirtualRouter *     vr;
    DispatchManager*    dm = nd.get_dm();
    VMTemplatePool*     tpool = nd.get_tpool();

    PoolObjectAuth vr_perms;
    Template*      extra_attrs;
    string         error;
    string         vr_name, tmp_name;
    ostringstream  oss;

    vector<int>           vms;
    vector<int>::iterator vmid;

    int vid;

    /* ---------------------------------------------------------------------- */
    /* Get the Virtual Router NICs                                            */
    /* ---------------------------------------------------------------------- */
    vr = vrpool->get(vrid, true);

    if (vr == 0)
    {
        att.resp_id = vrid;
        failure_response(NO_EXISTS, att);
        return;
    }

    vr->get_permissions(vr_perms);

    extra_attrs = vr->get_vm_template();
    vr_name     = vr->get_name();

    if (tmpl_id == -1)
    {
        tmpl_id = vr->get_template_id();
    }

    vr->unlock();

    if (tmpl_id == -1)
    {
        att.resp_msg = "A template ID was not provided, and the virtual router "
                       "does not have a default one";
        failure_response(ACTION, att);
        return;
    }

    if ( att.uid != 0 )
    {
        AuthRequest ar(att.uid, att.group_ids);

        ar.add_auth(AuthRequest::MANAGE, vr_perms); // MANAGE VROUTER

        if (UserPool::authorize(ar) == -1)
        {
            att.resp_msg = ar.message;
            failure_response(AUTHORIZATION, att);
            return;
        }
    }

    VMTemplate * tmpl = tpool->get(tmpl_id,true);

    if ( tmpl == 0 )
    {
        att.resp_id = tmpl_id;
        att.resp_obj = PoolObjectSQL::TEMPLATE;
        failure_response(NO_EXISTS, att);
        return;
    }

    bool is_vrouter = tmpl->is_vrouter();

    tmpl->unlock();

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
                true, str_uattrs, extra_attrs, vid, att);

        if (ec != SUCCESS)
        {
            failure_response(ec, att);

            for (vmid = vms.begin(); vmid != vms.end(); vmid++)
            {
                dm->delete_vm(*vmid, att.resp_msg);
            }

            return;
        }

        vms.push_back(vid);
    }

    vr = vrpool->get(vrid, true);

    if (vr != 0)
    {
        for (vmid = vms.begin(); vmid != vms.end(); vmid++)
        {
            vr->add_vmid(*vmid);
        }

        vr->set_template_id(tmpl_id);

        vrpool->update(vr);

        vr->unlock();
    }

    // VMs are created on hold to wait for all of them to be created
    // successfully, to avoid the rollback dm->finalize call on prolog
    if (!on_hold)
    {
        for (vmid = vms.begin(); vmid != vms.end(); vmid++)
        {
            dm->release(*vmid, att.resp_msg);
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
    VirtualRouter *     vr;
    VectorAttribute*    nic;

    VirtualMachineTemplate  tmpl;
    PoolObjectAuth          vr_perms;

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
    vr = vrpool->get(vrid, true);

    if (vr == 0)
    {
        att.resp_id = vrid;
        failure_response(NO_EXISTS, att);
        return;
    }

    vr->get_permissions(vr_perms);

    vr->unlock();

    if ( att.uid != 0 )
    {
        AuthRequest ar(att.uid, att.group_ids);

        ar.add_auth(AuthRequest::MANAGE, vr_perms); // MANAGE VROUTER

        VirtualRouter::set_auth_request(att.uid, ar, &tmpl); // USE VNET

        if (UserPool::authorize(ar) == -1)
        {
            att.resp_msg = ar.message;
            failure_response(AUTHORIZATION, att);
            return;
        }
    }

    RequestAttributes att_quota(vr_perms.uid, vr_perms.gid, att);

    if ( quota_authorization(&tmpl, Quotas::VIRTUALROUTER, att_quota) == false )
    {
        return;
    }

    // -------------------------------------------------------------------------
    // Attach NIC to the Virtual Router
    // -------------------------------------------------------------------------
    vr = vrpool->get(vrid, true);

    if (vr == 0)
    {
        quota_rollback(&tmpl, Quotas::VIRTUALROUTER, att_quota);

        att.resp_id = vrid;
        failure_response(NO_EXISTS, att);
        return;
    }

    nic = vr->attach_nic(&tmpl, att.resp_msg);

    set<int> vms = vr->get_vms();

    vrpool->update(vr);

    vr->unlock();

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

    for (set<int>::iterator vmid = vms.begin(); vmid != vms.end(); vmid++)
    {
        VirtualMachineTemplate tmpl;

        tmpl.set(nic->clone());

        ErrorCode ec = vm_attach_nic.request_execute(*vmid, tmpl, att);

        if (ec != SUCCESS) //TODO: manage individual attach error, do rollback?
        {
            failure_response(ACTION, att);

            delete nic;
            return;
        }
    }

    delete nic;

    success_response(vrid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualRouterDetachNic::request_execute(
        xmlrpc_c::paramList const& paramList, RequestAttributes& att)
{
    VirtualRouterPool*  vrpool = static_cast<VirtualRouterPool*>(pool);
    VirtualRouter *     vr;
    PoolObjectAuth      vr_perms;

    int rc;

    int vrid    = xmlrpc_c::value_int(paramList.getInt(1));
    int nic_id  = xmlrpc_c::value_int(paramList.getInt(2));

    // -------------------------------------------------------------------------
    // Authorize the operation
    // -------------------------------------------------------------------------
    vr = vrpool->get(vrid, true);

    if (vr == 0)
    {
        att.resp_id = vrid;
        failure_response(NO_EXISTS, att);
        return;
    }

    vr->get_permissions(vr_perms);

    vr->unlock();

    if ( att.uid != 0 )
    {
        AuthRequest ar(att.uid, att.group_ids);

        ar.add_auth(AuthRequest::MANAGE, vr_perms); // MANAGE VROUTER

        if (UserPool::authorize(ar) == -1)
        {
            att.resp_msg = ar.message;
            failure_response(AUTHORIZATION, att);
            return;
        }
    }

    // -------------------------------------------------------------------------
    // Detach the NIC from the Virtual Router
    // -------------------------------------------------------------------------
    vr = vrpool->get(vrid, true);

    if (vr == 0)
    {
        att.resp_id = vrid;
        failure_response(NO_EXISTS, att);
        return;
    }

    rc = vr->detach_nic(nic_id);

    set<int> vms = vr->get_vms();

    vrpool->update(vr);

    vr->unlock();

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

    for (set<int>::iterator vmid = vms.begin(); vmid != vms.end(); vmid++)
    {
        ErrorCode ec = vm_detach_nic.request_execute(*vmid, nic_id, att);

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

