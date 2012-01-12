/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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

#include "RequestManagerDelete.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool RequestManagerDelete::delete_authorization(int                oid,
                                                RequestAttributes& att)
{
    PoolObjectSQL * object;
    PoolObjectAuth  perms;

    if ( att.uid == 0 )
    {
        return true;
    }

    object = pool->get(oid,true);

    if ( object == 0 )
    {
        failure_response(NO_EXISTS,
                         get_error(object_name(auth_object),oid),
                         att);
        return false;
    }

    object->get_permissions(perms);

    object->unlock();

    AuthRequest ar(att.uid, att.gid);

    ar.add_auth(auth_op, perms);    // <MANAGE|ADMIN> OBJECT

    if (UserPool::authorize(ar) == -1)
    {
        failure_response(AUTHORIZATION,
                authorization_error(ar.message, att),
                att);

        return false;
    }

    return true;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void RequestManagerDelete::request_execute(xmlrpc_c::paramList const& paramList,
                                           RequestAttributes& att)
{
    int             oid = xmlrpc_c::value_int(paramList.getInt(1));
    PoolObjectSQL * object;
    string          error_msg;

    if ( delete_authorization(oid, att) == false )
    {
        return;
    }

    object = pool->get(oid,true);

    if ( object == 0 )                             
    {                                            
        failure_response(NO_EXISTS, get_error(object_name(auth_object), oid),
                att);
        return;
    }    

    int rc = drop(oid, object, error_msg);

    if ( rc != 0 )
    {
        failure_response(INTERNAL,
            request_error("Can not delete "+object_name(auth_object),error_msg),
            att);
        return;
    }

    success_response(oid, att);

    return;
}

/* ------------------------------------------------------------------------- */

int ImageDelete::drop(int oid, PoolObjectSQL * object, string& error_msg)
{
    Nebula&         nd     = Nebula::instance();
    ImageManager *  imagem = nd.get_imagem();

    object->unlock();
    int rc = imagem->delete_image(oid);

    return rc;
}

/* ------------------------------------------------------------------------- */

int UserDelete::drop(int oid, PoolObjectSQL * object, string& error_msg)
{
    User * user  = static_cast<User *>(object);
    int group_id = user->get_gid();

    if (oid == 0)
    {
        error_msg = "oneadmin can not be deleted.";

        object->unlock();
        return -1;
    }

    int rc = pool->drop(object, error_msg);

    object->unlock();

    if ( rc == 0 )
    {
        Nebula&     nd      = Nebula::instance();
        GroupPool * gpool   = nd.get_gpool();

        Group *     group   = gpool->get(group_id, true);

        if( group != 0 )
        {
            group->del_user(oid);
            gpool->update(group);

            group->unlock();
        }
    }

    return rc;
}
