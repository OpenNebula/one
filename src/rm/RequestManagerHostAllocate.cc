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

void RequestManager::HostAllocate::execute(
    xmlrpc_c::paramList const& paramList,
    xmlrpc_c::value *   const  retval)
{
    string              session;

    string              hostname;
    string              im_mad_name;
    string              vmm_mad_name;
    string              tm_mad_name;

    int                 hid;

    int                 rc;
    ostringstream       oss;

    /*   -- RPC specific vars --  */
    vector<xmlrpc_c::value> arrayData;
    xmlrpc_c::value_array * arrayresult;

    NebulaLog::log("ReM",Log::DEBUG,"HostAllocate method invoked");

    // Get the parameters
    session      = xmlrpc_c::value_string(paramList.getString(0));
    hostname     = xmlrpc_c::value_string(paramList.getString(1));
    im_mad_name  = xmlrpc_c::value_string(paramList.getString(2));
    vmm_mad_name = xmlrpc_c::value_string(paramList.getString(3));
    tm_mad_name  = xmlrpc_c::value_string(paramList.getString(4));

    //Authenticate the user
    rc = HostAllocate::upool->authenticate(session);

    if ( rc == -1 )
    {
        goto error_authenticate;
    }

    //Authorize the operation
    if ( rc != 0 ) // rc == 0 means oneadmin
    {
        AuthRequest ar(rc);

        ar.add_auth(AuthRequest::HOST,-1,AuthRequest::CREATE,0,false);

        if (UserPool::authorize(ar) == -1)
        {
            goto error_authorize;
        }
    }

    // Perform the allocation in the hostpool
    rc = HostAllocate::hpool->allocate(&hid,
                                       hostname,
                                       im_mad_name,
                                       vmm_mad_name,
                                       tm_mad_name);
    if ( rc == -1 )
    {
        goto error_host_allocate;
    }

    // All nice, return the new hid to client
    arrayData.push_back(xmlrpc_c::value_boolean(true)); // SUCCESS
    arrayData.push_back(xmlrpc_c::value_int(hid));
    arrayresult = new xmlrpc_c::value_array(arrayData);
    // Copy arrayresult into retval mem space
    *retval = *arrayresult;
    // and get rid of the original
    delete arrayresult;

    return;

error_authenticate:
    oss << "Error in user authentication";
    goto error_common;

error_authorize:
    oss << "User not authorized to allocate a new HOST";
    goto error_common;

error_host_allocate:
    oss << "Error inserting HOST in the database, check oned.log";
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
