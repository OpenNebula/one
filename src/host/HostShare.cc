/* ------------------------------------------------------------------------*/
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems             */
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
    string address;
    int vendor_rc, device_rc, class_rc, addr_rc;

    for ( it=devs.begin(); it!= devs.end(); it++)
    {
        vendor_rc = get_pci_value("VENDOR", *it, vendor_id);
        device_rc = get_pci_value("DEVICE", *it, device_id);
        class_rc  = get_pci_value("CLASS" , *it, class_id);

        addr_rc = (*it)->vector_value("ADDRESS", address);

        for (jt=pci_devices.begin(); jt!=pci_devices.end(); jt++)
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

                (*it)->replace("DOMAIN",dev->attrs->vector_value("DOMAIN"));
                (*it)->replace("BUS",dev->attrs->vector_value("BUS"));
                (*it)->replace("SLOT",dev->attrs->vector_value("SLOT"));
                (*it)->replace("FUNCTION",dev->attrs->vector_value("FUNCTION"));

                (*it)->replace("ADDRESS",dev->attrs->vector_value("ADDRESS"));

                if (addr_rc != -1 && !address.empty())
                {
                    (*it)->replace("PREV_ADDRESS", address);
                }

                if (dev->attrs->vector_value("NUMA_NODE", node)==0 && node !=-1)
                {
                    (*it)->replace("NUMA_NODE", node);
                }

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
        pci_it = pci_devices.find((*it)->vector_value("PREV_ADDRESS"));

        if (pci_it != pci_devices.end())
        {
            pci_it->second->vmid = -1;
            pci_it->second->attrs->replace("VMID",-1);

            (*it)->remove("PREV_ADDRESS");

            continue;
        }

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

    //Remove missing devices from the share if there are no VMs using them
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
    os  << right << setw(15)<< "PCI ADDRESS"<< " "
        << right << setw(8) << "CLASS"  << " "
        << right << setw(8) << "VENDOR" << " "
        << right << setw(8) << "DEVICE" << " "
        << right << setw(8) << "VMID"   << " "
        << endl << setw(55) << setfill('-') << "-" << setfill(' ') << endl;

    for (auto it=pci.pci_devices.begin(); it!=pci.pci_devices.end(); ++it)
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

/* ************************************************************************** */
/* ************************************************************************** */
/* HostShareNode                                                              */
/* ************************************************************************** */
/* ************************************************************************** */
ostream& operator<<(ostream& o, const HostShareNode& n)
{
    o << setw(75) << setfill('-') << "-" << setfill(' ') << std::endl;
    o << "Node: " << n.node_id  << "\tMemory: " << n.mem_usage / (1024*1024)
      << "/" << n.total_mem / (1024*1024) << "G\n";
    o << setw(75) << setfill('-') << "-" << setfill(' ') << std::endl;

    for (auto it = n.cores.begin(); it!= n.cores.end(); ++it)
    {
        const HostShareNode::Core &c = it->second;

        o <<"(";

        for (auto jt = c.cpus.begin(); jt != c.cpus.end(); ++jt)
        {
            if ( jt != c.cpus.begin() )
            {
                o << " ";
            }

            o << std::setw(2) << jt->first;
        }

        o << ")" ;
    }

    o << std::endl;

    for (auto it = n.cores.begin(); it!= n.cores.end(); ++it)
    {
        const HostShareNode::Core &c = it->second;

        o <<"(";

        for (auto jt = c.cpus.begin(); jt != c.cpus.end(); ++jt)
        {
            if ( jt != c.cpus.begin() )
            {
                o << " ";
            }

            if ( c.reserved_cpus.count(jt->first) == 1 )
            {
                o << std::setw(2) << "r";
            }
            else if ( jt->second.size() == 0 )
            {
                o << std::setw(2) << "-";
            }
            else
            {
                o << std::setw(2) << "x";
            }
        }

        o <<")";
    }

    o << std::endl;

    return o;
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

HostShareNode::Core::Core(unsigned int _i, const std::string& _c,
        unsigned int _vt, bool _d):id(_i), vms_thread(_vt), dedicated(_d)
{
    std::stringstream cpu_s(_c);

    std::string thread;

    free_cpus = 0;

    while (getline(cpu_s, thread, ','))
    {
        unsigned int cpu_id;
        int vm_id = -1;

        if (thread.empty())
        {
            continue;
        }

        std::replace(thread.begin(), thread.end(), ':', ' ');
        std::stringstream thread_s(thread);

        if (!(thread_s >> cpu_id))
        {
            continue;
        }

        if (!(thread_s >> vm_id))
        {
            vm_id = -1;
        }

        if ( vm_id >= 0 )
        {
            cpus[cpu_id].insert(vm_id);
        }
        else if (vm_id == -2)
        {
            cpus[cpu_id];

            reserved_cpus.insert(cpu_id);
        }
        else
        {
            cpus[cpu_id];
        }
    }

    set_cpu_usage();
}

// -----------------------------------------------------------------------------

void HostShareNode::Core::set_cpu_usage()
{
    used_cpus = 0;

    if ( dedicated )
    {
        free_cpus = 0;
        used_cpus = 1;
    }
    else
    {
        for (const auto& cpu : cpus)
        {
            used_cpus += cpu.second.size();
        }

        free_cpus = ((cpus.size() - reserved_cpus.size()) * vms_thread);

        if ( used_cpus > free_cpus )
        {
            free_cpus = 0;
        }
        else
        {
            free_cpus -= used_cpus;
        }
    }
}

// -----------------------------------------------------------------------------

VectorAttribute * HostShareNode::Core::to_attribute()
{
    ostringstream oss;

    for (auto cit = cpus.begin(); cit != cpus.end(); ++cit)
    {
        unsigned int cpu_id = cit->first;

        if (cit != cpus.begin())
        {
            oss << ",";
        }

        if ( reserved_cpus.count(cpu_id) == 1 )
        {
            oss << cpu_id << ":-2";
        }
        else if (cit->second.empty())
        {
            oss << cpu_id << ":-1";
        }
        else
        {
            const std::multiset<unsigned int>& vmids = cit->second;

            for (auto vm = vmids.begin() ; vm != vmids.end() ; ++vm)
            {
                if ( vm != cit->second.begin() )
                {
                    oss << ",";
                }

                oss << cpu_id << ":" << *vm;
            }
        }
    }

    VectorAttribute * vcore = new VectorAttribute("CORE");

    vcore->replace("ID", id);
    vcore->replace("CPUS", oss.str());
    vcore->replace("FREE", free_cpus);
    vcore->replace("DEDICATED", dedicated);

    return vcore;
}

// -----------------------------------------------------------------------------

VectorAttribute * HostShareNode::HugePage::to_attribute()
{
    VectorAttribute * vpage = new VectorAttribute("HUGEPAGE");

    vpage->replace("SIZE", size_kb);
    vpage->replace("PAGES", nr);
    vpage->replace("FREE", free);
    vpage->replace("USAGE", usage);

    return vpage;
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

void HostShareNode::reserve_cpus(const std::string& cpu_ids)
{
    std::vector<unsigned int> ids;

    one_util::split(cpu_ids, ',', ids);

    for ( auto& core_it : cores )
    {
        struct Core &c = core_it.second;

        bool update_core = false;

        for  ( auto& cpu_it : c.cpus )
        {
            unsigned int cpu_id = cpu_it.first;

            bool found = false;

            for ( const auto& id : ids )
            {
                if ( id == cpu_id )
                {
                    found = true;
                    break;
                }
            }

            if ( found )
            {
                if ( cpu_it.second.empty() ) //reserve
                {
                    c.reserved_cpus.insert(cpu_id);
                    update_core = true;
                }
            }
            else if ( c.reserved_cpus.count(cpu_id) == 1 ) //free
            {
                c.reserved_cpus.erase(cpu_id);
                update_core = true;
            }
        }

        if ( update_core )
        {
            c.set_cpu_usage();
        }
    }
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

int HostShareNode::from_xml_node(const xmlNodePtr &node, unsigned int _vt)
{
    int rc = Template::from_xml_node(node);

    if (rc != 0)
    {
        return -1;
    }

    //General node information & status
    if ( get("NODE_ID", node_id) == false )
    {
        return -1;
    }

    //Build the node CPU cores topology
    vector<VectorAttribute *> vcores;

    get("CORE", vcores);

    for (auto vc_it = vcores.begin(); vc_it != vcores.end(); ++vc_it)
    {
        unsigned int core_id;
        std::string  cpus;

        bool dedicated = false;

        (*vc_it)->vector_value("ID", core_id);
        (*vc_it)->vector_value("CPUS", cpus);
        (*vc_it)->vector_value("DEDICATED", dedicated);

        set_core(core_id, cpus, _vt, dedicated, false);
    }

    vector<VectorAttribute *> vpages;

    get("HUGEPAGE", vpages);

    for (auto vp_it = vpages.begin(); vp_it != vpages.end(); ++vp_it)
    {
        unsigned long size_kb, usage_kb;

        unsigned int  nr;
        unsigned int  free;

        (*vp_it)->vector_value("SIZE", size_kb);
        (*vp_it)->vector_value("PAGES",nr);
        (*vp_it)->vector_value("FREE", free);

        (*vp_it)->vector_value("USAGE", usage_kb);

        set_hugepage(size_kb, nr, free, usage_kb, false);
    }

    std::string distance_s;
    VectorAttribute * memory = get("MEMORY");

    if (memory != 0)
    {
        memory->vector_value("TOTAL", total_mem);
        memory->vector_value("FREE", free_mem);
        memory->vector_value("USED", used_mem);

        memory->vector_value("USAGE", mem_usage);

        memory->vector_value("DISTANCE", distance_s);

        one_util::split(distance_s, ' ', distance);
    }

    return 0;
};

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

int HostShareNode::allocate_dedicated_cpus(int id, unsigned int tcpus,
        std::string &c_s)
{
    std::ostringstream oss;

    for (auto vc_it = cores.begin(); vc_it != cores.end(); ++vc_it)
    {
        // ---------------------------------------------------------------------
        // Check this core can allocate a dedicated VM:
        //   2. Not all CPUs are reserved
        //   3. No other VM running in the core
        // ---------------------------------------------------------------------
        HostShareNode::Core &core = vc_it->second;

        if ( core.reserved_cpus.size() >= core.cpus.size() )
        {
            continue;
        }

        if ( core.used_cpus != 0 )
        {
            continue;
        }

        // ---------------------------------------------------------------------
        // Allocate the core and setup allocation string
        // ---------------------------------------------------------------------
        core.cpus.begin()->second.insert(id);

        oss << core.cpus.begin()->first;

        core.dedicated = true;

        core.used_cpus = 1;
        core.free_cpus = 0;

        if ( --tcpus == 0 )
        {
            c_s = oss.str();
            break;
        }

        oss << ",";
    }

    if ( tcpus != 0 )
    {
        return -1;
    }

    update_cores();

    c_s = oss.str();

    return 0;
}

// -----------------------------------------------------------------------------
// hyperthread allocation algorithm
//
// 1. Follow the virtual threads per core value to assign the same number of
// virtual threads to the same physical core (c_to_alloc).
//
// 2. The virtual threads are evenly distributed among the physical threads
// within each core.
// -----------------------------------------------------------------------------
int HostShareNode::allocate_ht_cpus(int id, unsigned int tcpus, unsigned int tc,
        std::string &c_s)
{
    std::ostringstream oss;

    for (auto vc_it = cores.begin(); vc_it != cores.end() && tcpus > 0; ++vc_it)
    {
        HostShareNode::Core &core = vc_it->second;

        unsigned int c_to_alloc = ( core.free_cpus/tc ) * tc;

        for ( auto cpu = core.cpus.begin(); cpu != core.cpus.end() &&
                c_to_alloc > 0 ; ++cpu )
        {
            if ( cpu->second.size() >= core.vms_thread )
            {
                continue;
            }

            if ( core.reserved_cpus.count(cpu->first) == 1)
            {
                continue;
            }

            cpu->second.insert(id);

            core.free_cpus--;
            core.used_cpus++;

            c_to_alloc--;

            oss << cpu->first;

            if ( --tcpus == 0 )
            {
                break;
            }

            oss << ",";
        }
    }

    if ( tcpus != 0 )
    {
        return -1;
    }

    update_cores();

    c_s = oss.str();

    return 0;
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

void HostShareNode::del_cpu(const std::string &cpu_ids, unsigned int vmid)
{
    std::vector<unsigned int> ids;
    std::set<unsigned int> core_ids;

    one_util::split(cpu_ids, ',', ids);

    for (auto& core_it : cores)
    {
        bool updated = false;
        Core& c      = core_it.second;

        map<unsigned int, std::multiset<unsigned int> >& cpus = c.cpus;

        for ( auto id = ids.begin(); id != ids.end(); )
        {
            auto cpu_it = cpus.find(*id);

            if ( cpu_it == cpus.end() )
            {
                ++id;
                continue;
            }

            cpu_it->second.erase(vmid);

            updated = true;

            id = ids.erase(id);
        }

        if (updated)
        {
            core_it.second.dedicated = false;

            core_it.second.set_cpu_usage();
        }
    }
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

void HostShareNode::update_cores()
{
    erase("CORE");

    for (auto vc_it = cores.begin(); vc_it != cores.end(); ++vc_it)
    {
        set(vc_it->second.to_attribute());
    }
}

void HostShareNode::update_hugepages()
{
    erase("HUGEPAGE");

    for (auto hp_it = pages.begin(); hp_it != pages.end(); ++hp_it)
    {
        set(hp_it->second.to_attribute());
    }
}

void HostShareNode::update_memory()
{
    VectorAttribute * mem = get("MEMORY");

    if ( mem == 0 )
    {
        return;
    }

    mem->replace("USAGE", mem_usage);
}

void HostShareNode::set_memory()
{
    erase("MEMORY");

    VectorAttribute * mem = new VectorAttribute("MEMORY");

    mem->replace("TOTAL", total_mem);
    mem->replace("USED", used_mem);
    mem->replace("FREE", free_mem);

    mem->replace("USAGE", mem_usage);

    std::ostringstream oss;

    for (auto it = distance.begin(); it != distance.end(); ++it)
    {
        if (it!= distance.begin())
        {
            oss << " ";
        }

        oss << *it;
    }

    mem->replace("DISTANCE", oss.str());

    set(mem);
}

// -----------------------------------------------------------------------------

void HostShareNode::set_core(unsigned int id, std::string& cpus,
        unsigned int vms_thread, bool dedicated, bool update)
{
    if ( cores.find(id) != cores.end() )
    {
        return;
    }

    Core c(id, cpus, vms_thread, dedicated);

    cores.insert(make_pair(c.id, c));

    if (update)
    {
        set(c.to_attribute());
    }
}

// -----------------------------------------------------------------------------

void HostShareNode::set_hugepage(unsigned long size, unsigned int nr,
        unsigned int fr, unsigned long usage, bool update)
{
    auto pt = pages.find(size);

    if ( pt != pages.end() )
    {
        if ( nr != pt->second.nr || fr != pt->second.free )
        {
            pt->second.nr   = nr;
            pt->second.free = fr;

            update_hugepages();
        }

        return;
    }

    HugePage h = {size, nr, fr, usage};

    pages.insert(make_pair(h.size_kb, h));

    if (update)
    {
        set(h.to_attribute());
    }
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

void HostShareNode::free_capacity(unsigned int &fcpus, long long &memory,
        unsigned int tc)
{
    fcpus  = 0;
    memory = total_mem - mem_usage;

    for (auto it = cores.begin(); it != cores.end(); ++it)
    {
        fcpus = fcpus + it->second.free_cpus / tc;
    }
}

void HostShareNode::free_dedicated_capacity(unsigned int &fcpus,
        long long &memory)
{
    fcpus  = 0;
    memory = total_mem - mem_usage;

    for (auto it = cores.begin(); it != cores.end(); ++it)
    {
        HostShareNode::Core &c = it->second;

        if ( c.used_cpus == 0 && (c.reserved_cpus.size() < c.cpus.size()))
        {
            fcpus = fcpus + 1;
        }
    }
}

/* ************************************************************************** */
/* ************************************************************************** */
/* HostShareNUMA                                                              */
/* ************************************************************************** */
/* ************************************************************************** */

ostream& operator<<(ostream& o, const HostShareNUMA& n)
{
    for (auto it = n.nodes.begin(); it != n.nodes.end(); ++it)
    {
        o << *(it->second);
    }

    o << setw(75) << setfill('-') << "-" << setfill(' ') << std::endl;

    return o;
}

int HostShareNUMA::from_xml_node(const vector<xmlNodePtr> &ns, unsigned int vt)
{
    for (auto it = ns.begin() ; it != ns.end(); ++it)
    {
        HostShareNode * n = new HostShareNode;

        if ( n->from_xml_node(*it, vt) != 0 )
        {
            return -1;
        }

        nodes.insert(make_pair(n->node_id, n));
    }

    if ( nodes.empty() )
    {
        return 0;
    }

    // Get threads per core from the first NUMA node, assumes an homogenous
    // architecture
    auto numa_node = nodes.begin()->second;
    auto core      = numa_node->cores.begin();
    auto cpus      = core->second.cpus;

    threads_core = cpus.size();

    return 0;
}

// -----------------------------------------------------------------------------

void HostShareNUMA::set_monitorization(Template &ht, unsigned int _vt)
{
    int node_id;

    std::vector<VectorAttribute *> cores;

    ht.remove("CORE", cores);

    for (auto it = cores.begin(); it != cores.end(); ++it)
    {
        int core_id;
        std::string cpus;

        if ( (*it)->vector_value("NODE_ID", node_id) == -1 )
        {
            continue;
        }

        (*it)->vector_value("ID", core_id);
        (*it)->vector_value("CPUS", cpus);

        HostShareNode& node = get_node(node_id);

        node.set_core(core_id, cpus, _vt, false, true);
    }

    std::vector<VectorAttribute *> pages;

    ht.remove("HUGEPAGE", pages);

    for (auto it = pages.begin(); it != pages.end(); ++it)
    {
        unsigned int pages;
        unsigned int free;

        unsigned long size;

        if ( (*it)->vector_value("NODE_ID", node_id) == -1 )
        {
            continue;
        }

        (*it)->vector_value("SIZE", size);
        (*it)->vector_value("FREE", free);
        (*it)->vector_value("PAGES",pages);

        HostShareNode& node = get_node(node_id);

        node.set_hugepage(size, pages, free, 0, true);
    }

    std::vector<VectorAttribute *> memory;

    ht.remove("MEMORY_NODE", memory);

    for (auto it = memory.begin(); it != memory.end(); ++it)
    {
        std::string distance_s;

        if ( (*it)->vector_value("NODE_ID", node_id) == -1 )
        {
            continue;
        }

        HostShareNode& node = get_node(node_id);

        (*it)->vector_value("TOTAL", node.total_mem);
        (*it)->vector_value("FREE", node.free_mem);
        (*it)->vector_value("USED", node.used_mem);

        (*it)->vector_value("DISTANCE", distance_s);

        node.distance.clear();

        one_util::split(distance_s, ' ', node.distance);

        node.set_memory();
    }
}

// -----------------------------------------------------------------------------

HostShareNode& HostShareNUMA::get_node(unsigned int idx)
{
    auto it = nodes.find(idx);

    if ( it != nodes.end() )
    {
        return *(it->second);
    }

    HostShareNode * n = new HostShareNode(idx);

    nodes.insert(make_pair(idx, n));

    return *(n);
}

// -----------------------------------------------------------------------------

std::string& HostShareNUMA::to_xml(std::string& xml) const
{
    ostringstream oss;

    oss << "<NUMA_NODES>";

    for (auto it = nodes.begin(); it != nodes.end(); ++it)
    {
        std::string node_xml;

        oss << it->second->to_xml(node_xml);
    }

    oss << "</NUMA_NODES>";

    xml = oss.str();

    return xml;
}

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------
/*
static bool sort_node_mem(VectorAttribute *i, VectorAttribute *j)
{
    std::sort(sr.nodes.begin(), sr.nodes.end(), sort_node_mem);

    long long mem_i, mem_j;

    i->vector_value("MEMORY", mem_i);
    j->vector_value("MEMORY", mem_j);

    return mem_i < mem_j;
}
*/


// -----------------------------------------------------------------------------

bool HostShareNUMA::schedule_nodes(NUMANodeRequest &nr, unsigned int threads,
        bool dedicated, unsigned long hpsz_kb, std::set<unsigned int> &pci,
        bool do_alloc)
{
    std::vector<std::tuple<float,int> > cpu_fits;
    std::set<unsigned int> mem_fits;

    for (auto it = nodes.begin(); it != nodes.end(); ++it)
    {
        long long    n_fmem;
        unsigned int n_fcpu;

        unsigned long n_hp, n_fhp;

        // --------------------------------------------------------------------
        // Compute free capacity in this node: memory, cpu and hugepages
        // --------------------------------------------------------------------
        if ( dedicated )
        {
            it->second->free_dedicated_capacity(n_fcpu, n_fmem);
        }
        else
        {
            it->second->free_capacity(n_fcpu, n_fmem, threads);
        }

        n_fhp = 0;

        if (hpsz_kb != 0)
        {
            auto pt = it->second->pages.find(hpsz_kb);

            if ( pt != it->second->pages.end())
            {
                const HostShareNode::HugePage &thp = pt->second;

                n_hp  = nr.memory / hpsz_kb;
                n_fhp = thp.nr - thp.usage - thp.allocated;
            }
        }

        n_fcpu -= (it->second->allocated_cpus / threads);
        n_fmem -= it->second->allocated_memory;

        // --------------------------------------------------------------------
        // Check that the virtual node fits in the hypervisor node
        // --------------------------------------------------------------------
        if ( n_fcpu * threads >= nr.total_cpus )
        {
            float fcpu_after = 1 - ((float) nr.total_cpus / (threads * n_fcpu));

            if ( pci.count(it->second->node_id) != 0 )
            {
                fcpu_after += 1;
            }

            cpu_fits.push_back(std::make_tuple(fcpu_after, it->first));
        }

        bool hp_fit = (hpsz_kb == 0 || (n_fhp > 0 && n_fhp >= n_hp));

        if ( n_fmem >= nr.memory && hp_fit )
        {
            mem_fits.insert(it->first);
        }
    }

    if ( cpu_fits.empty() || mem_fits.empty() )
    {
        return false;
    }

    if ( do_alloc == false )
    {
        return true;
    }

    //--------------------------------------------------------------------------
    // Allocate nodes using a best-fit heuristic weighted with PCI proximity for
    // the CPU nodes. Closer memory allocations are prioritized.
    //--------------------------------------------------------------------------
    std::sort(cpu_fits.begin(), cpu_fits.end());

    for (unsigned int hop = 0 ; hop < nodes.size() ; ++hop)
    {
        for (auto it = cpu_fits.rbegin(); it != cpu_fits.rend() ; ++it)
        {
            unsigned int snode = std::get<1>(*it);

            HostShareNode &n = get_node(snode);

            unsigned int mem_snode = n.distance[hop];

            if ( mem_fits.find(mem_snode) != mem_fits.end() )
            {
                HostShareNode &mem_n = get_node(snode);

                nr.node_id     = snode;
                nr.mem_node_id = mem_snode;

                n.allocated_cpus += nr.total_cpus;
                mem_n.allocated_memory += nr.memory;

                if ( hpsz_kb != 0 )
                {
                    auto pit = mem_n.pages.find(hpsz_kb);

                    if (pit != mem_n.pages.end())
                    {
                        pit->second.allocated += (nr.memory / hpsz_kb);
                    }
                }

                return true;
            }
        }
    }

    return false;
}

/* -------------------------------------------------------------------------- */

int HostShareNUMA::make_topology(HostShareCapacity &sr, int vm_id, bool do_alloc)
{
    unsigned int t_max; //Max threads per core for this topology
    std::set<int> t_valid; //Viable threads per core combinations for all nodes

    // -------------------------------------------------------------------------
    // User preferences will be used if possible if not they fix an upperbound
    // for the topology parameter.
    // -------------------------------------------------------------------------
    int v_t = 0;
    int c_t = 0;
    int s_t = 0;

    unsigned long hpsz_kb = 0;

    if ( sr.topology == 0 || sr.nodes.empty() )
    {
        return 0;
    }

    sr.topology->vector_value("THREADS", v_t);
    sr.topology->vector_value("CORES", c_t);
    sr.topology->vector_value("SOCKETS", s_t);

    sr.topology->vector_value("HUGEPAGE_SIZE", hpsz_kb);
    hpsz_kb = hpsz_kb * 1024;

    std::string policy      = sr.topology->vector_value("PIN_POLICY");
    HostShare::PinPolicy pp = HostShare::str_to_pin_policy(policy);

    bool dedicated = pp == HostShare::PP_CORE;

    // -------------------------------------------------------------------------
    // Build NUMA NODE topology request vector
    // -------------------------------------------------------------------------
    std::vector<NUMANodeRequest> vm_nodes;

    for (auto vn_it = sr.nodes.begin(); vn_it != sr.nodes.end(); ++vn_it)
    {
        VectorAttribute *a_node = *vn_it;
        unsigned int total_cpus = 0;
        long long memory        = 0;

        a_node->vector_value("TOTAL_CPUS", total_cpus);
        a_node->vector_value("MEMORY", memory);

        NUMANodeRequest nr = {a_node, total_cpus, memory, -1, "", -1};

        vm_nodes.push_back(nr);
    }

    //--------------------------------------------------------------------------
    // Compute threads per core (tc) in this host:
    //   - Prefer as close as possible to HW configuration, power of 2 (*).
    //   - t_max = min(tc_vm, tc_host). Do not exceed host threads/core
    //   - Possible thread number = 1, 2, 4, 8... t_max
    //   - Prefer higher number of threads and closer to user request
    //   - It should be the same for each virtual numa node
    //
    // (*) Typically processores are 2-way or 4-way SMT
    //--------------------------------------------------------------------------
    if ( dedicated )
    {
        t_max = 1;

        t_valid.insert(1);
    }
    else
    {
        t_max = v_t;

        if ( t_max > threads_core || t_max == 0 )
        {
            t_max = threads_core;
        }

        t_max = 1 << (int) floor(log2((double) t_max));

        // Map <threads/core, virtual nodes>. This is only relevant for
        // asymmetric configurations, different TOTAL_CPUS per NUMA_NODE stanza
        //
        // Example, for 2 numa nodes and 1,2,4 threads/per core
        // 1 - 2 <---- valid in all nodes
        // 2 - 2 <---- valid in all nodes
        // 4 - 1
        // We'll use 2 thread/core topology
        std::map<unsigned int, int> tc_node;

        for (auto vn_it = vm_nodes.begin(); vn_it != vm_nodes.end(); ++vn_it)
        {
            unsigned int tcpus = (*vn_it).total_cpus;

            for (unsigned int i = t_max; i >= 1 ; i = i / 2 )
            {
                if ( tcpus != 0 && tcpus%i != 0 )
                {
                    continue;
                }

                tc_node[i] = tc_node[i] + 1;
            }
        }

        int t_nodes = static_cast<int>(vm_nodes.size());

        for (int i = t_max; i >= 1 ; i = i / 2 )
        {
            if (tc_node.find(i) != tc_node.end() && tc_node[i] == t_nodes)
            {
                t_valid.insert(i);
            }
        }

        // If the user requested an specific threads/core config, check that
        // we can fulfill it in this host for all the VM nodes.
        if ( v_t != 0 )
        {
            if (t_valid.count(v_t) == 0 )
            {
                return -1;
            }

            t_valid.clear();

            t_valid.insert(v_t);
        }
    }

    //--------------------------------------------------------------------------
    // Schedule NUMA_NODES in the host exploring t_valid threads/core confs
    // and using a best-fit heuristic (cpu-guided). Valid nodes needs to:
    //   - Have enough free memory
    //   - Have enough free CPUS groups of a given number of threads/core.
    //
    // Example. TOTAL_CPUS = 4, threads/core = 2 ( - = free, X = used )
    //   - (-XXX),(--XX), (X-XX) ---> Not valid 1 group of 2 threads (4 CPUS)
    //   - (----),(--XX), (X---) ---> Valid 4 group of 2 threads (8 CPUS)
    //
    // NOTE: We want to pin CPUS in the same core in the VM to CPUS in the same
    // core in the host as well.
    //--------------------------------------------------------------------------
    unsigned int na = 0;
    std::set<unsigned int> pci_nodes;

    for (auto it = sr.pci.begin(); it != sr.pci.end(); ++it)
    {
        int pnode = -1;

        if ((*it)->vector_value("NUMA_NODE", pnode) == 0 && pnode != -1)
        {
            pci_nodes.insert(pnode);
        }
    }

    for (auto tc_it = t_valid.rbegin(); tc_it != t_valid.rend(); ++tc_it, na = 0)
    {
        for(auto it = nodes.begin(); it != nodes.end(); ++it)
        {
            HostShareNode * thn = it->second;

            thn->allocated_cpus   = 0;
            thn->allocated_memory = 0;

            for (auto pt = thn->pages.begin(); pt != thn->pages.end(); ++pt)
            {
                pt->second.allocated = 0;
            }
        }

        for (auto vn_it = vm_nodes.begin(); vn_it != vm_nodes.end(); ++vn_it)
        {
            if (!schedule_nodes(*vn_it, *tc_it, dedicated, hpsz_kb, pci_nodes,
                        do_alloc))
            {
                break; //Node cannot be allocated with *tc_it threads/core
            }

            na++;
        }

        if (na == vm_nodes.size())
        {
            v_t = (*tc_it);
            break;
        }
    }

    if (na != vm_nodes.size())
    {
        return -1;
    }

    if ( do_alloc == false )
    {
        return 0;
    }

    //--------------------------------------------------------------------------
    // Allocation of NUMA_NODES. Get CPU_IDs for each node
    //--------------------------------------------------------------------------
    for (auto vn_it = vm_nodes.begin(); vn_it != vm_nodes.end(); ++vn_it)
    {
        auto it = nodes.find((*vn_it).node_id);

        if ( it == nodes.end() ) //Consistency check
        {
            return -1;
        }

        if ( dedicated )
        {
            it->second->allocate_dedicated_cpus(vm_id, (*vn_it).total_cpus,
                    (*vn_it).cpu_ids);
        }
        else
        {
            it->second->allocate_ht_cpus(vm_id, (*vn_it).total_cpus, v_t,
                    (*vn_it).cpu_ids);
        }

        it = nodes.find((*vn_it).mem_node_id);

        if ( it == nodes.end() ) //Consistency check
        {
            return -1;
        }

        it->second->mem_usage += (*vn_it).memory;

        if ( hpsz_kb != 0 )
        {
            auto pt = it->second->pages.find(hpsz_kb);

            if ( pt == it->second->pages.end() )
            {
                return -1;
            }

            pt->second.usage += ((*vn_it).memory / hpsz_kb);

            it->second->update_hugepages();
        }

        it->second->update_memory();

        VectorAttribute * a_node = (*vn_it).attr;

        a_node->replace("NODE_ID", (*vn_it).node_id);
        a_node->replace("CPUS", (*vn_it).cpu_ids);
        a_node->replace("MEMORY_NODE_ID", (*vn_it).mem_node_id);
    }

    //--------------------------------------------------------------------------
    // Update VM topology
    //--------------------------------------------------------------------------
    c_t = sr.vcpu / ( v_t * s_t);

    sr.topology->replace("THREADS", v_t);
    sr.topology->replace("CORES", c_t);

    return 0;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostShareNUMA::del(HostShareCapacity &sr)
{
    unsigned long hpsz_kb = 0;

    if ( sr.topology != 0 )
    {
        sr.topology->vector_value("HUGEPAGE_SIZE", hpsz_kb);
        hpsz_kb = hpsz_kb * 1024;
    }

    for (auto it = sr.nodes.begin() ; it != sr.nodes.end(); ++it)
    {
        unsigned int node_id;
        unsigned int mem_node_id;

        std::string cpu_ids;
        long long   memory;

        int rc = 0;

        rc =  (*it)->vector_value("NODE_ID", node_id);
        rc += (*it)->vector_value("MEMORY_NODE_ID", mem_node_id);
        rc += (*it)->vector_value("CPUS", cpu_ids);
        rc += (*it)->vector_value("MEMORY", memory);

        if (rc != 0)
        {
            continue;
        }

        HostShareNode &cpu_node = get_node(node_id);

        HostShareNode &mem_node = get_node(mem_node_id);

        cpu_node.del_cpu(cpu_ids, sr.vmid);

        mem_node.del_memory(memory);

        if ( hpsz_kb != 0 )
        {
            unsigned long num_hp = memory / hpsz_kb;

            auto pt = mem_node.pages.find(hpsz_kb);

            if ( pt != mem_node.pages.end()  )
            {
                pt->second.usage -= num_hp;

                if ( pt->second.usage < 0 )
                {
                    pt->second.usage = 0;
                }

                mem_node.update_hugepages();
            }
        }

        cpu_node.update_cores();

        mem_node.update_memory();
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostShareNUMA::update_cpu_usage(unsigned int vms_thread)
{
    for ( auto& node : nodes )
    {
        for ( auto& core : node.second->cores )
        {
            core.second.vms_thread = vms_thread;

            core.second.set_cpu_usage();
        }

        node.second->update_cores();
    }
}

/* ************************************************************************ */
/* HostShare :: Constructor/Destructor                                      */
/* ************************************************************************ */
HostShare::HostShare():
        ObjectXML(),
        disk_usage(0),
        mem_usage(0),
        cpu_usage(0),
        total_mem(0),
        total_cpu(0),
        max_disk(0),
        max_mem(0),
        max_cpu(0),
        free_disk(0),
        free_mem(0),
        free_cpu(0),
        used_disk(0),
        used_mem(0),
        used_cpu(0),
        running_vms(0),
        vms_thread(1){};

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
    string ds_xml, pci_xml, numa_xml;
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
          << "<VMS_THREAD>" << vms_thread <<"</VMS_THREAD>"
          << ds.to_xml(ds_xml)
          << pci.to_xml(pci_xml)
          << numa.to_xml(numa_xml)
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

    xpath<unsigned int>(vms_thread, "/HOST_SHARE/VMS_THREAD", 1);

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

    // ------------ NUMA Nodes ---------------

    ObjectXML::get_nodes("/HOST_SHARE/NUMA_NODES/NODE", content);

    if(!content.empty())
    {
        rc += numa.from_xml_node(content, vms_thread);

        ObjectXML::free_nodes(content);

        content.clear();

        if (rc != 0)
        {
            return -1;
        }
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

void HostShare::update_capacity(Host *host, const string& cluster_rcpu,
        const string& cluster_rmem)
{
    string host_rcpu;
    string host_rmem;

    host->get_reserved_capacity(host_rcpu, host_rmem);

    if (host_rcpu.empty())
    {
        host_rcpu = cluster_rcpu;
    }

    if (host_rmem.empty())
    {
        host_rmem = cluster_rmem;
    }

    set_reserved_metric(max_cpu, total_cpu, host_rcpu);
    set_reserved_metric(max_mem, total_mem, host_rmem);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

HostShare::PinPolicy HostShare::str_to_pin_policy(std::string& pp_s)
{
    one_util::toupper(pp_s);

    if ( pp_s == "NONE" )
    {
        return PP_NONE;
    }
    else if ( pp_s == "CORE" )
    {
        return PP_CORE;
    }
    else if ( pp_s == "THREAD" )
    {
        return PP_THREAD;
    }
    else if ( pp_s == "SHARED" )
    {
        return PP_SHARED;
    }

    return PP_NONE;
}

