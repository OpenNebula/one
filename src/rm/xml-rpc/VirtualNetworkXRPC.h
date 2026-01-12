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

#ifndef VIRTUAL_NETWORK_XRPC_H
#define VIRTUAL_NETWORK_XRPC_H

#include "RequestXRPC.h"
#include "VirtualNetworkAPI.h"
#include "VirtualNetworkPoolAPI.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkAllocateXRPC : public RequestXRPC, public VirtualNetworkAllocateAPI
{
public:
    VirtualNetworkAllocateXRPC() :
        RequestXRPC("one.vn.allocate",
                    "Allocates a new VirtualNetwork",
                    "A:si"),
        VirtualNetworkAllocateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkDeleteXRPC : public RequestXRPC, public VirtualNetworkAPI
{
public:
    VirtualNetworkDeleteXRPC() :
        RequestXRPC("one.vn.delete",
                    "Deletes a VirtualNetwork",
                    "A:si"),
        VirtualNetworkAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkInfoXRPC : public RequestXRPC, public VirtualNetworkInfoAPI
{
public:
    VirtualNetworkInfoXRPC() :
        RequestXRPC("one.vn.info",
                    "Returns VirtualNetwork information",
                    "A:sib"),
        VirtualNetworkInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkUpdateXRPC : public RequestXRPC, public VirtualNetworkAPI
{
public:
    VirtualNetworkUpdateXRPC() :
        RequestXRPC("one.vn.update",
                    "Updates a VirtualNetwork",
                    "A:sisi"),
        VirtualNetworkAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkRenameXRPC : public RequestXRPC, public VirtualNetworkAPI
{
public:
    VirtualNetworkRenameXRPC() :
        RequestXRPC("one.vn.rename",
                    "Renames a VirtualNetwork",
                    "A:sis"),
        VirtualNetworkAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkChmodXRPC: public RequestXRPC, public VirtualNetworkAPI
{
public:
    VirtualNetworkChmodXRPC()
        : RequestXRPC("one.vn.chmod",
                      "Changes permission bits of a VirtualNetwork",
                      "A:siiiiiiiiii")
        , VirtualNetworkAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkChownXRPC : public RequestXRPC, public VirtualNetworkAPI
{
public:
    VirtualNetworkChownXRPC()
        : RequestXRPC("one.vn.chown",
                      "Changes ownership of a VirtualNetwork",
                      "A:siii")
        , VirtualNetworkAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkLockXRPC : public RequestXRPC, public VirtualNetworkAPI
{
public:
    VirtualNetworkLockXRPC()
        : RequestXRPC("one.vn.lock",
                      "Lock an VirtualNetwork",
                      "A:siib")
        , VirtualNetworkAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkUnlockXRPC : public RequestXRPC, public VirtualNetworkAPI
{
public:
    VirtualNetworkUnlockXRPC()
        : RequestXRPC("one.vn.unlock",
                      "Unlock an VirtualNetwork",
                      "A:si")
        , VirtualNetworkAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkAddARXRPC: public RequestXRPC, public VirtualNetworkAPI
{
public:
    VirtualNetworkAddARXRPC()
        : RequestXRPC("one.vn.add_ar",
                      "Adds Address Ranges to a Virtual Network",
                      "A:sis")
        , VirtualNetworkAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkRmARXRPC: public RequestXRPC, public VirtualNetworkRmARAPI
{
public:
    VirtualNetworkRmARXRPC()
        : RequestXRPC("one.vn.rm_ar",
                      "Removes an Address Range from a Virtual Network",
                      "A:siib")
        , VirtualNetworkRmARAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkUpdateARXRPC: public RequestXRPC, public VirtualNetworkAPI
{
public:
    VirtualNetworkUpdateARXRPC()
        : RequestXRPC("one.vn.update_ar",
                      "Updates Address Ranges to a Virtual Network",
                      "A:sis")
        , VirtualNetworkAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkReserveXRPC: public RequestXRPC, public VirtualNetworkAPI
{
public:
    VirtualNetworkReserveXRPC()
        : RequestXRPC("one.vn.reserve",
                      "Reserve network addresses",
                      "A:sis")
        , VirtualNetworkAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkFreeARXRPC: public RequestXRPC, public VirtualNetworkAPI
{
public:
    VirtualNetworkFreeARXRPC()
        : RequestXRPC("one.vn.free_ar",
                      "Frees a reserved Address Range from a Virtual Network",
                      "A:sii")
        , VirtualNetworkAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkHoldXRPC: public RequestXRPC, public VirtualNetworkAPI
{
public:
    VirtualNetworkHoldXRPC()
        : RequestXRPC("one.vn.hold",
                      "Holds a Virtual Network Lease as used",
                      "A:sis")
        , VirtualNetworkAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkReleaseXRPC: public RequestXRPC, public VirtualNetworkAPI
{
public:
    VirtualNetworkReleaseXRPC()
        : RequestXRPC("one.vn.release",
                      "Releases a Virtual Network Lease on hold",
                      "A:sis")
        , VirtualNetworkAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkRecoverXRPC: public RequestXRPC, public VirtualNetworkAPI
{
public:
    VirtualNetworkRecoverXRPC()
        : RequestXRPC("one.vn.recover",
                      "Recover Virtual Network from ERROR or LOCKED state",
                      "A:sii")
        , VirtualNetworkAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VirtualNetworkPoolInfoXRPC : public RequestXRPC, public VirtualNetworkPoolAPI
{
public:
    VirtualNetworkPoolInfoXRPC()
        : RequestXRPC("one.vnpool.info",
                      "Returns the VirtualNetwork pool",
                      "A:siii")
        , VirtualNetworkPoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

#endif
