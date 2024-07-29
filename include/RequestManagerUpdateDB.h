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

#ifndef REQUEST_MANAGER_UPDATE_DB_H
#define REQUEST_MANAGER_UPDATE_DB_H

#include "Request.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class RequestManagerUpdateDB: public Request
{
protected:
    RequestManagerUpdateDB(const std::string& name): Request(name, "A:sis",
                                                                 "Updates the DB object from a XML document")
    {
        auth_op = AuthRequest::MANAGE;
    };

    ~RequestManagerUpdateDB() {};

    /* ---------------------------------------------------------------------- */

    virtual void request_execute(xmlrpc_c::paramList const& pl,
                                 RequestAttributes& att) override
    {
        int oid = xmlrpc_c::value_int(pl.getInt(1));
        std::string xml = xmlrpc_c::value_string(pl.getString(2));

        if (!att.is_oneadmin())
        {
            failure_response(AUTHORIZATION, att);
            return;
        }

        ErrorCode ec = request_execute(oid, xml, att);

        if ( ec == SUCCESS )
        {
            success_response(oid, att);
        }
        else
        {
            failure_response(ec, att);
        }
    }

    /* ---------------------------------------------------------------------- */
    /* ---------------------------------------------------------------------- */

    ErrorCode request_execute(int oid, const std::string& xml,
                              RequestAttributes& att)
    {
        auto object = pool->get<PoolObjectSQL>(oid);

        if ( object == 0 )
        {
            att.resp_id = oid;
            return NO_EXISTS;
        }

        std::string old_xml;

        object->to_xml(old_xml);

        if ( object->from_xml(xml) != 0 )
        {
            object->from_xml(old_xml);

            att.resp_msg = "Cannot update object from XML";
            return INTERNAL;
        }

        if ( object->get_oid() != oid )
        {
            object->from_xml(old_xml);

            att.resp_msg = "Consistency check failed";
            return INTERNAL;
        }

        pool->update(object.get());

        return SUCCESS;
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class MarketPlaceAppUpdateDB : public RequestManagerUpdateDB
{
public:
    MarketPlaceAppUpdateDB():RequestManagerUpdateDB("one.marketapp.updatedb")
    {
        auth_object = PoolObjectSQL::MARKETPLACEAPP;
        pool        =  Nebula::instance().get_apppool();
    }

    ~MarketPlaceAppUpdateDB() {};
};

/* -------------------------------------------------------------------------- */

class MarketPlaceUpdateDB : public RequestManagerUpdateDB
{
public:
    MarketPlaceUpdateDB():RequestManagerUpdateDB("one.market.updatedb")
    {
        auth_object = PoolObjectSQL::MARKETPLACE;
        pool        =  Nebula::instance().get_marketpool();
    }

    ~MarketPlaceUpdateDB() {};
};

/* -------------------------------------------------------------------------- */

class ZoneUpdateDB : public RequestManagerUpdateDB
{
public:
    ZoneUpdateDB():RequestManagerUpdateDB("one.zone.updatedb")
    {
        auth_object = PoolObjectSQL::ZONE;
        pool        =  Nebula::instance().get_zonepool();
    }

    ~ZoneUpdateDB() {};

    void request_execute(xmlrpc_c::paramList const& pl,
                         RequestAttributes& att) override
    {
        int oid = xmlrpc_c::value_int(pl.getInt(1));
        std::string xml = xmlrpc_c::value_string(pl.getString(2));

        if (!att.is_oneadmin())
        {
            failure_response(AUTHORIZATION, att);
            return;
        }

        ErrorCode ec = RequestManagerUpdateDB::request_execute(oid, xml, att);

        if ( ec == SUCCESS )
        {
            success_response(oid, att);
        }
        else
        {
            failure_response(ec, att);
        }
    }
};

#endif /* REQUEST_MANAGER_UPDATE_DB_H */
