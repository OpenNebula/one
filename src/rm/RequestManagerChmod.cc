/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

    ErrorCode ec = chmod(pool, oid,
                        owner_u, owner_m, owner_a,
                        group_u, group_m, group_a,
                        other_u, other_m, other_a,
                        att);

    if ( ec == SUCCESS )
    {
        success_response(oid, att);
    }
    else
    {
        failure_response(ec, att);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode RequestManagerChmod::chmod(
        PoolSQL * pool,
        int oid,
        int owner_u,
        int owner_m,
        int owner_a,
        int group_u,
        int group_m,
        int group_a,
        int other_u,
        int other_m,
        int other_a,
        RequestAttributes& att)
{
    PoolObjectSQL * object;

    if ( att.uid != 0 && att.gid != 0)
    {
        AuthRequest::Operation op = AuthRequest::MANAGE;
        PoolObjectAuth  perms;

        object = pool->get(oid,true);

        if ( object == 0 )
        {
            att.resp_id = oid;
            return NO_EXISTS;
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
                att.resp_msg = "'other' permissions is disabled in oned.conf";
                return AUTHORIZATION;
            }
        }

        AuthRequest ar(att.uid, att.group_ids);

        ar.add_auth(op, perms);

        if (UserPool::authorize(ar) == -1)
        {
            att.resp_msg = ar.message;
            return AUTHORIZATION;
        }
    }

    // ------------- Update the object ---------------------

    object = pool->get(oid,true);

    if ( object == 0 )
    {
        att.resp_id = oid;
        return NO_EXISTS;
    }

    int rc = object->set_permissions(owner_u, owner_m, owner_a, group_u,
                    group_m, group_a, other_u, other_m, other_a, att.resp_msg);

    if ( rc != 0 )
    {
        object->unlock();
        return INTERNAL;
    }

    pool->update(object);

    object->unlock();

    return SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void TemplateChmod::request_execute(xmlrpc_c::paramList const& paramList,
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

    bool recursive = false;

    if (paramList.size() > 11)
    {
        recursive = xmlrpc_c::value_boolean(paramList.getBoolean(11));
    }

    ErrorCode ec = chmod(pool, oid,
            owner_u, owner_m, owner_a,
            group_u, group_m, group_a,
            other_u, other_m, other_a,
            att);

    if ( ec != SUCCESS )
    {
        failure_response(ec, att);
        return;
    }

    if (recursive)
    {
        VMTemplate* tmpl = static_cast<VMTemplatePool*>(pool)->get(oid, true);

        int rc = 0;
        set<int> error_ids;

        if ( tmpl == 0 )
        {
            att.resp_id = oid;
            failure_response(NO_EXISTS, att);
            return;
        }

        vector<int> img_ids;

        tmpl->get_img_ids(img_ids);

        tmpl->unlock();

        ErrorCode ec;

        for (vector<int>::iterator it = img_ids.begin(); it != img_ids.end(); it++)
        {
            ec = ImageChmod::chmod(*it,
                    owner_u, owner_m, owner_a,
                    group_u, group_m, group_a,
                    other_u, other_m, other_a,
                    att);

            if (ec != SUCCESS)
            {
                NebulaLog::log("ReM", Log::ERROR, failure_message(ec, att));

                error_ids.insert(*it);
                rc = -1;
            }
        }

        if ( rc != 0 )
        {
            att.resp_msg = "Cannot chmod " + object_name(PoolObjectSQL::IMAGE) +
                ": " + one_util::join<set<int>::iterator>(error_ids.begin(),
                error_ids.end(), ',');

            failure_response(ACTION, att);
            return;
        }
    }

    success_response(oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode ImageChmod::chmod(
        int oid,
        int owner_u,
        int owner_m,
        int owner_a,
        int group_u,
        int group_m,
        int group_a,
        int other_u,
        int other_m,
        int other_a,
        RequestAttributes& att)
{
    return RequestManagerChmod::chmod(
            Nebula::instance().get_ipool(),
            oid,
            owner_u, owner_m, owner_a,
            group_u, group_m, group_a,
            other_u, other_m, other_a,
            att);
}
