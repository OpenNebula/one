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

#include "MarketPlaceManager.h"
#include "MarketPlacePool.h"
#include "MarketPlaceAppPool.h"

#include "Nebula.h"
#include "RaftManager.h"

using namespace std;

const char * MarketPlaceManager::market_driver_name = "market_exe";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

MarketPlaceManager::MarketPlaceManager(
        time_t _timer_period,
        time_t _monitor_period,
        const string& _mad_location)
    : DriverManager(_mad_location)
    , timer_thread(_timer_period, [this]() {timer_action();})
, timer_period(_timer_period)
, monitor_period(_monitor_period)
{
    Nebula& nd = Nebula::instance();

    mppool  = nd.get_marketpool();
    apppool = nd.get_apppool();
    dspool  = nd.get_dspool();
    ipool   = nd.get_ipool();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int MarketPlaceManager::load_drivers(const std::vector<const VectorAttribute*>& _mads)
{
    const VectorAttribute * vattr = nullptr;

    NebulaLog::log("MKP", Log::INFO, "Loading Marketplace Manager driver.");

    if ( _mads.size() > 0 )
    {
        vattr = _mads[0];
    }

    if ( vattr == nullptr )
    {
        NebulaLog::log("MKP", Log::INFO, "Failed to load Marketplace Manager driver.");
        return -1;
    }

    VectorAttribute market_conf("MARKET_MAD", vattr->value());

    market_conf.replace("NAME", market_driver_name);

    if ( load_driver(&market_conf) != 0 )
    {
        NebulaLog::error("MKP", "Unable to load IPAM Manager driver");
        return -1;
    }

    NebulaLog::log("MKP", Log::INFO, "\tMarketplace Manager loaded");

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MarketPlaceManager::init_managers()
{
    Nebula& nd = Nebula::instance();

    imagem = nd.get_imagem();
    raftm  = nd.get_raftm();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int MarketPlaceManager::start()
{
    using namespace std::placeholders; // for _1

    NebulaLog::log("MKP", Log::INFO, "Starting Marketplace Manager...");

    register_action(MarketPlaceManagerMessages::UNDEFINED,
                    &MarketPlaceManager::_undefined);

    register_action(MarketPlaceManagerMessages::IMPORT,
                    bind(&MarketPlaceManager::_import, this, _1));

    register_action(MarketPlaceManagerMessages::DELETE,
                    bind(&MarketPlaceManager::_delete, this, _1));

    register_action(MarketPlaceManagerMessages::MONITOR,
                    bind(&MarketPlaceManager::_monitor, this, _1));

    register_action(MarketPlaceManagerMessages::LOG,
                    &MarketPlaceManager::_log);

    string error;

    if ( DriverManager::start(error) != 0 )
    {
        NebulaLog::error("MKP", error);
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string MarketPlaceManager::format_message(
        const string& app_data,
        const string& market_data,
        const string& extra_data)
{
    ostringstream oss;

    oss << "<MARKET_DRIVER_ACTION_DATA>"
        << app_data
        << market_data
        << extra_data
        << "</MARKET_DRIVER_ACTION_DATA>";

    string base64;
    ssl_util::base64_encode(oss.str(), base64);

    return base64;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MarketPlaceManager::timer_action()
{
    static int mark = 0;
    static int tics = monitor_period - 5; //first monitor in 5 secs

    mark += timer_period;
    tics += timer_period;

    if ( mark >= 600 )
    {
        NebulaLog::log("MKP", Log::INFO, "--Mark--");
        mark = 0;
    }

    if ( tics < monitor_period )
    {
        return;
    }

    tics = 0;

    if (raftm == nullptr || (!raftm->is_leader() && !raftm->is_solo()))
    {
        return;
    }

    int rc;

    std::vector<int> markets;

    rc = mppool->list(markets);

    if ( rc != 0 )
    {
        return;
    }

    for (auto m_id : markets)
    {
        monitor_market(m_id);
    }

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MarketPlaceManager::monitor_market(int mp_id)
{
    std::string  mp_data;
    std::string  mp_name;

    std::ostringstream oss;

    auto mpmd = get();

    if ( mpmd == nullptr )
    {
        oss << "Error getting MarketPlaceManagerDriver";

        NebulaLog::log("MKP", Log::ERROR, oss);
        return;
    }

    if ( auto mp = mppool->get(mp_id) )
    {
        mp_name = mp->get_name();

        if ( !mp->is_action_supported(MarketPlaceApp::MONITOR) )
        {
            NebulaLog::log("MKP", Log::DEBUG, "Monitoring disabled for market: " +
                           mp_name);

            return;
        }

        if ( mp->get_zone_id() != Nebula::instance().get_zone_id() ||
             mp->get_state() == MarketPlace::DISABLED)
        {
            return;
        }

        mp->to_xml(mp_data);
    }
    else
    {
        return;
    }

    string drv_msg(MarketPlaceManager::format_message("", mp_data, ""));

    oss << "Monitoring marketplace " << mp_name  << " (" << mp_id << ")";

    NebulaLog::log("MKP", Log::DEBUG, oss);

    market_msg_t msg(MarketPlaceManagerMessages::MONITOR, "", mp_id, drv_msg);
    mpmd->write(msg);
}
