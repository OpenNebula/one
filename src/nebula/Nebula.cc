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
#include "NebulaLog.h"
#include "VirtualMachine.h"
#include "SqliteDB.h"
#include "MySqlDB.h"

#include <stdlib.h>
#include <stdexcept>
#include <libxml/parser.h>

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
    char            hn[80];

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

    string   config_fname = var_location + "config";
    ofstream config_file(config_fname.c_str(), ios_base::trunc & ios_base::out);

    if (config_file.fail() == false)
    {
        config_file << *nebula_configuration << endl;
        config_file.close();
    }

    // -----------------------------------------------------------
    // Log system
    // -----------------------------------------------------------

    ostringstream os;

    try
    {
        string              log_fname;
        int                 log_level_int;
        Log::MessageType    clevel = Log::ERROR;

        log_fname = log_location + "oned.log";

        nebula_configuration->get("DEBUG_LEVEL", log_level_int);

        if (0 <= log_level_int && log_level_int <= 3 )
        {
            clevel = static_cast<Log::MessageType>(log_level_int);
        }

        // Initializing ONE Daemon log system

        NebulaLog::init_log_system(NebulaLog::FILE_TS,
                                   clevel,
                                   log_fname.c_str(),
                                   ios_base::trunc);

        NebulaLog::log("ONE",Log::INFO,"Init OpenNebula Log system");

        os << "Log Level: " << clevel << " [0=ERROR,1=WARNING,2=INFO,3=DEBUG]";

        NebulaLog::log("ONE",Log::INFO,os);
    }
    catch(runtime_error&)
    {
        throw;
    }


    NebulaLog::log("ONE",Log::INFO,"----------------------------------------");
    NebulaLog::log("ONE",Log::INFO,"     OpenNebula Configuration File      ");
    NebulaLog::log("ONE",Log::INFO,"----------------------------------------");

    os.str("");
    os << "\n----------------------------------\n";
    os << *nebula_configuration;
    os << "----------------------------------";

    NebulaLog::log("ONE",Log::INFO,os);

    // -----------------------------------------------------------
    // Initialize the XML library
    // -----------------------------------------------------------
    xmlInitParser();

    // -----------------------------------------------------------
    // Pools
    // -----------------------------------------------------------

    try
    {
        vector<const Attribute *> dbs;
        int  rc;

        bool   db_is_sqlite = true;

        string server  = "localhost";
        string port_str;
        int    port    = 0;
        string user    = "oneadmin";
        string passwd  = "oneadmin";
        string db_name = "opennebula";

        rc = nebula_configuration->get("DB", dbs);

        if ( rc != 0 )
        {
            string value;
            const  VectorAttribute * db = static_cast<const VectorAttribute *>
                                              (dbs[0]);
            value = db->vector_value("BACKEND");

            if (value == "mysql")
            {
                db_is_sqlite = false;

                value = db->vector_value("SERVER");
                if (!value.empty())
                {
                    server = value;
                }

                istringstream   is;

                port_str = db->vector_value("PORT");

                is.str(port_str);
                is >> port;

                if( is.fail() )
                {
                    port = 0;
                }

                value = db->vector_value("USER");
                if (!value.empty())
                {
                    user = value;
                }

                value = db->vector_value("PASSWD");
                if (!value.empty())
                {
                    passwd = value;
                }

                value = db->vector_value("DB_NAME");
                if (!value.empty())
                {
                    db_name = value;
                }
            }
        }

        if ( db_is_sqlite )
        {
            string  db_name = var_location + "one.db";

            db = new SqliteDB(db_name);
        }
        else
        {
            ostringstream   oss;

            db = new MySqlDB(server,port,user,passwd,0);

            oss << "CREATE DATABASE IF NOT EXISTS " << db_name;
            rc = db->exec(oss);

            if ( rc != 0 )
            {
                throw runtime_error("Could not create database.");
            }

            oss.str("");
            oss << "USE " << db_name;
            rc = db->exec(oss);
            if ( rc != 0 )
            {
                throw runtime_error("Could not open database.");
            }
        }

        NebulaLog::log("ONE",Log::INFO,"Bootstraping OpenNebula database.");

        VirtualMachinePool::bootstrap(db);
        HostPool::bootstrap(db);
        VirtualNetworkPool::bootstrap(db);
        UserPool::bootstrap(db);
        ImagePool::bootstrap(db);
    }
    catch (exception&)
    {
        throw;
    }

    try
    {
        string  mac_prefix;
        int     size;
        string  repository_path;
        string  default_image_type;
        string  default_device_prefix;

        vector<const Attribute *> vm_hooks;

        nebula_configuration->get("VM_HOOK", vm_hooks);

        vmpool = new VirtualMachinePool(db, vm_hooks,hook_location);
        hpool  = new HostPool(db);

        nebula_configuration->get("MAC_PREFIX", mac_prefix);
        nebula_configuration->get("NETWORK_SIZE", size);

        vnpool = new VirtualNetworkPool(db,mac_prefix,size);

        upool  = new UserPool(db);

        nebula_configuration->get("IMAGE_REPOSITORY_PATH", repository_path);
        nebula_configuration->get("DEFAULT_IMAGE_TYPE", default_image_type);
        nebula_configuration->get("DEFAULT_DEVICE_PREFIX",
                                  default_device_prefix);

        ipool  = new ImagePool(db,
                               repository_path,
                               default_image_type,
                               default_device_prefix);
    }
    catch (exception&)
    {
        throw;
    }

    // -----------------------------------------------------------
    // Close stds, we no longer need them
    // -----------------------------------------------------------

    fd = open("/dev/null", O_RDWR);

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

        im = new InformationManager(hpool,
                                    timer_period,
                                    monitor_period,
                                    remotes_location,
                                    im_mads);
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
            ipool,
            rm_port,
            log_location + "one_xmlrpc.log");
    }
    catch (bad_alloc&)
    {
        NebulaLog::log("ONE", Log::ERROR, "Error starting RM");
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

    // ---- Auth Manager ----
    try
    {
        vector<const Attribute *> auth_mads;

        nebula_configuration->get("AUTH_MAD", auth_mads);

        if (!auth_mads.empty())
        {
            //Defaults 60s to timeout auth requests
            authm = new AuthManager(timer_period,60,auth_mads);
        }
        else
        {
            authm = 0; //Built-in authm/authz
        }
    }
    catch (bad_alloc&)
    {
        throw;
    }

    if (authm != 0)
    {
        rc = authm->start();

        if ( rc != 0 )
        {
          throw runtime_error("Could not start the Auth Manager");
        }
    }

    // -----------------------------------------------------------
    // Load mads
    // -----------------------------------------------------------

    sleep(2);

    vmm->load_mads(0);

    im->load_mads(0);
    tm->load_mads(0);
    hm->load_mads(0);

    if ( authm != 0 )
    {
        authm->load_mads(0);
    }

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

    //XML Library
    xmlCleanupParser();

    NebulaLog::log("ONE", Log::INFO, "All modules finalized, exiting.\n");
}
