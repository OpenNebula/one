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

#ifndef DRIVER_MANAGER_H_
#define DRIVER_MANAGER_H_

#include "Driver.h"
#include "Attribute.h"
#include "NebulaLog.h"
#include "SyncRequest.h"
#include <string>

template<typename D>
class DriverManager
{
public:
    explicit DriverManager(const std::string& mad_location)
        : mad_location(mad_location)
    {
    }

    virtual ~DriverManager() = default;

    int load_driver(const VectorAttribute* mad_config);

    int load_drivers(const std::vector<const VectorAttribute*>& mads_config);

    D * get_driver(const std::string& name) const;

    /**
     *  Register an action for a given message type. The action is registered
     *  for all installed drivers. Must be called after load_drivers method.
     */
    void register_action(typename D::message_t::msg_enum t,
                         std::function<void(std::unique_ptr<typename D::message_t>)> a);

    /**
     *  Start all drivers
     */
    int start(std::string& error);

    /**
     *  Stop all drivers
     *    @param secs to wait for each driver before killing it
     */
    void stop(int secs);

protected:
    int add(const std::string& name, std::unique_ptr<D> driver);

    /* SyncReqeust methods implementation */

    /**
     *  This function can be periodically executed to check time_outs on
     *  request. It will fail requests with an expired timeout and will notify
     *  the clients.
     */
    void check_time_outs_action();

    /**
     *  Add a new request to the Request map
     *    @param ar pointer to the request
     *    @return the id for the request
     */
    void add_request(SyncRequest *ar);

    /**
     *  Gets request from the Request map
     *    @param id for the request
     *    @return pointer to the Request
     */
    SyncRequest * get_request(int id);

    /**
     *  Notify the result of an auth request
     */
    void notify_request(int id, bool result, const std::string& message);

    static Log::MessageType log_type(char type);

private:
    std::map<std::string, std::unique_ptr<D>> drivers;

    std::string mad_location;

    /**
     *  List of pending requests
     */
    std::map<int, SyncRequest *> sync_requests;

    std::mutex _mutex;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

template<typename D>
int DriverManager<D>::load_driver(const VectorAttribute* mad_config)
{
    const auto& name = mad_config->vector_value("NAME");
    auto exec = mad_config->vector_value("EXECUTABLE");
    const auto& args = mad_config->vector_value("ARGUMENTS");
    int  threads;

    mad_config->vector_value("THREADS", threads, 0);

    NebulaLog::info("DrM", "Loading driver: " + name);

    if (exec.empty())
    {
        NebulaLog::error("DrM", "\tEmpty executable for driver: " + name);
        return -1;
    }

    if (exec[0] != '/') //Look in ONE_LOCATION/lib/mads or in "/usr/lib/one/mads"
    {
        exec = mad_location + exec;
    }

    if (access(exec.c_str(), F_OK) != 0)
    {
        NebulaLog::error("DrM", "File not exists: " + exec);
        return -1;
    }

    auto rc = drivers.insert(std::make_pair(name,
                                            std::unique_ptr<D>(new D(exec, args, threads))));

    if (rc.second)
    {
        NebulaLog::info("DrM", "\tDriver loaded: " + name);
    }
    else
    {
        NebulaLog::error("DrM", "\tDriver already exists: " + name);
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

template<typename D>
int DriverManager<D>::load_drivers(const std::vector<const VectorAttribute*>& mads_config)
{
    NebulaLog::info("DrM", "Loading drivers.");

    int rc = 0;

    for (const auto& vattr : mads_config)
    {
        rc += load_driver(vattr);
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

template<typename D>
D * DriverManager<D>::get_driver(const std::string& name) const
{
    auto driver = drivers.find(name);

    if (driver == drivers.end())
    {
        return nullptr;
    }

    return driver->second.get();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

template<typename D>
void DriverManager<D>::register_action(typename D::message_t::msg_enum t,
                                       std::function<void(std::unique_ptr<typename D::message_t>)> a)
{
    for (auto& driver : drivers)
    {
        driver.second->register_action(t, a);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

template<typename D>
int DriverManager<D>::start(std::string& error)
{
    for (auto& driver : drivers)
    {
        auto rc = driver.second->start(error);
        if (rc != 0)
        {
            NebulaLog::error("DrM", "Unable to start driver '" + driver.first
                             + "': " + error);
            return rc;
        }
    }
    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

template<typename D>
void DriverManager<D>::stop(int secs)
{
    std::vector<std::thread> threads;

    for (auto& driver : drivers)
    {
        int _secs = secs;
        threads.push_back(std::thread([_secs, &driver] ()
        {
            driver.second->stop(_secs);
        }));
    }

    for (auto& thr : threads)
    {
        thr.join();
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
template<typename D>
int DriverManager<D>::add(const std::string& name, std::unique_ptr<D> driver)
{
    auto rc = drivers.insert(std::make_pair(name, std::move(driver)));

    if (!rc.second)
    {
        // Driver already exists
        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

template<typename D>
void DriverManager<D>::check_time_outs_action()
{
    time_t the_time = time(0);

    std::lock_guard<std::mutex> lock(_mutex);

    auto it = sync_requests.begin();

    while (it != sync_requests.end())
    {
        if ((it->second->time_out != 0) && (the_time > it->second->time_out))
        {
            SyncRequest * ar = it->second;
            sync_requests.erase(it++);

            ar->result  = false;
            ar->timeout = true;
            ar->message = "Request timeout";

            ar->notify();
        }
        else
        {
            ++it;
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

template<typename D>
void DriverManager<D>::add_request(SyncRequest *ar)
{
    static int request_id = 0;

    std::lock_guard<std::mutex> lock(_mutex);

    ar->id = request_id++;

    sync_requests.insert(sync_requests.end(), std::make_pair(ar->id, ar));
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

template<typename D>
SyncRequest * DriverManager<D>::get_request(int id)
{
    SyncRequest * ar = nullptr;

    std::lock_guard<std::mutex> lock(_mutex);

    auto it = sync_requests.find(id);

    if (it != sync_requests.end())
    {
        ar = it->second;

        sync_requests.erase(it);
    }

    return ar;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

template<typename D>
void DriverManager<D>::notify_request(int id, bool result, const std::string& message)
{
    SyncRequest * ar = get_request(id);

    if (ar == 0)
    {
        return;
    }

    ar->result = result;

    if (message != "-")
    {
        if (!ar->message.empty())
        {
            ar->message.append("; ");
        }

        ar->message.append(message);
    }

    ar->notify();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

template<typename D>
Log::MessageType DriverManager<D>::log_type(char type)
{
    auto log_type = Log::INFO;

    switch (type)
    {
        case 'E':
            log_type = Log::ERROR;
            break;
        case 'W':
            log_type = Log::WARNING;
            break;
        case 'D':
            log_type = Log::DEBUG;
            break;
    }

    return log_type;
}

#endif // DRIVER_MANAGER_H_
