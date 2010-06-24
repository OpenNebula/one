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

void RequestManager::ImageEnable::execute(
    xmlrpc_c::paramList const& paramList,
    xmlrpc_c::value *   const  retval)
{
    string              session;

    int                 iid;
    bool                enable_flag; 
    int                 uid;
    int                 rc;
    
    Image             * image;

    ostringstream       oss;

    vector<xmlrpc_c::value> arrayData;
    xmlrpc_c::value_array * arrayresult;


    NebulaLog::log("ReM",Log::DEBUG,"ImageEnable invoked");

    session     = xmlrpc_c::value_string (paramList.getString(0));
    iid         = xmlrpc_c::value_int    (paramList.getInt(1));
    enable_flag = xmlrpc_c::value_boolean(paramList.getBoolean(1));

    // First, we need to authenticate the user
    rc = ImageEnable::upool->authenticate(session);

    if ( rc == -1 )
    {
        goto error_authenticate;
    }
    
    uid = rc;
    
    // Get image from the ImagePool
    image = ImageEnable::ipool->get(iid,true);    
                                                 
    if ( image == 0 )                             
    {                                            
        goto error_image_get;                     
    }
    
    if ( uid != 0 && uid != image->get_uid() )
    {
        goto error_authorization;
    }

    rc = image->enable(enable_flag);

    if ( rc < 0 )
    {
        goto error_remove_attribute;

    }
    
    image->unlock();

    arrayData.push_back(xmlrpc_c::value_boolean(true));
    arrayData.push_back(xmlrpc_c::value_int(iid));

    // Copy arrayresult into retval mem space
    arrayresult = new xmlrpc_c::value_array(arrayData);
    *retval = *arrayresult;

    delete arrayresult; // and get rid of the original

    return;

error_authenticate:
    oss << "[ImageEnable] User not authenticated, aborting call.";
    goto error_common;
    
error_image_get:
    oss << "[ImageEnable] Error getting image with ID = " << iid; 
    goto error_common;
    
error_authorization:
    oss << "[ImageEnable] User not authorized to enable/disable image" << 
           " attributes, aborting call.";
    goto error_common;
    
error_remove_attribute:
    oss << "[ImageEnable] Cannot enable/disable image [" << iid << "]";
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
