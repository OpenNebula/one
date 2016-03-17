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

#include "Image.h"
#include "Datastore.h"
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
	std::string * msg;

	Image * image;
	Datastore * ds;

	int ds_id;

    const MarketPlaceManagerDriver* mpmd;

    MarketPlaceApp * app = apppool->get(appid, true);

    if ( app == 0 )
    {
        err = "Marketplace app no longer exists";
        return -1;
    }

    app->to_xml(app_data);

    MarketPlaceApp::Type type = app->get_type();

	int app_id    = app->get_oid();
    int origin_id = app->get_origin_id();

    app->unlock();

    switch (type)
    {
        case MarketPlaceApp::IMAGE:
            image = ipool->get(origin_id, true);

			if ( image == 0 )
			{
                goto error_noimage;
			}

            image->to_xml(image_data);

            ds_id = image->get_ds_id();

            image->unlock();

            ds = dspool->get(ds_id, true);

			if ( ds == 0 )
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

    msg = format_message(app_data, market_data, image_data + ds_data);

    mpmd = get();

    if ( mpmd == 0 )
    {
        goto error_driver;
    }

    mpmd->importapp(appid, *msg);

    delete msg;

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
    app = apppool->get(appid, true);

    if ( app == 0 )
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
    MarketPlaceApp * app = apppool->get(appid, true);

    if (app == 0)
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
    MarketPlaceApp * app;
    MarketPlace *    mp;

    std::string app_data;
    std::string * msg;

    const MarketPlaceManagerDriver* mpmd = get();

    if ( mpmd == 0 )
    {
        error_str = "Error getting MarketPlaceManagerDriver";
        return -1;
    }

    app = apppool->get(appid, true);

    if (app == 0)
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

    mp = mppool->get(market_id, true);

    if ( mp != 0 )
    {
        mp->del_marketapp(appid);

        mppool->update(mp);

        mp->unlock();
    }

    msg = format_message(app_data, market_data, "");

    mpmd->deleteapp(appid, *msg);

    delete msg;

    return 0;
}
