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

#include "MarketPlaceAPI.h"
#include "RequestLogger.h"
#include "MarketPlaceAppPool.h"
#include "MarketPlaceManager.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode MarketPlaceAPI::enable(int oid, bool enable_flag, RequestAttributes& att)
{
    Nebula& nd       = Nebula::instance();
    std::set<int> apps;

    if ( auto ec = basic_authorization(oid, att); ec != Request::SUCCESS )
    {
        return ec;
    }

    if (auto market = mppool->get(oid))
    {
        if ((enable_flag && market->get_state() == MarketPlace::ENABLED) ||
            (!enable_flag && market->get_state() == MarketPlace::DISABLED))
        {
            return Request::SUCCESS;
        }

        market->enable(enable_flag);

        if (!enable_flag)
        {
            apps = market->get_marketapp_ids();
            market->clear_marketapps();
        }

        mppool->update(market.get());
    }
    else
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    if (enable_flag)
    {
        auto mm = nd.get_marketm();
        mm->monitor_market(oid);
    }
    else
    {
        MarketPlaceAppPool * apppool = nd.get_apppool();

        string app_error;

        for (auto app_id : apps)
        {
            auto app = apppool->get(app_id);

            if ( !app )
            {
                continue;
            }

            if ( apppool->drop(app.get(), app_error) != 0 )
            {
                ostringstream oss;

                oss << "Cannot remove " << RequestLogger::object_name(PoolObjectSQL::MARKETPLACEAPP)
                    << " " << app_id << ": " << app_error << ". ";

                NebulaLog::warn("ReM", oss.str());
            }
        }

    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int MarketPlaceAPI::drop(std::unique_ptr<PoolObjectSQL> object,
                    bool recursive,
                    RequestAttributes& att)
{
    std::set<int> apps;
    int           mp_id;
    bool          old_monitor;

    {
        unique_ptr<MarketPlace> mp(static_cast<MarketPlace *>(object.release()));

        apps  = mp->get_marketapp_ids();
        mp_id = mp->get_oid();

        bool can_del = mp->is_public() || apps.empty();

        if (!can_del)
        {
            std::ostringstream oss;

            oss << RequestLogger::object_name(PoolObjectSQL::MARKETPLACE) << "  "
                << mp->get_oid() << " is not empty.";
            att.resp_msg = oss.str();

            return -1;
        }

        old_monitor = mp->disable_monitor();
    }

    int rc = 0;

    Nebula& nd = Nebula::instance();

    MarketPlaceAppPool * apppool = nd.get_apppool();

    string app_error;

    for (auto app_id : apps)
    {
        auto app = apppool->get(app_id);

        if ( app == nullptr )
        {
            continue;
        }

        if ( apppool->drop(app.get(), app_error) != 0 )
        {
            ostringstream oss;

            oss << "Cannot remove " << RequestLogger::object_name(PoolObjectSQL::MARKETPLACEAPP)
                << " " << app_id << ": " << app_error << ". ";

            att.resp_msg = att.resp_msg + oss.str();

            rc = -1;
        }
    }

    auto mp = mppool->get(mp_id);

    if (mp == nullptr)
    {
        att.resp_msg = "MarketPlace no longer exists";

        return -1;
    }

    if ( rc == 0 )
    {
        mppool->drop(mp.get(), att.resp_msg);
    }
    else if (old_monitor)
    {
        mp->enable_monitor();
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode MarketPlaceAllocateAPI::pool_allocate(
        std::unique_ptr<Template> tmpl,
        int& id,
        RequestAttributes& att)
{
    unique_ptr<MarketPlaceTemplate> ttmpl(
            static_cast<MarketPlaceTemplate*>(tmpl.release()));

    int rc = mppool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
                              std::move(ttmpl), &id, att.resp_msg);

    return rc < 0 ? Request::ALLOCATE : Request::SUCCESS;
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void MarketPlaceAPI::batch_rename(int oid)
{
    std::set<int>   apps;
    std::string     market_name;

    if ( auto market = mppool->get_ro(oid) )
    {
        apps = market->get_marketapp_ids();

        market_name = market->get_name();
    }
    else
    {
        return;
    }

    MarketPlaceAppPool * apppool = Nebula::instance().get_apppool();

    for (auto app_id : apps)
    {
        if (auto app = apppool->get(app_id))
        {
            if (app->get_market_id() == oid)
            {
                app->set_market_name(market_name);
                apppool->update(app.get());
            }
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

PoolObjectSQL* MarketPlaceAllocateDBAPI::create(const std::string& xml)
{
    PoolObjectSQL * mp = static_cast<MarketPlacePool *>(pool)->create();

    mp->from_xml(xml);

    return mp;
}
