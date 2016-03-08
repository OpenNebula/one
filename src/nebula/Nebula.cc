/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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
#include "Client.h"

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

void Nebula::start(bool bootstrap_only)
{
    int             rc;
    int             fd;
    sigset_t        mask;
    int             signal;
    char            hn[80];
    string          scripts_remote_dir;

    if ( gethostname(hn,79) != 0 )
    {
        throw runtime_error("Error getting hostname");
    }

    hostname = hn;

    // -----------------------------------------------------------
    // Configuration
    // -----------------------------------------------------------

    nebula_configuration = new OpenNebulaTemplate(etc_location, var_location);

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

    nebula_configuration->get("SCRIPTS_REMOTE_DIR", scripts_remote_dir);
    hook_location = scripts_remote_dir + "/hooks/";

    // -----------------------------------------------------------
    // Log system
    // -----------------------------------------------------------

    ostringstream os;

    try
    {
        Log::MessageType   clevel;
        NebulaLog::LogType log_system;

        log_system = get_log_system();
        clevel     = get_debug_level();

        // Initializing ONE Daemon log system
        if ( log_system != NebulaLog::UNDEFINED )
        {
            string log_fname;
            log_fname = log_location + "oned.log";

            NebulaLog::init_log_system(log_system,
                                       clevel,
                                       log_fname.c_str(),
                                       ios_base::trunc,
                                       "oned");
        }
        else
        {
            throw runtime_error("Unknown LOG_SYSTEM.");
        }

        os << "Starting " << version() << endl;
        os << "----------------------------------------\n";
        os << "     OpenNebula Configuration File      \n";
        os << "----------------------------------------\n";
        os << *nebula_configuration;
        os << "----------------------------------------";

        NebulaLog::log("ONE",Log::INFO,os);

        os.str("");
        os << "Log level:" << clevel << " [0=ERROR,1=WARNING,2=INFO,3=DEBUG]";

        NebulaLog::log("ONE",Log::INFO,os);

        os.str("");
        os << "Support for xmlrpc-c > 1.31: ";

#ifdef OLD_XMLRPC
        os << "no. MAX_CONN and MAX_CONN_BACKLOG configuration will not be used";
#else
        os << "yes";
#endif

        NebulaLog::log("ONE",Log::INFO,os);
    }
    catch(runtime_error&)
    {
        throw;
    }

    // -----------------------------------------------------------
    // Load the OpenNebula master key and keep it in memory
    // -----------------------------------------------------------

    rc = nebula_configuration->load_key();

    if ( rc != 0 )
    {
        throw runtime_error("Could not load nebula master key file.");
    }

    // -----------------------------------------------------------
    // Initialize the XML library
    // -----------------------------------------------------------
    xmlInitParser();

    // -----------------------------------------------------------
    // Init federation configuration
    // -----------------------------------------------------------
    federation_enabled  = false;
    federation_master   = false;
    zone_id             = 0;
    master_oned         = "";

    const VectorAttribute * vatt = nebula_configuration->get("FEDERATION");

    if (vatt != 0)
    {
        string mode = vatt->vector_value("MODE");
        one_util::toupper(mode);

        if (mode == "STANDALONE")
        {
            federation_enabled = false;
            federation_master = false;
            zone_id = 0;
        }
        else if (mode == "MASTER")
        {
            federation_enabled = true;
            federation_master = true;
        }
        else if (mode == "SLAVE")
        {
            federation_enabled = true;
            federation_master = false;
        }
        else
        {
            throw runtime_error(
                "FEDERATION MODE must be one of STANDALONE, MASTER, SLAVE.");
        }

        if (federation_enabled)
        {
            rc = vatt->vector_value("ZONE_ID", zone_id);

            if (rc != 0)
            {
                throw runtime_error("FEDERATION ZONE_ID must be set for "
                    "federated instances.");
            }

            master_oned = vatt->vector_value("MASTER_ONED");

            if (master_oned.empty() && !federation_master)
            {
                throw runtime_error(
                    "FEDERATION MASTER_ONED endpoint is missing.");
            }
        }
    }

    Log::set_zone_id(zone_id);

    // -----------------------------------------------------------
    // Database
    // -----------------------------------------------------------
    try
    {
        bool db_is_sqlite = true;

        string server  = "localhost";
        string port_str;
        int    port    = 0;
        string user    = "oneadmin";
        string passwd  = "oneadmin";
        string db_name = "opennebula";

        const VectorAttribute * _db = nebula_configuration->get("DB");

        if ( _db != 0 )
        {
            string value = _db->vector_value("BACKEND");

            if (value == "mysql")
            {
                db_is_sqlite = false;

                value = _db->vector_value("SERVER");
                if (!value.empty())
                {
                    server = value;
                }

                istringstream   is;

                port_str = _db->vector_value("PORT");

                is.str(port_str);
                is >> port;

                if( is.fail() )
                {
                    port = 0;
                }

                value = _db->vector_value("USER");
                if (!value.empty())
                {
                    user = value;
                }

                value = _db->vector_value("PASSWD");
                if (!value.empty())
                {
                    passwd = value;
                }

                value = _db->vector_value("DB_NAME");
                if (!value.empty())
                {
                    db_name = value;
                }
            }
        }

        if ( db_is_sqlite )
        {
            db = new SqliteDB(var_location + "one.db");
        }
        else
        {
            db = new MySqlDB(server, port, user, passwd, db_name);
        }

        // ---------------------------------------------------------------------
        // Prepare the SystemDB and check versions
        // ---------------------------------------------------------------------

        bool local_bootstrap;
        bool shared_bootstrap;

        NebulaLog::log("ONE",Log::INFO,"Checking database version.");

        system_db = new SystemDB(db);

        rc = system_db->check_db_version(is_federation_slave(),
                                         local_bootstrap,
                                         shared_bootstrap);
        if( rc == -1 )
        {
            throw runtime_error("Database version mismatch. Check oned.log.");
        }

        rc = 0;

        if (local_bootstrap)
        {
            NebulaLog::log("ONE",Log::INFO,
                    "Bootstrapping OpenNebula database, stage 1.");

            rc += VirtualMachinePool::bootstrap(db);
            rc += HostPool::bootstrap(db);
            rc += VirtualNetworkPool::bootstrap(db);
            rc += ImagePool::bootstrap(db);
            rc += VMTemplatePool::bootstrap(db);
            rc += DatastorePool::bootstrap(db);
            rc += ClusterPool::bootstrap(db);
            rc += DocumentPool::bootstrap(db);
            rc += UserQuotas::bootstrap(db);
            rc += GroupQuotas::bootstrap(db);
            rc += SecurityGroupPool::bootstrap(db);
            rc += VirtualRouterPool::bootstrap(db);

            // Create the system tables only if bootstrap went well
            if (rc == 0)
            {
                rc += system_db->local_bootstrap();
            }

            // Insert default system attributes
            rc += default_user_quota.insert();
            rc += default_group_quota.insert();
        }

        if (shared_bootstrap)
        {
            NebulaLog::log("ONE",Log::INFO,
                    "Bootstrapping OpenNebula database, stage 2.");

            rc += GroupPool::bootstrap(db);
            rc += UserPool::bootstrap(db);
            rc += AclManager::bootstrap(db);
            rc += ZonePool::bootstrap(db);
            rc += VdcPool::bootstrap(db);
            rc += MarketPlacePool::bootstrap(db);
            rc += MarketPlaceAppPool::bootstrap(db);

            // Create the system tables only if bootstrap went well
            if ( rc == 0 )
            {
                rc += system_db->shared_bootstrap();
            }
        }

        if ( rc != 0 )
        {
            throw runtime_error("Error bootstrapping database.");
        }
    }
    catch (exception&)
    {
        throw;
    }

    if (bootstrap_only)
    {
        //XML Library
        xmlCleanupParser();

        NebulaLog::log("ONE", Log::INFO, "Database bootstrap finalized, exiting.\n");

        return;
    }

    // -----------------------------------------------------------
    // Close stds, we no longer need them
    // -----------------------------------------------------------
    if (NebulaLog::log_type() != NebulaLog::STD )
    {
        fd = open("/dev/null", O_RDWR);

        dup2(fd,0);
        dup2(fd,1);
        dup2(fd,2);

        close(fd);

        fcntl(0, F_SETFD, 0); // Keep them open across exec funcs
        fcntl(1, F_SETFD, 0);
        fcntl(2, F_SETFD, 0);
    }
    else
    {
        fcntl(0, F_SETFD, FD_CLOEXEC);
        fcntl(1, F_SETFD, FD_CLOEXEC);
        fcntl(2, F_SETFD, FD_CLOEXEC);
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

    time_t timer_period;
    time_t monitor_period;

    nebula_configuration->get("MANAGER_TIMER", timer_period);
    nebula_configuration->get("MONITORING_INTERVAL", monitor_period);

    // ---- ACL Manager ----
    try
    {
        aclm = new AclManager(db, zone_id, is_federation_slave(), timer_period);
    }
    catch (bad_alloc&)
    {
        throw;
    }

    rc = aclm->start();

    if ( rc != 0 )
    {
       throw runtime_error("Could not start the ACL Manager");
    }

    // -----------------------------------------------------------
    // Pools
    // -----------------------------------------------------------
    try
    {
        int     size;

        string  mac_prefix;
        string  default_image_type;
        string  default_device_prefix;
        string  default_cdrom_device_prefix;

        time_t  expiration_time;
        time_t  vm_expiration;
        time_t  host_expiration;

        bool    vm_submit_on_hold;
        float   cpu_cost;
        float   mem_cost;
        float   disk_cost;

        vector<const VectorAttribute *> vm_hooks;
        vector<const VectorAttribute *> host_hooks;
        vector<const VectorAttribute *> vrouter_hooks;
        vector<const VectorAttribute *> vnet_hooks;
        vector<const VectorAttribute *> user_hooks;
        vector<const VectorAttribute *> group_hooks;
        vector<const VectorAttribute *> image_hooks;

        vector<const SingleAttribute *> vm_restricted_attrs;
        vector<const SingleAttribute *> img_restricted_attrs;
        vector<const SingleAttribute *> vnet_restricted_attrs;

        vector<const SingleAttribute *> inherit_image_attrs;
        vector<const SingleAttribute *> inherit_datastore_attrs;
        vector<const SingleAttribute *> inherit_vnet_attrs;

        vector<const VectorAttribute *> default_cost;

        clpool  = new ClusterPool(db);
        docpool = new DocumentPool(db);
        zonepool= new ZonePool(db, is_federation_slave());
        vdcpool = new VdcPool(db, is_federation_slave());

        nebula_configuration->get("VM_HOOK",      vm_hooks);
        nebula_configuration->get("HOST_HOOK",    host_hooks);
        nebula_configuration->get("VROUTER_HOOK", vrouter_hooks);
        nebula_configuration->get("VNET_HOOK",    vnet_hooks);
        nebula_configuration->get("USER_HOOK",    user_hooks);
        nebula_configuration->get("GROUP_HOOK",   group_hooks);
        nebula_configuration->get("IMAGE_HOOK",   image_hooks);

        nebula_configuration->get("VM_RESTRICTED_ATTR", vm_restricted_attrs);
        nebula_configuration->get("IMAGE_RESTRICTED_ATTR", img_restricted_attrs);
        nebula_configuration->get("VNET_RESTRICTED_ATTR", vnet_restricted_attrs);

        nebula_configuration->get("INHERIT_IMAGE_ATTR", inherit_image_attrs);
        nebula_configuration->get("INHERIT_DATASTORE_ATTR", inherit_datastore_attrs);
        nebula_configuration->get("INHERIT_VNET_ATTR", inherit_vnet_attrs);

        nebula_configuration->get("VM_MONITORING_EXPIRATION_TIME",vm_expiration);
        nebula_configuration->get("HOST_MONITORING_EXPIRATION_TIME",host_expiration);

        nebula_configuration->get("VM_SUBMIT_ON_HOLD",vm_submit_on_hold);

        rc = nebula_configuration->get("DEFAULT_COST", default_cost);

        cpu_cost = 0;
        mem_cost = 0;
        disk_cost= 0;

        if (rc != 0)
        {
            const VectorAttribute * vatt = static_cast<const VectorAttribute *>
                                              (default_cost[0]);

            rc = vatt->vector_value("CPU_COST", cpu_cost);

            if (rc != 0)
            {
                cpu_cost = 0;
            }

            rc = vatt->vector_value("MEMORY_COST", mem_cost);

            if (rc != 0)
            {
                mem_cost = 0;
            }


            rc = vatt->vector_value("DISK_COST", disk_cost);

            if (rc != 0)
            {
                disk_cost = 0;
            }
        }

        vmpool = new VirtualMachinePool(db,
                                        vm_hooks,
                                        hook_location,
                                        remotes_location,
                                        vm_restricted_attrs,
                                        vm_expiration,
                                        vm_submit_on_hold,
                                        cpu_cost,
                                        mem_cost,
                                        disk_cost);

        hpool  = new HostPool(db,
                              host_hooks,
                              hook_location,
                              remotes_location,
                              host_expiration);

        vrouterpool = new VirtualRouterPool(db,
                                            vrouter_hooks,
                                            remotes_location);

        nebula_configuration->get("MAC_PREFIX", mac_prefix);
        nebula_configuration->get("NETWORK_SIZE", size);

        vnpool = new VirtualNetworkPool(db,
                                        mac_prefix,
                                        size,
                                        vnet_restricted_attrs,
                                        vnet_hooks,
                                        remotes_location,
                                        inherit_vnet_attrs);

        gpool  = new GroupPool(db, group_hooks,
                            remotes_location, is_federation_slave());

        nebula_configuration->get("SESSION_EXPIRATION_TIME", expiration_time);

        upool = new UserPool(db, expiration_time, user_hooks,
                            remotes_location, is_federation_slave());

        nebula_configuration->get("DEFAULT_IMAGE_TYPE", default_image_type);
        nebula_configuration->get("DEFAULT_DEVICE_PREFIX",
                                  default_device_prefix);
        nebula_configuration->get("DEFAULT_CDROM_DEVICE_PREFIX",
                                  default_cdrom_device_prefix);
        ipool  = new ImagePool(db,
                               default_image_type,
                               default_device_prefix,
                               default_cdrom_device_prefix,
                               img_restricted_attrs,
                               image_hooks,
                               remotes_location,
                               inherit_image_attrs);

        tpool  = new VMTemplatePool(db);

        dspool = new DatastorePool(db, inherit_datastore_attrs);

        default_user_quota.select();
        default_group_quota.select();

        secgrouppool = new SecurityGroupPool(db);

        marketpool  = new MarketPlacePool(db, is_federation_slave());
        apppool     = new MarketPlaceAppPool(db, is_federation_slave());
    }
    catch (exception&)
    {
        throw runtime_error("Error Initializing OpenNebula pools");
    }

    // ---- XMLRPC Client for federation slaves ----
    if (is_federation_slave())
    {
        long long msg_size;

        get_configuration_attribute("MESSAGE_SIZE", msg_size);

        Client::initialize("", get_master_oned(), msg_size);
    }

    // ---- Virtual Machine Manager ----
    try
    {
        vector<const VectorAttribute *> vmm_mads;
        int    vm_limit;

        bool   do_poll;
        time_t poll_period = 0;

        nebula_configuration->get("VM_PER_INTERVAL", vm_limit);

        nebula_configuration->get("VM_MAD", vmm_mads);

        nebula_configuration->get("VM_INDIVIDUAL_MONITORING", do_poll);

        poll_period = monitor_period * 2.5;

        vmm = new VirtualMachineManager(
            timer_period,
            poll_period,
            do_poll,
            vm_limit,
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
        lcm = new LifeCycleManager();
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
        vector<const VectorAttribute *> im_mads;

        int host_limit;
        int monitor_threads;

        nebula_configuration->get("HOST_PER_INTERVAL", host_limit);

        nebula_configuration->get("MONITORING_THREADS", monitor_threads);

        nebula_configuration->get("IM_MAD", im_mads);

        im = new InformationManager(hpool,
                                    clpool,
                                    timer_period,
                                    monitor_period,
                                    host_limit,
                                    monitor_threads,
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
        vector<const VectorAttribute *> tm_mads;

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
        dm = new DispatchManager();
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

    // ---- Hook Manager ----
    try
    {
        vector<const VectorAttribute *> hm_mads;

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
        vector<const VectorAttribute *> auth_mads;

        nebula_configuration->get("AUTH_MAD", auth_mads);

        if (!auth_mads.empty())
        {
            authm = new AuthManager(timer_period, auth_mads);
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

    // ---- Image Manager ----
    try
    {
        vector<const VectorAttribute *> image_mads;

        nebula_configuration->get("DATASTORE_MAD", image_mads);

        imagem = new ImageManager(timer_period,
                                  monitor_period,
                                  ipool,
                                  dspool,
                                  image_mads);
    }
    catch (bad_alloc&)
    {
        throw;
    }

    rc = imagem->start();

    if ( rc != 0 )
    {
       throw runtime_error("Could not start the Image Manager");
    }

    // ---- Marketplace Manager ----
    try
    {
        vector<const VectorAttribute *> mmads ;

        nebula_configuration->get("MARKET_MAD", mmads);

        marketm = new MarketPlaceManager(timer_period, monitor_period, mmads);
    }
    catch (bad_alloc&)
    {
        throw;
    }

    rc = marketm->start();

    if ( rc != 0 )
    {
       throw runtime_error("Could not start the Marketplace Manager");
    }

    // -----------------------------------------------------------
    // Load mads
    // -----------------------------------------------------------

    sleep(1);

    rc = 0;

    if (vmm->load_mads(0) != 0)
    {
        goto error_mad;
    }

    if (im->load_mads(0) != 0)
    {
        goto error_mad;
    }

    if (tm->load_mads(0) != 0)
    {
        goto error_mad;
    }

    if (hm->load_mads(0) != 0)
    {
        goto error_mad;
    }

    if (imagem->load_mads(0) != 0)
    {
        goto error_mad;
    }

    if (marketm->load_mads(0) != 0)
    {
        goto error_mad;
    }

    if ( authm != 0 )
    {
        if (authm->load_mads(0) != 0)
        {
            goto error_mad;
        }
    }

    // ---- Request Manager ----
    try
    {
        int  rm_port = 0;
        int  max_conn;
        int  max_conn_backlog;
        int  keepalive_timeout;
        int  keepalive_max_conn;
        int  timeout;
        bool rpc_log;
        string log_call_format;
        string rpc_filename = "";
        int  message_size;
        string rm_listen_address = "0.0.0.0";

        nebula_configuration->get("PORT", rm_port);
        nebula_configuration->get("LISTEN_ADDRESS", rm_listen_address);
        nebula_configuration->get("MAX_CONN", max_conn);
        nebula_configuration->get("MAX_CONN_BACKLOG", max_conn_backlog);
        nebula_configuration->get("KEEPALIVE_TIMEOUT", keepalive_timeout);
        nebula_configuration->get("KEEPALIVE_MAX_CONN", keepalive_max_conn);
        nebula_configuration->get("TIMEOUT", timeout);
        nebula_configuration->get("RPC_LOG", rpc_log);
        nebula_configuration->get("LOG_CALL_FORMAT", log_call_format);
        nebula_configuration->get("MESSAGE_SIZE", message_size);

        if (rpc_log)
        {
            rpc_filename = log_location + "one_xmlrpc.log";
        }

        rm = new RequestManager(rm_port, max_conn, max_conn_backlog,
            keepalive_timeout, keepalive_max_conn, timeout, rpc_filename,
            log_call_format, rm_listen_address, message_size);
    }
    catch (bad_alloc&)
    {
        NebulaLog::log("ONE", Log::ERROR, "Error starting RM");
        throw;
    }


    // ---- Initialize Manager cross-reference pointers and pool references ----

    dm->init_managers();

    lcm->init_managers();

    marketm->init_managers();

    // ---- Start the Request Manager ----

    rc = rm->start();

    if ( rc != 0 )
    {
       throw runtime_error("Could not start the Request Manager");
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
    imagem->finalize();
    marketm->finalize();
    aclm->finalize();

    //sleep to wait drivers???

    pthread_join(vmm->get_thread_id(),0);
    pthread_join(lcm->get_thread_id(),0);
    pthread_join(tm->get_thread_id(),0);
    pthread_join(dm->get_thread_id(),0);

    pthread_join(im->get_thread_id(),0);
    pthread_join(rm->get_thread_id(),0);
    pthread_join(hm->get_thread_id(),0);
    pthread_join(imagem->get_thread_id(),0);

    if(is_federation_slave())
    {
        pthread_join(aclm->get_thread_id(),0);
    }

    //XML Library
    xmlCleanupParser();

    NebulaLog::log("ONE", Log::INFO, "All modules finalized, exiting.\n");

    return;

error_mad:
    NebulaLog::log("ONE", Log::ERROR, "Could not load driver");
    throw runtime_error("Could not load an OpenNebula driver");
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Log::MessageType Nebula::get_debug_level() const
{
    Log::MessageType clevel = Log::ERROR;
    int              log_level_int;

    const VectorAttribute * log = nebula_configuration->get("LOG");

    if ( log != 0 )
    {
        string value = log->vector_value("DEBUG_LEVEL");

        log_level_int = atoi(value.c_str());

        if ( Log::ERROR <= log_level_int && log_level_int <= Log::DDDEBUG )
        {
            clevel = static_cast<Log::MessageType>(log_level_int);
        }
    }

    return clevel;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

NebulaLog::LogType Nebula::get_log_system() const
{
    NebulaLog::LogType log_system = NebulaLog::UNDEFINED;

    const VectorAttribute * log = nebula_configuration->get("LOG");

    if ( log != 0 )
    {
        string value = log->vector_value("SYSTEM");
        log_system   = NebulaLog::str_to_type(value);
    }

    return log_system;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Nebula::get_ds_location(int cluster_id, string& dsloc)
{
    if ( cluster_id != -1 )
    {
        Cluster * cluster = clpool->get(cluster_id, true);

        if ( cluster == 0 )
        {
            return -1;
        }

        cluster->get_ds_location(dsloc);

        cluster->unlock();
    }
    else
    {
        get_configuration_attribute("DATASTORE_LOCATION", dsloc);
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string Nebula::get_vm_log_filename(int oid)
{
    ostringstream oss;

    if (nebula_location == "/")
    {
        oss << log_location << oid << ".log";
    }
    else
    {
        oss << vms_location << oid << "/vm.log";
    }

    return oss.str();
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Nebula::get_conf_attribute(
    const std::string& key,
    const std::string& name,
    const VectorAttribute* &value) const
{
    std::vector<const VectorAttribute*>::const_iterator it;
    std::vector<const VectorAttribute*> values;
    std::string template_name;
    std::string name_upper;

    nebula_configuration->get(key, values);

    for (it = values.begin(); it != values.end(); it ++)
    {
        value         = *it;
        template_name = (*it)->vector_value("NAME");
        name_upper    = name;

        one_util::toupper(name_upper);
        one_util::toupper(template_name);

        if ( template_name == name_upper)
        {
            return 0;
        }
    }

    value = 0;
    return -1;
};

