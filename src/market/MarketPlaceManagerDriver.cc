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

#include "MarketPlaceManagerDriver.h"
#include "Nebula.h"
#include <sstream>

/* ************************************************************************** */
/* Driver ASCII Protocol Implementation                                       */
/* ************************************************************************** */

void MarketPlaceManagerDriver::importapp(int oid, const std::string& msg) const
{
    std::ostringstream os;

    os << "IMPORT " << oid << " " << msg << endl;

    write(os);
}

/* -------------------------------------------------------------------------- */

void MarketPlaceManagerDriver::deleteapp(int oid, const std::string& msg) const
{
    std::ostringstream os;

    os << "DELETE " << oid << " " << msg << endl;

    write(os);
}

/* -------------------------------------------------------------------------- */

void MarketPlaceManagerDriver::monitor(int oid, const std::string& msg) const
{
    std::ostringstream os;

    os << "MONITOR " << oid << " " << msg << endl;

    write(os);
}

/* ************************************************************************** */
/* MAD Interface                                                              */
/* ************************************************************************** */

static void monitor_action(
        std::istringstream&  is,
        MarketPlacePool *    marketpool,
        MarketPlaceAppPool * apppool,
        MarketPlaceManager * marketm,
        int                  id,
        const std::string&   result)
{
    std::string  info64;
    std::string* info = 0;

    std::ostringstream oss;

    getline (is, info64);

    if (is.fail())
    {
        oss << "Error monitoring marketplace " << id << ". Bad monitor data: "
            << info64;

        NebulaLog::log("MKP", Log::ERROR, oss);
        return;
    }

    if (result != "SUCCESS")
    {
        oss << "Error monitoring datastore " << id << ": " << info64;
        NebulaLog::log("MKP", Log::ERROR, oss);

        delete info;
        return;
    }

    info = one_util::base64_decode(info64);

    if (info == 0)
    {
        oss << "Error monitoring marketplace " << id << ". Bad monitor data: "
            << info64;

        NebulaLog::log("MKP", Log::ERROR, oss);
        return;
    }


    Template monitor_data;

    char * error_msg;
    int    rc = monitor_data.parse(*info, &error_msg);

    delete info;

    if ( rc != 0 )
    {
        oss << "Error parsing marketplace information: " << error_msg
            << ". Monitoring information: " << endl << *info;

        NebulaLog::log("MKP", Log::ERROR, oss);

        free(error_msg);
        return;
    }

    std::string   name;
    MarketPlace * market = marketpool->get(id, true);

    if (market == 0 )
    {
        return;
    }

    name    = market->get_name();

    market->update_monitor(monitor_data);

    marketpool->update(market);

    market->unlock();

    std::vector<SingleAttribute *> apps;
    std::string err;

    int num = monitor_data.get("APP", apps);

    for (int i=0; i< num ; i++)
    {
        int rc = apppool->import(apps[i]->value(), id, name, err);

        if ( rc == -1 )
        {
            NebulaLog::log("MKP", Log::ERROR, "Error importing app: " + err);
        }
        else if ( rc >= 0 ) //-2 means app already imported
        {
            MarketPlace * market = marketpool->get(id, true);

            if ( market != 0 )
            {
                market->add_marketapp(rc);

                marketpool->update(market);

                market->unlock();
            }
        }
    }

    oss << "Marketplace " << name << " (" << id << ") successfully monitored.";

    NebulaLog::log("MKP", Log::DEBUG, oss);

    return;
}

/* -------------------------------------------------------------------------- */
/* Helper functions for failure and error conditions                          */
/* -------------------------------------------------------------------------- */

static void set_failure_response(
        std::istringstream * is,
        PoolObjectSQL *     obj,
        const std::string&  msg)
{
    std::ostringstream oss;
    std::string        info;

    oss << msg;

    getline(*is, info);

    if (!info.empty() && (info[0] != '-'))
    {
        oss << ": " << info;
    }

    if (obj != 0)
    {
        obj->set_template_error_message(oss.str());
    }

    NebulaLog::log("MKP", Log::ERROR, oss);
}

