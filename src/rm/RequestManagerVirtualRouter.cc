/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

    PoolObjectAuth      vr_perms;
    Template*           extra_attrs;
    bool                has_vmids;
    string              errorstr;
    string              vr_name;
    ostringstream       oss;

    vector<int>             vms;
    vector<int>::iterator   vmid;

    /* ---------------------------------------------------------------------- */
    /* Get the Virtual Router NICs                                            */
    /* ---------------------------------------------------------------------- */

    vr = vrpool->get(vrid, true);

    if (vr == 0)
    {
        failure_response(NO_EXISTS,
                get_error(object_name(PoolObjectSQL::VROUTER),vrid),
                att);

        return;
    }

    vr->get_permissions(vr_perms);

    extra_attrs = vr->get_vm_template();

    has_vmids = vr->has_vmids();

    vr_name = vr->get_name();

    vr->unlock();

    if ( att.uid != 0 )
    {
        AuthRequest ar(att.uid, att.group_ids);

        ar.add_auth(AuthRequest::MANAGE, vr_perms); // MANAGE VROUTER

        if (UserPool::authorize(ar) == -1)
        {
            failure_response(AUTHORIZATION,
                    authorization_error(ar.message, att),
                    att);

            return;
        }
    }

    if (has_vmids)
    {
        failure_response(ACTION,
                request_error("Virtual Router already has VMs. Cannot instantiate new ones", ""),
                att);

        return;
    }

    if (name.empty())
    {
        oss.str("");
        oss << "vr-" << vr_name << "-%i";
        name = oss.str();
    }

    for (int i=0; i<n_vms; i++)
    {
        oss.str("");
        oss << i;

        string tmp_name = one_util::gsub(name, "%i", oss.str());

        int vid = VMTemplateInstantiate::instantiate(
                this, att, tmpl_id, tmp_name, true, str_uattrs, extra_attrs);

        if (vid == -1)
        {
            string tmp_error;

            for (vmid = vms.begin(); vmid != vms.end(); vmid++)
            {
                dm->finalize(*vmid, tmp_error);
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

        vrpool->update(vr);

        vr->unlock();
    }

    // VMs are created on hold to wait for all the vr->add_vmid calls, that
    // update each VM context with other VM IPs
    if (!on_hold)
    {
        for (vmid = vms.begin(); vmid != vms.end(); vmid++)
        {
            dm->release(*vmid, errorstr);
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
    string error_str;

    int    vrid     = xmlrpc_c::value_int(paramList.getInt(1));
    string str_tmpl = xmlrpc_c::value_string(paramList.getString(2));

    // -------------------------------------------------------------------------
    // Parse NIC template
    // -------------------------------------------------------------------------

    rc = tmpl.parse_str_or_xml(str_tmpl, error_str);

    if ( rc != 0 )
    {
        failure_response(INTERNAL, error_str, att);
        return;
    }

    // -------------------------------------------------------------------------
    // Authorize the operation & check quotas
    // -------------------------------------------------------------------------

    vr = vrpool->get(vrid, true);

    if (vr == 0)
    {
        failure_response(NO_EXISTS,
                get_error(object_name(PoolObjectSQL::VROUTER),vrid),
                att);

        return;
    }

    vr->get_permissions(vr_perms);

    vr->unlock();

    if ( att.uid != 0 )
    {
        AuthRequest ar(att.uid, att.group_ids);

        ar.add_auth(AuthRequest::MANAGE, vr_perms); // MANAGE VROUTER

        VirtualMachine::set_auth_request(att.uid, ar, &tmpl); // USE VNET

        if (UserPool::authorize(ar) == -1)
        {
            failure_response(AUTHORIZATION,
                    authorization_error(ar.message, att),
                    att);

            return;
        }
    }

    RequestAttributes att_quota(vr_perms.uid, vr_perms.gid, att);

    if ( quota_authorization(&tmpl, Quotas::NETWORK, att_quota) == false )
    {
        return;
    }

    // -------------------------------------------------------------------------
    // Attach NIC to the Virtual Router
    // -------------------------------------------------------------------------

    vr = vrpool->get(vrid, true);

    if (vr == 0)
    {
        quota_rollback(&tmpl, Quotas::NETWORK, att_quota);

        failure_response(NO_EXISTS,
                get_error(object_name(PoolObjectSQL::VROUTER),vrid),
                att);

        return;
    }

    nic = vr->set_attach_nic(&tmpl, error_str);

    set<int> vms = vr->get_vms();

    vrpool->update(vr);

    vr->unlock();

    if (nic == 0)
    {
        quota_rollback(&tmpl, Quotas::NETWORK, att_quota);

        failure_response(ACTION,
                request_error(error_str, ""),
                att);

        return;
    }

    // -------------------------------------------------------------------------
    // Attach NIC to each VM
    // -------------------------------------------------------------------------

    for (set<int>::iterator vmid = vms.begin(); vmid != vms.end(); vmid++)
    {
        VirtualMachineTemplate tmpl;

        tmpl.set(nic->clone());

        rc = VirtualMachineAttachNic::attach(this, att, *vmid, tmpl);

        if (rc == -1)
        {
            // TODO: manage individual attach error, do rollback?

            delete nic;
            return;
        }
    }

    delete nic;

    success_response(vrid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
