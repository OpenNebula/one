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

#ifndef ZONE_XRPC_H
#define ZONE_XRPC_H

#include "RequestXRPC.h"
#include "ZoneAPI.h"
#include "ZonePoolAPI.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ZoneAllocateXRPC : public RequestXRPC, public ZoneAPI
{
public:
    ZoneAllocateXRPC() :
        RequestXRPC("one.zone.allocate",
                    "Allocates a new zone",
                    "A:ss"),
        ZoneAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ZoneDeleteXRPC : public RequestXRPC, public ZoneAPI
{
public:
    ZoneDeleteXRPC() :
        RequestXRPC("one.zone.delete",
                    "Deletes a zone",
                    "A:si"),
        ZoneAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ZoneUpdateXRPC : public RequestXRPC, public ZoneUpdateAPI
{
public:
    ZoneUpdateXRPC() :
        RequestXRPC("one.zone.update",
                    "Updates a zone template",
                    "A:sisi"),
        ZoneUpdateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ZoneRenameXRPC : public RequestXRPC, public ZoneRenameAPI
{
public:
    ZoneRenameXRPC() :
        RequestXRPC("one.zone.rename",
                    "Renames a zone",
                    "A:sis"),
        ZoneRenameAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ZoneAddServerXRPC : public RequestXRPC, public ZoneAPI
{
public:
    ZoneAddServerXRPC():
        RequestXRPC("one.zone.addserver",
                    "Add a server to zone",
                    "A:sis"),
        ZoneAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ZoneDelServerXRPC : public RequestXRPC, public ZoneAPI
{
public:
    ZoneDelServerXRPC():
        RequestXRPC("one.zone.delserver",
                    "Delete a server from zone",
                    "A:sii"),
        ZoneAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ZoneResetServerXRPC : public RequestXRPC, public ZoneAPI
{
public:
    ZoneResetServerXRPC():
        RequestXRPC("one.zone.resetserver",
                    "Reset server log index",
                    "A:sis"),
        ZoneAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};


/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ZoneEnableXRPC : public RequestXRPC, public ZoneEnableAPI
{
public:
    ZoneEnableXRPC():
        RequestXRPC("one.zone.enable",
                    "Enable or disable zone",
                    "A:sii"),
        ZoneEnableAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ZoneReplicateLogXRPC : public RequestXRPC, public ZoneReplicateLogAPI
{
public:
    ZoneReplicateLogXRPC():
        RequestXRPC("one.zone.replicate",
                    "Replicate a log record",
                    "A:siiiiiiis"),
        ZoneReplicateLogAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ZoneVoteXRPC : public RequestXRPC, public ZoneVoteAPI
{
public:
    ZoneVoteXRPC():
        RequestXRPC("one.zone.voterequest",
                    "Request vote from a candidate",
                    "A:siiii"),
        ZoneVoteAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ZoneRaftStatusXRPC : public RequestXRPC, public ZoneRaftStatusAPI
{
public:
    ZoneRaftStatusXRPC():
        RequestXRPC("one.zone.raftstatus",
                    "Returns Raft status",
                    "A:s"),
        ZoneRaftStatusAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ZoneReplicateFedLogXRPC : public RequestXRPC, public ZoneReplicateFedLogAPI
{
public:
    ZoneReplicateFedLogXRPC():
        RequestXRPC("one.zone.fedreplicate",
                    "Replicate a fed log record",
                    "A:sis"),
        ZoneReplicateFedLogAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ZoneUpdateDBXRPC : public RequestXRPC, public ZoneAPI
{
public:
    ZoneUpdateDBXRPC():
        RequestXRPC("one.zone.updatedb",
                    "Updates the DB object from a XML document",
                    "A:sis"),
        ZoneAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ZoneInfoXRPC : public RequestXRPC, public ZoneInfoAPI
{
public:
    ZoneInfoXRPC():
        RequestXRPC("one.zone.info",
                    "Returns zone information",
                    "A:sib"),
        ZoneInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ZonePoolInfoXRPC : public RequestXRPC, public ZonePoolAPI
{
public:
    ZonePoolInfoXRPC()
        : RequestXRPC("one.zonepool.info",
                      "Returns the zone pool",
                      "A:s")
        , ZonePoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

#endif
