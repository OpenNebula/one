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

void RequestManager::GenericAddDelGroup::execute(
    xmlrpc_c::paramList const& paramList,
    xmlrpc_c::value *   const  retval)
{
    string      session;

    int         object_id, object_owner;
    int         group_id,  group_owner;
    int         uid, rc;

    PoolSQL *   object_pool = rm->get_pool(object_type);
    PoolSQL *   group_pool  = rm->get_pool(group_type);
    string      method_name = rm->get_method_prefix(object_type) + "Add";

    PoolObjectSQL *     object = 0;
    PoolObjectSQL *     group  = 0;

    ostringstream       oss;

    /*   -- RPC specific vars --  */
    vector<xmlrpc_c::value> arrayData;
    xmlrpc_c::value_array * arrayresult;

    oss << method_name << " invoked";

    NebulaLog::log("ReM",Log::DEBUG,oss);
    oss.str("");

    // Get the parameters
    session     = xmlrpc_c::value_string(paramList.getString(0));
    object_id   = xmlrpc_c::value_int   (paramList.getInt(1));
    group_id    = xmlrpc_c::value_int   (paramList.getInt(2));

    // Authenticate the user
    uid = rm->upool->authenticate(session);

    if ( uid == -1 )
    {
        goto error_authenticate;
    }

    // Get object owner
    object = object_pool->get(object_id,true);

    if ( object == 0 )
    {
        goto error_get_object;
    }

    object_owner = object->get_uid();

    object->unlock();
    object = 0;

    // Get group owner
    group = group_pool->get(group_id,true);

    if ( group == 0 )
    {
        goto error_get_group;
    }

    group_owner = group->get_uid();

    group->unlock();
    group = 0;

    // Authorize the operation
    if ( uid != 0 ) // rc == 0 means oneadmin
    {
        AuthRequest ar(uid);

        ar.add_auth(object_type, object_id, AuthRequest::MANAGE, 0, false);
        ar.add_auth(group_type,  group_id,  AuthRequest::MANAGE, 0, false);

        if (UserPool::authorize(ar) == -1)
        {
            goto error_authorize;
        }
    }

    // Add the object_id to the group and, if the object keeps a list of the
    // groups it belongs to, the group_id to it.
    rc = rm->add_object_group(object_type,group_type, object_id, group_id, oss);

    if( rc != 0 )
    {
        goto error_add_object_group;
    }

    // All nice, return success to the client
    arrayData.push_back(xmlrpc_c::value_boolean(true)); // SUCCESS

    // Copy arrayresult into retval mem space
    arrayresult = new xmlrpc_c::value_array(arrayData);
    *retval = *arrayresult;

    delete arrayresult; // and get rid of the original

    return;

error_authenticate:
    oss.str(authenticate_error(method_name));
    goto error_common;

error_get_object:
    oss.str(get_error(method_name, object_type, object_id));
    goto error_common;

error_get_group:
    oss.str(get_error(method_name, group_type, group_id));
    goto error_common;

error_authorize:
    // TODO: get real error from UserPool::authorize
    oss.str(authorization_error(method_name, "MANAGE", object_type, uid, object_id));
    goto error_common;

error_add_object_group:

error_common:
    if( object != 0 )
    {
        object->unlock();
    }

    if( group != 0 )
    {
        group->unlock();
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
