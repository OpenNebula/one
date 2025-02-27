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
#include "PlanManager.h"
#include "RaftManager.h"
#include "SchedulerManager.h"
#include "VirtualMachinePool.h"

#include <vector>

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

SchedulerManager::SchedulerManager(
        time_t       _max_wnd_time,
        unsigned int _max_wnd_length,
        time_t       _retry_time,
        const std::string& mad_location)
        : DriverManager(mad_location)
        , Listener("Scheduler Manager")
        , wnd_start(0)
        , wnd_length(0)
        , last_place(time(nullptr))
        , max_wnd_time(_max_wnd_time)
        , max_wnd_length(_max_wnd_length)
        , retry_time(_retry_time)
{
}

int SchedulerManager::start()
{
    /**
     *  Register protocol actions
     */
    register_action(SchedulerManagerMessages::PLACE, [this](auto msg) {
            this->_place(std::move(msg));});

    register_action(SchedulerManagerMessages::OPTIMIZE, [this](auto msg) {
            this->_optimize(std::move(msg));});

    register_action(SchedulerManagerMessages::LOG,
            &SchedulerManager::_log);

    register_action(SchedulerManagerMessages::UNDEFINED,
            &SchedulerManager::_undefined);

    /**
     *  Start Driver
     */
    std::string error;

    if ( DriverManager::start(error) != 0 )
    {
        NebulaLog::error("SCM", error);
        return -1;
    }

    /**
     *  Strat timer
     */
    timer_thread.reset(new Timer(timer_period, [this]() {timer_action();}));

    /**
     *  Start Listener
     */
    NebulaLog::log("SCM", Log::INFO, "Starting Scheduler Manager...");

    Listener::start();

    return 0;
}

