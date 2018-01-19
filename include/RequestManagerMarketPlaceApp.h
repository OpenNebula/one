/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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

#ifndef REQUEST_MANAGER_MARKETPLACEAPP_H
#define REQUEST_MANAGER_MARKETPLACEAPP_H

#include "RequestManagerResourceLocked.h"
#include "Nebula.h"

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class RequestManagerMarketPlaceApp: public RequestManagerResourceLocked
{
protected:
    RequestManagerMarketPlaceApp(const std::string& method_name,
		const std::string& help, const std::string& params) :
		RequestManagerResourceLocked(method_name, params, help, 1)
    {
        Nebula& nd = Nebula::instance();
        pool       = nd.get_apppool();

        auth_object = PoolObjectSQL::MARKETPLACEAPP;
        auth_op     = AuthRequest::MANAGE;
    };

    ~RequestManagerMarketPlaceApp(){};

    /* --------------------------------------------------------------------- */

    virtual void request_execute(xmlrpc_c::paramList const& _paramList,
		RequestAttributes& att) = 0;
};

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

class MarketPlaceAppEnable : public RequestManagerMarketPlaceApp
{
public:
    MarketPlaceAppEnable(): RequestManagerMarketPlaceApp("one.marketapp.enable",
		"Enables or disables a marketplace app", "A:sib"){};

    ~MarketPlaceAppEnable(){};

    void request_execute(xmlrpc_c::paramList const& _paramList,
		RequestAttributes& att);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif
