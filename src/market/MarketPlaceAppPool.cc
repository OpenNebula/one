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

#include "MarketPlaceAppPool.h"
#include "Nebula.h"
#include "Client.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int MarketPlaceAppPool::allocate(
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
    // -------------------------------------------------------------------------
    // Build the marketplace app object
    // -------------------------------------------------------------------------
    MarketPlaceApp mp {uid, gid, uname, gname, umask, move(apptemplate)};

    mp.market_id   = mp_id;
    mp.market_name = mp_name;
    mp.zone_id     = Nebula::instance().get_zone_id();
    mp.state       = MarketPlaceApp::INIT;

    std::string name;
    mp.get_template_attribute("NAME", name);

    *oid = -1;

    if ( !PoolObjectSQL::name_is_valid(name, error_str) )
    {
        return *oid;
    }

    const auto db_oid = exist(name, uid);

    if( db_oid != -1 )
    {
        std::ostringstream oss;

        oss << "NAME is already taken by MARKETPLACEAPP " << db_oid;
        error_str = oss.str();

        return *oid;
    }

    if ( mp.parse_template(error_str) != 0 )
    {
        return *oid;
    }

    // -------------------------------------------------------------------------
    // Insert the object in the Database
    // -------------------------------------------------------------------------
    if (Nebula::instance().is_federation_slave())
    {
        string tmp_xml;
        *oid = Client::client()->market_app_allocate(mp.to_xml(tmp_xml), error_str);

        return *oid;
    }

    *oid = PoolSQL::allocate(mp, error_str);

    return *oid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int MarketPlaceAppPool::drop(PoolObjectSQL * objsql, std::string& error_msg)
{
    if (Nebula::instance().is_federation_slave())
    {
        return Client::client()->market_app_drop(objsql->get_oid(), error_msg);
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
    MarketPlaceApp app{UserPool::ONEADMIN_ID,
                       GroupPool::ONEADMIN_ID, UserPool::oneadmin_name, GroupPool::ONEADMIN_NAME
                       , 0133, 0};

    if ( app.from_template64(t64, error_str) != 0 )
    {
        return -1;
    }

    app.market_id   = mp_id;
    app.market_name = mp_name;
    app.zone_id     = Nebula::instance().get_zone_id();

    if ( !PoolObjectSQL::name_is_valid(app.name, error_str) )
    {
        std::ostringstream oss;

        oss << "imported-" << app.get_origin_id();
        app.name = oss.str();

        if ( !PoolObjectSQL::name_is_valid(app.name, error_str) )
        {
            error_str = "Cannot generate a valid name for app";

            return -1;
        }
    }

    if ( auto mp_aux = get(app.name, 0) ) //Marketplace app already imported
    {
        app_id = mp_aux->oid;

        if ( mp_aux->version != app.version || mp_aux->md5 != app.md5 ||
             mp_aux->source != app.source )
        {
            mp_aux->from_template64(t64, error_str);
            update(mp_aux.get());
        }

        return -2;
    }

    // -------------------------------------------------------------------------
    // Insert the object in the Database
    // -------------------------------------------------------------------------
    if (Nebula::instance().is_federation_slave())
    {
        string tmp_xml;
        app_id = Client::client()->market_app_allocate(app.to_xml(tmp_xml), error_str);

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
        std::string tmp_xml;
        return Client::client()->market_app_update(objsql->get_oid(), objsql->to_xml(tmp_xml));
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
