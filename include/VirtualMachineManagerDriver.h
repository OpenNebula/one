/* -------------------------------------------------------------------------- */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             */
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

#ifndef VIRTUAL_MACHINE_MANAGER_DRIVER_H_
#define VIRTUAL_MACHINE_MANAGER_DRIVER_H_

#include <map>
#include <string>
#include <sstream>

#include "Mad.h"
#include "VirtualMachinePool.h"

using namespace std;

/**
 *  VirtualMachineManagerDriver provides a base class to implement VM Manager
 *  Drivers. This class implements the protocol and recover functions
 *  from the Mad interface. Classes derived from the VirtualMachineManagerDriver
 *  must implement the deployment function to generate specific VM  
 *  deployment information for the unerlying MAD.
 */
class VirtualMachineManagerDriver : public Mad
{
public:

    VirtualMachineManagerDriver(
        int                         userid,
        const map<string,string>&   attrs,
        bool                        sudo,
        VirtualMachinePool *        pool);

    virtual ~VirtualMachineManagerDriver(){};

    /**
     *  Implements the VM Manager driver protocol.
     *    @param message the string read from the driver
     */
    void protocol(
        string&     message);

    /**
     *  TODO: What do we need here? just poll the active VMs to recover 
     *  connections? Or an specific recover action from the MAD?
     */
    void recover();

    /**
     *  Generates a driver-specific deployment file:
     *    @param vm pointer to a virtual machine
     *    @param file_name to generate the deployment description
     *    @return 0 on success
     */
    virtual int deployment_description(
        const VirtualMachine *  vm,
        const string&           file_name) const = 0;
    
protected:	
    /**
     *  Gets a configuration attr from driver configuration file (single 
     *  version)
     *    @param name of config attribute
     *    @param value of the attribute
     */
    void get_default(
    	const char *  name, 
        string&       value) const
    {
    	string sn = name;
    	
    	driver_conf.get(sn,value);
    }    

    /**
     *  Gets a configuration attr from driver configuration file (vector 
     *  version)
     *    @param name of config vector attribute for the domain
     *    @param vname of the attribute
     *    @param value of the attribute
     */
    void get_default(
    	const char *  name,
    	const char *  vname,
        string&       value) const;
    
private:	
	/**	
	 *  Configuration file for the driver
	 */
	Template	driver_conf;
	
    /**
     *  Pointer to the Virtual Machine Pool, to access VMs
     */
    VirtualMachinePool * vmpool;

    friend class VirtualMachineManager;
      
    /**
     *  Sends a deploy request to the MAD: "DEPLOY    ID    HOST    CONF    -"
     *    @param oid the virtual machine id.
     *    @param host the hostname
     *    @param conf the filename of the deployment file
     */
    void deploy (
        const int     oid,
        const string& host,
        const string& conf) const;

    /**
     *  Sends a shutdown request to the MAD: "SHUTDOWN  ID    HOST    NAME    -"
     *    @param oid the virtual machine id.
     *    @param host the hostname
     *    @param name of the Virtual Machine (deployment id), as returned by the
     *    driver 
     */
    void shutdown (
        const int     oid,
        const string& host,
        const string& name) const;

    /**
     *  Sends a cancel request to the MAD: "CANCEL    ID    HOST    NAME    -"
     *    @param oid the virtual machine id.
     *    @param host the hostname
     *    @param name of the Virtual Machine (deployment id), as returned by the
     *    driver
     */
    void cancel (
        const int     oid,
        const string& host,
        const string& name) const;

    /**
     *  Sends a checkpoint request to the MAD: "CHECKPOINT ID  HOST  NAME  FILE"
     *    @param oid the virtual machine id.
     *    @param host the hostname
     *    @param name of the Virtual Machine (deployment id), as returned by the
     *    driver
     *    @param file the filename to generate the checkpoint file
     */
    void checkpoint (
        const int     oid,
        const string& host,
        const string& name,
        const string& file) const;

    /**
     *  Sends a save request to the MAD: "SAVE    ID    HOST    NAME    FILE"
     *    @param oid the virtual machine id.
     *    @param host the hostname
     *    @param name of the Virtual Machine (deployment id), as returned by the
     *    driver
     *    @param file the filename to generate the checkpoint file
     */
    void save (
        const int     oid,
        const string& host,
        const string& name,
        const string& file) const;

    /**
     *  Sends a save request to the MAD: "RESTORE    ID    HOST    FILE    -"
     *    @param oid the virtual machine id.
     *    @param host the hostname
     *    @param name of the Virtual Machine (deployment id), as returned by the
     *    driver
     *    @param file the filename of the checkpoint file to restore the VM 
     *    from
     */
    void restore (
        const int     oid,
        const string& host,
        const string& name,
        const string& file) const;

    /**
     *  Sends a migrate request to the MAD: "MIGRATE    ID    HOST    NAME    DEST"
     *    @param oid the virtual machine id.
     *    @param shost the original host (source)
     *    @param name of the Virtual Machine (deployment id), as returned by the
     *    driver
     *    @param dhost the destination host
     */
    void migrate (
        const int     oid,
        const string& shost,
        const string& name,
        const string& dhost) const;

    /**
     *  Sends a poll request to the MAD: "POLL    ID    HOST    NAME    -"
     *    @param oid the virtual machine id.
     *    @param host the hostname
     *    @param name of the Virtual Machine (deployment id), as returned by the
     *    driver
     */
    void poll (
        const int     oid,
        const string& host,
        const string& name) const;    
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif /*VIRTUAL_MACHINE_MANAGER_DRIVER_H_*/

