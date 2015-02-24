/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

    int  rc;
    int  vid;

    ostringstream sid;

    PoolObjectAuth perms;

    Nebula& nd = Nebula::instance();

    VirtualMachinePool* vmpool  = nd.get_vmpool();
    VMTemplatePool *    tpool   = static_cast<VMTemplatePool *>(pool);

    VirtualMachineTemplate * tmpl;
    VirtualMachineTemplate   uattrs;
    VMTemplate *             rtmpl;

    string error_str;
    string aname;

    string tmpl_name;

    if ( paramList.size() > 3 )
    {
        on_hold = xmlrpc_c::value_boolean(paramList.getBoolean(3));

        str_uattrs = xmlrpc_c::value_string(paramList.getString(4));
    }

    /* ---------------------------------------------------------------------- */
    /* Get, check and clone the template                                      */
    /* ---------------------------------------------------------------------- */

    rtmpl = tpool->get(id,true);

    if ( rtmpl == 0 )
    {
        failure_response(NO_EXISTS,
                get_error(object_name(auth_object),id),
                att);

        return;
    }

    tmpl_name = rtmpl->get_name();
    tmpl      = rtmpl->clone_template();

    rtmpl->get_permissions(perms);

    rtmpl->unlock();

    // Check template for restricted attributes, only if owner is not oneadmin
    if (perms.uid!=UserPool::ONEADMIN_ID && perms.gid!=GroupPool::ONEADMIN_ID)
    {
        if (tmpl->check(aname))
        {
            ostringstream oss;

            oss << "VM Template includes a restricted attribute " << aname;

            failure_response(AUTHORIZATION,
                    authorization_error(oss.str(), att),
                    att);

            delete tmpl;
            return;
        }
    }

    // Parse & merge user attributes (check if the request user is not oneadmin)
    if (!str_uattrs.empty())
    {
        rc = uattrs.parse_str_or_xml(str_uattrs, error_str);

        if ( rc != 0 )
        {
            failure_response(INTERNAL, error_str, att);
            delete tmpl;
            return;
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
                return;
            }
        }

        rc = tmpl->merge(&uattrs, error_str);

        if ( rc != 0 )
        {
            failure_response(INTERNAL, error_str, att);
            delete tmpl;
            return;
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

    if ( att.uid != 0 )
    {
        AuthRequest ar(att.uid, att.group_ids);

        ar.add_auth(auth_op, perms); //USE TEMPLATE

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
            return;
        }

        if ( quota_authorization(tmpl, Quotas::VIRTUALMACHINE, att) == false )
        {
            delete tmpl;
            return;
        }
    }

    Template tmpl_back(*tmpl);

    rc = vmpool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
            tmpl, &vid, error_str, on_hold);

    if ( rc < 0 )
    {
        failure_response(INTERNAL,
                allocate_error(PoolObjectSQL::VM,error_str),
                att);

        quota_rollback(&tmpl_back, Quotas::VIRTUALMACHINE, att);

        return;
    }

    success_response(vid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

