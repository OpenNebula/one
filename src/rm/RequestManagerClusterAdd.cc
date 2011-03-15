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

void RequestManager::ClusterAdd::execute(
    xmlrpc_c::paramList const& paramList,
    xmlrpc_c::value *   const  retval)
{
    string  session;

    int     hid;
    int     clid;
    int     rc;
    
    const string        method_name = "ClusterAdd";

    Host *      host;
    Cluster *   cluster;

    ostringstream oss;

    /*   -- RPC specific vars --  */
    vector<xmlrpc_c::value> arrayData;
    xmlrpc_c::value_array * arrayresult;

    NebulaLog::log("ReM",Log::DEBUG,"ClusterAdd method invoked");

    // Get the parameters
    session      = xmlrpc_c::value_string(paramList.getString(0));
    hid          = xmlrpc_c::value_int   (paramList.getInt(1));
    clid         = xmlrpc_c::value_int   (paramList.getInt(2));

    //Authenticate the user
    rc = ClusterAdd::upool->authenticate(session);

    if ( rc == -1 )
    {
        goto error_authenticate;
    }

     //Authorize the operation
    if ( rc != 0 ) // rc == 0 means oneadmin
    {
        AuthRequest ar(rc);
        
        ar.add_auth(AuthRequest::HOST,hid,AuthRequest::MANAGE,0,false);
        ar.add_auth(AuthRequest::CLUSTER,clid,AuthRequest::USE,0,false);

        if (UserPool::authorize(ar) == -1)
        {
            goto error_authorize;
        }
    }

    // Check if host exists
    host = ClusterAdd::hpool->get(hid,true);

    if ( host == 0 )
    {
        goto error_host_get;
    }

    // Check if cluster exists
    cluster = ClusterAdd::cpool->get(clid,true);

    if ( cluster == 0 )
    {
        goto error_cluster_get;
    }

    // Set cluster
    rc = host->set_cluster( cluster->get_name() );

    if ( rc != 0 )
    {
        goto error_cluster_add;
    }

    // Update the DB
    ClusterAdd::hpool->update(host);

    host->unlock();
    cluster->unlock();

    // All nice, return success to the client
    arrayData.push_back(xmlrpc_c::value_boolean(true)); // SUCCESS

    // Copy arrayresult into retval mem space
    arrayresult = new xmlrpc_c::value_array(arrayData);
    *retval = *arrayresult;

    delete arrayresult; // and get rid of the original

    return;

error_authenticate:
    oss.str(authenticate_error(method_name));
    goto error_common;

error_authorize:
    oss.str(authorization_error(method_name, "USE", "CLUSTER", rc, clid));
    goto error_common;

error_host_get:
    oss.str(get_error(method_name, "HOST", hid));
    goto error_common;

error_cluster_get:
    host->unlock();
    oss.str(get_error(method_name, "CLUSTER", clid));
    goto error_common;

error_cluster_add:
    host->unlock();
    oss.str(action_error(method_name, "USE", "CLUSTER", clid, rc));
    goto error_common;

error_common:

    arrayData.push_back(xmlrpc_c::value_boolean(false)); // FAILURE
    arrayData.push_back(xmlrpc_c::value_string(oss.str()));

    NebulaLog::log("ReM",Log::ERROR,oss);

    xmlrpc_c::value_array arrayresult_error(arrayData);

    *retval = arrayresult_error;

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
