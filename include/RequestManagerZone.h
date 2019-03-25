/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerZone: public Request
{
protected:
    RequestManagerZone(const string& method_name,
                       const string& help,
                       const string& params)
        :Request(method_name,params,help)
    {
        Nebula& nd = Nebula::instance();
        pool       = nd.get_zonepool();

        auth_object = PoolObjectSQL::ZONE;
        auth_op     = AuthRequest::ADMIN;
    };

    ~RequestManagerZone(){};

    /* -------------------------------------------------------------------- */

    virtual void request_execute(xmlrpc_c::paramList const& _paramList,
                                 RequestAttributes& att) = 0;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ZoneAddServer : public RequestManagerZone
{
public:
    ZoneAddServer():
        RequestManagerZone("one.zone.addserver", "Add a server to zone",
                "A:sis"){};

    ~ZoneAddServer(){};

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class ZoneDeleteServer : public RequestManagerZone
{
public:
    ZoneDeleteServer():
        RequestManagerZone("one.zone.delserver", "Delete a server from zone",
                "A:sii"){};

    ~ZoneDeleteServer(){};

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class ZoneResetServer : public RequestManagerZone
{
public:
    ZoneResetServer():
        RequestManagerZone("one.zone.resetserver", "Reset server log index",
                "A:sis"){};

    ~ZoneResetServer(){};

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);
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
    };

    ~ZoneReplicateLog(){};

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);
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
    };

    ~ZoneVoteRequest(){};

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);
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
    };

    ~ZoneRaftStatus(){};

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);
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
    };

    ~ZoneReplicateFedLog(){};

    void request_execute(xmlrpc_c::paramList const& _paramList,
                         RequestAttributes& att);
};

#endif
