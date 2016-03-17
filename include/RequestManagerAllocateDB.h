/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

#ifndef REQUEST_MANAGER_ALLOCATE_DB_H
#define REQUEST_MANAGER_ALLOCATE_DB_H

#include "Request.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class RequestManagerAllocateDB: public Request
{
protected:
    RequestManagerAllocateDB(): Request("AllocateDB", "A:ss",
            "Allocates a new object from its template representation")
    {
        auth_op = AuthRequest::MANAGE;
    };

    virtual ~RequestManagerAllocateDB(){};

    virtual PoolObjectSQL * create(const std::string& xml) = 0;

    /* -------------------------------------------------------------------- */

    void request_execute(xmlrpc_c::paramList const& pl, RequestAttributes& att)
    {
        std::string xml = xmlrpc_c::value_string(pl.getString(1));

        if ( att.uid != UserPool::ONEADMIN_ID )
        {
            failure_response(AUTHORIZATION, att);
            return;
        }

        PoolObjectSQL * obj = create(xml);

        int rc = pool->allocate(obj, att.resp_msg);

        if (  rc == -1 )
        {
            failure_response(INTERNAL, att);
            return;
        }

        success_response(rc, att);

        return;
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class MarketPlaceAppAllocateDB: public RequestManagerAllocateDB
{
public:
    MarketPlaceAppAllocateDB(): RequestManagerAllocateDB()
    {
        auth_object = PoolObjectSQL::MARKETPLACEAPP;
        pool        =  Nebula::instance().get_apppool();
    };

    virtual ~MarketPlaceAppAllocateDB(){};

    /* -------------------------------------------------------------------- */

    PoolObjectSQL * create(const std::string& xml)
    {
        PoolObjectSQL * app = static_cast<MarketPlaceAppPool *>(pool)->create();

        app->from_xml(xml);

        return app;
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class MarketPlaceAllocateDB: public RequestManagerAllocateDB
{
public:
    MarketPlaceAllocateDB(): RequestManagerAllocateDB()
    {
        auth_object = PoolObjectSQL::MARKETPLACE;
        pool        =  Nebula::instance().get_marketpool();
    };

    virtual ~MarketPlaceAllocateDB(){};

    /* -------------------------------------------------------------------- */

    PoolObjectSQL * create(const std::string& xml)
    {
        PoolObjectSQL * mp = static_cast<MarketPlacePool *>(pool)->create();

        mp->from_xml(xml);

        return mp;
    }
};

#endif /* REQUEST_MANAGER_ALLOCATE_DB_H */
