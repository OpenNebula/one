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

#ifndef TRANSFER_MANAGER_DRIVER_H_
#define TRANSFER_MANAGER_DRIVER_H_

#include <map>
#include <string>
#include <sstream>

#include "Mad.h"
#include "VirtualMachinePool.h"

using namespace std;

/**
 *  TransferManagerDriver provides a base class to implement TM
 *  Drivers. This class implements the protocol and recover functions
 *  from the Mad interface.
 */
class TransferManagerDriver : public Mad
{
public:

    TransferManagerDriver(
        int                         userid,
        const map<string,string>&   attrs,
        bool                        sudo,
        VirtualMachinePool *        pool):
            Mad(userid,attrs,sudo), vmpool(pool){};

    virtual ~TransferManagerDriver(){};

    /**
     *  Implements the VM Manager driver protocol.
     *    @param message the string read from the driver
     */
    void protocol(const string& message) const;

    /**
     *  TODO: What do we need here? Check on-going xfr?
     */
    void recover();

private:
    friend class TransferManager;

    /**
     *  Pointer to the Virtual Machine Pool, to access VMs
     */
    VirtualMachinePool * vmpool;

    /**
     *  Sends a transfer request to the MAD: "TRANSFER    ID    XFR_FILE"
     *    @param oid the virtual machine id.
     *    @param xfr_file is the path to the transfer script
     */
    void transfer (const int oid, const string& xfr_file) const;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif /*TRANSFER_MANAGER_DRIVER_H_*/

