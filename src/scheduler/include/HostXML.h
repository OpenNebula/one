/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#include <map>
#include "ObjectXML.h"
#include "HostShare.h"

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

    int get_cid() const
    {
        return cluster_id;
    };

    /**
     *  Tests whether a new VM can be hosted by the host or not
     *    @param cpu needed by the VM (percentage)
     *    @param mem needed by the VM (in KB)
     *    @param pci devices needed by the VM
     *    @param error error message
     *    @return true if the share can host the VM
     */
    bool test_capacity(long long cpu, long long mem, vector<Attribute *> &pci,
        string & error);

    /**
     *  Tests whether a new VM can be hosted by the host or not
     *    @param cpu needed by the VM (percentage)
     *    @param mem needed by the VM (in KB)
     *    @param pci devices needed by the VM
     *    @return true if the share can host the VM
     */
    bool test_capacity(long long cpu,long long mem,vector<Attribute *> &p)
    {
        string tmp_st;
        return test_capacity(cpu, mem, p, tmp_st);
    };

    /**
     *  Adds a new VM to the given share by incrementing the cpu,mem and disk
     *  counters
     *    @param cpu needed by the VM (percentage)
     *    @param mem needed by the VM (in KB)
     *    @return 0 on success
     */
    void add_capacity(int vmid, long long cpu, long long mem,
        vector<Attribute *> &p)
    {
        cpu_usage  += cpu;
        mem_usage  += mem;

        pci.add(p, vmid);

        running_vms++;
    };

    /**
     *  Deletes a VM to the given host by updating the cpu,mem and disk
     *  counters
     *    @param cpu needed by the VM (percentage)
     *    @param mem needed by the VM (in KB)
     *    @return 0 on success
     */
    void del_capacity(int cpu, int mem)
    {
        cpu_usage  -= cpu;
        mem_usage  -= mem;

        running_vms--;
    };

    /**
     *  Tests whether a new VM can be hosted by the local system DS or not
     *    @param dsid DS id
     *    @param vm_disk_mb System disk needed by the VM (in MB)
     *    @return true if the share can host the VM
     */
    bool test_ds_capacity(int dsid, long long vm_disk_mb);

    /**
     *  Adds a new VM to the given local sytem DS share by incrementing the disk
     *  counter
     *    @param dsid DS id
     *    @param vm_disk_mb System disk needed by the VM (in MB)
     */
    void add_ds_capacity(int dsid, long long vm_disk_mb);

    /**
     *  Search the Object for a given attribute in a set of object specific
     *  routes. Overwrite ObjectXML function to deal with pseudo-attributes
     *    - CURRENT_VMS. value is the VM ID to search in the set of VMS
     *    running VMs in the host. If the VM_ID is found value is not modified
     *    otherwise is set to -1
     */
    int search(const char *name, int& value);

    /**
     *  Checks if the host is a remote public cloud
     *    @return true if the host is a remote public cloud
     */
    bool is_public_cloud() const
    {
        return public_cloud;
    }

    /**
     *  Prints the Host information to an output stream. This function is used
     *  for logging purposes.
     */
    friend ostream& operator<<(ostream& o, const HostXML& p);

private:
    int oid;
    int cluster_id;

    // Host share values
    long long mem_usage;  /**< Memory allocated to VMs (in KB)       */
    long long cpu_usage;  /**< CPU  allocated to VMs (in percentage) */

    long long max_mem;    /**< Total memory capacity (in KB)         */
    long long max_cpu;    /**< Total cpu capacity (in percentage)    */

    long long free_disk;  /**< Free disk capacity (in MB)            */

    map<int, long long> ds_free_disk; /**< Free MB for local system DS */

    long long running_vms; /**< Number of running VMs in this Host   */

    bool public_cloud;

    HostSharePCI pci;

    // Configuration attributes
    static const char *host_paths[]; /**< paths for search function */

    static int host_num_paths; /**< number of paths*/

    void init_attributes();
};

#endif /* HOST_XML_H_ */
