/* ------------------------------------------------------------------------ */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)           */
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
#include <time.h>

using namespace std;

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

/**
 *  The HostShare class. It represents a logical partition of a host...
 */
class HostShare : public ObjectXML
{
public:

    HostShare(
        int     _max_disk=0,
        int     _max_mem=0,
        int     _max_cpu=0);

    ~HostShare(){};

    /**
     *  Add a new VM to this share
     *    @param cpu requested by the VM
     *    @param mem requested by the VM
     *    @param disk requested by the VM
     */
    void add(int cpu, int mem, int disk)
    {
        cpu_usage  += cpu;
        mem_usage  += mem;
        disk_usage += disk;

        running_vms++;
    }

    /**
     *  Delete a VM from this share
     *    @param cpu requested by the VM
     *    @param mem requested by the VM
     *    @param disk requested by the VM
     */
    void del(int cpu, int mem, int disk)
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
    bool test(int cpu, int mem, int disk) const
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

private:

    int disk_usage; /**< Disk allocated to VMs (in Mb).        */
    int mem_usage;  /**< Memory allocated to VMs (in Mb)       */
    int cpu_usage;  /**< CPU  allocated to VMs (in percentage) */

    int max_disk;   /**< Total disk capacity (in Mb)           */
    int max_mem;    /**< Total memory capacity (in Mb)         */
    int max_cpu;    /**< Total cpu capacity (in percentage)    */

    int free_disk;  /**< Free disk from the IM monitor         */
    int free_mem;   /**< Free memory from the IM monitor       */
    int free_cpu;   /**< Free cpu from the IM monitor          */

    int used_disk;  /**< Used disk from the IM monitor         */
    int used_mem;   /**< Used memory from the IM monitor       */
    int used_cpu;   /**< Used cpu from the IM monitor          */

    int running_vms;/**< Number of running VMs in this Host   */

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
