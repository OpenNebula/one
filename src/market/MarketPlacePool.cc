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

#include "MarketPlacePool.h"
#include "User.h"
#include "Client.h"
#include "Nebula.h"

/* -------------------------------------------------------------------------- */

MarketPlacePool::MarketPlacePool(
        SqlDB * db,
        bool    is_federation_slave)
    :PoolSQL(db, MarketPlace::table, !is_federation_slave, true)
{
    //Federation slaves do not need to init the pool
    if (is_federation_slave)
    {
        return;
    }

    //lastOID is set in PoolSQL::init_cb
    if (get_lastOID() == -1)
    {
        // Build the default default security group
        string default_market =
            "NAME=\"OpenNebula Public\"\n"
            "MARKET_MAD=one\n"
            "DESCRIPTION=\"OpenNebula Systems MarketPlace\"";

        Nebula& nd         = Nebula::instance();
        UserPool * upool   = nd.get_upool();
        User *    oneadmin = upool->get(0, false);

        string error;

        MarketPlaceTemplate * default_tmpl = new MarketPlaceTemplate;
        char * error_parse;

        default_tmpl->parse(default_market, &error_parse);

        MarketPlace * marketplace = new MarketPlace(
                oneadmin->get_uid(),
                oneadmin->get_gid(),
                oneadmin->get_uname(),
                oneadmin->get_gname(),
                oneadmin->get_umask(),
                default_tmpl);

        marketplace->set_permissions(1,1,1, 1,0,0, 1,0,0, error);

        if (PoolSQL::allocate(marketplace, error) < 0)
        {
            ostringstream oss;
            oss << "Error trying to create default "
                << "OpenNebula Systems MarketPlace: " << error;
            NebulaLog::log("MKP", Log::ERROR, oss);

            throw runtime_error(oss.str());
        }

        // The first 100 IDs are reserved for system MarketPlaces.
        // Regular ones start from ID 100

        set_update_lastOID(99);
    }

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int MarketPlacePool::allocate(
        int                   uid,
        int                   gid,
        const std::string&    uname,
        const std::string&    gname,
        int                   umask,
        MarketPlaceTemplate * mp_template,
        int *                 oid,
        std::string&          error_str)
{
    MarketPlace * mp;
    MarketPlace * mp_aux = 0;

    std::string        name;
    std::ostringstream oss;

    // -------------------------------------------------------------------------
    // Build the marketplace object
    // -------------------------------------------------------------------------
    mp = new MarketPlace(uid, gid, uname, gname, umask, mp_template);

    mp->get_template_attribute("NAME", name);

    if ( !PoolObjectSQL::name_is_valid(name, error_str) )
    {
        goto error_name;
    }

    mp->zone_id = Nebula::instance().get_zone_id();

    mp_aux = get(name, false);

    if( mp_aux != 0 )
    {
        goto error_duplicated;
    }

    if (mp->parse_template(error_str) != 0)
    {
        goto error_parse;
    }

    // -------------------------------------------------------------------------
    // Insert the object in the Database
    // -------------------------------------------------------------------------
    if (Nebula::instance().is_federation_slave())
    {
        Client * client = Client::client();

        xmlrpc_c::value         result;
        vector<xmlrpc_c::value> values;

        std::string        mp_xml;
        std::ostringstream oss("Cannot allocate market at federation master: ");

        mp->to_xml(mp_xml);
        delete mp;

        try
        {
            client->call(client->get_endpoint(),
                    "one.market.allocatedb",
                    "ss",
                    &result,
                    client->get_oneauth().c_str(),
                    mp_xml.c_str());
        }
        catch (exception const& e)
        {
            oss << e.what();
            error_str = oss.str();

            return -1;
        }

        values = xmlrpc_c::value_array(result).vectorValueValue();

        if ( xmlrpc_c::value_boolean(values[0]) == false )
        {
            std::string error_xml = xmlrpc_c::value_string(values[1]);

            oss << error_xml;
            error_str = oss.str();

            return -1;
        }

        *oid = xmlrpc_c::value_int(values[1]);

        return *oid;
    }

    *oid = PoolSQL::allocate(mp, error_str);

    return *oid;

error_duplicated:
    oss << "NAME is already taken by MARKETPLACE " << mp_aux->get_oid();
    error_str = oss.str();

error_name:
error_parse:
    delete mp;
    *oid = -1;

    return *oid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int MarketPlacePool::drop(PoolObjectSQL * objsql, std::string& error_msg)
{
    if (Nebula::instance().is_federation_slave())
    {
        NebulaLog::log("ONE",Log::ERROR,
                "MarketPlacePool::drop called, but this "
                "OpenNebula is a federation slave");

        return -1;
    }

    MarketPlace *mp  = static_cast<MarketPlace *>(objsql);

    if( !mp->is_public() && mp->marketapps.size() > 0 )
    {
        std::ostringstream oss;

        oss << "MarketPlace " << mp->get_oid() << " is not empty.";
        error_msg = oss.str();

        NebulaLog::log("MARKETPLACE", Log::ERROR, error_msg);

        return -3;
    }

    return PoolSQL::drop(objsql, error_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int MarketPlacePool::update(PoolObjectSQL * objsql)
{
    if (Nebula::instance().is_federation_slave())
    {
        std::string tmpl_xml;
        Client * client = Client::client();

        xmlrpc_c::value result;
        vector<xmlrpc_c::value> values;

        std::ostringstream oss;

        try
        {
            client->call(client->get_endpoint(),
                    "one.market.updatedb",
                    "sis",
                    &result,
                    client->get_oneauth().c_str(),
                    objsql->get_oid(),
                    objsql->to_xml(tmpl_xml).c_str());
        }
        catch (exception const& e)
        {
            oss << "Cannot update market in federation master db: "<<e.what();
            NebulaLog::log("MKP", Log::ERROR, oss);

            return -1;
        }

        values = xmlrpc_c::value_array(result).vectorValueValue();

        if ( xmlrpc_c::value_boolean(values[0]) == false )
        {
            std::string error = xmlrpc_c::value_string(values[1]);

            oss << "Cannot update market in federation master db: " << error;
            NebulaLog::log("MKP", Log::ERROR, oss);

            return -1;
        }

        return 0;
    }

    return PoolSQL::update(objsql);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

