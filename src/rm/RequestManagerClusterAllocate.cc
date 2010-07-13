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

void RequestManager::ClusterAllocate::execute(
    xmlrpc_c::paramList const& paramList,
    xmlrpc_c::value *   const  retval)
{
    string              session;

    string              clustername;
    int                 id;
    
    const string        method_name = "ClusterAllocate";

    int                 rc;
    ostringstream       oss;

    /*   -- RPC specific vars --  */
    vector<xmlrpc_c::value> arrayData;
    xmlrpc_c::value_array * arrayresult;

    NebulaLog::log("ReM",Log::DEBUG,"ClusterAllocate method invoked");

    // Get the parameters
    session      = xmlrpc_c::value_string(paramList.getString(0));
    clustername  = xmlrpc_c::value_string(paramList.getString(1));

    //Authenticate the user
    rc = ClusterAllocate::upool->authenticate(session);

    if ( rc == -1 )
    {
        goto error_authenticate;
    }

    //Authorize the operation
    if ( rc != 0 ) // rc == 0 means oneadmin
    {
        AuthRequest ar(rc);

        ar.add_auth(AuthRequest::CLUSTER,-1,AuthRequest::CREATE,0,false);

        if (UserPool::authorize(ar) == -1)
        {
            goto error_authorize;
        }
    }

    // Perform the allocation in the hostpool
    rc = ClusterAllocate::hpool->allocate_cluster(&id, clustername);

    if ( rc == -1 )
    {
        goto error_cluster_allocate;
    }

    // All nice, return the new id to client
    arrayData.push_back(xmlrpc_c::value_boolean(true)); // SUCCESS
    arrayData.push_back(xmlrpc_c::value_int(id));
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
    oss.str(authorization_error(method_name, "CREATE", "CLUSTER", rc, -1));
    goto error_common;

error_cluster_allocate:
    oss.str(action_error(method_name, "CREATE", "CLUSTER", -1, rc));
    goto error_common;

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
