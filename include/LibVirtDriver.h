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

#ifndef LIBVIRT_DRIVER_H_
#define LIBVIRT_DRIVER_H_

#include <map>
#include <string>
#include "VirtualMachineManagerDriver.h"

class LibVirtDriver : public VirtualMachineManagerDriver
{
public:

    LibVirtDriver(const std::string& mad_location,
                  const std::map<std::string, std::string> &attrs,
                  const std::string& emu)
        : VirtualMachineManagerDriver(mad_location, attrs), emulator(emu)
    {}

    ~LibVirtDriver() = default;

    int validate_raw(const std::string& raw_section,
                     std::string& error) const override;

    /**
     *  Validates driver specific attributes in VM Template
     *    @param tmpl Virtual Machine Template
     *    @param error description on error
     *    @return 0 on success
     */
    int validate_template(const VirtualMachine* vm, int hid, int cluster_id,
                          std::string& error) const override;

private:
    static const int CEPH_DEFAULT_PORT;

    static const int GLUSTER_DEFAULT_PORT;

    static const int ISCSI_DEFAULT_PORT;

    static const int Q35_ROOT_DEFAULT_PORTS;

    static const char * XML_DOMAIN_RNG_PATH;

    int deployment_description(const VirtualMachine * vm,
                               const std::string& fn) const override
    {
        int   rc = -1;

        if (emulator == "kvm" || emulator == "qemu" )
        {
            rc = deployment_description_kvm(vm, fn);
        }

        return rc;
    }

    int deployment_description_kvm(const VirtualMachine * v,
                                   const std::string& f) const;

    const std::string emulator;
};

#endif /*LIBVIRT_DRIVER_H_*/

