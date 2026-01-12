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

#ifndef HOST_XRPC_H
#define HOST_XRPC_H

#include "RequestXRPC.h"
#include "HostAPI.h"
#include "HostPoolAPI.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HostAllocateXRPC : public RequestXRPC, public HostAllocateAPI
{
public:
    HostAllocateXRPC() :
        RequestXRPC("one.host.allocate",
                    "Allocates a new host",
                    "A:ssssi"),
        HostAllocateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HostDeleteXRPC : public RequestXRPC, public HostAPI
{
public:
    HostDeleteXRPC() :
        RequestXRPC("one.host.delete",
                    "Deletes a host",
                    "A:si"),
        HostAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HostInfoXRPC : public RequestXRPC, public HostInfoAPI
{
public:
    HostInfoXRPC() :
        RequestXRPC("one.host.info",
                    "Returns host information",
                    "A:sib"),
        HostInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HostUpdateXRPC : public RequestXRPC, public HostAPI
{
public:
    HostUpdateXRPC() :
        RequestXRPC("one.host.update",
                    "Updates a host template",
                    "A:sisi"),
        HostAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HostRenameXRPC : public RequestXRPC, public HostAPI
{
public:
    HostRenameXRPC() :
        RequestXRPC("one.host.rename",
                    "Renames a host",
                    "A:sis"),
        HostAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HostStatusXRPC: public RequestXRPC, public HostAPI
{
public:
    HostStatusXRPC()
        : RequestXRPC("one.host.status",
                      "Sets the status of the host",
                      "A:sii")
        , HostAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HostMonitoringXRPC : public RequestXRPC, public HostMonitoringAPI
{
public:
    HostMonitoringXRPC()
        : RequestXRPC("one.host.monitoring",
                      "Returns the host monitoring records",
                      "A:si")
        , HostMonitoringAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HostPoolInfoXRPC : public RequestXRPC, public HostPoolAPI
{
public:
    HostPoolInfoXRPC()
        : RequestXRPC("one.hostpool.info",
                      "Returns the host pool",
                      "A:s")
        , HostPoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class HostPoolMonitoringXRPC : public RequestXRPC, public HostPoolAPI
{
public:
    HostPoolMonitoringXRPC()
        : RequestXRPC("one.hostpool.monitoring",
                      "Returns the host monitoring records",
                      "A:s")
        , HostPoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

#endif
