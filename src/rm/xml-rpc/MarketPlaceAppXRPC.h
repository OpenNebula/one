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

#ifndef MARKETPLACEAPP_XRPC_H
#define MARKETPLACEAPP_XRPC_H

#include "RequestXRPC.h"
#include "MarketPlaceAppAPI.h"
#include "MarketPlaceAppPoolAPI.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceAppAllocateXRPC : public RequestXRPC, public MarketPlaceAppAllocateAPI
{
public:
    MarketPlaceAppAllocateXRPC() :
        RequestXRPC("one.marketapp.allocate",
                    "Allocates a new MarketPlaceApp",
                    "A:ss"),
        MarketPlaceAppAllocateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceAppDeleteXRPC : public RequestXRPC, public MarketPlaceAppAPI
{
public:
    MarketPlaceAppDeleteXRPC() :
        RequestXRPC("one.marketapp.delete",
                    "Deletes a MarketPlaceApp",
                    "A:si"),
        MarketPlaceAppAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceAppInfoXRPC : public RequestXRPC, public MarketPlaceAppInfoAPI
{
public:
    MarketPlaceAppInfoXRPC() :
        RequestXRPC("one.marketapp.info",
                    "Returns MarketPlaceApp information",
                    "A:si"),
        MarketPlaceAppInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceAppUpdateXRPC : public RequestXRPC, public MarketPlaceAppAPI
{
public:
    MarketPlaceAppUpdateXRPC() :
        RequestXRPC("one.marketapp.update",
                    "Updates a MarketPlaceApp template",
                    "A:sisi"),
        MarketPlaceAppAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceAppRenameXRPC : public RequestXRPC, public MarketPlaceAppAPI
{
public:
    MarketPlaceAppRenameXRPC() :
        RequestXRPC("one.marketapp.rename",
                    "Renames a MarketPlaceApp",
                    "A:sis"),
        MarketPlaceAppAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceAppChmodXRPC: public RequestXRPC, public MarketPlaceAppAPI
{
public:
    MarketPlaceAppChmodXRPC()
        : RequestXRPC("one.marketapp.chmod",
                      "Changes permission bits of a MarketPlaceApp",
                      "A:siiiiiiiiii")
        , MarketPlaceAppAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceAppChownXRPC : public RequestXRPC, public MarketPlaceAppAPI
{
public:
    MarketPlaceAppChownXRPC()
        : RequestXRPC("one.marketapp.chown",
                      "Changes ownership of a MarketPlaceApp",
                      "A:siii")
        , MarketPlaceAppAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceAppEnableXRPC : public RequestXRPC, public MarketPlaceAppAPI
{
public:
    MarketPlaceAppEnableXRPC()
        : RequestXRPC("one.marketapp.enable",
                      "Enable or disable MarketPlaceApp",
                      "A:sii")
        , MarketPlaceAppAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceAppLockXRPC : public RequestXRPC, public MarketPlaceAppAPI
{
public:
    MarketPlaceAppLockXRPC()
        : RequestXRPC("one.marketapp.enable",
                      "Lock a MarketPlaceApp",
                      "A:siib")
        , MarketPlaceAppAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceAppUnlockXRPC : public RequestXRPC, public MarketPlaceAppAPI
{
public:
    MarketPlaceAppUnlockXRPC()
        : RequestXRPC("one.marketapp.enable",
                      "Unlock a MarektPlaceApp",
                      "A:si")
        , MarketPlaceAppAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceAppAllocateDBXRPC : public RequestXRPC, public MarketPlaceAppAllocateDBAPI
{
public:
    MarketPlaceAppAllocateDBXRPC():
        RequestXRPC("one.marketapp.allocatedb",
                    "Allocates a new MarketPlaceApp from its template representation",
                    "A:ss"),
        MarketPlaceAppAllocateDBAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceAppUpdateDBXRPC : public RequestXRPC, public MarketPlaceAppUpdateDBAPI
{
public:
    MarketPlaceAppUpdateDBXRPC():
        RequestXRPC("one.marketapp.updatedb",
                    "Updates the DB object from a XML document",
                    "A:sis"),
        MarketPlaceAppUpdateDBAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceAppDropDBXRPC : public RequestXRPC, public MarketPlaceAppDropDBAPI
{
public:
    MarketPlaceAppDropDBXRPC():
        RequestXRPC("one.marketapp.dropdb",
                    "Drops the MarketPlaceApp object from DB",
                    "A:si"),
        MarketPlaceAppDropDBAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const&  _paramList,
                         RequestAttributesXRPC&      att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceAppPoolInfoXRPC : public RequestXRPC, public MarketPlaceAppPoolAPI
{
public:
    MarketPlaceAppPoolInfoXRPC()
        : RequestXRPC("one.marketapppool.info",
                      "Returns the MarketPlaceApp pool",
                      "A:s")
        , MarketPlaceAppPoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

#endif
