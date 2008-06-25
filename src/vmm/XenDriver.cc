/* -------------------------------------------------------------------------- */
/* Copyright 2002-2008, Distributed Systems Architecture Group, Universidad   */
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
    const VectorAttribute *     disk;
    const VectorAttribute *     nic;
    
    string                      boot_device = "";
    string                      str_value;
    
    // Base Scheduler Credit
    float                       base_credit = 1.0;
    float                       cpu_units = 1.0;
    
    string dev;
    string image;
    string mode;
    string boot;
    
    file.open(file_name.c_str(), ios::out);
    
    if (file.fail() == true)
    {
    	goto error_file;
    }
    
    // ------------------------------------------------------------------------
    // CPU Credits
    // ------------------------------------------------------------------------       
    
    get_default("CREDIT", str_value);
    
    if(str_value!="")
        base_credit = atof(str_value.c_str());
    
    vm->get_template_attribute("CPU", str_value);
    
    if(str_value!="")
        cpu_units = atof(str_value.c_str());
        
    file << "#O CPU_CREDITS = " << ceil(cpu_units*base_credit) << endl;
    

    // VM name
    file << "name = 'one-" << vm->get_oid() << "'" << endl;

    // ------------------------------------------------------------------------
    // Disks and Boot Device
    // ------------------------------------------------------------------------       
    
    num = vm->get_template_attribute("DISK",attrs);
    
    file << "disk = [" << endl;

    for (int i=0; i < num ;i++)
    {
        disk = static_cast<const VectorAttribute *>(attrs[i]);
        
        image = disk->vector_value("IMAGE");
        dev   = disk->vector_value("DEV");
        mode  = disk->vector_value("MODE");
        
        if ( image == "" | dev == "")
        {
        	goto error_disk;
        }
        
        if (mode == "")
        {
        	mode = "rw";
        }
                
        file << "    "
             << "'file:" << image << ","
             << dev << ","
             << mode
             << "'," << endl;
    }

    file << "]" << endl;
      
    // --- Boot device ---
    
    vm->get_template_attribute("BOOT",boot);
    
    if (boot != "")
    {
    	boot_device = boot;
    }
    else
    {  
        // Boot device default value
		boot_device = 
			static_cast<const VectorAttribute *>(attrs[0])->vector_value("DEV");
    }
            
    file << "root = '/dev/" << boot_device << " ro'" << endl;
    
    attrs.clear();
    
    // ------------------------------------------------------------------------
    // Kernel & Ramdisk
    // ------------------------------------------------------------------------       
    
    vm->get_template_attribute("KERNEL",str_value);
    
    if ( str_value == "" )
    {
    	get_default("KERNEL",str_value);
    }
    
    if ( str_value != "" )
    {
    	file << "kernel = '" << str_value << "'" << endl;
    }
    
    vm->get_template_attribute("RAMDISK",str_value);
    
    if( str_value == "" )
    {
    	get_default("RAMDISK",str_value);
    }
    
    if ( str_value != "" )
    {
    	file << "ramdisk = '" << str_value << "'" << endl;
    }

    // ------------------------------------------------------------------------
    // Memory
    // ------------------------------------------------------------------------

    vm->get_template_attribute("MEMORY",str_value);
    
    if( str_value == "" )
    {
       	get_default("MEMORY",str_value);
    }

    if ( str_value != "" )
    {
    	file << "memory  = '" << str_value << "'" << endl;
    }
        
    // ------------------------------------------------------------------------
    // Network
    // ------------------------------------------------------------------------
     
    num = vm->get_template_attribute("NIC",attrs);
    
    if ( num != 0 )
    {	
        file << "vif = [" << endl;
        
        for(int i=0; i<num;i++)
        {
        	char pre_char = ' ';
        	
            nic = static_cast<const VectorAttribute *>(attrs[i]);
            
            file << "    '";
            
            str_value = nic->vector_value("MAC");
            if( str_value != "" )
            {
                file << "mac=" << str_value;
                pre_char = ',';
            }
            
            str_value = nic->vector_value("BRIDGE");
            if( str_value != "" )
            {
                file << pre_char << "bridge=" << str_value;
                pre_char = ',';
            }

            file << "',";
            file << endl;
        }
        
        file << "]" << endl;
    }
    
    attrs.clear();
    
    file.close();

    return 0;

error_file:
	vm->log("VMM", Log::ERROR, "Could not open Xen deployment file\n.");

	return -1;
	
error_disk:
	vm->log("VMM", Log::ERROR, "Wrong dev or image value in DISK attribute\n.");
	
	file.close();	
	return -1;
}
