/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

#include "InformationManager.h"
#include "NebulaLog.h"
#include "Cluster.h"
#include "Nebula.h"

#include <sys/types.h>
#include <sys/stat.h>
#include <utime.h>


const time_t InformationManager::monitor_expire = 300;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" void * im_action_loop(void *arg)
{
    InformationManager *  im;

    if ( arg == 0 )
    {
        return 0;
    }

    NebulaLog::log("InM",Log::INFO,"Information Manager started.");

    im = static_cast<InformationManager *>(arg);

    im->am.loop(im->timer_period,0);

    NebulaLog::log("InM",Log::INFO,"Information Manager stopped.");

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int InformationManager::load_mads(int uid)
{
    InformationManagerDriver *  im_mad;
    unsigned int                i;
    ostringstream               oss;
    const VectorAttribute *     vattr;
    int                         rc;

    NebulaLog::log("InM",Log::INFO,"Loading Information Manager drivers.");

    for(i=0;i<mad_conf.size();i++)
    {
        vattr = static_cast<const VectorAttribute *>(mad_conf[i]);

        oss.str("");
        oss << "\tLoading driver: " << vattr->vector_value("NAME");

        NebulaLog::log("InM",Log::INFO,oss);

        im_mad = new InformationManagerDriver(0,vattr->value(),false,&mtpool);

        rc = add(im_mad);

        if ( rc == 0 )
        {
            oss.str("");
            oss << "\tDriver " << vattr->vector_value("NAME") << " loaded";

            NebulaLog::log("InM",Log::INFO,oss);
        }
        else
        {
            return -1;
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int InformationManager::start()
{
    int               rc;
    pthread_attr_t    pattr;

    rc = MadManager::start();

    if ( rc != 0 )
    {
        return -1;
    }

    NebulaLog::log("InM",Log::INFO,"Starting Information Manager...");

    pthread_attr_init (&pattr);
    pthread_attr_setdetachstate (&pattr, PTHREAD_CREATE_JOINABLE);

    rc = pthread_create(&im_thread,&pattr,im_action_loop,(void *) this);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void InformationManager::do_action(const string &action, void * arg)
{
    if (action == ACTION_TIMER)
    {
        timer_action();
    }
    else if (action == ACTION_FINALIZE)
    {
        NebulaLog::log("InM",Log::INFO,"Stopping Information Manager...");

        MadManager::stop();
    }
    else
    {
        ostringstream oss;
        oss << "Unknown action name: " << action;

        NebulaLog::log("InM", Log::ERROR, oss);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int InformationManager::start_monitor(Host * host, bool update_remotes)
{
    ostringstream oss;
    string dsloc;

    const InformationManagerDriver * imd;

    oss << "Monitoring host "<< host->get_name()<< " ("<< host->get_oid()<< ")";
    NebulaLog::log("InM",Log::DEBUG,oss);

    imd = get(host->get_im_mad());

    if (imd == 0)
    {
        oss.str("");

        oss << "Could not find information driver " << host->get_im_mad();
        NebulaLog::log("InM",Log::ERROR,oss);

        host->set_error();

        return -1;
    }

    host->set_monitoring_state();

    Nebula::instance().get_ds_location(dsloc);

    imd->monitor(host->get_oid(), host->get_name(), dsloc, update_remotes);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void InformationManager::timer_action()
{
    static int mark = 0;

    int    rc;
    time_t now;

    set<int>           discovered_hosts;
    set<int>::iterator it;


    Host * host;

    time_t monitor_length;
    time_t target_time;

    mark = mark + timer_period;

    if ( mark >= 600 )
    {
        NebulaLog::log("InM",Log::INFO,"--Mark--");
        mark = 0;
    }

    hpool->clean_expired_monitoring();

    now = time(0);

    target_time = now - monitor_period;

    rc = hpool->discover(&discovered_hosts, host_limit, target_time);

    if ((rc != 0) || (discovered_hosts.empty() == true))
    {
        return;
    }

    for( it=discovered_hosts.begin() ; it!=discovered_hosts.end() ; ++it )
    {
        host = hpool->get(*it,true);

        if (host == 0)
        {
            continue;
        }

        monitor_length = now - host->get_last_monitored();

        switch (host->get_state())
        {
            // Not received an update in the monitor period.
            case Host::INIT:
            case Host::MONITORED:
            case Host::ERROR:
            case Host::DISABLED:
                start_monitor(host, (host->get_last_monitored() == 0));
                break;

            // Update last_mon_time to rotate HostPool::discover output. Update
            // monitoring values with 0s.
            case Host::OFFLINE:
                host->touch(true);
                hpool->update_monitoring(host);
                break;

            // Host is being monitored for more than monitor_expire secs.
            case Host::MONITORING_DISABLED:
            case Host::MONITORING_INIT:
            case Host::MONITORING_ERROR:
            case Host::MONITORING_MONITORED:
                if (monitor_length >= monitor_expire )
                {
                    start_monitor(host, (host->get_last_monitored() == 0));
                }
                break;
        }

        hpool->update(host);

        host->unlock();
    }
}

