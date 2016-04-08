/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

    const VectorAttribute * os;

    string  kernel     = "";
    string  initrd     = "";
    string  boot       = "";
    string  root       = "";
    string  kernel_cmd = "";
    string  bootloader = "";
    string  arch       = "";
    string  machine    = "";

    vector<string> boots;

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

    string  total_bytes_sec = "";
    string  read_bytes_sec  = "";
    string  write_bytes_sec = "";
    string  total_iops_sec  = "";
    string  read_iops_sec   = "";
    string  write_iops_sec  = "";

    string  default_total_bytes_sec = "";
    string  default_read_bytes_sec  = "";
    string  default_write_bytes_sec = "";
    string  default_total_iops_sec  = "";
    string  default_read_iops_sec   = "";
    string  default_write_iops_sec  = "";

    int     disk_id;
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
    string  filter = "";

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

    string  domain          = "";
    /* bus is already defined for disks */
    string  slot            = "";
    string  func            = "";

    const VectorAttribute * features;

    bool pae        = false;
    bool acpi       = false;
    bool apic       = false;
    bool hyperv     = false;
    bool localtime  = false;

    int pae_found       = -1;
    int acpi_found      = -1;
    int apic_found      = -1;
    int hyperv_found    = -1;
    int localtime_found = -1;

    string hyperv_options = "";

    vector<const VectorAttribute *> raw;
    string default_raw = "";
    string data        = "";

    string  vm_xml;

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
    // CPU & Memory
    // ------------------------------------------------------------------------

    vm->get_template_attribute("VCPU", vcpu);

    if(vcpu.empty())
    {
        get_default("VCPU", vcpu);
    }

    if (!vcpu.empty())
    {
        file << "\t<vcpu>" << one_util::escape_xml(vcpu) << "</vcpu>" << endl;
    }

    //Every process gets 1024 shares by default (cgroups), scale this with CPU
    if(vm->get_template_attribute("CPU", cpu))
    {
        file << "\t<cputune>" << endl
             << "\t\t<shares>"<< ceil( cpu * CGROUP_BASE_CPU_SHARES )
             << "</shares>"   << endl
             << "\t</cputune>"<< endl;
    }

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

    os = vm->get_template_attribute("OS");

    if( os != 0 )
    {
        kernel     = os->vector_value("KERNEL");
        initrd     = os->vector_value("INITRD");
        boot       = os->vector_value("BOOT");
        root       = os->vector_value("ROOT");
        kernel_cmd = os->vector_value("KERNEL_CMD");
        bootloader = os->vector_value("BOOTLOADER");
        arch       = os->vector_value("ARCH");
        machine    = os->vector_value("MACHINE");
    }

    if ( arch.empty() )
    {
        get_default("OS","ARCH",arch);

        if ( arch.empty() )
        {
            goto error_arch;
        }
    }

    if ( machine.empty() )
    {
        get_default("OS", "MACHINE", machine);
    }

    file << "\t\t<type arch=" << one_util::escape_xml_attr(arch);

    if ( !machine.empty() )
    {
        file << " machine=" << one_util::escape_xml_attr(machine);
    }

    file << ">hvm</type>" << endl;

    if ( kernel.empty() )
    {
        get_default("OS","KERNEL",kernel);
    }

    if ( initrd.empty() )
    {
        get_default("OS","INITRD",initrd);
    }

    if ( bootloader.empty() )
    {
        get_default("OS","BOOTLOADER",bootloader);
    }

    if ( boot.empty() )
    {
        get_default("OS","BOOT",boot);

        if ( boot.empty() )
        {
            goto error_boot;
        }
    }

    if ( root.empty() )
    {
        get_default("OS","ROOT",root);
    }

    if ( kernel_cmd.empty() )
    {
        get_default("OS","KERNEL_CMD",kernel_cmd);
    }

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

    boots = one_util::split(boot, ',');

    for (vector<string>::const_iterator it=boots.begin(); it!=boots.end(); it++)
    {
        file << "\t\t<boot dev=" << one_util::escape_xml_attr(*it) << "/>\n";
    }

    file << "\t</os>" << endl;

    // ------------------------------------------------------------------------
    // DEVICES SECTION
    // ------------------------------------------------------------------------
    file << "\t<devices>" << endl;

    get_default("EMULATOR",emulator_path);

    if(emulator_path.empty())
    {
        emulator_path = "/usr/bin/kvm";
    }

    file << "\t\t<emulator>" << one_util::escape_xml(emulator_path)
         << "</emulator>\n";

    // ------------------------------------------------------------------------
    // Disks
    // ------------------------------------------------------------------------
    get_default("DISK", "DRIVER", default_driver);

    if (default_driver.empty())
    {
        default_driver = "raw";
    }

    get_default("DISK", "CACHE", default_driver_cache);

    if (default_driver_cache.empty())
    {
       default_driver_cache = "default";
    }

    get_default("DISK", "IO", default_driver_disk_io);
    get_default("DISK", "DISCARD", default_driver_discard);
    get_default("DISK", "TOTAL_BYTES_SEC", default_total_bytes_sec);
    get_default("DISK", "READ_BYTES_SEC", default_read_bytes_sec);
    get_default("DISK", "WRITE_BYTES_SEC", default_write_bytes_sec);
    get_default("DISK", "TOTAL_IOPS_SEC", default_total_iops_sec);
    get_default("DISK", "READ_IOPS_SEC", default_read_iops_sec);
    get_default("DISK", "WRITE_IOPS_SEC", default_write_iops_sec);

    // ------------------------------------------------------------------------

    num = vm->get_template_attribute("DISK", disk);

    for (int i=0; i < num ;i++)
    {
        type            = disk[i]->vector_value("TYPE");
        disk_type       = disk[i]->vector_value("DISK_TYPE");
        target          = disk[i]->vector_value("TARGET");
        ro              = disk[i]->vector_value("READONLY");
        driver          = disk[i]->vector_value("DRIVER");
        cache           = disk[i]->vector_value("CACHE");
        disk_io         = disk[i]->vector_value("IO");
        discard         = disk[i]->vector_value("DISCARD");
        source          = disk[i]->vector_value("SOURCE");
        clone           = disk[i]->vector_value("CLONE");

        ceph_host       = disk[i]->vector_value("CEPH_HOST");
        ceph_secret     = disk[i]->vector_value("CEPH_SECRET");
        ceph_user       = disk[i]->vector_value("CEPH_USER");
        pool_name       = disk[i]->vector_value("POOL_NAME");

        gluster_host    = disk[i]->vector_value("GLUSTER_HOST");
        gluster_volume  = disk[i]->vector_value("GLUSTER_VOLUME");

        sheepdog_host   = disk[i]->vector_value("SHEEPDOG_HOST");
        total_bytes_sec = disk[i]->vector_value("TOTAL_BYTES_SEC");
        read_bytes_sec  = disk[i]->vector_value("READ_BYTES_SEC");
        write_bytes_sec = disk[i]->vector_value("WRITE_BYTES_SEC");
        total_iops_sec  = disk[i]->vector_value("TOTAL_IOPS_SEC");
        read_iops_sec   = disk[i]->vector_value("READ_IOPS_SEC");
        write_iops_sec  = disk[i]->vector_value("WRITE_IOPS_SEC");

        if ( total_bytes_sec.empty() && !default_total_bytes_sec.empty())
        {
            total_bytes_sec = default_total_bytes_sec;
        }

        if ( read_bytes_sec.empty() && !default_read_bytes_sec.empty())
        {
            read_bytes_sec = default_read_bytes_sec;
        }

        if ( write_bytes_sec.empty() && !default_write_bytes_sec.empty())
        {
            write_bytes_sec = default_write_bytes_sec;
        }

        if ( total_iops_sec.empty() && !default_total_iops_sec.empty())
        {
            total_iops_sec = default_total_iops_sec;
        }

        if ( read_iops_sec.empty() && !default_read_iops_sec.empty())
        {
            read_iops_sec = default_read_iops_sec;
        }

        if ( write_iops_sec.empty() && !default_write_iops_sec.empty())
        {
            write_iops_sec = default_write_iops_sec;
        }

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

            dev << vm->get_remote_system_dir() << "/disk." << disk_id;

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
            if (type == "RBD" || disk_type == "RBD")
            {
                file << "\t\t<disk type='network' device='disk'>" << endl;
            }
            else
            {
                file << "\t\t<disk type='network' device='cdrom'>" << endl;
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

            cd_name << vm->get_remote_system_dir() << "/disk." << disk_id;

            file << "\t\t<disk type='file' device='cdrom'>\n"
                 << "\t\t\t<source file="
                 << one_util::escape_xml_attr(cd_name.str())<< "/>\n";
        }
        else
        {
            ostringstream fname;

            fname << vm->get_remote_system_dir() << "/disk." << disk_id;

            file << "\t\t<disk type='file' device='disk'>\n"
                 << "\t\t\t<source file="
                 << one_util::escape_xml_attr(fname.str()) << "/>\n";
        }

        // ---- target device to map the disk ----

        file << "\t\t\t<target dev=" << one_util::escape_xml_attr(target) << "/>\n";

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

        // ---- I/O Options  ----

        if (!(total_bytes_sec.empty() && read_bytes_sec.empty() &&
              write_bytes_sec.empty() && total_iops_sec.empty() &&
              read_iops_sec.empty() && write_iops_sec.empty()))
        {
            file << "\t\t\t<iotune>" << endl;

            if ( !total_bytes_sec.empty() )
            {
                file << "\t\t\t\t<total_bytes_sec>"
                     << one_util::escape_xml(total_bytes_sec)
                     << "</total_bytes_sec>\n";
            }

            if ( !read_bytes_sec.empty() )
            {
                file << "\t\t\t\t<read_bytes_sec>"
                     << one_util::escape_xml(read_bytes_sec)
                     << "</read_bytes_sec>\n";
            }

            if ( !write_bytes_sec.empty() )
            {
                file << "\t\t\t\t<write_bytes_sec>"
                     << one_util::escape_xml(write_bytes_sec)
                     << "</write_bytes_sec>\n";
            }

            if ( !total_iops_sec.empty() )
            {
                file << "\t\t\t\t<total_iops_sec>"
                     << one_util::escape_xml(total_iops_sec)
                     << "</total_iops_sec>\n";
            }

            if ( !read_iops_sec.empty() )
            {
                file << "\t\t\t\t<read_iops_sec>"
                     << one_util::escape_xml(read_iops_sec)
                     << "</read_iops_sec>\n";
            }

            if ( !write_iops_sec.empty() )
            {
                file << "\t\t\t\t<write_iops_sec>"
                     << one_util::escape_xml(write_iops_sec)
                     << "</write_iops_sec>\n";
            }

            file << "\t\t\t</iotune>" << endl;
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

            fname << vm->get_remote_system_dir() << "/disk." << disk_id;

            file << "\t\t<disk type='file' device='cdrom'>\n"
                 << "\t\t\t<source file="
                     << one_util::escape_xml_attr(fname.str())  << "/>\n"
                 << "\t\t\t<target dev="
                     << one_util::escape_xml_attr(target) << "/>\n"
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
    get_default("NIC", "FILTER", default_filter);

    get_default("NIC", "MODEL", default_model);

    num = vm->get_template_attribute("NIC", nic);

    for(int i=0; i<num; i++)
    {
        bridge = nic[i]->vector_value("BRIDGE");
        vn_mad = nic[i]->vector_value("VN_MAD");
        mac    = nic[i]->vector_value("MAC");
        target = nic[i]->vector_value("TARGET");
        script = nic[i]->vector_value("SCRIPT");
        model  = nic[i]->vector_value("MODEL");
        ip     = nic[i]->vector_value("IP");
        filter = nic[i]->vector_value("FILTER");

        if ( bridge.empty() )
        {
            file << "\t\t<interface type='ethernet'>" << endl;
        }
        else
        {
            file << "\t\t<interface type='bridge'>" << endl;


            if (VirtualNetwork::str_to_driver(vn_mad) == VirtualNetwork::OVSWITCH)
            {
                file << "\t\t\t<virtualport type='openvswitch'/>" << endl;
            }

            file << "\t\t\t<source bridge="
                 << one_util::escape_xml_attr(bridge) << "/>\n";
        }

        if( !mac.empty() )
        {
            file << "\t\t\t<mac address=" << one_util::escape_xml_attr(mac)
                 << "/>\n";
        }

        if( !target.empty() )
        {
            file << "\t\t\t<target dev=" << one_util::escape_xml_attr(target)
                 << "/>\n";
        }

        if( !script.empty() )
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
                         << one_util::escape_xml_attr(ip) << "/>\n"
                     << "\t\t\t</filterref>\n";
            }
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
                get_default("SPICE_OPTIONS", spice_options);

                if (spice_options.empty())
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
                 << "domain="   << one_util::escape_xml_attr("0x" + domain)
                 << "bus="      << one_util::escape_xml_attr("0x" + bus)
                 << "slot="     << one_util::escape_xml_attr("0x" + slot)
                 << "function=" << one_util::escape_xml_attr("0x" + func)
             << "/>\n";
        file << "\t\t\t</source>\n";

        file << "\t\t</hostdev>" << endl;
    }

    file << "\t</devices>" << endl;

    // ------------------------------------------------------------------------
    // Features
    // ------------------------------------------------------------------------
    features = vm->get_template_attribute("FEATURES");

    if ( features != 0 )
    {
        pae_found       = features->vector_value("PAE", pae);
        acpi_found      = features->vector_value("ACPI", acpi);
        apic_found      = features->vector_value("APIC", apic);
        hyperv_found    = features->vector_value("HYPERV", hyperv);
        localtime_found = features->vector_value("LOCALTIME", localtime);
    }

    if ( pae_found != 0 )
    {
        get_default("FEATURES", "PAE", pae);
    }

    if ( acpi_found != 0 )
    {
        get_default("FEATURES", "ACPI", acpi);
    }

    if ( apic_found != 0 )
    {
        get_default("FEATURES", "APIC", apic);
    }

    if ( hyperv_found != 0 )
    {
        get_default("FEATURES", "HYPERV", hyperv);
    }

    if ( localtime_found != 0 )
    {
        get_default("FEATURES", "LOCALTIME", localtime);
    }

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
            get_default("HYPERV_OPTIONS", hyperv_options);

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

    // ------------------------------------------------------------------------
    // Raw KVM attributes
    // ------------------------------------------------------------------------
    num = vm->get_template_attribute("RAW", raw);

    for(int i=0; i<num;i++)
    {
        type = raw[i]->vector_value("TYPE");

        one_util::toupper(type);

        if ( type == "KVM" )
        {
            data = raw[i]->vector_value("DATA");
            file << "\t" << data << endl;
        }
    }

    get_default("RAW", default_raw);

    if ( !default_raw.empty() )
    {
        file << "\t" << default_raw << endl;
    }

    // ------------------------------------------------------------------------
    // Metadata used by drivers
    // ------------------------------------------------------------------------
    file << "\t<metadata>\n"
         << "\t\t<system_datastore>"
         << one_util::escape_xml(vm->get_remote_system_dir())
         << "\t\t</system_datastore>\n"
        // << "\t\t<opennebula>\n" << vm->to_xml(vm_xml) << "\t\t</opennebula>\n"
         << "\t</metadata>\n";

    file << "</domain>" << endl;

    file.close();

    return 0;

error_file:
    vm->log("VMM", Log::ERROR, "Could not open KVM deployment file.");
    return -1;

error_memory:
    vm->log("VMM", Log::ERROR, "No MEMORY defined and no default provided.");
    file.close();
    return -1;

error_arch:
    vm->log("VMM", Log::ERROR, "No ARCH defined and no default provided.");
    file.close();
    return -1;

error_boot:
    vm->log("VMM", Log::ERROR, "No BOOT device defined and no default provided.");
    file.close();
    return -1;

error_disk:
    vm->log("VMM", Log::ERROR, "Wrong target value in DISK.");
    file.close();
    return -1;
}
