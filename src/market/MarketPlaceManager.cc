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

#include "MarketPlaceManager.h"
#include "MarketPlacePool.h"
#include "MarketPlaceAppPool.h"
#include "MarketPlaceManagerDriver.h"

#include "NebulaLog.h"
#include "Nebula.h"

const char * MarketPlaceManager::market_driver_name = "market_exe";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" void * marketplace_action_loop(void *arg)
{
    MarketPlaceManager * mpm;

    if ( arg == 0 )
    {
        return 0;
    }

    NebulaLog::log("MKP", Log::INFO, "Marketplace Manager started.");

    mpm = static_cast<MarketPlaceManager *>(arg);

    mpm->am.loop(mpm->timer_period, 0);

    NebulaLog::log("MKP", Log::INFO, "Marketplace Manager stopped.");

    return 0;
}
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

MarketPlaceManager::MarketPlaceManager(
            time_t _timer_period,
            time_t _monitor_period,
            std::vector<const VectorAttribute*>& _mads):
        MadManager(_mads),
        timer_period(_timer_period),
        monitor_period(_monitor_period),
        imagem(0)
{
    Nebula& nd = Nebula::instance();

    mppool  = nd.get_marketpool();
    apppool = nd.get_apppool();
    dspool  = nd.get_dspool();
    ipool   = nd.get_ipool();

    am.addListener(this);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int MarketPlaceManager::load_mads(int uid)
{
    MarketPlaceManagerDriver * marketm_mad;

    std::ostringstream      oss;
    const VectorAttribute * vattr = 0;

    int rc;

    NebulaLog::log("MKP", Log::INFO,"Loading Marketplace Manager driver.");

    if ( mad_conf.size() > 0 )
    {
        vattr = static_cast<const VectorAttribute *>(mad_conf[0]);
    }

    if ( vattr == 0 )
    {
        NebulaLog::log("MKP", Log::INFO,"Failed to load Marketplace Manager driver.");
        return -1;
    }

    VectorAttribute market_conf("MARKET_MAD", vattr->value());

    market_conf.replace("NAME", market_driver_name);

    marketm_mad= new MarketPlaceManagerDriver(0, market_conf.value(), false,
            mppool, apppool, this);

    rc = add(marketm_mad);

    if ( rc == 0 )
    {
        oss.str("");
        oss << "\tMarketplace Manager loaded";

        NebulaLog::log("MKP", Log::INFO, oss);
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MarketPlaceManager::init_managers()
{
    Nebula& nd = Nebula::instance();

    imagem = nd.get_imagem();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int MarketPlaceManager::start()
{
    int            rc;
    pthread_attr_t pattr;

    rc = MadManager::start();

    if ( rc != 0 )
    {
        return -1;
    }

    NebulaLog::log("ImM",Log::INFO,"Starting Marketplace Manager...");

    pthread_attr_init (&pattr);
    pthread_attr_setdetachstate (&pattr, PTHREAD_CREATE_JOINABLE);

    rc = pthread_create(&marketm_thread, &pattr, marketplace_action_loop,
            (void *) this);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MarketPlaceManager::do_action(const string &action, void * arg)
{
    if (action == ACTION_TIMER)
    {
        timer_action();
    }
    else if (action == ACTION_FINALIZE)
    {
        NebulaLog::log("MKP", Log::INFO, "Stopping Marketplace Manager...");
        MadManager::stop();
    }
    else
    {
        std::ostringstream oss;
        oss << "Unknown action name: " << action;

        NebulaLog::log("MKP", Log::ERROR, oss);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string * MarketPlaceManager::format_message(
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

    return one_util::base64_encode(oss.str());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MarketPlaceManager::timer_action()
{
    static int mark = 0;
    static int tics = monitor_period;

    mark += timer_period;
    tics += timer_period;

    if ( mark >= 600 )
    {
        NebulaLog::log("MKP",Log::INFO,"--Mark--");
        mark = 0;
    }

    if ( tics < monitor_period )
    {
        return;
    }

    tics = 0;

    int rc;

    std::vector<int> markets;
    std::vector<int>::iterator it;

    rc = mppool->list(markets);

    if ( rc != 0 )
    {
        return;
    }

    for(it = markets.begin() ; it != markets.end(); it++)
    {
        monitor_market(*it);
    }

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MarketPlaceManager::monitor_market(int mp_id)
{
    std::string  mp_data;
    std::string  mp_name;
    std::string* drv_msg;

    std::ostringstream oss;

    const MarketPlaceManagerDriver* mpmd = get();

    if ( mpmd == 0 )
    {
        oss << "Error getting MarketPlaceManagerDriver";

        NebulaLog::log("MKP", Log::ERROR, oss);
        return;
    }

    MarketPlace * mp = mppool->get(mp_id, true);

    if ( mp == 0 )
    {
        return;
    }

    mp_name = mp->get_name();

    if ( !mp->is_action_supported(MarketPlaceApp::MONITOR) )
    {
        NebulaLog::log("MKP", Log::DEBUG, "Monitoring disabled for market: " +
                mp_name);

        mp->unlock();

        return;
    }

    if ( mp->get_zone_id() != Nebula::instance().get_zone_id() )
    {
        mp->unlock();
        return;
    }

    mp->to_xml(mp_data);

    mp->unlock();

    drv_msg = MarketPlaceManager::format_message("", mp_data, "");

    oss << "Monitoring marketplace " << mp_name  << " (" << mp_id << ")";

    NebulaLog::log("MKP", Log::DEBUG, oss);

    mpmd->monitor(mp_id, *drv_msg);

    delete drv_msg;
}
