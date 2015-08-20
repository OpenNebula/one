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
#include <set>

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

class HostShareDatastore : public Template
{
public:
    HostShareDatastore() : Template(false, '=', "DATASTORES"){};

    virtual ~HostShareDatastore(){};
};

/**
 *  This class represents a PCI DEVICE list for the host. The list is in the
 *  form:
 *  <PCI>
 *    <TYPE>: Three 4-hex digits groups representing <vendor>:<device>:<class>
 *    <DESCRIPTION>: The corresponding device description
 *    <ADDRESS>: PCI address, bus, slot and function
 */
class HostSharePCI : public Template
{
public:

    HostSharePCI() : Template(false, '=', "PCI_DEVICES"){};

    virtual ~HostSharePCI()
    {
        map<string, PCIDevice *>::iterator it;

        for (it=pci_devices.begin(); it != pci_devices.end(); it++)
        {
            delete it->second;
        };
    };

    /**
     *  Builds the devices list from its XML representation. This function
     *  is used when importing it from the DB.
     *    @param node xmlNode for the template
     *    @return 0 on success
     */
    int from_xml_node(const xmlNodePtr node);

    /**
     *  Test wether this PCI device set has the requested devices available.
     *    @param devs list of requested devices by the VM.
     *    @return true if all the devices are available.
     */
    bool test(vector<Attribute *> &devs)
    {
        return test_set(devs, -1);
    }

    /**
     *  Assign the requested devices to the given VM. The assgined devices will
     *  be labeled with the VM and the PCI attribute of the VM extended with
     *  the address of the assigned devices.
     *    @param devs list of requested PCI devices, will include address of
    *    assgined devices.
     *    @param vmid of the VM
     */
    void add(vector<Attribute *> &devs, int vmid)
    {
        test_set(devs, vmid);
    }

    /**
     *  Remove the VM assigment from the PCI device list
     */
    void del(const vector<Attribute *> &devs);

    /**
     *  Updates the PCI list with monitor data, it will create or
     *  remove PCIDevices as needed.
     */
    void set_monitorization(vector<Attribute*> &pci_att);

private:
    /**
     *  Sets the internal class structures from the template
     */
    int init();

    /**
     *  Test if a PCIDevice matches the vendor, device and class request spec
     *  and can be assigned. It will assgin it if requested.
     *    @param vendor_id id in uint form 0 means *
     *    @param device_id id in uint form 0 means *
     *    @param class_id  id in uint form 0 means *
     *    @param pci requested pci device
     *    @param vmid if not -1 it will also assign the PCI device to the VM,
     *    and the pci attribute will be extended with device information.
     *    @param assgined set of addresses already assgined devices, it will
     *    include the  selected device if found; useful to iterate.
     *
     *    @return true if a device was found.
     */
    bool test_set(unsigned int vendor_id, unsigned int device_id,
        unsigned int class_id, VectorAttribute *pci, int vmid,
        std::set<string> &assigned);

    /**
     *  Test if the given list of PCIDevices can be assigned to the VM
     *    @param devs, list of PCI devices
     *    @param vmid if not -1 it will assign the devices to the VM
     *
     *    @return true if the PCIDevice list can be assgined.
     */
    bool test_set(vector<Attribute *> &devs, int vmid);

    /**
     *  Gets a 4 hex digits value from attribute
     *    @param name of the attribute
     *    @pci_device VectorAttribute representing the device
     *    @return the value as unsigned int or 0 if was not found
     */
    static unsigned int get_pci_value(const char * name,
                                      const VectorAttribute * pci_device);
    /**
     *  Internal structure to represent PCI devices for fast look up and
     *  update
     */
    struct PCIDevice
    {
        PCIDevice(VectorAttribute * _attrs);

        ~PCIDevice(){};

        unsigned int vendor_id;
        unsigned int device_id;
        unsigned int class_id;

        int vmid;

        string address;

        VectorAttribute * attrs;
    };

    map <string, PCIDevice *> pci_devices;
};

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
     *    @param vmid of the VM
     *    @param cpu requested by the VM, in percentage
     *    @param mem requested by the VM, in KB
     *    @param disk requested by the VM
     *    @param pci_devs requested by the VM
     */
    void add(int vmid, long long cpu, long long mem, long long disk,
        vector<Attribute *> pci_devs)
    {
        cpu_usage  += cpu;
        mem_usage  += mem;
        disk_usage += disk;

        pci.add(pci_devs, vmid);

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

    void set_pci_monitorization(vector<Attribute*> &pci_att)
    {
        pci.set_monitorization(pci_att);
    }

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

    HostShareDatastore ds;
    HostSharePCI       pci;

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
