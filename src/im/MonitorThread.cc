
/* -------------------------------------------------------------------------- */
/* Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#include "MonitorThread.h"

#include <map>
#include <set>

#include "Nebula.h"
#include "NebulaUtil.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

HostPool * MonitorThread::hpool;

DatastorePool * MonitorThread::dspool;

LifeCycleManager * MonitorThread::lcm;

MonitorThreadPool * MonitorThread::mthpool;

ClusterPool * MonitorThread::cpool;

VirtualMachinePool * MonitorThread::vmpool;

time_t MonitorThread::monitor_interval;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" void * do_message_thread(void *arg)
{
    MonitorThread * mt = static_cast<MonitorThread *>(arg);

    mt->do_message();

    MonitorThread::mthpool->exit_monitor_thread();

    delete mt;

    return 0;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MonitorThread::do_message()
{
    // -------------------------------------------------------------------------
    // Decode from base64
    // -------------------------------------------------------------------------
    string* hinfo = one_util::base64_decode(hinfo64);

    Host* host    = hpool->get(host_id,true);

    if ( host == 0 )
    {
        delete hinfo;
        return;
    }

    // -------------------------------------------------------------------------
    // Monitoring Error. VMs running on the host are moved to UNKNOWN
    // -------------------------------------------------------------------------
    if (result != "SUCCESS")
    {
        set<int> vm_ids;

        host->error_info(*hinfo, vm_ids);

        for (set<int>::iterator it = vm_ids.begin(); it != vm_ids.end(); it++)
        {
            lcm->trigger(LifeCycleManager::MONITOR_DONE, *it);
        }

        delete hinfo;

        hpool->update(host);

        host->unlock();

        return;
    }

    // -------------------------------------------------------------------------
    // Get DS Information from Moniroting Information & Reserved Capacity
    // -------------------------------------------------------------------------
    map<int,const VectorAttribute*>            datastores;
    map<int, const VectorAttribute*>::iterator itm;

    Template    tmpl;
    Datastore * ds;

    set<int>    non_shared_ds;

    int rc  = host->extract_ds_info(*hinfo, tmpl, datastores);

    int cid = host->get_cluster_id();

    long long reserved_cpu = 0;

    long long reserved_mem = 0;

    delete hinfo;

    host->unlock();

    if (rc != 0)
    {
        return;
    }

    if (cid != -1)
    {
        Cluster *cluster = cpool->get(cid, true);

        if (cluster != 0)
        {
            cluster->get_reserved_capacity(reserved_cpu, reserved_mem);

            cluster->unlock();
        }
    }

    for (itm = datastores.begin(); itm != datastores.end(); itm++)
    {
        ds = dspool->get(itm->first, true);

        if (ds == 0)
        {
            continue;
        }

        if (ds->get_type() == Datastore::SYSTEM_DS)
        {
            if (ds->is_shared())
            {
                float total = 0, free = 0, used = 0;
                ostringstream oss;

                (itm->second)->vector_value("TOTAL_MB", total);
                (itm->second)->vector_value("FREE_MB", free);
                (itm->second)->vector_value("USED_MB", used);

                ds->update_monitor(total, free, used);

                oss << "Datastore " << ds->get_name() << " (" << ds->get_oid()
                    << ") successfully monitored.";

                NebulaLog::log("ImM", Log::DEBUG, oss);

                dspool->update(ds);
            }
            else
            {
                non_shared_ds.insert(itm->first);
            }
        }

        ds->unlock();
    }

    // -------------------------------------------------------------------------
    // Parse Host information
    // -------------------------------------------------------------------------
    bool vm_poll;

    set<int>        lost;
    map<int,string> found;

    ostringstream   oss;

    host = hpool->get(host_id,true);

    if ( host == 0 )
    {
        return;
    }

    rc = host->update_info(tmpl, vm_poll, lost, found, non_shared_ds,
                reserved_cpu, reserved_mem);

    hpool->update(host);

    if (rc != 0)
    {
        host->unlock();

        return;
    }

    hpool->update_monitoring(host);

    oss << "Host " << host->get_name() << " (" << host->get_oid() << ")"
        << " successfully monitored.";

    NebulaLog::log("InM", Log::DEBUG, oss);

    time_t last_monitored = host->get_last_monitored();

    host->unlock();

    //--------------------------------------------------------------------------
    // Process VM information if any. VMs not reported by the hypervisor are
    // moved to the POWEROFF state.
    //--------------------------------------------------------------------------
    if (vm_poll)
    {
        set<int>::iterator         its;
        map<int,string>::iterator  itm;

        for (its = lost.begin(); its != lost.end(); its++)
        {
            VirtualMachine * vm = vmpool->get(*its, true);

            if (vm == 0)
            {
                continue;
            }

            if (vm->hasHistory() &&
                vm->get_lcm_state() == VirtualMachine::RUNNING &&
                (vm->get_running_stime() + 2*monitor_interval) < last_monitored)
            {
                lcm->trigger(LifeCycleManager::MONITOR_POWEROFF, *its);
            }

            vm->unlock();
        }

        for (itm = found.begin(); itm != found.end(); itm++)
        {
            VirtualMachineManagerDriver::process_poll(itm->first, itm->second);
        }
    }
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

MonitorThreadPool::MonitorThreadPool(int max_thr):concurrent_threads(max_thr),
    running_threads(0)
{
    //Initialize the MonitorThread constants
    MonitorThread::dspool = Nebula::instance().get_dspool();

    MonitorThread::hpool  = Nebula::instance().get_hpool();

    MonitorThread::lcm    = Nebula::instance().get_lcm();

    MonitorThread::cpool  = Nebula::instance().get_clpool();

    MonitorThread::vmpool = Nebula::instance().get_vmpool();

    Nebula::instance().get_configuration_attribute("MONITORING_INTERVAL",
        MonitorThread::monitor_interval);

    MonitorThread::mthpool= this;

    //Initialize concurrency variables
    pthread_mutex_init(&mutex,0);

    pthread_cond_init(&cond,0);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MonitorThreadPool::do_message(int hid, const string& result,
    const string& hinfo)
{
    pthread_attr_t attr;
    pthread_t id;

    pthread_mutex_lock(&mutex);

    while (running_threads >= concurrent_threads)
    {
        pthread_cond_wait(&cond, &mutex);
    }

    pthread_attr_init(&attr);
    pthread_attr_setdetachstate(&attr, PTHREAD_CREATE_DETACHED);

    MonitorThread * mt = new MonitorThread(hid, result, hinfo);

    running_threads++;

    pthread_create(&id, &attr, do_message_thread, (void *)mt);

    pthread_attr_destroy(&attr);

    pthread_mutex_unlock(&mutex);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void MonitorThreadPool::exit_monitor_thread()
{
    pthread_mutex_lock(&mutex);

    running_threads--;

    pthread_cond_signal(&cond);

    pthread_mutex_unlock(&mutex);
};
