/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

#include "RequestManagerLock.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void RequestManagerLock::request_execute(xmlrpc_c::paramList const& paramList,
                                         RequestAttributes& att)
{
    int oid   = xmlrpc_c::value_int(paramList.getInt(1));
    int level = xmlrpc_c::value_int(paramList.getInt(2));
    int owner = att.uid;

    PoolObjectSQL * object;
    string          error_str;
    int             rc;

    if ( basic_authorization(oid, att) == false )
    {
        return;
    }

    object = pool->get(oid);

    if ( object == 0 )
    {
        att.resp_id = oid;
        failure_response(NO_EXISTS, att);
        return;
    }

    if ((auth_object & PoolObjectSQL::LockableObject) != 0)
    {
        rc = lock_db(object, owner, att.req_id, level);

        pool->update(object);

        object->unlock();

        if (rc != 0)
        {
            att.resp_msg = "Error trying to lock the resource.";
            failure_response(ACTION, att);
        }
        else
        {
            success_response(oid, att);
        }
    }
    else
    {
        object->unlock();

        failure_response(AUTHORIZATION, att);
    }

    return;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void RequestManagerUnlock::request_execute(xmlrpc_c::paramList const& paramList,
                                         RequestAttributes& att)
{
    int     oid     = xmlrpc_c::value_int(paramList.getInt(1));

    PoolObjectSQL * object;
    string          error_str;

    int owner  = att.uid;
    int req_id = att.req_id;

    if ( basic_authorization(oid, att) == false )
    {
        return;
    }

    object = pool->get(oid);

    if ( object == 0 )
    {
        att.resp_id = oid;
        failure_response(NO_EXISTS, att);
        return;
    }

    if ( att.is_admin() ) //admins can unlock even if nor owners of lock
    {
        owner = -1;
    }

    if ( unlock_db(object, owner, req_id) == -1 )
    {
        att.resp_msg = "Cannot unlock: Lock is owned by another user";
        failure_response(ACTION, att);

        object->unlock();
        return;
    }

    pool->update(object);

    object->unlock();

    success_response(oid, att);

    return;
}
