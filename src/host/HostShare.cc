/* ------------------------------------------------------------------------*/
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs     */
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

    return init();
}

int HostSharePCI::init()
{
    vector<Attribute *> devices;

    int num_devs = get("PCI", devices);

    for (int i=0; i < num_devs; i++)
    {
        VectorAttribute * pci = dynamic_cast<VectorAttribute *>(devices[i]);

        if (pci == 0)
        {
            return -1;
        }

        PCIDevice * pcidev = new PCIDevice(pci);

        pci_devices.insert(make_pair(pcidev->address, pcidev));
    }

    return 0;
}

/* ------------------------------------------------------------------------*/
/* ------------------------------------------------------------------------*/

bool HostSharePCI::test_set(unsigned int vendor_id, unsigned int device_id,
        unsigned int class_id, VectorAttribute * devreq, int vmid,
        std::set<string>& assigned)
{
    map<string, PCIDevice *>::iterator it;

    for (it=pci_devices.begin(); it!=pci_devices.end(); it++)
    {
        PCIDevice * dev = it->second;

        if ((class_id  == 0 || dev->class_id  == class_id)  &&
		    (vendor_id == 0 || dev->vendor_id == vendor_id) &&
            (device_id == 0 || dev->device_id == device_id) &&
            dev->vmid  == -1 &&
            assigned.find(dev->address) == assigned.end())
        {
            assigned.insert(dev->address);

            if (vmid != -1)
            {
                dev->vmid = vmid;
                dev->attrs->replace("VMID", vmid);

                devreq->replace("DOMAIN",dev->attrs->vector_value("DOMAIN"));
                devreq->replace("BUS",dev->attrs->vector_value("BUS"));
                devreq->replace("SLOT",dev->attrs->vector_value("SLOT"));
                devreq->replace("FUNCTION",dev->attrs->vector_value("FUNCTION"));

                devreq->replace("ADDRESS",dev->attrs->vector_value("ADDRESS"));
            }

            return true;
        }
    }

    return false;
}

/* ------------------------------------------------------------------------*/

bool HostSharePCI::test_set(vector<Attribute *> &devs, int vmid)
{
    vector<Attribute *>::iterator it;
    std::set<string> assigned;

    unsigned int vendor_id, device_id, class_id;

    for ( it=devs.begin(); it!= devs.end(); it++)
    {
        VectorAttribute * pci = dynamic_cast<VectorAttribute *>(*it);

        if ( pci == 0 )
        {
            return false;
        }

        vendor_id = get_pci_value("VENDOR", pci);
        device_id = get_pci_value("DEVICE", pci);
        class_id  = get_pci_value("CLASS", pci);

        if (!test_set(vendor_id, device_id, class_id, pci, vmid, assigned))
        {
            return false;
        }
    }

    return true;
}

/* ------------------------------------------------------------------------*/
/* ------------------------------------------------------------------------*/

void HostSharePCI::del(const vector<Attribute *> &devs)
{
    vector<Attribute *>::const_iterator it;
    map<string, PCIDevice *>::iterator pci_it;

    for ( it=devs.begin(); it!= devs.end(); it++)
    {
        const VectorAttribute * pci = dynamic_cast<const VectorAttribute *>(*it);

        if ( pci == 0 )
        {
            continue;
        }

        pci_it = pci_devices.find(pci->vector_value("ADDRESS"));

        if (pci_it != pci_devices.end())
        {
            pci_it->second->vmid = -1;
            pci_it->second->attrs->replace("VMID",-1);
        }
    }
};

/* ------------------------------------------------------------------------*/
/* ------------------------------------------------------------------------*/

void HostSharePCI::set_monitorization(vector<Attribute*> &pci_att)
{
    vector<Attribute*>::iterator it;
    map<string, PCIDevice*>::iterator pci_it;

    string address;

    for (it = pci_att.begin(); it != pci_att.end(); it++)
    {
        VectorAttribute * pci = dynamic_cast<VectorAttribute *>(*it);

        if ( pci == 0 )
        {
            continue;
        }

        address = pci->vector_value("ADDRESS");

        if (address.empty())
        {
            delete pci;
            continue;
        }

        pci_it = pci_devices.find(address);

        if (pci_it != pci_devices.end())
        {
            delete pci;
            continue;
        }

        PCIDevice * dev = new PCIDevice(pci);

        pci_devices.insert(make_pair(address, dev));

        set(pci);
    }
};

/* ------------------------------------------------------------------------*/
/* ------------------------------------------------------------------------*/

unsigned int HostSharePCI::get_pci_value(const char * name,
    const VectorAttribute * pci_device)
{
    string temp;

    temp = pci_device->vector_value(name);

    if (temp.empty())
    {
        return 0;
    }

    unsigned int  pci_value;
    istringstream iss(temp);

    iss >> hex >> pci_value;

    if (iss.fail() || !iss.eof())
    {
        return 0;
    }

    return pci_value;
}

/* ------------------------------------------------------------------------*/
/* ------------------------------------------------------------------------*/

HostSharePCI::PCIDevice::PCIDevice(VectorAttribute * _attrs)
    : vmid(-1), attrs(_attrs)
{
    vendor_id = get_pci_value("VENDOR", attrs);
    device_id = get_pci_value("DEVICE", attrs);
    class_id  = get_pci_value("CLASS", attrs);

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

    rc += xpath(disk_usage, "/HOST_SHARE/DISK_USAGE", -1);
    rc += xpath(mem_usage,  "/HOST_SHARE/MEM_USAGE",  -1);
    rc += xpath(cpu_usage,  "/HOST_SHARE/CPU_USAGE",  -1);

    rc += xpath(max_disk,   "/HOST_SHARE/MAX_DISK",   -1);
    rc += xpath(max_mem ,   "/HOST_SHARE/MAX_MEM",    -1);
    rc += xpath(max_cpu ,   "/HOST_SHARE/MAX_CPU",    -1);

    rc += xpath(free_disk,  "/HOST_SHARE/FREE_DISK",  -1);
    rc += xpath(free_mem ,  "/HOST_SHARE/FREE_MEM",   -1);
    rc += xpath(free_cpu ,  "/HOST_SHARE/FREE_CPU",   -1);

    rc += xpath(used_disk,  "/HOST_SHARE/USED_DISK",  -1);
    rc += xpath(used_mem ,  "/HOST_SHARE/USED_MEM",   -1);
    rc += xpath(used_cpu ,  "/HOST_SHARE/USED_CPU",   -1);

    rc += xpath(running_vms,"/HOST_SHARE/RUNNING_VMS",-1);

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

void HostShare::set_ds_monitorization(const vector<Attribute*> &ds_att)
{
    vector<Attribute*>::const_iterator it;

    ds.erase("DS");

    for (it = ds_att.begin(); it != ds_att.end(); it++)
    {
        ds.set(*it);
    }
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

