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
#include "Nebula.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManager::VirtualMachineCancel::execute(
    xmlrpc_c::paramList const& paramList,
    xmlrpc_c::value *   const  retval)
{
    string              session;

    // <vid> of the vid to retrieve the information for
    int                 vid;
    int                 uid;
    
    const string        method_name = "VirtualMachineCancel";

    VirtualMachine *    vm;

    ostringstream       oss;

    /*   -- RPC specific vars --  */
    vector<xmlrpc_c::value> arrayData;
    xmlrpc_c::value_array * arrayresult;

    Nebula&             nd = Nebula::instance();
    DispatchManager *   dm = nd.get_dm();

    Nebula::log("ReM",Log::DEBUG,"VirtualMachineCancel method invoked");

    // Get the parameters
    session      = xmlrpc_c::value_string(paramList.getString(0));
    vid          = xmlrpc_c::value_int   (paramList.getInt(1));

    // Retrieve the VM from the vmpool
    vm = VirtualMachineCancel::vmpool->get(vid,true);

    if ( vm == 0 )
    {
        goto error_vm_get;
    }

    uid = vm->get_uid();

    vm->unlock();

    //Authenticate the user
    rc = VirtualMachineCancel::upool->authenticate(session);

    if ( rc == -1 )
    {
        goto error_authenticate;
    }

    //Authorize the operation
    if ( rc != 0 ) // rc == 0 means oneadmin
    {
        AuthRequest ar(rc);

        ar.add_auth(AuthRequest::VM,vid,AuthRequest::MANAGE,uid,false);

        if (UserPool::authorize(ar) == -1)
        {
            goto error_authorize;
        }
    }

    //Cancel the VM
    dm->cancel(vid);

    // Send results to client
    arrayData.push_back(xmlrpc_c::value_boolean(true));

    arrayresult = new xmlrpc_c::value_array(arrayData);

    *retval = *arrayresult;

    delete arrayresult;

    return;

error_authenticate:
    oss.str(authenticate_error(method_name));
    goto error_common;

error_authorize:
    oss.str(authorization_error(method_name, "MANAGE", "VM", uid, vid));
    goto error_common;

error_vm_get:
    oss.str(get_error(method_name, "VM", vid));
    goto error_common;

error_common:
    arrayData.push_back(xmlrpc_c::value_boolean(false)); // FAILURE
    arrayData.push_back(xmlrpc_c::value_string(oss.str()));

    Nebula::log("ReM",Log::ERROR,oss);

    xmlrpc_c::value_array arrayresult_error(arrayData);

    *retval = arrayresult_error;

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
