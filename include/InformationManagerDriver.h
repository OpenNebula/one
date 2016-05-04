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

#ifndef INFORMATION_MANAGER_DRIVER_H_
#define INFORMATION_MANAGER_DRIVER_H_

#include <map>
#include <string>
#include <sstream>

#include "Mad.h"

using namespace std;

class MonitorThreadPool;

/**
 *  InformationManagerDriver provides a base class to implement IM
 *  Drivers. This class implements the protocol and recover functions
 *  from the Mad interface. This class may be used to further specialize
 *  the IM driver.
 */
class InformationManagerDriver : public Mad
{
public:

    InformationManagerDriver(
        int                         userid,
        const map<string,string>&   attrs,
        bool                        sudo,
        MonitorThreadPool *         mtpool);

    virtual ~InformationManagerDriver();

    /**
     *  Implements the IM driver protocol.
     *    @param message the string read from the driver
     */
    void protocol(const string& message) const;

    /**
     *  TODO: What do we need here? just poll the Hosts to recover..
     */
    void recover();

    /**
     *  Sends a monitor request to the MAD: "MONITOR  ID  HOSTNAME -"
     *    @param oid the virtual machine id.
     *    @param host the hostname
     *    @param ds_location DATASTORE_LOCATION for the host
     *    @param update the remotes directory in host
     */
    void monitor(int oid, const string& host, const string& ds_location,
        bool update) const;

    /**
     *  Sends a stop monitor request to the MAD: "MONITOR  ID  HOSTNAME -"
     *    @param oid the virtual machine id.
     *    @param host the hostname
     */
    void stop_monitor(int oid, const string& host) const;

private:
    friend class InformationManager;

    /**
     *  Pointer to the Monitor Thread Pool to process monitor messages
     */
    MonitorThreadPool * mtpool;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif /*INFORMATION_MANAGER_DRIVER_H_*/
