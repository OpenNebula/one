/* ------------------------------------------------------------------------*/
/* Copyright 2002-2021, OpenNebula Project, OpenNebula Systems             */
/*                                                                         */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may */
/* not use this file except in compliance with the License. You may obtain */
/* a copy of the License at                                                */
/*                                                                         */
/* http://www.apache.org/licenses/LICENSE-2.0                              */
/*                                                                         */
/* Unless required by applicable law or agreed to in writing, software     */
/* distributed under the License is distributed on an "AS IS" BASIS,       */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.*/
/* See the License for the specific language governing permissions and     */
/* limitations under the License.                                          */
/* ------------------------------------------------------------------------*/

#include <limits.h>

#include <iostream>
#include <sstream>
#include <stdexcept>
#include <iomanip>

#include <math.h>

#include "HostSharePCI.h"
#include "Host.h"

using namespace std;

/* ************************************************************************ */
/* HostSharePCI                                                             */
/* ************************************************************************ */

HostSharePCI::HostSharePCI(const HostSharePCI& src)
    : Template(src)
{
    for (const auto& pci : src.pci_devices)
    {
        pci_devices.insert({pci.first, new PCIDevice(*pci.second)});
    }
}

/* ------------------------------------------------------------------------*/
/* ------------------------------------------------------------------------*/

int HostSharePCI::from_xml_node(const xmlNodePtr node)
{
    int rc = Template::from_xml_node(node);

    if (rc != 0)
    {
        return -1;
    }

    init();

    return 0;
}

/* ------------------------------------------------------------------------*/
/* ------------------------------------------------------------------------*/

void HostSharePCI::init()
{
    vector<VectorAttribute *> devices;

    int num_devs = get("PCI", devices);

    for (int i=0; i < num_devs; i++)
    {
        PCIDevice * pcidev = new PCIDevice(devices[i]);

        pci_devices.insert(make_pair(pcidev->address, pcidev));
    }
}

/* ------------------------------------------------------------------------*/
/* ------------------------------------------------------------------------*/

bool HostSharePCI::test(const vector<VectorAttribute *> &devs) const
{
    std::set<string> assigned;

    unsigned int vendor_id, device_id, class_id;
    int vendor_rc, device_rc, class_rc;
    bool found;

    for (auto device : devs)
    {
        vendor_rc = get_pci_value("VENDOR", device, vendor_id);
        device_rc = get_pci_value("DEVICE", device, device_id);
        class_rc  = get_pci_value("CLASS" , device, class_id);

        if (vendor_rc <= 0 && device_rc <= 0 && class_rc <= 0)
        {
            return false;
        }

        found = false;
        for (auto jt = pci_devices.begin(); jt != pci_devices.end(); jt++)
        {
            PCIDevice * dev = jt->second;

            if ((class_rc  == 0 || dev->class_id  == class_id)  &&
                (vendor_rc == 0 || dev->vendor_id == vendor_id) &&
                (device_rc == 0 || dev->device_id == device_id) &&
                dev->vmid  == -1 &&
                assigned.find(dev->address) == assigned.end())
            {
                assigned.insert(dev->address);
                found = true;

                break;
            }
        }

        if (!found)
        {
            return false;
        }
    }

    return true;
}

/* ------------------------------------------------------------------------*/
/* ------------------------------------------------------------------------*/

void HostSharePCI::add(vector<VectorAttribute *> &devs, int vmid)
{
    unsigned int vendor_id, device_id, class_id;
    string address, uuid;
    int vendor_rc, device_rc, class_rc, addr_rc;

    for (auto device : devs)
    {
        vendor_rc = get_pci_value("VENDOR", device, vendor_id);
        device_rc = get_pci_value("DEVICE", device, device_id);
        class_rc  = get_pci_value("CLASS" , device, class_id);

        addr_rc = device->vector_value("ADDRESS", address);

        for (auto jt = pci_devices.begin(); jt != pci_devices.end(); jt++)
        {
            PCIDevice * dev = jt->second;

            if ((class_rc  == 0 || dev->class_id  == class_id)  &&
                (vendor_rc == 0 || dev->vendor_id == vendor_id) &&
                (device_rc == 0 || dev->device_id == device_id) &&
                dev->vmid  == -1 )
            {
                int node = -1;

                dev->vmid = vmid;
                dev->attrs->replace("VMID", vmid);

                device->replace("DOMAIN", dev->attrs->vector_value("DOMAIN"));
                device->replace("BUS", dev->attrs->vector_value("BUS"));
                device->replace("SLOT", dev->attrs->vector_value("SLOT"));
                device->replace("FUNCTION",dev->attrs->vector_value("FUNCTION"));

                device->replace("ADDRESS", dev->attrs->vector_value("ADDRESS"));

                if (addr_rc != -1 && !address.empty())
                {
                    device->replace("PREV_ADDRESS", address);
                }

                if (dev->attrs->vector_value("NUMA_NODE", node)==0 && node !=-1)
                {
                    device->replace("NUMA_NODE", node);
                }

                uuid = dev->attrs->vector_value("UUID");

                if ( !uuid.empty() )
                {
                    device->replace("UUID", uuid);
                }

                break;
            }
        }
    }
}

