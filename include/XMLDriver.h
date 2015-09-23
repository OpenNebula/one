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

#ifndef XML_DRIVER_H_
#define XML_DRIVER_H_

#include <map>
#include <string>
#include <sstream>
#include "VirtualMachineManagerDriver.h"

using namespace std;

/**
 *  XML Driver class implements a Generic VM Manager Driver that uses a neutral
 *  XML representation for the VM templates.
 */
class XMLDriver : public VirtualMachineManagerDriver
{
public:

    XMLDriver(
        int userid,
        const map<string,string> &attrs,
        bool sudo,
        VirtualMachinePool *    pool):
            VirtualMachineManagerDriver(userid, attrs,sudo,pool)
    {};

    ~XMLDriver(){};

private:
    /**
     *  Generates a neutral XML deployment file:
     *    @param vm pointer to a virtual machine
     *    @param file_name to generate the deployment description
     *    @return 0 on success
     */
    int deployment_description(
        const VirtualMachine *  vm,
        const string&           file_name) const;
};

#endif /*XML_DRIVER_H_*/
