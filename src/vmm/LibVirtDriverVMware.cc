

/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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
/* Virtual Network :: Database Access Functions                               */
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

    const VectorAttribute * disk;
    const VectorAttribute * context;

    string  type       = "";
    string  target     = "";
    string  bus        = "";
    string  ro         = "";
    string  source     = "";
    string  datastore  = "";
    string  driver     = "";
    string  default_driver = "";
    bool    readonly;

    const VectorAttribute * nic;

    string  network_id = "";
    string  mac        = "";
    string  bridge     = "";
    string  script     = "";
    string  model      = "";

    const VectorAttribute * graphics;
    
    string  listen     = "";
    string  port       = "";
    string  passwd     = "";
    string  keymap     = "";

    const VectorAttribute * raw;
    string data;

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
            arch = os->vector_value("ARCH");
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

    // Start writing to the file with the info we got

    file << "\t<os>" << endl;

    file << "\t\t<type arch='" << arch << "'>hvm</type>" << endl;

    file << "\t</os>" << endl;

    attrs.clear();

    // ------------------------------------------------------------------------
    // Disks
    // ------------------------------------------------------------------------

    file << "\t<devices>" << endl;

    get_default("DISK","DRIVER",default_driver);

    num = vm->get_template_attribute("DISK",attrs);

    if (num!=0)
    {
        get_default("DATASTORE", datastore);
    }

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
        bus    = disk->vector_value("BUS");
        source = disk->vector_value("SOURCE");
        driver = disk->vector_value("DRIVER");

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

        if (type.empty() == false)
        {
            transform(type.begin(),type.end(),type.begin(),(int(*)(int))toupper);
        }

        if ( type == "BLOCK" )
        {
            file << "\t\t<disk type='block' device='disk'>" << endl;
            file << "\t\t\t<source file=[" <<  datastore << "] " << vm->get_oid()
                << "/disk."  << i << "'/>"  << endl;
        }
        else if ( type == "CDROM" )
        {
            file << "\t\t<disk type='file' device='cdrom'>" << endl;
            file << "\t\t\t<source file=[" <<  datastore << "] " << vm->get_oid()
                << "/disk."  << i << ".iso'/>"  << endl;
        }
        else
        {
            file << "\t\t<disk type='file' device='disk'>" << endl
                 << "\t\t\t<source file='[" <<  datastore <<"] " << vm->get_oid()
                 << "/disk." << i << "/disk.vmdk'/>" << endl;
        }

        file << "\t\t\t<target dev='" << target << "'";

        if (!bus.empty())
        {
            file << " bus='" << bus << "'/>" << endl;
        }
        else
        {
            file << "/>" << endl;
        }

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

        if ( !target.empty() )
        {
            file << "\t\t<disk type='file' device='cdrom'>" << endl;
            file << "\t\t\t<source file='[" <<  datastore <<"] " << vm->get_oid()
                 << "/disk." << num << ".iso'/>" << endl;
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

        if( !model.empty() )
        {
            file << "\t\t\t<model type='" << model << "'/>" << endl;
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
        }
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