/* ------------------------------------------------------------------------*/
/* ------------------------------------------------------------------------*/

void HostSharePCI::del(const vector<VectorAttribute *> &devs, int vmid)
{
    for (auto device : devs)
    {
        auto pci_it = pci_devices.find(device->vector_value("PREV_ADDRESS"));

        if (pci_it != pci_devices.end() && pci_it->second->vmid == vmid)
        {
            pci_it->second->vmid = -1;
            pci_it->second->attrs->replace("VMID",-1);

            device->remove("PREV_ADDRESS");

            continue;
        }

        pci_it = pci_devices.find(device->vector_value("ADDRESS"));

        if (pci_it != pci_devices.end() && pci_it->second->vmid == vmid)
        {
            pci_it->second->vmid = -1;
            pci_it->second->attrs->replace("VMID",-1);

            // Clean address from VM as it's not using it anymore
            device->remove("ADDRESS");
        }
    }
};

/* ------------------------------------------------------------------------*/
/* ------------------------------------------------------------------------*/

void HostSharePCI::revert(vector<VectorAttribute *> &devs)
{
    string address;

    for (auto device : devs)
    {
        device->vector_value("PREV_ADDRESS", address);

        if (!address.empty())
        {
            auto dev = pci_devices[address];

            if (!dev)
            {
                continue;
            }

            device->replace("DOMAIN", dev->attrs->vector_value("DOMAIN"));
            device->replace("BUS", dev->attrs->vector_value("BUS"));
            device->replace("SLOT", dev->attrs->vector_value("SLOT"));
            device->replace("FUNCTION",dev->attrs->vector_value("FUNCTION"));
            device->replace("ADDRESS", address);
            device->remove("PREV_ADDRESS");

            int node = -1;
            if (dev->attrs->vector_value("NUMA_NODE", node)==0 && node !=-1)
            {
                device->replace("NUMA_NODE", node);
            }

            break;
        }
    }
}

/* ------------------------------------------------------------------------*/
/* ------------------------------------------------------------------------*/

void HostSharePCI::set_monitorization(Template& ht)
{
    string address;

    std::set<string> missing;

    vector<VectorAttribute*> pci_att;

    ht.remove("PCI", pci_att);

    for (auto pci_it = pci_devices.begin(); pci_it != pci_devices.end(); pci_it++)
    {
        missing.insert(pci_it->first);
    }

    for (auto pci : pci_att)
    {
        address = pci->vector_value("ADDRESS");

        if (address.empty())
        {
            delete pci;
            continue;
        }

        auto pci_it = pci_devices.find(address);

        if (pci_it != pci_devices.end())
        {
            missing.erase(address);
            delete pci;

            continue;
        }

        PCIDevice * dev = new PCIDevice(pci);

        pci_devices.insert(make_pair(address, dev));

        set(pci);
    }

    //Remove missing devices from the share if there are no VMs using them
    for (const auto& miss : missing)
    {
        auto pci_it = pci_devices.find(miss);

        if ( pci_it->second->vmid != -1 )
        {
            continue;
        }

        remove(pci_it->second->attrs);

        delete pci_it->second->attrs;

        delete pci_it->second;

        pci_devices.erase(pci_it);
    }
};

/* ------------------------------------------------------------------------*/
/* ------------------------------------------------------------------------*/

void HostSharePCI::clear()
{
    Template::clear();

    for (auto& pci : pci_devices)
    {
        delete pci.second;
    }
    pci_devices.clear();
}

/* ------------------------------------------------------------------------*/
/* ------------------------------------------------------------------------*/

int HostSharePCI::get_pci_value(const char * name,
    const VectorAttribute * pci_device, unsigned int &pci_value)
{
    string temp;

    temp = pci_device->vector_value(name);

    if (temp.empty())
    {
        return 0;
    }

    istringstream iss(temp);

    iss >> hex >> pci_value;

    if (iss.fail() || !iss.eof())
    {
        return -1;
    }

    return 1;
}


