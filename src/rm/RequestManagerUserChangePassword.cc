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

void RequestManager::UserChangePassword::execute(
    xmlrpc_c::paramList const& paramList,
    xmlrpc_c::value *   const  retval)
{
    string              session;

    int                 uid;
    int                 rc;
    string              new_pass;
    User *              user;
    ostringstream       oss;

    const string  method_name = "UserChangePassword";

    /*   -- RPC specific vars --  */
    vector<xmlrpc_c::value> arrayData;  
    xmlrpc_c::value_array * arrayresult;

    NebulaLog::log("ReM",Log::DEBUG,"UserChangePassword method invoked");

    // Get the parameters & user
    session  = xmlrpc_c::value_string(paramList.getString(0));
    uid      = xmlrpc_c::value_int(paramList.getInt(1));
    new_pass = xmlrpc_c::value_string(paramList.getString(2));

    //Authenticate the user
    rc = UserChangePassword::upool->authenticate(session);

    if ( rc == -1 )
    {
        goto error_authenticate;
    }

    //Authorize the operation
    if ( rc != 0 ) // rc == 0 means oneadmin
    {
        AuthRequest ar(rc);

        ar.add_auth(AuthRequest::USER,uid,AuthRequest::MANAGE,0,false);

        if (UserPool::authorize(ar) == -1)
        {
            goto error_authorize;
        }
    }

    user = UserChangePassword::upool->get(uid,true);

    if ( user == 0 )
    {
        goto error_user_get;
    }

    user->set_password(new_pass);

    UserChangePassword::upool->update(user);

    user->unlock();

    //Result
    arrayData.push_back(xmlrpc_c::value_boolean(true));
    arrayresult = new xmlrpc_c::value_array(arrayData);

    *retval = *arrayresult;

    delete arrayresult;

    return;

error_authenticate:
    oss.str(authenticate_error(method_name));
    goto error_common;

error_authorize:
    oss.str(authorization_error(method_name, "MANAGE", "USER", rc, uid));
    goto error_common;

error_user_get:
    oss.str(get_error(method_name, "USER", uid));
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
