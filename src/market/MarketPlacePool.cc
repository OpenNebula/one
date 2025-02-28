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

#include "MarketPlacePool.h"
#include "User.h"
#include "Client.h"
#include "Nebula.h"

using namespace std;

/* -------------------------------------------------------------------------- */

MarketPlacePool::MarketPlacePool(SqlDB * db, bool is_federation_slave)
    :PoolSQL(db, one_db::mp_table)
{
    //Federation slaves do not need to init the pool
    if (is_federation_slave)
    {
        return;
    }

    //lastOID is set in PoolSQL::init_cb
    if (get_lastOID() == -1)
    {
        // Build the template for the OpenNebula Systems MarketPlace
        const string default_market =
                "NAME=\"OpenNebula Public\"\n"
                "MARKET_MAD=one\n"
                "DESCRIPTION=\"OpenNebula Systems MarketPlace\"";

        const string lxc_market =
                "NAME=\"Linux Containers\"\n"
                "STATE=DISABLED\n"
                "MARKET_MAD=linuxcontainers\n"
                "DESCRIPTION=\"MarketPlace for the public image server fo LXC &"
                " LXD hosted at linuxcontainers.org\"";

        auto oneadmin = Nebula::instance().get_upool()->get_ro(0);

        auto default_tmpl = make_unique<MarketPlaceTemplate>();
        auto lxc_tmpl     = make_unique<MarketPlaceTemplate>();

        char * error_parse;

        default_tmpl->parse(default_market, &error_parse);
        lxc_tmpl->parse(lxc_market, &error_parse);

        MarketPlace marketplace {
                oneadmin->get_uid(),
                oneadmin->get_gid(),
                oneadmin->get_uname(),
                oneadmin->get_gname(),
                oneadmin->get_umask(),
                std::move(default_tmpl)};

        MarketPlace lxc_marketplace {
                oneadmin->get_uid(),
                oneadmin->get_gid(),
                oneadmin->get_uname(),
                oneadmin->get_gname(),
                oneadmin->get_umask(),
                std::move(lxc_tmpl)};

        string error;
        marketplace.set_permissions(1, 1, 1, 1, 0, 0, 1, 0, 0, error);
        lxc_marketplace.set_permissions(1, 1, 1, 1, 0, 0, 1, 0, 0, error);

        marketplace.zone_id = Nebula::instance().get_zone_id();
        lxc_marketplace.zone_id = Nebula::instance().get_zone_id();

        marketplace.parse_template(error);
        lxc_marketplace.parse_template(error);

        int rc = PoolSQL::allocate(marketplace, error);

        rc += PoolSQL::allocate(lxc_marketplace, error);

        if (rc < 0)
        {
            ostringstream oss;
            oss << "Error trying to create default marketplaces: " << error;
            NebulaLog::log("MKP", Log::ERROR, oss);

            throw runtime_error(oss.str());
        }

        // The first 100 IDs are reserved for system MarketPlaces.
        // Regular ones start from ID 100
        set_lastOID(99);
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
        unique_ptr<MarketPlaceTemplate> mp_template,
        int *                 oid,
        std::string&          error_str)
{
    // -------------------------------------------------------------------------
    // Build the marketplace object
    // -------------------------------------------------------------------------
    MarketPlace mp {uid, gid, uname, gname, umask, std::move(mp_template)};

    std::string name;
    mp.get_template_attribute("NAME", name);

    *oid = -1;
    if ( !PoolObjectSQL::name_is_valid(name, error_str) )
    {
        return *oid;
    }

    mp.zone_id = Nebula::instance().get_zone_id();

    const auto db_oid = exist(name);

    if( db_oid != -1 )
    {
        std::stringstream oss;

        oss << "NAME is already taken by MARKETPLACE " << db_oid;
        error_str = oss.str();

        return *oid;
    }

    if (mp.parse_template(error_str) != 0)
    {
        return *oid;
    }

    // -------------------------------------------------------------------------
    // Insert the object in the Database
    // -------------------------------------------------------------------------
    if (Nebula::instance().is_federation_slave())
    {
        Client * client = Client::client();

        xmlrpc_c::value         result;
        vector<xmlrpc_c::value> values;

        std::ostringstream oss;
        oss << "Cannot allocate market at federation master: ";

        std::string mp_xml;

        mp.to_xml(mp_xml);

        try
        {
            client->call("one.market.allocatedb", "s", &result, mp_xml.c_str());
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
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int MarketPlacePool::drop(PoolObjectSQL * objsql, std::string& error_msg)
{
    if (Nebula::instance().is_federation_slave())
    {
        NebulaLog::log("ONE", Log::ERROR,
                       "MarketPlacePool::drop called, but this "
                       "OpenNebula is a federation slave");

        return -1;
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
            client->call("one.market.updatedb", "is", &result, objsql->get_oid(),
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

