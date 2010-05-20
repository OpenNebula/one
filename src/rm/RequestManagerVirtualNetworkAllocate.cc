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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManager::VirtualNetworkAllocate::execute(
    xmlrpc_c::paramList const& paramList,
    xmlrpc_c::value *   const  retval)
{
    string              session;
    string              username;
    string              password;
    string              name;
    string              stemplate;

    int                 nid;
    int                 uid;
    int                 rc;

    User *              user;

    ostringstream       oss;

    /*   -- RPC specific vars --  */
    vector<xmlrpc_c::value> arrayData;
    xmlrpc_c::value_array * arrayresult;

    NebulaLog::log("ReM",Log::DEBUG,"VirtualNetworkAllocate method invoked");

    // Get the parameters & host
    session   = xmlrpc_c::value_string(paramList.getString(0));
    stemplate = xmlrpc_c::value_string(paramList.getString(1));

    if ( User::split_secret(session,username,password) != 0 )
    {
        goto error_session;
    }

    // Now let's get the user
    user = VirtualNetworkAllocate::upool->get(username,true);

    if ( user == 0 )
    {
        goto error_get_user;
    }

    uid = user->get_uid();

    user->unlock();

    rc = vnpool->allocate(uid,stemplate,&nid);

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


error_session:
    oss << "Session information malformed, cannot allocate VirtualNetwork";
    goto error_common;

error_get_user:
    oss << "User not recognized, cannot allocate VirtualNetwork";
    goto error_common;

error_vn_allocate:
    oss << "Error allocating VN with template: " << endl << stemplate;
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
