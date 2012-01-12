/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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

#include "RequestManagerAllocate.h"
#include "NebulaLog.h"

#include "Nebula.h"
#include "PoolObjectSQL.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool RequestManagerAllocate::allocate_authorization(Template * tmpl,
                                                    RequestAttributes& att)
{
    if ( att.uid == 0 )
    {
        return true;
    }

    string tmpl_str = "";

    AuthRequest ar(att.uid, att.gid);

    if ( tmpl != 0 )
    {
        tmpl->to_xml(tmpl_str);
    }

    ar.add_create_auth(auth_object, tmpl_str);

    if (UserPool::authorize(ar) == -1)
    {
        failure_response(AUTHORIZATION,
                authorization_error(ar.message, att),
                att);

        return false;
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool VirtualMachineAllocate::allocate_authorization(Template * tmpl,
                                                    RequestAttributes& att)
{
    if ( att.uid == 0 )
    {
        return true;
    }

    AuthRequest ar(att.uid, att.gid);
    string      t64;

    VirtualMachineTemplate * ttmpl = static_cast<VirtualMachineTemplate *>(tmpl);

    ar.add_create_auth(auth_object, tmpl->to_xml(t64));

    VirtualMachine::set_auth_request(att.uid, ar, ttmpl);

    if (UserPool::authorize(ar) == -1)
    {
        failure_response(AUTHORIZATION,
                authorization_error(ar.message, att),
                att);

        return false;
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManagerAllocate::request_execute(xmlrpc_c::paramList const& params,
                                             RequestAttributes& att)
{
    Template * tmpl = 0;

    string error_str;
    int    rc, id;

    if ( do_template == true )
    {
        char * error_msg = 0;
        string str_tmpl  = xmlrpc_c::value_string(params.getString(1));

        tmpl = get_object_template();

        rc   = tmpl->parse(str_tmpl, &error_msg);

        if ( rc != 0 )
        {
            failure_response(INTERNAL, allocate_error(error_msg), att);
            delete tmpl;

            return;
        }
    }

    if ( allocate_authorization(tmpl, att) == false )
    {
        return;
    }

    rc = pool_allocate(params, tmpl, id, error_str, att);

    if ( rc < 0 )
    {
        failure_response(INTERNAL, allocate_error(error_str), att);
        return;
    }
    
    success_response(id, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachineAllocate::pool_allocate(xmlrpc_c::paramList const& paramList, 
                                          Template * tmpl,
                                          int& id, 
                                          string& error_str,
                                          RequestAttributes& att)
{
    VirtualMachineTemplate * ttmpl= static_cast<VirtualMachineTemplate *>(tmpl);
    VirtualMachinePool * vmpool   = static_cast<VirtualMachinePool *>(pool);

    return vmpool->allocate(att.uid, att.gid, att.uname, att.gname, ttmpl, &id,
            error_str, false);
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetworkAllocate::pool_allocate(xmlrpc_c::paramList const& _paramList, 
                                          Template * tmpl,
                                          int& id, 
                                          string& error_str,
                                          RequestAttributes& att)
{
    VirtualNetworkPool * vpool = static_cast<VirtualNetworkPool *>(pool);
    VirtualNetworkTemplate * vtmpl=static_cast<VirtualNetworkTemplate *>(tmpl);

    return vpool->allocate(att.uid, att.gid, att.uname, att.gname, vtmpl, &id,
            error_str);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImageAllocate::pool_allocate(xmlrpc_c::paramList const& _paramList, 
                                 Template * tmpl,
                                 int& id, 
                                 string& error_str,
                                 RequestAttributes& att)
{
    ImagePool * ipool = static_cast<ImagePool *>(pool);
    ImageTemplate * itmpl = static_cast<ImageTemplate *>(tmpl);

    return ipool->allocate(att.uid, att.gid, att.uname, att.gname, itmpl, &id,
            error_str);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int TemplateAllocate::pool_allocate(xmlrpc_c::paramList const& _paramList, 
                                    Template * tmpl,
                                    int& id, 
                                    string& error_str,
                                    RequestAttributes& att)
{
    VMTemplatePool * tpool = static_cast<VMTemplatePool *>(pool);

    VirtualMachineTemplate * ttmpl=static_cast<VirtualMachineTemplate *>(tmpl);

    return tpool->allocate(att.uid, att.gid, att.uname, att.gname, ttmpl, &id,
            error_str);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostAllocate::pool_allocate(xmlrpc_c::paramList const& paramList, 
                                Template * tmpl,
                                int& id, 
                                string& error_str,
                                RequestAttributes& att)
{
    string host    = xmlrpc_c::value_string(paramList.getString(1));
    string im_mad  = xmlrpc_c::value_string(paramList.getString(2));
    string vmm_mad = xmlrpc_c::value_string(paramList.getString(3));
    string vnm_mad = xmlrpc_c::value_string(paramList.getString(4));
    string tm_mad  = xmlrpc_c::value_string(paramList.getString(5));

    HostPool * hpool = static_cast<HostPool *>(pool);

    return hpool->allocate(&id, host, im_mad, vmm_mad, vnm_mad, tm_mad,
            error_str);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int UserAllocate::pool_allocate(xmlrpc_c::paramList const& paramList, 
                                Template * tmpl,
                                int& id, 
                                string& error_str,
                                RequestAttributes& att)
{
    string uname  = xmlrpc_c::value_string(paramList.getString(1));
    string passwd = xmlrpc_c::value_string(paramList.getString(2));
    string driver = xmlrpc_c::value_string(paramList.getString(3));

    UserPool * upool = static_cast<UserPool *>(pool);

    int      ugid   = att.gid;
    string   ugname = att.gname;

    if ( att.gid == GroupPool::ONEADMIN_ID )
    {
        ugid   = GroupPool::USERS_ID;
        ugname = GroupPool::USERS_NAME;
    }

    if (driver.empty())
    {
        driver = UserPool::CORE_AUTH;    
    }

    return upool->allocate(&id,ugid,uname,ugname,passwd,driver,true,error_str);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int GroupAllocate::pool_allocate(xmlrpc_c::paramList const& paramList, 
                                 Template * tmpl,
                                 int& id, 
                                 string& error_str,
                                 RequestAttributes& att)
{
    string gname = xmlrpc_c::value_string(paramList.getString(1));

    GroupPool * gpool = static_cast<GroupPool *>(pool);

    return gpool->allocate(gname, &id, error_str);
}

