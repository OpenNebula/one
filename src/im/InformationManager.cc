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

void InformationManager::trigger(Actions action, int _hid)
{
    int *   hid;
    string  aname;

    hid = new int(_hid);

    switch (action)
    {
    case STOPMONITOR:
        aname = "STOPMONITOR";
        break;

    default:
        delete hid;
        return;
    }

    am.trigger(aname,hid);
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
    else if (action == "STOPMONITOR")
    {
        int hid  = *(static_cast<int *>(arg));
        delete static_cast<int *>(arg);

        stop_monitor(hid);
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

void InformationManager::stop_monitor(int hid)
{
    string error_msg;
    int    rc;

    // -------------------------------------------------------------------------
    // Drop host from DB
    // -------------------------------------------------------------------------
    Host * host = hpool->get(hid,true);

    if (host == 0) //Already deleted silently return
    {
        return;
    }

    int cluster_id = host->get_cluster_id();
    string im_mad  = host->get_im_mad();

    rc = hpool->drop(host, error_msg);

    host->unlock();

    if (rc != 0) //Error (a VM has been allocated or DB error)
    {
        ostringstream oss;

        oss << "Could not delete host " << hid << ": " << error_msg;

        NebulaLog::log("InM", Log::ERROR, oss);

        return;
    }

    // -------------------------------------------------------------------------
    // Send STOPMONITOR to the IM driver if defined
    // -------------------------------------------------------------------------
    const InformationManagerDriver * imd = get(im_mad);

    if (imd != 0)
    {
        imd->stop_monitor(hid, host->get_name());
    }

    // -------------------------------------------------------------------------
    // Remove host from cluster
    // -------------------------------------------------------------------------
    if ( cluster_id != ClusterPool::NONE_CLUSTER_ID )
    {
        Cluster * cluster = clpool->get(cluster_id, true);

        if( cluster != 0 )
        {
            rc = cluster->del_host(hid, error_msg);

            if ( rc < 0 )
            {
                cluster->unlock();
                return;
            }

            clpool->update(cluster);

            cluster->unlock();
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void InformationManager::timer_action()
{
    static int mark = 0;

    int             rc;
    time_t          now;
    ostringstream   oss;

    set<int>            discovered_hosts;
    set<int>::iterator  it;

    const InformationManagerDriver * imd;

    Host *        host;
    istringstream iss;

    time_t monitor_length;
    time_t target_time;

    bool do_monitor;

    mark = mark + timer_period;

    if ( mark >= 600 )
    {
        NebulaLog::log("InM",Log::INFO,"--Mark--");
        mark = 0;
    }

    // Clear the expired monitoring records
    hpool->clean_expired_monitoring();

    now = time(0);

    target_time = now - monitor_period;

    rc = hpool->discover(&discovered_hosts, host_limit, target_time);

    if ((rc != 0) || (discovered_hosts.empty() == true))
    {
        return;
    }

    for(it=discovered_hosts.begin();it!=discovered_hosts.end();it++)
    {
        host = hpool->get(*it,true);

        if (host == 0)
        {
            continue;
        }

        monitor_length = now - host->get_last_monitored();

        /**
         * Monitor hosts that are:
         * - enabled and have been being monitored for more than monitor_expire
         * - enabled and not being monitored
         * - disabled and not being monitored but have running vms
         * - disabled with running vms and have been being monitored
         *   for more than monitor_expire secs.
         */

        do_monitor = false;

        if (host->isEnabled())
        {
            if (!host->isMonitoring())
            {
                do_monitor = true;
            }
            else if (monitor_length >= monitor_expire )
            {
                do_monitor = true;
            }
        }
        else if ( host->get_share_running_vms() > 0 )
        {
            if (!host->isMonitoring())
            {
                do_monitor = true;
            }
            else if (monitor_length >= monitor_expire)
            {
                do_monitor = true;
            }
        }

        if (do_monitor)
        {
            oss.str("");
            oss << "Monitoring host " << host->get_name() << " ("
                << host->get_oid() << ")";

            NebulaLog::log("InM",Log::DEBUG,oss);

            imd = get(host->get_im_mad());

            if (imd == 0)
            {
                oss.str("");
                oss << "Could not find information driver " << host->get_im_mad();
                NebulaLog::log("InM",Log::ERROR,oss);

                host->set_error();

                hpool->update(host);

                host->unlock();
            }
            else
            {
                Nebula&    nd       = Nebula::instance();
                bool update_remotes = false;

                string name    = host->get_name();
                int    oid     = host->get_oid();
                int cluster_id = host->get_cluster_id();

                string dsloc;

                //Force remotes update if the host has never been monitored.
                if (host->get_last_monitored() == 0)
                {
                    update_remotes = true;
                }

                host->set_monitoring_state();

                hpool->update(host);

                host->unlock();

                if (nd.get_ds_location(cluster_id, dsloc) == -1)
                {
                    continue;
                }

                imd->monitor(oid, name, dsloc, update_remotes);
            }
        }
        else if (!host->isEnabled() && host->get_share_running_vms() == 0 )
        {
            // Disabled hosts without VMs are not monitored, but we need to
            // update the last_mon_time to rotate the Hosts returned by
            // HostPool::discover. We also update the monitoring values with
            // 0s
            host->touch(true);

            hpool->update_monitoring(host);

            hpool->update(host);

            host->unlock();
        }
        else
        {
            host->unlock();
        }
    }
}
