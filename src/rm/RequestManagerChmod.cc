/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#include "RequestManagerChmod.h"

#include "NebulaLog.h"
#include "Nebula.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManagerChmod::request_execute(xmlrpc_c::paramList const& paramList,
                                          RequestAttributes& att)
{
    int oid     = xmlrpc_c::value_int(paramList.getInt(1));

    int owner_u = xmlrpc_c::value_int(paramList.getInt(2));
    int owner_m = xmlrpc_c::value_int(paramList.getInt(3));
    int owner_a = xmlrpc_c::value_int(paramList.getInt(4));

    int group_u = xmlrpc_c::value_int(paramList.getInt(5));
    int group_m = xmlrpc_c::value_int(paramList.getInt(6));
    int group_a = xmlrpc_c::value_int(paramList.getInt(7));

    int other_u = xmlrpc_c::value_int(paramList.getInt(8));
    int other_m = xmlrpc_c::value_int(paramList.getInt(9));
    int other_a = xmlrpc_c::value_int(paramList.getInt(10));

    PoolObjectSQL * object;
    string          error_str;

    if ( att.uid != 0 && att.gid != 0)
    {
        AuthRequest::Operation op = AuthRequest::MANAGE;
        PoolObjectAuth  perms;

        object = pool->get(oid,true);

        if ( object == 0 )
        {
            failure_response(NO_EXISTS,
                             get_error(object_name(auth_object),oid),
                             att);
            return;
        }

        object->get_permissions(perms);

        object->unlock();

        if ( owner_a == perms.owner_a )
        {
            owner_a = -1;
        }

        if ( group_a == perms.group_a )
        {
            group_a = -1;
        }

        if ( other_u == perms.other_u )
        {
            other_u = -1;
        }

        if ( other_m == perms.other_m )
        {
            other_m = -1;
        }

        if ( other_a == perms.other_a )
        {
            other_a = -1;
        }

        if ( owner_a != -1 || group_a != -1 || other_a != -1 )
        {
            op = AuthRequest::ADMIN;
        }

        if ( other_u != -1 || other_m != -1 || other_a != -1 )
        {
            bool enable_other;

            Nebula::instance().get_configuration_attribute(
                    "ENABLE_OTHER_PERMISSIONS", enable_other);

            if ( !enable_other )
            {
                failure_response(AUTHORIZATION,
                         "Management of 'other' permissions is disabled in oned.conf",
                         att);

                return;
            }
        }

        AuthRequest ar(att.uid, att.group_ids);

        ar.add_auth(op, perms);

        if (UserPool::authorize(ar) == -1)
        {
            failure_response(AUTHORIZATION,
                             authorization_error(ar.message, att),
                             att);

            return;
        }
    }

    // ------------- Update the object ---------------------

    object = pool->get(oid,true);

    if ( object == 0 )
    {
        failure_response(NO_EXISTS,
                get_error(object_name(auth_object),oid),
                att);
        return;
    }

    int rc = object->set_permissions(owner_u, owner_m, owner_a, group_u,
                        group_m, group_a, other_u, other_m, other_a, error_str);

    if ( rc != 0 )
    {
        failure_response(INTERNAL,
                request_error("Error updating permissions",error_str),
                att);

        object->unlock();
        return;
    }

    pool->update(object);

    object->unlock();

    success_response(oid, att);

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
