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


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int MarketPlaceManager::import_app(
        int                appid,
        const std::string& market_data,
        std::string&       err)
{
    std::string      app_data;
    MarketPlaceApp * app = apppool->get(appid, true);

    if ( app == 0 )
    {
        err = "Marketplace app no longer exists";
        return -1;
    }

    app->to_xml(app_data);

    app->unlock();

    std::string * msg = format_message(app_data, market_data, "");

    const MarketPlaceManagerDriver* mpmd = get();

    if ( mpmd == 0 )
    {
        err = "Error getting MarketPlaceManagerDriver";
        return -1;
    }

    mpmd->importapp(appid, *msg);

    delete msg;

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

