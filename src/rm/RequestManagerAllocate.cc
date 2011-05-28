/* -------------------------------------------------------------------------- */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             */
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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string RequestManagerAllocate::allocate_error (const string& error)
{
    ostringstream oss;

    oss << "[" << method_name << "]" << " Error allocating a new "
        << object_name(auth_object) << ".";

    if (!error.empty())
    {
        oss << " " << error;
    }

    return oss.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string RequestManagerAllocate::allocate_error (char *error)
{
    ostringstream oss;

    oss << "[" << method_name << "]" << " Error allocating a new "
        << object_name(auth_object) << ". Parse error";

    if ( error != 0 )
    {
        oss << ": " << error;
        free(error);
    }
    else
    {
        oss << ".";
    }

    return oss.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool RequestManagerAllocate::allocate_authorization(Template * tmpl)
{
    if ( uid == 0 )
    {
        return true;
    }

    AuthRequest ar(uid);

    if ( tmpl == 0 )
    { 
        ar.add_auth(auth_object,-1,auth_op,uid,false);
    }
    else
    {
        string t64;

        ar.add_auth(auth_object,tmpl->to_xml(t64),auth_op,uid,false);
    }

   if (UserPool::authorize(ar) == -1)
   {
        failure_response(AUTHORIZATION, //TODO
                 authorization_error("INFO","USER",uid,-1));

        return false;
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManagerAllocate::request_execute(xmlrpc_c::paramList const& params)
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
            failure_response(INTERNAL, allocate_error(error_msg));
            delete tmpl;

            return;
        }
    }

    if ( allocate_authorization(tmpl) == false )
    {
        return;
    }

    rc = pool_allocate(params, tmpl, id, error_str);

    if ( rc < 0 )
    {
        failure_response(INTERNAL, allocate_error(error_str));
        return;
    }
    
    success_response(id);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualNetworkAllocate::pool_allocate(xmlrpc_c::paramList const& _paramList, 
                                          Template * tmpl,
                                          int& id, 
                                          string& error_str)
{
    VirtualNetworkPool * vpool = static_cast<VirtualNetworkPool *>(pool);
    VirtualNetworkTemplate * vtmpl=static_cast<VirtualNetworkTemplate *>(tmpl);

    return vpool->allocate(uid, gid, vtmpl, &id, error_str);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImageAllocate::pool_allocate(xmlrpc_c::paramList const& _paramList, 
                                 Template * tmpl,
                                 int& id, 
                                 string& error_str)
{
    ImagePool * ipool = static_cast<ImagePool *>(pool);
    ImageTemplate * itmpl = static_cast<ImageTemplate *>(tmpl);

    return ipool->allocate(uid, gid, itmpl, &id, error_str);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int TemplateAllocate::pool_allocate(xmlrpc_c::paramList const& _paramList, 
                                    Template * tmpl,
                                    int& id, 
                                    string& error_str)
{
    VMTemplatePool * tpool = static_cast<VMTemplatePool *>(pool);

    VirtualMachineTemplate * ttmpl=static_cast<VirtualMachineTemplate *>(tmpl);

    return tpool->allocate(uid, gid, ttmpl, &id, error_str);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostAllocate::pool_allocate(xmlrpc_c::paramList const& paramList, 
                                Template * tmpl,
                                int& id, 
                                string& error_str)
{
    string host    = xmlrpc_c::value_string(paramList.getString(1));
    string im_mad  = xmlrpc_c::value_string(paramList.getString(2));
    string vmm_mad = xmlrpc_c::value_string(paramList.getString(3));
    string tm_mad  = xmlrpc_c::value_string(paramList.getString(4));

    HostPool * hpool = static_cast<HostPool *>(pool);

    return hpool->allocate(&id, host, im_mad, vmm_mad, tm_mad, error_str);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int UserAllocate::pool_allocate(xmlrpc_c::paramList const& paramList, 
                                Template * tmpl,
                                int& id, 
                                string& error_str)
{
    string uname  = xmlrpc_c::value_string(paramList.getString(1));
    string passwd = xmlrpc_c::value_string(paramList.getString(2));

    UserPool * upool = static_cast<UserPool *>(pool);

    return upool->allocate(&id,GroupPool::USERS_ID,uname,passwd,true,error_str);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ClusterAllocate::pool_allocate(xmlrpc_c::paramList const& paramList, 
                                   Template * tmpl,
                                   int& id, 
                                   string& error_str)
{
    string cname = xmlrpc_c::value_string(paramList.getString(1));

    ClusterPool * cpool = static_cast<ClusterPool *>(pool);

    return cpool->allocate(&id, cname, error_str);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int GroupAllocate::pool_allocate(xmlrpc_c::paramList const& paramList, 
                                 Template * tmpl,
                                 int& id, 
                                 string& error_str)
{
    string gname = xmlrpc_c::value_string(paramList.getString(1));

    GroupPool * gpool = static_cast<GroupPool *>(pool);

    return gpool->allocate(uid, gname, &id, error_str);
}

