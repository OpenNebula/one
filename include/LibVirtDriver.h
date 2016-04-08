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

#ifndef LIBVIRT_DRIVER_H_
#define LIBVIRT_DRIVER_H_

#include <map>
#include <string>
#include <sstream>

#include "VirtualMachineManagerDriver.h"

class LibVirtDriver : public VirtualMachineManagerDriver
{
public:

    LibVirtDriver(int userid, const map<string,string> &attrs, bool sudo,
        VirtualMachinePool * pool, const string& emu)
        :VirtualMachineManagerDriver(userid, attrs,sudo,pool), emulator(emu)
    {};

    ~LibVirtDriver(){};

private:
    static const float CGROUP_BASE_CPU_SHARES;

    static const int   CEPH_DEFAULT_PORT;

    static const int   GLUSTER_DEFAULT_PORT;

    static const int   ISCSI_DEFAULT_PORT;

    int deployment_description(const VirtualMachine * vm, const string& fn) const
    {
        int   rc = -1;

        if (emulator == "kvm" || emulator == "qemu" )
        {
            rc = deployment_description_kvm(vm, fn);
        }

        return rc;
    }

    int deployment_description_kvm(const VirtualMachine * v, const string& f) const;

    const string emulator;
};

#endif /*LIBVIRT_DRIVER_H_*/

