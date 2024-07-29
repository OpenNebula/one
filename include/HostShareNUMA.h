/* ------------------------------------------------------------------------ */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems              */
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

#ifndef HOST_SHARE_NUMA_H_
#define HOST_SHARE_NUMA_H_

#include "ObjectXML.h"
#include "Template.h"
#include "HostShareCapacity.h"

#include <string>
#include <set>
#include <map>

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 *  This class represents the NUMA nodes in a hypervisor for the following attr:
 *    NODE_ID = 0
 *    HUGEPAGE = [ SIZE = "2048", PAGES = "0", USAGE = "0" ]
 *    HUGEPAGE = [ SIZE = "1048576", PAGES = "0", USAGE = "0" ]
 *    CORE = [ ID = "3", CPUS = "3:-1,7:-1", FREE = 2, DEDICATED="NO"]
 *    CORE = [ ID = "1", CPUS = "1:23,5:-1", FREE = 0, DEDICATED="YES" ]
 *    CORE = [ ID = "2", CPUS = "2:47,6:-1", FREE = 1, DEDICATED="NO"]
 *    CORE = [ ID = "0", CPUS = "0:23,4:-1", FREE = 0, DEDICATED="NO"]
 *    MEMORY = [ TOTAL = "66806708", DISTANCE = "0 1", USAGE = "8388608" ]
 *
 *  - NODE_ID
 *  - HUGEPAGE is the total PAGES and USAGE hugepages of a given SIZE in the node
 *  - CORE is a CPU core with its ID and sibling CPUs for HT architectures
 *  - USAGE - hugepages or memory allocated by oned
 *
 *  The free hugaepages and memory capacity is stored in the monitoring node,
 *  see HostMonitoringTemplate.h
 */
class HostShareNode : public Template
{
public:
    HostShareNode()
        : Template(false, '=', "NODE")
        , node_id(std::numeric_limits<unsigned int>::max())
    {}

    HostShareNode(unsigned int i)
        : Template(false, '=', "NODE")
        , node_id(i)
    {
        replace("NODE_ID", i);
    }

    virtual ~HostShareNode() = default;

    /**
     *  Builds the node from its XML representation. This function is used when
     *  loading the host from the DB.
     *    @param node xmlNode for the template
     *    @param _vt vms_thread
     *    @return 0 on success
     */
    int from_xml_node(const xmlNodePtr &node, unsigned int _vt);

    /**
     *  Get free capacity of the node
     *    @param fcpus number of free virtual cores
     *    @param memory free in the node
     *    @param threads_core per virtual core
     */
    void free_capacity(unsigned int &fcpus, long long &memory, unsigned int tc);

    void free_dedicated_capacity(unsigned int &fcpus, long long &memory);

    /**
     *  Allocate tcpus with a dedicated policy
     *    @param id of the VM allocating the CPUs
     *    @param tcpus total number of cpus
     *    @param c_s the resulting allocation string CPUS="0,4,2,6"
     *
     *    @return 0 on success
     */
    int allocate_dedicated_cpus(int id, unsigned int tcpus, std::string &c_s);

    /**
     *  Allocate tcpus with a HT policy
     *    @param id of the VM allocating the CPUs
     *    @param tcpus total number of cpus
     *    @param tc allocate cpus in tc (threads/core) chunks
     *    @param c_s the resulting allocation string CPUS="0,4,2,6"
     *
     *    @return 0 on success
     */
    int allocate_ht_cpus(int id, unsigned int tcpus, unsigned int tc,
                         std::string &c_s);

    /**
     *  Remove allocation for the given CPUs
     *    @param cpu_ids list of cpu ids to free, comma separated
     *    @param vmid of the VM using the threads
     */
    void del_cpu(const std::string &cpu_ids, unsigned int vmid);

    /**
     *  Remove memory allocation
     *    @param memory to free
     */
    void del_memory(long long memory)
    {
        mem_usage -= memory;
    }

    /**
     *  Reserve CPU IDs
     *    @param rcpus list of reserved cpu ids (comma separated)
     */
    void reserve_cpus(const std::string& rcpus);

    /**
     * List the cpus of this node (as a , separated string)
     *   @param inc_reserved include reserved CPUs or not
     */
    void ls_cpus(bool inc_reserved, std::string &cpu_s);

    /**
     *  Prints the NUMA node to an output stream.
     */
    friend std::ostream& operator<<(std::ostream& o, const HostShareNode& n);

private:
    friend class HostShareNUMA;

    //This stuct represents a core and its allocation status
    struct Core
    {
        /**
         *  Initializes the structure from the CORE attributes:
         *    @param _i ID of core
         *    @param _c CPUS list <cpu_id>:<vm_id>
         *    @param _vt VMS per thread
         *    @param _d true if the core is dedicated to a VM
         */
        Core(unsigned int _i, const std::string& _c, unsigned int _vt, bool _d);

