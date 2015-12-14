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

#ifndef MARKETPLACE_MANAGER_DRIVER_H_
#define MARKETPLACE_MANAGER_DRIVER_H_

#include <map>
#include <string>
#include <sstream>

#include "Mad.h"

/**
 *  ImageManagerDriver represents the basic abstraction for Image Repository
 *  drivers. It implements the protocol and recover functions from the Mad
 *  interface.
 */
class MarketPlaceManagerDriver : public Mad
{
public:
    MarketPlaceManagerDriver(int   userid,
       const std::map<string,string>& attrs,
       bool  sudo):
            Mad(userid,attrs,sudo){};

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
     *  Sends a stat  request to the MAD.
     *    @param oid the id of the stat request
     *    @param drv_msg xml data for the mad operation.
     */
    void importapp(int oid, const std::string& drv_msg) const;

    /**
     *  Sends a make filesystem request to the MAD.
     *    @param oid the image id.
     *    @param drv_msg xml data for the mad operation.
     */
    void exportapp(int oid, const std::string& drv_msg) const;

    /**
     *  Sends a delete request to the MAD: "DELETE IMAGE_ID PATH"
     *    @param oid the image id.
     *    @param drv_msg xml data for the mad operation.
     */
    void deleteapp(int oid, const std::string& drv_msg) const;

    /**
     *  Sends a monitor request to the MAD: "MONITOR DS_ID DS_XML"
     *    @param oid the datastore id.
     *    @param drv_msg xml data for the mad operation.
     */
    void monitor(int oid, const std::string& drv_msg) const;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif /*MARKETPLACE_MANAGER_DRIVER_H_*/

