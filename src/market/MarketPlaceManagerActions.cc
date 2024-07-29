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

#include "ImagePool.h"
#include "DatastorePool.h"
#include "ImageManager.h"

#include "NebulaLog.h"
#include "Nebula.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int MarketPlaceManager::import_app(
        int                appid,
        const std::string& market_data,
        std::string&       err)
{
    std::string app_data, image_data, ds_data;

    int app_id;
    int origin_id;

    MarketPlaceApp::Type type;

    market_msg_t msg(MarketPlaceManagerMessages::IMPORT, "", appid, "");

    if ( auto app = apppool->get_ro(appid) )
    {
        app->to_xml(app_data);

        type = app->get_type();

        app_id    = app->get_oid();
        origin_id = app->get_origin_id();
    }
    else
    {
        err = "Marketplace app no longer exists";
        return -1;
    }

    auto mpmd = get();

    if ( mpmd == nullptr )
    {
        goto error_driver;
    }

    switch (type)
    {
        case MarketPlaceApp::IMAGE:
        {
            int ds_id;

            if ( auto image = ipool->get_ro(origin_id) )
            {
                image->to_xml(image_data);

                ds_id = image->get_ds_id();
            }
            else
            {
                goto error_noimage;
            }

            if ( auto ds = dspool->get_ro(ds_id) )
            {
                ds->to_xml(ds_data);
            }
            else
            {
                goto error_nods;
            }

            if (imagem->set_app_clone_state(app_id, origin_id, err) != 0)
            {
                goto error_clone;
            }
        }
        break;

        case MarketPlaceApp::VMTEMPLATE:
        case MarketPlaceApp::SERVICE_TEMPLATE:
            break;
        case MarketPlaceApp::UNKNOWN:
            goto error_type;
    }

    {
        string drv_msg(format_message(app_data, market_data,
                                      image_data + ds_data));

        msg.payload(drv_msg);
        mpmd->write(msg);
    }

    return 0;

error_driver:
    err = "Error getting MarketPlaceManagerDriver";
    goto error_common;

error_noimage:
    err = "Image does not exist.";
    goto error_common;

error_nods:
    err = "Image datastore no longer exists.";
    goto error_common;

error_type:
    err = "Marketplace app type not supported.";

error_clone:
error_common:
    if (auto app = apppool->get(appid))
    {
        app->set_template_error_message(err);

        app->set_state(MarketPlaceApp::ERROR);

        apppool->update(app.get());
    }

    NebulaLog::log("MKP", Log::ERROR, err);

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MarketPlaceManager::release_app_resources(int appid)
{
    MarketPlaceApp::Type type;
    int iid;

    if (auto app = apppool->get_ro(appid))
    {
        type = app->get_type();
        iid  = app->get_origin_id();
    }
    else
    {
        return;
    }

    switch (type)
    {
        case MarketPlaceApp::IMAGE:
            imagem->release_cloning_app(iid, appid);
            return;

        case MarketPlaceApp::VMTEMPLATE:
        case MarketPlaceApp::SERVICE_TEMPLATE:
        case MarketPlaceApp::UNKNOWN:
            return;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int MarketPlaceManager::delete_app(int appid, const std::string& market_data,
                                   std::string& error_str)
{
    std::string app_data;

    MarketPlaceApp::Type type;
    MarketPlaceApp::State state;

    int market_id;

    auto mpmd = get();

    if ( mpmd == nullptr )
    {
        error_str = "Error getting MarketPlaceManagerDriver";
        return -1;
    }

    if ( auto app = apppool->get_ro(appid) )
    {
        app->to_xml(app_data);

        type  = app->get_type();
        state = app->get_state();

        market_id = app->get_market_id();
    }
    else
    {
        error_str = "Marketplace app no longer exists";
        return -1;
    }

    switch (type)
    {
        case MarketPlaceApp::IMAGE:
            switch (state)
            {
                case MarketPlaceApp::LOCKED:
                    release_app_resources(appid);
                    break;
                case MarketPlaceApp::INIT:
                case MarketPlaceApp::READY :
                case MarketPlaceApp::ERROR:
                case MarketPlaceApp::DISABLED:
                    break;
            }
            break;

        case MarketPlaceApp::VMTEMPLATE:
        case MarketPlaceApp::SERVICE_TEMPLATE:
            break;
        case MarketPlaceApp::UNKNOWN:
            return -1;
    }

    if ( auto mp = mppool->get(market_id) )
    {
        mp->del_marketapp(appid);

        mppool->update(mp.get());
    }

    string drv_msg(format_message(app_data, market_data, ""));

    market_msg_t msg(MarketPlaceManagerMessages::DELETE, "", appid, drv_msg);
    mpmd->write(msg);

    return 0;
}
