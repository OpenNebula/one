/* -------------------------------------------------------------------------- */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                */
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

#include "HostPool.h"
#include "ClusterPool.h"
#include "VirtualNetwork.h"
#include "ObjectXML.h"
#include "Nebula.h"
#include "Image.h"
#include "DatastorePool.h"
#include "NebulaUtil.h"

#include <regex>
#include <exception>
#include <sstream>
#include <fstream>
#include <libgen.h>
#include <math.h>
#include <iomanip>

using namespace std;

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

    vector<string> hosts;

    hosts = one_util::split(cg_host, ' ');

    file << ">" << endl;

    for (const auto& host_str : hosts)
    {
        vector<string> parts = one_util::split(host_str, ':');

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

static int to_int(const string& s)
{
    int val;

    istringstream iss(s);

    iss >> val;

    if (iss.fail() || !iss.eof())
    {
        return -1;
    }

    return val;
}

template<typename T>
static void insert_sec(ofstream& file, const string& base, const string& s,
                       const string& sm, const string& sml)
{
    T s_i = 0;

    if (!s.empty())
    {
        s_i = one_util::string_to_unsigned<T>(s);

        file << "\t\t\t\t<" << base << "_sec>" << one_util::escape_xml(std::to_string(s_i))
             << "</" << base << "_sec>\n";
    }

    if (!sm.empty())
    {
        const auto sm_i = one_util::string_to_unsigned<T>(sm);

        if ( sm_i > s_i)
        {
            file << "\t\t\t\t<" << base << "_sec_max>"
                 << one_util::escape_xml(std::to_string(sm_i))
                 << "</" << base << "_sec_max>\n";

            if (!sml.empty())
            {
                const auto sml_i = one_util::string_to_unsigned<T>(sml);

                file << "\t\t\t\t<" << base << "_sec_max_length>"
                     << one_util::escape_xml(std::to_string(sml_i))
                     << "</" << base << "_sec_max_length>\n";
            }
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static void pin_cpu(ofstream& file, std::string& emulator_cpus,
                    const VectorAttribute * topology, std::vector<const VectorAttribute *> &nodes)
{
    HostShare::PinPolicy pp = HostShare::PP_NONE;

    unsigned int vcpu_id = 0;
    int affinity = -1;
    unsigned int hpsz = 0;

    std::ostringstream oss;

    if ( topology != 0 )
    {
        std::string pp_s;

        pp_s = topology->vector_value("PIN_POLICY");
        pp   = HostShare::str_to_pin_policy(pp_s);

        topology->vector_value("NODE_AFFINITY", affinity);
        topology->vector_value("HUGEPAGE_SIZE", hpsz);
    }

    if ( pp == HostShare::PP_NONE && affinity == -1 && hpsz == 0)
    {
        if (!emulator_cpus.empty())
        {
            file << "\t\t<emulatorpin cpuset=" << emulator_cpus << "/>\n";
        }

        return;
    }

    for (auto it = nodes.begin(); it != nodes.end() ; ++it)
    {
        unsigned int nv = 0;

        std::vector<unsigned int> cpus_a;
        const string& cpus = (*it)->vector_value("CPUS");

        (*it)->vector_value("TOTAL_CPUS", nv);

        if ( nv == 0 || cpus.empty())
        {
            continue;
        }

        one_util::split(cpus, ',', cpus_a);

        for ( unsigned int i = 0; i < nv; ++i, ++vcpu_id )
        {
            file << "\t\t<vcpupin vcpu='" << vcpu_id << "' cpuset='";

            //PP_NONE is used when NUMA affinity is configured
            if ( pp == HostShare::PP_SHARED || pp == HostShare::PP_NONE )
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

    file << "\t\t<emulatorpin cpuset=";

    if (emulator_cpus.empty())
    {
        file << "'" << oss.str() << "'/>\n";
    }
    else
    {
        file << emulator_cpus << "/>\n";
    }
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

        if (!ma.empty() && hpsz_kb != 0)
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

        const string& mem    = (*it)->vector_value("MEMORY");
        const string& mem_id = (*it)->vector_value("MEMORY_NODE_ID");

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
    }

    oss << "\t</numatune>\n";

    numatune = oss.str();

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
static string get_disk_bus(const std::string &machine,
                           const std::string &target,
                           const std::string &sd_default)
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

static void set_queues(string& queue, const string& vcpu)
{
    one_util::tolower(queue);

    if ( queue == "auto" )
    {
        queue = vcpu;
    }
    else if (!queue.empty())
    {
        char * end_ptr;

        strtol(queue.c_str(), &end_ptr, 10);

        if ( *end_ptr != '\0' )
        {
            queue.clear();
        }
    }
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */


int LibVirtDriver::validate_raw(const string& raw_section, string& error) const
{
    ostringstream oss;

    string path = Nebula::instance().get_share_location() + XML_DOMAIN_RNG_PATH;

    oss << "<domain type='kvm' xmlns:qemu='http://libvirt.org/schemas/domain/qemu/1.0'>"
        << "<name>aux</name>"
        << raw_section << "</domain>";

    int rc = ObjectXML::validate_rng(oss.str(), path);

    if ( rc != 0 )
    {
        error = "Invalid RAW section: cannot validate DATA with domain.rng schema";
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int LibVirtDriver::validate_template(const VirtualMachine* vm, int hid,
                                     int cluster_id, std::string& error) const
{
    Nebula& nd = Nebula::instance();

    auto host_ptr    = nd.get_hpool()->get_ro(hid);
    auto cluster_ptr = nd.get_clpool()->get_ro(cluster_id);

    auto host    = host_ptr.get();
    auto cluster = cluster_ptr.get();

    string firmware;

    get_attribute(vm, nullptr, nullptr, "OS", "FIRMWARE", firmware);

    // Skip validation for BIOS (default) and auto (autoselection)
    if ( !firmware.empty() &&
         !one_util::icasecmp(firmware, "BIOS") &&
         !one_util::icasecmp(firmware, "UEFI") )
    {
        string ovmf_uefis;

        get_attribute(nullptr, host, cluster, "OVMF_UEFIS", ovmf_uefis);

        if (ovmf_uefis.empty())
        {
            error = "No OVMF_UEFIS defined in configuration.";
            vm->log("VMM", Log::ERROR, error);
            return -1;
        }

        bool found = false;
        for (auto& f: one_util::split(ovmf_uefis, ' '))
        {
            if (f == firmware)
            {
                found = true;
                break;
            }
        }

        if (!found)
        {
            error = "FIRMWARE '" + firmware + "' not allowed.";
            vm->log("VMM", Log::ERROR, error);
            return -1;
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int LibVirtDriver::deployment_description_kvm(
        const VirtualMachine *  vm,
        const string&           file_name) const
{
    ofstream  file;

    int       num;

    int     cgversion;

    string  vcpu;
    string  vcpu_max;
    float   cpu;
    int     memory;
    int     memory_max;

    string  emulator_path;

    string  kernel;
    string  initrd;
    string  root;
    string  kernel_cmd;
    string  bootloader;
    string  arch;
    string  machine;

    vector<string> boots;

    string  cpu_model;
    string  cpu_feature;
    string  cpu_mode;

    vector<const VectorAttribute *> disk;
    const VectorAttribute * context;

    string type;
    string disk_type;
    string target;
    string bus;
    string ro;
    string driver;
    string cache;
    string disk_io;
    string discard;
    string source;
    string clone;
    string serial;
    string blk_queues;
    string shareable;
    string ceph_host;
    string ceph_secret;
    string ceph_user;
    string iscsi_host;
    string iscsi_user;
    string iscsi_usage;
    string iscsi_iqn;
    string pool_name;
    string sheepdog_host;
    string gluster_host;
    string gluster_volume;
    string luks_secret;

    string total_bytes_sec;
    string total_bytes_sec_max_length;
    string total_bytes_sec_max;
    string read_bytes_sec;
    string read_bytes_sec_max_length;
    string read_bytes_sec_max;
    string write_bytes_sec;
    string write_bytes_sec_max_length;
    string write_bytes_sec_max;
    string total_iops_sec;
    string total_iops_sec_max_length;
    string total_iops_sec_max;
    string read_iops_sec;
    string read_iops_sec_max_length;
    string read_iops_sec_max;
    string write_iops_sec;
    string write_iops_sec_max_length;
    string write_iops_sec_max;
    string size_iops_sec;
    string iothreadid;

    string default_total_bytes_sec;
    string default_total_bytes_sec_max_length;
    string default_total_bytes_sec_max;
    string default_read_bytes_sec;
    string default_read_bytes_sec_max_length;
    string default_read_bytes_sec_max;
    string default_write_bytes_sec;
    string default_write_bytes_sec_max_length;
    string default_write_bytes_sec_max;
    string default_total_iops_sec;
    string default_total_iops_sec_max_length;
    string default_total_iops_sec_max;
    string default_read_iops_sec;
    string default_read_iops_sec_max_length;
    string default_read_iops_sec_max;
    string default_write_iops_sec;
    string default_write_iops_sec_max_length;
    string default_write_iops_sec_max;
    string default_size_iops_sec;

    int    disk_id;
    int    order;
    string default_driver;
    string default_driver_cache;
    string default_driver_disk_io;
    string default_driver_discard;
    string default_blk_queues;
    bool   readonly;

    vector<const VectorAttribute *> nic;

    string mac;
    string bridge;
    string vn_mad;
    string script;
    string model;
    string ip;
    string vrouter_ip;
    string filter;
    string virtio_queues;
    string bridge_type;
    string nic_id;

    string i_avg_bw;
    string i_peak_bw;
    string i_peak_kb;
    string o_avg_bw;
    string o_peak_bw;
    string o_peak_kb;

    string default_filter;
    string default_model;
    string default_virtio_queues;

    const VectorAttribute * graphics;

    const VectorAttribute * video;

    const VectorAttribute * input;

    vector<const VectorAttribute *> pci;

    string domain;
    /* bus is already defined for disks */
    string slot;
    string func;

    string vm_domain;
    string vm_bus;
    string vm_slot;
    string vm_func;
    string vm_index;

    bool pae         = false;
    bool acpi        = false;
    bool apic        = false;
    bool hyperv      = false;
    bool localtime   = false;
    bool guest_agent = false;

    int  iothreads        = 0;
    int  iothread_actual  = 1;

    string virtio_scsi_queues;
    string hyperv_options;

    vector<const VectorAttribute *> raw;
    string default_raw;
    string data;

    const VectorAttribute * topology;
    vector<const VectorAttribute *> nodes;

    std::string numa_tune;
    std::string mbacking;

    std::string sd_bus;
    std::string disk_bus;

    string  vm_xml;

    Nebula& nd = Nebula::instance();
    auto host_ptr    = nd.get_hpool()->get_ro(vm->get_hid());
    auto cluster_ptr = nd.get_clpool()->get_ro(vm->get_cid());

    auto host    = host_ptr.get();
    auto cluster = cluster_ptr.get();

    // ------------------------------------------------------------------------

    file.open(file_name.c_str(), ios::out);

    if (file.fail() == true)
    {
        vm->log("VMM", Log::ERROR, "Could not open KVM deployment file.");
        return -1;
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

    auto os = vm->get_template_attribute("OS");
    if (os)
    {
        const string& uuid = os->vector_value("UUID");
        if (!uuid.empty())
        {
            file << "\t<uuid>" << uuid << "</uuid>" << endl;
        }
    }

    // ------------------------------------------------------------------------
    // CPU & Memory
    // ------------------------------------------------------------------------

    get_attribute(vm, host, cluster, "VCPU", vcpu);
    get_attribute(vm, host, cluster, "VCPU_MAX", vcpu_max);

    if (vcpu.empty())
    {
        vcpu = vcpu_max;
    }

    if (!vcpu_max.empty())
    {
        file << "\t<vcpu current=" << one_util::escape_xml_attr(vcpu) << ">"
             << one_util::escape_xml(vcpu_max) << "</vcpu>" << endl;
    }
    else if (!vcpu.empty())
    {
        file << "\t<vcpu>" << one_util::escape_xml(vcpu) << "</vcpu>" << endl;
    }

    // Defaults to cgroups version 1 scaling for shares/weight
    // cpu.weight/cpu.shares are scaled based on CPU value and defaults share
    cpu = 1;
    vm->get_template_attribute("CPU", cpu);

    topology = vm->get_template_attribute("TOPOLOGY");
    vm->get_template_attribute("NUMA_NODE", nodes);

    get_attribute(nullptr, host, cluster, "CGROUPS_VERSION", cgversion);

    int  base = 1024;
    int  min  = 2;
    long max  = 262144;

    if (cgversion == 2)
    {
        base = 100;
        min  = 1;
        max  = 10000;
    }

    long shares = ceil(base * cpu);

    if (shares < min)
    {
        shares = min;
    }
    else if (shares > max)
    {
        shares = max;
    }

    file << "\t<cputune>\n";
    file << "\t\t<shares>"<< shares << "</shares>\n";

    string emulator_cpus;

    get_attribute(nullptr, host, cluster, "EMULATOR_CPUS", emulator_cpus);

    if (!emulator_cpus.empty())
    {
        emulator_cpus = one_util::escape_xml_attr(emulator_cpus);
    }

    pin_cpu(file, emulator_cpus, topology, nodes);

    file << "\t</cputune>\n";

    // Memory must be expressed in Kb
    if (!vm->get_template_attribute("MEMORY", memory))
    {
        vm->log("VMM", Log::ERROR, "No MEMORY defined and no default provided.");
        return -1;
    }

    // Check for memory resize settings
    string mem_mode;

    bool memory_hotplug = false;
    bool has_memory_max = vm->get_template_attribute("MEMORY_MAX", memory_max);

    has_memory_max = has_memory_max && memory < memory_max;

    vm->get_template_attribute("MEMORY_RESIZE_MODE", mem_mode);

    if (!has_memory_max)
    {
        file << "\t<memory>" << memory * 1024 << "</memory>" << endl;
    }
    else if (mem_mode == "HOTPLUG")
    {
        memory_hotplug = true;

        file << "\t<memory>" << memory * 1024 << "</memory>" << endl;

        if (!topology)
        {
            int slots = 0;
            get_attribute(vm, host, cluster, "MEMORY_SLOTS", slots);

            file << "\t<maxMemory slots='" << slots
                 << "'>" << memory_max * 1024 << "</maxMemory>" << endl;
        }
    }
    else //(mem_mode == "BALLOONING" || mem_mode.empty())
    {
        file << "\t<memory>" << memory_max * 1024 << "</memory>" << endl;
        file << "\t<currentMemory>" << memory * 1024 << "</currentMemory>" << endl;
    }

    // ------------------------------------------------------------------------
    //  OS and boot options
    // ------------------------------------------------------------------------

    // Check if firmware is set to auto for autoselection
    string firmware;
    bool boot_secure = false;

    get_attribute(vm, host, cluster, "OS", "FIRMWARE", firmware);

    get_attribute(vm, host, cluster, "OS", "FIRMWARE_SECURE", boot_secure);

    bool is_efi_auto = one_util::icasecmp(firmware, "UEFI");
    bool is_uefi     = !firmware.empty() && !one_util::icasecmp(firmware, "BIOS") && !is_efi_auto;

    if (is_efi_auto)
    {
        file << "\t<os firmware='efi'>" << endl;
    }
    else
    {
        file << "\t<os>" << endl;
    }

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
        vm->log("VMM", Log::ERROR, "No ARCH defined and no default provided.");
        return -1;
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

    if ( is_efi_auto )
    {
        // Check if secure boot is enabled
        file << "\t\t<firmware>\n";

        if (boot_secure)
        {
            file << "\t\t\t<feature enabled='yes' name='secure-boot'/>\n";
        }
        else
        {
            file << "\t\t\t<feature enabled='no' name='secure-boot'/>\n";
        }

        file << "\t\t</firmware>\n";
    }
    else if ( is_uefi )
    {
        string firmware_secure = "no";

        if (boot_secure)
        {
            firmware_secure = "yes";
        }

        file << "\t\t<loader readonly=\"yes\" type=\"pflash\" "
             << "secure=\"" << firmware_secure << "\">"
             << firmware
             << "</loader>\n";
        file << "\t\t<nvram>"
             << vm->get_system_dir() << "/" << vm->get_name() << "_VARS.fd"
             << "</nvram>\n";
    }

    file << "\t</os>" << endl;

    // ------------------------------------------------------------------------
    // POWER MANAGEMENT SECTION
    // ------------------------------------------------------------------------
    if ( is_uefi && arch != "aarch64" )
    {
        // Suspend to mem and disk disabled to avoid boot problems with UEFI
        // firmware in x86 arch
        file << "\t<pm>\n"
             << "\t\t<suspend-to-disk enabled=\"no\"/>\n"
             << "\t\t<suspend-to-mem enabled=\"no\"/>\n"
             << "\t</pm>\n";
    }

    // ------------------------------------------------------------------------
    // CPU SECTION
    // ------------------------------------------------------------------------
    get_attribute(vm, host, cluster, "CPU_MODEL", "MODEL", cpu_model);
    get_attribute(vm, host, cluster, "CPU_MODEL", "FEATURES", cpu_feature);

    if (cpu_model == "host-passthrough")
    {
        cpu_mode = "host-passthrough";
    }
    else
    {
        cpu_mode = "custom";
    }

    if ( !cpu_model.empty() || topology != 0 || memory_hotplug )
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

        if ( !cpu_feature.empty() && !cpu_model.empty() )
        {
            vector<string> features;

            one_util::split(cpu_feature, ',', features);

            for (const auto& feature: features)
            {
                file << "\t\t<feature policy='require'"
                     << " name=" << one_util::escape_xml_attr(feature) << "/>\n";
            }
        }

        if (nodes.empty() && memory_hotplug)
        {
            int cpus = to_int(vcpu) - 1;
            if (cpus < 0)
            {
                cpus = 0;
            }

            file << "\t\t<numa>\n\t\t\t<cell id='0' cpus='0-" << cpus
                 << "' memory=" << one_util::escape_xml_attr(memory * 1024)
                 << " unit='KiB'/>\n\t\t</numa>" << endl;
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

    get_attribute(vm, host, cluster, "FEATURES", "IOTHREADS", iothreads);

    if ( iothreads > 0 )
    {
        file << "\t<iothreads>" << iothreads << "</iothreads>" << endl;
    }

    // ------------------------------------------------------------------------
    // DEVICES SECTION
    // ------------------------------------------------------------------------
    file << "\t<devices>" << endl;

    get_attribute(vm, host, cluster, "EMULATOR", emulator_path);

    if (emulator_path.empty())
    {
        emulator_path = "/usr/bin/qemu-kvm-one";
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

    get_attribute(nullptr, host, cluster, "DISK", "SIZE_IOPS_SEC", default_size_iops_sec);

    get_attribute(vm, host, cluster, "FEATURES", "VIRTIO_BLK_QUEUES", default_blk_queues);

    // -------------------------------------------------------------------------

    num = vm->get_template_attribute("DISK", disk);

    int sata_index = 0;
    string sata_controllers;

    if (machine.find("q35") != std::string::npos)
    {
        sata_index = 1;
    }

    for (int i=0; i < num ; i++)
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
        serial    = disk[i]->vector_value("SERIAL");
        blk_queues= disk[i]->vector_value("VIRTIO_BLK_QUEUES");
        shareable = disk[i]->vector_value("SHAREABLE");

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

        luks_secret = disk[i]->vector_value("LUKS_SECRET");

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

        size_iops_sec              = disk[i]->vector_value("SIZE_IOPS_SEC");
        iothreadid                 = disk[i]->vector_value("IOTHREAD");

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

        set_sec_default(size_iops_sec, default_size_iops_sec);

        disk[i]->vector_value_str("DISK_ID", disk_id);

        if (target.empty())
        {
            vm->log("VMM", Log::ERROR, "Wrong target value in DISK.");
            return -1;
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

        if (vm->get_disk(disk_id)->is_volatile())
        {
            // For volatile disk the type attribute is used to define if it is SWAP or FS,
            // For non-volatile disk it is set as subtype of disk_type (check Image::disk_attribute method)
            type = disk_type;
        }

        // ---- Disk type and source for the image ----

        if ( type == "BLOCK" || type == "BLOCK_CDROM" )
        {
            ostringstream dev;

            dev << vm->get_system_dir() << "/disk." << disk_id;

            if (type == "BLOCK_CDROM")
            {
                file << "\t\t<disk type='block' device='cdrom'>" << endl;
            }
            else
            {
                file << "\t\t<disk type='block' device='disk'>" << endl;
            }

            file << "\t\t\t<source dev=" << one_util::escape_xml_attr(dev.str())
                 << "/>" << endl;
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
            string cd_type   = "file";
            string cd_source = "file";

            cd_name << vm->get_system_dir() << "/disk." << disk_id;

            if ( disk_type == "BLOCK" )
            {
                cd_type   = "block";
                cd_source = "dev";
            }

            file << "\t\t<disk type='" << cd_type << "' device='cdrom'>\n"
                 << "\t\t\t<source " << cd_source << "="
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

        // ---- luks secret for target ----
        if ( !luks_secret.empty())
        {
            file << "\t\t\t<encryption format='luks'>\n"
                 << "\t\t\t\t<secret type='passphrase' uuid="
                 << one_util::escape_xml_attr(luks_secret) <<"/>\n"
                 << "\t\t\t</encryption>\n";
        }

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

        // ---- shareable attribute for the disk ----

        if (shareable == "YES")
        {
            file << "\t\t\t<shareable/>" << endl;
        }

        // ---- serial attribute for the disk ----

        if (!serial.empty())
        {
            if (type == "BLOCK" && disk_bus == "scsi")
            {
                vm->log("VMM", Log::WARNING, "Serial attribute ignored: not supported for SCSI block devices.");
            }
            else
            {
                file << "\t\t\t<serial>" << serial << "</serial>" << endl;
            }
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

        if ( iothreads > 0 && disk_bus == "virtio" )
        {
            int iothreadid_i = to_int(iothreadid);
            if (iothreadid_i > 0 && iothreadid_i <= iothreads)
            {
                file << " iothread=" << one_util::escape_xml_attr(iothreadid_i);
            }
            else
            {
                file << " iothread=" << one_util::escape_xml_attr(iothread_actual);

                iothread_actual = (iothread_actual % iothreads) + 1;
            }
        }

        if (!blk_queues.empty())
        {
            set_queues(blk_queues, vcpu);
        }
        else if (!default_blk_queues.empty())
        {
            set_queues(default_blk_queues, vcpu);

            blk_queues = default_blk_queues;
        }

        if (!blk_queues.empty() && disk_bus == "virtio")
        {
            file << " queues=" << one_util::escape_xml_attr(blk_queues);
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
                insert_sec<unsigned long long>(file, "read_bytes", read_bytes_sec,
                                               read_bytes_sec_max, read_bytes_sec_max_length);

                insert_sec<unsigned long long>(file, "write_bytes", write_bytes_sec,
                                               write_bytes_sec_max, write_bytes_sec_max_length);
            }
            else
            {
                insert_sec<unsigned long long>(file, "total_bytes", total_bytes_sec,
                                               total_bytes_sec_max, total_bytes_sec_max_length);
            }

            if ( total_iops_sec.empty() && total_iops_sec_max.empty() )
            {
                insert_sec<unsigned int>(file, "read_iops", read_iops_sec,
                                         read_iops_sec_max, read_iops_sec_max_length);

                insert_sec<unsigned int>(file, "write_iops", write_iops_sec,
                                         write_iops_sec_max, write_iops_sec_max_length);
            }
            else
            {
                insert_sec<unsigned int>(file, "total_iops", total_iops_sec,
                                         total_iops_sec_max, total_iops_sec_max_length);
            }

            if ( !size_iops_sec.empty() && !(total_iops_sec.empty()
                                             && read_iops_sec.empty() && write_iops_sec.empty()))
            {
                insert_sec<unsigned int>(file, "size_iops", size_iops_sec, "", "");
            }

            file << "\t\t\t</iotune>" << endl;
        }

        // ---- Disk target ----
        // * SATA bus
        //   - requires a controller per disk as it requires bus=0 and target=0
        //   - q35 adds ACHI controller in slot 0x1f function 2 (used for context)
        //   - A controller will be added for each disk starting from 1 if q35
        // * SCSI bus
        //   - target is based on dev target to have a predictable order
        if ( target[0] == 's' && target[1] == 'd' )
        {
            string suffix        = target.substr(2);
            int    target_number = 0;

            for (char ch : suffix)
            {
                target_number = target_number * 26 + (ch - 'a' + 1);
            }

            target_number--;

            if ( disk_bus == "sata" )
            {
                sata_controllers += ("\t\t<controller type='sata' index='" +
                                     to_string(sata_index) + "'/>\n");

                file << "\t\t\t<address type='drive' controller='" << sata_index
                     << "' bus='0' target='0' unit='0'/>" << endl;

                sata_index++;
            }
            else if ( target_number >= 0 && target_number < 256 )
            {
                file << "\t\t\t<address type='drive' controller='0' bus='0'"
                     << " target='" << target_number << "' unit='0'/>"
                     << endl;
            }
        }

        file << "\t\t</disk>" << endl;
    }

    // Add SATA controllers if needed
    if (!sata_controllers.empty())
    {
        file << sata_controllers;
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
            ostringstream   fname;
            Image::DiskType ctxt_disk_type = Image::FILE;

            string s_cdt;
            string s_cst;

            if (auto ds = nd.get_dspool()->get_ro(vm->get_ds_id()))
            {
                ctxt_disk_type = ds->context_disk_type();
            }

            switch (ctxt_disk_type)
            {
                case Image::BLOCK:
                    s_cdt = "block";
                    s_cst = "dev";
                    break;
                default:
                    s_cdt = "file";
                    s_cst = "file";
                    break;
            }

            fname << vm->get_system_dir() << "/disk." << disk_id;

            file << "\t\t<disk type='" << s_cdt << "' device='cdrom'>\n"
                 << "\t\t\t<source " << s_cst << "="
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

    // -------------------------------------------------------------------------
    // Controllers:
    //   - virtio-scsi, for non SCSI disk domains allows hotplug of new disks
    // -------------------------------------------------------------------------
    get_attribute(vm, host, cluster, "FEATURES", "VIRTIO_SCSI_QUEUES", virtio_scsi_queues);

    set_queues(virtio_scsi_queues, vcpu);

    file << "\t\t<controller type='scsi' index='0' model='virtio-scsi'>" << endl
         << "\t\t\t<driver";

    if ( !virtio_scsi_queues.empty() )
    {
        file << " queues=" << one_util::escape_xml_attr(virtio_scsi_queues);
    }
    else
    {
        file << " queues='1'";
    }

    if ( iothreads > 0 )
    {
        file << " iothread=" << one_util::escape_xml_attr(iothread_actual);
    }

    file << "/>" << endl
         << "\t\t</controller>" << endl;

    // ------------------------------------------------------------------------
    // Network interfaces
    // ------------------------------------------------------------------------
    get_attribute(nullptr, host, cluster, "NIC", "FILTER", default_filter);

    get_attribute(nullptr, host, cluster, "NIC", "MODEL", default_model);

    get_attribute(nullptr, host, cluster, "NIC", "VIRTIO_QUEUES", default_virtio_queues);

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

            if (!virtio_queues.empty())
            {
                set_queues(virtio_queues, vcpu);
            }
            else if (!default_virtio_queues.empty())
            {
                set_queues(default_virtio_queues, vcpu);

                virtio_queues = default_virtio_queues;
            }

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
        string  listen;
        string  port;
        string  passwd;
        string  keymap;
        string  spice_options;
        bool    random_passwrd;

        get_attribute(vm, host, cluster, "GRAPHICS", "TYPE", type);
        get_attribute(vm, host, cluster, "GRAPHICS", "LISTEN", listen);
        get_attribute(vm, host, cluster, "GRAPHICS", "PASSWD", passwd);
        get_attribute(vm, host, cluster, "GRAPHICS", "KEYMAP", keymap);
        get_attribute(vm, host, cluster, "GRAPHICS", "RANDOM_PASSWD", random_passwrd);

        port   = graphics->vector_value("PORT");

        one_util::tolower(type);

        if ( random_passwrd && passwd.empty())
        {
            passwd = one_util::random_password();

            if ( type == "spice" )
            {
                // Spice password must be 59 characters maximum
                passwd.resize(VirtualMachine::MAX_SPICE_PASSWD_LENGTH);
            }
            else if ( type == "vnc" )
            {
                // Vnc password must be 8 characters maximum
                passwd.resize(VirtualMachine::MAX_VNC_PASSWD_LENGTH);
            }

            const_cast<VectorAttribute*>(graphics)->replace("PASSWD", passwd);
        }

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
    // Video
    // ------------------------------------------------------------------------

    video = vm->get_template_attribute("VIDEO");

    if ( video != 0 )
    {
        bool iommu;
        bool ats;
        int  vram;

        string resolution;

        get_attribute(vm, host, cluster, "VIDEO", "IOMMU", iommu);
        get_attribute(vm, host, cluster, "VIDEO", "ATS",   ats);
        get_attribute(vm, host, cluster, "VIDEO", "TYPE",  type);
        get_attribute(vm, host, cluster, "VIDEO", "VRAM",  vram);
        get_attribute(vm, host, cluster, "VIDEO", "RESOLUTION", resolution);

        file << "\t\t<video>\n";

        if ( type == "virtio"  && ( iommu || ats ) )
        {
            file << "\t\t\t<driver";

            if ( iommu )
            {
                file << " iommu='on'";
            }

            if ( ats )
            {
                file << " ats='on'";
            }

            file << "/>\n";
        }

        one_util::tolower(type);

        file << "\t\t\t<model type=" << one_util::escape_xml_attr(type);

        if ( vram >= 1024 && type != "none" )
        {
            file << " vram=" << one_util::escape_xml_attr(vram);
        }

        file << ">\n";

        if ( !resolution.empty() && type != "none" && type != "cirrus" )
        {
            vector<string> res_dims;

            res_dims = one_util::split(resolution, 'x');

            file << "\t\t\t\t<resolution"
                 << " x=" << one_util::escape_xml_attr(res_dims[0])
                 << " y=" << one_util::escape_xml_attr(res_dims[1])
                 << "/>\n";
        }

        file << "\t\t\t</model>\n";

        file << "\t\t</video>\n";
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

    for (int i=0; i < num ; i++)
    {
        domain  = pci[i]->vector_value("DOMAIN");
        bus     = pci[i]->vector_value("BUS");
        slot    = pci[i]->vector_value("SLOT");
        func    = pci[i]->vector_value("FUNCTION");

        vm_domain  = pci[i]->vector_value("VM_DOMAIN");
        vm_bus     = pci[i]->vector_value("VM_BUS");
        vm_slot    = pci[i]->vector_value("VM_SLOT");
        vm_func    = pci[i]->vector_value("VM_FUNCTION");
        vm_index   = pci[i]->vector_value("VM_BUS_INDEX");

        string uuid = pci[i]->vector_value("UUID");
        string mdev = pci[i]->vector_value("MDEV_MODE");

        one_util::tolower(mdev);

        if ( domain.empty() || bus.empty() || slot.empty() || func.empty() )
        {
            vm->log("VMM", Log::WARNING,
                    "DOMAIN, BUS, SLOT and FUNC must be defined for PCI "
                    "passthrough. Ignored.");
            continue;
        }

        if ( !uuid.empty() && (mdev == "legacy" || mdev.empty()) )
        {
            file << "\t\t<hostdev mode='subsystem' type='mdev' model='vfio-pci'>\n";
            file << "\t\t\t<source>\n";
            file << "\t\t\t\t<address "
                 << " uuid="   << one_util::escape_xml_attr(uuid)
                 << "/>\n";
            file << "\t\t\t</source>\n";
        }
        else
        {
            file << "\t\t<hostdev mode='subsystem' type='pci' ";

            if ( mdev == "nvidia" )
            {
                file << "managed='no'>\n";
            }
            else
            {
                file << "managed='yes'>\n";
            }

            file << "\t\t\t<source>\n";
            file << "\t\t\t\t<address "
                 << " domain="   << one_util::escape_xml_attr("0x" + domain)
                 << " bus="      << one_util::escape_xml_attr("0x" + bus)
                 << " slot="     << one_util::escape_xml_attr("0x" + slot)
                 << " function=" << one_util::escape_xml_attr("0x" + func)
                 << "/>\n";
            file << "\t\t\t</source>\n";
        }

        if (!vm_index.empty())
        {
            file << "\t\t\t\t<address type='pci'"
                 << " domain='0x0000' slot='0000' function='0' "
                 << " bus=" << one_util::escape_xml_attr(vm_index)
                 << "/>\n";
        }
        else if (!vm_domain.empty() && !vm_bus.empty() && !vm_slot.empty() &&
             !vm_func.empty())
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

    std::size_t found = machine.find("q35");

    if (found != std::string::npos || arch == "aarch64" )
    {
        int  q35_root_ports = 0;
        bool q35_numa_topo  = true;

        get_attribute(nullptr, host, cluster, "Q35_ROOT_PORTS", q35_root_ports);

        if (!q35_root_ports)
        {
            q35_root_ports = Q35_ROOT_DEFAULT_PORTS;
        }

        get_attribute(nullptr, host, cluster, "Q35_NUMA_PCIE", q35_numa_topo);

        file << "\t<devices>" << endl;
        file << "\t\t<controller index='0' type='pci' model='pcie-root'/>" << endl;

        if (nodes.empty()) //Flat PCI hierarchy
        {
            for (int i=0; i<q35_root_ports; ++i)
            {
                file << "\t\t<controller type='pci' model='pcie-root-port'/>" << endl;
            }

            file << "\t\t<controller type='pci' model='pcie-to-pci-bridge'/>" << endl;
            file << "\t</devices>" << endl;
        }
        else if (q35_numa_topo) //PCIe expander bus in each NUMA node
        {
            ostringstream to_h_s;

            to_h_s << showbase << internal << setfill('0') << hex << setw(4);

            for (unsigned int i = 0; i < nodes.size(); i++)
            {
                unsigned int bus_i = 20 + i * 14;

                to_h_s << (0x20 + 0x20 * i);

                string bus_i_s = to_h_s.str();

                to_h_s.str("");

                //PCIe expander bus in NUMA node i
                file << "\t\t<controller type='pci' index='"<< bus_i <<"'"
                     << " model='pcie-expander-bus'>" << endl
                     << "\t\t\t<target busNr='" << bus_i_s << "'>" << endl
                     << "\t\t\t\t<node>" << i << "</node>" << endl
                     << "\t\t\t</target>" << endl
                     << "\t\t</controller>" << endl;

                //4 PCIe root ports
                for (unsigned int j = 0; j < 4; j++)
                {
                    unsigned int root_i = bus_i + 1 + j;

                    file << "\t\t<controller type='pci' index='" << root_i << "'"
                         << " model='pcie-root-port'>" << endl
                         << "\t\t\t<address type='pci' bus='" << bus_i << "'"
                         << " slot='0' function='" << j << "'";

                    if ( j == 0)
                    {
                        file << " multifunction='on'/>" << endl;
                    }
                    else
                    {
                        file << "/>" << endl;
                    }

                    file << "\t\t</controller>" << endl;
                }

                //8 port PCIe switch
                unsigned int sw_i = bus_i + 5;

                file << "\t\t<controller type='pci' index='" << sw_i << "'"
                     << " model='pcie-switch-upstream-port'>" << endl
                     << "\t\t\t<address type='pci' bus='" << bus_i + 1 << "'"
                     << " slot='0' function='0'/>"
                     << "\t\t</controller>";

                for (unsigned int j = 0; j < 8; j++)
                {
                    unsigned int root_i = sw_i + 1 + j;

                    file << "\t\t<controller type='pci' index='" << root_i << "'"
                         << " model='pcie-switch-downstream-port'>" << endl
                         << "\t\t\t<address type='pci' bus='" << sw_i << "'"
                         << " slot='" << j << "' function='0'/>" << endl
                         << "\t\t</controller>" << endl;
                }
            }

            //Adds pcie-to-pci bridge in the first pcie port in NUMA node 0
            file << "\t\t<controller type='pci' model='pcie-to-pci-bridge'>" << endl
                 << "\t\t\t<address type='pci' bus='22' slot='0' function='0'/>" << endl
                 << "\t\t</controller>" << endl;

            file << "\t</devices>" << endl;
        }
    }


    // ------------------------------------------------------------------------
    // Features
    // ------------------------------------------------------------------------
    get_attribute(vm, host, cluster, "FEATURES", "PAE", pae);
    get_attribute(vm, host, cluster, "FEATURES", "ACPI", acpi);
    get_attribute(vm, host, cluster, "FEATURES", "APIC", apic);
    get_attribute(vm, host, cluster, "FEATURES", "HYPERV", hyperv);
    get_attribute(vm, host, cluster, "FEATURES", "LOCALTIME", localtime);
    get_attribute(vm, host, cluster, "FEATURES", "GUEST_AGENT", guest_agent);

    if ( acpi || pae || apic || hyperv || boot_secure)
    {
        file << "\t<features>" << endl;

        if ( pae )
        {
            file << "\t\t<pae/>" << endl;
        }

        if ( acpi && (arch != "aarch64" || is_uefi ))
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

        if ( boot_secure )
        {
            file << "\t\t<smm state=\"on\"/>" << endl;
        }

        file << "\t</features>" << endl;
    }

    if ( localtime || hyperv )
    {
        string htimers;

        get_attribute(vm, host, cluster, "HYPERV_TIMERS", htimers);

        file << "\t<clock";

        if ( localtime )
        {
            file << " offset='localtime'>" << endl;
        }
        else //UTC is set as the clock offset by default
        {
            file << " offset='utc'>" << endl;
        }

        if (!htimers.empty())
        {
            file << htimers << endl;
        }

        file << "\t</clock>" << endl;
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

    // ------------------------------------------------------------------------
    // Raw KVM attributes
    // ------------------------------------------------------------------------
    num = vm->get_template_attribute("RAW", raw);

    for (int i=0; i<num; i++)
    {
        type = raw[i]->vector_value("TYPE");

        if ( one_util::icasecmp(type, "KVM") )
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

    return 0;
}
