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

#include "RequestManagerMarketPlace.h"
#include "Nebula.h"
#include "MarketPlaceManager.h"
#include "MarketPlacePool.h"
#include "MarketPlaceAppPool.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

MarketPlaceEnable::MarketPlaceEnable()
    : Request("one.market.enable", "A:sii", "Enable or disable MarketPlcae")
{
    Nebula& nd = Nebula::instance();
    pool       = nd.get_marketpool();

    auth_object = PoolObjectSQL::MARKETPLACE;
    auth_op     = AuthRequest::MANAGE;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void MarketPlaceEnable::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    Nebula& nd       = Nebula::instance();
    int  id          = xmlrpc_c::value_int(paramList.getInt(1));
    bool enable_flag = xmlrpc_c::value_boolean(paramList.getBoolean(2));
    std::set<int> apps;

    if ( basic_authorization(id, att) == false )
    {
        return;
    }

    if (auto market = pool->get<MarketPlace>(id))
    {
        if ((enable_flag && market->get_state() == MarketPlace::ENABLED) ||
            (!enable_flag && market->get_state() == MarketPlace::DISABLED))
        {
            success_response(id, att);
            return;
        }

        market->enable(enable_flag);

        if (!enable_flag)
        {
            apps = market->get_marketapp_ids();
            market->clear_marketapps();
        }

        pool->update(market.get());
    }
    else
    {
        att.resp_id = id;
        failure_response(NO_EXISTS, att);
        return;
    }

    if (enable_flag)
    {
        auto mm = nd.get_marketm();
        mm->monitor_market(id);
    }
    else
    {
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

                oss << "Cannot remove " << object_name(PoolObjectSQL::MARKETPLACEAPP)
                    << " " << app_id << ": " << app_error << ". ";

                NebulaLog::warn("ReM", oss.str());
            }
        }

    }

    success_response(id, att);
}
