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

#ifndef REQUEST_MANAGER_UPDATE_DB_H
#define REQUEST_MANAGER_UPDATE_DB_H

#include "Request.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class RequestManagerUpdateDB: public Request
{
protected:
    RequestManagerUpdateDB(): Request("UpdateDB", "A:sis",
            "Updates the DB object from a XML document")
    {
        auth_op = AuthRequest::MANAGE;
    };

    virtual ~RequestManagerUpdateDB(){};

    /* -------------------------------------------------------------------- */

    void request_execute(xmlrpc_c::paramList const& pl, RequestAttributes& att)
    {
        int oid = xmlrpc_c::value_int(pl.getInt(1));
        std::string xml = xmlrpc_c::value_string(pl.getString(2));

        if ( att.uid != UserPool::ONEADMIN_ID )
        {
            failure_response(AUTHORIZATION, att);
            return;
        }

        PoolObjectSQL * object = pool->get(oid,true);

        if ( object == 0 )
        {
            att.resp_id = oid;
            failure_response(NO_EXISTS, att);
            return;
        }

        string old_xml;

        object->to_xml(old_xml);

        if ( object->from_xml(xml) != 0 )
        {
            object->from_xml(old_xml);

            att.resp_msg = "Cannot update object from XML";
            failure_response(INTERNAL, att);

            object->unlock();
            return;
        }

        if ( object->get_oid() != oid )
        {
            object->from_xml(old_xml);

            att.resp_msg = "Consistency check failed";
            failure_response(INTERNAL, att);

            object->unlock();
            return;
        }

        pool->update(object);

        object->unlock();

        success_response(oid, att);

        return;
    }
};

class MarketPlaceAppUpdateDB : public RequestManagerUpdateDB
{
public:
    MarketPlaceAppUpdateDB():RequestManagerUpdateDB()
    {
        auth_object = PoolObjectSQL::MARKETPLACEAPP;
        pool        =  Nebula::instance().get_apppool();
    }

    ~MarketPlaceAppUpdateDB(){};
};

class MarketPlaceUpdateDB : public RequestManagerUpdateDB
{
public:
    MarketPlaceUpdateDB():RequestManagerUpdateDB()
    {
        auth_object = PoolObjectSQL::MARKETPLACE;
        pool        =  Nebula::instance().get_marketpool();
    }

    ~MarketPlaceUpdateDB(){};
};

#endif /* REQUEST_MANAGER_UPDATE_DB_H */
