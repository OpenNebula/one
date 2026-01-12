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

#ifndef VDC_XRPC_H
#define VDC_XRPC_H

#include "RequestXRPC.h"
#include "VdcAPI.h"
#include "VdcPoolAPI.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcAllocateXRPC : public RequestXRPC, public VdcAllocateAPI
{
public:
    VdcAllocateXRPC() :
        RequestXRPC("one.vdc.allocate",
                    "Allocates a new VDC",
                    "A:ss"),
        VdcAllocateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcDeleteXRPC : public RequestXRPC, public VdcAPI
{
public:
    VdcDeleteXRPC() :
        RequestXRPC("one.vdc.delete",
                    "Deletes a VDC",
                    "A:si"),
        VdcAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcUpdateXRPC : public RequestXRPC, public VdcUpdateAPI
{
public:
    VdcUpdateXRPC() :
        RequestXRPC("one.vdc.update",
                    "Updates a VDC template",
                    "A:sisi"),
        VdcUpdateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcRenameXRPC : public RequestXRPC, public VdcRenameAPI
{
public:
    VdcRenameXRPC() :
        RequestXRPC("one.vdc.rename",
                    "Renames a VDC",
                    "A:sis"),
        VdcRenameAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcAddGroupXRPC : public RequestXRPC, public VdcAPI
{
public:
    VdcAddGroupXRPC():
        RequestXRPC("one.vdc.addgroup",
                    "Adds a group to the VDC",
                    "A:sii"),
        VdcAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcDelGroupXRPC : public RequestXRPC, public VdcAPI
{
public:
    VdcDelGroupXRPC():
        RequestXRPC("one.vdc.delgroup",
                    "Deletes a group from the VDC",
                    "A:sii"),
        VdcAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcAddClusterXRPC : public RequestXRPC, public VdcAPI
{
public:
    VdcAddClusterXRPC():
        RequestXRPC("one.vdc.addcluster",
                    "Adds a cluster to the VDC",
                    "A:siii"),
        VdcAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcDelClusterXRPC : public RequestXRPC, public VdcAPI
{
public:
    VdcDelClusterXRPC():
        RequestXRPC("one.vdc.delcluster",
                    "Deletes a cluster from the VDC",
                    "A:siii"),
        VdcAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcAddHostXRPC : public RequestXRPC, public VdcAPI
{
public:
    VdcAddHostXRPC():
        RequestXRPC("one.vdc.addhost",
                    "Adds a host to the VDC",
                    "A:siii"),
        VdcAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcDelHostXRPC : public RequestXRPC, public VdcAPI
{
public:
    VdcDelHostXRPC():
        RequestXRPC("one.vdc.delhost",
                    "Deletes a host from the VDC",
                    "A:siii"),
        VdcAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcAddDatastoreXRPC : public RequestXRPC, public VdcAPI
{
public:
    VdcAddDatastoreXRPC():
        RequestXRPC("one.vdc.adddatastore",
                    "Adds a datastore to the VDC",
                    "A:siii"),
        VdcAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcDelDatastoreXRPC : public RequestXRPC, public VdcAPI
{
public:
    VdcDelDatastoreXRPC():
        RequestXRPC("one.vdc.deldatastore",
                    "Deletes a datastore from the VDC",
                    "A:siii"),
        VdcAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcAddVnetXRPC : public RequestXRPC, public VdcAPI
{
public:
    VdcAddVnetXRPC():
        RequestXRPC("one.vdc.addvnet",
                    "Adds a vnet to the VDC",
                    "A:siii"),
        VdcAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcDelVnetXRPC : public RequestXRPC, public VdcAPI
{
public:
    VdcDelVnetXRPC():
        RequestXRPC("one.vdc.delvnet",
                    "Deletes a vnet from the VDC",
                    "A:siii"),
        VdcAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcInfoXRPC : public RequestXRPC, public VdcInfoAPI
{
public:
    VdcInfoXRPC():
        RequestXRPC("one.vdc.info",
                    "Returns VDC information",
                    "A:sib"),
        VdcInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class VdcPoolInfoXRPC : public RequestXRPC, public VdcPoolAPI
{
public:
    VdcPoolInfoXRPC()
        : RequestXRPC("one.vdcpool.info",
                      "Returns the VDC pool",
                      "A:s")
        , VdcPoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

#endif
