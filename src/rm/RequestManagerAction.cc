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

#include "Nebula.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManager::VirtualMachineAction::execute(
    xmlrpc_c::paramList const& paramList,
    xmlrpc_c::value *   const  retval)
{
    string  session;
    string  action;
    int     vid;
    int     rc;

    int     uid;

    vector<xmlrpc_c::value> arrayData;
    xmlrpc_c::value_array * arrayresult;

    Nebula&             nd = Nebula::instance();
    DispatchManager *   dm = nd.get_dm();

    VirtualMachine *    vm;

    ostringstream       oss;
    
    const string  method_name = "VirtualMachineAction";

    NebulaLog::log("ReM",Log::DEBUG,"VirtualMachineAction invoked");

    session = xmlrpc_c::value_string(paramList.getString(0));
    action  = xmlrpc_c::value_string(paramList.getString(1));
    vid     = xmlrpc_c::value_int(paramList.getInt(2));

    // Get the VM
    vm  = VirtualMachineAction::vmpool->get(vid,true);

    if ( vm == 0 )
    {
        goto error_vm_get;
    }

    uid = vm->get_uid();

    vm->unlock();

    //Authenticate the user
    rc = VirtualMachineAction::upool->authenticate(session);

    if (rc == -1)
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

    if (action == "shutdown")
    {
        rc = dm->shutdown(vid);
    }
    else if (action == "hold")
    {
        rc = dm->hold(vid);
    }
    else if (action == "release")
    {
        rc = dm->release(vid);
    }
    else if (action == "stop")
    {
        rc = dm->stop(vid);
    }
    else if (action == "cancel")
    {
        rc = dm->cancel(vid);
    }
    else if (action == "suspend")
    {
        rc = dm->suspend(vid);
    }
    else if (action == "resume")
    {
        rc = dm->resume(vid);
    }
    else if (action == "restart")
    {
        rc = dm->restart(vid);
    }
    else if (action == "finalize")
    {
        rc = dm->finalize(vid);
    }
    else if (action == "resubmit")
    {
        rc = dm->resubmit(vid);
    }
    else
    {
        rc = -3;
    }

    if (rc != 0)
    {
        goto error_operation;
    }

    arrayData.push_back(xmlrpc_c::value_boolean(true));
    arrayresult = new xmlrpc_c::value_array(arrayData);
    *retval = *arrayresult;
    delete arrayresult;
    return;

error_operation:
    if (rc == -1)
    {
        oss << "Virtual machine does not exist";
    }
    else if ( rc == -2 )
    {
        oss << "Wrong state to perform action";
    }
    else if ( rc == -3 )
    {
        oss << "Unknown action";
    }
    goto error_common;

error_vm_get:
    oss.str(get_error(method_name, "VM", vid));
    goto error_common;

error_authenticate:
    oss.str(authenticate_error(method_name));
    goto error_common;

error_authorize:
    oss.str(authorization_error(method_name, "MANAGE", "VM", rc, vid));
    goto error_common;

error_common:
    arrayData.push_back(xmlrpc_c::value_boolean(false));
    arrayData.push_back(xmlrpc_c::value_string(oss.str()));

    xmlrpc_c::value_array arrayresult_error(arrayData);
    
    NebulaLog::log("ReM",Log::ERROR,oss);

    *retval = arrayresult_error;

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
