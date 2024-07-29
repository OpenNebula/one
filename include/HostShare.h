/* ------------------------------------------------------------------------ */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems              */
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

#ifndef HOST_SHARE_H_
#define HOST_SHARE_H_

#include "ObjectXML.h"
#include "Template.h"

#include "HostSharePCI.h"
#include "HostShareNUMA.h"
#include "HostShareDatastore.h"
#include "HostShareCapacity.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 *  The HostShare class. It represents a logical partition of a host...
 */
class HostShare : public ObjectXML
{
public:
    HostShare();

    ~HostShare() {};

    /**
     *  Pin policy for the host
     */
    enum PinPolicy
    {
        PP_NONE   = 0, /**< No pin. Default. */
        PP_CORE   = 1, /**< vCPUs are assigned to host cores exclusively */
        PP_THREAD = 2, /**< vCPUS are assigned to host threads */
        PP_SHARED = 3  /**< vCPUs are assigned to a set of host threads */
    };

    static PinPolicy str_to_pin_policy(std::string& pp_s);

    /**
     *  Rebuilds the object from an xml node
     *    @param node The xml node pointer
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml_node(const xmlNodePtr node);

    /**
     *  Add a VM capacity to this share
     *    @param sr requested capacity by the VM
     */
    void add(HostShareCapacity &sr);

    bool add_pci(HostShareCapacity &sr)
    {
        // NOTE THIS FUNCTION DOES NOT PERFORM ANY ROLLBACK
        return pci.add(sr.pci, sr.vmid);
    }

    /**
     *  Delete VM capacity from this share
     *    @param sr requested capacity by the VM
     */
    void del(HostShareCapacity &sr);

    void del_pci(HostShareCapacity &sr)
    {
        pci.del(sr.pci, sr.vmid);
    }

    /**
     *  Revert changes in PCI Devices
     *    @param sr capacity info by the VM
     */
    void revert_pci(HostShareCapacity &sr);

    /**
     *  Check if this share can host a VM.
     *    @param cpu requested by the VM
     *    @param mem requested by the VM
     *    @param disk requested by the VM
     *    @param pci_devs requested by the VM
     *    @param error Returns the error reason, if any
     *
     *    @return true if the share can host the VM or it is the only one
     *    configured
     */
    bool test(HostShareCapacity& sr, std::string& error) const;

    /**
     *  Function to write a HostShare to an output stream
     */
    friend std::ostream& operator<<(std::ostream& os, const HostShare& hs);

    /**
     * Function to print the HostShare object into a string in
     * XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    std::string& to_xml(std::string& xml) const;

    /**
     * Set the capacity attributes of the share. CPU and Memory may reserve some
     * capacity according to RESERVED_CPU and RESERVED_MEM. These values can be
     * either absolute or a percentage.
     *
     * The function also set the PCI, NUMA and datastore information.
     *
     * Share values are read from the Host template returned by the monitoring
     * probes. The values are removed from the template.
     *
     *   @param ht template for the host
     *   @param rcpu, reserved cpu for the host
     *   @param rmem, reserved mem for the host
     *
     * NOTE: reserved strings will be modified
     */
    void set_monitorization(Template& ht, std::string& rcpu, std::string& rmem);


    /**
     * Set the capacity attributes of the share.
     * Same as the 3 parameter method, except it does not update reserved CPU and Memory
     */
    void set_monitorization(Template& ht);

    /**
     *  Resets capaity values of the share
     */
    void reset_capacity()
    {
        total_cpu = 0;
        total_mem = 0;

        max_cpu = 0;
        max_mem = 0;
    };

    /**
     * Update the capacity attributes when the RESERVED_CPU and RESERVED_MEM
     * are updated. This function also updates VMS_THREAD and ISOLCPUS
     *   @param ht, host template
     *   @para rcpu, reserved cpu for the host
     *   @para rmem, reserved mem for the host
     *
     * NOTE: reserved strings will be modified
     */
    void update_capacity(Template& ht, std::string& rcpu, std::string& rmem);

    /**
     *  Return the number of running VMs in this host
     */
    long long get_running_vms() const
    {
        return running_vms;
    };

    long long get_total_mem() const { return total_mem; }
    long long get_total_cpu() const { return total_cpu; }

    long long get_max_mem() const { return max_mem; }
    long long get_max_cpu() const { return max_cpu; }

private:

    long long mem_usage;  /**< Memory allocated to VMs (in KB)       */
    long long cpu_usage;  /**< CPU  allocated to VMs (in percentage) */

    long long total_mem;  /**< Total memory capacity (in KB)         */
    long long total_cpu;  /**< Total cpu capacity (in percentage)    */

    long long max_mem;    /**< Total memory capacity (in KB) +/- reserved     */
    long long max_cpu;    /**< Total cpu capacity (in percentage) +/- reserved*/

    long long running_vms;/**< Number of running VMs in this Host   */

    unsigned int vms_thread; /**< VMs that can be allocated to a thread */

    HostShareDatastore ds;

    HostSharePCI       pci;

    HostShareNUMA      numa;

    /**
     *  Check if this share can host a VM, testing only the PCI devices.
     *    @param pci_devs requested by the VM
     *    @param error Returns the error reason, if any
     *
     *    @return true if the share can host the VM or it is the only one
     *    configured
     */
    bool test_compute(int cpu, long long mem, std::string &error) const;

    bool test_pci(std::vector<VectorAttribute *>& pci_devs, std::string& error) const;

    bool test_numa(HostShareCapacity &sr, std::string& error) const;
};

#endif /*HOST_SHARE_H_*/
