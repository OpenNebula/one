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
#include "NebulaLog.h"

#include "HostMonitorManager.h"
#include "Monitor.h"
#include "VMRPCPool.h"

#include "Driver.h"
#include "DriverManager.h"
#include "MonitorDriver.h"
#include "UDPMonitorDriver.h"
#include "TCPMonitorDriver.h"
#include "OneMonitorDriver.h"

#include <condition_variable>
#include <chrono>

using namespace std;

const time_t HostMonitorManager::monitor_expire = 300;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

HostMonitorManager::HostMonitorManager(
        HostRPCPool *      hp,
        VMRPCPool *        vmp,
        const std::string& addr,
        unsigned int       port,
        unsigned int       _threads,
        const std::string& driver_path,
        int                timer_period,
        int                monitor_interval_host)
    : driver_manager(make_unique<driver_manager_t>(driver_path))
    , udp_driver(make_unique<UDPMonitorDriver>(addr, port))
    , tcp_driver(make_unique<TCPMonitorDriver>(addr, port))
    , hpool(hp)
    , vmpool(vmp)
    , threads(_threads)
    , timer_period(timer_period)
    , monitor_interval_host(monitor_interval_host)
    , is_leader(false)
{
    oned_driver    = make_unique<OneMonitorDriver>(this);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

HostMonitorManager::~HostMonitorManager()
{
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostMonitorManager::load_monitor_drivers(
        const vector<const VectorAttribute*>& mads_config)
{
    return driver_manager->load_drivers(mads_config);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostMonitorManager::start(std::string& error)
{
    condition_variable end_cv;
    mutex end_mtx;
    bool  end = false;

    //Start Monitor drivers and associated listener threads
    if ( driver_manager->start(error) != 0 )
    {
        return -1;
    }

    //Start UDP & TCP listener threads
    if ( udp_driver->action_loop(threads, error) == -1 )
    {
        return -1;
    }

    if ( tcp_driver->action_loop(threads, error) == -1 )
    {
        return -1;
    }

    //Start the timer action thread
    thread timer_thr = thread([&, this]
    {
        unique_lock<mutex> end_lck(end_mtx);

        while(!end_cv.wait_for(end_lck, chrono::seconds(timer_period),
        [&]() {return end;}))
        {
            timer_action();
        }
    });

    //Wait for oned messages. FINALIZE will end the driver
    oned_driver->start_driver();

    //End timer thread
    {
        lock_guard<mutex> end_lck(end_mtx);
        end = true;
    }

    end_cv.notify_one();

    timer_thr.join();

    //End UDP & TCP listener threads
    udp_driver->stop();

    tcp_driver->stop();

    //End monitor drivers
    driver_manager->stop(driver_timeout);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostMonitorManager::update_host(int oid, const std::string &xml)
{
    auto host = hpool->get(oid);

    if (host.valid())
    {
        auto old_state = host->state();

        host->from_xml(xml);

        if (host->state() != old_state)
        {
            if (host->state() == Host::OFFLINE)
            {
                stop_host_monitor(host);
            }
            else if (old_state == Host::OFFLINE && !host->monitor_in_progress())
            {
                start_host_monitor(host);
            }

            // Reset last monitoring timestamps
            host->last_state_vm(0);
            host->last_monitor_vm(0);
            host->last_monitor_host(0);
            host->last_system_host(0);

            NebulaLog::debug("HMM", "Updated Host " + to_string(host->oid())
                             + ", state " + Host::state_to_str(host->state()));
        }
    }
    else
    {
        hpool->add_object(xml);

        host = hpool->get(oid);

        if (host->state() == Host::INIT)
        {
            start_host_monitor(host);
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostMonitorManager::delete_host(int oid)
{
    hpool->erase(oid);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostMonitorManager::start_host_monitor(int oid)
{
    auto host = hpool->get(oid);

    if (!host.valid())
    {
        NebulaLog::warn("HMM", "start_monitor: unknown host " + to_string(oid));
        return;
    }

    if (host->state() != Host::OFFLINE)
    {
        start_host_monitor(host);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostMonitorManager::stop_host_monitor(int oid)
{
    auto host = hpool->get(oid);

    if (!host.valid())
    {
        NebulaLog::warn("HMM", "stop_monitor: unknown host " + to_string(oid));
        return;
    }

    stop_host_monitor(host);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostMonitorManager::raft_status(const string& state)
{
    NebulaLog::info("HMM", "Raft status: " + state);

    is_leader = state == "LEADER" || state == "SOLO";
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostMonitorManager::monitor_host(int oid, const Template &tmpl)
{
    if (!is_leader)
    {
        return;
    }

    auto host = hpool->get(oid);

    if (!host.valid())
    {
        NebulaLog::warn("HMM", "monitor_host: unknown host " + to_string(oid));
        return;
    }

    if (host->state() == Host::OFFLINE)
    {
        // Host is offline, we shouldn't receive monitoring
        return;
    }


    HostMonitoringTemplate monitoring;

    monitoring.oid(oid);
    monitoring.timestamp(time(nullptr));

    if (monitoring.from_template(tmpl) != 0 || monitoring.oid() == -1)
    {
        string str;
        NebulaLog::log("HMM", Log::ERROR, "Error parsing host monitoring template: "
                       + tmpl.to_str(str));
        return;
    }

    if (hpool->update_monitoring(monitoring) != 0)
    {
        NebulaLog::log("HMM", Log::ERROR, "Unable to write monitoring to DB");
        return;
    };

    host->last_monitored(monitoring.timestamp());
    host->monitor_in_progress(false);

    NebulaLog::info("HMM", "Successfully monitored host: " + to_string(oid));
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostMonitorManager::update_last_monitor(int oid)
{
    if (!is_leader)
    {
        return;
    }

    auto host = hpool->get(oid);

    if (!host.valid())
    {
        NebulaLog::warn("HMM", "beacon_host: unknown host " + to_string(oid));
        return;
    }

    if (host->state() == Host::OFFLINE)
    {
        // Host is offline, we shouldn't receive monitoring
        return;
    }

    host->last_monitored(time(nullptr));
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostMonitorManager::monitor_vm(int oid,
                                    const Template &tmpl)
{
    if (!is_leader)
    {
        return;
    }

    VirtualMachineMonitorInfo monitoring(oid, time(nullptr));

    //Get previous monitor info to merge with new data
    if (vmpool->get_monitoring(oid, monitoring))
    {
        monitoring.timestamp(time(nullptr));
    }

    if (monitoring.from_template(tmpl) != 0)
    {
        string str;
        NebulaLog::log("HMM", Log::ERROR, "Error parsing VM monitoring: "
                       + tmpl.to_str(str));
        return;
    }

    if (vmpool->update_monitoring(monitoring) != 0)
    {
        NebulaLog::log("HMM", Log::ERROR, "Unable to write monitoring to DB");
        return;
    };

    NebulaLog::info("HMM", "Successfully monitored VM: " + to_string(oid));
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostMonitorManager::monitor_wild_vm(const string& deploy_id,
                                         const Template &tmpl)
{
    if (!is_leader)
    {
        return;
    }

    // Wild VM, check if it is imported to OpenNebula
    int oid = vmpool->get_vmid(deploy_id);

    if (oid < 0)
    {
        // Not imported VM, ignore monitoring
        return;
    }

    monitor_vm(oid, tmpl);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostMonitorManager::start_monitor_failure(int oid)
{
    if (!is_leader)
    {
        return;
    }

    NebulaLog::error("HMM", "Unable to monitor host id: " + to_string(oid));

    auto host = hpool->get(oid);

    if (!host.valid() || host->state() == Host::OFFLINE)
    {
        return;
    }

    host->monitor_in_progress(false);

    oned_driver->host_state(oid, Host::state_to_str(Host::ERROR));
}

/* -------------------------------------------------------------------------- */

void HostMonitorManager::start_monitor_success(int oid)
{
    if (!is_leader)
    {
        return;
    }

    NebulaLog::debug("HMM", "Start monitor success, host: " + to_string(oid));

    auto host = hpool->get(oid);

    if (!host.valid() || host->state() == Host::OFFLINE)
    {
        return;
    }

    host->last_monitored(time(nullptr));

    host->monitor_in_progress(false);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostMonitorManager::timer_action()
{
    static int mark = 0;
    static int tics = timer_period;

    mark += timer_period;
    tics += timer_period;

    if ( mark >= 600 )
    {
        NebulaLog::info("HMM", "--Mark--");
        mark = 0;
    }

    hpool->clean_expired_monitoring();
    vmpool->clean_expired_monitoring();

    if (!is_leader)
    {
        return;
    }

    set<int> discovered_hosts;
    time_t now = time(nullptr);
    time_t target_time = now - monitor_interval_host;

    hpool->discover(&discovered_hosts, target_time);

    if (discovered_hosts.empty())
    {
        return;
    }

    for (const auto& host_id : discovered_hosts)
    {
        auto host = hpool->get(host_id);

        if (!host.valid())
        {
            continue;
        }

        auto monitor_length = now - host->last_monitored();


        if (host->monitor_in_progress())
        {
            if (monitor_length >= monitor_expire)
            {
                // Host is being monitored for more than monitor_expire secs.
                start_host_monitor(host);
            }
        }
        else if (host->state() == Host::OFFLINE)
        {
            host->last_monitored(now);

            HostMonitoringTemplate monitoring;

            monitoring.timestamp(now);
            monitoring.oid(host_id);

            hpool->update_monitoring(monitoring);
        }
        else
        {
            // Not received an update in the monitor period.
            start_host_monitor(host);
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostMonitorManager::start_host_monitor(const HostRPCPool::HostBaseLock& host)
{
    if (!is_leader)
    {
        return;
    }

    auto driver = driver_manager->get_driver(host->im_mad());

    if (!driver)
    {
        NebulaLog::error("HMM", "start_monitor: Cannot find driver " + host->im_mad());
        return;
    }

    host->monitor_in_progress(true);
    host->last_monitored(time(nullptr));

    NebulaLog::debug("HMM", "Monitoring host " +host->name() + "("
                     + to_string(host->oid()) + ")");

    string xml = host->to_xml();

    driver->start_monitor(host->oid(), xml);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostMonitorManager::stop_host_monitor(const HostRPCPool::HostBaseLock& host)
{
    if (!is_leader)
    {
        return;
    }

    auto driver = driver_manager->get_driver(host->im_mad());

    if (!driver)
    {
        NebulaLog::error("HMM", "stop_monitor: Cannot find driver " + host->im_mad());
        return;
    }

    NebulaLog::debug("HMM", "Stopping Monitoring on host " +host->name() + "("
                     + to_string(host->oid()) + ")");

    string xml = host->to_xml();

    driver->stop_monitor(host->oid(), xml);
    host->monitor_in_progress(false);

}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostMonitorManager::error_monitor(int oid, const string& msg)
{
    auto host = hpool->get(oid);

    if (!host.valid())
    {
        NebulaLog::warn("HMM", "monitor_host: unknown host " + to_string(oid));
        return;
    }

    if (host->state() == Host::OFFLINE)
    {
        // Host is offline, we shouldn't receive monitoring
        return;
    }

    host->monitor_in_progress(false);

    host->last_monitored(time(nullptr));

    ostringstream oss;

    oss << Host::state_to_str(Host::ERROR) << " " << msg;

    oned_driver->host_state(oid, oss.str());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool HostMonitorManager::test_set_timestamp(MonitorDriverMessages type, int oid,
                                            time_t ts) const
{
    time_t last_ts;

    if (ts == 0)
    {
        return true;
    }

    auto host = hpool->get(oid);

    if (!host.valid())
    {
        NebulaLog::warn("HMM", "message ignored for unknown host "
                        + to_string(oid));
        return false;
    }

    switch(type)
    {
        case MonitorDriverMessages::MONITOR_VM:
            last_ts = host->last_monitor_vm();
            break;
        case MonitorDriverMessages::SYSTEM_HOST:
            last_ts = host->last_system_host();
            break;

        case MonitorDriverMessages::STATE_VM:
            last_ts = host->last_state_vm();
            break;

        case MonitorDriverMessages::MONITOR_HOST:
            last_ts = host->last_monitor_host();
            break;

        default:
            return true;
    }

    if ( last_ts > ts )
    {
        NebulaLog::warn("HMM", "out of order message ignored for host "
                        + to_string(oid));
        return false;
    }

    switch(type)
    {
        case MonitorDriverMessages::MONITOR_VM:
            host->last_monitor_vm(ts);
            break;
        case MonitorDriverMessages::SYSTEM_HOST:
            host->last_system_host(ts);
            break;

        case MonitorDriverMessages::STATE_VM:
            host->last_state_vm(ts);
            break;

        case MonitorDriverMessages::MONITOR_HOST:
            host->last_monitor_host(ts);
            break;

        default:
            break;
    }

    return true;
}
