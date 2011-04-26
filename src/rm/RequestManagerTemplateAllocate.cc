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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManager::TemplateAllocate::execute(
    xmlrpc_c::paramList const& paramList,
    xmlrpc_c::value *   const  retval)
{
    string              session;
    string              str_template;
    string              error_str;
    string              user_name;

    const string        method_name = "TemplateAllocate";

    int                 oid, uid;
    int                 rc;

    ostringstream       oss;

    vector<xmlrpc_c::value> arrayData;
    xmlrpc_c::value_array * arrayresult;

    VirtualMachineTemplate * template_contents;
    User *                   user;
    char *                   error_msg = 0;


    NebulaLog::log("ReM",Log::DEBUG,"TemplateAllocate invoked");

    session      = xmlrpc_c::value_string(paramList.getString(0));
    str_template = xmlrpc_c::value_string(paramList.getString(1));
    str_template += "\n";

    //--------------------------------------------------------------------------
    //   Authenticate the user
    //--------------------------------------------------------------------------
    uid = TemplateAllocate::upool->authenticate(session);

    if (uid == -1)
    {
        goto error_authenticate;
    }

    //--------------------------------------------------------------------------
    //   Check the template syntax
    //--------------------------------------------------------------------------
    template_contents = new VirtualMachineTemplate;

    rc = template_contents->parse(str_template,&error_msg);

    if ( rc != 0 )
    {
        goto error_parse;
    }

    //--------------------------------------------------------------------------
    //   Authorize this request
    //--------------------------------------------------------------------------
    if ( uid != 0 )
    {
        AuthRequest ar(uid);
        string      t64;

        ar.add_auth(AuthRequest::TEMPLATE,
                    template_contents->to_xml(t64),
                    AuthRequest::CREATE,
                    uid,
                    false);

        if (UserPool::authorize(ar) == -1)
        {
            goto error_authorize;
        }
    }

    //--------------------------------------------------------------------------
    //   Get the User Name
    //--------------------------------------------------------------------------

    user = TemplateAllocate::upool->get(uid,true);

    if ( user == 0 )
    {
        goto error_user_get;
    }

    user_name = user->get_name();

    user->unlock();

    //--------------------------------------------------------------------------
    //   Allocate the VMTemplate
    //--------------------------------------------------------------------------
    rc = TemplateAllocate::tpool->allocate(uid,
                                           user_name,
                                           template_contents,
                                           &oid,
                                           error_str);

    if ( rc < 0 )
    {
        goto error_allocate;
    }

    arrayData.push_back(xmlrpc_c::value_boolean(true));
    arrayData.push_back(xmlrpc_c::value_int(oid));

    // Copy arrayresult into retval mem space
    arrayresult = new xmlrpc_c::value_array(arrayData);
    *retval = *arrayresult;

    delete arrayresult; // and get rid of the original

    return;


error_user_get:
    oss.str(get_error(method_name, "USER", uid));

    delete template_contents;
    goto error_common;

error_authenticate:
    oss.str(authenticate_error(method_name));
    goto error_common;

error_authorize:
    oss.str(authorization_error(method_name, "CREATE", "TEMPLATE", uid, -1));
    delete template_contents;
    goto error_common;

error_parse:
    oss << action_error(method_name, "PARSE", "VM TEMPLATE",-2,rc);
    if (error_msg != 0)
    {
        oss << ". Reason: " << error_msg;
        free(error_msg);
    }

    delete template_contents;
    goto error_common;

error_allocate:
    oss << action_error(method_name, "CREATE", "TEMPLATE", -2, 0);
    oss << " " << error_str;
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
