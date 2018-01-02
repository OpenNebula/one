/* ------------------------------------------------------------------------*/
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems             */
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

#include "HostShare.h"
#include "Host.h"

using namespace std;

/* ************************************************************************ */
/* HostSharePCI                                                             */
/* ************************************************************************ */

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
    vector<VectorAttribute *>::const_iterator it;
    map<string, PCIDevice *>::const_iterator jt;

    std::set<string> assigned;

    unsigned int vendor_id, device_id, class_id;
    int vendor_rc, device_rc, class_rc;
    bool found;

    for ( it=devs.begin(); it!= devs.end(); it++)
    {
        vendor_rc = get_pci_value("VENDOR", *it, vendor_id);
        device_rc = get_pci_value("DEVICE", *it, device_id);
        class_rc  = get_pci_value("CLASS" , *it, class_id);

        if (vendor_rc <= 0 && device_rc <= 0 && class_rc <= 0)
        {
            return false;
        }

        for (jt=pci_devices.begin(), found=false; jt!=pci_devices.end(); jt++)
        {
            PCIDevice * dev = jt->second;

            if ((class_rc  == 0 || dev->class_id  == class_id)  &&
                (vendor_rc == 0 || dev->vendor_id == vendor_id) &&
                (device_rc == 0 || dev->device_id == device_id) &&
                dev->vmid  == -1 &&
                assigned.find(dev->address) == assigned.end())
            {
                assigned.insert(dev->address);
                found=true;

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
    vector<VectorAttribute *>::iterator it;
    map<string, PCIDevice *>::const_iterator jt;

    unsigned int vendor_id, device_id, class_id;
    int vendor_rc, device_rc, class_rc;

    for ( it=devs.begin(); it!= devs.end(); it++)
    {
        vendor_rc = get_pci_value("VENDOR", *it, vendor_id);
        device_rc = get_pci_value("DEVICE", *it, device_id);
        class_rc  = get_pci_value("CLASS" , *it, class_id);

        for (jt=pci_devices.begin(); jt!=pci_devices.end(); jt++)
        {
            PCIDevice * dev = jt->second;

            if ((class_rc  == 0 || dev->class_id  == class_id)  &&
                (vendor_rc == 0 || dev->vendor_id == vendor_id) &&
                (device_rc == 0 || dev->device_id == device_id) &&
                dev->vmid  == -1 )
            {
                dev->vmid = vmid;
                dev->attrs->replace("VMID", vmid);

                (*it)->replace("DOMAIN",dev->attrs->vector_value("DOMAIN"));
                (*it)->replace("BUS",dev->attrs->vector_value("BUS"));
                (*it)->replace("SLOT",dev->attrs->vector_value("SLOT"));
                (*it)->replace("FUNCTION",dev->attrs->vector_value("FUNCTION"));

                (*it)->replace("ADDRESS",dev->attrs->vector_value("ADDRESS"));

                break;
            }
        }
    }
}

/* ------------------------------------------------------------------------*/
/* ------------------------------------------------------------------------*/

void HostSharePCI::del(const vector<VectorAttribute *> &devs)
{
    vector<VectorAttribute *>::const_iterator it;
    map<string, PCIDevice *>::iterator pci_it;

    for ( it=devs.begin(); it!= devs.end(); it++)
    {
        pci_it = pci_devices.find((*it)->vector_value("ADDRESS"));

        if (pci_it != pci_devices.end())
        {
            pci_it->second->vmid = -1;
            pci_it->second->attrs->replace("VMID",-1);
        }
    }
};

/* ------------------------------------------------------------------------*/
/* ------------------------------------------------------------------------*/

void HostSharePCI::set_monitorization(vector<VectorAttribute*> &pci_att)
{
    vector<VectorAttribute*>::iterator it;
    map<string, PCIDevice*>::iterator pci_it;

    string address;

    std::set<string> missing;
    std::set<string>::iterator jt;

    for (pci_it = pci_devices.begin(); pci_it != pci_devices.end(); pci_it++)
    {
        missing.insert(pci_it->first);
    }

    for (it = pci_att.begin(); it != pci_att.end(); it++)
    {
        VectorAttribute * pci = *it;

        address = pci->vector_value("ADDRESS");

        if (address.empty())
        {
            delete pci;
            continue;
        }

        pci_it = pci_devices.find(address);

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

    for ( jt = missing.begin() ; jt != missing.end(); jt ++ )
    {
        pci_it = pci_devices.find(*jt);

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

ostream& operator<<(ostream& os, const HostSharePCI& pci)
{
    map<string, HostSharePCI::PCIDevice *>::const_iterator it;

	os  << right << setw(15)<< "PCI ADDRESS"<< " "
		<< right << setw(8) << "CLASS"  << " "
		<< right << setw(8) << "VENDOR" << " "
		<< right << setw(8) << "DEVICE" << " "
		<< right << setw(8) << "VMID"   << " "
		<< endl << setw(55) << setfill('-') << "-" << setfill(' ') << endl;

    for (it=pci.pci_devices.begin(); it!=pci.pci_devices.end(); it++)
    {
        HostSharePCI::PCIDevice * dev = it->second;

		os << right << setw(15)<< dev->address   << " "
		   << right << setw(8) << dev->class_id  << " "
		   << right << setw(8) << dev->vendor_id << " "
		   << right << setw(8) << dev->device_id << " "
		   << right << setw(8) << dev->vmid      << " " << endl;
    }

	return os;
}

/* ************************************************************************ */
/* HostShare :: Constructor/Destructor                                      */
/* ************************************************************************ */

HostShare::HostShare(long long _max_disk,long long _max_mem,long long _max_cpu):
        ObjectXML(),
        disk_usage(0),
        mem_usage(0),
        cpu_usage(0),
        total_mem(_max_mem),
        total_cpu(_max_cpu),
        max_disk(_max_disk),
        max_mem(_max_mem),
        max_cpu(_max_cpu),
        free_disk(0),
        free_mem(0),
        free_cpu(0),
        used_disk(0),
        used_mem(0),
        used_cpu(0),
        running_vms(0){};

ostream& operator<<(ostream& os, HostShare& hs)
{
    string str;

    os << hs.to_xml(str);

    return os;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

string& HostShare::to_xml(string& xml) const
{
    string ds_xml, pci_xml;
    ostringstream   oss;

    oss << "<HOST_SHARE>"
          << "<DISK_USAGE>" << disk_usage << "</DISK_USAGE>"
          << "<MEM_USAGE>"  << mem_usage  << "</MEM_USAGE>"
          << "<CPU_USAGE>"  << cpu_usage  << "</CPU_USAGE>"
          << "<TOTAL_MEM>"  << total_mem  << "</TOTAL_MEM>"
          << "<TOTAL_CPU>"  << total_cpu  << "</TOTAL_CPU>"
          << "<MAX_DISK>"   << max_disk   << "</MAX_DISK>"
          << "<MAX_MEM>"    << max_mem    << "</MAX_MEM>"
          << "<MAX_CPU>"    << max_cpu    << "</MAX_CPU>"
          << "<FREE_DISK>"  << free_disk  << "</FREE_DISK>"
          << "<FREE_MEM>"   << free_mem   << "</FREE_MEM>"
          << "<FREE_CPU>"   << free_cpu   << "</FREE_CPU>"
          << "<USED_DISK>"  << used_disk  << "</USED_DISK>"
          << "<USED_MEM>"   << used_mem   << "</USED_MEM>"
          << "<USED_CPU>"   << used_cpu   << "</USED_CPU>"
          << "<RUNNING_VMS>"<<running_vms <<"</RUNNING_VMS>"
          << ds.to_xml(ds_xml)
          << pci.to_xml(pci_xml)
        << "</HOST_SHARE>";

    xml = oss.str();

    return xml;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

int HostShare::from_xml_node(const xmlNodePtr node)
{
    vector<xmlNodePtr> content;
    int rc = 0;

    // Initialize the internal XML object
    ObjectXML::update_from_node(node);

    rc += xpath<long long>(disk_usage, "/HOST_SHARE/DISK_USAGE", -1);
    rc += xpath<long long>(mem_usage,  "/HOST_SHARE/MEM_USAGE",  -1);
    rc += xpath<long long>(cpu_usage,  "/HOST_SHARE/CPU_USAGE",  -1);

    rc += xpath<long long>(total_mem ,  "/HOST_SHARE/TOTAL_MEM", -1);
    rc += xpath<long long>(total_cpu,   "/HOST_SHARE/TOTAL_CPU", -1);

    rc += xpath<long long>(max_disk,   "/HOST_SHARE/MAX_DISK",   -1);
    rc += xpath<long long>(max_mem ,   "/HOST_SHARE/MAX_MEM",    -1);
    rc += xpath<long long>(max_cpu ,   "/HOST_SHARE/MAX_CPU",    -1);

    rc += xpath<long long>(free_disk,  "/HOST_SHARE/FREE_DISK",  -1);
    rc += xpath<long long>(free_mem ,  "/HOST_SHARE/FREE_MEM",   -1);
    rc += xpath<long long>(free_cpu ,  "/HOST_SHARE/FREE_CPU",   -1);

    rc += xpath<long long>(used_disk,  "/HOST_SHARE/USED_DISK",  -1);
    rc += xpath<long long>(used_mem ,  "/HOST_SHARE/USED_MEM",   -1);
    rc += xpath<long long>(used_cpu ,  "/HOST_SHARE/USED_CPU",   -1);

    rc += xpath<long long>(running_vms,"/HOST_SHARE/RUNNING_VMS",-1);

    // ------------ Datastores ---------------

    ObjectXML::get_nodes("/HOST_SHARE/DATASTORES", content);

    if( content.empty())
    {
        return -1;
    }

    rc += ds.from_xml_node( content[0] );

    ObjectXML::free_nodes(content);

    content.clear();

    if (rc != 0)
    {
        return -1;
    }

    // ------------ PCI Devices ---------------

    ObjectXML::get_nodes("/HOST_SHARE/PCI_DEVICES", content);

    if( content.empty())
    {
        return -1;
    }

    rc += pci.from_xml_node( content[0] );

    ObjectXML::free_nodes(content);

    content.clear();

    if (rc != 0)
    {
        return -1;
    }

    return 0;
}


/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

void HostShare::set_ds_monitorization(const vector<VectorAttribute*> &ds_att)
{
    vector<VectorAttribute*>::const_iterator it;

    ds.erase("DS");

    for (it = ds_att.begin(); it != ds_att.end(); it++)
    {
        ds.set(*it);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static void set_reserved_metric(long long& value, long long mvalue,
        string& reserved)
{
    bool abs = true;

    if ( reserved.empty() )
    {
        value = mvalue;
        return;
    }

    if (std::isspace(reserved.back()))
    {
        reserved = one_util::trim(reserved);
    }

    if (reserved.back() == '%')
    {
        abs = false;
        reserved.erase(reserved.end()-1);
    }

    istringstream iss(reserved);

    iss >> value;

    if (iss.fail() || !iss.eof())
    {
        value = mvalue;
        return;
    }

    if (abs)
    {
        value = mvalue - value;
    }
    else
    {
        value = mvalue * ( 1 - (value / 100.0));
    }

}

/* -------------------------------------------------------------------------- */

void HostShare::set_capacity(Host *host, const string& cluster_rcpu,
        const string& cluster_rmem)
{
    float val;

    string host_rcpu;
    string host_rmem;

    host->get_reserved_capacity(host_rcpu, host_rmem);

    if ( host_rcpu.empty() )
    {
        host_rcpu = cluster_rcpu;
    }

    if ( host_rmem.empty() )
    {
        host_rmem = cluster_rmem;
    }

    host->erase_template_attribute("TOTALCPU", val);
    total_cpu = val;
    set_reserved_metric(max_cpu, val, host_rcpu);

    host->erase_template_attribute("TOTALMEMORY", val);
    total_mem = val;
    set_reserved_metric(max_mem, val, host_rmem);

    host->erase_template_attribute("DS_LOCATION_TOTAL_MB", val);
    max_disk = val;

    host->erase_template_attribute("FREECPU", val);
    free_cpu = val;

    host->erase_template_attribute("FREEMEMORY", val);
    free_mem = val;

    host->erase_template_attribute("DS_LOCATION_FREE_MB", val);
    free_disk = val;

    host->erase_template_attribute("USEDCPU", val);
    used_cpu = val;

    host->erase_template_attribute("USEDMEMORY", val);
    used_mem = val;

    host->erase_template_attribute("DS_LOCATION_USED_MB", val);
    used_disk = val;
}

/* -------------------------------------------------------------------------- */

void HostShare::update_capacity(Host *host)
{
    string host_rcpu;
    string host_rmem;

    host->get_reserved_capacity(host_rcpu, host_rmem);

    set_reserved_metric(max_cpu, total_cpu, host_rcpu);

    set_reserved_metric(max_mem, total_mem, host_rmem);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

