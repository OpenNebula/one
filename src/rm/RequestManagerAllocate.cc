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

#include "Nebula.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManager::VirtualMachineAllocate::execute(
    xmlrpc_c::paramList const& paramList,
    xmlrpc_c::value *   const  retval)
{
    string              session;
    string              username;
    string              password;
    string              vm_template;

    int                 vid;
    int                 uid;
    int                 rc;

    Nebula&             nd = Nebula::instance();
    DispatchManager *   dm = nd.get_dm();

    User            *   user;

    ostringstream       oss;

    vector<xmlrpc_c::value> arrayData;
    xmlrpc_c::value_array * arrayresult;


    NebulaLog::log("ReM",Log::DEBUG,"VirtualMachineAllocate invoked");

    session     = xmlrpc_c::value_string(paramList.getString(0));
    vm_template = xmlrpc_c::value_string(paramList.getString(1));
    vm_template += "\n";


    // First, we need to authenticate the user
    rc = VirtualMachineAllocate::upool->authenticate(session);

    if ( rc == -1 )
    {
        goto error_authenticate;
    }

    User::split_secret(session,username,password);

    // Now let's get the user
    user = VirtualMachineAllocate::upool->get(username,true);

    if ( user == 0 )
    {
        goto error_get_user;
    }

    uid = user->get_uid();

    user->unlock();

    rc = dm->allocate(uid,vm_template,&vid);

    if ( rc < 0 )
    {
        goto error_allocate;

    }

    arrayData.push_back(xmlrpc_c::value_boolean(true));
    arrayData.push_back(xmlrpc_c::value_int(vid));

    // Copy arrayresult into retval mem space
    arrayresult = new xmlrpc_c::value_array(arrayData);
    *retval = *arrayresult;

    delete arrayresult; // and get rid of the original


    return;

error_authenticate:
    oss << "User not authenticated, aborting RequestManagerAllocate call.";
    goto error_common;

error_get_user:
    oss << "User not recognized, cannot allocate VirtualMachine";
    goto error_common;

error_allocate:
    if (rc == -1)
    {
        oss << "Error inserting VM in the database, check oned.log";
    }
    else
    {
        oss << "Error parsing VM template";
    }
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
