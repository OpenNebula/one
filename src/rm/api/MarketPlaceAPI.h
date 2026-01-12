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

#ifndef MARKET_API_H
#define MARKET_API_H

#include "Request.h"
#include "SharedAPI.h"
#include "Nebula.h"
#include "MarketPlacePool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceAPI : public SharedAPI
{
protected:
    MarketPlaceAPI(Request &r)
        : SharedAPI(r)
    {
        request.auth_object(PoolObjectSQL::MARKETPLACE);
        request.auth_op(AuthRequest::MANAGE);

        mppool = Nebula::instance().get_marketpool();
        pool = mppool;
    }

    /* API calls */
    Request::ErrorCode enable(int oid,
                              bool enable_flag,
                              RequestAttributes& att);

    /* Helpers */
    int drop(std::unique_ptr<PoolObjectSQL> obj,
             bool recursive,
             RequestAttributes& att) override;

    int exist(const std::string& name, int uid) override
    {
        return mppool->exist(name);
    }

    void batch_rename(int oid) override;

    Request::ErrorCode check_name_unique(int oid, int noid, RequestAttributes& att) override
    {
        return Request::SUCCESS;
    }

    MarketPlacePool* mppool;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class MarketPlaceAllocateAPI : public MarketPlaceAPI
{
protected:
    MarketPlaceAllocateAPI(Request &r)
        : MarketPlaceAPI(r)
    {
        request.auth_op(AuthRequest::CREATE);
    }

    std::unique_ptr<Template> get_object_template() const override
    {
        return std::make_unique<MarketPlaceTemplate>();
    }

    Request::ErrorCode pool_allocate(std::unique_ptr<Template> tmpl,
                                     int& id,
                                     RequestAttributes& att) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class MarketPlaceInfoAPI : public MarketPlaceAPI
{
protected:
    MarketPlaceInfoAPI(Request &r)
        : MarketPlaceAPI(r)
    {
        request.auth_op(AuthRequest::USE_NO_LCK);
        request.leader_only(false);
        request.zone_disabled(true);
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class MarketPlaceAllocateDBAPI : public MarketPlaceAPI
{
protected:
    MarketPlaceAllocateDBAPI(Request &r)
        : MarketPlaceAPI(r)
    {
        request.auth_op(AuthRequest::MANAGE);
    }

    PoolObjectSQL* create(const std::string& xml) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class MarketPlaceUpdateDBAPI : public MarketPlaceAPI
{
protected:
    MarketPlaceUpdateDBAPI(Request &r)
        : MarketPlaceAPI(r)
    {
        request.auth_op(AuthRequest::MANAGE);
    }
};


#endif
