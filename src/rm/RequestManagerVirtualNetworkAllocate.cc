/* -------------------------------------------------------------------------- */
/* Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             */
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

#include "RequestManager.h"
#include "NebulaLog.h"

#include "AuthManager.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManager::VirtualNetworkAllocate::execute(
    xmlrpc_c::paramList const& paramList,
    xmlrpc_c::value *   const  retval)
{
    string              session;
    string              name;
    string              user_name;
    string              str_template;
    string              error_str;

    VirtualNetworkTemplate * vn_template;
    User *                   user;

    int                 nid;
    int                 uid;
    int                 rc;
    char *              error_msg = 0;

    ostringstream       oss;

    const string        method_name = "VirtualNetworkAllocate";

    /*   -- RPC specific vars --  */
    vector<xmlrpc_c::value> arrayData;
    xmlrpc_c::value_array * arrayresult;

    NebulaLog::log("ReM",Log::DEBUG,"VirtualNetworkAllocate method invoked");

    // Get the parameters & host
    session      = xmlrpc_c::value_string(paramList.getString(0));
    str_template = xmlrpc_c::value_string(paramList.getString(1));

    //--------------------------------------------------------------------------
    //   Authorize this request
    //--------------------------------------------------------------------------
    uid = VirtualNetworkAllocate::upool->authenticate(session);

    if ( uid == -1 )
    {
        goto error_authenticate;
    }

    //--------------------------------------------------------------------------
    //   Authorize this request
    //--------------------------------------------------------------------------
    vn_template = new VirtualNetworkTemplate;

    rc = vn_template->parse(str_template,&error_msg);

    if ( rc != 0 )
    {
        goto error_parse;
    }

    if ( uid != 0 )
    {
        AuthRequest ar(uid);
        string      t64;
        string      pub;
        string      pub_name = "PUBLIC";

        vn_template->get(pub_name, pub);
        transform (pub.begin(), pub.end(), pub.begin(),(int(*)(int))toupper);

        ar.add_auth(AuthRequest::NET,
                    vn_template->to_xml(t64),
                    AuthRequest::CREATE,
                    uid,
                    (pub == "YES"));

        if (UserPool::authorize(ar) == -1)
        {
            goto error_authorize;
        }
    }

    //--------------------------------------------------------------------------
    //   Get the User Name
    //--------------------------------------------------------------------------

    user = VirtualNetworkAllocate::upool->get(uid,true);

    if ( user == 0 )
    {
        goto error_user_get;
    }

    user_name = user->get_name();

    user->unlock();

    //--------------------------------------------------------------------------
    //   Allocate the Virtual Network
    //--------------------------------------------------------------------------
    rc = vnpool->allocate(uid,user_name,vn_template,&nid,error_str);

    if ( rc < 0 )
    {
        goto error_vn_allocate;
    }

    //Result
    arrayData.push_back(xmlrpc_c::value_boolean(true)); // SUCCESS
    arrayData.push_back(xmlrpc_c::value_int(nid));
    arrayresult = new xmlrpc_c::value_array(arrayData);

    *retval = *arrayresult;

    delete arrayresult;

    return;


error_user_get:
    oss.str(get_error(method_name, "USER", uid));

    delete vn_template;
    goto error_common;

error_authenticate:
    oss.str(authenticate_error(method_name));
    goto error_common;

error_authorize:
    oss.str(authorization_error(method_name, "CREATE", "VNET", uid, -1));
    delete vn_template;
    goto error_common;

error_parse:
    oss << action_error(method_name, "PARSE", "VNET TEMPLATE",-2,rc);
    if (error_msg != 0)
    {
        oss << ". Reason: " << error_msg;
        free(error_msg);
    }

    delete vn_template;
    goto error_common;

error_vn_allocate:
    oss << action_error(method_name, "CREATE", "NET", -2, 0);
    oss << " " << error_str;
    goto error_common;

error_common:
    NebulaLog::log("ReM",Log::ERROR,oss);

    arrayData.push_back(xmlrpc_c::value_boolean(false));
    arrayData.push_back(xmlrpc_c::value_string(oss.str()));

    xmlrpc_c::value_array arrayresult_error(arrayData);

    *retval = arrayresult_error;

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
