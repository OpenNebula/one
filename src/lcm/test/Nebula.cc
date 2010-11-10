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

#include "LifeCycleManagerTest.h"
#include "DummyManager.h"

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

    // Clean up
    if ( vmpool != 0)
    {
        delete vmpool;
    }

    if ( vnpool != 0)
    {
        delete vnpool;
    }

    if ( hpool != 0)
    {
        delete hpool;
    }

    if ( upool != 0)
    {
        delete upool;
    }

    if ( ipool != 0)
    {
        delete ipool;
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

    if ( hm != 0)
    {
        delete hm;
    }

    if ( authm != 0)
    {
        delete authm;
    }

    if ( nebula_configuration != 0)
    {
        delete nebula_configuration;
    }

    if ( db != 0 )
    {
        delete db;
    }


    nebula_location = "./";

    mad_location     = nebula_location + "lib/mads/";
    etc_location     = nebula_location + "etc/";
    log_location     = nebula_location + "var/";
    var_location     = nebula_location + "var/";
    hook_location    = nebula_location + "share/hooks/";
    remotes_location = nebula_location + "lib/remotes/";


    int             rc;
    sigset_t        mask;

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

        bool   db_is_sqlite = ! LifeCycleManagerTest::isMysql();

        string server  = "localhost";
        string user    = "oneadmin";
        string passwd  = "oneadmin";
        string db_name = "ONE_test_database";

        if ( db_is_sqlite )
        {
            string  db_name = var_location + "one.db";

            db = new SqliteDB(db_name);
        }
        else
        {
            ostringstream   oss;

            db = new MySqlDB(server,user,passwd,0);

            oss << "DROP DATABASE IF EXISTS " << db_name;
            db->exec(oss);

            oss.str("");

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
        string  mac_prefix = "00:00";
        int     size = 1;
        string  repository_path;
        string  default_image_type;
        string  default_device_prefix;

        vector<const Attribute *> vm_hooks;

        vmpool = new VirtualMachinePool(db, vm_hooks,hook_location);
        hpool  = new HostPool(db);
        vnpool = new VirtualNetworkPool(db,mac_prefix,size);
        upool  = new UserPool(db);
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
    // Block all signals before creating any Nebula thread
    // -----------------------------------------------------------

    sigfillset(&mask);

    pthread_sigmask(SIG_BLOCK, &mask, NULL);

    // -----------------------------------------------------------
    //Managers
    // -----------------------------------------------------------

    MadManager::mad_manager_system_init();

    time_t timer_period = 0;

    // ---- Virtual Machine Manager ----
    try
    {
        time_t                    poll_period = 0;
        vector<const Attribute *> vmm_mads;

        vmm = new VirtualMachineManagerTest(
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

    // ---- Transfer Manager ----
    try
    {
        vector<const Attribute *> tm_mads;

        tm = new TransferManagerTest(vmpool, hpool, tm_mads);
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

    // ---- Life-cycle Manager ----
    try
    {
//        lcm = new LifeCycleManager(vmpool,hpool,vmm,tm,dm);
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

    // -----------------------------------------------------------
    // Load mads
    // -----------------------------------------------------------

    sleep(2);

    vmm->load_mads(0);
};

