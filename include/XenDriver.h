/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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

#ifndef XEN_DRIVER_H_
#define XEN_DRIVER_H_

#include <map>
#include <string>
#include "VirtualMachineManagerDriver.h"

/**
 *  Xen Driver class implements a VM Manager Driver to interface with the Xen
 *  hypervisor.
 */
class XenDriver : public VirtualMachineManagerDriver
{
public:

    XenDriver(const std::string& mad_location,
              const std::map<std::string, std::string> &attrs):
        VirtualMachineManagerDriver(mad_location, attrs)
    {}

    ~XenDriver() = default;

private:
    /**
     *  Generates a xen-specific deployment file seexmdomain.cfg(5):
     *    @param vm pointer to a virtual machine
     *    @param file_name to generate the deployment description
     *    @return 0 on success
     */
    int deployment_description(
            const VirtualMachine *  vm,
            const std::string&      file_name) const override;
};

#endif /*XEN_DRIVER_H_*/
