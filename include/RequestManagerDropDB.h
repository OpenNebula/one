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

#ifndef REQUEST_MANAGER_DROP_DB_H
#define REQUEST_MANAGER_DROP_DB_H

#include "Request.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class RequestManagerDropDB: public Request
{
protected:
    RequestManagerDropDB(const std::string& name): Request(name, "A:si",
                                                               "Drops an object from DB")
    {
        auth_op = AuthRequest::MANAGE;
    };

    virtual ~RequestManagerDropDB() {};

    /* -------------------------------------------------------------------- */

    void request_execute(xmlrpc_c::paramList const& pl, RequestAttributes& att) override
    {
        std::string error;
        int oid = xmlrpc_c::value_int(pl.getInt(1));

        if (!att.is_oneadmin())
        {
            failure_response(AUTHORIZATION, att);
            return;
        }

        auto object = pool->get<PoolObjectSQL>(oid);

        if (!object)
        {
            att.resp_id = oid;
            failure_response(NO_EXISTS, att);

            return;
        }

        if ( pool->drop(object.get(), error) != 0 )
        {
            att.resp_msg = error;
            failure_response(ACTION, att);
        }
        else
        {
            success_response(oid, att);
        }

        return;
    }
};

class MarketPlaceAppDropDB : public RequestManagerDropDB
{
public:
    MarketPlaceAppDropDB():RequestManagerDropDB("one.marketapp.dropdb")
    {
        auth_object = PoolObjectSQL::MARKETPLACEAPP;
        pool        =  Nebula::instance().get_apppool();
    }

    ~MarketPlaceAppDropDB() {};
};

#endif /* REQUEST_MANAGER_DROP_DB_H */
