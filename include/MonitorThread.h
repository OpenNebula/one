
/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#ifndef MONITOR_THREAD_H_
#define MONITOR_THREAD_H_

#include <string>
#include <pthread.h>

class HostPool;
class ClusterPool;
class DatastorePool;
class LifeCycleManager;
class VirtualMachinePool;

class MonitorThreadPool;

extern "C" void * do_message_thread(void *arg);

class MonitorThread
{
private:
    friend class MonitorThreadPool;

    friend void * do_message_thread(void *arg);

    MonitorThread(int hid, std::string res, std::string inf):host_id(hid),
        result(res), hinfo64(inf){};

    ~MonitorThread(){};

    void do_message();

    // Message variables
    int    host_id;

    std::string result;

    std::string hinfo64;

    // Pointers shared by all the MonitorThreads, init by MonitorThreadPool
    static HostPool * hpool;

    static ClusterPool * cpool;

    static DatastorePool * dspool;

    static LifeCycleManager *lcm;

    static VirtualMachinePool * vmpool;

    static MonitorThreadPool * mthpool;

    static time_t monitor_interval;
};

// -----------------------------------------------------------------------------
// -----------------------------------------------------------------------------

class MonitorThreadPool
{
public:
    MonitorThreadPool(int num_threads);

    ~MonitorThreadPool(){};

    /**
     *  Creates a new thread to parse and process a monitor message
     *    @param hid host id
     *    @param result of the monitor operation
     *    @oaram hinfo the information sent by the driver
     */
    void do_message(int hid, const std::string& result, const std::string& hinfo);

    /**
     *  Terminates a running thread, and signal the main control thread.
     */
    void exit_monitor_thread();

private:

    int concurrent_threads; /**< Max number of concurrent threads*/

    int running_threads;    /**< Number of running threads*/

    //Concurrency control variables
    pthread_mutex_t mutex;

    pthread_cond_t  cond;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

#endif /*MONITOR_THREAD_H_*/

