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


#ifndef HOST_XML_H_
#define HOST_XML_H_

#include <map>
#include <set>
#include "ObjectXML.h"
#include "HostShare.h"
#include "PoolObjectAuth.h"

/**
 *  This class represents the needed information HostShare for a Host to
 *  perform the scheduling
 */
class HostShareXML
{
public:
    HostShareXML() {};

    virtual ~HostShareXML() {};

    /**
     *  Tests whether a new VM can be hosted by the host or not
     *    @param sr the share request including CPU, memory, PCI and NUMA nodes
     *    @return true if the share can host the VM
     */
    bool test_capacity(HostShareCapacity& sr, std::string & error);

    /**
     *  Adds a new VM to the given share by incrementing the cpu,mem and disk
     *  counters
     *    @param cpu needed by the VM (percentage)
     *    @param mem needed by the VM (in KB)
     *    @return 0 on success
     */
    void add_capacity(HostShareCapacity& sr)
    {
        cpu_usage  += sr.cpu;
        mem_usage  += sr.mem;

        pci.add(sr.pci, sr.vmid);

        numa.add(sr);

        running_vms++;
    };

    /**
     *  Deletes a VM to the given host by updating the cpu,mem and disk
     *  counters
     *    @param cpu needed by the VM (percentage)
     *    @param mem needed by the VM (in KB)
     *    @return 0 on success
     */
    void del_capacity(HostShareCapacity& sr)
    {
        cpu_usage  -= sr.cpu;
        mem_usage  -= sr.mem;

        running_vms--;
    };

    /**
     *  Tests whether a new VM can be hosted by the local system DS or not
     *    @param dsid DS id
     *    @param vm_disk_mb System disk needed by the VM (in MB)
     *    @return true if the share can host the VM
     */
    bool test_ds_capacity(int dsid, long long vm_disk_mb)
    {
        ds_free_disk.emplace(dsid, free_disk);

        return (vm_disk_mb < ds_free_disk[dsid]);
    }

    /**
     *  Adds a new VM to the given local sytem DS share by incrementing the disk
     *  counter
     *    @param dsid DS id
     *    @param vm_disk_mb System disk needed by the VM (in MB)
     */
    void add_ds_capacity(int dsid, long long vm_disk_mb)
    {
        ds_free_disk.emplace(dsid, free_disk);

        ds_free_disk[dsid] -= vm_disk_mb;
    }

    /**
     *  Prints the share information to an output stream.
     */
    friend std::ostream& operator<<(std::ostream& o, const HostShareXML& p);

private:
    friend class HostXML;

    // Host computing capacity and usage
    long long mem_usage = 0;
    long long cpu_usage = 0;

    long long max_mem = 0;
    long long max_cpu = 0;

    long long running_vms = 0;

    // PCI devices
    HostSharePCI pci;

    // System datastore
    long long free_disk = 0;
    std::map<int, long long> ds_free_disk;

    //Numa Nodes
    HostShareNUMA numa;

    /**
     *  Construct the share information from the XML information in the
     *  <HOST> element
     */
    void init_attributes(ObjectXML * host);
};


class HostXML : public ObjectXML
{
public:
    HostXML(const std::string &xml_doc):ObjectXML(xml_doc)
    {
        init_attributes();
    };

    HostXML(const xmlNodePtr node):ObjectXML(node)
    {
        init_attributes();
    };

    /* ---------------------------------------------------------------------- */
    /* ---------------------------------------------------------------------- */

    int get_hid() const
    {
        return oid;
    };

    int get_cid() const
    {
        return cluster_id;
    };

    unsigned int dispatched() const
    {
        return dispatched_vms.size();
    }

    bool is_public_cloud() const
    {
        return public_cloud;
    }

    void get_permissions(PoolObjectAuth& auth);

    /* ---------------------------------------------------------------------- */
    /* ---------------------------------------------------------------------- */
    /**
     *  Tests whether a new VM can be hosted by the host or not
     *    @param sr, the host share capacity request including cpu, mem, pci
     *    devices and numa topology
     *    @param error error message
     *    @return true if the share can host the VM
     */
    bool test_capacity(HostShareCapacity &sr, std::string & error)
    {
        return share.test_capacity(sr, error);
    }

