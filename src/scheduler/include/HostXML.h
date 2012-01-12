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


#ifndef HOST_XML_H_
#define HOST_XML_H_

#include "ObjectXML.h"

using namespace std;

class HostXML : public ObjectXML
{
public:
    HostXML(const string &xml_doc):ObjectXML(xml_doc)
    {
        init_attributes();
    };

    HostXML(const xmlNodePtr node):ObjectXML(node)
    {
        init_attributes();
    };

    int get_hid() const
    {
        return oid;
    };

    /**
     *  Gets the current host capacity
     *    @param cpu the host free cpu, scaled according to a given threshold
     *    @param memory the host free memory
     *    @param threshold to consider the host totally free
     */
    void get_capacity(int& cpu, int& memory, float threshold) const;

    /**
     *  Tests whether a new VM can be hosted by the host or not
     *    @param cpu needed by the VM (percentage)
     *    @param mem needed by the VM (in Kb)
     *    @param disk needed by the VM
     *    @return true if the share can host the VM
     */
    bool test_capacity(int cpu, int mem, int disk) const
    {
        return (((max_cpu  - cpu_usage ) >= cpu) &&
                ((max_mem  - mem_usage ) >= mem) &&
                ((max_disk - disk_usage) >= disk));
    };

    /**
     *  Adds a new VM to the given share by incrementing the cpu,mem and disk
     *  counters
     *    @param cpu needed by the VM (percentage)
     *    @param mem needed by the VM (in Kb)
     *    @param disk needed by the VM
     *    @return 0 on success
     */
    void add_capacity(int cpu, int mem, int disk)
    {
        cpu_usage  += cpu;
        mem_usage  += mem;
        disk_usage += disk;

        running_vms++;
    };


private:
    int oid;

    // Host share values
    int disk_usage; /**< Disk allocated to VMs (in Mb).        */
    int mem_usage;  /**< Memory allocated to VMs (in Mb)       */
    int cpu_usage;  /**< CPU  allocated to VMs (in percentage) */

    int max_disk;   /**< Total disk capacity (in Mb)           */
    int max_mem;    /**< Total memory capacity (in Mb)         */
    int max_cpu;    /**< Total cpu capacity (in percentage)    */

    int free_disk;  /**< Free disk from the IM monitor         */
    int free_mem;   /**< Free memory from the IM monitor       */
    int free_cpu;   /**< Free cpu from the IM monitor          */

    int running_vms; /**< Number of running VMs in this Host   */

    void init_attributes();
};

#endif /* HOST_XML_H_ */
