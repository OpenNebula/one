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

void RequestManager::VirtualMachineDeploy::execute(
    xmlrpc_c::paramList const& paramList,
    xmlrpc_c::value *   const  retval)
{
    string              session;
    int                 vid;
    int                 hid;
    int                 uid;
    int                 rc;

    string              hostname;
    string              vmm_mad;
    string              tm_mad;
    string              vmdir;

    const string  method_name = "VirtualMachineDeploy";

    VirtualMachine *    vm;
    Host *              host;

    Nebula&             nd = Nebula::instance();
    DispatchManager *   dm = nd.get_dm();

    vector<xmlrpc_c::value> arrayData;
    xmlrpc_c::value_array * arrayresult;

    ostringstream       oss;

    NebulaLog::log("ReM",Log::DEBUG,"VirtualMachineDeploy invoked");

    //Parse Arguments
    session = xmlrpc_c::value_string(paramList.getString(0));
    vid     = xmlrpc_c::value_int(paramList.getInt(1));
    hid     = xmlrpc_c::value_int(paramList.getInt(2));

    // -------------------------------------------------------------------------
    //                       Authenticate the user
    // -------------------------------------------------------------------------
    rc = VirtualMachineDeploy::upool->authenticate(session);

    if ( rc == -1 )
    {
        goto error_authenticate;
    }

    // -------------------------------------------------------------------------
    //                           Get user data
    // -------------------------------------------------------------------------
    vm = VirtualMachineDeploy::vmpool->get(vid,true);

    if ( vm == 0 )
    {
        goto error_vm_get;
    }

    uid = vm->get_uid();

    vm->unlock();

    // -------------------------------------------------------------------------
    //                         Authorize the operation
    // -------------------------------------------------------------------------
    if ( rc != 0 ) // rc == 0 means oneadmin
    {
        AuthRequest ar(rc);

        ar.add_auth(AuthRequest::VM,vid,AuthRequest::MANAGE,uid,false);
        ar.add_auth(AuthRequest::HOST,hid,AuthRequest::USE,0,false);

        if (UserPool::authorize(ar) == -1)
        {
            goto error_authorize;
        }
    }

    // -------------------------------------------------------------------------
    //                         Get host info to deploy the VM
    // -------------------------------------------------------------------------
    host = VirtualMachineDeploy::hpool->get(hid,true);

    if ( host == 0 )
    {
        goto error_host_get;
    }

    hostname = host->get_name();
    vmm_mad  = host->get_vmm_mad();
    tm_mad   = host->get_tm_mad();

    nd.get_configuration_attribute("VM_DIR",vmdir);

    host->unlock();

    // -------------------------------------------------------------------------
    //                         Deploy the VM
    // -------------------------------------------------------------------------
    vm = VirtualMachineDeploy::vmpool->get(vid,true);

    if ( vm == 0 )
    {
        goto error_vm_get;
    }

    if ( vm->get_state() != VirtualMachine::PENDING )
    {
        goto error_state;
    }

    vm->add_history(hid,hostname,vmdir,vmm_mad,tm_mad);

    rc = VirtualMachineDeploy::vmpool->update_history(vm);

    if ( rc != 0 )
    {
        goto error_history;
    }

    vmpool->update(vm); //Insert last_seq in the DB

    dm->deploy(vm);

    vm->unlock();

    // -------------------------------------------------------------------------
    //                              Results
    // -------------------------------------------------------------------------
    arrayData.push_back(xmlrpc_c::value_boolean(true));

    arrayresult = new xmlrpc_c::value_array(arrayData);

    *retval = *arrayresult;

    delete arrayresult;

    return;

error_host_get:
    oss.str(get_error(method_name, "HOST", hid));
    goto error_common;

error_vm_get:
    oss.str(get_error(method_name, "VM", vid));
    goto error_common;

error_state:
    oss << action_error(method_name, "MANAGE", "VM", vid, -1)
        << ". Reason: VM in wrong state.";
    goto error_common_lock;

error_authenticate:
    oss.str(authenticate_error(method_name));
    goto error_common;

error_authorize:
    oss.str(authorization_error(method_name, "MANAGE", "VM", rc, vid));
    goto error_common;

error_history:
    oss.str(action_error(method_name, "INSERT HISTORY", "VM", vid, rc));
    goto error_common_lock;

error_common_lock:
    vm->unlock();

error_common:
    arrayData.push_back(xmlrpc_c::value_boolean(false));
    arrayData.push_back(xmlrpc_c::value_string(oss.str()));

    NebulaLog::log("ReM",Log::ERROR,oss);

    xmlrpc_c::value_array arrayresult_error(arrayData);

    *retval = arrayresult_error;

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
