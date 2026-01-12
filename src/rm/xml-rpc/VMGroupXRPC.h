/* -------------------------------------------------------------------------- */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                */
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

#ifndef VM_GROUP_XRPC_H
#define VM_GROUP_XRPC_H

#include "RequestXRPC.h"
#include "VMGroupAPI.h"
#include "VMGroupPoolAPI.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VMGroupAllocateXRPC : public RequestXRPC, public VMGroupAllocateAPI
{
public:
    VMGroupAllocateXRPC() :
        RequestXRPC("one.vmgroup.allocate",
                    "Allocates a new vm group",
                    "A:ss"),
        VMGroupAllocateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VMGroupDeleteXRPC : public RequestXRPC, public VMGroupAPI
{
public:
    VMGroupDeleteXRPC() :
        RequestXRPC("one.vmgroup.delete",
                    "Deletes a vm group",
                    "A:si"),
        VMGroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VMGroupUpdateXRPC : public RequestXRPC, public VMGroupAPI
{
public:
    VMGroupUpdateXRPC() :
        RequestXRPC("one.vmgroup.update",
                    "Updates a vm group template",
                    "A:sisi"),
        VMGroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VMGroupRenameXRPC : public RequestXRPC, public VMGroupAPI
{
public:
    VMGroupRenameXRPC() :
        RequestXRPC("one.vmgroup.rename",
                    "Renames a vm group",
                    "A:sis"),
        VMGroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VMGroupChmodXRPC: public RequestXRPC, public VMGroupAPI
{
public:
    VMGroupChmodXRPC()
        : RequestXRPC("one.vmgroup.chmod",
                      "Changes permission bits of a vm group",
                      "A:siiiiiiiiii")
        , VMGroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VMGroupChownXRPC : public RequestXRPC, public VMGroupAPI
{
public:
    VMGroupChownXRPC()
        : RequestXRPC("one.vmgroup.chown",
                      "Changes ownership of a vm group",
                      "A:siii")
        , VMGroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VMGroupLockXRPC : public RequestXRPC, public VMGroupAPI
{
public:
    VMGroupLockXRPC()
        : RequestXRPC("one.vmgroup.lock",
                      "Lock a VMGroup",
                      "A:siib")
        , VMGroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VMGroupUnlockXRPC : public RequestXRPC, public VMGroupAPI
{
public:
    VMGroupUnlockXRPC()
        : RequestXRPC("one.vmgroup.unlock",
                      "Unlock a VMGroup",
                      "A:si")
        , VMGroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VMGroupAddRoleXRPC : public RequestXRPC, public VMGroupAPI
{
public:
    VMGroupAddRoleXRPC() :
        RequestXRPC("one.vmgroup.roleadd",
                    "Add new role to VMGroup",
                    "A:sis"),
        VMGroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VMGroupDelRoleXRPC : public RequestXRPC, public VMGroupAPI
{
public:
    VMGroupDelRoleXRPC() :
        RequestXRPC("one.vmgroup.roledelete",
                    "Delete role from VMGroup",
                    "A:sii"),
        VMGroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VMGroupUpdateRoleXRPC : public RequestXRPC, public VMGroupAPI
{
public:
    VMGroupUpdateRoleXRPC() :
        RequestXRPC("one.vmgroup.roleupdate",
                    "Update VMGroup role",
                    "A:siis"),
        VMGroupAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VMGroupInfoXRPC : public RequestXRPC, public VMGroupInfoAPI
{
public:
    VMGroupInfoXRPC():
        RequestXRPC("one.vmgroup.info",
                    "Returns vm group information",
                    "A:sib"),
        VMGroupInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VMGroupPoolInfoXRPC : public RequestXRPC, public VMGroupPoolAPI
{
public:
    VMGroupPoolInfoXRPC()
        : RequestXRPC("one.vmgrouppool.info",
                      "Returns the vm group pool",
                      "A:siii")
        , VMGroupPoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

#endif
