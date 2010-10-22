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

void RequestManager::VirtualNetworkDelete::execute(
    xmlrpc_c::paramList const& paramList,
    xmlrpc_c::value *   const  retval)
{
    string              session;

    string              name;
    int                 nid;
    int                 uid;

    VirtualNetwork *    vn;

    int                 network_owner;
    bool                is_public;

    int                 rc;
    ostringstream       oss;

    const string        method_name = "VirtualNetworkDelete";

    /*   -- RPC specific vars --  */
    vector<xmlrpc_c::value> arrayData;
    xmlrpc_c::value_array * arrayresult;

    NebulaLog::log("ReM",Log::DEBUG,"VirtualNetworkDelete method invoked");

    // Get the parameters & host
    session   = xmlrpc_c::value_string(paramList.getString(0));
    nid       = xmlrpc_c::value_int   (paramList.getInt   (1));

    // First, we need to authenticate the user
    rc = VirtualNetworkDelete::upool->authenticate(session);

    if ( rc == -1 )
    {
        goto error_authenticate;
    }

    // Retrieve VN from the pool
    vn = vnpool->get(nid,true);

    if ( vn == 0 )
    {
        goto error_vn_get;
    }

    network_owner = vn->get_uid();
    is_public     = vn->isPublic();

    vn->unlock();


    //Authorize the operation
    if ( rc != 0 ) // rc == 0 means oneadmin
    {
        AuthRequest ar(rc);

        ar.add_auth(AuthRequest::NET,
                    nid,
                    AuthRequest::DELETE,
                    network_owner,
                    is_public);

        if (UserPool::authorize(ar) == -1)
        {
            goto error_authorize;
        }
    }

    // Retrieve VN from the pool
    vn = vnpool->get(nid,true);

    if ( vn == 0 )
    {
        goto error_vn_get;
    }

    uid = vn->get_uid();

    rc = vnpool->drop(vn);

    vn->unlock();

    // All nice, return the host info to the client
    arrayData.push_back(xmlrpc_c::value_boolean( rc == 0 )); // SUCCESS
    arrayresult = new xmlrpc_c::value_array(arrayData);

    // Copy arrayresult into retval mem space
    *retval = *arrayresult;
    // and get rid of the original
    delete arrayresult;

    return;

error_authenticate:
    oss.str(authenticate_error(method_name));
    goto error_common;

error_authorize:
    oss.str(authorization_error(method_name, "DELETE", "NET", rc, nid));
    goto error_common;

error_vn_get:
    oss.str(get_error(method_name, "NET", nid));
    goto error_common;

error_common:
    NebulaLog::log ("ReM",Log::ERROR,oss);

    arrayData.push_back(xmlrpc_c::value_boolean(false)); // FAILURE
    arrayData.push_back(xmlrpc_c::value_string(oss.str()));

    xmlrpc_c::value_array arrayresult_error(arrayData);

    *retval = arrayresult_error;

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
