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

void RequestManager::ImageAllocate::execute(
    xmlrpc_c::paramList const& paramList,
    xmlrpc_c::value *   const  retval)
{
    string              session;
    string              str_template;
    string              error_str;
    string              user_name;

    ImageTemplate *     img_template = 0;
    User *              user;

    int                 iid;
    int                 uid;
    int                 rc;
    char *              error_msg = 0;

    ostringstream       oss;

    const string        method_name = "ImageAllocate";

    vector<xmlrpc_c::value> arrayData;
    xmlrpc_c::value_array * arrayresult;

    NebulaLog::log("ReM",Log::DEBUG,"ImageAllocate invoked");

    session      = xmlrpc_c::value_string(paramList.getString(0));
    str_template = xmlrpc_c::value_string(paramList.getString(1));
    str_template += "\n";

    //--------------------------------------------------------------------------
    //   Authorize this request
    //--------------------------------------------------------------------------
    uid = ImageAllocate::upool->authenticate(session);

    if ( uid == -1 )
    {
        goto error_authenticate;
    }

    //--------------------------------------------------------------------------
    //   Authorize this request
    //--------------------------------------------------------------------------
    img_template = new ImageTemplate;

    rc = img_template->parse(str_template,&error_msg);

    if ( rc != 0 )
    {
        goto error_parse;
    }

    if ( uid != 0 )
    {
        AuthRequest ar(uid);
        string      t64;
        string      pub;
        string      pub_name = "PUBLIC";

        img_template->get(pub_name, pub);
        transform (pub.begin(), pub.end(), pub.begin(),(int(*)(int))toupper);

        ar.add_auth(AuthRequest::IMAGE,
                    img_template->to_xml(t64),
                    AuthRequest::CREATE,
                    uid,
                    (pub == "YES"));

        if (UserPool::authorize(ar) == -1)
        {
            goto error_authorize;
        }
    }


    //--------------------------------------------------------------------------
    //   Get the User Name
    //--------------------------------------------------------------------------

    user = ImageAllocate::upool->get(uid,true);

    if ( user == 0 )
    {
        goto error_user_get;
    }

    user_name = user->get_username();

    user->unlock();

    //--------------------------------------------------------------------------
    //   Allocate the Image
    //--------------------------------------------------------------------------

    rc = ImageAllocate::ipool->allocate(uid,user_name,
                                        img_template,&iid, error_str);

    if ( rc < 0 )
    {
        goto error_allocate;

    }

    arrayData.push_back(xmlrpc_c::value_boolean(true));
    arrayData.push_back(xmlrpc_c::value_int(iid));

    // Copy arrayresult into retval mem space
    arrayresult = new xmlrpc_c::value_array(arrayData);
    *retval = *arrayresult;

    delete arrayresult; // and get rid of the original

    return;


error_user_get:
    oss.str(get_error(method_name, "USER", uid));
    goto error_common;

error_authenticate:
    oss.str(authenticate_error(method_name));
    goto error_common;

error_authorize:
    oss.str(authorization_error(method_name, "CREATE", "IMAGE", uid, -1));
    goto error_common;

error_parse:
    oss << action_error(method_name, "PARSE", "IMAGE TEMPLATE",-2,rc);
    if (error_msg != 0)
    {
        oss << ". Reason: " << error_msg;
        free(error_msg);
    }

    goto error_common;

error_allocate:
    oss << action_error(method_name, "CREATE", "IMAGE", -2, 0);
    oss << " " << error_str;
    goto error_common;

error_common:
    if( img_template != 0 )
    {
        delete img_template;
    }

    arrayData.push_back(xmlrpc_c::value_boolean(false));  // FAILURE
    arrayData.push_back(xmlrpc_c::value_string(oss.str()));

    NebulaLog::log("ReM",Log::ERROR,oss);

    xmlrpc_c::value_array arrayresult_error(arrayData);

    *retval = arrayresult_error;

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