/* ------------------------------------------------------------------------*/
/* ------------------------------------------------------------------------*/

int HostSharePCI::set_pci_address(VectorAttribute * pci_device,
        const string& dbus)
{
    string        bus;
    ostringstream oss;

    unsigned int ibus, slot;

    // ------------------- DOMAIN & FUNCTION -------------------------
    pci_device->replace("VM_DOMAIN", "0x0000");
    pci_device->replace("VM_FUNCTION", "0");

    // --------------------------- BUS -------------------------------
    bus = pci_device->vector_value("VM_BUS");

    if ( bus.empty() )
    {
        bus = dbus;
    }

    istringstream iss(bus);

    iss >> hex >> ibus;

    if (iss.fail() || !iss.eof())
    {
        return -1;
    }

    oss << showbase << internal << setfill('0') << hex << setw(4) << ibus;

    pci_device->replace("VM_BUS", oss.str());

    // --------------------- SLOT (PCI_ID +1) -----------------------
    oss.str("");

    pci_device->vector_value("PCI_ID", slot);

    slot = slot + 1;

    oss << showbase << internal << setfill('0') << hex << setw(4) << slot;

    pci_device->replace("VM_SLOT", oss.str());

    // ------------------- ADDRESS (BUS:SLOT.0) ---------------------
    oss.str("");

    oss << noshowbase<<internal<<hex<<setfill('0')<<setw(2) << ibus << ":"
        << noshowbase<<internal<<hex<<setfill('0')<<setw(2) << slot << ".0";

    pci_device->replace("VM_ADDRESS", oss.str());

    return 0;
}

/* ------------------------------------------------------------------------*/
/* ------------------------------------------------------------------------*/

HostSharePCI::PCIDevice::PCIDevice(VectorAttribute * _attrs)
    : vmid(-1), attrs(_attrs)
{
    vendor_id = 0;
    device_id = 0;
    class_id  = 0;

    get_pci_value("VENDOR", attrs, vendor_id);
    get_pci_value("DEVICE", attrs, device_id);
    get_pci_value("CLASS" , attrs, class_id);

    if (attrs->vector_value("VMID", vmid) == -1)
    {
        attrs->replace("VMID", -1);
    }

    attrs->vector_value("ADDRESS", address);
};

/* ------------------------------------------------------------------------*/
/* ------------------------------------------------------------------------*/

HostSharePCI::PCIDevice::PCIDevice(const PCIDevice& src)
{
    vendor_id = src.vendor_id;
    device_id = src.device_id;
    class_id  = src.class_id;
    vmid      = src.vmid;
    address   = src.address;

    attrs = src.attrs->clone();
};

/* ------------------------------------------------------------------------*/
/* ------------------------------------------------------------------------*/

ostream& operator<<(ostream& os, const HostSharePCI& pci)
{
    os  << right << setw(15)<< "PCI ADDRESS"<< " "
        << right << setw(8) << "CLASS"  << " "
        << right << setw(8) << "VENDOR" << " "
        << right << setw(8) << "DEVICE" << " "
        << right << setw(8) << "VMID"   << " "
        << endl  << setw(55) << setfill('-') << "-" << setfill(' ') << endl;

    for (auto it=pci.pci_devices.begin(); it!=pci.pci_devices.end(); ++it)
    {
        HostSharePCI::PCIDevice * dev = it->second;

        os << right << setw(15) << dev->address << " "
           << right << hex << showbase
           << setw(8) << dev->class_id    << " "
           << setw(8) << dev->vendor_id   << " "
           << setw(8) << dev->device_id   << " "
           << setw(8) << dec << dev->vmid << " " << endl;
    }

    return os;
}

/* ------------------------------------------------------------------------*/
/* ------------------------------------------------------------------------*/

HostSharePCI& HostSharePCI::operator=(const HostSharePCI& other)
{
    if (this != &other) // no-op on self assignment
    {
        clear();
        Template::operator=(other);

        for (const auto& pci : other.pci_devices)
        {
            pci_devices.insert({pci.first, new PCIDevice(*pci.second)});
        }
    }
    return *this;
}

/* ------------------------------------------------------------------------*/
/* ------------------------------------------------------------------------*/

HostSharePCI& HostSharePCI::operator=(HostSharePCI&& other) noexcept
{
    if (this != &other) // no-op self assignment
    {
        clear();
        Template::operator=(std::move(other));

        pci_devices = std::move(other.pci_devices);
    }

    return *this;
}

