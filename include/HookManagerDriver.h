/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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

#ifndef HOOK_MANAGER_DRIVER_H_
#define HOOK_MANAGER_DRIVER_H_

#include <map>
#include <string>
#include <sstream>

#include "Mad.h"
#include "VirtualMachinePool.h"

using namespace std;

/**
 *  HookManagerDriver provides a base class to implement Hook (Execution)
 *  Drivers. This class implements the protocol and recover functions
 *  from the Mad interface. This class may be used to further specialize 
 *  the Execution driver.
 */
class HookManagerDriver : public Mad
{
public:

    HookManagerDriver(
        int                       userid,
        const map<string,string>& attrs,
        bool                      sudo,
        VirtualMachinePool *      _vmpool)
            : Mad(userid,attrs,sudo), vmpool(_vmpool){};

    virtual ~HookManagerDriver(){};

    /**
     *  Implements the Hook driver protocol.
     *    @param message the string read from the driver
     */
    void protocol(
        string&     message);

    /**
     *  TODO: What do we need here? just poll the Hosts to recover..
     */
    void recover();
	
	/**<id> <hook_name> <LOCAL|host> <script> <args|->
     *  Sends an execution request to the MAD: "EXECUTE id name local cmd args"
     *    @param oid the virtual machine id.
     *    @param hook_name the name of the hook
     *    @param command to be executed
     *    @param arguments for the command
     */
    void execute(
        int             oid,
        const string&   hook_name,
        const string&   command,
        const string&   arguments ) const;

	/**
     *  Sends an execution request to the MAD: "EXECUTE id name host cmd args"
     *    @param oid the virtual machine id.
     *    @param hook_name the name of the hook
     *    @param host_name the name of the host to execute the hook
     *    @param command to be executed
     *    @param arguments for the command
     */
    void execute(
        int             oid,
        const string&   hook_name,
        const string&   host_name,
        const string&   command,
        const string&   arguments ) const;

private:

    friend class            HookManager;
    
    VirtualMachinePool *    vmpool;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif /*HOOK_MANAGER_DRIVER_H_*/
