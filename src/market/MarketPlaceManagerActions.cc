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

    const MarketPlaceManagerDriver* mpmd = get();

    if ( mpmd == 0 )
    {
        err = "Error getting MarketPlaceManagerDriver";
        return -1;
    }

    MarketPlaceApp * app = apppool->get(appid, true);

    if ( app == 0 )
    {
        err = "Marketplace app no longer exists";
        return -1;
    }

    app->to_xml(app_data);

    MarketPlaceApp::MarketPlaceAppType type = app->get_type();

	int app_id    = app->get_oid();
    int origin_id = app->get_origin_id();

    app->unlock();

    switch (type)
    {
        case MarketPlaceApp::IMAGE:
            image = ipool->get(origin_id, true);

			if ( image == 0 )
			{
				err = "Image does not exist.";
				return -1;
			}

            image->to_xml(image_data);

            ds_id = image->get_ds_id();

            image->unlock();

            ds = dspool->get(ds_id, true);

			if ( ds == 0 )
			{
				err = "Image datastore no longer exists.";
				return -1;
			}

            ds->to_xml(ds_data);

            ds->unlock();

			if (imagem->set_clone_state(-app_id, origin_id, err) != 0)
			{
				return -1;
			}
			break;

        case MarketPlaceApp::VMTEMPLATE:
        case MarketPlaceApp::FLOW:
        case MarketPlaceApp::UNKNOWN:
            err = "Marketplace app type not supported.";
            return -1;
    }

    msg = format_message(app_data, market_data, image_data + ds_data);

    mpmd->importapp(appid, *msg);

    delete msg;

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

