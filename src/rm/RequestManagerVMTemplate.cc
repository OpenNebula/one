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

#include "RequestManagerVMTemplate.h"
#include "PoolObjectAuth.h"
#include "Nebula.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VMTemplateInstantiate::request_execute(xmlrpc_c::paramList const& paramList,
                                            RequestAttributes& att)
{
    int    id   = xmlrpc_c::value_int(paramList.getInt(1));
    string name = xmlrpc_c::value_string(paramList.getString(2));
    bool   on_hold = false; //Optional XML-RPC argument
    string str_uattrs;      //Optional XML-RPC argument

    if ( paramList.size() > 3 )
    {
        on_hold = xmlrpc_c::value_boolean(paramList.getBoolean(3));

        str_uattrs = xmlrpc_c::value_string(paramList.getString(4));
    }

    // TODO: if Template has VROUTER = YES, do not allow to instantiate here

    int vid = instantiate(att, id, name, on_hold, str_uattrs, 0);

    if (vid != -1)
    {
        success_response(vid, att);
    }
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

        int vid = instantiate(att, tmpl_id, tmp_name, true, str_uattrs, extra_attrs);

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

int RequestManagerVMTemplate::instantiate(RequestAttributes& att, int id,
                                string name, bool on_hold, string str_uattrs,
                                Template* extra_attrs)
{
    int  rc;
    int  vid;

    ostringstream sid;

    PoolObjectAuth perms;

    Nebula& nd = Nebula::instance();

    VirtualMachinePool* vmpool  = nd.get_vmpool();
    VMTemplatePool *    tpool   = static_cast<VMTemplatePool *>(pool);

    VirtualMachineTemplate * tmpl;
    VirtualMachineTemplate * extended_tmpl = 0;
    VirtualMachineTemplate   uattrs;
    VMTemplate *             rtmpl;

    string error_str;
    string aname;

    string tmpl_name;

    /* ---------------------------------------------------------------------- */
    /* Get, check and clone the template                                      */
    /* ---------------------------------------------------------------------- */

    rtmpl = tpool->get(id,true);

    if ( rtmpl == 0 )
    {
        failure_response(NO_EXISTS,
                get_error(object_name(auth_object),id),
                att);

        return -1;
    }

    tmpl_name = rtmpl->get_name();
    tmpl      = rtmpl->clone_template();

    rtmpl->get_permissions(perms);

    rtmpl->unlock();

    // Parse & merge user attributes (check if the request user is not oneadmin)
    if (!str_uattrs.empty())
    {
        rc = uattrs.parse_str_or_xml(str_uattrs, error_str);

        if ( rc != 0 )
        {
            failure_response(INTERNAL, error_str, att);
            delete tmpl;
            return -1;
        }

        if (att.uid!=UserPool::ONEADMIN_ID && att.gid!=GroupPool::ONEADMIN_ID)
        {
            if (uattrs.check(aname))
            {
                ostringstream oss;

                oss << "User Template includes a restricted attribute "<< aname;

                failure_response(AUTHORIZATION,
                        authorization_error(oss.str(), att),
                        att);

                delete tmpl;
                return -1;
            }
        }

        rc = tmpl->merge(&uattrs, error_str);

        if ( rc != 0 )
        {
            failure_response(INTERNAL, error_str, att);
            delete tmpl;
            return -1;
        }
    }

    if (extra_attrs != 0)
    {
        rc = tmpl->merge(extra_attrs, error_str);

        if ( rc != 0 )
        {
            failure_response(INTERNAL, error_str, att);
            delete tmpl;
            return -1;
        }
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
        tmpl->set(new SingleAttribute("NAME",name));
    }

    //--------------------------------------------------------------------------

    if ( att.uid != 0 )
    {
        AuthRequest ar(att.uid, att.group_ids);

        ar.add_auth(AuthRequest::USE, perms); //USE TEMPLATE

        if (!str_uattrs.empty())
        {
            string tmpl_str;

            tmpl->to_xml(tmpl_str);

            // CREATE TEMPLATE
            ar.add_create_auth(att.uid, att.gid, auth_object, tmpl_str);
        }

        VirtualMachine::set_auth_request(att.uid, ar, tmpl);

        if (UserPool::authorize(ar) == -1)
        {
            failure_response(AUTHORIZATION,
                    authorization_error(ar.message, att),
                    att);

            delete tmpl;
            return -1;
        }

        extended_tmpl = new VirtualMachineTemplate(*tmpl);

        VirtualMachine::disk_extended_info(att.uid, extended_tmpl);

        if ( quota_authorization(extended_tmpl, Quotas::VIRTUALMACHINE, att) == false )
        {
            delete tmpl;
            delete extended_tmpl;
            return -1;
        }
    }

    rc = vmpool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
            tmpl, &vid, error_str, on_hold);

    if ( rc < 0 )
    {
        failure_response(INTERNAL,
                allocate_error(PoolObjectSQL::VM,error_str),
                att);

        if (extended_tmpl != 0)
        {
            quota_rollback(extended_tmpl, Quotas::VIRTUALMACHINE, att);
        }

        delete extended_tmpl;

        return -1;
    }

    delete extended_tmpl;

    return vid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

