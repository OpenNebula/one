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

    std::string name;

    ostringstream oss;

    if (Nebula::instance().is_federation_slave())
    {
        NebulaLog::log("ONE",Log::ERROR,
                "MarketPlacePool::allocate called, but this "
                "OpenNebula is a federation slave");

        return -1;
    }

    mp = new MarketPlace(uid, gid, uname, gname, umask, mp_template);

    // -------------------------------------------------------------------------
    // Check name & duplicates
    // -------------------------------------------------------------------------

    mp->get_template_attribute("NAME", name);

    if ( !PoolObjectSQL::name_is_valid(name, error_str) )
    {
        goto error_name;
    }

    mp_aux = get(name, false);

    if( mp_aux != 0 )
    {
        goto error_duplicated;
    }

    *oid = PoolSQL::allocate(mp, error_str);

    return *oid;

error_duplicated:
    oss << "NAME is already taken by MARKETPLACE " << mp_aux->get_oid();
    error_str = oss.str();

error_name:
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

    if( !mp->is_public() && mp->get_collection_size() > 0 )
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
        NebulaLog::log("ONE",Log::ERROR,
                "MarketPlacePool::update called, but this "
                "OpenNebula is a federation slave");

        return -1;
    }

    return PoolSQL::update(objsql);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

