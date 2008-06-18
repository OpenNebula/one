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

#ifndef NEBULA_H_
#define NEBULA_H_

#include <sqlite3.h>

#include "Log.h"
#include "NebulaTemplate.h"

#include "VirtualMachinePool.h"
#include "HostPool.h"

#include "VirtualMachineManager.h"
#include "LifeCycleManager.h"
#include "InformationManager.h"
#include "TransferManager.h"
#include "DispatchManager.h"
#include "RequestManager.h"

class Nebula
{
public:
    
    static Nebula& instance() 
    {
        static Nebula nebulad;
        
        return nebulad;
    };
    
    // ---------------------------------------------------------------
    // Logging
    // ---------------------------------------------------------------
        
    static void log(
        const char *            module,
        const Log::MessageType  type,
        const ostringstream&    message,
        const char *            filename = 0,
        Log::MessageType        clevel   = Log::ERROR)
    {        
        static Log nebula_log(filename,clevel,ios_base::trunc);
        static pthread_mutex_t log_mutex = PTHREAD_MUTEX_INITIALIZER;

        pthread_mutex_lock(&log_mutex);        
        nebula_log.log(module,type,message);
        pthread_mutex_unlock(&log_mutex);
    };

    static void log(
        const char *            module,
        const Log::MessageType  type,
        const char *            message,
        const char *            filename = 0)
    {
        ostringstream os(message);

        Nebula::log(module,type,os,filename);
    };

    // --------------------------------------------------------------
    // Pool Accessors
    // -------------------------------------------------------------- 
    
    VirtualMachinePool * get_vmpool()
    {
        return vmpool;
    };   

    HostPool * get_hpool()
    {
        return hpool;
    }; 

    // --------------------------------------------------------------
    // Manager Accessors
    // -------------------------------------------------------------- 
	
    VirtualMachineManager * get_vmm()
    {
        return vmm;
    };

    LifeCycleManager * get_lcm()
    {
        return lcm;
    };
	
	InformationManager * get_im()
    {
        return im;
    };

    TransferManager * get_tm()
    {
        return tm;
    };

    DispatchManager * get_dm()
    {
        return dm;
    };
    
    // --------------------------------------------------------------
    // Environment & Configuration
    // -------------------------------------------------------------- 
    
    string& get_nebula_location()
    {
        return nebula_location;
    };
   
    static string version()
    {
        return "ONE0.1";   
    };
    
    void start();
    
    void get_configuration_attribute(
        const char * name, 
        string& value) const
    {
        string _name(name);
        
        nebula_configuration->Template::get(_name,value);   
    };
      
private:
    
    // -----------------------------------------------------------------------    
    //Constructors and = are private to only access the class through instance
    // -----------------------------------------------------------------------
    
    Nebula():nebula_configuration(0),db(0),vmpool(0),hpool(0),lcm(0),
        vmm(0),im(0),tm(0),dm(0),rm(0){};
    
    ~Nebula()
    {
        if ( vmpool != 0)
        {
            delete vmpool;
        }

        if ( hpool != 0)
        {
            delete hpool;
        }

        if ( vmm != 0)
        {
            delete vmm;
        }

        if ( lcm != 0)
        {
            delete lcm;
        }
        
        if ( im != 0)
        {
            delete im;
        }

        if ( tm != 0)
        {
            delete tm;
        }
        
        if ( dm != 0)
        {
            delete dm;
        }
       
        if ( rm != 0)
        {
            delete rm;
        }
     
        if ( nebula_configuration != 0)
        {
            delete nebula_configuration;
        }
        
        if ( db != 0 )
        {
            delete db;
        }
    };
        
    Nebula(Nebula const&){};
    
    Nebula& operator=(Nebula const&){return *this;}; 
    
    // ---------------------------------------------------------------
    // Environment variables
    // ---------------------------------------------------------------
       
    string              nebula_location;
    
    // ---------------------------------------------------------------
    // Configuration
    // ---------------------------------------------------------------

    NebulaTemplate *    nebula_configuration;
    
    // ---------------------------------------------------------------
    // Nebula Pools
    // ---------------------------------------------------------------
    
    SqliteDB *           db;
    VirtualMachinePool * vmpool;
    HostPool *           hpool;
    
    // ---------------------------------------------------------------
    // Nebula Managers
    // ---------------------------------------------------------------
    
    LifeCycleManager *      lcm;
    VirtualMachineManager * vmm;
    InformationManager *    im;
    TransferManager *       tm;
    DispatchManager *       dm;
    RequestManager *        rm;
    
    // ---------------------------------------------------------------
    // Implementation functions
    // ---------------------------------------------------------------
    
    friend void nebula_signal_handler (int sig);
};

#endif /*NEBULA_H_*/
