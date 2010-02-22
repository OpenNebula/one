/* -------------------------------------------------------------------------- */
/* Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             */
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

#include "Nebula.h"
#include "VirtualMachine.h"

#include <stdlib.h>
#include <stdexcept>

#include <signal.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <pthread.h>

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Nebula::start()
{
    int             rc;
    int             fd;
    sigset_t        mask;
    int             signal;
    char 			hn[80];
        
    if ( gethostname(hn,79) != 0 )
    {
    	throw runtime_error("Error getting hostname");
    }
    
    hostname = hn;

    // ----------------------------------------------------------- 
    // Configuration 
    // ----------------------------------------------------------- 

    nebula_configuration = new NebulaTemplate(etc_location, var_location);
    
    rc = nebula_configuration->load_configuration();
    
    if ( rc != 0 )
    {
        throw runtime_error("Could not load nebula configuration file.");
    }
    
    // ----------------------------------------------------------- 
    // Log system 
    // ----------------------------------------------------------- 
    
    ostringstream os;

    try
    {
        string 				log_fname;
        int    				log_level_int;
        Log::MessageType	clevel = Log::ERROR;
        
        log_fname = log_location + "oned.log";
        
        nebula_configuration->get("DEBUG_LEVEL", log_level_int);
        
        if (0 <= log_level_int && log_level_int <= 3 )
        {
            clevel = static_cast<Log::MessageType>(log_level_int);
        }

        os << "Init OpenNebula Log system";
        
        // Initializing ONE Daemon log system
        
        Nebula::log("ONE",
                    Log::INFO,
                    os,
                    log_fname.c_str(),
                    clevel);
         
        os.str("");
        os << "Log Level: " << clevel << " [0=ERROR,1=WARNING,2=INFO,3=DEBUG]";

        // Initializing ONE Daemon log system

        Nebula::log("ONE",
                    Log::INFO,
                    os,
                    log_fname.c_str(),
                    clevel);               
    }
    catch(runtime_error&)
    {
        throw;
    }
    
    Nebula::log("ONE",Log::INFO,"----------------------------------------------");
    Nebula::log("ONE",Log::INFO,"       OpenNebula Configuration File          ");
    Nebula::log("ONE",Log::INFO,"----------------------------------------------");

    os.str("");
    
    os << "\n--------------------------------------------";
    os << *nebula_configuration;
    os << "\n--------------------------------------------";
    
    Nebula::log("ONE",Log::INFO,os);
       
    // -----------------------------------------------------------     
    // Pools
    // ----------------------------------------------------------- 

    try
    {
        string      db_name = var_location + "one.db";
        struct stat db_stat;
        bool        db_bootstrap = stat(db_name.c_str(), &db_stat) != 0;
        
        db = new SqliteDB(db_name,Nebula::log);

	if (db_bootstrap)
	{
	    Nebula::log("ONE",Log::INFO,"Bootstraping OpenNebula database.");
	    
	    VirtualMachinePool::bootstrap(db);
	    HostPool::bootstrap(db);
	    VirtualNetworkPool::bootstrap(db);
	    UserPool::bootstrap(db);
	}
    }
    catch (exception&)
    {
        throw;
    }
    
    try
    {   
    	string 	mac_prefix;
    	int		size;
    	
        vector<const Attribute *> vm_hooks;
                
        nebula_configuration->get("VM_HOOK", vm_hooks);
    	
        vmpool = new VirtualMachinePool(db, vm_hooks);
        hpool  = new HostPool(db);
        
        nebula_configuration->get("MAC_PREFIX", mac_prefix);
        nebula_configuration->get("NETWORK_SIZE", size);
                
        vnpool = new VirtualNetworkPool(db,mac_prefix,size);
        
        upool  = new UserPool(db);
    }
    catch (exception&)
    {
        throw;
    }
    
    // ----------------------------------------------------------- 
    // Close stds, we no longer need them                          
    // ----------------------------------------------------------- 
    
    fd = open("/dev/null", O_RDWR|O_CREAT);
        
    dup2(fd,0);
    dup2(fd,1);    
    dup2(fd,2);
  
    close(fd);  
    
    fcntl(0,F_SETFD,0); // Keep them open across exec funcs
    fcntl(1,F_SETFD,0);
    fcntl(2,F_SETFD,0);
    
    // ----------------------------------------------------------- 
    // Block all signals before creating any Nebula thread                  
    // ----------------------------------------------------------- 
       
    sigfillset(&mask);
    
    pthread_sigmask(SIG_BLOCK, &mask, NULL);           
        
    // ----------------------------------------------------------- 
    //Managers
    // -----------------------------------------------------------
    
    MadManager::mad_manager_system_init();

    time_t timer_period;
        
    nebula_configuration->get("MANAGER_TIMER", timer_period);
        
    // ---- Virtual Machine Manager ----         
    try
    {
        time_t                    poll_period;
        vector<const Attribute *> vmm_mads;

        nebula_configuration->get("VM_POLLING_INTERVAL", poll_period);
        
        nebula_configuration->get("VM_MAD", vmm_mads);
        
        vmm = new VirtualMachineManager(
            vmpool,
            hpool,
            timer_period,
            poll_period,
            vmm_mads);
    }
    catch (bad_alloc&)
    {
        throw;
    }
        
    rc = vmm->start();
    
    if ( rc != 0 )
    {
        throw runtime_error("Could not start the Virtual Machine Manager");
    }    
    
    // ---- Life-cycle Manager ----    
    try
    {
        lcm = new LifeCycleManager(vmpool,hpool);
    }
    catch (bad_alloc&)
    {
        throw;
    }

    rc = lcm->start();
    
    if ( rc != 0 )
    {
        throw runtime_error("Could not start the Life-cycle Manager");
    }
    
    // ---- Information Manager ----
    try
    {
        vector<const Attribute *>   im_mads;
        time_t                      monitor_period;
        
        nebula_configuration->get("HOST_MONITORING_INTERVAL", monitor_period);
                                
        nebula_configuration->get("IM_MAD", im_mads);
        
        im = new InformationManager(hpool,timer_period,monitor_period,im_mads);
    }
    catch (bad_alloc&)
    {
        throw;
    }

    rc = im->start();
    
    if ( rc != 0 )
    {
        throw runtime_error("Could not start the Information Manager");
    }

    // ---- Transfer Manager ----
    try
    {
        vector<const Attribute *> tm_mads;
                
        nebula_configuration->get("TM_MAD", tm_mads);
        
        tm = new TransferManager(vmpool, hpool, tm_mads);
    }
    catch (bad_alloc&)
    {
        throw;
    }

    rc = tm->start();
    
    if ( rc != 0 )
    {
        throw runtime_error("Could not start the Transfer Manager");
    }
 
    // ---- Dispatch Manager ----
    try
    {        
        dm = new DispatchManager(vmpool,hpool);
    }
    catch (bad_alloc&)
    {
        throw;
    }
    
    rc = dm->start();
    
    if ( rc != 0 )
    {
       throw runtime_error("Could not start the Dispatch Manager");
    }

    // ---- Request Manager ----
    try
    {        
        int             rm_port = 0;

        nebula_configuration->get("PORT", rm_port);
        
        rm = new RequestManager(
            vmpool,
            hpool,
            vnpool,
            upool,
            rm_port,
            log_location + "one_xmlrpc.log");
    }
    catch (bad_alloc&)
    {
        Nebula::log("ONE", Log::ERROR, "Error starting RM");
        throw;
    }
    
    rc = rm->start();
    
    if ( rc != 0 )
    {
       throw runtime_error("Could not start the Request Manager");
    }

    // ---- Hook Manager ----         
    try
    {
        vector<const Attribute *> hm_mads;
                
        nebula_configuration->get("HM_MAD", hm_mads);
        
        hm = new HookManager(hm_mads,vmpool);
    }
    catch (bad_alloc&)
    {
        throw;
    }

    rc = hm->start();
    
    if ( rc != 0 )
    {
       throw runtime_error("Could not start the Hook Manager");
    }
        
    // -----------------------------------------------------------
    // Load mads
    // -----------------------------------------------------------

    sleep(2);

    vmm->load_mads(0);

    im->load_mads(0);
    tm->load_mads(0);
    hm->load_mads(0);
    
    // -----------------------------------------------------------
    // Wait for a SIGTERM or SIGINT signal
    // -----------------------------------------------------------
    
    sigemptyset(&mask);
    
    sigaddset(&mask, SIGINT);
    sigaddset(&mask, SIGTERM);
        
    sigwait(&mask, &signal);

    // ----------------------------------------------------------- 
    // Stop the managers & free resources
    // -----------------------------------------------------------
    
    vmm->trigger(VirtualMachineManager::FINALIZE,0);
    lcm->trigger(LifeCycleManager::FINALIZE,0);    

    tm->trigger(TransferManager::FINALIZE,0);
    dm->trigger(DispatchManager::FINALIZE,0);
    
    im->finalize();    
    rm->finalize();
    hm->finalize();

    //sleep to wait drivers???
    
    pthread_join(vmm->get_thread_id(),0);
    pthread_join(lcm->get_thread_id(),0);
    pthread_join(tm->get_thread_id(),0);
    pthread_join(dm->get_thread_id(),0);
    
    pthread_join(im->get_thread_id(),0);
    pthread_join(rm->get_thread_id(),0);
    pthread_join(hm->get_thread_id(),0);
    
    Nebula::log("ONE", Log::INFO, "All modules finalized, exiting.\n");
}

