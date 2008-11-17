/* -------------------------------------------------------------------------- */
/* Copyright 2002-2008, Distributed Systems Architecture Group, Universidad   */
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

void RequestManager::VirtualMachineAllocate::execute(
    xmlrpc_c::paramList const& paramList,
    xmlrpc_c::value *   const  retval)
{
    string              session;
    string              vm_template;
    int                 vid;
    int                 rc;
    
    Nebula&             nd = Nebula::instance();
    DispatchManager *   dm = nd.get_dm();

    vector<xmlrpc_c::value> arrayData;
        
    Nebula::log("ReM",Log::DEBUG,"VirtualMachineAllocate invoked");
        
    session     = xmlrpc_c::value_string(paramList.getString(0));
    vm_template = xmlrpc_c::value_string(paramList.getString(1));
    vm_template += "\n";
    
    rc = dm->allocate(0,vm_template,&vid);
    
    if ( rc != 0 )
    {
        ostringstream  oss;
        
        if (rc == -1)
        {
            oss << "Error inserting VM in the database, check oned.log";
        }
        else
        {
            oss << "Error parsing VM template";   
        }
                
        arrayData.push_back(xmlrpc_c::value_boolean(false));
        arrayData.push_back(xmlrpc_c::value_string(oss.str()));

    }
    else
    {
        arrayData.push_back(xmlrpc_c::value_boolean(true));
        arrayData.push_back(xmlrpc_c::value_int(vid));
    }

    xmlrpc_c::value_array arrayresult(arrayData);
    
    *retval = arrayresult;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
