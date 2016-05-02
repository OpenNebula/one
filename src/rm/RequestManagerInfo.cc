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

#include "RequestManagerInfo.h"
#include "RequestManagerPoolInfoFilter.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void RequestManagerInfo::request_execute(xmlrpc_c::paramList const& paramList,
                                         RequestAttributes& att)
{
    int             oid = xmlrpc_c::value_int(paramList.getInt(1));
    PoolObjectSQL * object;
    string          str;

    if ( oid == -1 )
    {
        if ( auth_object == PoolObjectSQL::USER )
        {
            oid = att.uid;
        }
        else if ( auth_object == PoolObjectSQL::GROUP )
        {
            oid = att.gid;
        }
    }

    if ( basic_authorization(oid, att) == false )
    {
        return;
    }

    object = pool->get(oid,true);

    if ( object == 0 )
    {
        att.resp_id = oid;
        failure_response(NO_EXISTS, att);
        return;
    }

    to_xml(att, object, str);

    object->unlock();

    success_response(str, att);

    return;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void TemplateInfo::request_execute(xmlrpc_c::paramList const& paramList,
                                         RequestAttributes& att)
{
    VMTemplatePool *         tpool   = static_cast<VMTemplatePool *>(pool);
    VirtualMachineTemplate * extended_tmpl = 0;
    VMTemplate *             vm_tmpl;

    PoolObjectAuth perms;

    int             oid = xmlrpc_c::value_int(paramList.getInt(1));
    bool            extended = false;
    string          str;

    if ( paramList.size() > 2 )
    {
        extended = xmlrpc_c::value_boolean(paramList.getBoolean(2));
    }

    vm_tmpl = tpool->get(oid,true);

    if ( vm_tmpl == 0 )
    {
        att.resp_id = oid;
        failure_response(NO_EXISTS, att);
        return;
    }

    if (extended)
    {
        extended_tmpl = vm_tmpl->clone_template();
    }

    vm_tmpl->get_permissions(perms);

    vm_tmpl->unlock();

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(auth_op, perms); //USE TEMPLATE

    if (extended)
    {
        VirtualMachine::set_auth_request(att.uid, ar, extended_tmpl);

        VirtualMachine::disk_extended_info(att.uid, extended_tmpl);
    }

    if ( att.uid != UserPool::ONEADMIN_ID && att.gid != GroupPool::ONEADMIN_ID )
    {
        if (UserPool::authorize(ar) == -1)
        {
            att.resp_msg = ar.message;
            failure_response(AUTHORIZATION, att);

            delete extended_tmpl;
            return;
        }
    }

    vm_tmpl = tpool->get(oid,true);

    if ( vm_tmpl == 0 )
    {
        att.resp_id = oid;
        failure_response(NO_EXISTS, att);

        delete extended_tmpl;
        return;
    }

    if (extended)
    {
        vm_tmpl->to_xml(str, extended_tmpl);

        delete extended_tmpl;
    }
    else
    {
        vm_tmpl->to_xml(str);
    }

    vm_tmpl->unlock();

    success_response(str, att);

    return;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void VirtualNetworkInfo::to_xml(RequestAttributes& att, PoolObjectSQL * object,
    string& str)
{
    vector<int> vms;
    vector<int> vnets;
    vector<int> vrs;

    string where_vnets;
    string where_vms;
    string where_vrs;

    bool all_reservations;
    bool all_vms;
    bool all_vrs;

    PoolObjectAuth perms;

    object->get_permissions(perms);

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(AuthRequest::MANAGE, perms);

    if (UserPool::authorize(ar) == 0)
    {
        all_reservations = true;
        all_vms = true;
        all_vrs = true;
    }
    else
    {
        all_reservations = RequestManagerPoolInfoFilter::use_filter(att,
                PoolObjectSQL::NET, true, true, false, "(pid != -1)", where_vnets);

        all_vms = RequestManagerPoolInfoFilter::use_filter(att,
                PoolObjectSQL::VM, false, false, false, "", where_vms);

        all_vrs = RequestManagerPoolInfoFilter::use_filter(att,
                PoolObjectSQL::VROUTER, false, false, false, "", where_vrs);
    }

    if ( all_reservations == true )
    {
        vnets.push_back(-1);
    }
    else
    {
        Nebula::instance().get_vnpool()->search(vnets, where_vnets);
    }

    if ( all_vms == true )
    {
        vms.push_back(-1);
    }
    else
    {
        Nebula::instance().get_vmpool()->search(vms, where_vms);
    }

    if ( all_vrs == true )
    {
        vrs.push_back(-1);
    }
    else
    {
        Nebula::instance().get_vrouterpool()->search(vrs, where_vrs);
    }

    static_cast<VirtualNetwork*>(object)->to_xml_extended(str, vms, vnets, vrs);
};
