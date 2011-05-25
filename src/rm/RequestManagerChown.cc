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

void RequestManager::GenericChown::execute(
    xmlrpc_c::paramList const& paramList,
    xmlrpc_c::value *   const  retval)
{
    string              session;

    int                 uid, obj_owner, group_owner;
    int                 oid, ownid, gid;
    int                 rc;

    PoolObjectSQL *     obj     = 0;
    User *              user    = 0;
    Group *             group   = 0;

    vector<xmlrpc_c::value> arrayData;
    xmlrpc_c::value_array * arrayresult;

    ostringstream       oss;

    PoolSQL *   pool = rm->get_pool(ob);
    string      method_name = rm->get_method_prefix(ob) + "Chown";
    string      obj_name = rm->get_object_name(ob);


    oss << method_name << " invoked";

    NebulaLog::log("ReM",Log::DEBUG,oss);
    oss.str("");

    session      = xmlrpc_c::value_string (paramList.getString(0));
    oid          = xmlrpc_c::value_int    (paramList.getInt(1));
    ownid        = xmlrpc_c::value_int    (paramList.getInt(2));
    gid          = xmlrpc_c::value_int    (paramList.getInt(3));

    // First, we need to authenticate the user
    uid = rm->upool->authenticate(session);

    if ( uid == -1 )
    {
        goto error_authenticate;
    }

    // Get object from the pool
    obj = pool->get(oid,true);

    if ( obj == 0 )
    {
        goto error_get;
    }

    obj_owner = obj->get_uid();

    obj->unlock();
    obj = 0;

    // Get destination group
    if( gid > -1 )
    {
        group = rm->gpool->get(gid, true);
        if( group == 0 )
        {
            goto error_group_get;
        }

        group_owner = group->get_uid();

        group->unlock();
        group = 0;
    }


    if ( uid != 0 ) // uid == 0 means oneadmin
    {
        AuthRequest ar(uid);

        ar.add_auth(ob,                         // Object
                    oid,                        // Object id
                    AuthRequest::MANAGE,        // Action
                    obj_owner,                  // Owner
                    false);                     // Public

        if( ownid > -1 )
        {
            ar.add_auth(AuthRequest::USER,      // Object
                        ownid,                  // Object id
                        AuthRequest::MANAGE,    // Action
                        ownid,                  // Owner
                        false);                 // Public
        }

        if( gid > -1 )
        {
            ar.add_auth(AuthRequest::GROUP,     // Object
                        gid,                    // Object id
                        AuthRequest::MANAGE,    // Action
                        group_owner,            // Owner
                        false);                 // Public
        }

        if (UserPool::authorize(ar) == -1)
        {
            goto error_authorize;
        }
    }

    // Check destination user exists
    if( ownid > -1 )
    {
        user = rm->upool->get(ownid, true);
        if( user == 0 )
        {
            goto error_user_get;
        }

        user->unlock();
    }

    // Get the object locked again
    obj = pool->get(oid,true);

    if ( obj == 0 )
    {
        goto error_get;
    }

    if( ownid > -1 )
    {
        rc = obj->set_uid(ownid);

        if( rc != 0 )
        {
            goto error_set_uid;
        }
    }
    if( gid > -1 )
    {
        rc = obj->set_gid(gid);

        if( rc != 0 )
        {
            goto error_set_gid;
        }
    }

    pool->update(obj);

    obj->unlock();

    arrayData.push_back(xmlrpc_c::value_boolean(true));

    // Copy arrayresult into retval mem space
    arrayresult = new xmlrpc_c::value_array(arrayData);
    *retval = *arrayresult;

    delete arrayresult; // and get rid of the original

    return;

error_authenticate:
    oss.str(authenticate_error(method_name));
    goto error_common;

error_get:
    oss.str(get_error(method_name, obj_name, oid));
    goto error_common;

error_authorize:
    // TODO: get real error from UserPool::authorize
    oss.str(authorization_error(method_name, "MANAGE", obj_name, uid, oid));
    goto error_common;

error_user_get:
    oss.str(get_error(method_name,
                      rm->get_object_name(AuthRequest::USER),
                      ownid));

    goto error_common;

error_group_get:
    oss.str(get_error(method_name,
                      rm->get_object_name(AuthRequest::GROUP),
                      gid));

    goto error_common;

error_set_uid:
    oss.str(action_error(method_name, "SET_UID", obj_name, oid, rc));

    goto error_common;

error_set_gid:
    oss.str(action_error(method_name, "SET_GID", obj_name, oid, rc));

    if( ownid > -1 )   // restore owner user
    {
        obj->set_uid(obj_owner);
    }

    goto error_common;

error_common:
    if( obj != 0 )
    {
        obj->unlock();
    }

    if( group != 0 )
    {
        group->unlock();
    }

    if( user != 0 )
    {
        user->unlock();
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
