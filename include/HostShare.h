/* ------------------------------------------------------------------------ */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems              */
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
#include <map>

//Forward declarations
class Host;
class HostShareNUMA;

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

/**
 *   This class represents a HostShare capacity allocation from a VM. The following
 *   attributes are updated with the final allocation in the Host:
 *     - topology, number of sockets, cores and threads
 *     - pci, with device address
 *     - nodes with the numa nodes configured for the VM
 *
 *    NUMA node requests are described by an attribute:
 *
 *    NUMA_NODE = [ TOTAL_CPUS=, MEMORY="...", CPUS="...", NODE_ID="...",
 *      MEMORY_NODE_ID="..." ]
 *
 *    CPUS: list of CPU IDs to pin the vCPUs in this host
 *    NODE_ID: the ID of the numa node in the host to pin this virtual node
 *    MEMORY_NODE_ID: the ID of the node to allocate memory for this virtual node
 */
struct HostShareCapacity
{
    int vmid;

    unsigned int vcpu;

    long long cpu;
    long long mem;
    long long disk;

    vector<VectorAttribute *> pci;

    VectorAttribute * topology;

    vector<VectorAttribute *> nodes;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

class HostShareDatastore : public Template
{
public:
    HostShareDatastore() : Template(false, '=', "DATASTORES"){};

    virtual ~HostShareDatastore(){};
};

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
    void del(const vector<VectorAttribute *> &devs);

    /**
     *  Updates the PCI list with monitor data, it will create or
     *  remove PCIDevices as needed.
     */
    void set_monitorization(vector<VectorAttribute*> &pci_att);

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


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 *  This class represents the NUMA nodes in a hypervisor for the following attr:
 *    NODE_ID = 0
 *    HUGEPAGE = [ SIZE = "2048", PAGES = "0", FREE = "0"]
 *    HUGEPAGE = [ SIZE = "1048576", PAGES = "0", FREE = "0"]
 *    CORE = [ ID = "3", CPUS = "3:-1,7:-1", FREE = 2]
 *    CORE = [ ID = "1", CPUS = "1:23,5:-1", FREE = 0 ]
 *    CORE = [ ID = "2", CPUS = "2:47,6:-1", FREE = 1]
 *    CORE = [ ID = "0", CPUS = "0:23,4:-1", FREE = 0]
 *    MEMORY = [ TOTAL = "66806708", FREE = "390568", USED = "66416140",
 *               DISTANCE = "0 1", USAGE = "8388608" ]
 *
 *  - NODE_ID
 *  - HUGEPAGE is the total PAGES and FREE hugepages of a given SIZE in the node
 *  - CORE is a CPU core with its ID and sibling CPUs for HT architectures
 */
class HostShareNode : public Template
{
public:
    HostShareNode() : Template(false, '=', "NODE"){};

    HostShareNode(unsigned int i) : Template(false, '=', "NODE"), node_id(i)
    {
        replace("NODE_ID", i);
    };

    virtual ~HostShareNode(){};

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
     *  Prints the NUMA node to an output stream.
     */
    friend ostream& operator<<(ostream& o, const HostShareNode& n);

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
        unsigned int  free;

        unsigned long  usage;
        unsigned long  allocated;

