/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

#include "LibVirtDriver.h"

#include "Nebula.h"
#include <sstream>
#include <fstream>
#include <libgen.h>
#include <math.h>

const float LibVirtDriver::CGROUP_BASE_CPU_SHARES = 1024;

const int LibVirtDriver::CEPH_DEFAULT_PORT = 6789;

const int LibVirtDriver::GLUSTER_DEFAULT_PORT = 24007;

const int LibVirtDriver::ISCSI_DEFAULT_PORT = 3260;

#define set_sec_default(v, dv) if (v.empty() && !dv.empty()){v = dv;}

/**
 *  This function generates the <host> element for network disks
 */
static void do_network_hosts(ofstream& file,
                             const string& cg_host,
                             const string& transport,
                             int   default_port)
{
    if (cg_host.empty())
    {
        file << "/>" << endl;
        return;
    }

    vector<string>::const_iterator it;
    vector<string> hosts;

    hosts = one_util::split(cg_host, ' ');

    file << ">" << endl;

    for (it = hosts.begin(); it != hosts.end(); it++)
    {
        vector<string> parts = one_util::split(*it, ':');

        if (parts.empty())
        {
            continue;
        }

        file << "\t\t\t\t<host name=" << one_util::escape_xml_attr(parts[0]);

        if (parts.size() > 1)
        {
            file << " port=" << one_util::escape_xml_attr(parts[1]);
        }
        else if ( default_port != -1 )
        {
            file << " port=" << one_util::escape_xml_attr(default_port);
        }

        if (!transport.empty())
        {
            file << " transport=" << one_util::escape_xml_attr(transport);
        }

        file << "/>" << endl;
    }

    file << "\t\t\t</source>" << endl;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static int to_i(const string& sval)
{
    int ival;

    istringstream iss(sval);

    iss >> ival;

    if (iss.fail() || !iss.eof())
    {
        return -1;
    }

    return ival;
}

static void insert_sec(ofstream& file, const string& base, const string& s,
        const string& sm, const string& sml)
{
    int s_i = 0;

    if (!s.empty())
    {
        s_i = to_i(s);

        if (s_i < 0)
        {
            return;
        }

        file << "\t\t\t\t<" << base << "_sec>" << one_util::escape_xml(s)
             << "</" << base << "_sec>\n";
    }

    if (!sm.empty())
    {
        int sm_i = to_i(sm);

        if (sm_i < 0)
        {
            return;
        }

        if ( sm_i > s_i )
        {
            file << "\t\t\t\t<" << base << "_sec_max>"
                 << one_util::escape_xml(sm)
                 << "</" << base << "_sec_max>\n";

            if (!sml.empty())
            {
                int sml_i = to_i(sml);

                if (sml_i < 0)
                {
                    return;
                }

                file << "\t\t\t\t<" << base << "_sec_max_length>"
                     << one_util::escape_xml(sml)
                     << "</" << base << "_sec_max_length>\n";
            }
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static void pin_cpu(ofstream& file, const VectorAttribute * topology,
        std::vector<const VectorAttribute *> &nodes)
{
    HostShare::PinPolicy pp = HostShare::PP_NONE;
    unsigned int vcpu_id = 0;

    std::ostringstream oss;

    if ( topology != 0 )
    {
        std::string pp_s;

        pp_s = topology->vector_value("PIN_POLICY");
        pp   = HostShare::str_to_pin_policy(pp_s);
    }

    if ( pp == HostShare::PP_NONE )
    {
        return;
    }

    for (auto it = nodes.begin(); it != nodes.end() ; ++it)
    {
        unsigned int nv = 0;

        std::vector<unsigned int> cpus_a;
        std::string cpus = (*it)->vector_value("CPUS");

        (*it)->vector_value("TOTAL_CPUS", nv);

        if ( nv == 0 || cpus.empty())
        {
            continue;
        }

        one_util::split(cpus, ',', cpus_a);

        for ( unsigned int i = 0; i < nv; ++i, ++vcpu_id )
        {
            file << "\t\t<vcpupin vcpu='" << vcpu_id << "' cpuset='";

            if ( pp == HostShare::PP_SHARED )
            {
                file << cpus << "'/>\n";
            }
            else
            {
                file << cpus_a[i] << "'/>\n";
            }
        }

        if ( it != nodes.begin() )
        {
            oss << ",";
        }

        oss << cpus;
    }

    file << "\t\t<emulatorpin cpuset='" << oss.str() << "'/>\n";
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static void vtopol(ofstream& file, const VectorAttribute * topology,
        std::vector<const VectorAttribute *> &nodes,  std::string &numatune,
        std::string &membacking)
{
    std::string ma;
    int hpsz_kb = 0;

    if ( topology != 0 )
    {
        int s, c, t;

        s = c = t = 1;

        topology->vector_value("SOCKETS", s);
        topology->vector_value("CORES", c);
        topology->vector_value("THREADS", t);

        topology->vector_value("HUGEPAGE_SIZE", hpsz_kb);
        hpsz_kb = hpsz_kb * 1024;

        ma = topology->vector_value("MEMORY_ACCESS");

        if (!ma.empty() &&  hpsz_kb != 0)
        {
            one_util::tolower(ma);

            if (ma != "private" && ma != "shared")
            {
                ma = "";
            }
        }

        file << "\t\t<topology sockets='" << s << "' cores='" << c
            << "' threads='"<< t <<"'/>\n";
    }

    if ( nodes.empty() )
    {
        return;
    }

    std::ostringstream oss, mnodes;

    unsigned int cpuid = 0;
    unsigned int cid   = 0;

    oss << "\t<numatune>\n";
    file << "\t\t<numa>\n";

    for (auto it = nodes.begin() ; it != nodes.end() ; ++it, ++cid)
    {
        unsigned int ncpu = 0;

        std::string mem    = (*it)->vector_value("MEMORY");
        std::string mem_id = (*it)->vector_value("MEMORY_NODE_ID");

        (*it)->vector_value("TOTAL_CPUS", ncpu);

        file << "\t\t\t<cell id='" << cid << "' memory='" << mem << "'";

        if ( ncpu > 0 )
        {
            file << " cpus='" << cpuid << "-" << cpuid + ncpu - 1 << "'";
        }

        if (!ma.empty())
        {
            file << " memAccess='" << ma << "'";
        }

        file << "/>\n";

        cpuid += ncpu;

        if (!mem_id.empty())
        {
            oss << "\t\t<memnode cellid='" << cid << "' mode='strict' nodeset='"
                << mem_id <<"'/>\n";

            if (!mnodes.str().empty())
            {
                mnodes << ",";
            }

            mnodes << mem_id;
        }
    }

    file << "\t\t</numa>\n";

    if (!mnodes.str().empty())
    {
        oss << "\t\t<memory mode='strict' nodeset='" << mnodes.str() << "'/>\n";
        oss << "\t</numatune>\n";

        numatune = oss.str();
    }

    if ( hpsz_kb != 0 )
    {
        std::ostringstream mboss;

        mboss << "\t<memoryBacking>\n";
        mboss << "\t\t<hugepages>\n";

        mboss << "\t\t\t<page size=" << one_util::escape_xml_attr(hpsz_kb) << "/>\n";

        mboss << "\t\t</hugepages>\n";
        mboss << "\t</memoryBacking>\n";

        membacking = mboss.str();
    }
}

/**
 *  Returns disk bus based on this table:
 *         \ prefix   hd     sd             vd
 *  chipset \
 *  pc-q35-*          sata   [sd_default]   virtio
 *  (other)           ide    [sd_default]   virtio
 *
 *  sd_default - SD_DISK_BUS value from vmm_exec_kvm.conf/template
 *               'sata' or 'scsi'
 */
static string get_disk_bus(std::string &machine, std::string &target,
        std::string &sd_default)
{
    switch (target[0])
    {
        case 's': // sd_ disk
            return sd_default;
        case 'v': // vd_ disk
            return "virtio";
        default:
        {
            std::size_t found = machine.find("q35");

            if (found != std::string::npos)
            {
                return "sata";
            }
        }
    }

    return "ide";
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int LibVirtDriver::deployment_description_kvm(
        const VirtualMachine *  vm,
        const string&           file_name) const
{
    ofstream  file;

    int       num;

    string  vcpu;
    float   cpu;
    int     memory;

    string  emulator_path = "";

    string  kernel     = "";
    string  initrd     = "";
    string  root       = "";
    string  kernel_cmd = "";
    string  bootloader = "";
    string  arch       = "";
    string  machine    = "";

    vector<string> boots;

    string  cpu_model = "";
    string  cpu_mode  = "";

    vector<const VectorAttribute *> disk;
    const VectorAttribute * context;

    string  type            = "";
    string  disk_type       = "";
    string  target          = "";
    string  bus             = "";
    string  ro              = "";
    string  driver          = "";
    string  cache           = "";
    string  disk_io         = "";
    string  discard         = "";
    string  source          = "";
    string  clone           = "";
    string  ceph_host       = "";
    string  ceph_secret     = "";
    string  ceph_user       = "";
    string  iscsi_host      = "";
    string  iscsi_user      = "";
    string  iscsi_usage     = "";
    string  iscsi_iqn       = "";
    string  pool_name       = "";
    string  sheepdog_host   = "";
    string  gluster_host    = "";
    string  gluster_volume  = "";

    string  total_bytes_sec            = "";
    string  total_bytes_sec_max_length = "";
    string  total_bytes_sec_max        = "";
    string  read_bytes_sec             = "";
    string  read_bytes_sec_max_length  = "";
    string  read_bytes_sec_max         = "";
    string  write_bytes_sec            = "";
    string  write_bytes_sec_max_length = "";
    string  write_bytes_sec_max        = "";
    string  total_iops_sec             = "";
    string  total_iops_sec_max_length  = "";
    string  total_iops_sec_max         = "";
    string  read_iops_sec              = "";
    string  read_iops_sec_max_length   = "";
    string  read_iops_sec_max          = "";
    string  write_iops_sec             = "";
    string  write_iops_sec_max_length  = "";
    string  write_iops_sec_max         = "";

    string  default_total_bytes_sec            = "";
    string  default_total_bytes_sec_max_length = "";
    string  default_total_bytes_sec_max        = "";
    string  default_read_bytes_sec             = "";
    string  default_read_bytes_sec_max_length  = "";
    string  default_read_bytes_sec_max         = "";
    string  default_write_bytes_sec            = "";
    string  default_write_bytes_sec_max_length = "";
    string  default_write_bytes_sec_max        = "";
    string  default_total_iops_sec             = "";
    string  default_total_iops_sec_max_length  = "";
    string  default_total_iops_sec_max         = "";
    string  default_read_iops_sec              = "";
    string  default_read_iops_sec_max_length   = "";
    string  default_read_iops_sec_max          = "";
    string  default_write_iops_sec             = "";
    string  default_write_iops_sec_max_length  = "";
    string  default_write_iops_sec_max         = "";

    int     disk_id;
    int     order;
    string  default_driver          = "";
    string  default_driver_cache    = "";
    string  default_driver_disk_io  = "";
    string  default_driver_discard  = "";
    bool    readonly;

    vector<const VectorAttribute *> nic;

    string  mac    = "";
    string  bridge = "";
    string  vn_mad = "";
    string  script = "";
    string  model  = "";
    string  ip     = "";
    string  vrouter_ip = "";
    string  filter = "";
    string  virtio_queues = "";
    string  bridge_type = "";
    string  nic_id = "";

    string  i_avg_bw = "";
    string  i_peak_bw = "";
    string  i_peak_kb = "";
    string  o_avg_bw = "";
    string  o_peak_bw = "";
    string  o_peak_kb = "";

    string  default_filter = "";
    string  default_model  = "";

    const VectorAttribute * graphics;

    string  listen        = "";
    string  port          = "";
    string  passwd        = "";
    string  keymap        = "";
    string  spice_options = "";

    const VectorAttribute * input;

    vector<const VectorAttribute *> pci;

    string  domain   = "";
    /* bus is already defined for disks */
    string  slot     = "";
    string  func     = "";

    string vm_domain = "";
    string vm_bus    = "";
    string vm_slot   = "";
    string vm_func   = "";

    bool pae                = false;
    bool acpi               = false;
    bool apic               = false;
    bool hyperv             = false;
    bool localtime          = false;
    bool guest_agent        = false;
    int  virtio_scsi_queues = 0;
    int  scsi_targets_num   = 0;

    string hyperv_options = "";

    vector<const VectorAttribute *> raw;
    string default_raw = "";
    string data        = "";

    const VectorAttribute * topology;
    vector<const VectorAttribute *> nodes;

    std::string numa_tune = "";
    std::string mbacking  = "";

    std::string sd_bus;
    std::string disk_bus;

    string  vm_xml;

    Nebula& nd = Nebula::instance();
    Host* host = nd.get_hpool()->get_ro(vm->get_hid());
    Cluster* cluster = nd.get_clpool()->get_ro(vm->get_cid());

    // ------------------------------------------------------------------------

    file.open(file_name.c_str(), ios::out);

    if (file.fail() == true)
    {
        goto error_file;
    }

    // ------------------------------------------------------------------------
    // Starting XML document
    // ------------------------------------------------------------------------

    file << "<domain type=" << one_util::escape_xml_attr(emulator)
         << " xmlns:qemu='http://libvirt.org/schemas/domain/qemu/1.0'>"
         << endl;

    // ------------------------------------------------------------------------
    // Domain name
    // ------------------------------------------------------------------------

    file << "\t<name>one-" << vm->get_oid() << "</name>" << endl;

    // ------------------------------------------------------------------------
    // Title name
    // ------------------------------------------------------------------------

    file << "\t<title>" << vm->get_name() << "</title>" << endl;

    // ------------------------------------------------------------------------
    // CPU & Memory
    // ------------------------------------------------------------------------

    get_attribute(vm, host, cluster, "VCPU", vcpu);

    if (!vcpu.empty())
    {
        file << "\t<vcpu>" << one_util::escape_xml(vcpu) << "</vcpu>" << endl;
    }

    //Every process gets 1024 shares by default (cgroups), scale this with CPU
    cpu = 1;
    vm->get_template_attribute("CPU", cpu);

    topology = vm->get_template_attribute("TOPOLOGY");
    vm->get_template_attribute("NUMA_NODE", nodes);

    file << "\t<cputune>\n";
    file << "\t\t<shares>"<< ceil(cpu * CGROUP_BASE_CPU_SHARES) << "</shares>\n";

    pin_cpu(file, topology, nodes);

    file << "\t</cputune>\n";

    // Memory must be expressed in Kb
    if (vm->get_template_attribute("MEMORY",memory))
    {
        file << "\t<memory>" << memory * 1024 << "</memory>" << endl;
    }
    else
    {
        goto error_memory;
    }

    // ------------------------------------------------------------------------
    //  OS and boot options
    // ------------------------------------------------------------------------

    file << "\t<os>" << endl;

    get_attribute(vm, host, cluster, "OS", "ARCH", arch);
    get_attribute(vm, host, cluster, "OS", "MACHINE", machine);
    get_attribute(vm, host, cluster, "OS", "KERNEL", kernel);
    get_attribute(vm, host, cluster, "OS", "INITRD", initrd);
    get_attribute(vm, host, cluster, "OS", "BOOTLOADER", bootloader);
    get_attribute(vm, host, cluster, "OS", "ROOT", root);
    get_attribute(vm, host, cluster, "OS", "KERNEL_CMD", kernel_cmd);
    get_attribute(vm, host, cluster, "OS", "SD_DISK_BUS", sd_bus);

    if (arch.empty())
    {
        goto error_arch;
    }

    file << "\t\t<type arch=" << one_util::escape_xml_attr(arch);

    if (!machine.empty())
    {
        file << " machine=" << one_util::escape_xml_attr(machine);
    }

    file << ">hvm</type>" << endl;

    // Start writing to the file with the info we got

    if ( !kernel.empty() )
    {
        file << "\t\t<kernel>" << one_util::escape_xml(kernel) << "</kernel>\n";

        if ( !initrd.empty() )
        {
            file << "\t\t<initrd>" << one_util::escape_xml(initrd) << "</initrd>\n";
        }

        if ( !root.empty() )
        {
            kernel_cmd = "root=/dev/" + root + " " + kernel_cmd;
        }

        if (!kernel_cmd.empty())
        {
            file << "\t\t<cmdline>" << one_util::escape_xml(kernel_cmd)
                 << "</cmdline>\n";
        }
    }
    else if ( !bootloader.empty() )
    {
        file << "\t\t<bootloader>" << one_util::escape_xml(bootloader)
             << "</bootloader>\n";
    }

    file << "\t</os>" << endl;

    // ------------------------------------------------------------------------
    // CPU SECTION
    // ------------------------------------------------------------------------
    get_attribute(vm, host, cluster, "CPU_MODEL", "MODEL", cpu_model);

    if (cpu_model == "host-passthrough")
    {
        cpu_mode = "host-passthrough";
    }
    else
    {
        cpu_mode = "custom";
    }

    if ( !cpu_model.empty() || topology != 0 )
    {
        file << "\t<cpu";

        if (!cpu_model.empty())
        {
            file << " mode=" << one_util::escape_xml_attr(cpu_mode) << ">\n";

            if ( cpu_mode == "custom" )
            {
                file << "\t\t<model fallback='forbid'>"
                    << one_util::escape_xml(cpu_model) << "</model>\n";
            }
        }
        else
        {
            file << ">\n";
        }

        vtopol(file, topology, nodes, numa_tune, mbacking);

        file << "\t</cpu>\n";
    }

    if (!numa_tune.empty())
    {
        file << numa_tune;
    }

    if (!mbacking.empty())
    {
        file << mbacking;
    }

    // ------------------------------------------------------------------------
    // DEVICES SECTION
    // ------------------------------------------------------------------------
    file << "\t<devices>" << endl;

    get_attribute(vm, host, cluster, "EMULATOR", emulator_path);
    if (emulator_path.empty())
    {
        emulator_path = "/usr/bin/kvm";
    }

    file << "\t\t<emulator>" << one_util::escape_xml(emulator_path)
         << "</emulator>\n";

    // ------------------------------------------------------------------------
    // Disks
    // ------------------------------------------------------------------------
    get_attribute(nullptr, host, cluster, "DISK", "DRIVER", default_driver);

    if (default_driver.empty())
    {
        default_driver = "raw";
    }

    get_attribute(nullptr, host, cluster, "DISK", "CACHE", default_driver_cache);

    if (default_driver_cache.empty())
    {
       default_driver_cache = "default";
    }

    get_attribute(nullptr, host, cluster, "DISK", "IO", default_driver_disk_io);
    get_attribute(nullptr, host, cluster, "DISK", "DISCARD", default_driver_discard);

    get_attribute(nullptr, host, cluster, "DISK", "TOTAL_BYTES_SEC", default_total_bytes_sec);
    get_attribute(nullptr, host, cluster, "DISK", "TOTAL_BYTES_SEC_MAX", default_total_bytes_sec_max);
    get_attribute(nullptr, host, cluster, "DISK", "TOTAL_BYTES_SEC_MAX_LENGTH", default_total_bytes_sec_max_length);

    get_attribute(nullptr, host, cluster, "DISK", "READ_BYTES_SEC", default_read_bytes_sec);
    get_attribute(nullptr, host, cluster, "DISK", "READ_BYTES_SEC_MAX", default_read_bytes_sec_max);
    get_attribute(nullptr, host, cluster, "DISK", "READ_BYTES_SEC_MAX_LENGTH", default_read_bytes_sec_max_length);

    get_attribute(nullptr, host, cluster, "DISK", "WRITE_BYTES_SEC", default_write_bytes_sec);
    get_attribute(nullptr, host, cluster, "DISK", "WRITE_BYTES_SEC_MAX", default_write_bytes_sec_max);
    get_attribute(nullptr, host, cluster, "DISK", "WRITE_BYTES_SEC_MAX_LENGTH", default_write_bytes_sec_max_length);

    get_attribute(nullptr, host, cluster, "DISK", "TOTAL_IOPS_SEC", default_total_iops_sec);
    get_attribute(nullptr, host, cluster, "DISK", "TOTAL_IOPS_SEC_MAX", default_total_iops_sec_max);
    get_attribute(nullptr, host, cluster, "DISK", "TOTAL_IOPS_SEC_MAX_LENGTH", default_total_iops_sec_max_length);

    get_attribute(nullptr, host, cluster, "DISK", "READ_IOPS_SEC", default_read_iops_sec);
    get_attribute(nullptr, host, cluster, "DISK", "READ_IOPS_SEC_MAX", default_read_iops_sec_max);
    get_attribute(nullptr, host, cluster, "DISK", "READ_IOPS_SEC_MAX_LENGTH", default_read_iops_sec_max_length);

    get_attribute(nullptr, host, cluster, "DISK", "WRITE_IOPS_SEC", default_write_iops_sec);
    get_attribute(nullptr, host, cluster, "DISK", "WRITE_IOPS_SEC_MAX", default_write_iops_sec_max);
    get_attribute(nullptr, host, cluster, "DISK", "WRITE_IOPS_SEC_MAX_LENGTH", default_write_iops_sec_max_length);

    // ------------------------------------------------------------------------

    num = vm->get_template_attribute("DISK", disk);

    for (int i=0; i < num ;i++)
    {
        type      = disk[i]->vector_value("TYPE");
        disk_type = disk[i]->vector_value("DISK_TYPE");
        target    = disk[i]->vector_value("TARGET");
        ro        = disk[i]->vector_value("READONLY");
        driver    = disk[i]->vector_value("DRIVER");
        cache     = disk[i]->vector_value("CACHE");
        disk_io   = disk[i]->vector_value("IO");
        discard   = disk[i]->vector_value("DISCARD");
        source    = disk[i]->vector_value("SOURCE");
        clone     = disk[i]->vector_value("CLONE");

        ceph_host   = disk[i]->vector_value("CEPH_HOST");
        ceph_secret = disk[i]->vector_value("CEPH_SECRET");
        ceph_user   = disk[i]->vector_value("CEPH_USER");
        pool_name   = disk[i]->vector_value("POOL_NAME");

        iscsi_host  = disk[i]->vector_value("ISCSI_HOST");
        iscsi_user  = disk[i]->vector_value("ISCSI_USER");
        iscsi_usage = disk[i]->vector_value("ISCSI_USAGE");
        iscsi_iqn   = disk[i]->vector_value("ISCSI_IQN");

        gluster_host   = disk[i]->vector_value("GLUSTER_HOST");
        gluster_volume = disk[i]->vector_value("GLUSTER_VOLUME");

        sheepdog_host   = disk[i]->vector_value("SHEEPDOG_HOST");
        total_bytes_sec = disk[i]->vector_value("TOTAL_BYTES_SEC");

        total_bytes_sec            = disk[i]->vector_value("TOTAL_BYTES_SEC");
        total_bytes_sec_max        = disk[i]->vector_value("TOTAL_BYTES_SEC_MAX");
        total_bytes_sec_max_length = disk[i]->vector_value("TOTAL_BYTES_SEC_MAX_LENGTH");

        read_bytes_sec             = disk[i]->vector_value("READ_BYTES_SEC");
        read_bytes_sec_max         = disk[i]->vector_value("READ_BYTES_SEC_MAX");
        read_bytes_sec_max_length  = disk[i]->vector_value("READ_BYTES_SEC_MAX_LENGTH");

        write_bytes_sec            = disk[i]->vector_value("WRITE_BYTES_SEC");
        write_bytes_sec_max        = disk[i]->vector_value("WRITE_BYTES_SEC_MAX");
        write_bytes_sec_max_length = disk[i]->vector_value("WRITE_BYTES_SEC_MAX_LENGTH");

        total_iops_sec             = disk[i]->vector_value("TOTAL_IOPS_SEC");
        total_iops_sec_max         = disk[i]->vector_value("TOTAL_IOPS_SEC_MAX");
        total_iops_sec_max_length  = disk[i]->vector_value("TOTAL_IOPS_SEC_MAX_LENGTH");

        read_iops_sec              = disk[i]->vector_value("READ_IOPS_SEC");
        read_iops_sec_max          = disk[i]->vector_value("READ_IOPS_SEC_MAX");
        read_iops_sec_max_length   = disk[i]->vector_value("READ_IOPS_SEC_MAX_LENGTH");

        write_iops_sec             = disk[i]->vector_value("WRITE_IOPS_SEC");
        write_iops_sec_max         = disk[i]->vector_value("WRITE_IOPS_SEC_MAX");
        write_iops_sec_max_length  = disk[i]->vector_value("WRITE_IOPS_SEC_MAX_LENGTH");

        set_sec_default(read_bytes_sec, default_read_bytes_sec);
        set_sec_default(read_bytes_sec_max, default_read_bytes_sec_max);
        set_sec_default(read_bytes_sec_max_length, default_read_bytes_sec_max_length);

        set_sec_default(write_bytes_sec, default_write_bytes_sec);
        set_sec_default(write_bytes_sec_max, default_write_bytes_sec_max);
        set_sec_default(write_bytes_sec_max_length, default_write_bytes_sec_max_length);

        set_sec_default(total_bytes_sec, default_total_bytes_sec);
        set_sec_default(total_bytes_sec_max, default_total_bytes_sec_max);
        set_sec_default(total_bytes_sec_max_length, default_total_bytes_sec_max_length);

        set_sec_default(read_iops_sec, default_read_iops_sec);
        set_sec_default(read_iops_sec_max, default_read_iops_sec_max);
        set_sec_default(read_iops_sec_max_length, default_read_iops_sec_max_length);

        set_sec_default(write_iops_sec, default_write_iops_sec);
        set_sec_default(write_iops_sec_max, default_write_iops_sec_max);
        set_sec_default(write_iops_sec_max_length, default_write_iops_sec_max_length);

        set_sec_default(total_iops_sec, default_total_iops_sec);
        set_sec_default(total_iops_sec_max, default_total_iops_sec_max);
        set_sec_default(total_iops_sec_max_length, default_total_iops_sec_max_length);

        disk[i]->vector_value_str("DISK_ID", disk_id);

        if (target.empty())
        {
            goto error_disk;
        }

        readonly = false;

        if ( !ro.empty() )
        {
            one_util::toupper(ro);

            if ( ro == "YES" )
            {
                readonly = true;
            }
        }

        // ---- Disk type and source for the image ----

        if ( type == "BLOCK" )
        {
            ostringstream dev;

            dev << vm->get_system_dir() << "/disk." << disk_id;

            file << "\t\t<disk type='block' device='disk'>\n"
                 << "\t\t\t<source dev=" << one_util::escape_xml_attr(dev.str())
                 << "/>\n";
        }
        else if ( type == "ISCSI" )
        {
            file << "\t\t<disk type='network' device='disk'>" << endl;

            file << "\t\t\t<source protocol='iscsi' name=";

            if ( !iscsi_iqn.empty() )
            {
                file << one_util::escape_xml_attr(iscsi_iqn);
            }
            else
            {
                file << one_util::escape_xml_attr(source);
            }

            do_network_hosts(file, iscsi_host, "", ISCSI_DEFAULT_PORT);

            if ( !iscsi_user.empty() && !iscsi_usage.empty() )
            {
                file << "\t\t\t<auth username="
                     << one_util::escape_xml_attr(iscsi_user) << ">\n"
                     << "\t\t\t\t<secret type='iscsi' usage="
                     << one_util::escape_xml_attr(iscsi_usage)<< "/>\n"
                     << "\t\t\t</auth>\n";
            }
        }
        else if ( type == "RBD" || type == "RBD_CDROM" || disk_type == "RBD" )
        {
            if (type == "RBD_CDROM")
            {
                file << "\t\t<disk type='network' device='cdrom'>" << endl;
            }
            else
            {
                file << "\t\t<disk type='network' device='disk'>" << endl;
            }

            file << "\t\t\t<source protocol='rbd' name=";

            ostringstream rbd_name;

            if ( !source.empty() )
            {
                rbd_name << source;
            }
            else
            {
                if ( !pool_name.empty() )
                {
                    rbd_name << pool_name;
                }
                else
                {
                    rbd_name << "one";
                }

                rbd_name << "/one-sys";
            }

            if ( clone == "YES" || source.empty() )
            {
                rbd_name << "-" << vm->get_oid() << "-" << disk_id;
            }

            file << one_util::escape_xml_attr(rbd_name.str());

            do_network_hosts(file, ceph_host, "", CEPH_DEFAULT_PORT);

            if ( !ceph_secret.empty() && !ceph_user.empty())
            {
                file << "\t\t\t<auth username="
                     << one_util::escape_xml_attr(ceph_user) << ">\n"
                     << "\t\t\t\t<secret type='ceph' uuid="
                     << one_util::escape_xml_attr(ceph_secret) <<"/>\n"
                     << "\t\t\t</auth>\n";
            }
        }
        else if ( type == "SHEEPDOG" || type == "SHEEPDOG_CDROM" )
        {
            if (type == "SHEEPDOG")
            {
                file << "\t\t<disk type='network' device='disk'>" << endl;
            }
            else
            {
                file << "\t\t<disk type='network' device='cdrom'>" << endl;
            }

            file << "\t\t\t<source protocol='sheepdog' name=";

            ostringstream sheep_name;

            sheep_name << source;

            if ( clone == "YES" )
            {
                sheep_name << "-" << vm->get_oid() << "-" << disk_id;
            }

            file << one_util::escape_xml_attr(sheep_name.str());

            do_network_hosts(file, sheepdog_host, "tcp", -1);
        }
        else if ( type == "GLUSTER" || type == "GLUSTER_CDROM" )
        {
            if ( type == "GLUSTER" )
            {
                file << "\t\t<disk type='network' device='disk'>" << endl;
            }
            else
            {
                file << "\t\t<disk type='network' device='cdrom'>" << endl;
            }

            file << "\t\t\t<source protocol='gluster' name=";

            ostringstream gluster_name;

            gluster_name << gluster_volume << "/";

            if ( clone == "YES" )
            {
                gluster_name << vm->get_oid() << "/disk." << disk_id;
            }
            else
            {
                gluster_name << one_util::split(source, '/').back();
            }

            file << one_util::escape_xml_attr(gluster_name.str());

            do_network_hosts(file, gluster_host, "tcp", GLUSTER_DEFAULT_PORT);
        }
        else if ( type == "CDROM" )
        {
            ostringstream cd_name;

            cd_name << vm->get_system_dir() << "/disk." << disk_id;

            file << "\t\t<disk type='file' device='cdrom'>\n"
                 << "\t\t\t<source file="
                 << one_util::escape_xml_attr(cd_name.str())<< "/>\n";
        }
        else
        {
            ostringstream fname;

            fname << vm->get_system_dir() << "/disk." << disk_id;

            file << "\t\t<disk type='file' device='disk'>\n"
                 << "\t\t\t<source file="
                 << one_util::escape_xml_attr(fname.str()) << "/>\n";
        }

        // ---- target device to map the disk ----

        file << "\t\t\t<target dev=" << one_util::escape_xml_attr(target);

        disk_bus = get_disk_bus(machine, target, sd_bus);

        if (!disk_bus.empty())
        {
             file << " bus="<< one_util::escape_xml_attr(disk_bus);
        }

        file <<"/>\n";


        // ---- boot order for this device ----

        if ( disk[i]->vector_value("ORDER", order) == 0 )
        {
            file << "\t\t\t<boot order=" << one_util::escape_xml_attr(order)
                 << "/>\n";
        }

        // ---- readonly attribute for the disk ----

        if (readonly)
        {
            file << "\t\t\t<readonly/>" << endl;
        }

        // ---- Image Format using qemu driver ----

        file << "\t\t\t<driver name='qemu' type=";

        if ( type == "CDROM" ) // Use driver raw for CD's
        {
            file << one_util::escape_xml_attr("raw");
        }
        else if ( !driver.empty() )
        {
            file << one_util::escape_xml_attr(driver);
        }
        else
        {
            file << one_util::escape_xml_attr(default_driver);
        }

        file << " cache=";

        if ( !cache.empty() )
        {
            file << one_util::escape_xml_attr(cache);
        }
        else
        {
            file << one_util::escape_xml_attr(default_driver_cache);
        }

        if ( !disk_io.empty() )
        {
            file << " io=" << one_util::escape_xml_attr(disk_io);
        }
        else if ( !default_driver_disk_io.empty() )
        {
            file << " io=" << one_util::escape_xml_attr(default_driver_disk_io);
        }

        if ( !discard.empty() )
        {
            file << " discard=" << one_util::escape_xml_attr(discard);
        }
        else if ( !default_driver_discard.empty() )
        {
            file << " discard=" << one_util::escape_xml_attr(default_driver_discard);
        }

        file << "/>" << endl;

        // ---- I/O Options ----
        // - total cannot be set if read or write
        // - max_length cannot be set if no max
        // - max has to be greater than value
        // ---------------------
        if (!(total_bytes_sec.empty() &&
              total_bytes_sec_max.empty() &&
              read_bytes_sec.empty() &&
              read_bytes_sec_max.empty() &&
              write_bytes_sec.empty() &&
              write_bytes_sec_max.empty() &&
              total_iops_sec.empty() &&
              total_iops_sec_max.empty() &&
              read_iops_sec.empty() &&
              read_iops_sec_max.empty() &&
              write_iops_sec.empty() &&
              write_iops_sec_max.empty()))
        {
            file << "\t\t\t<iotune>" << endl;

            if ( total_bytes_sec.empty() && total_bytes_sec_max.empty() )
            {
                insert_sec(file, "read_bytes", read_bytes_sec ,
                        read_bytes_sec_max , read_bytes_sec_max_length);

                insert_sec(file, "write_bytes", write_bytes_sec ,
                        write_bytes_sec_max , write_bytes_sec_max_length);
            }
            else
            {
                insert_sec(file, "total_bytes", total_bytes_sec ,
                        total_bytes_sec_max , total_bytes_sec_max_length);
            }

            if ( total_iops_sec.empty() && total_iops_sec_max.empty() )
            {
                insert_sec(file, "read_iops", read_iops_sec ,
                        read_iops_sec_max , read_iops_sec_max_length);

                insert_sec(file, "write_iops", write_iops_sec ,
                        write_iops_sec_max , write_iops_sec_max_length);
            }
            else
            {
                insert_sec(file, "total_iops", total_iops_sec ,
                        total_iops_sec_max , total_iops_sec_max_length);
            }

            file << "\t\t\t</iotune>" << endl;
        }

        // ---- SCSI target ----

        if ( target[0] == 's' && target[1] == 'd' )
        {
            int target_number = target[2] - 'a';

            if ( target_number >= 0 && target_number < 256 )
            {
                file << "\t\t\t<address type='drive' controller='0' bus='0' " <<
                     "target='" << target_number << "' unit='0'/>" << endl;
                scsi_targets_num++;
            }
        }

        file << "\t\t</disk>" << endl;
    }

    // ------------------------------------------------------------------------
    // Context Device
    // ------------------------------------------------------------------------
    context = vm->get_template_attribute("CONTEXT");

    if ( context != 0 )
    {
        target  = context->vector_value("TARGET");
        driver  = context->vector_value("DRIVER");

        context->vector_value_str("DISK_ID", disk_id);

        if ( !target.empty() )
        {
            ostringstream fname;

            fname << vm->get_system_dir() << "/disk." << disk_id;

            file << "\t\t<disk type='file' device='cdrom'>\n"
                 << "\t\t\t<source file="
                     << one_util::escape_xml_attr(fname.str())  << "/>\n"
                 << "\t\t\t<target dev=" << one_util::escape_xml_attr(target);

            disk_bus = get_disk_bus(machine, target, sd_bus);

            if (!disk_bus.empty())
            {
                 file << " bus="<< one_util::escape_xml_attr(disk_bus);
            }

            file <<"/>\n"
                 << "\t\t\t<readonly/>\n"
                 << "\t\t\t<driver name='qemu' type='raw'/>\n"
                 << "\t\t</disk>\n";
        }
        else
        {
            vm->log("VMM", Log::WARNING, "Could not find target device to"
                " attach context, will continue without it.");
        }
    }

    // ------------------------------------------------------------------------
    // Network interfaces
    // ------------------------------------------------------------------------
    get_attribute(nullptr, host, cluster, "NIC", "FILTER", default_filter);

    get_attribute(nullptr, host, cluster, "NIC", "MODEL", default_model);

    num = vm->get_template_attribute("NIC", nic);

    for (int i=0; i<num; i++)
    {
        nic_id        = nic[i]->vector_value("NIC_ID");
        bridge        = nic[i]->vector_value("BRIDGE");
        vn_mad        = nic[i]->vector_value("VN_MAD");
        mac           = nic[i]->vector_value("MAC");
        target        = nic[i]->vector_value("TARGET");
        script        = nic[i]->vector_value("SCRIPT");
        model         = nic[i]->vector_value("MODEL");
        ip            = nic[i]->vector_value("IP");
        filter        = nic[i]->vector_value("FILTER");
        virtio_queues = nic[i]->vector_value("VIRTIO_QUEUES");
        bridge_type   = nic[i]->vector_value("BRIDGE_TYPE");

        vrouter_ip = nic[i]->vector_value("VROUTER_IP");

        i_avg_bw  = nic[i]->vector_value("INBOUND_AVG_BW");
        i_peak_bw = nic[i]->vector_value("INBOUND_PEAK_BW");
        i_peak_kb = nic[i]->vector_value("INBOUND_PEAK_KB");

        o_avg_bw  = nic[i]->vector_value("OUTBOUND_AVG_BW");
        o_peak_bw = nic[i]->vector_value("OUTBOUND_PEAK_BW");
        o_peak_kb = nic[i]->vector_value("OUTBOUND_PEAK_KB");

        if ( bridge.empty() )
        {
            file << "\t\t<interface type='ethernet'>" << endl;
        }
        else
        {
            switch (VirtualNetwork::str_to_bridge_type(bridge_type))
            {
                case VirtualNetwork::UNDEFINED:
                case VirtualNetwork::LINUX:
                case VirtualNetwork::VCENTER_PORT_GROUPS:
                case VirtualNetwork::BRNONE:
                    file << "\t\t<interface type='bridge'>\n"
                         << "\t\t\t<source bridge="
                         << one_util::escape_xml_attr(bridge) << "/>\n";
                    break;

                case VirtualNetwork::OPENVSWITCH:
                    file << "\t\t<interface type='bridge'>\n"
                         << "\t\t\t<virtualport type='openvswitch'/>\n"
                         << "\t\t\t<source bridge="
                         << one_util::escape_xml_attr(bridge) << "/>\n";
                    break;

                case VirtualNetwork::OPENVSWITCH_DPDK:
                    file << "\t\t<interface type='vhostuser'>\n"
                         << "\t\t\t<source type='unix' mode='server' path='"
                         << vm->get_system_dir() << "/" << target << "' />\n";
                    break;
            }
        }

        if (!mac.empty())
        {
            file << "\t\t\t<mac address=" << one_util::escape_xml_attr(mac)
                 << "/>\n";
        }

        if (!target.empty())
        {
            file << "\t\t\t<target dev=" << one_util::escape_xml_attr(target)
                 << "/>\n";
        }

        if (nic[i]->vector_value("ORDER", order) == 0)
        {
            file << "\t\t\t<boot order=" << one_util::escape_xml_attr(order)
                 << "/>\n";
        }

        if (!script.empty())
        {
            file << "\t\t\t<script path=" << one_util::escape_xml_attr(script)
                 << "/>\n";
        }

        string * the_model = 0;

        if (!model.empty())
        {
            the_model = &model;
        }
        else if (!default_model.empty())
        {
            the_model = &default_model;
        }

        if (the_model != 0)
        {
            file << "\t\t\t<model type="
                 << one_util::escape_xml_attr(*the_model) << "/>\n";

            if (!virtio_queues.empty() && *the_model == "virtio")
            {
                file << "\t\t\t<driver name='vhost' queues="
                     << one_util::escape_xml_attr(virtio_queues)
                     << "/>\n";
            }
        }

        if (!ip.empty() )
        {
            string * the_filter = 0;

            if (!filter.empty())
            {
                the_filter = &filter;
            }
            else if (!default_filter.empty())
            {
                the_filter = &default_filter;
            }

            if ( the_filter != 0 )
            {
                file << "\t\t\t<filterref filter="
                         << one_util::escape_xml_attr(*the_filter) << ">\n"
                     << "\t\t\t\t<parameter name='IP' value="
                         << one_util::escape_xml_attr(ip) << "/>\n";

                if ( !vrouter_ip.empty() )
                {
                    file << "\t\t\t\t<parameter name='IP' value="
                            << one_util::escape_xml_attr(vrouter_ip) << "/>\n";
                }

                file << "\t\t\t</filterref>\n";
            }
        }

        if (!i_avg_bw.empty() || !i_peak_bw.empty() || !i_peak_kb.empty() ||
            !o_avg_bw.empty() || !o_peak_bw.empty() || !o_peak_kb.empty())
        {
            file << "\t\t\t<bandwidth>\n";

            if (!i_avg_bw.empty() || !i_peak_bw.empty() || !i_peak_kb.empty())
            {
                file << "\t\t\t\t<inbound";

                if (!i_avg_bw.empty())
                {
                    file << " average=" << one_util::escape_xml_attr(i_avg_bw);
                }

                if (!i_peak_bw.empty())
                {
                    file << " peak=" << one_util::escape_xml_attr(i_peak_bw);
                }

                if (!i_peak_kb.empty())
                {
                    file << " burst=" << one_util::escape_xml_attr(i_peak_kb);
                }

                file <<"/>\n";
            }

            if (!o_avg_bw.empty() || !o_peak_bw.empty() || !o_peak_kb.empty())
            {
                file << "\t\t\t\t<outbound";

                if (!o_avg_bw.empty())
                {
                    file << " average=" << one_util::escape_xml_attr(o_avg_bw);
                }

                if (!o_peak_bw.empty())
                {
                    file << " peak=" << one_util::escape_xml_attr(o_peak_bw);
                }

                if (!o_peak_kb.empty())
                {
                    file << " burst=" << one_util::escape_xml_attr(o_peak_kb);
                }

                file <<"/>\n";
            }

            file << "\t\t\t</bandwidth>\n";
        }

        file << "\t\t</interface>" << endl;
    }

    // ------------------------------------------------------------------------
    // Graphics
    // ------------------------------------------------------------------------
    graphics = vm->get_template_attribute("GRAPHICS");

    if ( graphics != 0 )
    {
        type   = graphics->vector_value("TYPE");
        listen = graphics->vector_value("LISTEN");
        port   = graphics->vector_value("PORT");
        passwd = graphics->vector_value("PASSWD");
        keymap = graphics->vector_value("KEYMAP");

        one_util::tolower(type);

        if ( type == "vnc" || type == "spice" )
        {
            file << "\t\t<graphics type=" << one_util::escape_xml_attr(type);

            if ( !listen.empty() )
            {
                file << " listen=" << one_util::escape_xml_attr(listen);
            }

            if ( !port.empty() )
            {
                file << " port=" << one_util::escape_xml_attr(port);
            }

            if ( !passwd.empty() )
            {
                file << " passwd=" << one_util::escape_xml_attr(passwd);
            }

            if ( !keymap.empty() )
            {
                file << " keymap=" << one_util::escape_xml_attr(keymap);
            }

            file << "/>" << endl;

            if ( type == "spice" )
            {
                get_attribute(vm, host, cluster, "SPICE_OPTIONS", spice_options);

                if (!spice_options.empty())
                {
                    file << "\t\t" << spice_options << endl;
                }
            }
        }
        else
        {
            vm->log("VMM", Log::WARNING,
                    "Graphics not supported or undefined, ignored.");
        }
    }

    // ------------------------------------------------------------------------
    // Input
    // ------------------------------------------------------------------------
    input = vm->get_template_attribute("INPUT");

    if ( input != 0 )
    {
        type = input->vector_value("TYPE");
        bus  = input->vector_value("BUS");

        if ( !type.empty() )
        {
            file << "\t\t<input type=" << one_util::escape_xml_attr(type);

            if ( !bus.empty() )
            {
                file << " bus=" << one_util::escape_xml_attr(bus);
            }

            file << "/>" << endl;
        }
    }

    // ------------------------------------------------------------------------
    // PCI Passthrough
    // ------------------------------------------------------------------------

    num = vm->get_template_attribute("PCI", pci);

    for (int i=0; i < num ;i++)
    {
        domain  = pci[i]->vector_value("DOMAIN");
        bus     = pci[i]->vector_value("BUS");
        slot    = pci[i]->vector_value("SLOT");
        func    = pci[i]->vector_value("FUNCTION");

        vm_domain  = pci[i]->vector_value("VM_DOMAIN");
        vm_bus     = pci[i]->vector_value("VM_BUS");
        vm_slot    = pci[i]->vector_value("VM_SLOT");
        vm_func    = pci[i]->vector_value("VM_FUNCTION");

        if ( domain.empty() || bus.empty() || slot.empty() || func.empty() )
        {
            vm->log("VMM", Log::WARNING,
                    "DOMAIN, BUS, SLOT and FUNC must be defined for PCI "
                    "passthrough. Ignored.");
            continue;
        }

        file << "\t\t<hostdev mode='subsystem' type='pci' managed='yes'>\n";

        file << "\t\t\t<source>\n";
        file << "\t\t\t\t<address "
                 << " domain="   << one_util::escape_xml_attr("0x" + domain)
                 << " bus="      << one_util::escape_xml_attr("0x" + bus)
                 << " slot="     << one_util::escape_xml_attr("0x" + slot)
                 << " function=" << one_util::escape_xml_attr("0x" + func)
             << "/>\n";
        file << "\t\t\t</source>\n";

        if ( !vm_domain.empty() && !vm_bus.empty() && !vm_slot.empty() &&
                !vm_func.empty() )
        {
            file << "\t\t\t\t<address type='pci'"
                     << " domain="   << one_util::escape_xml_attr(vm_domain)
                     << " bus="      << one_util::escape_xml_attr(vm_bus)
                     << " slot="     << one_util::escape_xml_attr(vm_slot)
                     << " function=" << one_util::escape_xml_attr(vm_func)
                 << "/>\n";
        }

        file << "\t\t</hostdev>" << endl;
    }

    file << "\t</devices>" << endl;

    // ------------------------------------------------------------------------
    // Features
    // ------------------------------------------------------------------------
    get_attribute(vm, host, cluster, "FEATURES", "PAE", pae);
    get_attribute(vm, host, cluster, "FEATURES", "ACPI", acpi);
    get_attribute(vm, host, cluster, "FEATURES", "APIC", apic);
    get_attribute(vm, host, cluster, "FEATURES", "HYPERV", hyperv);
    get_attribute(vm, host, cluster, "FEATURES", "LOCALTIME", localtime);
    get_attribute(vm, host, cluster, "FEATURES", "GUEST_AGENT", guest_agent);
    get_attribute(vm, host, cluster, "FEATURES", "VIRTIO_SCSI_QUEUES", virtio_scsi_queues);

    if ( acpi || pae || apic || hyperv )
    {
        file << "\t<features>" << endl;

        if ( pae )
        {
            file << "\t\t<pae/>" << endl;
        }

        if ( acpi )
        {
            file << "\t\t<acpi/>" << endl;
        }

        if ( apic )
        {
            file << "\t\t<apic/>" << endl;
        }

        if ( hyperv )
        {
            get_attribute(vm, host, cluster, "HYPERV_OPTIONS", hyperv_options);

            file << "\t\t<hyperv>" << endl;
            file << hyperv_options << endl;
            file << "\t\t</hyperv>" << endl;
        }

        file << "\t</features>" << endl;
    }

    if ( localtime )
    {
        file << "\t<clock offset='localtime'/>" << endl;
    }

    if ( guest_agent )
    {
        file << "\t<devices>" << endl
             << "\t\t<channel type='unix'>" << endl
             << "\t\t\t<source mode='bind'/>"
             << "<target type='virtio' name='org.qemu.guest_agent.0'/>" << endl
             << "\t\t</channel>" << endl
             << "\t</devices>" << endl;
    }

    if ( virtio_scsi_queues > 0 || scsi_targets_num > 1)
    {
        file << "\t<devices>" << endl
             << "\t\t<controller type='scsi' index='0' model='virtio-scsi'>"
             << endl;

        if ( virtio_scsi_queues > 0 )
        {
            file << "\t\t\t<driver queues='" << virtio_scsi_queues << "'/>" << endl;
        }

        file << "\t\t</controller>" << endl
             << "\t</devices>" << endl;
    }

    // ------------------------------------------------------------------------
    // Raw KVM attributes
    // ------------------------------------------------------------------------
    num = vm->get_template_attribute("RAW", raw);

    for (int i=0; i<num; i++)
    {
        type = raw[i]->vector_value("TYPE");

        one_util::toupper(type);

        if ( type == "KVM" )
        {
            data = raw[i]->vector_value("DATA");
            file << "\t" << data << endl;
        }
    }

    get_attribute(nullptr, host, cluster, "RAW", default_raw);

    if ( !default_raw.empty() )
    {
        file << "\t" << default_raw << endl;
    }

    // ------------------------------------------------------------------------
    // Metadata used by drivers
    // ------------------------------------------------------------------------
    file << "\t<metadata>\n"
         << "\t\t<one:vm xmlns:one=\"http://opennebula.org/xmlns/libvirt/1.0\">\n"
         << "\t\t\t<one:system_datastore>"
         << one_util::escape_xml(vm->get_system_dir())
         << "</one:system_datastore>\n"
         << "\t\t\t<one:name>"
         << one_util::escape_xml(vm->get_name())
         << "</one:name>\n"
         << "\t\t\t<one:uname>"
         << one_util::escape_xml(vm->get_uname())
         << "</one:uname>\n"
         << "\t\t\t<one:uid>"
         << vm->get_uid()
         << "</one:uid>\n"
         << "\t\t\t<one:gname>"
         << one_util::escape_xml(vm->get_gname())
         << "</one:gname>\n"
         << "\t\t\t<one:gid>"
         << vm->get_gid()
         << "</one:gid>\n"
         << "\t\t\t<one:opennebula_version>"
         << Nebula::instance().code_version()
         << "</one:opennebula_version>\n"
         << "\t\t\t<one:stime>"
         << vm->get_stime()
         << "</one:stime>\n"
         << "\t\t\t<one:deployment_time>"
         << time(0)
         << "</one:deployment_time>\n"
         << "\t\t</one:vm>\n"
        // << "\t\t<opennebula>\n" << vm->to_xml(vm_xml) << "\t\t</opennebula>\n"
         << "\t</metadata>\n";

    file << "</domain>" << endl;

    if (host) host->unlock();
    if (cluster) cluster->unlock();

    return 0;

error_file:
    vm->log("VMM", Log::ERROR, "Could not open KVM deployment file.");
    goto error_common;

error_memory:
    vm->log("VMM", Log::ERROR, "No MEMORY defined and no default provided.");
    goto error_common;

error_arch:
    vm->log("VMM", Log::ERROR, "No ARCH defined and no default provided.");
    goto error_common;

error_disk:
    vm->log("VMM", Log::ERROR, "Wrong target value in DISK.");

error_common:
    if (host) host->unlock();
    if (cluster) cluster->unlock();
    return -1;
}
