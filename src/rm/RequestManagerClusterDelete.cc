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
#include "NebulaLog.h"

#include "AuthManager.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManager::ClusterDelete::execute(
    xmlrpc_c::paramList const& paramList,
    xmlrpc_c::value *   const  retval)
{
    string              session;

    // <clid> of the cluster to delete from the HostPool
    int                 clid;
    ostringstream       oss;
    int                 rc;

    const string        method_name = "ClusterDelete";

    /*   -- RPC specific vars --  */
    vector<xmlrpc_c::value> arrayData;
    xmlrpc_c::value_array * arrayresult;

    NebulaLog::log("ReM",Log::DEBUG,"ClusterDelete method invoked");

    // Get the parameters
    session      = xmlrpc_c::value_string(paramList.getString(0));
    clid         = xmlrpc_c::value_int   (paramList.getInt(1));

    //Authenticate the user
    rc = ClusterDelete::upool->authenticate(session);

    if ( rc == -1 )
    {
        goto error_authenticate;
    }

    //Authorize the operation
    if ( rc != 0 ) // rc == 0 means oneadmin
    {
        AuthRequest ar(rc);

        ar.add_auth(AuthRequest::CLUSTER,clid,AuthRequest::DELETE,0,false);

        if (UserPool::authorize(ar) == -1)
        {
            goto error_authorize;
        }
    }

    rc = ClusterDelete::hpool->drop_cluster(clid);

    if ( rc != 0 )
    {
        goto error_cluster_delete;
    }

    // Return success
    arrayData.push_back(xmlrpc_c::value_boolean(true)); // SUCCESS
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
    oss.str(authorization_error(method_name, "DELETE", "CLUSTER", rc, clid));
    goto error_common;

error_cluster_delete:
    oss.str(action_error(method_name, "DELETE", "CLUSTER", clid, rc));
    goto error_common;

error_common:
    NebulaLog::log ("Rem",Log::ERROR,oss);

    arrayData.push_back(xmlrpc_c::value_boolean(false)); // FAILURE
    arrayData.push_back(xmlrpc_c::value_string(oss.str()));

    xmlrpc_c::value_array arrayresult_error(arrayData);

    *retval = arrayresult_error;

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
