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

#include "Nebula.h"
#include "NebulaLog.h"
#include "VirtualMachine.h"
#include "SqliteDB.h"
#include "MySqlDB.h"

#include "OneUnitTest.h"
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
    int             rc;
    sigset_t        mask;
    time_t          timer_period;

    NebulaTest *    tester;

    tester = NebulaTest::instance();

    // Because Nebula is accessed only using ::instance(), it can't be
    // deleted. Tests use the start method several times before the
    // destructor is invoked, so this clean-up is necessary
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

    if ( cpool != 0)
    {
        delete cpool;
    }

    if ( tpool != 0)
    {
        delete tpool;
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

    if ( nebula_configuration != 0)
    {
        delete nebula_configuration;
    }

    xmlInitParser();

    // -----------------------------------------------------------
    // Pools
    // -----------------------------------------------------------

    try
    {
        vector<const Attribute *> dbs;

        db = OneUnitTest::get_db();

        NebulaLog::log("ONE",Log::INFO,"Bootstraping OpenNebula database.");

        VirtualMachinePool::bootstrap(db);
        HostPool::bootstrap(db);
        VirtualNetworkPool::bootstrap(db);
        UserPool::bootstrap(db);
        ImagePool::bootstrap(db);
        ClusterPool::bootstrap(db);
    }
    catch (exception&)
    {
        throw;
    }

    // -----------------------------------------------------------

    try
    {
        string  mac_prefix = "00:00";
        int     size = 1;
        string  default_image_type;
        string  default_device_prefix;

        if (tester->need_vm_pool)
        {
            vmpool = tester->create_vmpool(db,hook_location);
        }

        if (tester->need_host_pool)
        {
            hpool  = tester->create_hpool(db,hook_location);
        }

        if (tester->need_vnet_pool)
        {
            vnpool = tester->create_vnpool(db,mac_prefix,size);
        }

        if (tester->need_user_pool)
        {
            upool  = tester->create_upool(db);
        }

        if (tester->need_image_pool)
        {
            ipool  = tester->create_ipool(db,
                                          default_image_type,
                                          default_device_prefix);
        }

        if (tester->need_cluster_pool)
        {
            cpool  = tester->create_cpool(db);
        }

        if (tester->need_template_pool)
        {
            tpool  = tester->create_tpool(db);
        }
    }
    catch (exception&)
    {
        throw;
    }

    // Set pointer to null, to prevent its deletion on the destructor
    db = 0;

    // -----------------------------------------------------------
    //Managers
    // -----------------------------------------------------------

    timer_period = 0;
    rc = 0;

    sigfillset(&mask);

    pthread_sigmask(SIG_BLOCK, &mask, NULL);

    MadManager::mad_manager_system_init();

    // ---- Virtual Machine Manager ----
    if (tester->need_vmm)
    {
        try
        {
            time_t poll_period = 0;

            vmm = tester->create_vmm(vmpool,hpool,timer_period,poll_period);
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
    }

    // ---- Life-cycle Manager ----
    if (tester->need_lcm)
    {
        try
        {
            lcm = tester->create_lcm(vmpool,hpool);
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
    }

    // ---- Information Manager ----
    if (tester->need_im)
    {
        try
        {
            im = tester->create_im(hpool,timer_period,remotes_location);
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
    }

    // ---- Transfer Manager ----
    if (tester->need_tm)
    {
        try
        {
            tm = tester->create_tm(vmpool, hpool);
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
    }

    // ---- Dispatch Manager ----
    if ( tester->need_dm )
    {
        try
        {
            dm = tester->create_dm(vmpool,hpool);
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
    }

    // ---- Request Manager ----
    if (tester->need_rm)
    {
        try
        {
            rm = tester->create_rm(vmpool,hpool,vnpool,upool,ipool,cpool,tpool,
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
    }

    // ---- Hook Manager ----
    if (tester->need_hm)
    {
        try
        {
            hm = tester->create_hm(vmpool);
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
    }

    // ---- Auth Manager ----
    if (tester->need_authm)
    {
        try
        {
            authm = tester->create_authm(timer_period);
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
    }

    // ---- Auth Manager ----
    if (tester->need_imagem)
    {
        try
        {
            imagem = tester->create_imagem(ipool);
        }
        catch (bad_alloc&)
        {
            throw;
        }

        if (imagem != 0)
        {
            rc = imagem->start();

            if ( rc != 0 )
            {
              throw runtime_error("Could not start the Image Manager");
            }
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