    /**
     *  Adds a new VM to the given share by incrementing the cpu,mem and disk
     *  counters
     *    @param cpu needed by the VM (percentage)
     *    @param mem needed by the VM (in KB)
     *    @return 0 on success
     */
    void add_capacity(HostShareCapacity &sr)
    {
        share.add_capacity(sr);
        dispatched_vms.insert(sr.vmid);
    };

    /**
     *  Deletes a VM to the given host by updating the cpu,mem and disk
     *  counters
     *    @param cpu needed by the VM (percentage)
     *    @param mem needed by the VM (in KB)
     *    @return 0 on success
     */
    void del_capacity(HostShareCapacity &sr)
    {
        share.del_capacity(sr);
    };

    /**
     *  Tests whether a new VM can be hosted by the local system DS or not
     *    @param dsid DS id
     *    @param vm_disk_mb System disk needed by the VM (in MB)
     *    @return true if the share can host the VM
     */
    bool test_ds_capacity(int dsid, long long vm_disk_mb)
    {
        return share.test_ds_capacity(dsid, vm_disk_mb);
    }

    /**
     *  Adds a new VM to the given local sytem DS share by incrementing the disk
     *  counter
     *    @param dsid DS id
     *    @param vm_disk_mb System disk needed by the VM (in MB)
     */
    void add_ds_capacity(int dsid, long long vm_disk_mb)
    {
        share.add_ds_capacity(dsid, vm_disk_mb);
    }

    /**
     *  Search the Object for a given attribute in a set of object specific
     *  routes.
     *    @param name of the attribute
     *    @param value of the attribute
     *
     *    @return -1 if the element was not found
     */
    int search(const char *name, std::string& value) override
    {
        return __search(name, value);
    }

    int search(const char *name, int& value) override
    {
        return __search(name, value);
    }

    int search(const char *name, float& value) override
    {
        return __search(name, value);
    }

    /**
     *  Prints the Host information to an output stream. This function is used
     *  for logging purposes.
     */
    friend std::ostream& operator<<(std::ostream& o, const HostXML& p);

private:
    int oid;
    int cluster_id;

    HostShareXML share;

    bool public_cloud;

    // ---------------------------------------------------------------------- //
    // Scheduling statistics                                                  //
    // ---------------------------------------------------------------------- //
    std::set<int> dispatched_vms;

    bool is_dispatched(const std::string& vm_id) const
    {
        std::istringstream iss(vm_id);

        int vm_id_i;

        iss >> vm_id_i;

        return dispatched_vms.find(vm_id_i) != dispatched_vms.end();
    }

    bool is_dispatched(int vm_id) const
    {
        return dispatched_vms.find(vm_id) != dispatched_vms.end();
    }

    template<typename T>
    bool is_dispatched(const T& vm_id) const
    {
        return false;
    }

    /* ---------------------------------------------------------------------- */
    /* Functions to search for values in the HostXML object                   */
    /* ---------------------------------------------------------------------- */
    static const char *host_paths[];

    static int host_num_paths;

    /**
     *  Search the Object for a given attribute in a set of object specific
     *  routes. Overrite ObjectXML function to deal with pseudo-attributes
     *    - CURRENT_VMS. value is the VM ID to search in the set of VMS
     *    running VMs in the host. If the VM_ID is found value is not modified
     *    otherwise is set to -1
     */
    template<typename T>
    int __search(const char *name, T& value)
    {
        std::string s_name(name);

        if (s_name == "CURRENT_VMS")
        {
            std::vector<T> results;

            xpaths(results, "/HOST/VMS/ID");

            for (const auto& vm_id : results)
            {
                if (vm_id == value)
                {
                    return 0; //VMID found in VMS value is VMID
                }
            }

            if ( is_dispatched(value) )
            {
                return 0;
            }

            value = -1; //VMID not found in VMS value is -1

            return 0;
        }
        else
        {
            return ObjectXML::search(name, value);
        }
    };

    /**
     *  Bootstrap the HostXML internal attributes
     */
    void init_attributes();
};

#endif /* HOST_XML_H_ */
