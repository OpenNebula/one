/* -------------------------------------------------------------------------- */
/* Copyright 2002-2009, Distributed Systems Architecture Group, Universidad   */
/* Complutense de Madrid (dsa-research.org)                                   */
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
#include <sstream>
#include <fstream>
#include <math.h>

int XenDriver::deployment_description(
    const VirtualMachine *  vm,
    const string&           file_name) const
{
    ofstream                    file;
        
    int                         num;
    vector<const Attribute *>   attrs;
    
    string	credits;
    string  cpu;
    string  memory;
        
    float   base_credit = 1.0;
    float   cpu_units   = 1.0;

    string kernel     = "";
    string initrd     = "";
    string root       = "";
    string kernel_cmd = "";
    string bootloader = "";

    const VectorAttribute * disk;
    
    string target     = "";
    string ro         = "";
    string mode;

    const VectorAttribute * nic;
    
    string mac        = "";
    string bridge     = "";

    const VectorAttribute * graphics;
	
	string type       = "";
	string listen     = "";
	string port       = "";
	string passwd     = "";

	const VectorAttribute * raw;
	string data;
	
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
    
    // ------------------------------------------------------------------------

    vm->get_template_attribute("MEMORY",memory);
    
    if (memory.empty())
    {
       	get_default("MEMORY",memory);
    }

    if (!memory.empty())
    {
    	file << "memory  = '" << memory << "'" << endl;
    }
    else
    {
    	goto error_memory;
    }
    
    // ------------------------------------------------------------------------
    //  OS and boot options
    // ------------------------------------------------------------------------
    
    num = vm->get_template_attribute("OS",attrs);
    
    if ( num > 0 )
    {
    	const VectorAttribute *	os;
    	
    	os = dynamic_cast<const VectorAttribute *>(attrs[0]);
    	
    	if ( os != 0 )
    	{
            kernel     = os->vector_value("KERNEL");
            initrd     = os->vector_value("INITRD");
            root       = os->vector_value("ROOT");
            kernel_cmd = os->vector_value("KERNEL_CMD");
            bootloader = os->vector_value("BOOTLOADER");
    	}
    }

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

    if ( root.empty() )
    {
    	get_default("OS","ROOT",root);
    }
    
    if ( kernel_cmd.empty() )
    {
    	get_default("OS","KERNEL_CMD",kernel_cmd);
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
    	file << "bootloader = \"" << bootloader << "\"" << endl;    		
    }
    else
    {
    	goto error_boot;    	
    }
            
    attrs.clear();
        
    // ------------------------------------------------------------------------
    // Disks
    // ------------------------------------------------------------------------       
        
    num = vm->get_template_attribute("DISK",attrs);
    
    file << "disk = [" << endl;

    for (int i=0; i < num ;i++,target="",ro="")
    {
        disk = dynamic_cast<const VectorAttribute *>(attrs[i]);
        
        if ( disk == 0 )
        {
            continue;
        }
        
        target = disk->vector_value("TARGET");
        ro     = disk->vector_value("READONLY");
                
        if ( target.empty() )
        {
        	goto error_disk;
        }
                
        mode = "w";
                
        if ( !ro.empty() )
        {
        	transform(ro.begin(),ro.end(),ro.begin(),(int(*)(int))toupper);
        	
        	if ( ro == "YES" )
        	{
        		mode = "r";
        	}
        }
        
        // TODO: "file" method to specify disk images in xen is deprecated.
        // The new method is using "tap:aio:" instead of "file:"
        file << "    "
             << "'tap:aio:" << vm->get_remote_dir() << "/disk." << i << ","
             << target << ","
             << mode
             << "'," << endl;
    }

    file << "]" << endl;

    attrs.clear();
            
    // ------------------------------------------------------------------------
    // Network
    // ------------------------------------------------------------------------
    
    num = vm->get_template_attribute("NIC",attrs);
    
    file << "vif = [" << endl;
        
    for(int i=0; i<num;i++,mac="",bridge="")
    {
       	char pre_char = ' ';
        	
        nic = dynamic_cast<const VectorAttribute *>(attrs[i]);
        
        if ( nic == 0 )
        {
            continue;
        }
        
        file << "    '";
            
        mac = nic->vector_value("MAC");
        
        if( !mac.empty() )
        {
        	file << "mac=" << mac;
            pre_char = ',';
        }
               
        bridge = nic->vector_value("BRIDGE");
        
        if( !bridge.empty() )
        {
        	file << pre_char << "bridge=" << bridge;
        }

        file << "',";
        file << endl;
    }
        
    file << "]" << endl;
    
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
        	
        	if ( type == "vnc" || type == "VNC" )
        	{
        		file << "vfb = ['type=vnc";  
        		
        		if ( !listen.empty() )
        		{
        			file << ",vnclisten=" << listen;
        		}
        		
        		if ( !port.empty() )
        		{
        			file << ",vncdisplay=" << port;
        		}

        		if ( !passwd.empty() )
        		{
        			file << ",vncpasswd=" << passwd;
        		}
        		    		
        		file <<"']" << endl;    		 	
        	}
        	else
        	{
        		vm->log("VMM", Log::WARNING, "Not supported graphics type, ignored.");
        	}        	
    	}    	
    }
    
    attrs.clear();
    
    // ------------------------------------------------------------------------
    // Raw XEN attributes
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
    	
    	if ( type == "XEN" )
    	{   
    		data = raw->vector_value("DATA");
    		file << data << endl;
    	}
    }

    file.close();

    return 0;

error_file:
	vm->log("VMM", Log::ERROR, "Could not open Xen deployment file.");
	return -1;
	
error_memory:
	vm->log("VMM", Log::ERROR, "No memory defined and no default provided.");
	file.close();	
	return -1;

error_boot:
	vm->log("VMM", Log::ERROR, "No kernel or bootloader defined and no default provided.");
	file.close();	
	return -1;

error_disk:
	vm->log("VMM", Log::ERROR, "Wrong target value in DISK.");
	file.close();	
	return -1;
}
