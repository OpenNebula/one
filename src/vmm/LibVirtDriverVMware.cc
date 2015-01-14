

/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

/* ************************************************************************** */
/* LibVirtDriver  :: VMware deployment generator                              */
/* ************************************************************************** */

const char * LibVirtDriver::vmware_vnm_name = "vmware";

int LibVirtDriver::deployment_description_vmware(
        const VirtualMachine *  vm,
        const string&           file_name) const
{
    ofstream                    file;

    int                         num;
    vector<const Attribute *>   attrs;

    string  vcpu;
    string  memory;

    int     memory_in_kb = 0;

    string  arch       = "";
    string  guestOS    = "";
    string  pciBridge  = "";
    string  boot       = "";

    vector<string> boots;

    const VectorAttribute * features;

    const VectorAttribute * disk;
    const VectorAttribute * context;

    string  type       = "";
    string  target     = "";
    string  ro         = "";
    string  source     = "";
    string  driver     = "";
    int     disk_id;
    string  default_driver = "";
    bool    readonly;

    const VectorAttribute * nic;

    string  network_id = "";
    string  mac        = "";
    string  bridge     = "";
    string  script     = "";
    string  model      = "";

    string default_model = "";

    const VectorAttribute * graphics;

    string  listen     = "";
    string  port       = "";
    string  passwd     = "";
    string  keymap     = "";

    const VectorAttribute * raw;
    string data;
    string default_raw;
    string data_vmx    = "";

    ostringstream metadata;

    // ------------------------------------------------------------------------

    file.open(file_name.c_str(), ios::out);

    if (file.fail() == true)
    {
        goto error_vmware_file;
    }

    // ------------------------------------------------------------------------
    // Starting XML document
    // ------------------------------------------------------------------------

    file << "<domain type='" << emulator << "'>" << endl;

    // ------------------------------------------------------------------------
    // Domain name
    // ------------------------------------------------------------------------

    file << "\t<name>one-" << vm->get_oid() << "</name>" << endl;

    // ------------------------------------------------------------------------
    // CPU
    // ------------------------------------------------------------------------

    vm->get_template_attribute("VCPU", vcpu);

    if(vcpu.empty())
    {
        get_default("VCPU", vcpu);
    }

    if (!vcpu.empty())
    {
        file << "\t<vcpu>" << vcpu << "</vcpu>" << endl;
    }

    // ------------------------------------------------------------------------
    // Memory
    // ------------------------------------------------------------------------

    vm->get_template_attribute("MEMORY",memory);

    if (!memory.empty())
    {
        memory_in_kb = atoi(memory.c_str()) * 1024;

        file << "\t<memory>" << memory_in_kb << "</memory>" << endl;
    }
    else
    {
        goto error_vmware_memory;
    }

    // ------------------------------------------------------------------------
    //  OS and boot options
    // ------------------------------------------------------------------------

    num = vm->get_template_attribute("OS",attrs);

    // Get values & defaults
    if ( num > 0 )
    {
        const VectorAttribute * os;

        os = dynamic_cast<const VectorAttribute *>(attrs[0]);

        if( os != 0 )
        {
            arch    = os->vector_value("ARCH");
            guestOS = os->vector_value("GUESTOS");
            boot    = os->vector_value("BOOT");
        }
    }

    if ( arch.empty() )
    {
        get_default("OS","ARCH",arch);

        if (arch.empty())
        {
            goto error_vmware_arch;
        }
    }

    if ( !guestOS.empty() )
    {
        metadata << "<guestos>" << guestOS << "</guestos>" << endl;
    }

    if ( boot.empty() )
    {
        get_default("OS","BOOT",boot);
    }

    // Start writing to the file with the info we got

    file << "\t<os>" << endl;

    file << "\t\t<type arch='" << arch << "'>hvm</type>" << endl;

    if (!boot.empty())
    {
        boots = one_util::split(boot, ',');

        for (vector<string>::const_iterator it=boots.begin(); it!=boots.end(); it++)
        {
            file << "\t\t<boot dev='" << *it << "'/>" << endl;
        }
    }

    file << "\t</os>" << endl;

    attrs.clear();

    // ------------------------------------------------------------------------
    // Features
    // ------------------------------------------------------------------------

    num = vm->get_template_attribute("FEATURES",attrs);

    if ( num > 0 )
    {
        features = dynamic_cast<const VectorAttribute *>(attrs[0]);

        if ( features != 0 )
        {
            pciBridge = features->vector_value("PCIBRIDGE");

            if (!pciBridge.empty())
            {
                metadata << "<pcibridge>" << pciBridge << "</pcibridge>";
            }
        }
    }

    attrs.clear();

    // ------------------------------------------------------------------------
    // Disks
    // ------------------------------------------------------------------------

    file << "\t<devices>" << endl;

    get_default("DISK","DRIVER",default_driver);

    num = vm->get_template_attribute("DISK",attrs);

    for (int i=0; i < num ;i++)
    {
        disk = dynamic_cast<const VectorAttribute *>(attrs[i]);

        if ( disk == 0 )
        {
         continue;
        }

        type   = disk->vector_value("TYPE");
        target = disk->vector_value("TARGET");
        ro     = disk->vector_value("READONLY");
        source = disk->vector_value("SOURCE");
        driver = disk->vector_value("DRIVER");
        disk->vector_value_str("DISK_ID", disk_id);

        if (target.empty())
        {
            goto error_vmware_disk;
        }

        readonly = false;

        if ( !ro.empty() )
        {
            transform(ro.begin(),ro.end(),ro.begin(),(int(*)(int))toupper);

            if ( ro == "YES" )
            {
                readonly = true;
            }
        }

        transform(type.begin(),type.end(),type.begin(),(int(*)(int))toupper);

        // ---- Disk type and source for the image ----

        if ( type == "BLOCK" )
        {
            file << "\t\t<disk type='block' device='disk'>" << endl;
            file << "\t\t\t<source file='[" << vm->get_ds_id() << "] "
                 << vm->get_oid() << "/disk." << disk_id << "'/>" << endl;
        }
        else if ( type == "CDROM" )
        {
            file << "\t\t<disk type='file' device='cdrom'>" << endl;
            file << "\t\t\t<source file='[" << vm->get_ds_id() << "] "
                 << vm->get_oid() << "/disk." << disk_id << ".iso'/>" << endl;
        }
        else
        {
            file << "\t\t<disk type='file' device='disk'>" << endl
                 << "\t\t\t<source file='[" << vm->get_ds_id() <<"] "
                 << vm->get_oid() << "/disk." << disk_id << "/disk.vmdk'/>" << endl;
        }

        // ---- target device to map the disk ----

        file << "\t\t\t<target dev='" << target << "'/>" << endl;

        // ---- Image Format using qemu driver ----

        if ( !driver.empty() )
        {
            file << "\t\t\t<driver name='" << driver << "'/>" << endl;
        }
        else
        {
            if (!default_driver.empty())
            {
                file << "\t\t\t<driver name='" <<
                        default_driver << "'/>" << endl;
            }
        }

        // ---- readonly attribute for the disk ----

        if (readonly)
        {
            file << "\t\t\t<readonly/>" << endl;
        }

        file << "\t\t</disk>" << endl;
    }

    attrs.clear();

    // ------------------------------------------------------------------------
    // Context Device
    // ------------------------------------------------------------------------

    if ( vm->get_template_attribute("CONTEXT",attrs) == 1 )
    {
        context = dynamic_cast<const VectorAttribute *>(attrs[0]);
        target  = context->vector_value("TARGET");

        context->vector_value_str("DISK_ID", disk_id);

        if ( !target.empty() )
        {
            file << "\t\t<disk type='file' device='cdrom'>" << endl;
            file << "\t\t\t<source file='[" <<  vm->get_ds_id() <<"] "
                 << vm->get_oid() << "/disk." << disk_id << ".iso'/>" << endl;
            file << "\t\t\t<target dev='" << target << "'/>" << endl;
            file << "\t\t\t<readonly/>" << endl;
            file << "\t\t</disk>" << endl;
        }
        else
        {
            vm->log("VMM", Log::WARNING, "Could not find target device to"
                " attach context, will continue without it.");
        }
    }

    attrs.clear();

    // ------------------------------------------------------------------------
    // Network interfaces
    // ------------------------------------------------------------------------

    get_default("NIC", "MODEL", default_model);

    num = vm->get_template_attribute("NIC",attrs);

    for(int i=0; i<num; i++)
    {
        nic = dynamic_cast<const VectorAttribute *>(attrs[i]);

        if ( nic == 0 )
        {
            continue;
        }

        network_id = nic->vector_value("NETWORK_ID");
        mac        = nic->vector_value("MAC");
        target     = nic->vector_value("TARGET");
        script     = nic->vector_value("SCRIPT");
        model      = nic->vector_value("MODEL");

        if (vm->get_vnm_mad() == LibVirtDriver::vmware_vnm_name)
        {
            bridge = "one-pg-";
            bridge.append(network_id);
        }
        else
        {
            bridge = nic->vector_value("BRIDGE");
        }

        file << "\t\t<interface type='bridge'>" << endl;
        file << "\t\t\t<source bridge='" << bridge << "'/>" << endl;

        if( !mac.empty() )
        {
            file << "\t\t\t<mac address='" << mac << "'/>" << endl;
        }

        if( !target.empty() )
        {
            file << "\t\t\t<target dev='" << target << "'/>" << endl;
        }

        if( !script.empty() )
        {
            file << "\t\t\t<script path='" << script << "'/>" << endl;
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
            file << "\t\t\t<model type='" << *the_model << "'/>" << endl;
        }

        file << "\t\t</interface>" << endl;

    }

    attrs.clear();

    // ------------------------------------------------------------------------
    // Graphics
    // ------------------------------------------------------------------------

    if ( vm->get_template_attribute("GRAPHICS",attrs) > 0 )
    {
        graphics = dynamic_cast<const VectorAttribute *>(attrs[0]);

        if ( graphics != 0 )
        {
            type   = graphics->vector_value("TYPE");
            listen = graphics->vector_value("LISTEN");
            port   = graphics->vector_value("PORT");
            passwd = graphics->vector_value("PASSWD");
            keymap = graphics->vector_value("KEYMAP");

            if ( type == "vnc" || type == "VNC" )
            {
                file << "\t\t<graphics type='vnc'";

                if ( !listen.empty() )
                {
                    file << " listen='" << listen << "'";
                }

                if ( !port.empty() )
                {
                    file << " port='" << port << "'";
                }

                if ( !passwd.empty() )
                {
                    file << " passwd='" << passwd << "'";
                }

                if ( !keymap.empty() )
                {
                    file << " keymap='" << keymap << "'";
                }

                file << "/>" << endl;
            }
            else
            {
                vm->log("VMM", Log::WARNING,
                        "Not supported graphics type, ignored.");
            }
        }
    }

    attrs.clear();

    file << "\t</devices>" << endl;

    // ------------------------------------------------------------------------
    // Raw VMware attributes
    // ------------------------------------------------------------------------

    num = vm->get_template_attribute("RAW",attrs);

    for(int i=0; i<num;i++)
    {
        raw = dynamic_cast<const VectorAttribute *>(attrs[i]);

        if ( raw == 0 )
        {
            continue;
        }

        type = raw->vector_value("TYPE");

        transform(type.begin(),type.end(),type.begin(),(int(*)(int))toupper);

        if ( type == "VMWARE" )
        {
            data = raw->vector_value("DATA");
            file << "\t" << data << endl;

            data_vmx = raw->vector_value("DATA_VMX");
            if ( !data_vmx.empty() )
            {
                metadata << "<datavmx>" << data_vmx << "</datavmx>";
            }
        }
    }

    get_default("RAW", default_raw);

    if ( !default_raw.empty() )
    {
        file << "\t" << default_raw << endl;
    }

    if ( !metadata.str().empty() )
    {
        file << "\t<metadata>" << metadata.str() << "</metadata>" << endl;
    }

    file << "</domain>" << endl;

    file.close();

    return 0;

error_vmware_file:
    vm->log("VMM", Log::ERROR, "Could not open VMWARE deployment file.");
    return -1;

error_vmware_arch:
    vm->log("VMM", Log::ERROR, "No ARCH defined and no default provided.");
    file.close();
    return -1;

error_vmware_memory:
    vm->log("VMM", Log::ERROR, "No MEMORY defined and no default provided.");
    file.close();
    return -1;

error_vmware_disk:
    vm->log("VMM", Log::ERROR, "Wrong target value in DISK.");
    file.close();
    return -1;
}
