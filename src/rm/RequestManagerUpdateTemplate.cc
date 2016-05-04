/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

#include "RequestManagerUpdateTemplate.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int RequestManagerUpdateTemplate::replace_template(
        PoolObjectSQL * object,
        const string & tmpl,
        const RequestAttributes &att,
        string &error_str)
{
    if (att.uid!=UserPool::ONEADMIN_ID && att.gid!=GroupPool::ONEADMIN_ID)
    {
        return object->replace_template(tmpl, true, error_str);
    }
    else
    {
        return object->replace_template(tmpl, false, error_str);
    }
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int RequestManagerUpdateTemplate::append_template(
        PoolObjectSQL * object,
        const string & tmpl,
        const RequestAttributes &att,
        string &error_str)
{
    if (att.uid!=UserPool::ONEADMIN_ID && att.gid!=GroupPool::ONEADMIN_ID)
    {
        return object->append_template(tmpl, true, error_str);
    }
    else
    {
        return object->append_template(tmpl, false, error_str);
    }
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void RequestManagerUpdateTemplate::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    int    rc;

    int    oid  = xmlrpc_c::value_int(paramList.getInt(1));
    string tmpl = xmlrpc_c::value_string(paramList.getString(2));

    int update_type = 0;

    if ( paramList.size() > 3 )
    {
        update_type = xmlrpc_c::value_int(paramList.getInt(3));
    }

    PoolObjectSQL * object;

    if ( basic_authorization(oid, att) == false )
    {
        return;
    }

    if ( update_type < 0 || update_type > 1 )
    {
        att.resp_msg = "Wrong update type";
        failure_response(XML_RPC_API, att);
        return;
    }


    object = pool->get(oid,true);

    if ( object == 0 )
    {
        att.resp_id = oid;
        failure_response(NO_EXISTS, att);
        return;
    }

    if (update_type == 0)
    {
        rc = replace_template(object, tmpl, att, att.resp_msg);
    }
    else //if (update_type == 1)
    {
        rc = append_template(object, tmpl, att, att.resp_msg);
    }

    if ( rc != 0 )
    {
        att.resp_msg = "Cannot update template. " + att.resp_msg;
        failure_response(INTERNAL, att);
        object->unlock();

        return;
    }

    pool->update(object);

    object->unlock();

    success_response(oid, att);

    return;
}

