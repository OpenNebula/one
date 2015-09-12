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
 *    <DOMAIN> PCI address domain
 *    <BUS>    PCI address bus
 *    <SLOT>   PCI address slot
 *    <FUNCTION> PCI address function
 *    <ADDRESS> PCI address, bus, slot and function
 *    <VENDOR> ID of PCI device vendor
 *    <DEVICE> ID of PCI device
 *    <CLASS> ID of PCI device class
 *    <VMID> ID using this device, -1 if free
 *
 *  The monitor probe may report additional information such as VENDOR_NAME,
 *  DEVICE_NAME, CLASS_NAME...
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
     *  Test whether this PCI device set has the requested devices available.
     *    @param devs list of requested devices by the VM.
     *    @return true if all the devices are available.
     */
    bool test(const vector<Attribute *> &devs) const;

    /**
     *  Assign the requested devices to the given VM. The assigned devices will
     *  be labeled with the VM and the PCI attribute of the VM extended with
     *  the address of the assigned devices.
     *    @param devs list of requested PCI devices, will include address of
     *    assigned devices.
     *    @param vmid of the VM
     */
    void add(vector<Attribute *> &devs, int vmid);

    /**
     *  Remove the VM assignment from the PCI device list
     */
    void del(const vector<Attribute *> &devs);

    /**
     *  Updates the PCI list with monitor data, it will create or
     *  remove PCIDevices as needed.
     */
    void set_monitorization(vector<Attribute*> &pci_att);

    /**
     *  Prints the PCI device list to an output stream. This function is used
     *  for logging purposes and *not* for generating DB content.
     */
    friend ostream& operator<<(ostream& o, const HostSharePCI& p);

    /**
     *  Gets a 4 hex digits value from attribute
     *    @param name of the attribute
     *    @pci_device VectorAttribute representing the device
     *    @return the 0 if not found, -1 syntax error, >0 valid hex value
     */
    static int get_pci_value(const char * name,
                             const VectorAttribute * pci_device,
                             unsigned int& value);

private:
    /**
     *  Sets the internal class structures from the template
     */
    int init();

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
     *    @param pci_devs requested by the VM
     */
    void del(long long cpu, long long mem, long long disk, vector<Attribute *> pci_devs)
    {
        cpu_usage  -= cpu;
        mem_usage  -= mem;
        disk_usage -= disk;

        pci.del(pci_devs);

        running_vms--;
    }

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
    bool test(long long cpu, long long mem, long long disk,
              vector<Attribute *>& pci_devs, string& error) const
    {
        bool pci_fits = pci.test(pci_devs);

        bool fits = (((max_cpu  - cpu_usage ) >= cpu) &&
                     ((max_mem  - mem_usage ) >= mem) &&
                     ((max_disk - disk_usage) >= disk)&&
                     pci_fits);

        if (!fits)
        {
            if ( pci_fits )
            {
                error = "Not enough capacity.";
            }
            else
            {
                error = "Unavailable PCI device.";
            }
        }

        return fits;
    }

    /**
     *  Check if this share can host a VM, testing only the PCI devices.
     *    @param pci_devs requested by the VM
     *    @param error Returns the error reason, if any
     *
     *    @return true if the share can host the VM or it is the only one
     *    configured
     */
    bool test(vector<Attribute *>& pci_devs, string& error) const
    {
        bool fits = pci.test(pci_devs);

        if (!fits)
        {
            error = "Unavailable PCI device.";
        }

        return fits;
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
