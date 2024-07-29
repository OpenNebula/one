/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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

#include "XenDriver.h"
#include "Nebula.h"
#include "NebulaUtil.h"
#include <sstream>
#include <fstream>
#include <math.h>

using namespace std;


string on_off_string(bool value)
{
    return value? "1" : "0";
}

int XenDriver::deployment_description(
        const VirtualMachine *  vm,
        const string&           file_name) const
{
    ofstream file;

    int num;

    string credits = "";
    string cpu     = "";
    string memory  = "";
    string vcpu    = "";

    float   base_credit = 1.0;
    float   cpu_units   = 1.0;

    const VectorAttribute * os;

    string kernel     = "";
    string initrd     = "";
    string root       = "";
    string kernel_cmd = "";
    string bootloader = "";
    string hvm        = "";
    string boot       = "";
    int    is_hvm     = 0;

    vector<string> boots;

    vector<const VectorAttribute *> disk;
    const VectorAttribute * context;

    string target     = "";
    string ro         = "";
    string type       = "";
    string driver     = "";
    int    disk_id;
    string default_driver = "";
    string mode;

    vector<const VectorAttribute *> nic;

    string ip         = "";
    string mac        = "";
    string bridge     = "";
    string model      = "";

    string default_model = "";

    const VectorAttribute * graphics;

    string listen     = "";
    string port       = "";
    string passwd     = "";
    string keymap     = "";

    const VectorAttribute * input;

    string  bus        = "";

    const VectorAttribute * features;

    bool pae            = false;
    bool acpi           = false;
    bool apic           = false;
    string device_model = "";
    bool localtime      = false;

    int pae_found           = -1;
    int acpi_found          = -1;
    int apic_found          = -1;
    int device_model_found  = -1;
    int localtime_found     = -1;

    vector<const VectorAttribute *> raw;
    string data        = "";
    string default_raw = "";

    // ------------------------------------------------------------------------

    file.open(file_name.c_str(), ios::out);

    if (file.fail() == true)
    {
        goto error_file;
    }

    // ------------------------------------------------------------------------
    // Domain name
    // ------------------------------------------------------------------------

    file << "name = 'one-" << vm->get_oid() << "'" << endl;

    // ------------------------------------------------------------------------
    // Capacity CPU, Mem & Credits
    // ------------------------------------------------------------------------

    get_default("CREDIT", credits);

    if(!credits.empty())
    {
        base_credit = atof(credits.c_str());
    }

    vm->get_template_attribute("CPU", cpu);

    if(!cpu.empty())
    {
        cpu_units = atof(cpu.c_str());
    }

    file << "#O CPU_CREDITS = " << ceil(cpu_units*base_credit) << endl;

    // -------------------------------------------------------------------------

    vm->get_template_attribute("MEMORY", memory);

    if (!memory.empty())
    {
        file << "memory  = '" << memory << "'" << endl;
    }
    else
    {
        goto error_memory;
    }

    // -------------------------------------------------------------------------

    vm->get_template_attribute("VCPU", vcpu);

    if (vcpu.empty())
    {
        get_default("VCPU", vcpu);
    }

    if (!vcpu.empty())
    {
        file << "vcpus  = '" << vcpu << "'" << endl;
    }

    // ------------------------------------------------------------------------
    //  OS and boot options
    // ------------------------------------------------------------------------

    os = vm->get_template_attribute("OS");

    if ( os != 0 )
    {
        kernel     = os->vector_value("KERNEL");
        initrd     = os->vector_value("INITRD");
        root       = os->vector_value("ROOT");
        kernel_cmd = os->vector_value("KERNEL_CMD");
        bootloader = os->vector_value("BOOTLOADER");
        hvm        = os->vector_value("HVM");
        boot       = os->vector_value("BOOT");
    }

    if ( kernel.empty() )
    {
        get_default("OS", "KERNEL", kernel);
    }

    if ( initrd.empty() )
    {
        get_default("OS", "INITRD", initrd);
    }

    if ( bootloader.empty() )
    {
        get_default("OS", "BOOTLOADER", bootloader);
    }

    if ( root.empty() )
    {
        get_default("OS", "ROOT", root);
    }

    if ( hvm.empty() )
    {
        get_default("OS", "HVM", hvm);
    }

    if ( kernel_cmd.empty() )
    {
        get_default("OS", "KERNEL_CMD", kernel_cmd);
    }

    if ( !kernel.empty() ) //Direct Kernel boot method
    {
        file << "kernel = '" << kernel << "'" << endl;

        if ( !initrd.empty() )
        {
            file << "ramdisk = '" << initrd << "'" << endl;
        }

        if ( !root.empty() )
        {
            file << "root = '/dev/" << root << "'" << endl;
        }

        if ( !kernel_cmd.empty() )
        {
            file << "extra = '" << kernel_cmd << "'" << endl;
        }
    }
    else if ( !bootloader.empty() ) //Host loader boot method
    {
        file << "bootloader = '" << bootloader << "'" << endl;
    }
    else //No kernel & no bootloader use hvm
    {
        is_hvm = 1;
        file << "builder = 'hvm'" << endl;

        if ( !boot.empty() )
        {
            file << "boot = '";

            boots = one_util::split(boot, ',');

            for (auto& boot_option : boots)
            {
                one_util::tolower(boot_option);

                if ( boot_option == "hd" )
                {
                    file << "c";
                }
                else if ( boot_option == "fd" )
                {
                    file << "a";
                }
                else if ( boot_option == "cdrom" )
                {
                    file << "d";
                }
                else if ( boot_option == "network" )
                {
                    file << "n";
                }
                else
                {
                    goto error_boot;
                }
            }

            file << "'" << endl;
        }
    }

    // ------------------------------------------------------------------------
    // Disks
    // ------------------------------------------------------------------------
    get_default("DISK", "DRIVER", default_driver);

    if (default_driver.empty())
    {
        default_driver = "tap:aio:";
    }
    else if (*default_driver.rbegin() != ':' )
    {
        default_driver += ':';
    }

    file << "disk = [" << endl;

    num = vm->get_template_attribute("DISK", disk);

    for (int i=0; i < num ; i++)
    {
        target = disk[i]->vector_value("TARGET");
        type   = disk[i]->vector_value("TYPE");
        ro     = disk[i]->vector_value("READONLY");
        driver = disk[i]->vector_value("DRIVER");
        disk[i]->vector_value_str("DISK_ID", disk_id);

        if ( target.empty() )
        {
            goto error_disk;
        }

        one_util::toupper(type);

        mode = "w";

        if ( one_util::icasecmp(ro, "YES") )
        {
            mode = "r";
        }

        if ( !driver.empty() )
        {
            file << "    '" << driver;

            if (*driver.rbegin() != ':')
            {
                file << ":";
            }
        }
        else
        {
            if ( type == "BLOCK" )
            {
                file << "    'phy:";
            }
            else
            {
                file << "    '" << default_driver;
            }
        }

        file << vm->get_system_dir() << "/disk." << disk_id << ","
             << target;

        if ( type == "CDROM" )
        {
            file << ":cdrom";
        }

        file << "," << mode << "'," << endl;
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
            file << "    '";

            if ( !driver.empty() )
            {
                file << driver;

                if (*driver.rbegin() != ':')
                {
                    file << ":";
                }
            }
            else
            {
                file << default_driver;
            }

            file << vm->get_system_dir() << "/disk." << disk_id
                 << "," << target << "," << "r'," << endl;
        }
        else
        {
            vm->log("VMM", Log::WARNING, "Could not find target device to"
                    " attach context, will continue without it.");
        }
    }

    file << "]" << endl;

    // ------------------------------------------------------------------------
    // Network
    // ------------------------------------------------------------------------
    num = vm->get_template_attribute("NIC", nic);

    get_default("NIC", "MODEL", default_model);

    file << "vif = [" << endl;

    for(int i=0; i<num; i++)
    {
        char pre_char = ' ';

        file << "    '";

        ip     = nic[i]->vector_value("IP");
        mac    = nic[i]->vector_value("MAC");
        bridge = nic[i]->vector_value("BRIDGE");
        model  = nic[i]->vector_value("MODEL");

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
            file << "model=" << *the_model;
            pre_char = ',';
        }

        if( !mac.empty() )
        {
            file << pre_char << "mac=" << mac;
            pre_char = ',';
        }

        if( !ip.empty() )
        {
            file << pre_char << "ip=" << ip;
            pre_char = ',';
        }

        if( !bridge.empty() )
        {
            file << pre_char << "bridge=" << bridge;
        }

        file << "',";
        file << endl;
    }

    file << "]" << endl;

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

        one_util::toupper(type);

        if ( type == "VNC" )
        {
            if ( !is_hvm )
            {
                file << "vfb = ['type=vnc";
            }
            else
            {
                file << "vnc = '1'" << endl;
            }

            if ( !listen.empty() )
            {
                if ( is_hvm )
                {
                    file << "vnclisten = '" << listen << "'" << endl;
                }
                else
                {
                    file << ",vnclisten=" << listen;
                }
            }

            if ( !port.empty() )
            {
                istringstream iss(port);
                int           display;

                iss >> display;

                if ( iss.fail() || display < 5900 )
                {
                    goto error_vncdisplay;
                }

                if ( is_hvm )
                {
                    file << "vncunused = '0'" << endl;
                    file << "vncdisplay = '" << display - 5900 << "'" << endl;
                }
                else
                {
                    file << ",vncunused=0";
                    file << ",vncdisplay=" << display - 5900;
                }
            }

            if ( !passwd.empty() )
            {
                if ( is_hvm )
                {
                    file << "vncpasswd = '" << passwd << "'" << endl;
                }
                else
                {
                    file << ",vncpasswd=" << passwd;
                }
            }

            if ( !keymap.empty() )
            {
                if ( is_hvm )
                {
                    file << "keymap = '" << keymap << "'" << endl;
                }
                else
                {
                    file << ",keymap=" << keymap;
                }
            }

            if ( !is_hvm )
            {
                file <<"']" << endl;
            }
        }
        else if ( is_hvm && type == "SPICE" )
        {
            file << "spice = '1'" << endl;

            if ( !listen.empty() )
            {
                file << "spicehost = '" << listen << "'" << endl;
            }

            if ( !port.empty() )
            {
                file << "spiceport = '" << port << "'" << endl;
            }

            if ( !passwd.empty() )
            {
                file << "spicepasswd = '" << passwd << "'" << endl;
            }
            else
            {
                file << "spicedisable_ticketing = '1'" << endl;
            }
        }
        else
        {
            vm->log("VMM", Log::WARNING,
                    "Not supported graphics type, ignored.");
        }
    }

    // ------------------------------------------------------------------------
    // Input (only usb tablet)
    // ------------------------------------------------------------------------
    input = vm->get_template_attribute("INPUT");

    if ( input != 0 )
    {
        type = input->vector_value("TYPE");
        bus  = input->vector_value("BUS");

        if ( type == "tablet" && bus == "usb" )
        {
            file << "usb = 1" << endl;
            file << "usbdevice = 'tablet'" << endl;
        }
        else
        {
            vm->log("VMM", Log::WARNING,
                    "Not supported input, only usb tablet, ignored.");
        }
    }

    // ------------------------------------------------------------------------
    // Features (only for HVM)
    // ------------------------------------------------------------------------
    if ( is_hvm )
    {
        features = vm->get_template_attribute("FEATURES");

        if ( features != 0 )
        {
            pae_found  = features->vector_value("PAE", pae);
            acpi_found = features->vector_value("ACPI", acpi);
            apic_found = features->vector_value("APIC", apic);
            localtime_found =
                    features->vector_value("LOCALTIME", localtime);

            device_model = features->vector_value("DEVICE_MODEL");
            if ( device_model != "" )
            {
                device_model_found = 0;
            }
        }

        if ( pae_found != 0 && get_default("FEATURES", "PAE", pae) == 0 )
        {
            pae_found = 0;
        }

        if ( acpi_found != 0 && get_default("FEATURES", "ACPI", acpi) == 0 )
        {
            acpi_found = 0;
        }

        if ( apic_found != 0 && get_default("FEATURES", "APIC", apic) == 0 )
        {
            apic_found = 0;
        }

        if ( device_model_found != 0 )
        {
            get_default("FEATURES", "DEVICE_MODEL", device_model);
            if ( device_model != "" )
            {
                device_model_found = 0;
            }
        }

        if ( localtime_found != 0 )
        {
            get_default("FEATURES", "LOCALTIME", localtime);
        }

        if ( pae_found == 0 )
        {
            file << "pae = " << on_off_string(pae) << endl;
        }

        if ( acpi_found == 0 )
        {
            file << "acpi = " << on_off_string(acpi) << endl;
        }

        if ( apic_found == 0 )
        {
            file << "apic = " << on_off_string(apic) << endl;
        }

        if ( device_model_found == 0 )
        {
            file << "device_model = '" << device_model << "'" << endl;
        }

        if ( localtime )
        {
            file << "localtime = '1'" << endl;
        }
    }

    // ------------------------------------------------------------------------
    // Raw XEN attributes
    // ------------------------------------------------------------------------

    num = vm->get_template_attribute("RAW", raw);

    for(int i=0; i<num; i++)
    {
        type = raw[i]->vector_value("TYPE");

        if ( one_util::icasecmp(type, "XEN") )
        {
            data = raw[i]->vector_value("DATA");
            file << data << endl;
        }
    }

    get_default("RAW", default_raw);

    if ( !default_raw.empty() )
    {
        file << default_raw << endl;
    }

    file.close();

    return 0;

error_file:
    vm->log("VMM", Log::ERROR, "Could not open Xen deployment file.");
    return -1;

error_boot:
    vm->log("VMM", Log::ERROR, "Boot option not supported.");
    file.close();
    return -1;

error_memory:
    vm->log("VMM", Log::ERROR, "No memory defined and no default provided.");
    file.close();
    return -1;

error_disk:
    vm->log("VMM", Log::ERROR, "Wrong target value in DISK.");
    file.close();
    return -1;

error_vncdisplay:
    vm->log("VMM", Log::ERROR,
            "Could not generate a valid xen vncdisplay number, "
            "vnc port number must be equal or above 5900.");
    file.close();
    return -1;
}