        /**
         *  ID of this CPU CORE
         */
        unsigned int id;

        /**
         *  Number of free & used cpus in the core.
         */
        unsigned int free_cpus;

        unsigned int used_cpus;

        /**
         *  Number of VMs that can be allocated per physical thread.
         */
        unsigned int vms_thread;

        /**
         *  This core is dedicated to one VM
         */
        bool dedicated;

        /**
         *  CPU threads usage map
         *    t0 -> [vm1, vm1]
         *    t1 -> [vm2]
         *    t3 -> [vm3]
         *    t4 -> []
         *
         *  When no over commitment is used only 1 VM is assigned ot a thread
         */
        std::map<unsigned int, std::multiset<unsigned int> > cpus;

        /**
         *  Set of reserved threads in this core
         */
        std::set<unsigned int> reserved_cpus;

        /**
         *  @return a VectorAttribute representing this core in the form:
         *    CORE = [ ID = "3", CPUS = "3:-1,7:-1", FREE = 2, DEDICATED=no]
         */
        VectorAttribute * to_attribute();

        /**
         *  Compute and set the free/used cpus of the core
         */
        void set_cpu_usage();
    };

    //This stuct represents the hugepages available in the node
    struct HugePage
    {
        unsigned long size_kb;

        unsigned int  nr;

        unsigned long  usage;
        unsigned long  allocated;

        /**
         *  @return a VectorAttribute representing this core in the form:
         *    HUGEPAGE = [ SIZE = "1048576", PAGES = "200", USAGE = "100"]
         */
        VectorAttribute * to_attribute() const;
    };

    /**
     *  ID of this node as reported by the Host
     */
    unsigned int node_id;

    /**
     *  CPU Cores in this node
     */
    std::map<unsigned int, struct Core> cores;

    /**
     *  Huge pages configured in this node
     */
    std::map<unsigned long, struct HugePage> pages;

    /**
     *  Memory information for this node:
     *    - total_mem total memory available
     *    - mem_usage memory allocated to VMs by oned in this node
     *    - distance sorted list of nodes, first is the closest (this one)
     */
    long long total_mem = 0;

    long long mem_usage = 0;

    std::vector<unsigned int> distance;

    /**
     *  Temporal allocation on the node. This is used by the scheduling
     */
    unsigned int allocated_cpus   = 0;
    long long    allocated_memory = 0;

    //--------------------------------------------------------------------------
    //--------------------------------------------------------------------------

    /**
     *  Creates a new Core element and associates it to this node. If the
     *  core already exists this function does nothing
     *    @param id of core
     *    @param cpus string representing the cpu_id and allocation
     *    @param vms_thread VMs per thread
     *    @param update if true also adds the core to the object Template
     */
    void set_core(unsigned int id, std::string& cpus, unsigned int vms_thread,
                  bool dedicated, bool update);

    /**
     *  Regenerate the template representation of the CORES for this node.
     */
    void update_cores();

    /**
     *  Regenerate the template representation of the HUGEPAGES for this node.
     */
    void update_hugepages();

    /**
     *  Creates a new HugePage element and associates it to this node. If a
     *  hugepage of the same size already exists this function does nothing
     *    @param size in kb of the page
     *    @param nr number of pages
     *    @param update if true also adds the page to the object Template
     */
    void set_hugepage(unsigned long size, unsigned int nr,
                      unsigned long usage, bool update);

    void update_hugepage(unsigned long size);

    /**
     *  Adds a new memory attribute based on the moniroting attributes and
     *  current mem usage.
     */
    void set_memory();

    /**
     *  Updates the memory usage for the node in the template representation
     */
    void update_memory();
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 *  This class includes a list of all NUMA nodes in the host. And structure as
 *  follows:
 *
 *    <NUMA_NODES>
 *    <NODE>
 *      <ID>0</ID>
 *      <HUGEPAGE>
 *        <SIZE>2048</SIZE>
 *        <PAGES>0</PAGES>
 *        <FREE>0</FREE>
 *      </HUGEPAGE>
 *      ...
 *      <CORE>
 *        <ID>3</ID>
 *        <CPUS>3,7</CPUS>
 *      </CORE>
 *      ...
 *    </NODE>
 *    <NODE>
 *      <ID>1</ID>
 *      ...
 *    </NODE>
 *    </NUMA_NODES>
 */
class HostShareNUMA
{
public:
    HostShareNUMA():threads_core(1) {};

    virtual ~HostShareNUMA()
    {
        clear();
    };

    /**
     *  Builds the NUMA nodes from its XML representation. This function is used
     *  when loading the host from the DB.
     *    @param node xmlNode for the template
     *    @param _vt vms_thread
     *    @return 0 on success
     */
    int from_xml_node(const std::vector<xmlNodePtr> &ns, unsigned int _vt);

