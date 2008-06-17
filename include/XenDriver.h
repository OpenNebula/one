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

#ifndef XEN_DRIVER_H_
#define XEN_DRIVER_H_

#include <map>
#include <string>
#include <sstream>
#include "Nebula.h"
#include "VirtualMachineManagerDriver.h"

using namespace std;

/**
 *  Xen Driver class implements a VM Manager Driver to interface with the Xen
 *  hypervisor.
 */
class XenDriver : public VirtualMachineManagerDriver
{
public:

    XenDriver(
        int userid,
        const map<string,string> &attrs,
        bool sudo,
        VirtualMachinePool *    pool):
            VirtualMachineManagerDriver(userid, attrs,sudo,pool)
    {
        map<string,string>::const_iterator	it;
        char *							error_msg = 0;
        const char *					cfile;
        string							file;
        int								rc;
        ostringstream           		oss;
        
        it = attrs.find("DEFAULT");
        
        if ( it != attrs.end() )
        {        	        	
            if (it->second[0] != '/') //Look in ONE_LOCATION
            {
                Nebula& nd = Nebula::instance();
                                
                file  = nd.get_nebula_location() + "/" + it->second;
                cfile = file.c_str();
            }
            else //Absolute Path
            {
                cfile = it->second.c_str();        
            } 
            
        	rc = xen_conf.parse(cfile, &error_msg);
        
        	if (( rc != 0 ) && ( error_msg != 0))
        	{
        		oss << "Error loading xen driver configuration file: " 
        			<< error_msg;
        		  
        		Nebula::log("VMM", Log::ERROR, oss);
        		
        		free(error_msg);
        	}
        }        	
    };

    ~XenDriver(){};

private:
	/**	
	 *  Configuration file for the driver
	 */
	Template	xen_conf;
	
    /**
     *  Generates a configuration attr from driver configuration file
     *    @param name of config attribute for the domain
     *    @param value of the attribute
     */
    void get_default(
    	const char *  name, 
        string&       value) const
    {
    	string sn = name;
    	
    	xen_conf.get(sn,value);
    }
    
    /**
     *  Generates a xen-specific deployment file seexmdomain.cfg(5):
     *    @param vm pointer to a virtual machine
     *    @param file_name to generate the deployment description
     *    @return 0 on success
     */
    int deployment_description(
        const VirtualMachine *  vm, 
        const string&           file_name) const;
};

#endif /*XEN_DRIVER_H_*/
