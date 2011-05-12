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

void RequestManager::TemplateDelete::execute(
    xmlrpc_c::paramList const& paramList,
    xmlrpc_c::value *   const  retval)
{
    string              session;

    int                 oid;
    int                 uid;
    int                 rc;

    int                 owner;
    bool                is_public;

    VMTemplate *        vm_template;

    ostringstream       oss;

    const string        method_name = "TemplateDelete";

    vector<xmlrpc_c::value> arrayData;
    xmlrpc_c::value_array * arrayresult;


    NebulaLog::log("ReM",Log::DEBUG,"TemplateDelete invoked");

    session  = xmlrpc_c::value_string(paramList.getString(0));
    oid      = xmlrpc_c::value_int   (paramList.getInt(1));


    // First, we need to authenticate the user
    uid = TemplateDelete::upool->authenticate(session);

    if ( uid == -1 )
    {
        goto error_authenticate;
    }

    // Get template from the pool
    vm_template = TemplateDelete::tpool->get(oid,true);

    if ( vm_template == 0 )
    {
        goto error_get;
    }

    owner       = vm_template->get_uid();
    is_public   = vm_template->isPublic();

    vm_template->unlock();

    //Authorize the operation
    if ( uid != 0 ) // uid == 0 means oneadmin
    {
        AuthRequest ar(uid);

        ar.add_auth(AuthRequest::TEMPLATE,
                    oid,
                    AuthRequest::DELETE,
                    owner,
                    is_public);

        if (UserPool::authorize(ar) == -1)
        {
            goto error_authorize;
        }
    }

    // Get template from the pool
    vm_template = TemplateDelete::tpool->get(oid,true);

    if ( vm_template == 0 )
    {
        goto error_get;
    }

    rc = TemplateDelete::tpool->drop(vm_template);

    vm_template->unlock();

    if ( rc < 0 )
    {
        goto error_delete;
    }

    arrayData.push_back(xmlrpc_c::value_boolean(true));
    arrayData.push_back(xmlrpc_c::value_int(oid));

    // Copy arrayresult into retval mem space
    arrayresult = new xmlrpc_c::value_array(arrayData);
    *retval = *arrayresult;

    delete arrayresult; // and get rid of the original

    return;

error_authenticate:
    oss.str(authenticate_error(method_name));
    goto error_common;

error_get:
    oss.str(get_error(method_name, "TEMPLATE", oid));
    goto error_common;

error_authorize:
    oss.str(authorization_error(method_name, "DELETE", "TEMPLATE", uid, oid));
    goto error_common;

error_delete:
    oss.str(action_error(method_name, "DELETE", "TEMPLATE", oid, rc));
    vm_template->unlock();
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
