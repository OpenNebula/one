/* ------------------------------------------------------------------------ */
/* Copyright 2002-2021, OpenNebula Project, OpenNebula Systems              */
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

#ifndef HOST_SHARE_PCI_H_
#define HOST_SHARE_PCI_H_

#include "ObjectXML.h"
#include "Template.h"
#include <time.h>
#include <set>
#include <map>

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

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

    HostSharePCI(const HostSharePCI& src);

    virtual ~HostSharePCI()
    {
        clear();
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
    bool test(const vector<VectorAttribute *> &devs) const;

    /**
     *  Assign the requested devices to the given VM. The assigned devices will
     *  be labeled with the VM and the PCI attribute of the VM extended with
     *  the address of the assigned devices.
     *    @param devs list of requested PCI devices, will include address of
     *    assigned devices.
     *    @param vmid of the VM
     */
    void add(vector<VectorAttribute *> &devs, int vmid);

    /**
     *  Remove the VM assignment from the PCI device list
     */
    void del(const std::vector<VectorAttribute *> &devs, int vmid);

    /**
     *  Revert the VM assignment from the PCI device list
     */
    void revert(std::vector<VectorAttribute *> &devs);

    /**
     *  Updates the PCI list with monitor data, it will create or
     *  remove PCIDevices as needed.
     */
    void set_monitorization(Template& ht);

    void clear() override;

    /**
     *  Prints the PCI device list to an output stream. This function is used
     *  for logging purposes and *not* for generating DB content.
     */
    friend ostream& operator<<(ostream& o, const HostSharePCI& p);

    HostSharePCI& operator=(const HostSharePCI& other);

    HostSharePCI& operator=(HostSharePCI&& other) noexcept;

    /**
     *  Gets a 4 hex digits value from attribute
     *    @param name of the attribute
     *    @pci_device VectorAttribute representing the device
     *    @return the 0 if not found, -1 syntax error, >0 valid hex value
     */
    static int get_pci_value(const char * name,
                             const VectorAttribute * pci_device,
                             unsigned int& value);
    /**
     *  Sets the PCI device address in the Virtual Machine as follows;
     *    - VM_DOMAIN: 0x0000
     *    - VM_BUS: dbus or VM_BUS in PCI attribute
     *    - VM_SLOT: PCI_ID + 1
     *    - VM_FUNCTION: 0
     *    - VM_ADDRESS: BUS:SLOT.0
     *  @param pci_device to set the address in
     *  @param default_bus if not set in PCI attribute (PCI_PASSTHROUGH_BUS
     *   in oned.conf)
     *  @return -1 if wrong bus 0 on success
     */
    static int set_pci_address(VectorAttribute * pci_device, const string& dbus);

private:
    /**
     *  Sets the internal class structures from the template
     */
    void init();

    /**
     *  Internal structure to represent PCI devices for fast look up and
     *  update
     */
    struct PCIDevice
    {
        PCIDevice(VectorAttribute * _attrs);

        PCIDevice(const PCIDevice& src);

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

#endif /*HOST_SHARE_PCI_H_*/
