/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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

#ifndef INFORMATION_MANAGER_H_
#define INFORMATION_MANAGER_H_

#include "MadManager.h"
#include "ActionManager.h"
#include "InformationManagerDriver.h"
#include "MonitorThread.h"
#include "NebulaLog.h"

using namespace std;

extern "C" void * im_action_loop(void *arg);

class HostPool;
class ClusterPool;
class Host;

class InformationManager : public MadManager, public ActionListener
{
public:

    InformationManager(
        HostPool *                  _hpool,
        ClusterPool *               _clpool,
        time_t                      _timer_period,
        time_t                      _monitor_period,
        int                         _host_limit,
        int                         _monitor_threads,
        const string&               _remotes_location,
        vector<const VectorAttribute*>&   _mads)
            :MadManager(_mads),
            hpool(_hpool),
            clpool(_clpool),
            timer_period(_timer_period),
            monitor_period(_monitor_period),
            host_limit(_host_limit),
            remotes_location(_remotes_location),
            mtpool(_monitor_threads)
    {
        am.addListener(this);
    };

    ~InformationManager(){};

    /**
     *  This functions starts the associated listener thread, and creates a
     *  new thread for the Information Manager. This thread will wait in
     *  an action loop till it receives ACTION_FINALIZE.
     *    @return 0 on success.
     */
    int start();

    /**
     *  Gets the thread identification.
     *    @return pthread_t for the manager thread (that in the action loop).
     */
    pthread_t get_thread_id() const
    {
        return im_thread;
    };

    /**
     *
     */
    void finalize()
    {
        am.finalize();
    };

    /**
     *   Load the information drivers
     *     @return 0 on success
     */
    int load_mads(int uid=0);

    /**
     *  Sends a STOPMONITR command to the associated driver and host
     *    @param hid the host id
     *    @param name of the host
     *    @param im_mad the driver name
     */
    void stop_monitor(int hid, const string& name, const string& im_mad)
    {
        const InformationManagerDriver * imd = get(im_mad);

        if (imd != 0)
        {
            imd->stop_monitor(hid, name);
        }
    }

    /**
     *  Starts the monitor process on the host
     *    @param host to monitor
     *    @param update_remotes to copy the monitor probes to the host
     *    @return 0 on success
     */
    int start_monitor(Host * host, bool update_remotes);

private:
    /**
     *  Thread id for the Information Manager
     */
    pthread_t       im_thread;

    /**
     *  Pointer to the Host Pool
     */
    HostPool *      hpool;

    /**
     *  Pointer to the Cluster Pool
     */
    ClusterPool *   clpool;

    /**
     *  Timer period for the Virtual Machine Manager.
     */
    time_t          timer_period;

    /**
     *  Host monitoring interval
     */
    time_t          monitor_period;

    /**
     *  Host monitoring limit
     */
    int             host_limit;

   /**
    *  Path for the remote action programs
    */
    string          remotes_location;

    /**
     *  Action engine for the Manager
     */
    ActionManager   am;

    /**
     *  Pool of threads to process each monitor message
     */
    MonitorThreadPool mtpool;

    /**
     *  Time in seconds to expire a monitoring action (5 minutes)
     */
    static const time_t monitor_expire;

    /**
     *  Returns a pointer to a Information Manager MAD. The driver is
     *  searched by its name and owned by gwadmin with uid=0.
     *    @param name of the driver
     *    @return the VM driver owned by uid 0, with attribute "NAME" equal to
     *    name or 0 in not found
     */
    const InformationManagerDriver * get(
        const string&   name)
    {
        string _name("NAME");
        return static_cast<const InformationManagerDriver *>
               (MadManager::get(0,_name,name));
    };

    /**
     *  Function to execute the Manager action loop method within a new pthread
     * (requires C linkage)
     */
    friend void * im_action_loop(void *arg);

    // ------------------------------------------------------------------------
    // ActioListener Interface
    // ------------------------------------------------------------------------
    /**
     *  This function is executed periodically to monitor Nebula hosts.
     */
    void timer_action(const ActionRequest& ar);

    void finalize_action(const ActionRequest& ar)
    {
        NebulaLog::log("InM",Log::INFO,"Stopping Information Manager...");

        MadManager::stop();
    };
};

#endif /*VIRTUAL_MACHINE_MANAGER_H*/

