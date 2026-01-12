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

#ifndef SYSTEM_XRPC_H
#define SYSTEM_XRPC_H

#include "RequestXRPC.h"
#include "SystemAPI.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SystemVersionXRPC : public RequestXRPC, public SystemVersionAPI
{
public:
    SystemVersionXRPC() :
        RequestXRPC("one.system.version",
                    "Returns the OpenNebula version",
                    "A:s"),
        SystemVersionAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SystemConfigXRPC : public RequestXRPC, public SystemConfigAPI
{
public:
    SystemConfigXRPC() :
        RequestXRPC("one.system.config",
                    "Returns the OpenNebula configuration",
                    "A:s"),
        SystemConfigAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SystemSqlXRPC : public RequestXRPC, public SystemAPI
{
public:
    SystemSqlXRPC() :
        RequestXRPC("one.system.sql",
                    "Executes and replicates SQL commands on the DB backend",
                    "A:ssb"),
        SystemAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class SystemSqlQueryXRPC : public RequestXRPC, public SystemAPI
{
public:
    SystemSqlQueryXRPC() :
        RequestXRPC("one.system.sqlquery",
                    "Executes SQL queries on the DB backend",
                    "A:ss"),
        SystemAPI(static_cast<Request&>(*this))
    {}

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributesXRPC& att) override;
};

#endif