static void app_failure_action(
        std::istringstream * is,
        MarketPlaceAppPool * apppool,
        int                  id,
        const std::string&   msg)
{
    MarketPlaceApp * app = apppool->get(id, true);

    if (app == 0)
    {
        return;
    }

    if ( is == 0)
    {
        app->set_template_error_message(msg);

        NebulaLog::log("MKP", Log::ERROR, msg);
    }
    else
    {
        set_failure_response(is, app, msg);
    }

    app->set_state(MarketPlaceApp::ERROR);

    apppool->update(app);

    app->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static int import_action(
        std::istringstream&  is,
        MarketPlaceAppPool * apppool,
        MarketPlaceManager * marketm,
        int                  id,
        const std::string&   result)
{
    bool rc;
    int  rci;

    std::string   error;
    std::string   info64;
    std::string * info;

    MarketPlaceApp *       app;
    MarketPlaceAppTemplate tmpl;

    std::string source;
    std::string checksum;
    std::string format;
    long long   size_mb;

    marketm->release_app_resources(id);

    if ( result == "FAILURE" )
    {
        app_failure_action(&is, apppool, id, "Error importing app into marketplace");
        return -1;
    }

    getline(is, info64);

    if (is.fail())
    {
        goto error_parse;
    }

    info = one_util::base64_decode(info64);

    if ( info == 0 )
    {
        goto error_decode64;
    }

    rci = tmpl.parse_str_or_xml(*info, error);

    delete info;

    if ( rci != 0 )
    {
        goto error_parse_template;
    }

    tmpl.get("SOURCE", source);
    tmpl.get("MD5", checksum);
    tmpl.get("FORMAT", format);
    rc = tmpl.get("SIZE", size_mb);

    if ( source.empty() || checksum.empty() || format.empty() || rc == false )
    {
        goto error_attributes;
    }

    app = apppool->get(id, true);

    if (app == 0)
    {
        goto error_app;
    }

    app->set_source(source);
    app->set_md5(checksum);
    app->set_size(size_mb);
    app->set_format(format);

    app->set_state(MarketPlaceApp::READY);

    apppool->update(app);

    app->unlock();

    NebulaLog::log("MKP", Log::INFO, "Marketplace app successfully imported");

    return 0;

error_parse:
    app_failure_action(0, apppool, id,
        "Error importing app into marketplace. Wrong message from driver.");
    return -1;

error_decode64:
    app_failure_action(0, apppool, id,
        "Error importing app into marketplace. Bad base64 encoding.");
    return -1;

error_parse_template:
    app_failure_action(0, apppool, id,
        "Error importing app into marketplace. Parse error: " + error);
    return -1;

error_attributes:
    app_failure_action(0, apppool, id,
        "Error importing app into marketplace. Missing app attributes.");
    return -1;

error_app:
    NebulaLog::log("MKP", Log::ERROR, "Marketplace app successfully imported "
        "but it no longer exists. You may need to manually remove: " + source);
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static int delete_action(
        std::istringstream&  is,
        MarketPlaceAppPool * apppool,
        MarketPlaceManager * marketm,
        int                  id,
        const std::string&   result)
{
    int rc;

    std::string source;
    std::string error;

    std::ostringstream eoss("Error removing app from marketplace");

    MarketPlaceApp * app = apppool->get(id, true);

    if ( app == 0 )
    {
        return -1;
    }

    source = app->get_source();

    rc = apppool->drop(app, error);

    app->unlock();

    if ( result == "FAILURE" )
    {
        std::string info;

        getline(is, info);

        if (!info.empty() && (info[0] != '-'))
        {
            eoss << ": " << info;
        }

        eoss << ".";
    }

    if ( rc < 0 )
    {
        eoss << " Error removing app from DB: " << error
             << ". Remove app manually, source is: " << source;
    }

    if ( rc < 0 || result == "FAILURE" )
    {
        NebulaLog::log("MKP", Log::ERROR, eoss.str());
    }
    else
    {
        NebulaLog::log("MKP",Log::INFO,"Marketplace app successfully removed.");
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MarketPlaceManagerDriver::protocol(const string& message) const
{
    std::istringstream is(message);
    std::ostringstream oss;

    std::string action;
    std::string result;
    std::string info;

    int id;

    oss << "Message received: " << message;
    NebulaLog::log("MKP", Log::DDEBUG, oss);

    // --------------------- Parse the driver message --------------------------

    if ( is.good() )
        is >> action >> ws;
    else
        return;

    if ( is.good() )
        is >> result >> ws;
    else
        return;

    if ( is.good() )
    {
        is >> id >> ws;

        if ( is.fail() )
        {
            if ( action == "LOG" )
            {
                is.clear();
                getline(is,info);

                NebulaLog::log("MKP",log_type(result[0]), info.c_str());
            }

            return;
        }
    }
    else
        return;

    if (action == "IMPORT")
    {
        import_action(is, apppool, marketm, id, result);
    }
    else if (action == "DELETE")
    {
        delete_action(is, apppool, marketm, id, result);
    }
    else if (action == "MONITOR")
    {
        monitor_action(is, marketpool, apppool, marketm, id, result);
    }
    else if (action == "LOG")
    {
        getline(is,info);
        NebulaLog::log("MKP", log_type(result[0]), info.c_str());
    }

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MarketPlaceManagerDriver::recover()
{
    NebulaLog::log("MKP",Log::INFO,"Recovering MarketPlace drivers");
}

