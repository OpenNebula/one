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

#ifndef SCHEDULER_H_
#define SCHEDULER_H_

#include "Log.h"
#include "SchedulerHost.h"
#include "SchedulerVirtualMachine.h"
#include "SchedulerPolicy.h"
#include "ActionManager.h"

#include <sqlite3.h>
#include <sstream>
#include <xmlrpc-c/girerr.hpp>
#include <xmlrpc-c/base.hpp>
#include <xmlrpc-c/client_simple.hpp>

using namespace std;


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" void * scheduler_action_loop(void *arg);

/**
 *  The Scheduler class. It represents the scheduler ...
 */

class Scheduler: public ActionListener
{
public:
    
    // ---------------------------------------------------------------
    // Loggging
    // ---------------------------------------------------------------
        
    static void log(
        const char *            module,
        const Log::MessageType  type,
        const ostringstream&    message,
        const char *            filename = 0,
        Log::MessageType        clevel   = Log::DEBUG)
    {        
        static Log scheduler_log(filename,clevel);
        static pthread_mutex_t log_mutex =  PTHREAD_MUTEX_INITIALIZER;
        
        pthread_mutex_lock(&log_mutex);        
        scheduler_log.log(module,type,message);
        pthread_mutex_unlock(&log_mutex);
    };

    static void log(
        const char *            module,
        const Log::MessageType  type,
        const char *            message,
        const char *            filename = 0)
    {
        ostringstream os(message);

        Scheduler::log(module,type,os,filename);
    };
    
    void start();
    
    virtual void register_policies() = 0;
    
protected:
            
    Scheduler(string& url, time_t _timer)
        :hpool(0),vmpool(0),db(0),one_url(url),timer(_timer),threshold(0.9)
    {
        am.addListener(this);
    };
    
    virtual ~Scheduler()
    {    
        if ( hpool != 0)
        {
            delete hpool;
        }
        
        if ( vmpool != 0)
        {
            delete vmpool;
        }

        if (db != 0)
        {
            delete db;
        }
    };

    // ---------------------------------------------------------------
    // Pools
    // ---------------------------------------------------------------
    
    SchedulerHostPool *             hpool;
    SchedulerVirtualMachinePool *   vmpool;   
        
    // ---------------------------------------------------------------
    // Scheduler Policies
    // ---------------------------------------------------------------
    
    void add_host_policy(SchedulerHostPolicy *policy)
    {
        host_policies.push_back(policy);        
    }
    
    // ---------------------------------------------------------------
    // Scheduler main methods
    // ---------------------------------------------------------------

    /**
     *  Gets the hosts that match the requirements of the pending VMs, also 
     *  the capacity of the host is checked. If there is enough room to host the 
     *  VM a share vector is added to the VM.     
     */
    virtual void match();
        
    virtual void dispatch();

    virtual int schedule();
    
    virtual int set_up_pools();
    
private:
    Scheduler(Scheduler const&){};
    
    Scheduler& operator=(Scheduler const&){return *this;}; 
    
    friend void * scheduler_action_loop(void *arg);    
                             
    // ---------------------------------------------------------------
    // Database
    // ---------------------------------------------------------------

    SqliteDB * db;
    
    // ---------------------------------------------------------------
    // Scheduling Policies
    // ---------------------------------------------------------------
    
    vector<SchedulerHostPolicy *>   host_policies;

    // ---------------------------------------------------------------
    // Configuration attributes
    // ---------------------------------------------------------------
    
    /**
     *  the URL of the XML-RPC server
     */
    string  one_url;
    

    time_t  timer;
    
    /**
     *  Threshold value to round up freecpu
     */
    float threshold;
            
    // ---------------------------------------------------------------
    // Timer to periodically schedule and dispatch VMs
    // ---------------------------------------------------------------
    
    pthread_t       sched_thread;
    ActionManager   am;

    void do_action(const string &name, void *args);
    
    // ---------------------------------------------------------------
    // XML_RPC related variables
    // ---------------------------------------------------------------

    /**
     * The authentication token
     */
    string secret;

    /**
     *  NOTE (from lib doc): "you may not have more than one object of this 
     *  class in a program. The code is not re-entrant -- it uses global 
     *  variables."
     */
    xmlrpc_c::clientSimple  xmlrpc_client;
};

#endif /*SCHEDULER_H_*/
