/* -------------------------------------------------------------------------- */
/* Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        */
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


// Pool control table
const char * SystemDB::pc_table = "pool_control";
const char * SystemDB::pc_names = "tablename, last_oid";

const char * SystemDB::pc_bootstrap = "CREATE TABLE pool_control "
    "(tablename VARCHAR(32) PRIMARY KEY, last_oid BIGINT UNSIGNED)";


// DB versioning table
const char * SystemDB::ver_table = "db_versioning";
const char * SystemDB::ver_names = "oid, version, timestamp, comment";

const char * SystemDB::ver_bootstrap = "CREATE TABLE db_versioning "
    "(oid INTEGER PRIMARY KEY, version VARCHAR(256), timestamp INTEGER, "
    "comment VARCHAR(256))";

// System attributes table
const char * SystemDB::sys_table = "system_attributes";
const char * SystemDB::sys_names = "name, body";

const char * SystemDB::sys_bootstrap =  "CREATE TABLE IF NOT EXISTS"
        " system_attributes (name VARCHAR(128) PRIMARY KEY, body MEDIUMTEXT)";

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SystemDB::bootstrap()
{
    int             rc;
    ostringstream   oss;

    // ------------------------------------------------------------------------
    // pool control, tracks the last ID's assigned to objects
    // ------------------------------------------------------------------------
    oss.str(pc_bootstrap);
    rc = db->exec(oss);

    // ------------------------------------------------------------------------
    // db versioning, version of OpenNebula. Insert this version number
    // ------------------------------------------------------------------------
    oss.str(ver_bootstrap);
    rc += db->exec(oss);

    oss.str("");
    oss << "INSERT INTO " << ver_table << " (" << ver_names << ") "
        << "VALUES (0, '" << Nebula::db_version() << "', " << time(0)
        << ", '" << Nebula::version() << " daemon bootstrap')";

    rc += db->exec(oss);

    // ------------------------------------------------------------------------
    // system , version of OpenNebula. Insert this version number
    // ------------------------------------------------------------------------
    oss.str(sys_bootstrap);
    rc += db->exec(oss);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SystemDB::select_cb(void *_loaded_db_version, int num, char **values,
                      char **names)
{
    istringstream   iss;
    string *        loaded_db_version;

    loaded_db_version = static_cast<string *>(_loaded_db_version);

    if ( (values[0]) && (num == 1) )
    {
        *loaded_db_version = values[0];
    }

    return 0;
};

/* -------------------------------------------------------------------------- */

int SystemDB::check_db_version()
{
    int             rc;
    ostringstream   oss;

    string loaded_db_version = "";

    // Try to read latest version
    set_callback( static_cast<Callbackable::Callback>(&SystemDB::select_cb),
                  static_cast<void *>(&loaded_db_version) );

    oss << "SELECT version FROM " << ver_table
        << " WHERE oid=(SELECT MAX(oid) FROM " << ver_table << ")";

    db->exec(oss, this);

    oss.str("");
    unset_callback();

    if( loaded_db_version == "" )
    {
        // Table user_pool is present for all OpenNebula versions, and it
        // always contains at least the oneadmin user.
        oss << "SELECT MAX(oid) FROM user_pool";
        rc = db->exec(oss);

        oss.str("");

        if( rc != 0 )   // Database needs bootstrap
        {
            return -2;
        }
    }

    if( Nebula::db_version() != loaded_db_version )
    {
        oss << "Database version mismatch. "
            << "Installed " << Nebula::version() << " uses DB version '"
            << Nebula::db_version() << "', and existing DB version is '"
            << loaded_db_version << "'.";

        NebulaLog::log("ONE",Log::ERROR,oss);
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SystemDB::insert_replace(
        const string& attr_name,
        const string& xml_attr,
        bool          replace,
        string&       err)
{
    ostringstream   oss;

    int    rc;
    char * sql_xml;

    sql_xml = db->escape_str(xml_attr.c_str());

    if ( sql_xml == 0 )
    {
        goto error_body;
    }

    if ( ObjectXML::validate_xml(sql_xml) != 0 )
    {
        goto error_xml;
    }

    if ( replace )
    {
        oss << "REPLACE";
    }
    else
    {
        oss << "INSERT";
    }

    // Construct the SQL statement to Insert or Replace

    oss <<" INTO "<< sys_table <<
    " ("<< sys_names <<") VALUES ("
        << "'" << attr_name << "',"
        << "'" << sql_xml   << "')";

    rc = db->exec(oss);

    db->free_str(sql_xml);

    return rc;

error_xml:
    db->free_str(sql_xml);

error_body:
    err = "Error inserting system attribute in DB.";
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int SystemDB::select_attr_cb(void *  _xml_attr,
                             int     num,
                             char ** values,
                             char ** names)
{
    istringstream   iss;
    string *        xml_attr;

    xml_attr = static_cast<string *>(_xml_attr);

    if ( (values[0]) && (num == 1) )
    {
        *xml_attr = values[0];
    }

    return 0;
};

/* -------------------------------------------------------------------------- */

int SystemDB::select_sys_attribute(const string& attr_name, string& attr_xml)
{
    ostringstream oss;

    int rc;

    set_callback(static_cast<Callbackable::Callback>(&SystemDB::select_attr_cb),
                 static_cast<void *>(&attr_xml) );

    oss << "SELECT body FROM " << sys_table << " WHERE name = '"
        << attr_name << "'";

    rc = db->exec(oss, this);

    unset_callback();

    if (rc != 0)
    {
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Nebula::start()
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
    }
    catch(runtime_error&)
    {
        throw;
    }

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

            db = new MySqlDB(server,port,user,passwd,db_name);

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

        // ---------------------------------------------------------------------
        // Prepare the SystemDB and check versions
        // ---------------------------------------------------------------------

        NebulaLog::log("ONE",Log::INFO,"Checking database version.");

        system_db = new SystemDB(db);

        rc = system_db->check_db_version();

        if( rc == -1 )
        {
            throw runtime_error("Database version mismatch.");
        }

        if( rc == -2 )
        {
            rc = 0;

            NebulaLog::log("ONE",Log::INFO,"Bootstrapping OpenNebula database.");

            rc += VirtualMachinePool::bootstrap(db);
            rc += HostPool::bootstrap(db);
            rc += VirtualNetworkPool::bootstrap(db);
            rc += GroupPool::bootstrap(db);
            rc += UserPool::bootstrap(db);
            rc += ImagePool::bootstrap(db);
            rc += VMTemplatePool::bootstrap(db);
            rc += AclManager::bootstrap(db);
            rc += DatastorePool::bootstrap(db);
            rc += ClusterPool::bootstrap(db);
            rc += DocumentPool::bootstrap(db);

            // Create the system tables only if bootstrap went well
            if ( rc == 0 )
            {
                rc += system_db->bootstrap();
            }

            // Insert default system attributes
            rc += default_user_quota.insert();
            rc += default_group_quota.insert();

            if ( rc != 0 )
            {
                throw runtime_error("Error bootstrapping database.");
            }
        }
    }
    catch (exception&)
    {
        throw;
    }

    try
    {
        int     size;

        string  mac_prefix;
        string  default_image_type;
        string  default_device_prefix;

        time_t  expiration_time;
        time_t  vm_expiration;
        time_t  host_expiration;

        bool    vm_submit_on_hold;

        vector<const Attribute *> vm_hooks;
        vector<const Attribute *> host_hooks;
        vector<const Attribute *> vnet_hooks;
        vector<const Attribute *> user_hooks;
        vector<const Attribute *> group_hooks;
        vector<const Attribute *> image_hooks;

        vector<const Attribute *> vm_restricted_attrs;
        vector<const Attribute *> img_restricted_attrs;

        clpool  = new ClusterPool(db);
        docpool = new DocumentPool(db);

        nebula_configuration->get("VM_HOOK", vm_hooks);
        nebula_configuration->get("HOST_HOOK",  host_hooks);
        nebula_configuration->get("VNET_HOOK",  vnet_hooks);
        nebula_configuration->get("USER_HOOK",  user_hooks);
        nebula_configuration->get("GROUP_HOOK", group_hooks);
        nebula_configuration->get("IMAGE_HOOK", image_hooks);

        nebula_configuration->get("VM_RESTRICTED_ATTR", vm_restricted_attrs);
        nebula_configuration->get("IMAGE_RESTRICTED_ATTR", img_restricted_attrs);

        nebula_configuration->get("VM_MONITORING_EXPIRATION_TIME",vm_expiration);
        nebula_configuration->get("HOST_MONITORING_EXPIRATION_TIME",host_expiration);

        nebula_configuration->get("VM_SUBMIT_ON_HOLD",vm_submit_on_hold);

        vmpool = new VirtualMachinePool(db,
                                        vm_hooks,
                                        hook_location,
                                        remotes_location,
                                        vm_restricted_attrs,
                                        vm_expiration,
                                        vm_submit_on_hold);
        hpool  = new HostPool(db,
                              host_hooks,
                              hook_location,
                              remotes_location,
                              host_expiration);

        nebula_configuration->get("MAC_PREFIX", mac_prefix);
        nebula_configuration->get("NETWORK_SIZE", size);

        vnpool = new VirtualNetworkPool(db,
                                        mac_prefix,
                                        size,
                                        vnet_hooks,
                                        remotes_location);

        gpool  = new GroupPool(db, group_hooks, remotes_location);

        nebula_configuration->get("SESSION_EXPIRATION_TIME", expiration_time);
        upool = new UserPool(db, expiration_time, user_hooks, remotes_location);

        nebula_configuration->get("DEFAULT_IMAGE_TYPE", default_image_type);
        nebula_configuration->get("DEFAULT_DEVICE_PREFIX",
                                  default_device_prefix);

        ipool  = new ImagePool(db,
                               default_image_type,
                               default_device_prefix,
                               img_restricted_attrs,
                               image_hooks,
                               remotes_location);

        tpool  = new VMTemplatePool(db);

        dspool = new DatastorePool(db);

        default_user_quota.select();
        default_group_quota.select();
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
    time_t monitor_period;

    nebula_configuration->get("MANAGER_TIMER", timer_period);
    nebula_configuration->get("MONITORING_INTERVAL", monitor_period);

    // ---- Virtual Machine Manager ----
    try
    {
        vector<const Attribute *> vmm_mads;
        int                       vm_limit;
        time_t                    poll_period;

        poll_period = monitor_period * 2.5;

        nebula_configuration->get("VM_PER_INTERVAL", vm_limit);

        nebula_configuration->get("VM_MAD", vmm_mads);

        vmm = new VirtualMachineManager(
            vmpool,
            hpool,
            timer_period,
            poll_period,
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
        int                         host_limit;

        nebula_configuration->get("HOST_PER_INTERVAL", host_limit);

        nebula_configuration->get("IM_MAD", im_mads);

        im = new InformationManager(hpool,
                                    timer_period,
                                    monitor_period,
                                    host_limit,
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

    // ---- ACL Manager ----
    try
    {
        aclm = new AclManager(db);
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

    // ---- Image Manager ----
    try
    {
        vector<const Attribute *> image_mads;

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

    // -----------------------------------------------------------
    // Load mads
    // -----------------------------------------------------------

    sleep(2);

    vmm->load_mads(0);

    im->load_mads(0);
    tm->load_mads(0);
    hm->load_mads(0);
    imagem->load_mads(0);

    if ( authm != 0 )
    {
        authm->load_mads(0);
    }

    // ---- Request Manager ----
    try
    {
        int             rm_port = 0;

        nebula_configuration->get("PORT", rm_port);

        rm = new RequestManager(rm_port, log_location + "one_xmlrpc.log");
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

    //sleep to wait drivers???

    pthread_join(vmm->get_thread_id(),0);
    pthread_join(lcm->get_thread_id(),0);
    pthread_join(tm->get_thread_id(),0);
    pthread_join(dm->get_thread_id(),0);

    pthread_join(im->get_thread_id(),0);
    pthread_join(rm->get_thread_id(),0);
    pthread_join(hm->get_thread_id(),0);
    pthread_join(imagem->get_thread_id(),0);

    //XML Library
    xmlCleanupParser();

    NebulaLog::log("ONE", Log::INFO, "All modules finalized, exiting.\n");
}

