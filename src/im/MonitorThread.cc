
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

VirtualMachineManager * MonitorThread::vmm;

MonitorThreadPool * MonitorThread::mthpool;

ClusterPool * MonitorThread::cpool;

VirtualMachinePool * MonitorThread::vmpool;

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
    // Decode from base64, check if it is compressed
    // -------------------------------------------------------------------------
    string* hinfo = one_util::base64_decode(hinfo64);
    string* zinfo = one_util::zlib_decompress(*hinfo, false);

    if ( zinfo != 0 )
    {
        delete hinfo;

        hinfo = zinfo;
    }

    Host* host = hpool->get(host_id);

    if ( host == 0 )
    {
        delete hinfo;
        return;
    }

    if ( host->get_state() == Host::OFFLINE ) //Should not receive any info
    {
        delete hinfo;

        host->unlock();

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
            lcm->trigger(LCMAction::MONITOR_DONE, *it);
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

    string reserved_cpu = "";

    string reserved_mem = "";

    delete hinfo;

    host->unlock();

    if (rc != 0)
    {
        return;
    }

    if (cid != -1)
    {
        Cluster * cluster = cpool->get_ro(cid);

        if (cluster != 0)
        {
            cluster->get_reserved_capacity(reserved_cpu, reserved_mem);

            cluster->unlock();
        }
    }

    for (itm = datastores.begin(); itm != datastores.end(); itm++)
    {
        ds = dspool->get_ro(itm->first);

        if (ds == 0)
        {
            continue;
        }

        if (ds->get_type() == Datastore::SYSTEM_DS && !ds->is_shared())
        {
            non_shared_ds.insert(itm->first);
        }

        ds->unlock();
    }

    // -------------------------------------------------------------------------
    // Parse Host information
    // -------------------------------------------------------------------------
    bool vm_poll;

    set<int>        lost;
    map<int,string> found;
    set<int>        rediscovered_vms;

    ostringstream   oss;

    host = hpool->get(host_id);

    if ( host == 0 )
    {
        return;
    }

    set<int> prev_rediscovered = host->get_prev_rediscovered_vms();

    rc = host->update_info(tmpl, vm_poll, lost, found, non_shared_ds,
                reserved_cpu, reserved_mem);

    if (rc != 0)
    {
        host->unlock();

        return;
    }

    hpool->update(host);

    if ( hpool->update_monitoring(host) == 0 )
    {
        oss << "Host " << host->get_name() << " (" << host->get_oid() << ")"
            << " successfully monitored.";

        NebulaLog::log("InM", Log::DEBUG, oss);
    }

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
            VirtualMachine * vm = vmpool->get_ro(*its);

            if (vm == 0)
            {
                continue;
            }

            // Move the VM to power off if it is not reported by the Host and:
            // 1.- It has a history record
            // 2.- It is supposed to be in RUNNING state
            // 3.- It has been monitored at least once
            if (vm->hasHistory() &&
                vm->get_last_poll() != 0 &&
                 ( vm->get_lcm_state() == VirtualMachine::RUNNING ||
                   vm->get_lcm_state() == VirtualMachine::SHUTDOWN ||
                   vm->get_lcm_state() == VirtualMachine::SHUTDOWN_POWEROFF ||
                   vm->get_lcm_state() == VirtualMachine::SHUTDOWN_UNDEPLOY))
            {
                lcm->trigger(LCMAction::MONITOR_POWEROFF, *its);
            }
            // If the guest is shut down before the poll reports it at least
            // once, the VM gets stuck in running. An individual poll action
            // is triggered after 5min (arbitrary number)
            else if (vm->hasHistory() &&
                    vm->get_last_poll() == 0 &&
                    vm->get_lcm_state() == VirtualMachine::RUNNING &&
                    (time(0) - vm->get_running_stime() > 300))
            {
                vmm->trigger(VMMAction::POLL,vm->get_oid());
            }

            vm->unlock();
        }

        for (itm = found.begin(); itm != found.end(); itm++)
        {
            VirtualMachine * vm = vmpool->get(itm->first);

            if (vm == 0)
            {
                continue;
            }

            // When a VM in poweroff is found again, it may be because of
            // outdated poll information. To make sure, we check if VM was
            // reported twice
            if (vm->get_state() == VirtualMachine::POWEROFF &&
                prev_rediscovered.count(itm->first) == 0)
            {
                rediscovered_vms.insert(itm->first);

                vm->unlock();
                continue;
            }

            VirtualMachineManagerDriver::process_poll(vm, itm->second);

            vm->unlock();
        }

        // The rediscovered set is not stored in the DB, the update method
        // is not needed

        hpool->update_prev_rediscovered_vms(host_id, rediscovered_vms);
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

    MonitorThread::vmm    = Nebula::instance().get_vmm();

    MonitorThread::cpool  = Nebula::instance().get_clpool();

    MonitorThread::vmpool = Nebula::instance().get_vmpool();

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
