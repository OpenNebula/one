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

#include "RequestManager.h"
#include "VirtualNetworkTemplate.h"

#include "NebulaLog.h"
#include "Nebula.h"

#include "AuthManager.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManager::VirtualNetworkRemoveLeases::execute(
    xmlrpc_c::paramList const& paramList,
    xmlrpc_c::value *   const  retval)
{
    string              session;

    int                 nid;
    int                 uid;
    int                 rc;

    string              str_template;
    string              error_add;
    char *              error_msg = 0;

    VirtualNetworkTemplate leases_template;
    VirtualNetwork *       vn;

    int                 network_owner;
    bool                is_public;

    ostringstream       oss;

    const string  method_name = "VirtualNetworkRemoveLeases";

    vector<xmlrpc_c::value> arrayData;
    xmlrpc_c::value_array * arrayresult;


    NebulaLog::log("ReM",Log::DEBUG,"VirtualNetworkRemoveLeases invoked");

    session         = xmlrpc_c::value_string (paramList.getString(0));
    nid             = xmlrpc_c::value_int    (paramList.getInt(1));
    str_template    = xmlrpc_c::value_string (paramList.getString(2));

    // First, we need to authenticate the user
    uid = VirtualNetworkRemoveLeases::upool->authenticate(session);

    if ( uid == -1 )
    {
        goto error_authenticate;
    }

    // Check template syntax
    rc = leases_template.parse(str_template,&error_msg);

    if ( rc != 0 )
    {
        goto error_parse;
    }

    // Get virtual network from the VirtualNetworkPool
    vn = VirtualNetworkRemoveLeases::vnpool->get(nid,true);

    if ( vn == 0 )
    {
        goto error_vn_get;
    }

    network_owner = vn->get_uid();
    is_public     = vn->isPublic();

    vn->unlock();

    // Authorize the operation
    if ( uid != 0 ) // uid == 0 means oneadmin
    {
        AuthRequest ar(uid);

        ar.add_auth(AuthRequest::NET,
                    nid,
                    AuthRequest::MANAGE,
                    network_owner,
                    is_public);

        if (UserPool::authorize(ar) == -1)
        {
            goto error_authorize;
        }
    }

    // Get virtual network from the VirtualNetworkPool
    vn = VirtualNetworkRemoveLeases::vnpool->get(nid,true);

    if ( vn == 0 )
    {
        goto error_vn_get;
    }

    rc = vn->remove_leases(&leases_template, error_add);

    if ( rc < 0 )
    {
        goto error_add;
    }

    vn->unlock();

    arrayData.push_back(xmlrpc_c::value_boolean(true));
    arrayData.push_back(xmlrpc_c::value_int(nid));

    // Copy arrayresult into retval mem space
    arrayresult = new xmlrpc_c::value_array(arrayData);
    *retval = *arrayresult;

    delete arrayresult; // and get rid of the original

    return;

error_authenticate:
    oss.str(authenticate_error(method_name));
    goto error_common;

error_parse:
    oss << action_error(method_name, "PARSE", "LEASES TEMPLATE",-2,rc);
    if (error_msg != 0)
    {
        oss << " Reason: " << error_msg;
        free(error_msg);
    }
    goto error_common;

error_vn_get:
    oss.str(get_error(method_name, "NET", nid));
    goto error_common;

error_authorize:
    oss.str(authorization_error(method_name, "MANAGE", "NET", uid, nid));
    goto error_common;

error_add:
    oss << action_error(method_name, "REMOVE LEASE", "NET", nid, rc);
    oss << " Reason: " << error_add;

    vn->unlock();

error_common:
    arrayData.push_back(xmlrpc_c::value_boolean(false));  // FAILURE
    arrayData.push_back(xmlrpc_c::value_string(oss.str()));

    NebulaLog::log("ReM",Log::ERROR,oss);

    xmlrpc_c::value_array arrayresult_error(arrayData);

    *retval = arrayresult_error;

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
