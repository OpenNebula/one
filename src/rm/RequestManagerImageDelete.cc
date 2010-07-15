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

#include "AuthManager.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManager::ImageDelete::execute(
    xmlrpc_c::paramList const& paramList,
    xmlrpc_c::value *   const  retval)
{
    string              session;

    int                 iid;
    int                 uid;
    int                 rc;
    
    int                 image_owner;
    bool                is_public;

    Image             * image;

    ostringstream       oss;
    
    const string        method_name = "ImageDelete";

    vector<xmlrpc_c::value> arrayData;
    xmlrpc_c::value_array * arrayresult;


    NebulaLog::log("ReM",Log::DEBUG,"ImageDelete invoked");

    session  = xmlrpc_c::value_string(paramList.getString(0));
    iid      = xmlrpc_c::value_int   (paramList.getInt(1));


    // First, we need to authenticate the user
    uid = ImageDelete::upool->authenticate(session);

    if ( uid == -1 )
    {
        goto error_authenticate;
    }
    
    // Get image from the ImagePool
    image = ImageDelete::ipool->get(iid,true);

    if ( image == 0 )
    {
        goto error_image_get;
    }
    
    image_owner = image->get_uid();
    is_public   = image->isPublic();
    
    image->unlock();
    
    //Authorize the operation
    if ( uid != 0 ) // uid == 0 means oneadmin
    {
        AuthRequest ar(uid);

        ar.add_auth(AuthRequest::IMAGE,
                    iid,
                    AuthRequest::DELETE,
                    image_owner,
                    is_public);

        if (UserPool::authorize(ar) == -1)
        {
            goto error_authorize;
        }
    }

    // Get image from the ImagePool
    image = ImageDelete::ipool->get(iid,true);

    if ( image == 0 )
    {
        goto error_image_get;
    }

    rc = ImageDelete::ipool->drop(image);

    if ( rc < 0 )
    {
        goto error_delete;

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
    oss.str(authenticate_error(method_name));
    goto error_common;

error_image_get:
    oss.str(get_error(method_name, "IMAGE", iid));
    goto error_common;

error_authorize:
    oss.str(authorization_error(method_name, "DELETE", "IMAGE", uid, iid));
    goto error_common;

error_delete:
    oss << action_error(method_name, "DELETE", "IMAGE", iid, rc)
        << ". Reason: VMs might be running on it.";
    image->unlock();
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
