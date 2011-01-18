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

#include "NebulaTest.h"

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


    // -----------------------------------------------------------
    // Configuration
    // -----------------------------------------------------------

    // A self-contained structure in current directory is assumed
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

        bool   db_is_sqlite = ! NebulaTest::instance().isMysql();

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

            db = new MySqlDB(server,0,user,passwd,"");

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

       vmpool = NebulaTest::create_vmpool(db, hook_location);
       hpool  = NebulaTest::create_hpool(db, hook_location);
       vnpool = NebulaTest::create_vnpool(db, mac_prefix,size);
       upool  = NebulaTest::create_upool(db);
       ipool  = NebulaTest::create_ipool(db,
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
    rc = 0;

    // ---- Virtual Machine Manager ----
    try
    {
        time_t                    poll_period = 0;

        vmm = NebulaTest::create_vmm(vmpool,hpool,timer_period,poll_period);
    }
    catch (bad_alloc&)
    {
        throw;
    }

    if( vmm != 0)
    {
        rc = vmm->start();
    }

    if ( rc != 0 )
    {
        throw runtime_error("Could not start the Virtual Machine Manager");
    }

    // ---- Life-cycle Manager ----
    try
    {
        lcm = NebulaTest::create_lcm(vmpool,hpool);
    }
    catch (bad_alloc&)
    {
        throw;
    }

    if( lcm != 0 )
    {
        rc = lcm->start();
    }

    if ( rc != 0 )
    {
        throw runtime_error("Could not start the Life-cycle Manager");
    }

    // ---- Information Manager ----
    try
    {
        im = NebulaTest::create_im(hpool,timer_period,remotes_location);
    }
    catch (bad_alloc&)
    {
        throw;
    }

    if( im != 0 )
    {
        rc = im->start();
    }

    if ( rc != 0 )
    {
        throw runtime_error("Could not start the Information Manager");
    }

    // ---- Transfer Manager ----
    try
    {
        tm = NebulaTest::create_tm(vmpool, hpool);
    }
    catch (bad_alloc&)
    {
        throw;
    }

    if( tm != 0 )
    {
        rc = tm->start();
    }

    if ( rc != 0 )
    {
        throw runtime_error("Could not start the Transfer Manager");
    }

    // ---- Dispatch Manager ----
    try
    {
        dm = NebulaTest::create_dm(vmpool,hpool);
    }
    catch (bad_alloc&)
    {
        throw;
    }

    if( dm != 0 )
    {
        rc = dm->start();
    }

    if ( rc != 0 )
    {
       throw runtime_error("Could not start the Dispatch Manager");
    }

    // ---- Request Manager ----
    try
    {
        rm = NebulaTest::create_rm(vmpool,hpool,vnpool,upool,ipool,
                        log_location + "one_xmlrpc.log");
    }
    catch (bad_alloc&)
    {
        NebulaLog::log("ONE", Log::ERROR, "Error starting RM");
        throw;
    }

    if( rm != 0 )
    {
        rc = rm->start();
    }

    if ( rc != 0 )
    {
       throw runtime_error("Could not start the Request Manager");
    }

    // ---- Hook Manager ----
    try
    {
        hm = NebulaTest::create_hm(vmpool);
    }
    catch (bad_alloc&)
    {
        throw;
    }

    if( hm != 0 )
    {
        rc = hm->start();
    }

    if ( rc != 0 )
    {
       throw runtime_error("Could not start the Hook Manager");
    }

    // ---- Auth Manager ----
    try
    {
        authm = NebulaTest::create_authm(timer_period);
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

    if( vmm != 0 )
    {
        vmm->load_mads(0);
    }

    if( im != 0 )
    {
        im->load_mads(0);
    }

    if( tm != 0 )
    {
        tm->load_mads(0);
    }

    if( hm != 0 )
    {
        hm->load_mads(0);
    }

    if( authm != 0 )
    {
        authm->load_mads(0);
    }
};