        /**
         *  @return a VectorAttribute representing this core in the form:
         *    HUGEPAGE = [ SIZE = "1048576", PAGES = "200", FREE = "100",
         *          USAGE = "100"]
         */
        VectorAttribute * to_attribute();
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
     *    - total, free and used memory as reported by IM (meminfo file)
     *    - mem_used memory allocated to VMs by oned in this node
     *    - distance sorted list of nodes, first is the closest (this one)
     */
    long long total_mem = 0;
    long long free_mem  = 0;
    long long used_mem  = 0;

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
     *    @param free pages
     *    @param update if true also adds the page to the object Template
     */
    void set_hugepage(unsigned long size, unsigned int nr, unsigned int fr,
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
    HostShareNUMA():threads_core(1){};

    virtual ~HostShareNUMA()
    {
        for (auto it = nodes.begin(); it != nodes.end(); ++it)
        {
            delete it->second;
        }
    };

    /**
     *  Builds the NUMA nodes from its XML representation. This function is used
     *  when loading the host from the DB.
     *    @param node xmlNode for the template
     *    @param _vt vms_thread
     *    @return 0 on success
     */
    int from_xml_node(const vector<xmlNodePtr> &ns, unsigned int _vt);

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
    string& to_xml(string& xml) const;

    /**
     *  Test if the virtual nodes and topology request fits in the host.
     *    @param sr the share request with the node/topology
     *    @return true if the nodes fit in the host, false otherwise
     */
    bool test(HostShareCapacity &sr)
    {
        return make_topology(sr, -1, false) == 0;
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

    /**
     *  Prints the NUMA nodes to an output stream.
     */
    friend ostream& operator<<(ostream& o, const HostShareNUMA& n);

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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 *  The HostShare class. It represents a logical partition of a host...
 */
class HostShare : public ObjectXML
{
public:

    HostShare();

    ~HostShare(){};

    /**
     *  Pin policy for the host
     */
    enum PinPolicy
    {
        PP_NONE   = 0, /**< No pin. Default. */
        PP_CORE   = 1, /**< vCPUs are assigned to host cores exclusively */
        PP_THREAD = 2, /**< vCPUS are assigned to host threads */
        PP_SHARED = 3  /**< vCPUs are assigned to a set of host threads */
    };

    static PinPolicy str_to_pin_policy(std::string& pp_s);

    /**
     *  Rebuilds the object from an xml node
     *    @param node The xml node pointer
     *
     *    @return 0 on success, -1 otherwise
     */
    int from_xml_node(const xmlNodePtr node);

    /**
     *  Add a VM capacity to this share
     *    @param sr requested capacity by the VM
     */
    void add(HostShareCapacity &sr)
    {
        cpu_usage  += sr.cpu;
        mem_usage  += sr.mem;
        disk_usage += sr.disk;

        pci.add(sr.pci, sr.vmid);

        numa.add(sr);

        running_vms++;
    }

    /**
     *  Delete VM capacity from this share
     *    @param sr requested capacity by the VM
     */
    void del(HostShareCapacity &sr)
    {
        cpu_usage  -= sr.cpu;
        mem_usage  -= sr.mem;
        disk_usage -= sr.disk;

        pci.del(sr.pci);

        numa.del(sr);

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
    bool test(HostShareCapacity& sr, string& error)
    {
        if ( !test_compute(sr.cpu, sr.mem, error) )
        {
            return false;
        }

        if ( !test_pci(sr.pci, error) )
        {
            return false;
        }

        if ( !test_numa(sr, error) )
        {
            return false;
        }

        return true;
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

    /**
     *  Set host information based on the monitorinzation attributes
     *  sent by the probes.
     */
    void set_ds_monitorization(const vector<VectorAttribute*> &ds_att);

    void set_pci_monitorization(vector<VectorAttribute*> &pci_att)
    {
        pci.set_monitorization(pci_att);
    }

    void set_numa_monitorization(Template &ht)
    {
        numa.set_monitorization(ht, vms_thread);
    }

    /**
     *  Resets capaity values of the share
     */
    void reset_capacity()
    {
        total_cpu = 0;
        total_mem = 0;

        max_cpu = 0;
        max_mem = 0;

        free_cpu = 0;
        free_mem = 0;

        used_cpu = 0;
        used_mem = 0;
    };

    /**
     * Set the capacity attributes of the share. CPU and Memory may reserve some
     * capacity according to RESERVED_CPU and RESERVED_MEM. These values can be
     * either absolute or a percentage.
     *
     * Share values are read from the Host template returned by the monitoring
     * probes. The values are removed from the template.
     *
     *   @param host for this share, capacity values are removed from the template
     *   @para cluster_rcpu, reserved cpu default cluster value
     *   @para cluster_rmem, reserved mem default cluster value
     */
    void set_capacity(Host *host, const string& cluster_rcpu,
            const string& cluster_rmem);

    /**
     * Update the capacity attributes when the RESERVED_CPU and RESERVED_MEM
     * are updated.
     *   @param host for this share
     *   @para cluster_rcpu, reserved cpu default cluster value
     *   @para cluster_rmem, reserved mem default cluster value
     */
    void update_capacity(Host *host, const string& cluster_rcpu,
            const string& cluster_rmem);

    /**
     *  Reserve CPUs in the numa nodes
     */
    void reserve_cpus(const std::string &cpu_ids)
    {
        numa.reserve_cpus(cpu_ids);
    }

    /**
     *  Set vms_thread overcommitment and updates core usage
     */
    void set_vms_thread(unsigned int vt)
    {
        vms_thread = vt;

        numa.update_cpu_usage(vms_thread);
    }

    /**
     *  Return the number of running VMs in this host
     */
    long long get_running_vms()
    {
        return running_vms;
    };

private:

    long long disk_usage; /**< Disk allocated to VMs (in MB).        */
    long long mem_usage;  /**< Memory allocated to VMs (in KB)       */
    long long cpu_usage;  /**< CPU  allocated to VMs (in percentage) */

    long long total_mem;  /**< Total memory capacity (in KB)         */
    long long total_cpu;  /**< Total cpu capacity (in percentage)    */

    long long max_disk;   /**< Total disk capacity (in MB)           */
    long long max_mem;    /**< Total memory capacity (in KB) +/- reserved     */
    long long max_cpu;    /**< Total cpu capacity (in percentage) +/- reserved*/

    long long free_disk;  /**< Free disk from the IM monitor         */
    long long free_mem;   /**< Free memory from the IM monitor       */
    long long free_cpu;   /**< Free cpu from the IM monitor          */

    long long used_disk;  /**< Used disk from the IM monitor         */
    long long used_mem;   /**< Used memory from the IM monitor       */
    long long used_cpu;   /**< Used cpu from the IM monitor          */

    long long running_vms;/**< Number of running VMs in this Host   */

    unsigned int vms_thread; /**< VMs that can be allocated to a thread */

    HostShareDatastore ds;
    HostSharePCI       pci;
    HostShareNUMA      numa;

    /**
     *  Check if this share can host a VM, testing only the PCI devices.
     *    @param pci_devs requested by the VM
     *    @param error Returns the error reason, if any
     *
     *    @return true if the share can host the VM or it is the only one
     *    configured
     */
    bool test_compute(int cpu, long long mem, std::string &error) const
    {
        bool cpu_fit  = (max_cpu  - cpu_usage ) >= cpu;
        bool mem_fit  = (max_mem  - mem_usage ) >= mem;

        bool fits = cpu_fit && mem_fit;

        if ( fits )
        {
            return true;
        }

        ostringstream oss;

        if (!cpu_fit)
        {
            oss << "Not enough CPU: " << cpu << "/" << max_cpu - cpu_usage;
        }
        else if (!mem_fit)
        {
            oss << "Not enough memory: " << mem << "/" << max_mem - mem_usage;
        }

        error = oss.str();

        return false;
    }

    bool test_pci(vector<VectorAttribute *>& pci_devs, string& error) const
    {
        bool fits = pci.test(pci_devs);

        error = "Unavailable PCI device.";

        return fits;
    }

    bool test_numa(HostShareCapacity &sr, string& error)
    {
        bool fits = numa.test(sr);

        error = "Cannot allocate NUMA topology";

        return fits;
    }
};

#endif /*HOST_SHARE_H_*/
