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

#ifndef MARKETPLACE_XRPC_H
#define MARKETPLACE_XRPC_H

#include "RequestXRPC.h"
#include "MarketPlaceAPI.h"
#include "MarketPlacePoolAPI.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceAllocateXRPC : public RequestXRPC, public MarketPlaceAllocateAPI
{
public:
    MarketPlaceAllocateXRPC() :
        RequestXRPC("one.market.allocate",
                    "Allocates a new MarketPlace",
                    "A:ss"),
        MarketPlaceAllocateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceDeleteXRPC : public RequestXRPC, public MarketPlaceAPI
{
public:
    MarketPlaceDeleteXRPC() :
        RequestXRPC("one.market.delete",
                    "Deletes a MarketPlace",
                    "A:si"),
        MarketPlaceAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceInfoXRPC : public RequestXRPC, public MarketPlaceInfoAPI
{
public:
    MarketPlaceInfoXRPC() :
        RequestXRPC("one.market.info",
                    "Returns MarketPlace information",
                    "A:sib"),
        MarketPlaceInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceUpdateXRPC : public RequestXRPC, public MarketPlaceAPI
{
public:
    MarketPlaceUpdateXRPC() :
        RequestXRPC("one.market.update",
                    "Updates a MarketPlace template",
                    "A:sisi"),
        MarketPlaceAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceRenameXRPC : public RequestXRPC, public MarketPlaceAPI
{
public:
    MarketPlaceRenameXRPC() :
        RequestXRPC("one.market.rename",
                    "Renames a MarketPlace",
                    "A:sis"),
        MarketPlaceAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceChmodXRPC: public RequestXRPC, public MarketPlaceAPI
{
public:
    MarketPlaceChmodXRPC()
        : RequestXRPC("one.market.chmod",
                      "Changes permission bits of a MarketPlace",
                      "A:siiiiiiiiii")
        , MarketPlaceAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceChownXRPC : public RequestXRPC, public MarketPlaceAPI
{
public:
    MarketPlaceChownXRPC()
        : RequestXRPC("one.market.chown",
                      "Changes ownership of a MarketPlace",
                      "A:siii")
        , MarketPlaceAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceEnableXRPC : public RequestXRPC, public MarketPlaceAPI
{
public:
    MarketPlaceEnableXRPC()
        : RequestXRPC("one.market.enable",
                      "Enable or disable MarketPlace",
                      "A:sii")
        , MarketPlaceAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceAllocateDBXRPC : public RequestXRPC, public MarketPlaceAllocateDBAPI
{
public:
    MarketPlaceAllocateDBXRPC() :
        RequestXRPC("one.market.allocatedb",
                    "Allocates a new MarketPlace from its template representation",
                    "A:ss"),
        MarketPlaceAllocateDBAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceUpdateDBXRPC : public RequestXRPC, public MarketPlaceUpdateDBAPI
{
public:
    MarketPlaceUpdateDBXRPC():
        RequestXRPC("one.market.updatedb",
                    "Updates the DB object from a XML document",
                    "A:sis"),
        MarketPlaceUpdateDBAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlacePoolInfoXRPC : public RequestXRPC, public MarketPlacePoolAPI
{
public:
    MarketPlacePoolInfoXRPC()
        : RequestXRPC("one.marketpool.info",
                      "Returns the MarketPlace pool",
                      "A:s")
        , MarketPlacePoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

#endif
