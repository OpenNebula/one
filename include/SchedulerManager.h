/* -------------------------------------------------------------------------- */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                */
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

#ifndef SCHEDULER_MANAGER_H_
#define SCHEDULER_MANAGER_H_

#include "ProtocolMessages.h"
#include "DriverManager.h"
#include "Listener.h"

#include "SchedulerManagerDriver.h"

#include <vector>

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

// TODO Make this compatible with HA configuration: Do not generate place/optimize
// request if we are not the leader.
class SchedulerManager :
    public DriverManager<SchedulerManagerDriver>,
    public Listener
{
public:
    SchedulerManager( time_t wtime, unsigned int wlength, time_t retry,
            const std::string& mad_location);

    virtual ~SchedulerManager() = default;

    /**
     *  This functions starts the associated listener thread, and creates a
     *  new thread for the Scheduler Manager. This thread will wait in
     *  an action loop till it receives ACTION_FINALIZE.
     *    @return 0 on success.
     */
    int start();

    /**
     *  Loads Scheduler Manager driver defined in configuration file
     *   @param _mads configuration of drivers
     */
    int load_drivers(const std::vector<const VectorAttribute*>& _mads);


    /**
     *  Send a placement request to the scheduler
     */
    void trigger_place();

    /**
     *  Send an optization request for a cluster
     *    @param cluster_id of the cluster to load balance
     */
    void trigger_optimize(int cluster_id);

private:
    /**
     *  The timer action will periodically will check placement requests.
     *  This thread will recover schedule windows from "missing events" or VMs
     *  waiting for resources.
     */
    constexpr static time_t timer_period = 5;

    std::unique_ptr<Timer> timer_thread;

    std::mutex wnd_mtx;

    time_t wnd_start;

    time_t wnd_length;

    time_t last_place;

    time_t max_wnd_time;

    time_t max_wnd_length;

    time_t retry_time;

    /**
     *  Generic name for the Scheduler driver
     */
    static constexpr const char *  driver_name = "sched_exe";

    /**
     *  Returns a pointer to a the Scheduler Manager driver. The driver is
     *  searched by its name and owned by oneadmin with uid=0.
     *    @param name of the driver
     *    @return the Scheduler driver owned by uid 0
     *    name or 0 in not found
     */
    const SchedulerManagerDriver * get() const
    {
        return DriverManager::get_driver(driver_name);
    }

    // -------------------------------------------------------------------------
    // Protocol implementation to process scheduler messages
    // -------------------------------------------------------------------------
    /**
     *
     */
    static void _undefined(std::unique_ptr<scheduler_msg_t> msg);

    /**
     *
     */
    void _place(std::unique_ptr<scheduler_msg_t> msg);

    /**
     *
     */
    void _optimize(std::unique_ptr<scheduler_msg_t> msg);

    /**
     *
     */
    static void _log(std::unique_ptr<scheduler_msg_t> msg);

    // -------------------------------------------------------------------------
    // -------------------------------------------------------------------------
    /**
     *
     */
    void timer_action();

    /**
     *
     */
    void finalize_action() override
    {
        static const int drivers_timeout = 10;

        timer_thread->stop();

        DriverManager::stop(drivers_timeout);
    };
};

#endif /*SCHEDULER_MANAGER_H*/

