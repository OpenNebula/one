/* -------------------------------------------------------------------------- */
/* Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                */
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
#include "MarketPlace.h"
#include "MarketPlacePool.h"
#include "MarketPlaceAppPool.h"
#include "NebulaLog.h"
// #include "Template.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* Helper functions for failure and error conditions                          */
/* -------------------------------------------------------------------------- */

static void app_failure_action(
        MarketPlaceAppPool * apppool,
        int                  id,
        const string&        msg)
{
    MarketPlaceApp * app = apppool->get(id);

    if (app == nullptr)
    {
        return;
    }

    app->set_template_error_message(msg);

    NebulaLog::error("MKP", msg);

    app->set_state(MarketPlaceApp::ERROR);

    apppool->update(app);

    app->unlock();
}

/* ************************************************************************** */
/* Driver Protocol Implementation                                             */
/* ************************************************************************** */

void MarketPlaceManager::_undefined(unique_ptr<market_msg_t> msg)
{
    NebulaLog::warn("MKP", "Received UNDEFINED msg: " + msg->payload());
}

/* -------------------------------------------------------------------------- */

void MarketPlaceManager::_import(unique_ptr<market_msg_t> msg)
{
    string str_msg;
    msg->write_to(str_msg);
    NebulaLog::ddebug("MKP", "Message received: " + str_msg);

    bool rc;
    int  rci;

    string   error;

    MarketPlaceApp *       app;
    MarketPlaceAppTemplate tmpl;

    string source;
    string checksum;
    string format;
    long long   size_mb;

    int id = msg->oid();

    release_app_resources(id);

    if (msg->status() == "FAILURE")
    {
        app_failure_action(apppool, id, "Error importing app into marketplace: "
            + msg->payload());
        return;
    }

    unique_ptr<string> info(one_util::base64_decode(msg->payload()));

    if (info.get() == nullptr)
    {
        app_failure_action(apppool, id,
            "Error importing app into marketplace. Bad base64 encoding.");
        return;
    }

    rci = tmpl.parse_str_or_xml(*info, error);

    if (rci != 0)
    {
        app_failure_action(apppool, id,
            "Error importing app into marketplace. Parse error: " + error);
        return;
    }

    tmpl.get("SOURCE", source);
    tmpl.get("MD5", checksum);
    tmpl.get("FORMAT", format);
    rc = tmpl.get("SIZE", size_mb);

    if ( source.empty() || checksum.empty() || format.empty() || rc == false )
    {
        app_failure_action(apppool, id,
            "Error importing app into marketplace. Missing app attributes.");
        return;
    }

    app = apppool->get(id);

    if (app == nullptr)
    {
        NebulaLog::error("MKP", "Marketplace app successfully imported "
            "but it no longer exists. You may need to manually remove: " + source);
        return;
    }

    app->set_source(source);
    app->set_md5(checksum);
    app->set_size(size_mb);
    app->set_format(format);

    app->set_state(MarketPlaceApp::READY);

    apppool->update(app);

    app->unlock();

    NebulaLog::info("MKP", "Marketplace app successfully imported");
}

/* -------------------------------------------------------------------------- */

void MarketPlaceManager::_delete(unique_ptr<market_msg_t> msg)
{
    string str_msg;
    msg->write_to(str_msg);
    NebulaLog::ddebug("MKP", "Message received: " + str_msg);

    int rc;

    string source;
    string error;

    ostringstream eoss("Error removing app from marketplace", ios::ate);

    int id = msg->oid();
    MarketPlaceApp * app = apppool->get(id);

    if (app == nullptr)
    {
        return;
    }

    source = app->get_source();

    rc = apppool->drop(app, error);

    app->unlock();

    if (msg->status() == "FAILURE")
    {
        const string& info = msg->payload();

        if (!info.empty() && (info[0] != '-'))
        {
            eoss << ": " << info;
        }

        eoss << ".";
    }

    if (rc < 0)
    {
        eoss << " Error removing app from DB: " << error
             << ". Remove app manually, source is: " << source;
    }

    if (rc < 0 || msg->status() == "FAILURE")
    {
        NebulaLog::error("MKP", eoss.str());
    }
    else
    {
        NebulaLog::info("MKP", "Marketplace app successfully removed.");
    }
}

/* -------------------------------------------------------------------------- */

void MarketPlaceManager::_monitor(unique_ptr<market_msg_t> msg)
{
    string str_msg;
    msg->write_to(str_msg);
    NebulaLog::ddebug("MKP", "Message received: " + str_msg);

    ostringstream oss;

    int id = msg->oid();

    if (msg->status() != "SUCCESS")
    {
        oss << "Error monitoring marketplace " << id << ": " << msg->payload();
        NebulaLog::log("MKP", Log::ERROR, oss);

        return;
    }

    unique_ptr<string> info(one_util::base64_decode(msg->payload()));

    if (info.get() == nullptr)
    {
        oss << "Error monitoring marketplace " << id << ". Bad monitor data: "
            << msg->payload();

        NebulaLog::log("MKP", Log::ERROR, oss);
        return;
    }

    Template monitor_data;

    char * error_msg;
    int    rc = monitor_data.parse(*info, &error_msg);

    if (rc != 0)
    {
        oss << "Error parsing marketplace information: " << error_msg
            << ". Monitoring information: " << endl << *info;

        NebulaLog::log("MKP", Log::ERROR, oss);

        free(error_msg);
        return;
    }

    MarketPlace * market = mppool->get(id);

    if (market == nullptr)
    {
        return;
    }

    set<int> apps_mp = market->get_marketapp_ids();
    string name = market->get_name();

    market->update_monitor(monitor_data);

    mppool->update(market);

    market->unlock();

    vector<SingleAttribute *> apps;
    string err;

    int num = monitor_data.get("APP", apps);

    for (int i=0; i< num; i++)
    {
        int app_id;
        int rc = apppool->import(apps[i]->value(), id, name, app_id, err);

        if (rc == -1)
        {
            NebulaLog::error("MKP", "Error importing app: " + err);
        }
        else if (rc >= 0) //-2 means app already imported
        {
            MarketPlace * market = mppool->get(id);

            if (market != nullptr)
            {
                market->add_marketapp(rc);

                mppool->update(market);

                market->unlock();
            }
        }

        apppool->reset_map_check(app_id);

        apps_mp.erase(app_id);
    }

    if (num > 0) // num = 0 when no APP information in monitor data
    {
        for (int i : apps_mp)
        {
            if (apppool->test_map_check(i)) //delete app
            {
                string error;

                MarketPlaceApp * app = apppool->get(i);

                if (app == nullptr)
                {
                    continue;
                }

                rc = apppool->drop(app, error);

                app->unlock();

                market = mppool->get(id);

                market->del_marketapp(i);

                mppool->update(market);

                market->unlock();
            }
        }
    }

    oss << "Marketplace " << name << " (" << id << ") successfully monitored.";

    NebulaLog::debug("MKP", oss.str());

    return;
}

/* -------------------------------------------------------------------------- */

void MarketPlaceManager::_log(unique_ptr<market_msg_t> msg)
{
    NebulaLog::log("MKP", log_type(msg->status()[0]), msg->payload());
}

/* -------------------------------------------------------------------------- */
