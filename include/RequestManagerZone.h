/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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

#ifndef REQUEST_MANAGER_ZONE_H
#define REQUEST_MANAGER_ZONE_H

#include "Request.h"
#include "Nebula.h"
#include "ZonePool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerZone: public Request
{
protected:
    RequestManagerZone(const std::string& method_name,
                       const std::string& help,
                       const std::string& params)
        :Request(method_name, params, help)
    {
        Nebula& nd = Nebula::instance();
        pool       = nd.get_zonepool();

        auth_object = PoolObjectSQL::ZONE;
        auth_op     = AuthRequest::ADMIN;
    };

    ~RequestManagerZone() {};
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ZoneAddServer : public RequestManagerZone
{
public:
    ZoneAddServer():
        RequestManagerZone("one.zone.addserver", "Add a server to zone",
                           "A:sis") {};

    ~ZoneAddServer() {};

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class ZoneDeleteServer : public RequestManagerZone
{
public:
    ZoneDeleteServer():
        RequestManagerZone("one.zone.delserver", "Delete a server from zone",
                           "A:sii") {};

    ~ZoneDeleteServer() {};

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class ZoneResetServer : public RequestManagerZone
{
public:
    ZoneResetServer():
        RequestManagerZone("one.zone.resetserver", "Reset server log index",
                           "A:sis") {};

    ~ZoneResetServer() {};

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class ZoneReplicateLog : public RequestManagerZone
{
public:
    ZoneReplicateLog():
        RequestManagerZone("one.zone.replicate", "Replicate a log record",
                           "A:siiiiiiis")
    {
        log_method_call = false;
        leader_only     = false;
        zone_disabled   = true;
    };

    ~ZoneReplicateLog() {};

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class ZoneVoteRequest : public RequestManagerZone
{
public:
    ZoneVoteRequest(): RequestManagerZone("one.zone.voterequest",
                                              "Request vote from a candidate", "A:siiii")
    {
        leader_only = false;
        zone_disabled = true;
    };

    ~ZoneVoteRequest() {};

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class ZoneRaftStatus : public RequestManagerZone
{
public:
    ZoneRaftStatus(): RequestManagerZone("one.zone.raftstatus",
                                             "Returns Raft status", "A:s")
    {
        leader_only = false;
        zone_disabled = true;
    };

    ~ZoneRaftStatus() {};

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class ZoneReplicateFedLog : public RequestManagerZone
{
public:
    ZoneReplicateFedLog():
        RequestManagerZone("one.zone.fedreplicate", "Replicate a fed log record",
                           "A:sis")
    {
        log_method_call = false;
        zone_disabled   = true;
    };

    ~ZoneReplicateFedLog() {};

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class ZoneEnable : public RequestManagerZone
{
public:
    ZoneEnable():
        RequestManagerZone("one.zone.enable", "Enable or disable zone",
                           "A:sii")
    {
        log_method_call = true;
        zone_disabled   = true;
    }

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att) override;
};

#endif
