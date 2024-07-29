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

#include "Monitor.h"
#include "MonitorDriver.h"
#include "MonitorConfigTemplate.h"
#include "OpenNebulaTemplate.h"
#include "NebulaLog.h"
#include "StreamManager.h"
#include "SqliteDB.h"
#include "MySqlDB.h"

#include <fcntl.h>
#include <unistd.h>
#include <signal.h>
#include "SSLUtil.h"

using namespace std;

void Monitor::start()
{
    // -------------------------------------------------------------------------
    // Configuration File
    // -------------------------------------------------------------------------
    OpenNebulaTemplate oned_config(get_defaults_location(), get_var_location(), oned_filename);

    if (oned_config.load_configuration() != 0)
    {
        throw runtime_error("Error reading oned configuration file " +
                            oned_filename);
    }

    config = make_unique<MonitorConfigTemplate>(get_defaults_location(),
                                                conf_filename);

    if (config->load_configuration() != 0)
    {
        throw runtime_error("Error reading monitor configuration file" +
                            conf_filename);
    }

    string datastore_location;
    if (oned_config.get("DATASTORE_LOCATION", datastore_location))
    {
        config->replace("DATASTORE_LOCATION", datastore_location);
    }

    // Log system
    NebulaLog::LogType log_system = get_log_system(NebulaLog::STD);
    Log::MessageType clevel       = get_debug_level(Log::WARNING);

    if (log_system != NebulaLog::UNDEFINED)
    {
        string log_file = get_log_location() + "monitor.log";
        NebulaLog::init_log_system(log_system,
                                   clevel,
                                   log_file.c_str(),
                                   ios_base::ate,
                                   "one_monitor");
    }
    else
    {
        throw runtime_error("Unknown LOG_SYSTEM.");
    }

    NebulaLog::info("MON", "Init Monitor Log system");

    ostringstream oss;
    oss << "Starting Monitor Daemon" << endl;
    oss << "----------------------------------------\n";
    oss << "       Monitor Configuration File       \n";
    oss << "----------------------------------------\n";
    oss << *config;
    oss << "----------------------------------------";

    NebulaLog::info("MON", oss.str());

    xmlInitParser();

    // -------------------------------------------------------------------------
    // Database
    // -------------------------------------------------------------------------
    const VectorAttribute * _db   = oned_config.get("DB");
    const VectorAttribute * _db_m = config->get("DB");

    std::string db_backend = _db->vector_value("BACKEND");

    if (db_backend == "sqlite")
    {
        int    timeout;
        _db->vector_value("TIMEOUT", timeout, 2500);

        sqlDB = make_unique<SqliteDB>(get_var_location() + "one.db", timeout);
    }
    else if ( db_backend == "mysql" )
    {
        string server;
        int    port;
        string user;
        string passwd;
        string db_name;
        string encoding;
        string compare_binary;
        int    connections;

        _db->vector_value<string>("SERVER", server, "localhost");
        _db->vector_value("PORT", port, 0);
        _db->vector_value<string>("USER", user, "oneadmin");
        _db->vector_value<string>("PASSWD", passwd, "oneadmin");
        _db->vector_value<string>("DB_NAME", db_name, "opennebula");
        _db->vector_value<string>("ENCODING", encoding, "");
        _db->vector_value<string>("COMPARE_BINARY", compare_binary, "NO");

        _db_m->vector_value("CONNECTIONS", connections, 15);

        sqlDB = make_unique<MySqlDB>(server, port, user, passwd, db_name,
                                     encoding, connections, compare_binary);
    }
    else
    {
        throw runtime_error("DB BACKEND must be sqlite or mysql.");
    }

    // -------------------------------------------------------------------------
    // Pools
    // -------------------------------------------------------------------------
    time_t host_exp;
    time_t vm_exp;

    config->get("HOST_MONITORING_EXPIRATION_TIME", host_exp);
    config->get("VM_MONITORING_EXPIRATION_TIME", vm_exp);

    hpool = make_unique<HostRPCPool>(sqlDB.get(), host_exp);
    vmpool = make_unique<VMRPCPool>(sqlDB.get(), vm_exp);

    // -------------------------------------------------------------------------
    // Close stds in drivers
    // -------------------------------------------------------------------------
    fcntl(0, F_SETFD, FD_CLOEXEC);
    fcntl(1, F_SETFD, FD_CLOEXEC);
    fcntl(2, F_SETFD, FD_CLOEXEC);

    ssl_util::SSLMutex::initialize();

    // -------------------------------------------------------------------------
    // Drivers
    // -------------------------------------------------------------------------
    std::string addr;
    unsigned int port;
    unsigned int threads;
    std::string pub_key;
    std::string pri_key;

    auto udp_conf = config->get("NETWORK");

    udp_conf->vector_value("ADDRESS", addr);
    udp_conf->vector_value("PORT", port);
    udp_conf->vector_value("THREADS", threads);
    udp_conf->vector_value("PUBKEY", pub_key);
    udp_conf->vector_value("PRIKEY", pri_key);

    vector<const VectorAttribute *> drivers_conf;

    config->get("IM_MAD", drivers_conf);

    int timer_period;
    int monitor_interval_host;
    config->get("MANAGER_TIMER", timer_period);
    config->get("MONITORING_INTERVAL_HOST", monitor_interval_host);

    ssl_util::init_rsa_keys(pub_key, pri_key);

    // Replace the PUBKEY with the content of the PUBKEY file
    ifstream f(pub_key);
    if (f.good())
    {
        stringstream buffer;
        buffer << f.rdbuf();
        udp_conf->replace("PUBKEY", buffer.str());
    }

    hm = make_unique<HostMonitorManager>(hpool.get(), vmpool.get(),
                                         addr, port, threads,
                                         get_mad_location(),
                                         timer_period,
                                         monitor_interval_host);

    if (hm->load_monitor_drivers(drivers_conf) != 0)
    {
        NebulaLog::error("MON", "Unable to load monitor drivers");
        return;
    }

    // -------------------------------------------------------------------------
    // Start Drivers
    // -------------------------------------------------------------------------
    std::string error;

    MonitorDriverProtocol::hm = hm.get();

    if (hm->start(error) == -1)
    {
        NebulaLog::error("MON", "Error starting monitor drivers: " + error);
        return;
    }

    xmlCleanupParser();

    ssl_util::SSLMutex::finalize();

    NebulaLog::info("MON", "All monitor drivers finalized, exiting");

    NebulaLog::finalize_log_system();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
