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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManager::VirtualMachinePoolInfo::execute(
    xmlrpc_c::paramList const& paramList,
    xmlrpc_c::value *   const  retval)
{
    string              session;
    string              username;
    string              password;

    int                 filter_flag;
    int                 rc;
    int                 state;

    int                 gid;
    User *              user;

    ostringstream       oss;
    ostringstream       where_string;

    /*   -- RPC specific vars --  */
    vector<xmlrpc_c::value> arrayData;
    xmlrpc_c::value_array * arrayresult;

    const string     method_name = "VirtualMachinePoolInfo";

    NebulaLog::log("ReM",Log::DEBUG,"VirtualMachinePoolInfo method invoked");

    // For backwards compatibility, 2 or 3 arguments can be present.
    switch (paramList.size())
    {
        case 2:
            state       = -1;
            break;
        case 3:
            state       = xmlrpc_c::value_int (paramList.getInt(2));
            break;
        default:
            paramList.verifyEnd(3);
            return;
    }

    // Get the parameters
    session      = xmlrpc_c::value_string(paramList.getString(0));
    filter_flag  = xmlrpc_c::value_int   (paramList.getInt(1));

    // Check if it is a valid user
    rc = VirtualMachinePoolInfo::upool->authenticate(session);

    if ( rc == -1 )
    {
        goto error_authenticate;
    }

    /** Filter flag meaning table
     *      -3 :: User's VMs
     *      -2 :: All VMs
     *      -1 :: User's VMs and all ones that belong to his groups
     *    >= 0 :: UID User's Images
     **/
    if ( filter_flag < -3 )
    {
        goto error_filter_flag;
    }

    switch(filter_flag)
    {
        case -3:
            where_string << "UID=" << rc;
            break;
        case -2:
            break;
        case -1:
            //   Get the User Group
            user = VirtualMachinePoolInfo::upool->get(rc,true);

            if ( user == 0 )
            {
                goto error_user_get;
            }

            gid = user->get_gid();
            user->unlock();

            where_string << "UID=" << rc << " OR GID=" << gid;
            break;
        default:
            where_string << "UID=" << filter_flag;
    }

    rc = VirtualMachinePoolInfo::vmpool->dump(oss, state, where_string.str());

    if ( rc != 0 )
    {
        goto error_dump;
    }

    // All nice, return the vm info to the client
    arrayData.push_back(xmlrpc_c::value_boolean(true)); // SUCCESS

    arrayData.push_back(xmlrpc_c::value_string(oss.str()));
    arrayresult = new xmlrpc_c::value_array(arrayData);
    // Copy arrayresult into retval mem space
    *retval = *arrayresult;
    // and get rid of the original
    delete arrayresult;

    return;

error_authenticate:
    oss.str(authenticate_error(method_name));  
    goto error_common;

error_filter_flag:
    oss << "Incorrect filter_flag, must be >= -3.";
    goto error_common;

error_user_get:
    oss.str(get_error(method_name, "USER", rc));
    goto error_common;

error_dump:
    oss.str(get_error(method_name, "VM", -1));
    goto error_common;

error_common:
    arrayData.push_back(xmlrpc_c::value_boolean(false)); // FAILURE
    arrayData.push_back(xmlrpc_c::value_string(oss.str()));

    NebulaLog::log("ReM",Log::ERROR,oss);

    xmlrpc_c::value_array arrayresult_error(arrayData);

    *retval = arrayresult_error;

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

