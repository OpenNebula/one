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

void MarketPlaceManagerDriver::exportapp(int oid, const std::string& msg) const
{
    std::ostringstream os;

    os << "EXPORT " << oid << " " << msg << endl;

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
/*
static int delete_action(istringstream& is,
                     ImagePool*     ipool,
                     int            id,
                     const string&  result)
{
    int rc;
    int ds_id = -1;

    string  tmp_error;
    string  source;
    string  info;
    Image * image;

    ostringstream oss;

    image = ipool->get(id, true);

    if ( image == 0 )
    {
        return ds_id;
    }

    ds_id  = image->get_ds_id();
    source = image->get_source();

    rc = ipool->drop(image, tmp_error);

    image->unlock();

    if ( result == "FAILURE" )
    {
       goto error;
    }
    else if ( rc < 0 )
    {
        goto error_drop;
    }

    NebulaLog::log("ImM", Log::INFO, "Image successfully removed.");

    return ds_id;

error_drop:
    oss << "Error removing image from DB: " << tmp_error
        << ". Remove image source " << source << " to completely delete image.";

    NebulaLog::log("ImM", Log::ERROR, oss);
    return ds_id;

error:
    oss << "Error removing image from datastore. Manually remove image source "
        << source << " to completely delete the image";

    getline(is,info);

    if (!info.empty() && (info[0] != '-'))
    {
        oss << ": " << info;
    }

    NebulaLog::log("ImM", Log::ERROR, oss);

    return ds_id;
}
*/
/* -------------------------------------------------------------------------- */
/*
static void monitor_action(istringstream& is,
                           DatastorePool* dspool,
                           int            id,
                           const string&  result)
{
    string  dsinfo64;
    string *dsinfo = 0;

    ostringstream oss;

    getline (is, dsinfo64);

    if (is.fail())
    {
        oss << "Error monitoring datastore " << id << ". Bad monitor data: "
            << dsinfo64;

        NebulaLog::log("ImM", Log::ERROR, oss);
        return;
    }

    dsinfo = one_util::base64_decode(dsinfo64);

    if (dsinfo == 0)
    {
        oss << "Error monitoring datastore " << id << ". Bad monitor data: "
            << dsinfo64;

        NebulaLog::log("ImM", Log::ERROR, oss);
        return;
    }

    if (result != "SUCCESS")
    {
        oss << "Error monitoring datastore " << id << ": " << *dsinfo;
        NebulaLog::log("ImM", Log::ERROR, oss);

        delete dsinfo;
        return;
    }

    Template monitor_data;

    char*  error_msg;
    int    rc = monitor_data.parse(*dsinfo, &error_msg);

    if ( rc != 0 )
    {
        oss << "Error parsing datastore information: " << error_msg
            << ". Monitoring information: " << endl << *dsinfo;

        NebulaLog::log("ImM", Log::ERROR, oss);

        delete dsinfo;
        free(error_msg);

        return;
    }

    delete dsinfo;

    float  total, free, used;
    string ds_name;

    monitor_data.get("TOTAL_MB", total);
    monitor_data.get("FREE_MB", free);
    monitor_data.get("USED_MB", used);

    Datastore * ds = dspool->get(id, true);

    if (ds == 0 )
    {
        return;
    }

    ds_name = ds->get_name();

    ds->update_monitor(total, free, used);

    dspool->update(ds);

    ds->unlock();

    oss << "Datastore " << ds_name << " (" << id << ") successfully monitored.";

    NebulaLog::log("ImM", Log::DEBUG, oss);

    return;
}
*/

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

static int import_action(
        std::istringstream&  is,
        MarketPlaceAppPool * apppool,
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
    long long   size_mb;

    if ( result == "FAILURE" )
    {
        app_failure_action(&is, apppool, id,
            "Error importing app into marketplace");
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
    tmpl.get("CHECKSUM", checksum);
    rc = tmpl.get("SIZE", size_mb);

    if ( source.empty() || checksum.empty() || rc == false )
    {
        goto error_attributes;
    }

    app = apppool->get(id, true);

    if (app == 0)
    {
        goto error_app;
    }

    app->set_source(source);
    app->set_checksum(checksum);
    app->set_size(size_mb);

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
        "Error importing app into marketplace. Missing app atributes.");
    return -1;

error_app:
    NebulaLog::log("MKP", Log::ERROR, "Marketplace app successfully imported "
        "but it no longer exists. You may need to manually remove: " + source);
    return -1;
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
        import_action(is, apppool, id, result);
    }
    else if (action == "EXPORT")
    {
        return;
    }
    else if (action == "DELETE")
    {
        return;
    }
    else if (action == "MONITOR")
    {
        return;
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

