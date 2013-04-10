/* -------------------------------------------------------------------------- */
/* Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#include "RequestManagerRename.h"
#include "PoolObjectSQL.h"

#include "NebulaLog.h"
#include "Nebula.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManagerRename::request_execute(xmlrpc_c::paramList const& paramList,
                                          RequestAttributes& att)
{
    int     oid      = xmlrpc_c::value_int(paramList.getInt(1));
    string  new_name = xmlrpc_c::value_string(paramList.getString(2));

    int    rc;
    string old_name;
    string error_str;

    PoolObjectAuth  operms;
    PoolObjectSQL * object;

    rc = get_info(pool, oid, auth_object, att, operms, old_name);

    if ( rc == -1 )
    {
        return;
    }

    if (old_name == new_name)
    {
        success_response(oid, att);
        return;
    }

    // ------------- Set authorization request for non-oneadmin's --------------

    if ( att.uid != 0 )
    {
        AuthRequest ar(att.uid, att.gid);

        ar.add_auth(auth_op, operms); // MANAGE OBJECT

        if (UserPool::authorize(ar) == -1)
        {
            failure_response(AUTHORIZATION,
                             authorization_error(ar.message, att),
                             att);

            return;
        }
    }

    // --------------- Check name uniqueness -----------------------------------

    object = get(new_name, operms.uid, true);

    if ( object != 0 )
    {
        ostringstream oss;
        int id = object->get_oid();

        object->unlock();

        oss << PoolObjectSQL::type_to_str(auth_object)
            << " cannot be renamed to " << new_name
            << " because it collides with "
            << PoolObjectSQL::type_to_str(auth_object) << " "
            << id;

        failure_response(ACTION, request_error(oss.str(), ""), att);
        return;
    }

    // --------------- Update the object ---------------------------------------

    object = pool->get(oid, true);

    if ( object == 0 )
    {
        failure_response(NO_EXISTS,
                         get_error(object_name(auth_object), oid),
                         att);
    }

    if ( object->set_name(new_name, error_str) != 0 )
    {
        object->unlock();

        failure_response(ACTION, request_error(error_str, ""), att);
        return;
    }

    pool->update(object);

    object->unlock();

    pool->update_cache_index(old_name, operms.uid, new_name, operms.uid);

    success_response(oid, att);

    return;
}

