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

void RequestManager::VirtualMachineMigrate::execute(
    xmlrpc_c::paramList const& paramList,
    xmlrpc_c::value *   const  retval)
{
    string              session;
    int                 vid;
    int                 hid;
    int                 uid;
    int                 rc;
    bool                live;

    string              hostname;
    string              vmm_mad;
    string              tm_mad;
    string              vmdir;

    VirtualMachine *    vm;
    Host *              host;

    Nebula&             nd = Nebula::instance();
    DispatchManager *   dm = nd.get_dm();

    vector<xmlrpc_c::value> arrayData;
    xmlrpc_c::value_array * arrayresult;

    ostringstream       oss;
    
    const string     method_name = "VirtualMachineMigrate";

    NebulaLog::log("ReM",Log::DEBUG,"VirtualMachineMigrate invoked");

    //Parse Arguments
    session = xmlrpc_c::value_string(paramList.getString(0));
    vid     = xmlrpc_c::value_int(paramList.getInt(1));
    hid     = xmlrpc_c::value_int(paramList.getInt(2));
    live    = xmlrpc_c::value_boolean(paramList.getBoolean(3));

    //Get host info to migrate the VM
    host = VirtualMachineMigrate::hpool->get(hid,true);

    if ( host == 0 )
    {
        goto error_host_get;
    }

    hostname = host->get_name();
    vmm_mad  = host->get_vmm_mad();
    tm_mad   = host->get_tm_mad();

    nd.get_configuration_attribute("VM_DIR",vmdir);

    host->unlock();

    //Get the VM and migrate it
    vm = VirtualMachineMigrate::vmpool->get(vid,true);

    if ( vm == 0 )
    {
        goto error_vm_get;
    }

    uid = vm->get_uid();

    // Only oneadmin or the VM owner can perform operations upon the VM
    rc = VirtualMachineMigrate::upool->authenticate(session);

    if ( rc == -1)
    {
        goto error_authenticate;
    }

    //Authorize the operation
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

    if((vm->get_state()     != VirtualMachine::ACTIVE)  ||
       (vm->get_lcm_state() != VirtualMachine::RUNNING) ||
       (vm->hasPreviousHistory() && vm->get_previous_reason() == History::NONE))
    {
        goto error_state;
    }

    vm->add_history(hid,hostname,vmdir,vmm_mad,tm_mad);

    rc = VirtualMachineMigrate::vmpool->update_history(vm);

    if ( rc != 0 )
    {
        goto error_history;
    }

    vmpool->update(vm); //Insert last_seq in the DB

    if ( live == true )
    {
        dm->live_migrate(vm);
    }
    else
    {
        dm->migrate(vm);
    }

    vm->unlock();

    // Send results to client
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

error_authenticate:
    oss.str(authenticate_error(method_name));  
    goto error_common_lock;

error_authorize:
    oss.str(authorization_error(method_name, "MANAGE", "VM", uid, vid));
    goto error_common_lock;

error_history:
    oss.str(action_error(method_name, "INSERT HISTORY", "VM", vid, rc));
    goto error_common_lock;

error_state:
    oss << action_error(method_name, "MANAGE", "VM", vid, rc) 
        << ". Reason: VM in wrong state.";
    goto error_common_lock;

error_common_lock:
    vm->unlock();

error_common:
    arrayData.push_back(xmlrpc_c::value_boolean(false));
    arrayData.push_back(xmlrpc_c::value_string(oss.str()));

    xmlrpc_c::value_array arrayresult_error(arrayData);

    *retval = arrayresult_error;

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
