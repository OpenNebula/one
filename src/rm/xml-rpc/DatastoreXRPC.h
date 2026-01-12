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

#ifndef DATASTORE_XRPC_H
#define DATASTORE_XRPC_H

#include "RequestXRPC.h"
#include "DatastoreAPI.h"
#include "DatastorePoolAPI.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DatastoreAllocateXRPC : public RequestXRPC, public DatastoreAllocateAPI
{
public:
    DatastoreAllocateXRPC() :
        RequestXRPC("one.datastore.allocate",
                    "Allocates a new Datastore",
                    "A:ssi"),
        DatastoreAllocateAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DatastoreDeleteXRPC : public RequestXRPC, public DatastoreAPI
{
public:
    DatastoreDeleteXRPC() :
        RequestXRPC("one.datastore.delete",
                    "Deletes a Datastore",
                    "A:si"),
        DatastoreAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DatastoreInfoXRPC : public RequestXRPC, public DatastoreInfoAPI
{
public:
    DatastoreInfoXRPC() :
        RequestXRPC("one.datastore.info",
                    "Returns Datastore information",
                    "A:sib"),
        DatastoreInfoAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DatastoreUpdateXRPC : public RequestXRPC, public DatastoreAPI
{
public:
    DatastoreUpdateXRPC() :
        RequestXRPC("one.datastore.update",
                    "Updates a Datastore",
                    "A:sisi"),
        DatastoreAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DatastoreRenameXRPC : public RequestXRPC, public DatastoreAPI
{
public:
    DatastoreRenameXRPC() :
        RequestXRPC("one.datastore.rename",
                    "Renames a Datastore",
                    "A:sis"),
        DatastoreAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DatastoreChmodXRPC: public RequestXRPC, public DatastoreAPI
{
public:
    DatastoreChmodXRPC()
        : RequestXRPC("one.datastore.chmod",
                      "Changes permission bits of a Image",
                      "A:siiiiiiiiii")
        , DatastoreAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DatastoreChownXRPC : public RequestXRPC, public DatastoreAPI
{
public:
    DatastoreChownXRPC()
        : RequestXRPC("one.datastore.chown",
                      "Changes ownership of a Datastore",
                      "A:siii")
        , DatastoreAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DatastoreEnableXRPC: public RequestXRPC, public DatastoreAPI
{
public:
    DatastoreEnableXRPC()
        : RequestXRPC("one.datastore.enable",
                      "Enables or disables an Datastore",
                      "A:sib")
        , DatastoreAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class DatastorePoolInfoXRPC : public RequestXRPC, public DatastorePoolAPI
{
public:
    DatastorePoolInfoXRPC()
        : RequestXRPC("one.datastorepool.info",
                      "Returns the Datastore pool",
                      "A:s")
        , DatastorePoolAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

#endif
