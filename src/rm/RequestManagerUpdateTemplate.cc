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
    return object->replace_template(tmpl, error_str);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

int VirtualMachineUpdateTemplate::replace_template(
        PoolObjectSQL * object,
        const string & tmpl,
        const RequestAttributes & att,
        string & error_str)
{
    VirtualMachine* vm = static_cast<VirtualMachine*>(object);

    if (att.uid!=UserPool::ONEADMIN_ID && att.gid!=GroupPool::ONEADMIN_ID)
    {
        return vm->replace_template(tmpl, true, error_str);
    }
    else
    {
        return vm->replace_template(tmpl, false, error_str);
    }

}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void RequestManagerUpdateTemplate::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    int    rc;
    string error_str;

    int    oid  = xmlrpc_c::value_int(paramList.getInt(1));
    string tmpl = xmlrpc_c::value_string(paramList.getString(2));
    
    PoolObjectSQL * object;

    if ( basic_authorization(oid, att) == false )
    {
        return;
    }

    object = pool->get(oid,true);

    if ( object == 0 )                             
    {                                            
        failure_response(NO_EXISTS,
                get_error(object_name(auth_object),oid),
                att);

        return;
    }

    rc = replace_template(object, tmpl, att, error_str);

//    rc = object->replace_template(tmpl, error_str);

    if ( rc != 0 )
    {
        failure_response(INTERNAL,
                request_error("Cannot update template",error_str),
                att);
        object->unlock();

        return;
    }

    pool->update(object);

    object->unlock();

    success_response(oid, att);

    return;
}

