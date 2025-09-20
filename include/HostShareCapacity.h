/* ------------------------------------------------------------------------ */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems              */
/*                                                                          */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may  */
/* not use this file except in compliance with the License. You may obtain  */
/* a copy of the License at                                                 */
/*                                                                          */
/* http://www.apache.org/licenses/LICENSE-2.0                               */
/*                                                                          */
/* Unless required by applicable law or agreed to in writing, software      */
/* distributed under the License is distributed on an "AS IS" BASIS,        */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. */
/* See the License for the specific language governing permissions and      */
/* limitations under the License.                                           */
/* ------------------------------------------------------------------------ */

#ifndef HOST_SHARE_CAPACITY_H_
#define HOST_SHARE_CAPACITY_H_

#include "Template.h"
#include "Attribute.h"

#include "VirtualMachine.h"

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

/**
 *   This class represents a HostShare capacity allocation from a VM. The following
 *   attributes are updated with the final allocation in the Host:
 *     - topology, number of sockets, cores and threads
 *     - pci, with device address
 *     - nodes with the numa nodes configured for the VM
 *
 *    NUMA node requests are described by an attribute:
 *
 *    NUMA_NODE = [ TOTAL_CPUS=, MEMORY="...", CPUS="...", NODE_ID="...",
 *      MEMORY_NODE_ID="..." ]
 *
 *    CPUS: list of CPU IDs to pin the vCPUs in this host
 *    NODE_ID: the ID of the numa node in the host to pin this virtual node
 *    MEMORY_NODE_ID: the ID of the node to allocate memory for this virtual node
 */
struct HostShareCapacity
{
    int vmid;

    unsigned int vcpu;

    long long cpu;
    long long mem;
    long long disk;

    bool is_q35;

    std::string vgpu_profile;

    std::vector<VectorAttribute *> pci;

    VectorAttribute * topology;

    std::vector<VectorAttribute *> nodes;

    /**
     *  Get the VM capacity from the template
     *  @param vid the VM ID
     *  @param tmpl the VM template. Warning: the HostShareCapacity use pointers to
     *        the tmpl, so it must exist for the lifetime of the HostareCapacity
     */
    void set(int vid, Template& tmpl)
    {
        float fcpu;

        pci.clear();

        nodes.clear();

        vgpu_profile = "";

        is_q35 = false;

        vmid = vid;

        if ((tmpl.get("MEMORY", mem) == false) ||
            (tmpl.get("CPU", fcpu) == false))
        {
            cpu = 0;
            mem = 0;
            disk = 0;

            vcpu = 0;

            return;
        }

        cpu = (int) (fcpu * 100); //%
        mem = mem * 1024;  //Kb
        disk = 0;

        tmpl.get("VCPU", vcpu);

        tmpl.get("PCI", pci);

        tmpl.get("NUMA_NODE", nodes);

        topology = tmpl.get("TOPOLOGY");

        is_q35 = VirtualMachine::test_machine_type(tmpl.get("OS"), {"q35","virt"});

        return;
    }
};

#endif /*HOST_SHARE_CAPACITY_H_*/
