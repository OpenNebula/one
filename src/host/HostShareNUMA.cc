/* ------------------------------------------------------------------------*/
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems             */
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

#include "HostShareNUMA.h"
#include "HostShare.h"

using namespace std;

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

VectorAttribute * HostShareNode::HugePage::to_attribute() const
{
    VectorAttribute * vpage = new VectorAttribute("HUGEPAGE");

    vpage->replace("SIZE", size_kb);
    vpage->replace("PAGES", nr);
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

        (*vp_it)->vector_value("SIZE", size_kb);
        (*vp_it)->vector_value("PAGES", nr);

        (*vp_it)->vector_value("USAGE", usage_kb);

        set_hugepage(size_kb, nr, usage_kb, false);
    }

    std::string distance_s;
    VectorAttribute * memory = get("MEMORY");

    if (memory != 0)
    {
        memory->vector_value("TOTAL", total_mem);

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
                                 unsigned long usage, bool update)
{
    auto pt = pages.find(size);

    if ( pt != pages.end() )
    {
        if ( nr != pt->second.nr )
        {
            pt->second.nr = nr;

            update_hugepages();
        }

        return;
    }

    HugePage h = {size, nr, usage, 0};

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

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

void HostShareNode::ls_cpus(bool inc_reserved, std::string &cpu_s)
{
    std::ostringstream oss;

    for (const auto& core : cores)
    {
        for (const auto& cpu : core.second.cpus)
        {
            if ( !inc_reserved && core.second.reserved_cpus.count(cpu.first) == 1)
            {
                continue;
            }

            oss << cpu.first << ",";
        }
    }

    cpu_s = oss.str();

    cpu_s.pop_back(); //remove last ','
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

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

HostShareNUMA& HostShareNUMA::operator=(const HostShareNUMA& other)
{
    if (this != &other) // no-op on self assignment
    {
        threads_core = other.threads_core;

        clear();
        for (auto& node : other.nodes)
        {
            nodes.insert({node.first, new HostShareNode(*node.second)});
        }
    }
    return *this;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

HostShareNUMA& HostShareNUMA::operator=(HostShareNUMA&& other) noexcept
{
    if (this != &other) // no-op self assignment
    {
        threads_core = other.threads_core;
        clear();
        nodes = std::move(other.nodes);
    }
    return *this;
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

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

    ht.get("CORE", cores);

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

    ht.get("HUGEPAGE", pages);

    for (auto it = pages.begin(); it != pages.end(); ++it)
    {
        unsigned int nr = 0;
        unsigned long size = 0;

        if ( (*it)->vector_value("NODE_ID", node_id) == -1 )
        {
            continue;
        }

        (*it)->vector_value("SIZE", size);
        (*it)->vector_value("PAGES", nr);

        HostShareNode& node = get_node(node_id);

        node.set_hugepage(size, nr, 0, true);
    }

    std::vector<VectorAttribute *> memory;

    ht.get("MEMORY_NODE", memory);

    for (auto it = memory.begin(); it != memory.end(); ++it)
    {
        std::string distance_s;

        if ( (*it)->vector_value("NODE_ID", node_id) == -1 )
        {
            continue;
        }

        HostShareNode& node = get_node(node_id);

        (*it)->vector_value("TOTAL", node.total_mem);

        (*it)->vector_value("DISTANCE", distance_s);

        node.distance.clear();

        one_util::split(distance_s, ' ', node.distance);

        node.set_memory();
    }

    ht.erase("CORE");
    ht.erase("HUGEPAGE");
    ht.erase("MEMORY_NODE");
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
    std::vector<std::tuple<float, int> > cpu_fits;
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
/* -------------------------------------------------------------------------- */

int HostShareNUMA::make_hugepage_topology(HostShareCapacity &sr,
                                          unsigned long hpsz_kb, bool do_alloc)
{
    unsigned long n_hp = sr.mem / hpsz_kb; //sr.mem = SUM(sr.nodes.memory)
    unsigned long node_fhp = 0;

    int node_id = -1;

    HostShareNode * node = nullptr;
    HostShareNode::HugePage * hpage = nullptr;

    for (auto it = nodes.begin(); it != nodes.end(); ++it)
    {
        long long free_mem = it->second->total_mem - it->second->mem_usage;

        if ( free_mem <= 0  || free_mem < sr.mem )
        {
            continue; //Node has no enough memory
        }

        auto pt = it->second->pages.find(hpsz_kb);

        if (pt == it->second->pages.end())
        {
            continue; //Node has no huge pages of requested size
        }

        long long n_fhp = pt->second.nr - pt->second.usage;

        if (n_fhp <= 0 || n_fhp < n_hp)
        {
            continue; //Node has not enough free huge pages (n_fhp)
        }

        //Prefer node with higher number of n_fhp
        if (n_fhp > node_fhp)
        {
            node_id  = it->first;
            node_fhp = n_fhp;

            node  = it->second;
            hpage = &(pt->second);
        }
    }

    if (node_id == -1 || node == nullptr || hpage == nullptr)
    {
        return -1;
    }

    if (!do_alloc)
    {
        return 0;
    }

    // -------------------------------------------------------------------------
    // Save CPUs and memory allocation to the VM NUMA node
    // -------------------------------------------------------------------------
    std::string cpu_ids;

    node->ls_cpus(false, cpu_ids);

    node->mem_usage += sr.mem;

    hpage->usage += n_hp;

    node->update_hugepages();

    node->update_memory();

    for (auto &vm_node : sr.nodes)
    {
        vm_node->replace("NODE_ID", node_id);
        vm_node->replace("MEMORY_NODE_ID", node_id);
        vm_node->replace("CPUS", cpu_ids);
    }

    return 0;
}

/* -------------------------------------------------------------------------- */

int HostShareNUMA::make_affined_topology(HostShareCapacity &sr, int node_id,
                                         unsigned long hpsz_kb, bool do_alloc)
{
    auto it = nodes.find(node_id);

    if ( it == nodes.end() ) // Check that node exists
    {
        return -1;
    }

    HostShareNode * node = it->second;

    // -------------------------------------------------------------------------
    // Check that the node has enough free memory
    // -------------------------------------------------------------------------
    long long free_mem = node->total_mem - node->mem_usage;

    if ( free_mem <= 0 || free_mem < sr.mem )
    {
        return -1;
    }

    // -------------------------------------------------------------------------
    // Check that the node has enough free huge pages
    // -------------------------------------------------------------------------
    unsigned long n_hp = 0;

    HostShareNode::HugePage * hpage = nullptr;

    if (hpsz_kb != 0)
    {
        auto jt = node->pages.find(hpsz_kb);

        if ( jt == node->pages.end())
        {
            return -1; // Node has no huge pages of requested size
        }

        hpage = &(jt->second);

        n_hp  = sr.mem / hpsz_kb; //sr.mem = SUM(sr.nodes.memory)
        long long n_fhp = hpage->nr - hpage->usage;

        if (n_fhp <= 0 || n_fhp < n_hp)
        {
            return -1; //Node has not enough free huge pages (n_fhp)
        }
    }

    if (!do_alloc)
    {
        return 0;
    }

    // -------------------------------------------------------------------------
    // Save CPUs and memory allocation to the VM NUMA node
    // -------------------------------------------------------------------------
    std::string cpu_ids;

    node->ls_cpus(false, cpu_ids);

    node->mem_usage += sr.mem;

    if (hpsz_kb != 0 && hpage != nullptr)
    {
        hpage->usage += n_hp;

        node->update_hugepages();
    }

    node->update_memory();

    for (auto &vm_node : sr.nodes)
    {
        vm_node->replace("NODE_ID", node_id);
        vm_node->replace("MEMORY_NODE_ID", node_id);
        vm_node->replace("CPUS", cpu_ids);
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostShareNUMA::make_topology(HostShareCapacity &sr, int vm_id, bool do_alloc)
{
    // -------------------------------------------------------------------------
    // Regular VMS (not pinned and no NUMA affinity)
    // -------------------------------------------------------------------------
    if ( sr.topology == 0 || sr.nodes.empty() )
    {
        return 0;
    }

    // -------------------------------------------------------------------------
    // NUMA node affinity
    // -------------------------------------------------------------------------
    int affinity = -1;
    unsigned long hpsz_kb = 0;

    std::string policy      = sr.topology->vector_value("PIN_POLICY");
    HostShare::PinPolicy pp = HostShare::str_to_pin_policy(policy);

    sr.topology->vector_value("NODE_AFFINITY", affinity);

    sr.topology->vector_value("HUGEPAGE_SIZE", hpsz_kb);
    hpsz_kb = hpsz_kb * 1024;

    if (affinity != -1)
    {
        return make_affined_topology(sr, affinity, hpsz_kb, do_alloc);
    }

    if (hpsz_kb != 0 && pp == HostShare::PP_NONE)
    {
        return make_hugepage_topology(sr, hpsz_kb, do_alloc);
    }

    // -------------------------------------------------------------------------
    // User preferences will be used if possible. If not they fix an upperbound
    // for the topology parameter.
    // -------------------------------------------------------------------------
    std::set<int> t_valid; //Viable threads per core combinations for all nodes

    int v_t = 0;
    int c_t = 0;
    int s_t = 0;

    sr.topology->vector_value("THREADS", v_t);
    sr.topology->vector_value("CORES", c_t);
    sr.topology->vector_value("SOCKETS", s_t);

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
        t_valid.insert(1);
    }
    else
    {
        unsigned int t_max = v_t; //Max threads per core for this topology

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
        // Clear tmp allocation counters
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

        // Check allocation of virtual NUMA nodes
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

    if (!do_alloc)
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
                if (pt->second.usage > num_hp)
                {
                    pt->second.usage -= num_hp;
                }
                else
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

