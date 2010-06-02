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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManager::ImagePoolInfo::execute(
    xmlrpc_c::paramList const& paramList,
    xmlrpc_c::value *   const  retval)
{ 
    string        session;

    ostringstream oss;
    ostringstream where_string;

    int           rc;
    int           uid;
    int           filter_flag;

    /*   -- RPC specific vars --  */
    vector<xmlrpc_c::value> arrayData;
    xmlrpc_c::value_array * arrayresult;

    NebulaLog::log("ReM",Log::DEBUG,"ImagePoolInfo method invoked");

    // Get the parameters
    session     = xmlrpc_c::value_string(paramList.getString(0));
    filter_flag = xmlrpc_c::value_int(paramList.getInt(1));

    // Check if it is a valid user
    rc = ImagePoolInfo::upool->authenticate(session);

    if ( rc == -1 )
    {
        goto error_authenticate;
    }

    uid = rc;
    
    where_string.str("");
    
    /** Filter flag meaning table
     *     -3 :: All Images (just for oneadmin)
     *     -2  :: User's Images AND public images
     *     -1  :: User's Images exclusively
     *    >=0  :: UID User's Images (just for oneadmin)
     **/ 
    if ( filter_flag < -3 )
    {
        goto error_filter_flag;
    } 
     
    switch(filter_flag)
    {
        case -3:
            if ( uid != 0 )
            {
                goto error_authorization;
            }
            break;
        case -2:
            where_string << "UID=" << uid << " OR oid IN ( SELECT oid " << 
                            "FROM " << 
                            ImagePoolInfo::ipool->get_template_table_name()  <<
                            " WHERE name = 'PUBLIC' AND value = 'Yes')";
            break;
        case -1:
            where_string << "UID=" << uid;
            break;
        default:
            where_string << "UID=" << filter_flag;              
    } 

    // Perform the allocation in the vmpool 
    rc = ImagePoolInfo::ipool->dump(oss,where_string.str());
      
    if ( rc != 0 )
    {                                            
        goto error_dump;
    }
    
    //All nice, return the host info to the client  
    arrayData.push_back(xmlrpc_c::value_boolean(true)); // SUCCESS   
    arrayData.push_back(xmlrpc_c::value_string(oss.str()));

    arrayresult = new xmlrpc_c::value_array(arrayData);

    // Copy arrayresult into retval mem space
    *retval = *arrayresult;

    // and get rid of the original
    delete arrayresult;

    return;

error_authenticate:
    oss << "User not authenticated, ImagePoolInfo call aborted.";
    goto error_common;

error_authorization:
    oss << "User not authorized to perform this operation.";
    goto error_common;
    
error_filter_flag:
    oss << "Incorrect filter_flag, must be >= 3.";
    goto error_common;

error_dump:
    oss << "Error getting virtual network pool"; 
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
