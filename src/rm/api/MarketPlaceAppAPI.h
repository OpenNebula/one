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

#ifndef MARKETAPP_API_H
#define MARKETAPP_API_H

#include "Request.h"
#include "SharedAPI.h"
#include "Nebula.h"
#include "MarketPlaceAppPool.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceAppAPI : public SharedAPI
{
protected:
    MarketPlaceAppAPI(Request &r)
        : SharedAPI(r)
    {
        request.auth_object(PoolObjectSQL::MARKETPLACEAPP);
        request.auth_op(AuthRequest::MANAGE);

        appool = Nebula::instance().get_apppool();
        pool = appool;
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
        return appool->exist(name, uid);
    }

    MarketPlaceAppPool* appool;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class MarketPlaceAppAllocateAPI : public MarketPlaceAppAPI
{
protected:
    MarketPlaceAppAllocateAPI(Request &r)
        : MarketPlaceAppAPI(r)
    {
        request.auth_op(AuthRequest::CREATE);
    }

    Request::ErrorCode allocate(const std::string& tmpl,
                                int mp_id,
                                int& oid,
                                RequestAttributes& att) override;

    std::unique_ptr<Template> get_object_template() const override
    {
        return std::make_unique<MarketPlaceAppTemplate>();
    }

    Request::ErrorCode pool_allocate(std::unique_ptr<Template> tmpl,
                                     int& id,
                                     RequestAttributes& att) override;

    int _mp_id = -1;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class MarketPlaceAppInfoAPI : public MarketPlaceAppAPI
{
protected:
    MarketPlaceAppInfoAPI(Request &r)
        : MarketPlaceAppAPI(r)
    {
        request.auth_op(AuthRequest::USE_NO_LCK);
        request.leader_only(false);
        request.zone_disabled(true);
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class MarketPlaceAppAllocateDBAPI : public MarketPlaceAppAPI
{
protected:
    MarketPlaceAppAllocateDBAPI(Request &r)
        : MarketPlaceAppAPI(r)
    {
        request.auth_op(AuthRequest::MANAGE);
    }

    PoolObjectSQL* create(const std::string& xml) override;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class MarketPlaceAppUpdateDBAPI : public MarketPlaceAppAPI
{
protected:
    MarketPlaceAppUpdateDBAPI(Request &r)
        : MarketPlaceAppAPI(r)
    {
        request.auth_op(AuthRequest::MANAGE);
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class MarketPlaceAppDropDBAPI : public MarketPlaceAppAPI
{
protected:
    MarketPlaceAppDropDBAPI(Request &r)
        : MarketPlaceAppAPI(r)
    {
        request.auth_op(AuthRequest::MANAGE);
    }
};

#endif
