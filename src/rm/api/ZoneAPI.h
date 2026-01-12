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

#ifndef ZONE_API_H
#define ZONE_API_H

#include "Request.h"
#include "SharedAPI.h"
#include "Nebula.h"
#include "ZonePool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

struct ReplicateLogParams {
    int leader_id;
    uint64_t leader_commit;
    unsigned int leader_term;
    uint64_t index;
    unsigned int term;
    uint64_t prev_index;
    unsigned int prev_term;
    uint64_t fed_index;
    std::string sql;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class ZoneAPI: public SharedAPI
{
protected:
    ZoneAPI(Request &r) : SharedAPI(r)
    {
        request.auth_object(PoolObjectSQL::ZONE);
        request.auth_op(AuthRequest::ADMIN);

        zpool = Nebula::instance().get_zonepool();
        pool = zpool;
    };

    virtual ~ZoneAPI() = default;

    /* API calls */
    Request::ErrorCode allocate(const std::string& str_tmpl,
                                int                cluster_id,
                                int&               oid,
                                RequestAttributes& att) override;

    Request::ErrorCode add_server(int oid,
                                  std::string zs_str,
                                  RequestAttributes& att);

    Request::ErrorCode del_server(int oid,
                                  int zs_id,
                                  RequestAttributes& att);

    Request::ErrorCode reset_server(int oid,
                                    int zs_id,
                                    RequestAttributes& att);

    Request::ErrorCode enable(int oid,
                              bool enable,
                              RequestAttributes& att);

    Request::ErrorCode replicate_log(const ReplicateLogParams& params,
                                     RequestAttributes& att);

    Request::ErrorCode vote(unsigned int candidate_term,
                            int candidate_id,
                            uint64_t candidate_log_index,
                            unsigned int candidate_log_term,
                            RequestAttributes& att);

    Request::ErrorCode raft_status(std::string& xml,
                                   RequestAttributes& att);

    Request::ErrorCode replicate_fed_log(uint64_t index,
                                         uint64_t prev,
                                         std::string sql,
                                         RequestAttributes& att);

    /* Helpers */
    int drop(std::unique_ptr<PoolObjectSQL> obj,
             bool recursive,
             RequestAttributes& att) override;

    Request::ErrorCode pool_allocate(std::unique_ptr<Template> tmpl,
                                     int&                       id,
                                     RequestAttributes&         att) override;

    std::unique_ptr<Template> get_object_template() const override
    {
        return std::make_unique<Template>();
    };

    int exist(const std::string& name, int uid) override
    {
        return zpool->exist(name);
    }

    ZonePool * zpool;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class ZoneInfoAPI : public ZoneAPI
{
protected:
    ZoneInfoAPI(Request &r)
        : ZoneAPI(r)
    {
        request.auth_op(AuthRequest::USE_NO_LCK);
        request.leader_only(false);
        request.zone_disabled(true);
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class ZoneUpdateAPI : public ZoneAPI
{
protected:
    ZoneUpdateAPI(Request &r)
        : ZoneAPI(r)
    {
        request.auth_op(AuthRequest::MANAGE);
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class ZoneRenameAPI : public ZoneAPI
{
protected:
    ZoneRenameAPI(Request &r)
        : ZoneAPI(r)
    {
        request.auth_op(AuthRequest::MANAGE);
    }
};


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class ZoneEnableAPI : public ZoneAPI
{
protected:
    ZoneEnableAPI(Request &r) : ZoneAPI(r)
    {
        request.zone_disabled(true);
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class ZoneReplicateLogAPI : public ZoneAPI
{
protected:
    ZoneReplicateLogAPI(Request &r) : ZoneAPI(r)
    {
        request.log_method_call(false);
        request.leader_only(false);
        request.zone_disabled(true);
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class ZoneVoteAPI : public ZoneAPI
{
protected:
    ZoneVoteAPI(Request &r) : ZoneAPI(r)
    {
        request.leader_only(false);
        request.zone_disabled(true);
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class ZoneRaftStatusAPI : public ZoneAPI
{
protected:
    ZoneRaftStatusAPI(Request &r) : ZoneAPI(r)
    {
        request.leader_only(false);
        request.zone_disabled(true);
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class ZoneReplicateFedLogAPI : public ZoneAPI
{
protected:
    ZoneReplicateFedLogAPI(Request &r) : ZoneAPI(r)
    {
        request.log_method_call(false);
        request.zone_disabled(true);
    }
};

#endif
