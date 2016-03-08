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

#include "RequestManagerClone.h"
#include "PoolObjectAuth.h"
#include "Nebula.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManagerClone::request_execute(
        xmlrpc_c::paramList const&  paramList,
        RequestAttributes&          att)
{
    int    source_id = xmlrpc_c::value_int(paramList.getInt(1));
    string name      = xmlrpc_c::value_string(paramList.getString(2));

    int rc, new_id;

    PoolObjectAuth  perms;

    Template *      tmpl;
    PoolObjectSQL * source_obj;

    source_obj = pool->get(source_id, true);

    if ( source_obj == 0 )
    {
        att.resp_id = source_id;
        failure_response(NO_EXISTS, att);
        return;
    }

    tmpl = clone_template(source_obj);

    source_obj->get_permissions(perms);

    source_obj->unlock();

    tmpl->erase("NAME");
    tmpl->set(new SingleAttribute("NAME",name));

    if ( att.uid != 0 )
    {
        string tmpl_str = "";

        AuthRequest ar(att.uid, att.group_ids);

        ar.add_auth(auth_op, perms); //USE OBJECT

        tmpl->to_xml(tmpl_str);

        ar.add_create_auth(att.uid, att.gid, auth_object, tmpl_str);

        if (UserPool::authorize(ar) == -1)
        {
            att.resp_msg = ar.message;
            failure_response(AUTHORIZATION, att);

            delete tmpl;
            return;
        }
    }

    rc = pool_allocate(source_id, tmpl, new_id, att);

    if ( rc < 0 )
    {
        failure_response(ALLOCATE, att);
        return;
    }

    success_response(new_id, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

