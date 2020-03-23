/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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
    : hpool(hp)
    , vmpool(vmp)
    , threads(_threads)
    , timer_period(timer_period)
    , monitor_interval_host(monitor_interval_host)
{
    oned_driver    = new OneMonitorDriver(this);
    udp_driver     = new UDPMonitorDriver(addr, port);
    tcp_driver     = new TCPMonitorDriver(addr, port);
    driver_manager = new driver_manager_t(driver_path);
};

HostMonitorManager::~HostMonitorManager()
{
    delete oned_driver;
    delete udp_driver;
    delete tcp_driver;
    delete driver_manager;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int HostMonitorManager::load_monitor_drivers(
        const vector<const VectorAttribute*>& mads_config)
{
    return driver_manager->load_drivers(mads_config);
}

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
    thread timer_thr = thread([&, this]{
        unique_lock<mutex> end_lck(end_mtx);

        while(!end_cv.wait_for(end_lck, chrono::seconds(timer_period),
                    [&](){return end;}))
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
    driver_manager->stop();


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
            else if (old_state == Host::OFFLINE)
            {
                start_host_monitor(host);
            }

            NebulaLog::debug("HMM", "Updated Host " + to_string(host->oid())
                + ", state " + Host::state_to_str(host->state()));
        }
    }
    else
    {
        hpool->add_object(xml);

        start_host_monitor(oid);
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

    if (host->state() != Host::HostState::OFFLINE)
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

void HostMonitorManager::monitor_host(int oid, bool result, const Template &tmpl)
{
    auto host = hpool->get(oid);

    if (!host.valid())
    {
        NebulaLog::warn("HMM", "monitor_host: unknown host " + to_string(oid));
        return;
    }

    if (host->state() == Host::HostState::OFFLINE)
    {
        // Host is offline, we shouldn't receive monitoring
        return;
    }

    if (!result)
    {
        NebulaLog::error("HMM", "Monitor host failed id:" + to_string(oid));

        if (host->state() != Host::OFFLINE && host->state() != Host::DISABLED )
        {
            oned_driver->host_state(oid, Host::state_to_str(Host::HostState::ERROR));
            // TODO Set template error message
        }

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

    // Send host state update to oned
    if (host->state() != Host::HostState::MONITORED &&
        host->state() != Host::HostState::DISABLED)
    {
        oned_driver->host_state(oid, Host::state_to_str(Host::HostState::MONITORED));
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostMonitorManager::update_last_monitor(int oid)
{
    auto host = hpool->get(oid);

    if (!host.valid())
    {
        NebulaLog::warn("HMM", "beacon_host: unknown host " + to_string(oid));
        return;
    }

    if (host->state() == Host::HostState::OFFLINE)
    {
        // Host is offline, we shouldn't receive monitoring
        return;
    }

    host->last_monitored(time(nullptr));
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void HostMonitorManager::monitor_vm(int oid,
                                    const string& uuid,
                                    const Template &tmpl)
{
    if (oid < 0)
    {
        // Wild VM, check if it is imported to OpenNebula
        oid = vmpool->get_vmid(uuid);

        if (oid < 0)
        {
            // Not imported VM, ignore monitoring
            return;
        }
    }

    VirtualMachineMonitorInfo monitoring(oid, time(nullptr));

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

void HostMonitorManager::start_monitor_failure(int oid)
{
    NebulaLog::error("HMM", "Unable to monitor host id: " + to_string(oid));

    auto host = hpool->get(oid);

    if (!host.valid() || host->state() == Host::HostState::OFFLINE)
    {
        return;
    }

    host->monitor_in_progress(false);

    oned_driver->host_state(oid, Host::state_to_str(Host::HostState::ERROR));
}

/* -------------------------------------------------------------------------- */

void HostMonitorManager::start_monitor_success(int oid)
{
    NebulaLog::debug("HMM", "Start monitor success, host: " + to_string(oid));

    auto host = hpool->get(oid);

    if (!host.valid() || host->state() == Host::HostState::OFFLINE)
    {
        return;
    }

    host->last_monitored(time(nullptr));

    host->monitor_in_progress(false);

    oned_driver->host_state(oid, Host::state_to_str(Host::HostState::MONITORED));
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
        else if (host->state() == Host::HostState::OFFLINE)
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
