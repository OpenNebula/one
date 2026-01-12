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

#include "MarketPlaceAppAPI.h"
#include "RequestLogger.h"
#include "MarketPlacePool.h"
#include "MarketPlaceManager.h"
#include "ClusterPool.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode MarketPlaceAppAPI::enable(int oid, bool enable_flag, RequestAttributes& att)
{
    if ( auto ec = basic_authorization(oid, att); ec != Request::SUCCESS )
    {
        return ec;
    }

    auto app = appool->get(oid);

    if ( !app )
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    int rc = app->enable(enable_flag, att.resp_msg);

    if ( rc != 0  )
    {
        return Request::INTERNAL;
    }

    appool->update(app.get());

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int MarketPlaceAppAPI::drop(std::unique_ptr<PoolObjectSQL> object,
                            bool recursive,
                            RequestAttributes& att)
{
    Nebula& nd = Nebula::instance();

    MarketPlaceManager * marketm = nd.get_marketm();
    MarketPlacePool * marketpool = nd.get_marketpool();

    MarketPlaceApp * app = static_cast<MarketPlaceApp *>(object.get());

    int mp_id   = app->get_market_id();
    int zone_id = app->get_zone_id();
    int oid     = app->get_oid();

    object.reset();

    if ( zone_id != nd.get_zone_id() )
    {
        std::ostringstream oss;

        oss << "Marketapp can only be deleted from zone " << zone_id;
        att.resp_msg = oss.str();

        return -1;
    }

    std::string mp_name;
    std::string mp_data;

    if ( auto mp = marketpool->get_ro(mp_id) )
    {
        mp_name = mp->get_name();

        if ( !mp->is_action_supported(MarketPlaceApp::DELETE) )
        {
            att.resp_msg = "Delete disabled for market: " + mp_name;

            return -1;
        }

        mp->to_xml(mp_data);
    }
    else
    {
        att.resp_msg = "Cannot find associated  ID = " + to_string(mp_id);

        return -1;
    }

    return marketm->delete_app(oid, mp_data, att.resp_msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode MarketPlaceAppAllocateAPI::allocate(const std::string& tmpl,
                                                       int mp_id,
                                                       int& oid,
                                                       RequestAttributes& att)
{
    _mp_id = mp_id;

    return SharedAPI::allocate(tmpl, ClusterPool::NONE_CLUSTER_ID, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode MarketPlaceAppAllocateAPI::pool_allocate(
        std::unique_ptr<Template> tmpl,
        int& id,
        RequestAttributes& att)
{
    MarketPlaceManager* marketm = Nebula::instance().get_marketm();
    MarketPlacePool* mppool = Nebula::instance().get_marketpool();

    unique_ptr<MarketPlaceAppTemplate> ttmpl(
            static_cast<MarketPlaceAppTemplate *>(tmpl.release()));

    std::string mp_data;
    std::string mp_name;

    // ---------------------------------------------------------------------- //
    // Get Marketplace information for this app                               //
    // ---------------------------------------------------------------------- //
    if ( auto mp = mppool->get_ro(_mp_id) )
    {
        mp_name = mp->get_name();

        if ( !mp->is_action_supported(MarketPlaceApp::CREATE) )
        {
            att.resp_msg = "Create disabled for market: " + mp_name;

            return Request::ACTION;
        }

        if ( mp->get_zone_id() != Nebula::instance().get_zone_id() )
        {
            att.resp_msg = "Marketplace is not in this OpenNebula zone";

            return Request::ACTION;
        }

        mp->to_xml(mp_data);
    }
    else
    {
        att.resp_msg = "Cannot find associated MARKETPLACE ID = " + to_string(_mp_id);

        return Request::INTERNAL;
    }

    // ---------------------------------------------------------------------- //
    // Allocate MarketPlaceApp request is forwarded to master for slaves      //
    // ---------------------------------------------------------------------- //
    int rc = appool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
                              std::move(ttmpl), _mp_id, mp_name, &id, att.resp_msg);

    if (rc < 0)
    {
        return Request::ALLOCATE;
    }

    if ( auto mp = mppool->get(_mp_id) )
    {
        mp->add_marketapp(id);

        mppool->update(mp.get());
    }
    else
    {
        att.resp_msg = "Marketplace no longer exists";

        if ( auto app = appool->get(id) )
        {
            string aux_str;

            appool->drop(app.get(), aux_str);
        }

        return Request::INTERNAL;
    }

    // ---------------------------------------------------------------------- //
    // Send request operation to market driver                                //
    // ---------------------------------------------------------------------- //
    if (marketm->import_app(id, mp_data, att.resp_msg) == -1)
    {
        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

PoolObjectSQL* MarketPlaceAppAllocateDBAPI::create(const std::string& xml)
{
    PoolObjectSQL * app = static_cast<MarketPlaceAppPool *>(pool)->create();

    app->from_xml(xml);

    return app;
}
