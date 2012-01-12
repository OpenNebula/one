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

#ifndef ONECLIENT_H_
#define ONECLIENT_H_

#ifdef __cplusplus
#include <xmlrpc-c/base.hpp>
#include <xmlrpc-c/client_simple.hpp>

#include <iostream>
#include <string>
#include <sstream>

using namespace std;


/**
 * OneClient class. Provides a simple interface to invoke the ONE methods. This
 * class can be used as base to build complex clients or VM applications
 */

class OneClient : public xmlrpc_c::clientSimple
{
public:
    /* ---------------------------------------------------------------------- */
    /*   ONE Session Constructors                                             */
    /* ---------------------------------------------------------------------- */

	/**
     *  Set the connection values to communicate with ONE
     *  @param oneurl the ONE front-end to interact with, defaults to "localhost".
     *  @param socket the socket where ONE listen to, defaults to 2633.
     */
    OneClient(string oneurl="localhost",unsigned int socket=2633)
    {
        ostringstream oss;

        oss << "http://" << oneurl << ":" << socket << "/RPC2";
        url=oss.str();

        session = "oneclient";
    };

    ~OneClient(){};

    /* ---------------------------------------------------------------------- */
    /*   ONE Virtual Machine Methods                                          */
    /* ---------------------------------------------------------------------- */

    /**
     * 	Add a new VM to the VM pool and starts it.
     * 	@param template_file path, description of the Virtual Machine template
     *  @param vmid, the id of the new VM
   	 *  @param error if an error occurs this is the error message
     * 	@return -1 if an error occurs, 0 on success.
     */
    int allocate(string template_file, int& vmid, string& error);

    /**
     * 	Add a new VM to the VM pool and starts it.
     * 	@param template description of the Virtual Machine template
     *  @param vmid, the id of the new VM
   	 *  @param error if an error occurs this is the error message
     * 	@return -1 if an error occurs, 0 on success.
     */
    int allocate_template(const string& template_file,
                          int&          vmid,
                          string&       error);

    /**
     *	Deploys the virtual machine "vmid" into the host "hid".
     *	@param vmid the virtual machine to deploy.
     *  @param hid  the host id to deploy the VM.
   	 *  @param error if an error occurs this is the error message
     * 	@return -1 if an error occurs, 0 on success.
     */
    int deploy(int vmid, int hid, string& error);

    /**
     *	Migrate the virtual machine "vmid" to the host "hid".
     *	@param vmid the virtual machine to migrate.
     *	@param hid the destination host.
     *	@param live try a "live migration".
   	 *  @param error if an error occurs this is the error message
     * 	@return -1 if an error occurs, 0 on success.
   	 */
    int migrate(int vmid, int hid, bool live, string& error);

    /**
     *  Shutdown a virtual machine.
     *  @param vmid	the vm identifier to shutdown.
   	 *  @param error if an error occurs this is the error message
     * 	@return -1 if an error occurs, 0 on success.
      */
    int shutdown(int vmid, string& error)
    {
    	return action(vmid,"shutdown",error);
    };

    /**
     *  Sets a VM to hold, scheduler will not deploy it.
     *	@param vmid the vm identifier to hold.
   	 *  @param error if an error occurs this is the error message
     * 	@return -1 if an error occurs, 0 on success.
     */
    int hold(int vmid, string& error)
    {
    	return action(vmid,"hold",error);
    };

    /**
     *  Release a VM from hold state.
     *  @param vmid the vm identifier to release.
   	 *  @param error if an error occurs this is the error message
     * 	@return -1 if an error occurs, 0 on success.
     */
    int release(int vmid, string& error)
    {
    	return action(vmid,"release",error);
    };

    /**
     *  Stop a running VM
     *  @param vmid the vm identifier to stop.
   	 *  @param error if an error occurs this is the error message
     * 	@return -1 if an error occurs, 0 on success.
     */
    int stop(int vmid, string& error)
    {
    	return action(vmid,"stop",error);
    };

    /**
     *  Saves a running VM
     *  @param vmid the vm identifier to suspend.
   	 *  @param error if an error occurs this is the error message
     * 	@return -1 if an error occurs, 0 on success.
     */
    int suspend(int vmid, string& error)
    {
    	return action(vmid,"suspend",error);
    };

