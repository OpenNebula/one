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
#include "MarketPlacePool.h"
#include "MarketPlaceAppPool.h"

#include "ImagePool.h"
#include "DatastorePool.h"
#include "ImageManager.h"

#include "NebulaLog.h"
#include "Nebula.h"


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int MarketPlaceManager::import_app(
        int                appid,
        const std::string& market_data,
        std::string&       err)
{
    std::string app_data, image_data, ds_data;

    Image * image;
    Datastore * ds;

    int ds_id;

    market_msg_t msg(MarketPlaceManagerMessages::IMPORT, "", appid, "");

    MarketPlaceApp * app = apppool->get_ro(appid);

    if ( app == nullptr )
    {
        err = "Marketplace app no longer exists";
        return -1;
    }

    app->to_xml(app_data);

    MarketPlaceApp::Type type = app->get_type();

    int app_id    = app->get_oid();
    int origin_id = app->get_origin_id();

    app->unlock();

    auto mpmd = get();

    if ( mpmd == nullptr )
    {
        goto error_driver;
    }

    switch (type)
    {
        case MarketPlaceApp::IMAGE:
            image = ipool->get_ro(origin_id);

            if ( image == nullptr )
            {
                goto error_noimage;
            }

            image->to_xml(image_data);

            ds_id = image->get_ds_id();

            image->unlock();

            ds = dspool->get_ro(ds_id);

            if ( ds == nullptr )
            {
                goto error_nods;
            }

            ds->to_xml(ds_data);

            ds->unlock();

            if (imagem->set_app_clone_state(app_id, origin_id, err) != 0)
            {
                goto error_clone;
            }
            break;

        case MarketPlaceApp::VMTEMPLATE:
        case MarketPlaceApp::SERVICE_TEMPLATE:
        case MarketPlaceApp::UNKNOWN:
            goto error_type;
    }

    {
        unique_ptr<string> drv_msg(format_message(app_data, market_data,
                    image_data + ds_data));

        msg.payload(*drv_msg);
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
    app = apppool->get(appid);

    if ( app == nullptr )
    {
        return -1;
    }

    app->set_template_error_message(err);

    app->set_state(MarketPlaceApp::ERROR);

    apppool->update(app);

    app->unlock();

    NebulaLog::log("MKP", Log::ERROR, err);

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MarketPlaceManager::release_app_resources(int appid)
{
    MarketPlaceApp * app = apppool->get_ro(appid);

    if (app == nullptr)
    {
        return;
    }

    MarketPlaceApp::Type type = app->get_type();

    int iid = app->get_origin_id();

    app->unlock();

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

    auto mpmd = get();

    if ( mpmd == nullptr )
    {
        error_str = "Error getting MarketPlaceManagerDriver";
        return -1;
    }

    MarketPlaceApp * app = apppool->get_ro(appid);

    if (app == nullptr)
    {
        error_str = "Marketplace app no longer exists";
        return -1;
    }

    app->to_xml(app_data);

    MarketPlaceApp::Type type   = app->get_type();
    MarketPlaceApp::State state = app->get_state();

    int market_id = app->get_market_id();

    app->unlock();

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
        case MarketPlaceApp::UNKNOWN:
            return -1;
    }

    MarketPlace * mp = mppool->get(market_id);

    if ( mp != nullptr )
    {
        mp->del_marketapp(appid);

        mppool->update(mp);

        mp->unlock();
    }

    unique_ptr<string> drv_msg(format_message(app_data, market_data, ""));

    market_msg_t msg(MarketPlaceManagerMessages::DELETE, "", appid, *drv_msg);
    mpmd->write(msg);

    return 0;
}
