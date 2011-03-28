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
#include "Nebula.h"

#include "AuthManager.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManager::ImagePublish::execute(
    xmlrpc_c::paramList const& paramList,
    xmlrpc_c::value *   const  retval)
{
    string              session;

    int                 iid;
    bool                publish_flag;
    int                 uid;

    int                 image_owner;
    bool                is_public;

    Image             * image;

    bool                response;

    ostringstream       oss;

    const string        method_name = "ImagePublish";

    vector<xmlrpc_c::value> arrayData;
    xmlrpc_c::value_array * arrayresult;


    NebulaLog::log("ReM",Log::DEBUG,"ImagePublish invoked");

    session      = xmlrpc_c::value_string (paramList.getString(0));
    iid          = xmlrpc_c::value_int    (paramList.getInt(1));
    publish_flag = xmlrpc_c::value_boolean(paramList.getBoolean(2));

    // First, we need to authenticate the user
    uid = ImagePublish::upool->authenticate(session);

    if ( uid == -1 )
    {
        goto error_authenticate;
    }

    // Get image from the ImagePool
    image = ImagePublish::ipool->get(iid,true);

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
                    AuthRequest::MANAGE,
                    image_owner,
                    is_public);

        if (UserPool::authorize(ar) == -1)
        {
            goto error_authorize;
        }
    }

    // Get the image locked again
    image = ImagePublish::ipool->get(iid,true);

    if ( image == 0 )
    {
        goto error_image_get;
    }

    response = image->publish(publish_flag);

    if (!response)
    {
        image->unlock();

        goto error_publish;
    }

    ImagePublish::ipool->update(image);

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
    oss.str(authorization_error(method_name, "MANAGE", "IMAGE", uid, iid));
    goto error_common;

error_publish:
    oss<< action_error(method_name, "MANAGE", "IMAGE", iid, 0)
       <<". Is the image persistent? An Image cannot be public and persistent.";
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
