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

#ifndef DRIVER_MANAGER_H_
#define DRIVER_MANAGER_H_

#include "Driver.h"
#include "Attribute.h"
#include "NebulaLog.h"
#include <string>

template<typename E, typename D>
class DriverManager
{
public:
    explicit DriverManager(const string& mad_location)
        : mad_location(mad_location)
    {
    }

    virtual ~DriverManager() = default;

    int load_drivers(const vector<const VectorAttribute*>& mads_config);

    D * get_driver(const std::string& name) const;

    /**
     *  Register an action for a given message type. The action is registered
     *  for all installed drivers. Must be called after load_drivers method.
     */
    void register_action(E t,
        std::function<void(std::unique_ptr<Message<E>>)> a);

    /**
     *  Start all drivers
     */
    int start(std::string& error);

    /**
     *  Stop all drivers
     */
    void stop();

private:
    std::map<std::string, std::unique_ptr<D>> drivers;

    string mad_location;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

template<typename E, typename D>
int DriverManager<E, D>::load_drivers(const vector<const VectorAttribute*>& mads_config)
{
    NebulaLog::info("DrM", "Loading drivers.");

    for (const auto& vattr : mads_config)
    {
        auto name = vattr->vector_value("NAME");
        auto exec = vattr->vector_value("EXECUTABLE");
        auto args = vattr->vector_value("ARGUMENTS");
        int  threads;

        vattr->vector_value("THREADS", threads, 0);

        NebulaLog::info("InM", "Loading driver: " + name);

        if (exec.empty())
        {
            NebulaLog::error("InM", "\tEmpty executable for driver: " + name);
            return -1;
        }

        if (exec[0] != '/') //Look in ONE_LOCATION/lib/mads or in "/usr/lib/one/mads"
        {
            exec = mad_location + exec;
        }

        if (access(exec.c_str(), F_OK) != 0)
        {
            NebulaLog::error("InM", "File not exists: " + exec);
            return -1;
        }

        auto rc = drivers.insert(std::make_pair(name,
                    std::unique_ptr<D>(new D(exec, args, threads))));

        if (rc.second)
        {
            NebulaLog::info("InM", "\tDriver loaded: " + name);
        }
        else
        {
            NebulaLog::error("InM", "\tDriver already exists: " + name);
            return -1;
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

template<typename E, typename D>
D * DriverManager<E, D>::get_driver(const std::string& name) const
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

template<typename E, typename D>
void DriverManager<E, D>::register_action(E t,
    std::function<void(std::unique_ptr<Message<E>>)> a)
{
    for (auto& driver : drivers)
    {
        driver.second->register_action(t, a);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

template<typename E, typename D>
int DriverManager<E, D>::start(std::string& error)
{
    for (auto& driver : drivers)
    {
        auto rc = driver.second->start(error);
        if (rc != 0)
        {
            NebulaLog::error("DrM", "Unable to start driver: " + error);
            return rc;
        }
    }
    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

template<typename E, typename D>
void DriverManager<E, D>::stop()
{
    for (auto& driver : drivers)
    {
        driver.second->stop();
    }
}

#endif // DRIVER_MANAGER_H_
