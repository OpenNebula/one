/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

#ifndef IPAM_MANAGER_DRIVER_H_
#define IPAM_MANAGER_DRIVER_H_

#include <map>
#include <string>
#include <sstream>

#include "Mad.h"

//Forward definition of the IPAMManager Class
class IPAMManager;

/**
 *  IPAMManagerDriver provides a base class to implement IPAM
 *  Drivers. This class implements the protocol and recover functions
 *  from the Mad interface.
 */
class IPAMManagerDriver : public Mad
{
public:

    IPAMManagerDriver(int uid, const std::map<string,string>& attrs, bool sudo,
        IPAMManager * _ipamm):Mad(uid,attrs,sudo), ipamm(_ipamm){};

    virtual ~IPAMManagerDriver(){};

    /**
     *  Implements the IPAM Manager driver protocol.
     *    @param message the string read from the driver
     */
    void protocol(const string& message) const;

    /**
     *  Re-starts the driver
     */
    void recover();

private:
    friend class IPAMManager;

    /**
     *  The IPAMManager to notify results.
     */
    IPAMManager * ipamm;

    /**
     *  Register or requests a new AddressRange (network) into the IPAM
     */
    void register_address_range(int id, const std::string& arg) const
    {
        send_message("REGISTER_ADDRESS_RANGE", id, arg);
    }

    /**
     *  Unregister an AddressRange from the IPAM
     */
    void unregister_address_range(int id, const std::string& arg) const
    {
        send_message("UNREGISTER_ADDRESS_RANGE", id, arg);
    }

    /**
     *  Get a free address (or range)
     */
    void get_address(int id, const std::string& arg) const
    {
        send_message("GET_ADDRESS", id, arg);
    }

    /**
     *  Sets an address (or range) as used
     */
    void allocate_address(int id, const std::string& arg) const
    {
        send_message("ALLOCATE_ADDRESS", id, arg);
    }

    /**
     * Free a previously requested or allocated address
     */
    void free_address(int id, const std::string& arg) const
    {
        send_message("FREE_ADDRESS", id, arg);
    }

    /**
     *  Sends a generic message to the IPAM driver
     */
    void send_message(const char * name, int id, const std::string& arg) const
    {
        std::ostringstream os;

        os << name << " " << id << " " << arg << endl;

        write(os);
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif /*IPAM_MANAGER_DRIVER_H_*/

