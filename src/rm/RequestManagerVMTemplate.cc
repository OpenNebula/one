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
#include "RequestManagerClone.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VMTemplateInstantiate::request_execute(xmlrpc_c::paramList const& paramList,
                                            RequestAttributes& att)
{
    int    id   = xmlrpc_c::value_int(paramList.getInt(1));
    string name = xmlrpc_c::value_string(paramList.getString(2));
    bool   on_hold = false; //Optional XML-RPC argument
    string str_uattrs;      //Optional XML-RPC argument
    bool   clone_template = false;  //Optional XML-RPC argument

    if ( paramList.size() > 3 )
    {
        on_hold = xmlrpc_c::value_boolean(paramList.getBoolean(3));

        str_uattrs = xmlrpc_c::value_string(paramList.getString(4));
    }

    if ( paramList.size() > 5 )
    {
        clone_template = xmlrpc_c::value_boolean(paramList.getBoolean(5));
    }

    VMTemplate * tmpl = static_cast<VMTemplatePool* > (pool)->get(id,true);

    if ( tmpl == 0 )
    {
        att.resp_id = id;
        failure_response(NO_EXISTS, att);
        return;
    }

    bool is_vrouter = tmpl->is_vrouter();

    string original_tmpl_name = tmpl->get_name();

    tmpl->unlock();

    if (is_vrouter)
    {
        att.resp_msg = "Virtual router templates cannot be instantiated as stand-alone VMs";
        failure_response(ACTION, att);
        return;
    }

    int instantiate_id = id;

    if (clone_template)
    {
        int new_id;

        string tmpl_name = name;

        if (tmpl_name.empty())
        {
            tmpl_name = original_tmpl_name + "-copy";
        }

        ErrorCode ec = VMTemplateClone::instance().request_execute(
                                id, tmpl_name, true, str_uattrs, new_id, att);

        if (ec != SUCCESS)
        {
            failure_response(ec, att);
            return;
        }

        instantiate_id = new_id;
        str_uattrs = "";
    }

    int vid;
    ErrorCode ec;

    ec = instantiate(instantiate_id, name, on_hold, str_uattrs, 0, vid, att);

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

Request::ErrorCode VMTemplateInstantiate::instantiate(int id, string name,
        bool on_hold, const string &str_uattrs, Template* extra_attrs, int& vid,
        RequestAttributes& att)
{
    int rc;

    ostringstream sid;

    PoolObjectAuth perms;

    Nebula& nd = Nebula::instance();

    VirtualMachinePool* vmpool  = nd.get_vmpool();
    VMTemplatePool *    tpool   = nd.get_tpool();

    VirtualMachineTemplate * tmpl;
    VirtualMachineTemplate * extended_tmpl = 0;
    VirtualMachineTemplate   uattrs;
    VMTemplate *             rtmpl;

    string aname;
    string tmpl_name;

    /* ---------------------------------------------------------------------- */
    /* Get, check and clone the template                                      */
    /* ---------------------------------------------------------------------- */
    rtmpl = tpool->get(id,true);

    if ( rtmpl == 0 )
    {
        att.resp_id = id;
        return NO_EXISTS;
    }

    tmpl_name = rtmpl->get_name();
    tmpl      = rtmpl->clone_template();

    rtmpl->get_permissions(perms);

    rtmpl->unlock();

    ErrorCode ec = merge(tmpl, str_uattrs, att);

    if (ec != SUCCESS)
    {
        delete tmpl;
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
            ar.add_create_auth(att.uid, att.gid, PoolObjectSQL::TEMPLATE, tmpl_str);
        }

        VirtualMachine::set_auth_request(att.uid, ar, tmpl);

        if (UserPool::authorize(ar) == -1)
        {
            att.resp_msg = ar.message;

            delete tmpl;
            return AUTHORIZATION;
        }

        extended_tmpl = new VirtualMachineTemplate(*tmpl);

        VirtualMachine::disk_extended_info(att.uid, extended_tmpl);

        if (quota_authorization(extended_tmpl, Quotas::VIRTUALMACHINE, att,
                    att.resp_msg) == false)
        {
            delete tmpl;
            delete extended_tmpl;
            return AUTHORIZATION;
        }
    }

    rc = vmpool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
            tmpl, &vid, att.resp_msg, on_hold);

    if ( rc < 0 )
    {
        if (extended_tmpl != 0)
        {
            quota_rollback(extended_tmpl, Quotas::VIRTUALMACHINE, att);
        }

        delete extended_tmpl;

        return ALLOCATE;
    }

    delete extended_tmpl;

    return SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VMTemplateInstantiate::merge(
                Template *      tmpl,
                const string    &str_uattrs,
                RequestAttributes& att)
{
    // Parse & merge user attributes (check if the request user is not oneadmin)
    if (!str_uattrs.empty())
    {
        int rc;

        VirtualMachineTemplate  uattrs;
        string                  aname;

        rc = uattrs.parse_str_or_xml(str_uattrs, att.resp_msg);

        if ( rc != 0 )
        {
            return INTERNAL;
        }

        if (att.uid!=UserPool::ONEADMIN_ID && att.gid!=GroupPool::ONEADMIN_ID)
        {
            if (uattrs.check(aname))
            {
                att.resp_msg ="User Template includes a restricted attribute " + aname;

                return AUTHORIZATION;
            }
        }

        rc = tmpl->merge(&uattrs, att.resp_msg);

        if ( rc != 0 )
        {
            return INTERNAL;
        }
    }

    return SUCCESS;
}