int SchedulerManager::load_drivers(const std::vector<const VectorAttribute*>& _mads)
{
    const VectorAttribute * vattr = nullptr;

    NebulaLog::info("SCM", "Loading Scheduler Manager drivers.");

    if ( _mads.size() > 0 )
    {
        vattr = static_cast<const VectorAttribute *>(_mads[0]);
    }

    if ( vattr == nullptr )
    {
        NebulaLog::error("SCM", "Failed to load Scheduler Manager driver.");
        return -1;
    }

    VectorAttribute sched_conf("SCHED_MAD", vattr->value());

    sched_conf.replace("NAME", driver_name);

    if ( load_driver(&sched_conf) != 0 )
    {
        NebulaLog::error("SCM", "Unable to load Scheduler Manager driver");
        return -1;
    }

    NebulaLog::log("SCM", Log::INFO, "\tScheduler Manager loaded");

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*  MANAGER EVENTS. Triggered by other OpenNebula components to place or      */
/*  optimize cluster workloads.                                               */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
void SchedulerManager::trigger_place()
{
    trigger([&]
    {
        RaftManager * raftm = Nebula::instance().get_raftm();

        if (!raftm || (!raftm->is_leader() && !raftm->is_solo()))
        {
            return;
        }

        // --------------------------------------------------------------------
        // Check and update the scheduler window
        // --------------------------------------------------------------------
        {
            std::lock_guard<std::mutex> lock(wnd_mtx);

            time_t the_time = time(nullptr);

            if ( wnd_start == 0 )
            {
                wnd_start = the_time;
            }

            ++wnd_length;

            std::ostringstream oss;

            oss << "Scheduler window length " << the_time - wnd_start << "s and "
                << wnd_length << " VMs";

            NebulaLog::ddebug("SCM", oss.str());

            if (the_time < (wnd_start + max_wnd_time) &&
                    wnd_length < max_wnd_length)
            {
                return;
            }

            //TODO Check a PLACE planning is not being applied
            //send place request to driver, reset window
            last_place = the_time;
            wnd_start  = 0;
            wnd_length = 0;
        }

        auto scheduler = get();

        if (scheduler == nullptr)
        {
            return;
        }

        scheduler->place();
    });
}

void SchedulerManager::trigger_optimize(int cluster_id)
{
    trigger([this, cluster_id]
    {
        RaftManager * raftm = Nebula::instance().get_raftm();

        if (!raftm || (!raftm->is_leader() && !raftm->is_solo()))
        {
            return;
        }

        auto scheduler = get();

        if (scheduler == nullptr)
        {
            return;
        }

        scheduler->optimize(cluster_id);
    });
}

void SchedulerManager::timer_action()
{
    static int mark    = 0;
    static auto vmpool = Nebula::instance().get_vmpool();

    std::vector<int> vmids;

    mark += timer_period;

    if ( mark >= 600 )
    {
        NebulaLog::log("SCM", Log::INFO, "--Mark--");
        mark = 0;
    }

    RaftManager * raftm = Nebula::instance().get_raftm();

    if (!raftm || (!raftm->is_leader() && !raftm->is_solo()))
    {
        return;
    }

    // Check the scheduler window & waiting times
    {
        std::lock_guard<std::mutex> lock(wnd_mtx);

        time_t the_time = time(nullptr);

        vmpool->get_pending(vmids);

        bool expired = ((wnd_start > 0) && (the_time >= (wnd_start + max_wnd_time)))
                       || (wnd_length >= max_wnd_length);

        bool pending = (vmids.size() > 0) &&
                       (the_time >= last_place + retry_time);

        std::ostringstream oss;

        time_t wt = (wnd_start == 0) ? 0 : (the_time - wnd_start);
        time_t rt = last_place + retry_time - the_time;

        rt = (rt < 0) ? 0 : rt;

        oss << "Scheduler window length " << wt << "s and " << wnd_length << " VMs"
            << ". Pending VMs: " << vmids.size() << " time to retry: " << rt;

        NebulaLog::ddebug("SCMT", oss.str());

        //TODO Check there is no placement plan active

        if (!expired && !pending)
        {
            return;
        }

        last_place = the_time;
        wnd_start  = 0;
        wnd_length = 0;
    }

    auto scheduler = get();

    if (scheduler == nullptr)
    {
        return;
    }

    scheduler->place();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/*  PROTOCOL ACTIONS. Executed for each type of driver message received from  */
/*  from the scheduler                                                        */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
static void log_msg(scheduler_msg_t *msg)
{
    std::ostringstream oss;

    oss << "Message received: ";
    msg->write_to(oss);

    NebulaLog::ddebug("SCM", oss.str());
}

void SchedulerManager::_undefined(std::unique_ptr<scheduler_msg_t> msg)
{
    NebulaLog::warn("SCM", "Received UNDEFINED msg: " + msg->payload());
}

void SchedulerManager::_log(std::unique_ptr<scheduler_msg_t> msg)
{
    auto vmpool = Nebula::instance().get_vmpool();

    if (msg->oid() < 0)
    {
        NebulaLog::log("SCM", log_type(msg->status()[0]), msg->payload());
    }
    else if (auto vm = vmpool->get(msg->oid()))
    {
        auto lt = log_type(msg->status()[0]);

        vm->log("VMM", lt, msg->payload());

        if ( lt == Log::ERROR )
        {
            vm->set_template_error_message("SCHED_MESSAGE", msg->payload());

            vmpool->update(vm.get());
        }
    }
}

void SchedulerManager::_place(std::unique_ptr<scheduler_msg_t> msg)
{
    log_msg(msg.get());

    if (msg->status() == "FAILURE")
    {
        std::ostringstream oss;

        oss << "Scheduler place operation error: " << msg->payload();
        NebulaLog::log("SCM", Log::INFO, oss);

        return;
    }

    auto planm = Nebula::instance().get_planm();
    planm->add_plan(msg->payload());
}

void SchedulerManager::_optimize(std::unique_ptr<scheduler_msg_t> msg)
{
    log_msg(msg.get());

    if (msg->status() == "FAILURE")
    {
        std::ostringstream oss;

        oss << "Optimize error for cluster " << msg->oid() << ": "
            << msg->payload();

        NebulaLog::log("SCM", Log::INFO, oss);

        return;
    }

    auto planm = Nebula::instance().get_planm();
    planm->add_plan(msg->payload());
}


