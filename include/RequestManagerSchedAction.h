/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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

#ifndef REQUEST_MANAGER_SCHED_H_
#define REQUEST_MANAGER_SCHED_H_

#include "Request.h"
#include "Nebula.h"
#include "VirtualMachinePool.h"


class RequestManagerSchedAdd : public Request
{
public:
    RequestManagerSchedAdd()
        : Request("one.vm.schedadd", "A:is", "Add scheduled action")
    {
        auth_object = PoolObjectSQL::VM;
        auth_op = AuthRequest::MANAGE;
        vm_action = VMActions::SCHED_ADD_ACTION;

        Nebula& nd = Nebula::instance();
        pool = nd.get_vmpool();
    }

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerSchedDelete : public Request
{
public:
    RequestManagerSchedDelete()
        : Request("one.vm.scheddelete", "A:ii", "Delete scheduled action")
    {
        auth_object = PoolObjectSQL::VM;
        auth_op = AuthRequest::MANAGE;
        vm_action = VMActions::SCHED_DELETE_ACTION;

        Nebula& nd = Nebula::instance();
        pool = nd.get_vmpool();
    }

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerSchedUpdate : public Request
{
public:
    RequestManagerSchedUpdate()
        : Request("one.vm.schedupdate", "A:iis", "Update scheduled action")
    {
        auth_object = PoolObjectSQL::VM;
        auth_op = AuthRequest::MANAGE;
        vm_action = VMActions::SCHED_DELETE_ACTION;

        Nebula& nd = Nebula::instance();
        pool = nd.get_vmpool();
    }

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

#endif
