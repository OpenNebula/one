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

#include "MarketPlaceAppPool.h"
#include "Nebula.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int MarketPlaceAppPool:: allocate(
            int                uid,
            int                gid,
            const std::string& uname,
            const std::string& gname,
            int                umask,
            MarketPlaceAppTemplate * apptemplate,
            int                mp_id,
            const std::string& mp_name,
            const std::string& mp_data,
            int *              oid,
            std::string&       error_str)
{
    MarketPlaceApp * mp;
    MarketPlaceApp * mp_aux = 0;

    Nebula&                   nd = Nebula::instance();
    MarketPlaceManager * marketm = nd.get_marketm();

    std::string name;

    std::ostringstream oss;

    mp = new MarketPlaceApp(uid, gid, uname, gname, umask, apptemplate);

    mp->market_id   = mp_id;
    mp->market_name = mp_name;

    mp->state = MarketPlaceApp::INIT;

    mp->remove_template_attribute("IMPORTED");

    // -------------------------------------------------------------------------
    // Check name & duplicates
    // -------------------------------------------------------------------------
    mp->get_template_attribute("NAME", name);

    if ( !PoolObjectSQL::name_is_valid(name, error_str) )
    {
        goto error_name;
    }

    mp_aux = get(name, uid, false);

    if( mp_aux != 0 )
    {
        goto error_duplicated;
    }

    *oid = PoolSQL::allocate(mp, error_str);

    if ( *oid != -1 )
    {
        if (marketm->import_app(*oid, mp_data, error_str) == -1)
        {
            MarketPlaceApp * app = get(*oid, true);

            if ( app != 0 )
            {
                string aux_str;

                drop(app, aux_str);

                app->unlock();
            }

            *oid = -1;
        }
    }

    return *oid;

error_duplicated:
    oss << "NAME is already taken by MARKETPLACEAPP " << mp_aux->get_oid();
    error_str = oss.str();

error_name:
    delete mp;
    *oid = -1;

    return *oid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int MarketPlaceAppPool::import(const std::string& t64, int mp_id,
        const std::string& mp_name, std::string& error_str)
{
    MarketPlaceApp * app = new MarketPlaceApp(UserPool::ONEADMIN_ID,
        GroupPool::ONEADMIN_ID, UserPool::oneadmin_name,
        GroupPool::ONEADMIN_NAME, 0133, 0);

    int rc = app->from_template64(t64, error_str);

    if ( rc != 0 )
    {
        delete app;
        return -1;
    }

    app->market_id   = mp_id;
    app->market_name = mp_name;

    if ( !PoolObjectSQL::name_is_valid(app->name, error_str) )
    {
        std::ostringstream oss;

        oss << "imported-" << app->get_origin_id();
        app->name = oss.str();

        if ( !PoolObjectSQL::name_is_valid(app->name, error_str) )
        {
            error_str = "Cannot generate a valida name for app";
            return -1;
        }
    }

    MarketPlaceApp * mp_aux = get(app->name, 0, false);

    if( mp_aux != 0 )
    {
        //Marketplace app already imported
        delete app;
        return -2;
    }

    return PoolSQL::allocate(app, error_str);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int MarketPlaceAppPool::update(PoolObjectSQL * objsql)
{
    if (Nebula::instance().is_federation_slave())
    {
        NebulaLog::log("ONE",Log::ERROR,
                "MarketPlaceAppPool::update called, but this "
                "OpenNebula is a federation slave");

        return -1;
    }

    return PoolSQL::update(objsql);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

