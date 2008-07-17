/* -------------------------------------------------------------------------- */
/* Copyright 2002-2008, Distributed Systems Architecture Group, Universidad   */
/* Complutense de Madrid (dsa-research.org)                                   */
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

#ifndef EC2_DRIVER_H_
#define EC2_DRIVER_H_
#include <map>
#include <string>
#include <sstream>

#include "VirtualMachineManagerDriver.h"

using namespace std;

/**
 *  EC2 Driver class implements a VM Manager Driver to interface the Amazon 
 *  Cloud EC2.
 */
class EC2Driver : public VirtualMachineManagerDriver
{
public:

    EC2Driver(
        int userid,
        const map<string,string> &attrs,
        bool sudo,
        VirtualMachinePool *    pool):
            VirtualMachineManagerDriver(userid, attrs,sudo,pool)
    {};

    ~EC2Driver(){};

private:	
    /**
     *  Generates an EC2 deployment file
     *    @param vm pointer to a virtual machine
     *    @param file_name to generate the deployment description
     *    @return 0 on success
     */	
    int deployment_description(
        const VirtualMachine *  vm, 
        const string&           file_name) const;
};

/* -------------------------------------------------------------------------- */

#endif /*EC2_DRIVER_H_*/ 
 