    /**
     *  Updates the NUMA node information with monitor data
     *    @param ht template with the information returned by monitor probes.
     */
    void set_monitorization(Template &ht, unsigned int vms_thread);

    /**
     *  @param idx of the node
     *  @return the NUMA node for the the fiven index. If the node does not
     *  exit it is created
     */
    HostShareNode& get_node(unsigned int idx);

    /**
     * Function to print the HostShare object into a string in
     * XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    std::string& to_xml(std::string& xml) const;

    /**
     *  Test if the virtual nodes and topology request fits in the host.
     *    @param sr the share request with the node/topology
     *    @return true if the nodes fit in the host, false otherwise
     */
    bool test(HostShareCapacity &sr) const
    {
        return (const_cast<HostShareNUMA *>(this))->make_topology(sr, -1, false) == 0;
    }

    /**
     *  Assign the requested nodes to the host.
     *    @param sr the share request with the node/topology
     *    @param vmid of the VM
     */
    void add(HostShareCapacity &sr)
    {
        make_topology(sr, sr.vmid, true);
    }

    /**
     *  Remove the VM assignment from the NUMA nodes
     */
    void del(HostShareCapacity &sr);

    /**
     *  Reserves the provided CPUs and frees any CPUS not included in the list
     *    @param cpu_ids list of cpus to reserve "0,3,5"
     */
    void reserve_cpus(const std::string &cpu_ids)
    {
        for (auto it = nodes.begin(); it != nodes.end(); ++it)
        {
            it->second->reserve_cpus(cpu_ids);

            it->second->update_cores();
        }
    };

    /**
     *  Update the vms_thread in the cores and recomputes the cpu_usage based
     *  on the new value;
     *    @param vms_thread value
     */
    void update_cpu_usage(unsigned int vms_thread);

    void clear()
    {
        for (auto& node : nodes)
        {
            delete node.second;
        }

        nodes.clear();
    }
    /**
     *  Prints the NUMA nodes to an output stream.
     */
    friend std::ostream& operator<<(std::ostream& o, const HostShareNUMA& n);

    HostShareNUMA& operator=(const HostShareNUMA& other);

    HostShareNUMA& operator=(HostShareNUMA&& other) noexcept;

private:
    /**
     *  Number of threads per core of the host
     */
    unsigned int threads_core;

    std::map<unsigned int, HostShareNode *> nodes;

    /* ---------------------------------------------------------------------- */
    /* ---------------------------------------------------------------------- */
    /**
     * Computes the virtual topology for this VM in this host based on:
     *   - user preferences TOPOLOGY/[SOCKETS, CORES, THREADS].
     *   - Architecture of the Host core_threads
     *   - allocation policy
     *
     *   @param sr the resource allocation request
     *   @param vm_id of the VM making the request
     *   @param do_alloc actually allocate the nodes (true) or just test (false)
     *   @return 0 success (vm was allocated) -1 otherwise
     */
    int make_topology(HostShareCapacity &sr, int vm_id, bool do_alloc);

    /*
     * Computes the virtual topology for this VM setting the affinity to a given
     * NUMA node. If hugepages are used it checks that enough pages are available
     * in the nod,
     *
     *   @param sr the resource allocation request
     *   @param node_id of the NUMA node
     *   @param hpsz_kb size of the requested huge page (in KB) 0 if none
     *   @param do_alloc actually allocate the node (true) or just test (false).
     *   @return 0 success (vm was allocated) -1 otherwise
     */
    int make_affined_topology(HostShareCapacity &sr, int node_id,
                              unsigned long hpsz_kb, bool do_alloc);

    /*
     * Computes the virtual topology for the VM based on the huge pages allocation
     *
     *   @param sr the resource allocation request
     *   @param hpsz_kb size of the requested huge page (in KB)
     *   @param do_alloc actually allocate the node (true) or just test (false).
     *   @return 0 success (vm was allocated) -1 otherwise
     */
    int make_hugepage_topology(HostShareCapacity &sr, unsigned long hpzs_kb,
                               bool do_alloc);
    /**
     *  This is an internal structure to represent a virtual node allocation
     *  request and the resulting schedule
     */
    struct NUMANodeRequest
    {
        VectorAttribute * attr;

        unsigned int total_cpus;
        long long    memory;

        //NUMA node to allocate CPU cores from
        int node_id;
        std::string cpu_ids;

        //NUMA node to allocate memory from
        int mem_node_id;
    };

    bool schedule_nodes(NUMANodeRequest &nr, unsigned int thr, bool dedicated,
                        unsigned long hpsz_kb, std::set<unsigned int> &pci, bool do_alloc);
};

#endif /*HOST_SHARE_NUMA_H_*/
