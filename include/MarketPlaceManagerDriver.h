/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

#ifndef MARKETPLACE_MANAGER_DRIVER_H_
#define MARKETPLACE_MANAGER_DRIVER_H_

#include <map>
#include <string>
#include <sstream>

#include "Mad.h"

class MarketPlacePool;
class MarketPlaceAppPool;
class MarketPlaceManager;

/**
 *  ImageManagerDriver represents the basic abstraction for Image Repository
 *  drivers. It implements the protocol and recover functions from the Mad
 *  interface.
 */
class MarketPlaceManagerDriver : public Mad
{
public:
    MarketPlaceManagerDriver(int userid,
        const std::map<string,string>& attrs,
        bool sudo,
        MarketPlacePool    * _marketpool,
        MarketPlaceAppPool * _apppool,
        MarketPlaceManager * _marketm
       ):Mad(userid,attrs,sudo), marketpool(_marketpool), apppool(_apppool),
         marketm(_marketm){};

    virtual ~MarketPlaceManagerDriver(){};

    /**
     *  Implements the Image Manager driver protocol.
     *    @param message the string read from the driver
     */
    void protocol(const std::string& message) const;

    /**
     *  TODO: What do we need here? Check on-going xfr?
     */
    void recover();

private:
    friend class MarketPlaceManager;

    /**
     *  Reference to Marketplace related pools
     */
    MarketPlacePool    * marketpool;

    MarketPlaceAppPool * apppool;

    MarketPlaceManager * marketm;

    /**
     *  Imports a new object into the marketplace
     *    @param oid of the app
     *    @param drv_msg xml data for the mad operation.
     */
    void importapp(int oid, const std::string& drv_msg) const;

    /**
     *  Deletes an app from the marketplace
     *    @param oid of the app
     *    @param drv_msg xml data for the mad operation.
     */
    void deleteapp(int oid, const std::string& drv_msg) const;

    /**
     *  Monitors the marketplace
     *    @param oid of the operation
     *    @param drv_msg xml data for the mad operation.
     */
    void monitor(int oid, const std::string& drv_msg) const;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif /*MARKETPLACE_MANAGER_DRIVER_H_*/

