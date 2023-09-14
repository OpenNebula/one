/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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

#ifndef REQUEST_MANAGER_VM_GROUP_H
#define REQUEST_MANAGER_VM_GROUP_H

#include "Request.h"
#include "Nebula.h"
#include "VMGroupPool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerVMGroup: public Request
{
protected:
    RequestManagerVMGroup(const std::string& method_name,
                          const std::string& params,
                          const std::string& help)
        : Request(method_name,params,help)
    {
        Nebula& nd  = Nebula::instance();
        pool        = nd.get_vmgrouppool();

        auth_object = PoolObjectSQL::VMGROUP;
        auth_op     = AuthRequest::MANAGE;
    }
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VMGroupAddRole : public RequestManagerVMGroup
{
public:
    VMGroupAddRole():
        RequestManagerVMGroup("one.vmgroup.roleadd", "A:sis",
                              "Add new role to VMGroup")
    {
    }

protected:
    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VMGroupDelRole : public RequestManagerVMGroup
{
public:
    VMGroupDelRole():
        RequestManagerVMGroup("one.vmgroup.roledelete", "A:sii",
                              "Delete role from VMGroup")
    {
    }

protected:
    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class VMGroupUpdateRole : public RequestManagerVMGroup
{
public:
    VMGroupUpdateRole():
        RequestManagerVMGroup("one.vmgroup.roleupdate", "A:siis",
                              "Update VMGroup role")
    {
    }

protected:
    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif
