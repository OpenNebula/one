/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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
#include "LogDB.h"
#include "SystemDB.h"

#include "BackupJobPool.h"
#include "ClusterPool.h"
#include "DatastorePool.h"
#include "DocumentPool.h"
#include "GroupPool.h"
#include "HookPool.h"
#include "HostPool.h"
#include "ImagePool.h"
#include "MarketPlacePool.h"
#include "MarketPlaceAppPool.h"
#include "ScheduledActionPool.h"
#include "SecurityGroupPool.h"
#include "UserPool.h"
#include "VdcPool.h"
#include "VirtualMachinePool.h"
#include "VirtualNetworkPool.h"
#include "VirtualRouterPool.h"
#include "VMGroupPool.h"
#include "VMTemplatePool.h"
#include "VNTemplatePool.h"
#include "ZonePool.h"

#include "AclManager.h"
#include "AuthManager.h"
#include "DispatchManager.h"
#include "FedReplicaManager.h"
#include "HookManager.h"
#include "HookLog.h"
#include "ImageManager.h"
#include "InformationManager.h"
#include "IPAMManager.h"
#include "LifeCycleManager.h"
#include "MarketPlaceManager.h"
#include "RaftManager.h"
#include "RequestManager.h"
#include "ScheduledActionManager.h"
#include "TransferManager.h"
#include "VirtualMachineManager.h"

#include <stdlib.h>
#include <stdexcept>
#include <libxml/parser.h>

#include <signal.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netdb.h>
#include <sys/stat.h>
#include <pthread.h>

#ifdef SYSTEMD
#include <systemd/sd-daemon.h>
#endif

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Nebula::~Nebula()
{
    delete vmpool;
    delete vnpool;
    delete hpool;
    delete upool;
    delete ipool;
    delete gpool;
    delete tpool;
    delete dspool;
    delete clpool;
    delete docpool;
    delete zonepool;
    delete secgrouppool;
    delete vdcpool;
    delete vrouterpool;
    delete marketpool;
    delete apppool;
    delete vmgrouppool;
    delete vmm;
    delete lcm;
    delete im;
    delete tm;
    delete dm;
    delete rm;
    delete hm;
    delete hl;
    delete authm;
    delete aclm;
    delete imagem;
    delete marketm;
    delete ipamm;
    delete raftm;
    delete frm;
    delete sam;
    delete logdb;
    delete fed_logdb;
    delete system_db;
    delete vntpool;
    delete hkpool;
    delete bjpool;
    delete sapool;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Nebula::start(bool bootstrap_only)
{
    int      rc;
    int      fd;
    sigset_t mask;
    int      signal;
    string   scripts_remote_dir;
    SqlDB *  db_backend;
    bool     solo;

    SqlDB *  db_ptr;

    // -----------------------------------------------------------
    // Configuration
    // -----------------------------------------------------------

    config = make_unique<OpenNebulaTemplate>(etc_location, var_location);
    nebula_configuration = static_cast<OpenNebulaTemplate*>(config.get());

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

    // -----------------------------------------------------------
    // Get Hostname
    // -----------------------------------------------------------
    nebula_configuration->get("HOSTNAME", hostname);

    if ( hostname.empty() )
    {
        char   hn[1024];
        struct addrinfo hints = {}, *addrs;

        hints.ai_family   = AF_UNSPEC;
        hints.ai_flags    = AI_CANONNAME;

        rc = gethostname(hn, 1023);

        if ( rc != 0 )
        {
            throw runtime_error("Error getting hostname" +
                                std::string(strerror(rc)));
        }

        rc = getaddrinfo(hn, nullptr, &hints, &addrs);

        if ( rc != 0 )
        {
            throw runtime_error("Error getting hostname: " +
                                std::string(gai_strerror(rc)));
        }

        if ( addrs != nullptr && addrs->ai_canonname != nullptr )
        {
            hostname = addrs->ai_canonname;
        }

        freeaddrinfo(addrs);
    }

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
                                       ios_base::ate,
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

        NebulaLog::log("ONE", Log::INFO, os);

        os.str("");
        os << "Log level:" << clevel << " [0=ERROR,1=WARNING,2=INFO,3=DEBUG,4=DDEBUG,5=DDDEBUG]";

        NebulaLog::log("ONE", Log::INFO, os);

        os.str("");
        os << "Support for xmlrpc-c > 1.31: ";

#ifdef OLD_XMLRPC
        os << "no. MAX_CONN and MAX_CONN_BACKLOG configuration will not be used";
#else
        os << "yes";
#endif

        NebulaLog::log("ONE", Log::INFO, os);
    }
    catch(runtime_error&)
    {
        throw;
    }

    NebulaLog::log("ONE", Log::INFO, "Using hostname: " + hostname);

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
    const VectorAttribute * vatt = nebula_configuration->get("FEDERATION");

    string mode = "STANDALONE";

    if (vatt != 0)
    {
        master_oned = vatt->vector_value("MASTER_ONED");
        mode = vatt->vector_value("MODE");

        one_util::toupper(mode);

        if (mode == "STANDALONE")
        {
            federation_enabled = false;
            federation_master  = false;

            cache = false;
            zone_id = 0;
        }
        else if (mode == "MASTER")
        {
            federation_enabled = true;
            federation_master  = true;

            cache = false;
        }
        else if (mode == "SLAVE")
        {
            federation_enabled = true;
            federation_master  = false;

            cache = false;

            if ( master_oned.empty() )
            {
                throw runtime_error("MASTER_ONED endpoint is missing.");
            }
        }
        else if (mode == "CACHE")
        {
            federation_enabled = false;
            federation_master  = false;

            cache = true;

            if ( master_oned.empty() )
            {
                throw runtime_error("MASTER_ONED is missing.");
            }
        }
        else
        {
            throw runtime_error(
                    "FEDERATION MODE must be one of STANDALONE, MASTER, SLAVE or CACHE.");
        }

        if (federation_enabled)
        {
            rc = vatt->vector_value("ZONE_ID", zone_id);

            if (rc != 0)
            {
                throw runtime_error("FEDERATION ZONE_ID must be set for "
                                    "federated instances.");
            }
        }

        if ( vatt->vector_value("SERVER_ID", server_id) != 0 )
        {
            server_id = -1;
        }
    }

    vatt = nebula_configuration->get("RAFT");

    long long election_ms;
    long long bcast_ms;

    time_t xmlrpc_ms;
    time_t log_purge;

    unsigned int log_retention;
    unsigned int limit_purge;

    vatt->vector_value("LOG_PURGE_TIMEOUT", log_purge);
    vatt->vector_value("ELECTION_TIMEOUT_MS", election_ms);
    vatt->vector_value("BROADCAST_TIMEOUT_MS", bcast_ms);
    vatt->vector_value("XMLRPC_TIMEOUT_MS", xmlrpc_ms);
    vatt->vector_value("LOG_RETENTION", log_retention);
    vatt->vector_value("LIMIT_PURGE", limit_purge);

    Log::set_zone_id(zone_id);

    // -----------------------------------------------------------
    // Database
    // -----------------------------------------------------------
    try
    {
        string server;
        int    port;
        string user;
        string passwd;
        string db_name;
        string encoding;
        string compare_binary;
        int    timeout;
        int    connections;
        int    errors_limit;

        const VectorAttribute * _db = nebula_configuration->get("DB");

        if ( _db != 0 )
        {
            db_backend_type = _db->vector_value("BACKEND");

            _db->vector_value<string>("SERVER", server, "localhost");
            _db->vector_value("PORT", port, 0);
            _db->vector_value<string>("USER", user, "oneadmin");
            _db->vector_value<string>("PASSWD", passwd, "oneadmin");
            _db->vector_value<string>("DB_NAME", db_name, "opennebula");
            _db->vector_value<string>("ENCODING", encoding, "");
            _db->vector_value<string>("COMPARE_BINARY", compare_binary, "NO");
            _db->vector_value("TIMEOUT", timeout, 2500);
            _db->vector_value("CONNECTIONS", connections, 25);
            _db->vector_value("ERRORS_LIMIT", errors_limit, 25);
        }

        if ( db_backend_type == "sqlite" )
        {
            db_backend = new SqliteDB(var_location + "one.db", timeout);
        }
        else if ( db_backend_type == "mysql" )
        {
            db_backend = new MySqlDB(server, port, user, passwd, db_name,
                                     encoding, connections, compare_binary);
        }
        else
        {
            throw runtime_error("DB BACKEND must be sqlite or mysql.");
        }

        // ---------------------------------------------------------------------
        // Check Database Versions
        // ---------------------------------------------------------------------
        bool local_bootstrap;
        bool shared_bootstrap;

        NebulaLog::log("ONE", Log::INFO, "Checking database version.");

        SystemDB sysdb(db_backend);

        rc = sysdb.check_db_version(is_federation_slave(), local_bootstrap,
                                    shared_bootstrap);

        if ( rc == -1 )
        {
            throw runtime_error("Database version mismatch. Check oned.log.");
        }

        if ((local_bootstrap || shared_bootstrap) && (mode != "STANDALONE"))
        {
            throw runtime_error("Database has to be bootstraped to start"
                                " oned in FEDERATION");
        }

        // ---------------------------------------------------------------------
        // Initialize logging and federation database facilities and SystemDB
        // ---------------------------------------------------------------------
        solo = server_id == -1;

        if  (!solo)
        {
            db_backend->set_errors_limit(errors_limit);
        }

        if ( (solo && local_bootstrap) || bootstrap_only)
        {
            if (cache)
            {
                throw runtime_error("Error getting database. An existing database is needed for CACHE mode.");
            }
            if ( LogDB::bootstrap(db_backend) != 0 )
            {
                throw runtime_error("Error bootstrapping database.");
            }
        }

        logdb = new LogDB(db_backend, solo, cache, log_retention, limit_purge);

        if ( federation_master )
        {
            fed_logdb = new FedLogDB(logdb);
            db_ptr    = fed_logdb;
        }
        else
        {
            db_ptr = logdb;
        }

        system_db = new SystemDB(logdb);

        // ---------------------------------------------------------------------
        // DB Bootstraping
        // ---------------------------------------------------------------------
        rc = 0;

        if ( (local_bootstrap || shared_bootstrap) && !solo )
        {
            throw runtime_error("Database has to be bootstraped to start"
                                " oned in HA");
        }

        if (local_bootstrap)
        {
            NebulaLog::log("ONE", Log::INFO,
                           "Bootstrapping OpenNebula database, stage 1.");

            rc += VirtualMachinePool::bootstrap(logdb);
            rc += HostPool::bootstrap(logdb);
            rc += VirtualNetworkPool::bootstrap(logdb);
            rc += ImagePool::bootstrap(logdb);
            rc += VMTemplatePool::bootstrap(logdb);
            rc += DatastorePool::bootstrap(logdb);
            rc += ClusterPool::bootstrap(logdb);
            rc += DocumentPool::bootstrap(logdb);
            rc += UserQuotas::bootstrap(logdb);
            rc += GroupQuotas::bootstrap(logdb);
            rc += SecurityGroupPool::bootstrap(logdb);
            rc += VirtualRouterPool::bootstrap(logdb);
            rc += VMGroupPool::bootstrap(logdb);
            rc += VNTemplatePool::bootstrap(logdb);
            rc += HookPool::bootstrap(logdb);
            rc += HookLog::bootstrap(logdb);
            rc += BackupJobPool::bootstrap(logdb);
            rc += ScheduledActionPool::bootstrap(logdb);

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
            NebulaLog::log("ONE", Log::INFO,
                           "Bootstrapping OpenNebula database, stage 2.");

            rc += GroupPool::bootstrap(logdb);
            rc += UserPool::bootstrap(logdb);
            rc += AclManager::bootstrap(logdb);
            rc += ZonePool::bootstrap(logdb);
            rc += VdcPool::bootstrap(logdb);
            rc += MarketPlacePool::bootstrap(logdb);
            rc += MarketPlaceAppPool::bootstrap(logdb);

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

        NebulaLog::log("ONE", Log::INFO,
                       "Database bootstrap finalized, exiting.\n");
        return;
    }

    // -----------------------------------------------------------
    // Close stds, we no longer need them
    // -----------------------------------------------------------
    if (NebulaLog::log_type() != NebulaLog::STD )
    {
        fd = open("/dev/null", O_RDWR);

        dup2(fd, 0);
        dup2(fd, 1);
        dup2(fd, 2);

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

    ssl_util::SSLMutex::initialize();

    // -----------------------------------------------------------
    // Generic Quotas
    // -----------------------------------------------------------
    {
        vector<const SingleAttribute *> qouta_vm_attrs;

        nebula_configuration->get("QUOTA_VM_ATTRIBUTE", qouta_vm_attrs);

        for (const auto* quota : qouta_vm_attrs)
        {
            if (QuotaVirtualMachine::add_metric_generic(quota->value()) != 0)
            {
                NebulaLog::warn("ONE",
                                "Duplicated QUOTA_VM_ATTRIBUTE detected: " + quota->value());

                continue;
            }

            nebula_configuration->add("VM_RESTRICTED_ATTR", quota->value());
        }
    }

    // -----------------------------------------------------------
    //Managers
    // -----------------------------------------------------------

    time_t timer_period;
    time_t monitor_interval_datastore;
    time_t monitor_interval_market;

    nebula_configuration->get("MANAGER_TIMER", timer_period);
    nebula_configuration->get("MONITORING_INTERVAL_DATASTORE", monitor_interval_datastore);
    nebula_configuration->get("MONITORING_INTERVAL_MARKET", monitor_interval_market);

    // ---- ACL Manager ----
    try
    {
        aclm = new AclManager(db_ptr, zone_id, is_federation_slave(),
                              timer_period);
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

    try
    {
        /* -------------------------- Cluster Pool -------------------------- */
        const VectorAttribute * vnc_conf;
        vector<const SingleAttribute *> cluster_encrypted_attrs;

        nebula_configuration->get("CLUSTER_ENCRYPTED_ATTR", cluster_encrypted_attrs);

        vnc_conf = nebula_configuration->get("VNC_PORTS");

        clpool = new ClusterPool(logdb, vnc_conf, cluster_encrypted_attrs);

        /* --------------------- VirtualMachine Pool ------------------------ */
        vector<const SingleAttribute *> vm_restricted_attrs;
        vector<const SingleAttribute *> vm_encrypted_attrs;

        bool   vm_submit_on_hold;

        float cpu_cost;
        float mem_cost;
        float disk_cost;
        bool  showback_only_running;

        const VectorAttribute * default_cost;

        nebula_configuration->get("VM_RESTRICTED_ATTR", vm_restricted_attrs);

        nebula_configuration->get("VM_ENCRYPTED_ATTR", vm_encrypted_attrs);

        nebula_configuration->get("VM_SUBMIT_ON_HOLD", vm_submit_on_hold);

        default_cost = nebula_configuration->get("DEFAULT_COST");

        if (default_cost->vector_value("CPU_COST", cpu_cost) != 0)
        {
            cpu_cost = 0;
        }

        if (default_cost->vector_value("MEMORY_COST", mem_cost) != 0)
        {
            mem_cost = 0;
        }

        if (default_cost->vector_value("DISK_COST", disk_cost) != 0)
        {
            disk_cost = 0;
        }

        nebula_configuration->get("SHOWBACK_ONLY_RUNNING", showback_only_running);

        vmpool = new VirtualMachinePool(logdb, vm_restricted_attrs, vm_encrypted_attrs,
                                        vm_submit_on_hold, cpu_cost, mem_cost, disk_cost, showback_only_running);

        /* ---------------------------- Host Pool --------------------------- */
        vector<const SingleAttribute *> host_encrypted_attrs;

        nebula_configuration->get("HOST_ENCRYPTED_ATTR", host_encrypted_attrs);

        hpool  = new HostPool(logdb, host_encrypted_attrs);

        /* --------------------- VirtualRouter Pool ------------------------- */
        vrouterpool = new VirtualRouterPool(logdb);

        /* -------------------- VirtualNetwork Pool ------------------------- */
        unsigned long int size;
        string  mac_prefix;

        vector<const SingleAttribute *> inherit_vnet_attrs;
        vector<const SingleAttribute *> vnet_restricted_attrs;
        vector<const SingleAttribute *> vnet_encrypted_attrs;

        const VectorAttribute * vlan_id;
        const VectorAttribute * vxlan_id;

        nebula_configuration->get("MAC_PREFIX", mac_prefix);

        nebula_configuration->get("NETWORK_SIZE", size);

        nebula_configuration->get("VNET_RESTRICTED_ATTR", vnet_restricted_attrs);

        nebula_configuration->get("VNET_ENCRYPTED_ATTR", vnet_encrypted_attrs);

        nebula_configuration->get("INHERIT_VNET_ATTR", inherit_vnet_attrs);

        vlan_id  = nebula_configuration->get("VLAN_IDS");

        vxlan_id = nebula_configuration->get("VXLAN_IDS");

        vnpool = new VirtualNetworkPool(logdb, mac_prefix, size,
                                        vnet_restricted_attrs, vnet_encrypted_attrs, inherit_vnet_attrs,
                                        vlan_id, vxlan_id);

        /* ----------------------- Group/User Pool -------------------------- */
        vector<const SingleAttribute *> user_restricted;
        vector<const SingleAttribute *> group_restricted;
        vector<const SingleAttribute *> user_encrypted;

        time_t  expiration_time;

        nebula_configuration->get("GROUP_RESTRICTED_ATTR", group_restricted);

        gpool = new GroupPool(db_ptr, is_federation_slave(), group_restricted);

        nebula_configuration->get("SESSION_EXPIRATION_TIME", expiration_time);
        nebula_configuration->get("USER_RESTRICTED_ATTR", user_restricted);
        nebula_configuration->get("USER_ENCRYPTED_ATTR", user_encrypted);

        upool = new UserPool(db_ptr, expiration_time, is_federation_slave(),
                             user_restricted, user_encrypted);

        /* -------------------- Image/Datastore Pool ------------------------ */
        string  image_type;
        string  device_prefix;
        string  cd_dev_prefix;

        vector<const SingleAttribute *> img_restricted_attrs;

        vector<const SingleAttribute *> img_inherit_attrs;
        vector<const SingleAttribute *> ds_inherit_attrs;

        vector<const SingleAttribute *> ds_encrypted_attrs;
        vector<const SingleAttribute *> img_encrypted_attrs;

        nebula_configuration->get("DEFAULT_IMAGE_TYPE", image_type);
        nebula_configuration->get("DEFAULT_DEVICE_PREFIX", device_prefix);
        nebula_configuration->get("DEFAULT_CDROM_DEVICE_PREFIX", cd_dev_prefix);

        nebula_configuration->get("IMAGE_RESTRICTED_ATTR", img_restricted_attrs);

        nebula_configuration->get("INHERIT_IMAGE_ATTR", img_inherit_attrs);
        nebula_configuration->get("INHERIT_DATASTORE_ATTR", ds_inherit_attrs);

        nebula_configuration->get("DATASTORE_ENCRYPTED_ATTR", ds_encrypted_attrs);
        nebula_configuration->get("IMAGE_ENCRYPTED_ATTR", img_encrypted_attrs);

        ipool = new ImagePool(logdb, image_type, device_prefix, cd_dev_prefix,
                              img_restricted_attrs, img_encrypted_attrs, img_inherit_attrs);

        dspool = new DatastorePool(logdb, ds_inherit_attrs, ds_encrypted_attrs);

        /* ----- Document, Zone, VDC, VMTemplate, SG and Makerket Pools ----- */
        vector<const SingleAttribute *> doc_encrypted_attrs;

        nebula_configuration->get("DOCUMENT_ENCRYPTED_ATTR", doc_encrypted_attrs);

        docpool  = new DocumentPool(logdb, doc_encrypted_attrs);
        zonepool = new ZonePool(db_ptr, is_federation_slave());
        vdcpool  = new VdcPool(db_ptr, is_federation_slave());

        tpool = new VMTemplatePool(logdb);
        vntpool = new VNTemplatePool(logdb);

        secgrouppool = new SecurityGroupPool(logdb);

        marketpool = new MarketPlacePool(db_ptr, is_federation_slave());
        apppool    = new MarketPlaceAppPool(db_ptr);

        vmgrouppool = new VMGroupPool(logdb);

        hkpool = new HookPool(logdb);

        bjpool = new BackupJobPool(logdb);

        sapool = new ScheduledActionPool(logdb);

        default_user_quota.select();
        default_group_quota.select();

        update_zone_state();
    }
    catch (exception&)
    {
        throw runtime_error("Error Initializing OpenNebula pools");
    }

    // ---- XMLRPC Client for federation slaves ----
    if (is_federation_slave())
    {
        long long msg_size;

        unsigned int timeout;

        get_configuration_attribute("MESSAGE_SIZE", msg_size);

        get_configuration_attribute("TIMEOUT", timeout);

        Client::initialize("", get_master_oned(), msg_size, timeout);
    }

    // ---- Hook Manager and log----
    if (!cache)
    {
        vector<const VectorAttribute *> hm_mads;
        const VectorAttribute * hl_conf;

        nebula_configuration->get("HM_MAD", hm_mads);
        hl_conf = nebula_configuration->get("HOOK_LOG_CONF");

        hm = new HookManager(mad_location);
        hl = new HookLog(logdb, hl_conf);

        if (hm->load_drivers(hm_mads) != 0)
        {
            goto error_mad;
        }

        rc = hm->start();

        if ( rc != 0 )
        {
            throw runtime_error("Could not start the Hook Manager");
        }
    }

    // ---- Raft Manager ----
    const VectorAttribute * raft_leader_hook;
    const VectorAttribute * raft_follower_hook;

    raft_leader_hook   = nebula_configuration->get("RAFT_LEADER_HOOK");
    raft_follower_hook = nebula_configuration->get("RAFT_FOLLOWER_HOOK");

    try
    {
        raftm = new RaftManager(server_id, raft_leader_hook, raft_follower_hook,
                                log_purge, bcast_ms, election_ms, xmlrpc_ms, remotes_location);
    }
    catch (bad_alloc&)
    {
        throw;
    }

    // ---- FedReplica Manager ----
    if (!cache)
    {
        try
        {
            frm = new FedReplicaManager(logdb);
        }
        catch (bad_alloc&)
        {
            throw;
        }

        if ( is_federation_master() && solo )
        {
            // Replica threads are started on master in solo mode.
            // HA start/stop the replica threads on leader/follower states
            frm->start_replica_threads();
        }
    }

    // ---- Virtual Machine Manager ----
    if (!cache)
    {
        vector<const VectorAttribute *> vmm_mads;

        nebula_configuration->get("VM_MAD", vmm_mads);

        vmm = new VirtualMachineManager(mad_location);

        if (vmm->load_drivers(vmm_mads) != 0)
        {
            goto error_mad;
        }

        rc = vmm->start();

        if ( rc != 0 )
        {
            throw runtime_error("Could not start the Virtual Machine Manager");
        }
    }

    // ---- Life-cycle Manager ----
    if (!cache)
    {
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
    }

    // ---- Information Manager ----
    if (!cache)
    {
        vector<const VectorAttribute *> im_mads;

        nebula_configuration->get("IM_MAD", im_mads);

        im = new InformationManager(hpool, vmpool, mad_location);

        if (im->load_drivers(im_mads) != 0)
        {
            goto error_mad;
        }
    }

    // ---- Transfer Manager ----
    if (!cache)
    {
        vector<const VectorAttribute *> tm_mads;

        nebula_configuration->get("TM_MAD", tm_mads);

        tm = new TransferManager(vmpool, hpool, mad_location);

        if (tm->load_drivers(tm_mads) != 0)
        {
            goto error_mad;
        }

        rc = tm->start();

        if ( rc != 0 )
        {
            throw runtime_error("Could not start the Transfer Manager");
        }
    }

    // ---- Dispatch Manager ----
    if (!cache)
    {
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
    }

    // ---- Auth Manager ----
    {
        vector<const VectorAttribute *> auth_mads;

        nebula_configuration->get("AUTH_MAD", auth_mads);

        if (!auth_mads.empty())
        {
            authm = new AuthManager(timer_period, mad_location);

            if (authm->load_drivers(auth_mads) != 0)
            {
                goto error_mad;
            }

            rc = authm->start();

            if (rc != 0)
            {
                throw runtime_error("Could not start the Auth Manager");
            }
        }
        else
        {
            authm = 0; //Built-in authm/authz
        }
    }

    if (!cache)
    {
        // ---- Image Manager ----
        vector<const VectorAttribute *> image_mads;

        nebula_configuration->get("DATASTORE_MAD", image_mads);

        int monitor_vm_disk;
        nebula_configuration->get("DS_MONITOR_VM_DISK", monitor_vm_disk);

        imagem = new ImageManager(timer_period,
                                  monitor_interval_datastore,
                                  ipool,
                                  dspool,
                                  mad_location,
                                  monitor_vm_disk);

        if (imagem->load_drivers(image_mads) != 0)
        {
            goto error_mad;
        }

        rc = imagem->start();

        if ( rc != 0 )
        {
            throw runtime_error("Could not start the Image Manager");
        }
    }

    // ---- Marketplace Manager ----
    if (!cache)
    {
        vector<const VectorAttribute *> mmads;

        nebula_configuration->get("MARKET_MAD", mmads);

        marketm = new MarketPlaceManager(timer_period, monitor_interval_market,
                                         mad_location);

        if (marketm->load_drivers(mmads) != 0)
        {
            goto error_mad;
        }

        rc = marketm->start();

        if ( rc != 0 )
        {
            throw runtime_error("Could not start the Marketplace Manager");
        }
    }

    // ---- IPAM Manager ----
    if (!cache)
    {
        vector<const VectorAttribute *> ipam_mads;

        nebula_configuration->get("IPAM_MAD", ipam_mads);

        ipamm = new IPAMManager(timer_period, mad_location);

        if (ipamm->load_drivers(ipam_mads) != 0)
        {
            goto error_mad;
        }

        rc = ipamm->start();

        if ( rc != 0 )
        {
            throw runtime_error("Could not start the IPAM Manager");
        }
    }

    // ---- Scheduled Action Manager ----
    if (!cache)
    {
        int max_backups;
        int max_backups_host;
        nebula_configuration->get("MAX_BACKUPS", max_backups);
        nebula_configuration->get("MAX_BACKUPS_HOST", max_backups_host);

        // todo Read settings from Scheduler config file
        sam = new ScheduledActionManager(timer_period, max_backups, max_backups_host);
    }

    // -----------------------------------------------------------
    // Load mads
    // -----------------------------------------------------------

    usleep(2500000);

    rc = 0;

    // ---- Request Manager ----
    try
    {
        string rm_port;
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

    if (!cache)
    {
        dm->init_managers();

        lcm->init_managers();

        marketm->init_managers();

        // ---- Start the Request Manager & Information Manager----
        // This modules recevie request from users / monitor and need to be
        // started in last place when all systems are up

        if ( im->start() != 0 )
        {
            throw runtime_error("Could not start the Information Manager");
        }
    }

    if ( rm->start() != 0 )
    {
        throw runtime_error("Could not start the Request Manager");
    }

#ifdef SYSTEMD
    // ---- Notify service manager ----

    sd_notify(0, "READY=1");
#endif

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

    rm->finalize();

    raftm->finalize();

    if (!cache)
    {
        sam->finalize();

        vmm->finalize();
        lcm->finalize();

        tm->finalize();
        dm->finalize();

        im->finalize();
        hm->finalize();

        imagem->finalize();
        marketm->finalize();

        ipamm->finalize();

        //sleep to wait drivers???
        vmm->join_thread();
        lcm->join_thread();
        tm->join_thread();
        dm->join_thread();

        hm->join_thread();
        ipamm->join_thread();
    }

    aclm->finalize();

    authm->finalize();

    authm->join_thread();

    if (is_federation_slave())
    {
        aclm->join_thread();
    }


    //XML Library
    xmlCleanupParser();

    ssl_util::SSLMutex::finalize();

    NebulaLog::log("ONE", Log::INFO, "All modules finalized, exiting.\n");

    return;

error_mad:
    NebulaLog::log("ONE", Log::ERROR, "Could not load driver");
    throw runtime_error("Could not load an OpenNebula driver");
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Nebula::update_zone_state()
{
    if (auto zone = zonepool->get_ro(get_zone_id()))
    {
        set_zone_state(zone->get_state());
    }
    else
    {
        NebulaLog::warn("ONE", "Unable to find zone id: "
                        + to_string(get_zone_id()));
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Nebula::get_ds_location(string& dsloc) const
{
    get_configuration_attribute("DATASTORE_LOCATION", dsloc);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string Nebula::get_vm_log_filename(int oid) const
{
    ostringstream oss;
    bool use_vms_location = false;

    const VectorAttribute * log = nebula_configuration->get("LOG");

    if ( log != 0 )
    {
        log->vector_value("USE_VMS_LOCATION", use_vms_location);
    }

    if (nebula_location == "/" && ! use_vms_location)
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
    std::vector<const VectorAttribute*> values;

    nebula_configuration->get(key, values);

    for (auto vattr : values)
    {
        const string& template_name = vattr->vector_value("NAME");

        if ( one_util::icasecmp(name, template_name) )
        {
            value = vattr;
            return 0;
        }
    }

    value = nullptr;
    return -1;
};

