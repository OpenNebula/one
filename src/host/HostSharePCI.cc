/* ------------------------------------------------------------------------*/
/* Copyright 2002-2022, OpenNebula Project, OpenNebula Systems             */
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
#include <set>

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

/* -------------------------------------------------------------------------- */
/*  Function to test PCI availability at the host                             */
/* -------------------------------------------------------------------------- */

bool HostSharePCI::test_by_addr(const VectorAttribute *dev, const string& short_addr) const
{
    for (auto jt = pci_devices.begin(); jt != pci_devices.end(); jt++)
    {
        PCIDevice * pci = jt->second;

        if (pci->attrs->vector_value("SHORT_ADDRESS") != short_addr)
        {
            continue;
        }

        if (pci->vmid != -1)
        {
            return false;
        }

        return true;
    }

    return false;
}

/* -------------------------------------------------------------------------- */

bool HostSharePCI::test_by_name(const VectorAttribute *device, std::set<string>& assigned) const
{
    unsigned int vendor_id, device_id, class_id;

    int vendor_rc = get_pci_value("VENDOR", device, vendor_id);
    int device_rc = get_pci_value("DEVICE", device, device_id);
    int class_rc  = get_pci_value("CLASS" , device, class_id);

    if (vendor_rc <= 0 && device_rc <= 0 && class_rc <= 0)
    {
        return false;
    }

    for (auto jt = pci_devices.begin(); jt != pci_devices.end(); jt++)
    {
        PCIDevice * pci = jt->second;

        string short_addr = pci->attrs->vector_value("SHORT_ADDRESS");

        if ((class_rc  == 0 || pci->class_id  == class_id)  &&
            (vendor_rc == 0 || pci->vendor_id == vendor_id) &&
            (device_rc == 0 || pci->device_id == device_id) &&
            pci->vmid  == -1 &&
            assigned.find(short_addr) == assigned.end())
        {
            assigned.insert(short_addr);

            return true;
        }
    }

    return false;
}

/* -------------------------------------------------------------------------- */

bool HostSharePCI::test(const vector<VectorAttribute *> &devs) const
{
    std::set<string> assigned;
    std::set<const VectorAttribute *> tested;
    unsigned int vendor_id, device_id, class_id;

    // Test for "SHORT_ADDRESS" PCI selection
    // and pre-allocated these first
    for (const auto& device : devs)
    {
        string short_addr = device->vector_value("SHORT_ADDRESS");

        // Be aware of special case after migration, when
        // !short_addr.empty() and at least one of vendor/device/class is set
        if (short_addr.empty() ||
            get_pci_value("VENDOR", device, vendor_id) > 0 ||
            get_pci_value("DEVICE", device, device_id) > 0 ||
            get_pci_value("CLASS" , device, class_id) > 0)
        {
            continue;
        }

        if (!test_by_addr(device, short_addr))
        {
            return false;
        }

        tested.insert(device);

        assigned.insert(short_addr);
    }

    // Test for "VENDOR/DEVICE/CLASS" PCI selection
    // use any remaining free device
    for (const auto& device : devs)
    {
        if (tested.find(device) != tested.end())
        {
            continue;
        }

        if (!test_by_name(device, assigned))
        {
            return false;
        }
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/*  Function to assign host PCI devices to a VM                               */
/* -------------------------------------------------------------------------- */
void HostSharePCI::pci_attribute(VectorAttribute *device, PCIDevice *pci,
        bool set_prev)
{
    static vector<string> cp_attr = {"DOMAIN", "BUS", "SLOT", "FUNCTION",
        "ADDRESS", "SHORT_ADDRESS"};

    static vector<string> cp_check_attr = {"NUMA_NODE", "UUID"};

    //Save previous address for migrations, clear on revert - failed migration
    if (set_prev)
    {
        string address = device->vector_value("ADDRESS");

        if (!address.empty())
        {
            device->replace("PREV_ADDRESS", address);
        }
    }
    else
    {
        device->remove("PREV_ADDRESS");
    }

    //Set PCI device attributes
    for (const auto& attr : cp_attr)
    {
        device->replace(attr, pci->attrs->vector_value(attr));
    }

    //Set Optional PCI attributes
    for (const auto& attr : cp_check_attr)
    {
        string vvalue = pci->attrs->vector_value(attr);

        if (!vvalue.empty())
        {
            device->replace(attr, vvalue);
        }
    }
}

/* -------------------------------------------------------------------------- */

bool HostSharePCI::add_by_addr(VectorAttribute *device, const string& short_addr,
        int vmid)
{
    for (auto jt = pci_devices.begin(); jt != pci_devices.end(); jt++)
    {
        PCIDevice * pci = jt->second;

        if (pci->attrs->vector_value("SHORT_ADDRESS") != short_addr)
        {
            continue;
        }

        if ( pci->vmid != -1 )
        {
            return false;
        }

        pci->vmid = vmid;

        pci->attrs->replace("VMID", vmid);

        pci_attribute(device, pci, true);

        return true;
    }

    return false;
}

/* -------------------------------------------------------------------------- */

bool HostSharePCI::add_by_name(VectorAttribute *device, int vmid)
{
    unsigned int vendor_id, device_id, class_id;

    int vendor_rc = get_pci_value("VENDOR", device, vendor_id);
    int device_rc = get_pci_value("DEVICE", device, device_id);
    int class_rc  = get_pci_value("CLASS" , device, class_id);

    if (vendor_rc <= 0 && device_rc <= 0 && class_rc <= 0)
    {
        return false;
    }

    for (auto jt = pci_devices.begin(); jt != pci_devices.end(); jt++)
    {
        PCIDevice * pci = jt->second;

        if ((class_rc  == 0 || pci->class_id  == class_id)  &&
            (vendor_rc == 0 || pci->vendor_id == vendor_id) &&
            (device_rc == 0 || pci->device_id == device_id) &&
            pci->vmid  == -1 )
        {
            pci->vmid = vmid;

            pci->attrs->replace("VMID", vmid);

            pci_attribute(device, pci, true);

            return true;
        }
    }

    return false;
}

/* -------------------------------------------------------------------------- */

bool HostSharePCI::add(vector<VectorAttribute *> &devs, int vmid)
{
    std::set<VectorAttribute *> added;
    unsigned int vendor_id, device_id, class_id;

    for (auto& device : devs)
    {
        string short_addr = device->vector_value("SHORT_ADDRESS");

        if (short_addr.empty() ||
            get_pci_value("VENDOR", device, vendor_id) > 0 ||
            get_pci_value("DEVICE", device, device_id) > 0 ||
            get_pci_value("CLASS" , device, class_id) > 0)
        {
            continue;
        }

        if (!add_by_addr(device, short_addr, vmid))
        {
            return false;
        }

        added.insert(device);
    }

    for (auto& device : devs)
    {
        if (added.find(device) != added.end())
        {
            continue;
        }

        if (!add_by_name(device, vmid))
        {
            return false;
        }
    }

    return true;
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

        if (address.empty())
        {
            continue;
        }

        auto pci = pci_devices[address];

        if (!pci)
        {
            continue;
        }

        pci_attribute(device, pci, false);
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
        const string& dbus, bool clean)
{
    string        bus;
    ostringstream oss;

    unsigned int ibus, slot;

    // ------------------- Remove well-known attributes -----------------------
    static vector<string> rm_attr = {"DOMAIN", "BUS", "SLOT", "FUNCTION",
        "ADDRESS", "PREV_ADDRESS", "NUMA_NODE", "UUID"};

    if (clean)
    {
        for (const auto& attr : rm_attr)
        {
            pci_device->remove(attr);
        }
    }

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

