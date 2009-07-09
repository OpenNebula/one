/* -------------------------------------------------------------------------- */
/* Copyright 2002-2009, Distributed Systems Architecture Group, Universidad   */
/* Complutense de Madrid (dsa-research.org)                                   */
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
           
    VirtualMachine *    vm;
    Host *              host;
    
    Nebula&             nd = Nebula::instance();
    DispatchManager *   dm = nd.get_dm();

    vector<xmlrpc_c::value> arrayData;
    xmlrpc_c::value_array * arrayresult;
    
    ostringstream       oss;
        
    Nebula::log("ReM",Log::DEBUG,"VirtualMachineDeploy invoked");
    
    //Parse Arguments
    
    session = xmlrpc_c::value_string(paramList.getString(0));
    vid     = xmlrpc_c::value_int(paramList.getInt(1));
    hid     = xmlrpc_c::value_int(paramList.getInt(2));
    
    //We also need the hsid
    
    //Get host info to deploy the VM
    
    host = VirtualMachineDeploy::hpool->get(hid,true);
    
    if ( host == 0 )
    {
        goto error_host_get;
    }
    
    hostname = host->get_hostname();
    vmm_mad  = host->get_vmm_mad();
    tm_mad   = host->get_tm_mad();
    
    nd.get_configuration_attribute("VM_DIR",vmdir);

    host->unlock();
    
    //Get the VM
        
    vm = VirtualMachineDeploy::vmpool->get(vid,true);
    
    if ( vm == 0 )
    {
        goto error_vm_get;
    }

    uid = vm->get_uid();
    
    // Only oneadmin or the VM owner can perform operations upon the VM
    rc = VirtualMachineDeploy::upool->authenticate(session);
    
    if ( rc != 0 && rc != uid)                             
    {                                            
        goto error_authenticate;                     
    }

    if ( vm->get_state() != VirtualMachine::PENDING )
    {
        goto error_state;
    }
    
    //Update host info and share usage (cpu,mem....)
    
    vm->add_history(hid,hostname,vmdir,vmm_mad,tm_mad);
    
    rc = VirtualMachineDeploy::vmpool->update_history(vm);

    if ( rc != 0 )
    {
        goto error_history;
    }
    
    //Deploy the VM
    
    dm->deploy(vm);
        
    vm->unlock();
    
    // Send results to client
    
    arrayData.push_back(xmlrpc_c::value_boolean(true));
    
    arrayresult = new xmlrpc_c::value_array(arrayData);
    
    *retval = *arrayresult;
    
    delete arrayresult;
     
    return;

error_authenticate:
    vm->unlock();
    oss << "User not authorized to perform the deploy";
    goto error_common;

error_host_get:
    oss << "The host " << hid << " does not exists";
    goto error_common;
    
error_vm_get:
    oss << "The virtual machine " << vid << " does not exists";
    goto error_common;

error_history:
	vm->unlock();
	
    oss << "Can not deploy VM " << vid << ", can not insert history";
    goto error_common;

error_state:
	vm->unlock();
	
    oss << "Can not deploy VM " << vid << ", wrong state";
    goto error_common;

error_common:

    arrayData.push_back(xmlrpc_c::value_boolean(false));
    arrayData.push_back(xmlrpc_c::value_string(oss.str()));
    
    xmlrpc_c::value_array arrayresult_error(arrayData);

    *retval = arrayresult_error;
    
    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

