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

#ifndef VIRTUAL_ROUTER_XRPC_H
#define VIRTUAL_ROUTER_XRPC_H

#include "RequestXRPC.h"
#include "VirtualRouterAPI.h"
#include "VirtualRouterPoolAPI.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualRouterAllocateXRPC : public RequestXRPC, public VirtualRouterAllocateAPI
{
public:
    VirtualRouterAllocateXRPC() :
        RequestXRPC("one.vrouter.allocate",
                    "Allocates a new virtual router",
                    "A:ss"),
        VirtualRouterAllocateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualRouterDeleteXRPC : public RequestXRPC, public VirtualRouterAPI
{
public:
    VirtualRouterDeleteXRPC() :
        RequestXRPC("one.vrouter.delete",
                    "Deletes a virtual router",
                    "A:si"),
        VirtualRouterAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualRouterUpdateXRPC : public RequestXRPC, public VirtualRouterAPI
{
public:
    VirtualRouterUpdateXRPC() :
        RequestXRPC("one.vrouter.update",
                    "Updates a virtual router template",
                    "A:sisi"),
        VirtualRouterAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualRouterRenameXRPC : public RequestXRPC, public VirtualRouterAPI
{
public:
    VirtualRouterRenameXRPC() :
        RequestXRPC("one.vrouter.rename",
                    "Renames a virtual router",
                    "A:sis"),
        VirtualRouterAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualRouterInstantiateXRPC : public RequestXRPC, public VirtualRouterAPI
{
public:
    VirtualRouterInstantiateXRPC() :
        RequestXRPC("one.vrouter.instantiate",
                    "Instantiates a new virtual machine associated to a virtual router",
                    "A:siiisbs"),
        VirtualRouterAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualRouterAttachNicXRPC : public RequestXRPC, public VirtualRouterAPI
{
public:
    VirtualRouterAttachNicXRPC() :
        RequestXRPC("one.vrouter.attachnic",
                    "Attaches a new NIC to the virtual router, and its virtual machines",
                    "A:sis"),
        VirtualRouterAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualRouterDetachNicXRPC : public RequestXRPC, public VirtualRouterAPI
{
public:
    VirtualRouterDetachNicXRPC() :
        RequestXRPC("one.vrouter.detachnic",
                    "Detaches a NIC from a virtual router, and its virtual machines",
                    "A:sii"),
        VirtualRouterAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualRouterLockXRPC : public RequestXRPC, public VirtualRouterAPI
{
public:
    VirtualRouterLockXRPC() :
        RequestXRPC("one.vrouter.lock",
                    "Lock a VirtualRouter",
                    "A:siib"),
        VirtualRouterAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualRouterUnlockXRPC : public RequestXRPC, public VirtualRouterAPI
{
public:
    VirtualRouterUnlockXRPC() :
        RequestXRPC("one.vrouter.unlock",
                    "Unlock a VirtualRouter",
                    "A:si"),
        VirtualRouterAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualRouterChownXRPC : public RequestXRPC, public VirtualRouterAPI
{
public:
    VirtualRouterChownXRPC() :
        RequestXRPC("one.vrouter.chown",
                    "Changes ownership of a virtual router",
                    "A:siii"),
        VirtualRouterAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualRouterChmodXRPC : public RequestXRPC, public VirtualRouterAPI
{
public:
    VirtualRouterChmodXRPC() :
        RequestXRPC("one.vrouter.chmod",
                    "Changes permission bits of a virtual router",
                    "A:siiiiiiiiii"),
        VirtualRouterAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualRouterInfoXRPC : public RequestXRPC, public VirtualRouterInfoAPI
{
public:
    VirtualRouterInfoXRPC():
        RequestXRPC("one.vrouter.info",
                    "Returns virtual router information",
                    "A:sib"),
        VirtualRouterInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualRouterPoolInfoXRPC : public RequestXRPC, public VirtualRouterPoolAPI
{
public:
    VirtualRouterPoolInfoXRPC()
        : RequestXRPC("one.vrouterpool.info",
                      "Returns the virtual router pool",
                      "A:siii")
        , VirtualRouterPoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

#endif
