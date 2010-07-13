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
    string              vm_template;
    
    const string        method_name = "VirtualMachineAllocate";

    int                 vid;
    int                 rc;

    Nebula&             nd = Nebula::instance();
    DispatchManager *   dm = nd.get_dm();

    ostringstream       oss;

    vector<xmlrpc_c::value> arrayData;
    xmlrpc_c::value_array * arrayresult;

    NebulaLog::log("ReM",Log::DEBUG,"VirtualMachineAllocate invoked");

    session     = xmlrpc_c::value_string(paramList.getString(0));
    vm_template = xmlrpc_c::value_string(paramList.getString(1));
    vm_template += "\n";

    //Authenticate the user
    rc = VirtualMachineAllocate::upool->authenticate(session);

    if (rc == -1)
    {
        goto error_authenticate;
    }

    rc = dm->allocate(rc,vm_template,&vid);

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
    oss.str(authenticate_error(method_name));
    goto error_common;

error_allocate:
    oss.str(action_error(method_name, "CREATE", "VM", NULL, rc));
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
