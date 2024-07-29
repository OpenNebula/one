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

#include "MarketPlaceAppPool.h"
#include "Nebula.h"
#include "Client.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static int master_allocate(MarketPlaceApp * mp, string& error)
{
    Client * client = Client::client();

    xmlrpc_c::value         result;
    vector<xmlrpc_c::value> values;

    std::string        mp_xml;
    std::ostringstream oss("Cannot allocate marketapp at federation master: ",
                           std::ios::ate);

    mp->to_xml(mp_xml);

    try
    {
        client->call("one.marketapp.allocatedb", "s", &result, mp_xml.c_str());
    }
    catch (exception const& e)
    {
        oss << e.what();
        error = oss.str();

        return -1;
    }

    values = xmlrpc_c::value_array(result).vectorValueValue();

    if ( xmlrpc_c::value_boolean(values[0]) == false )
    {
        std::string error_xml = xmlrpc_c::value_string(values[1]);

        oss << error_xml;
        error = oss.str();

        return -1;
    }

    int oid = xmlrpc_c::value_int(values[1]);

    return oid;
}

/* -------------------------------------------------------------------------- */

int MarketPlaceAppPool:: allocate(
        int                uid,
        int                gid,
        const std::string& uname,
        const std::string& gname,
        int                umask,
        std::unique_ptr<MarketPlaceAppTemplate> apptemplate,
        int                mp_id,
        const std::string& mp_name,
        int *              oid,
        std::string&       error_str)
{
    MarketPlaceApp * mp;

    int db_oid;

    std::string name;

    std::ostringstream oss;

    // -------------------------------------------------------------------------
    // Build the marketplace app object
    // -------------------------------------------------------------------------
    mp = new MarketPlaceApp(uid, gid, uname, gname, umask, move(apptemplate));

    mp->market_id   = mp_id;
    mp->market_name = mp_name;
    mp->zone_id     = Nebula::instance().get_zone_id();

    mp->state = MarketPlaceApp::INIT;

    mp->get_template_attribute("NAME", name);

    if ( !PoolObjectSQL::name_is_valid(name, error_str) )
    {
        goto error_name;
    }

    db_oid = exist(name, uid);

    if( db_oid != -1 )
    {
        goto error_duplicated;
    }

    if ( mp->parse_template(error_str) != 0 )
    {
        goto error_template;
    }

    // -------------------------------------------------------------------------
    // Insert the object in the Database
    // -------------------------------------------------------------------------
    if (Nebula::instance().is_federation_slave())
    {
        *oid = master_allocate(mp, error_str);

        delete mp;

        return *oid;
    }

    *oid = PoolSQL::allocate(mp, error_str);

    return *oid;

error_duplicated:
    oss << "NAME is already taken by MARKETPLACEAPP " << db_oid;
    error_str = oss.str();

error_name:
error_template:
    delete mp;
    *oid = -1;

    return *oid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int MarketPlaceAppPool::drop(PoolObjectSQL * objsql, std::string& error_msg)
{
    if (Nebula::instance().is_federation_slave())
    {
        Client * client = Client::client();

        xmlrpc_c::value result;
        vector<xmlrpc_c::value> values;

        std::ostringstream oss("Cannot drop marketapp at federation master: ",
                               std::ios::ate);
        try
        {
            client->call("one.marketapp.dropdb", "i", &result, objsql->get_oid());
        }
        catch (exception const& e)
        {
            oss << e.what();

            error_msg = oss.str();
            return -1;
        }

        values = xmlrpc_c::value_array(result).vectorValueValue();

        if ( xmlrpc_c::value_boolean(values[0]) == false )
        {
            std::string error = xmlrpc_c::value_string(values[1]);

            oss << error;

            error_msg = oss.str();
            return -1;
        }

        return 0;
    }

    return PoolSQL::drop(objsql, error_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int MarketPlaceAppPool::import(const std::string& t64, int mp_id,
                               const std::string& mp_name, int& app_id, std::string& error_str)
{
    // -------------------------------------------------------------------------
    // Build the marketplace app object
    // -------------------------------------------------------------------------
    MarketPlaceApp * app = new MarketPlaceApp(UserPool::ONEADMIN_ID,
                                              GroupPool::ONEADMIN_ID, UserPool::oneadmin_name, GroupPool::ONEADMIN_NAME
                                              , 0133, 0);

    if ( app->from_template64(t64, error_str) != 0 )
    {
        delete app;

        return -1;
    }

    app->market_id   = mp_id;
    app->market_name = mp_name;
    app->zone_id     = Nebula::instance().get_zone_id();

    if ( !PoolObjectSQL::name_is_valid(app->name, error_str) )
    {
        std::ostringstream oss;

        oss << "imported-" << app->get_origin_id();
        app->name = oss.str();

        if ( !PoolObjectSQL::name_is_valid(app->name, error_str) )
        {
            error_str = "Cannot generate a valid name for app";

            delete app;

            return -1;
        }
    }

    if ( auto mp_aux = get(app->name, 0) ) //Marketplace app already imported
    {
        app_id = mp_aux->oid;

        if ( mp_aux->version != app->version || mp_aux->md5 != app->md5 ||
             mp_aux->source != app->source )
        {
            mp_aux->from_template64(t64, error_str);
            update(mp_aux.get());
        }

        delete app;

        return -2;
    }

    // -------------------------------------------------------------------------
    // Insert the object in the Database
    // -------------------------------------------------------------------------
    if (Nebula::instance().is_federation_slave())
    {
        app_id = master_allocate(app, error_str);

        delete app;

        return app_id;
    }

    app_id = PoolSQL::allocate(app, error_str);

    return app_id;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int MarketPlaceAppPool::update(PoolObjectSQL * objsql)
{
    if (Nebula::instance().is_federation_slave())
    {
        std::string tmpl_xml;
        Client * client = Client::client();

        xmlrpc_c::value result;
        vector<xmlrpc_c::value> values;

        std::ostringstream oss("Cannot update marketapp at federation master: ",
                               std::ios::ate);

        try
        {
            client->call("one.marketapp.updatedb", "is", &result,
                         objsql->get_oid(), objsql->to_xml(tmpl_xml).c_str());
        }
        catch (exception const& e)
        {
            oss << e.what();
            NebulaLog::log("MKP", Log::ERROR, oss);

            return -1;
        }

        values = xmlrpc_c::value_array(result).vectorValueValue();

        if ( xmlrpc_c::value_boolean(values[0]) == false )
        {
            std::string error = xmlrpc_c::value_string(values[1]);

            oss << error;
            NebulaLog::log("MKP", Log::ERROR, oss);

            return -1;
        }

        return 0;
    }

    return PoolSQL::update(objsql);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
const int MarketPlaceAppPool::MAX_MISSING_MONITORS = 3;

bool MarketPlaceAppPool::test_map_check(int app_id)
{
    auto it = map_check.find(app_id);

    if ( it == map_check.end() )
    {
        map_check.insert(make_pair(app_id, 1));

        return false;
    }

    it->second++;

    bool to_delete = it->second >= MAX_MISSING_MONITORS;

    if ( to_delete )
    {
        map_check.erase(it);
    }

    return to_delete;
}

void MarketPlaceAppPool::reset_map_check(int app_id)
{
    auto it = map_check.find(app_id);

    if ( it == map_check.end() )
    {
        map_check.insert(make_pair(app_id, -1));
    }
    else
    {
        it->second = -1;
    }
}
