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

#ifndef IPAM_MANAGER_DRIVER_H_
#define IPAM_MANAGER_DRIVER_H_

#include <map>
#include <string>
#include <sstream>

#include "Mad.h"

using namespace std;

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

    IPAMManagerDriver(
        int                         userid,
        const map<string,string>&   attrs,
        bool                        sudo,
        IPAMManager *               _ipamm):
            Mad(userid,attrs,sudo), ipamm(_ipamm){};

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

    void get_used_addr(int oid,
                       const string& params) const;

    void get_free_addr_range(int oid,
                             const string& params) const;

    void register_addr_range(int oid,
                             const string& params) const;

    void free_addr(int oid,
                   const string& params) const;

};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif /*IPAM_MANAGER_DRIVER_H_*/

