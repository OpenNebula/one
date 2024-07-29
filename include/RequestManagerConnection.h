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

#ifndef REQUEST_MANAGER_CONNECTION_H_
#define REQUEST_MANAGER_CONNECTION_H_

#include "RequestManager.h"
#include <condition_variable>

/**
 *  The connection manager class synchronizes the connection and manager threads
 */
class ConnectionManager
{
public:
    ConnectionManager(int mc)
        : connections(0)
        , max_connections(mc)
        , end(false)
    {
    }

    ~ConnectionManager() = default;

    /**
     *  Increments number of active connections
     */
    int add()
    {
        std::lock_guard<std::mutex> lock(_mutex);

        return ++connections;
    }

    /**
     *  Decrements number of active connections and signals management thread
     */
    void del()
    {
        std::lock_guard<std::mutex> lock(_mutex);

        --connections;

        cond.notify_one();
    }

    /**
     *  Waits for active connections to be under the max_connection threshold
     */
    void wait()
    {
        std::unique_lock<std::mutex> lock(_mutex);

        if (end)
        {
            return;
        }

        cond.wait(lock, [&]
        {
            return (connections < max_connections) || end;
        });
    }

    /**
     *  Interrupts and prevents wait() operations
     */
    void terminate()
    {
        std::lock_guard<std::mutex> lock(_mutex);

        end = true;

        cond.notify_one();
    }

private:
    /**
     *  Synchronization for connection threads and listener thread
     */
    std::mutex _mutex;
    std::condition_variable cond;

    /**
     *  Number of active connections
     */
    int connections;

    /**
     *  Max number of active connections
     */
    int max_connections;

    /**
     *  Terminate wait
     */
    std::atomic<bool> end;
};

#endif
