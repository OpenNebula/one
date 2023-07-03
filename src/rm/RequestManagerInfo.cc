/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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
#include "VirtualMachineDisk.h"
#include "Nebula.h"
#include "VirtualRouterPool.h"
#include "ScheduledActionPool.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void RequestManagerInfo::request_execute(xmlrpc_c::paramList const& paramList,
                                         RequestAttributes& att)
{
    int             oid = xmlrpc_c::value_int(paramList.getInt(1));
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

    auto object = pool->get_ro<PoolObjectSQL>(oid);

    if ( object == nullptr )
    {
        att.resp_id = oid;
        failure_response(NO_EXISTS, att);
        return;
    }

    // Check optional parameter - decrypt
    bool decrypt = false;
    if (att.is_admin() && paramList.size() > 2)
    {
        decrypt = xmlrpc_c::value_boolean(paramList.getBoolean(2));
    }

    if (decrypt)
    {
        object->decrypt();
    }

    load_monitoring(object.get());

    to_xml(att, object.get(), str);

    success_response(str, att);

    return;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void TemplateInfo::request_execute(xmlrpc_c::paramList const& paramList,
                                         RequestAttributes& att)
{
    VMTemplatePool * tpool   = static_cast<VMTemplatePool *>(pool);

    unique_ptr<VirtualMachineTemplate> extended_tmpl;

    PoolObjectAuth perms;

    int  oid = xmlrpc_c::value_int(paramList.getInt(1));
    bool extended = false;

    string str;

    if ( paramList.size() > 2 )
    {
        extended = xmlrpc_c::value_boolean(paramList.getBoolean(2));
    }

    auto vm_tmpl = tpool->get_ro(oid);

    if ( vm_tmpl == nullptr )
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

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(att.auth_op, perms); //USE TEMPLATE

    if (extended)
    {
        VirtualMachine::set_auth_request(att.uid, ar, extended_tmpl.get(), false);

        VirtualMachineDisks::extended_info(att.uid, extended_tmpl.get());
    }

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;
        failure_response(AUTHORIZATION, att);

        return;
    }

    // Check optional parameter - decrypt
    bool decrypt = false;

    if (att.is_admin() && paramList.size() > 3)
    {
        decrypt = xmlrpc_c::value_boolean(paramList.getBoolean(3));
    }

    if (decrypt)
    {
        vm_tmpl->decrypt();
    }

    if (extended)
    {
        vm_tmpl->to_xml(str, extended_tmpl.get());
    }
    else
    {
        vm_tmpl->to_xml(str);
    }

    success_response(str, att);

    return;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void VirtualNetworkTemplateInfo::request_execute(xmlrpc_c::paramList const& paramList,
                                         RequestAttributes& att)
{
    VNTemplatePool * tpool   = static_cast<VNTemplatePool *>(pool);

    PoolObjectAuth perms;

    int    oid = xmlrpc_c::value_int(paramList.getInt(1));
    string str;

    auto vn_tmpl = tpool->get_ro(oid);

    if ( vn_tmpl == nullptr )
    {
        att.resp_id = oid;
        failure_response(NO_EXISTS, att);
        return;
    }

    vn_tmpl->get_permissions(perms);

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(att.auth_op, perms); //USE TEMPLATE

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;
        failure_response(AUTHORIZATION, att);

        return;
    }

    // Check optional parameter - decrypt
    bool decrypt = false;

    if (att.is_admin() && paramList.size() > 2)
    {
        decrypt = xmlrpc_c::value_boolean(paramList.getBoolean(2));
    }

    if (decrypt)
    {
        vn_tmpl->decrypt();
    }

    vn_tmpl->to_xml(str);

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

