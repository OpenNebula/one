/* ------------------------------------------------------------------------ */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs      */
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
#include <time.h>

using namespace std;

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

class HostShareTemplate : public Template
{
public:
    HostShareTemplate(const char * name) : Template(false, '=', name){};

    ~HostShareTemplate(){};
};

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

/**
 *  The HostShare class. It represents a logical partition of a host...
 */
class HostShare : public ObjectXML
{
public:

    HostShare(
        long long  _max_disk=0,
        long long  _max_mem=0,
        long long  _max_cpu=0);

    ~HostShare(){};

    /**
     *  Add a new VM to this share
     *    @param cpu requested by the VM, in percentage
     *    @param mem requested by the VM, in KB
     *    @param disk requested by the VM
     */
    void add(long long cpu, long long mem, long long disk)
    {
        cpu_usage  += cpu;
        mem_usage  += mem;
        disk_usage += disk;

        running_vms++;
    }

    /**
     *  Updates the capacity of VM in this share
     *    @param cpu increment
     *    @param mem increment
     *    @param disk increment
     */
    void update(int cpu, int mem, int disk)
    {
        cpu_usage  += cpu;
        mem_usage  += mem;
        disk_usage += disk;
    }

    /**
     *  Delete a VM from this share
     *    @param cpu requested by the VM
     *    @param mem requested by the VM
     *    @param disk requested by the VM
     */
    void del(long long cpu, long long mem, long long disk)
    {
        cpu_usage  -= cpu;
        mem_usage  -= mem;
        disk_usage -= disk;

        running_vms--;
    }

    /**
     *  Check if this share can host a VM.
     *    @param cpu requested by the VM
     *    @param mem requested by the VM
     *    @param disk requested by the VM
     *
     *    @return true if the share can host the VM or it is the only one
     *    configured
     */
    bool test(long long cpu, long long mem, long long disk) const
    {
            return (((max_cpu  - cpu_usage ) >= cpu) &&
                    ((max_mem  - mem_usage ) >= mem) &&
                    ((max_disk - disk_usage) >= disk));
    }

    /**
     *  Function to write a HostShare to an output stream
     */
    friend ostream& operator<<(ostream& os, HostShare& hs);

    /**
     * Function to print the HostShare object into a string in
     * XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    string& to_xml(string& xml) const;

    void set_ds_monitorization(const vector<Attribute*> &ds_att);

    void set_pci_monitorization(const vector<Attribute*> &pci_att);

private:

    long long disk_usage; /**< Disk allocated to VMs (in MB).        */
    long long mem_usage;  /**< Memory allocated to VMs (in KB)       */
    long long cpu_usage;  /**< CPU  allocated to VMs (in percentage) */

    long long max_disk;   /**< Total disk capacity (in MB)           */
    long long max_mem;    /**< Total memory capacity (in KB)         */
    long long max_cpu;    /**< Total cpu capacity (in percentage)    */

    long long free_disk;  /**< Free disk from the IM monitor         */
    long long free_mem;   /**< Free memory from the IM monitor       */
    long long free_cpu;   /**< Free cpu from the IM monitor          */

    long long used_disk;  /**< Used disk from the IM monitor         */
    long long used_mem;   /**< Used memory from the IM monitor       */
    long long used_cpu;   /**< Used cpu from the IM monitor          */

    long long running_vms;/**< Number of running VMs in this Host   */

    HostShareTemplate ds_template;
    HostShareTemplate pci_template;

    // ----------------------------------------
    // Friends
    // ----------------------------------------

    friend class Host;
    friend class HostPool;

    /**
     *  Rebuilds the object from an xml node
     *    @param node The xml node pointer
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml_node(const xmlNodePtr node);
};

#endif /*HOST_SHARE_H_*/
