/* -------------------------------------------------------------------------- */
/* Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                */
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

#include "RequestManagerSchedAction.h"

using namespace std;


void RequestManagerSchedAdd::request_execute(xmlrpc_c::paramList const& paramList,
                                             RequestAttributes& att)
{
    int oid  = paramList.getInt(1);
    string template_str = paramList.getString(2);

    if ( basic_authorization(oid, att) == false )
    {
        return;
    }

    auto vm = pool->get<VirtualMachine>(oid);

    if ( !vm )
    {
        att.resp_id = oid;
        failure_response(NO_EXISTS, att);
        return;
    }

    if ( vm->sched_action_add(template_str, att.resp_msg) != 0 )
    {
        failure_response(INTERNAL, att);
        return;
    }

    pool->update(vm.get());

    success_response(oid, att);

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManagerSchedDelete::request_execute(xmlrpc_c::paramList const& paramList,
                                                RequestAttributes& att)
{
    int oid  = paramList.getInt(1);
    int sched_id = paramList.getInt(2);

    if ( basic_authorization(oid, att) == false )
    {
        return;
    }

    auto vm = pool->get<VirtualMachine>(oid);

    if ( !vm )
    {
        att.resp_id = oid;
        failure_response(NO_EXISTS, att);
        return;
    }

    if ( vm->sched_action_delete(sched_id, att.resp_msg) != 0 )
    {
        failure_response(INTERNAL, att);
        return;
    }

    pool->update(vm.get());

    success_response(oid, att);

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManagerSchedUpdate::request_execute(xmlrpc_c::paramList const& paramList,
                                                RequestAttributes& att)
{
    int oid  = paramList.getInt(1);
    int sched_id = paramList.getInt(2);
    string template_str = paramList.getString(3);

    if ( basic_authorization(oid, att) == false )
    {
        return;
    }

    auto vm = pool->get<VirtualMachine>(oid);

    if ( !vm )
    {
        att.resp_id = oid;
        failure_response(NO_EXISTS, att);
        return;
    }

    if ( vm->sched_action_update(sched_id, template_str, att.resp_msg) != 0 )
    {
        failure_response(INTERNAL, att);
        return;
    }

    pool->update(vm.get());

    success_response(oid, att);

    return;
}