    /**
     *  Resumes the execution of a saved VM
     *  @param vmid the vm identifier to resume.
   	 *  @param error if an error occurs this is the error message
     * 	@return -1 if an error occurs, 0 on success.
     */
    int resume(int vmid, string& error)
    {
    	return action(vmid,"resume",error);
    };


    /**
     *  Cancel the execution of a VM,
     *  @param vmid the vm identifier to resume.
   	 *  @param error if an error occurs this is the error message
     * 	@return -1 if an error occurs, 0 on success.
     */
    int cancel(int vmid, string& error)
    {
    	return action(vmid,"cancel",error);
    };

    /**
     *  Remove the VM from the DB
     *  @param vmid the vm identifier to resume.
   	 *  @param error if an error occurs this is the error message
     * 	@return -1 if an error occurs, 0 on success.
     */
    int finalize(int vmid, string& error)
    {
    	return action(vmid,"finalize",error);
    };

    /**
     *  Gets information on a virtual machine
     *  @param vmid the vm identifier.
   	 *  @param info the VM information
   	 *  @param error if an error occurs this is the error message
     * 	@return -1 if an error occurs, 0 on success.
     */
    int info(int vmid, string& info, string& error);

    /* ---------------------------------------------------------------------- */
    /*   ONE Host Methods                                                     */
    /* ---------------------------------------------------------------------- */

    /**
     * 	Gets system info from a single host ( "hid" ).
     *	@param hid	the host id to get for information
   	 *  @param error if an error occurs this is the error message
     * 	@return -1 if an error occurs, 0 on success.
     */
    int host_info(int hid, string& info, string& error);

    /**
     *	Removes a host from the pool
     *	@param hid 	the host id to remove
   	 *  @param error if an error occurs this is the error message
     * 	@return -1 if an error occurs, 0 on success.
     */
    int host_delete(int hid, string& error);

    /**
     *	Enables a given host.
     *	@param hid 	the host id to enable.
   	 *  @param error if an error occurs this is the error message
     * 	@return -1 if an error occurs, 0 on success.
     */
    int host_enable(int hid, string& error)
    {
    	return host_available(hid,true,error);
    };

    /**
     *	Disables a given host.
     *	@param hid 	the host id to disable.
   	 *  @param error if an error occurs this is the error message
     * 	@return -1 if an error occurs, 0 on success.
     */
    int host_disable(int hid, string& error)
    {
    	return host_available(hid,false,error);
    };

    /**
     *  Adds a new Host to the Pool
     *  @param name hostname of the host to add
      *	@param im_mad the name of the information driver, from oned.conf
     *  @param vmm_mad the name of the virtual machine manager driver, from oned.conf
   	 *  @param error if an error occurs this is the error message
     * 	@return -1 if an error occurs, 0 on success.
       */
    int host_allocate(string& name,
    				  string& im_mad,
    				  string& vmm_mad,
    				  int&    hid,
    				  string& error);
private:

    /**
     *	URl - url to connect to ONE.
     */
    string url;

    /**
     *	Session - Client session id
     */
    string session;

    /**
     *	Submits an action to be performed on a VM.
     *	@param vmid the VM id.
     *	@param action the "transition" to execute.
     *  @param error if an error occurs this is error message.
     *  @return -1 if an error occurs, otherwise 0.
     */
    int action(int vmid, const char * action, string& error);

    /**
     *	Enables or disables a given host.
     *	@param hid 	the host id to enable/disable.
     *  @param enable true to enavle the target host.
     *  @param error if an error occurs this is error message.
     *  @return -1 if an error occurs, otherwise "0".
     */
    int host_available(int hid, bool enable, string& error);
};

extern "C"
{
#endif

	void c_oneStart(void);

	int c_oneDeploy(int vmid, int hid);

	int c_oneMigrate(int vmid, int hid, int flag);

	int c_oneAllocate(char* vm_template);

	int c_oneAllocateTemplate(char* vm_template);

	int c_oneAction(int vmid,char* action);

	int c_oneShutdown(int vmid);

	int c_oneSuspend(int vmid);

	int c_oneStop(int vmid);

	int c_oneResume(int vmid);

    int c_oneCancel(int vmid);

    int c_oneFinalize(int vmid);

	int c_oneVmInfo(int vmid, char* ret_info,int leng);

	void c_oneFree(void);
	
#ifdef __cplusplus
}
#endif
#endif /*ONECLIENT_H_*/
