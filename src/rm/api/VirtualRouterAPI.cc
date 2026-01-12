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

#include "VirtualRouterAPI.h"
#include "TemplateAPI.h"
#include "VirtualMachineAPI.h"
#include "DispatchManager.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualRouterAllocateAPI::allocate_authorization(Template *obj_template,
                                                                    RequestAttributes&  att,
                                                                    PoolObjectAuth *cluster_perms)
{
    AuthRequest ar(att.uid, att.group_ids);
    string      tmpl_str;
    bool auth;

    // ------------------ Authorize create operation ------------------------

    ar.add_create_auth(att.uid, att.gid, request.auth_object(), obj_template->to_xml(tmpl_str));

    VirtualRouter::set_auth_request(att.uid, ar, obj_template, true);

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;

        return Request::AUTHORIZATION;
    }

    // -------------------------- Check Quotas  ----------------------------

    auth = quota_authorization(obj_template, Quotas::VIRTUALROUTER, att, att.resp_msg);

    return auth ? Request::SUCCESS : Request::AUTHORIZATION;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualRouterAllocateAPI::pool_allocate(std::unique_ptr<Template> tmpl,
                                                           int&                       id,
                                                           RequestAttributes&         att)
{
    int rc = vrpool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
                              move(tmpl), &id, att.resp_msg);

    return (rc < 0) ? Request::INTERNAL : Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualRouterAPI::drop(std::unique_ptr<PoolObjectSQL> object,
                           bool recursive,
                           RequestAttributes& att)
{
    VirtualRouter * vr = static_cast<VirtualRouter *>(object.get());

    set<int> vms = vr->get_vms();

    int rc  = SharedAPI::drop(std::move(object), false, att);

    if ( rc == 0 && !vms.empty())
    {
        VirtualRouter::shutdown_vms(vms, att);
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualRouterAPI::instantiate(int oid,
                                                 int n_vms,
                                                 int template_id,
                                                 std::string& name,
                                                 bool hold,
                                                 const std::string& str_uattrs,
                                                 RequestAttributes& att)
{
    Nebula& nd = Nebula::instance();

    DispatchManager* dm = nd.get_dm();
    VMTemplatePool*  tpool = nd.get_tpool();

    PoolObjectAuth vr_perms;
    string         vr_name, tmp_name;
    ostringstream  oss;

    vector<int> vms;

    int vid;

    std::unique_ptr<Template> extra_attrs;

    /* ---------------------------------------------------------------------- */
    /* Get the Virtual Router NICs                                            */
    /* ---------------------------------------------------------------------- */
    if ( auto vr = vrpool->get_ro(oid) )
    {
        vr->get_permissions(vr_perms);

        extra_attrs.reset(vr->get_vm_template());
        vr_name     = vr->get_name();

        if (template_id == -1)
        {
            template_id = vr->get_template_id();
        }
    }
    else
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    if (template_id == -1)
    {
        att.resp_msg = "A template ID was not provided, and the virtual router "
                       "does not have a default one";

        return Request::ACTION;
    }

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(AuthRequest::MANAGE, vr_perms); // MANAGE VROUTER

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;

        return Request::AUTHORIZATION;
    }

    bool is_vrouter;

    if ( auto tmpl = tpool->get_ro(template_id) )
    {
        is_vrouter = tmpl->is_vrouter();
    }
    else
    {
        att.resp_id = template_id;
        att.resp_obj = PoolObjectSQL::TEMPLATE;

        return Request::NO_EXISTS;
    }

    if (!is_vrouter)
    {
        att.resp_msg = "Only virtual router templates are allowed";

        return Request::ACTION;
    }

    if (name.empty())
    {
        name = "vr-" + vr_name + "-%i";
    }

    Request r("internal call");
    TemplateAPI tpl_api(r);

    for (int i=0; i<n_vms; oss.str(""), i++)
    {
        oss << i;

        tmp_name = one_util::gsub(name, "%i", oss.str());

        Request::ErrorCode ec = tpl_api.instantiate_helper(template_id, tmp_name, true,
                                                           str_uattrs, extra_attrs.get(), vid, att);

        if (ec != Request::SUCCESS)
        {
            for (auto vmid : vms)
            {
                dm->delete_vm(vmid, att, att.resp_msg);
            }

            return ec;
        }

        vms.push_back(vid);
    }

    if (auto vr = vrpool->get(oid))
    {
        for (auto vmid : vms)
        {
            vr->add_vmid(vmid);
        }

        vr->set_template_id(template_id);

        vrpool->update(vr.get());
    }

    // VMs are created on hold to wait for all of them to be created
    // successfully, to avoid the rollback dm->finalize call on prolog
    if (!hold)
    {
        for (auto vmid : vms)
        {
            dm->release(vmid, att, att.resp_msg);
        }
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualRouterAPI::attach_nic(int oid,
                                                std::string& obj_tmpl,
                                                RequestAttributes& att)
{
    VectorAttribute* nic;
    unique_ptr<VectorAttribute> nic_bck;

    VirtualMachineTemplate  tmpl;
    PoolObjectAuth          vr_perms;

    set<int> vms;

    // -------------------------------------------------------------------------
    // Parse NIC template
    // -------------------------------------------------------------------------
    int rc = tmpl.parse_str_or_xml(obj_tmpl, att.resp_msg);

    if ( rc != 0 )
    {
        return Request::INTERNAL;
    }

    // -------------------------------------------------------------------------
    // Authorize the operation & check quotas
    // -------------------------------------------------------------------------
    if (auto vr = vrpool->get_ro(oid))
    {
        vr->get_permissions(vr_perms);
    }
    else
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(att.auth_op, vr_perms); // MANAGE VROUTER

    VirtualRouter::set_auth_request(att.uid, ar, &tmpl, true); // USE VNET

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;

        return Request::AUTHORIZATION;
    }

    RequestAttributes att_quota(vr_perms.uid, vr_perms.gid, att);

    if ( !quota_authorization(&tmpl, Quotas::VIRTUALROUTER, att_quota, att.resp_msg) )
    {
        return Request::AUTHORIZATION;
    }

    // -------------------------------------------------------------------------
    // Attach NIC to the Virtual Router
    // -------------------------------------------------------------------------
    if ( auto vr = vrpool->get(oid) )
    {
        nic = vr->attach_nic(&tmpl, att.resp_msg);

        if ( nic != nullptr )
        {
            nic_bck.reset(nic->clone());
        }

        vms = vr->get_vms();

        vrpool->update(vr.get());
    }
    else
    {
        quota_rollback(&tmpl, Quotas::VIRTUALROUTER, att_quota);

        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    if ( !nic )
    {
        quota_rollback(&tmpl, Quotas::VIRTUALROUTER, att_quota);

        return Request::ACTION;
    }

    // -------------------------------------------------------------------------
    // Attach NIC to each VM
    // -------------------------------------------------------------------------

    Request r("internal call");
    VirtualMachineAPI vm_api(r);

    for (auto vmid : vms)
    {
        VirtualMachineTemplate vm_tmpl;

        vm_tmpl.set(nic_bck->clone());

        Request::ErrorCode ec = vm_api.nic_attach(vmid, vm_tmpl, att);

        if (ec != Request::SUCCESS) //TODO: manage individual attach error, do rollback?
        {
            return Request::ACTION;
        }
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualRouterAPI::detach_nic(int oid,
                                                int nic_id,
                                                RequestAttributes& att)
{
    PoolObjectAuth      vr_perms;

    int rc;

    set<int> vms;

    // -------------------------------------------------------------------------
    // Authorize the operation
    // -------------------------------------------------------------------------
    if (auto vr = vrpool->get_ro(oid))
    {
        vr->get_permissions(vr_perms);
    }
    else
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(AuthRequest::MANAGE, vr_perms); // MANAGE VROUTER

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;

        return Request::AUTHORIZATION;
    }

    // -------------------------------------------------------------------------
    // Detach the NIC from the Virtual Router
    // -------------------------------------------------------------------------
    if (auto vr = vrpool->get(oid))
    {
        rc = vr->detach_nic(nic_id);

        vms = vr->get_vms();

        vrpool->update(vr.get());
    }
    else
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    if (rc != 0)
    {
        ostringstream oss;

        oss << "NIC with NIC_ID " << nic_id << " does not exist.";
        att.resp_msg = oss.str();

        return Request::ACTION;
    }

    // -------------------------------------------------------------------------
    // Detach NIC from each VM
    // -------------------------------------------------------------------------
    Request r("internal call");
    VirtualMachineAPI vm_api(r);

    for (auto vmid : vms)
    {
        Request::ErrorCode ec = vm_api.nic_detach_helper(vmid, nic_id, att);

        if (ec != Request::SUCCESS) //TODO: manage individual attach error, do rollback?
        {
            return ec;
        }
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualRouterAPI::chmod(int oid,
                                           int owner_u, int owner_m, int owner_a,
                                           int group_u, int group_m, int group_a,
                                           int other_u, int other_m, int other_a,
                                           RequestAttributes& att)
{
    set<int> vms;

    if (auto vrouter = vrpool->get_ro(oid))
    {
        vms = vrouter->get_vms();
    }
    else
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    Request::ErrorCode ec = SharedAPI::chmod(oid,
                                             owner_u, owner_m, owner_a,
                                             group_u, group_m, group_a,
                                             other_u, other_m, other_a,
                                             att);

    if ( ec != Request::SUCCESS )
    {
        return ec;
    }

    for (auto vm_id : vms)
    {
        Request::ErrorCode ec_aux = SharedAPI::chmod(vm_id,
                                                     owner_u, owner_m, owner_a,
                                                     group_u, group_m, group_a,
                                                     other_u, other_m, other_a,
                                                     att);

        if ( ec_aux != Request::SUCCESS )
        {
            ec = ec_aux;
        }
    }

    return ec;
}
