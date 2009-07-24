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

void RequestManager::VirtualMachineInfo::execute(
    xmlrpc_c::paramList const& paramList,
    xmlrpc_c::value *   const  retval)
{ 
    string              session;

    // <vid> of the vid to retrieve the information for
    int                 vid;   
    
    VirtualMachine *    vm;
    
    ostringstream       oss;

    /*   -- RPC specific vars --  */
    vector<xmlrpc_c::value> arrayData;
    xmlrpc_c::value_array * arrayresult;

    Nebula::log("ReM",Log::DEBUG,"VirtualMachineInfo method invoked");

    // Get the parameters
        //TODO the session id to validate with the SessionManager
    session      = xmlrpc_c::value_string(paramList.getString(0));
    vid          = xmlrpc_c::value_int   (paramList.getInt(1));

    // Perform the allocation in the vmpool 
    vm = VirtualMachineInfo::vmpool->get(vid,true);
       
                                                 
    if ( vm == 0 )                             
    {                                            
        goto error_vm_get;                     
    }
    
    // All nice, return the vm info to the client  
    arrayData.push_back(xmlrpc_c::value_boolean(true)); // SUCCESS
    oss.str("");
    oss << *vm;
    
    vm->unlock();
    
    arrayData.push_back(xmlrpc_c::value_string(oss.str()));
    arrayresult = new xmlrpc_c::value_array(arrayData);
    // Copy arrayresult into retval mem space
    *retval = *arrayresult;
    // and get rid of the original
    delete arrayresult;

    return;

error_vm_get:
    oss << "Error getting vm with VID = " << vid; 
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
