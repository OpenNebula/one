/* -------------------------------------------------------------------------- */
/* Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#include <stdexcept>
#include <stdlib.h>

#include <signal.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/types.h>
#include <pwd.h>

#include <pthread.h>

#include <cmath>

#include "Scheduler.h"
#include "SchedulerTemplate.h"
#include "RankPolicy.h"
#include "NebulaLog.h"
#include "PoolObjectAuth.h"
#include "NebulaUtil.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

extern "C" void * scheduler_action_loop(void *arg)
{
    Scheduler *  sched;

    if ( arg == 0 )
    {
        return 0;
    }

    sched = static_cast<Scheduler *>(arg);

    NebulaLog::log("SCHED",Log::INFO,"Scheduler loop started.");

    sched->am.loop(sched->timer,0);

    NebulaLog::log("SCHED",Log::INFO,"Scheduler loop stopped.");

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Scheduler::start()
{
    int rc;

    ifstream      file;
    ostringstream oss;

    string etc_path;

    int          oned_port;
    unsigned int live_rescheds;

    pthread_attr_t pattr;

    // -----------------------------------------------------------
    // Configuration File
    // -----------------------------------------------------------
    string        log_file;
    const char *  nl = getenv("ONE_LOCATION");

    if (nl == 0) //OpenNebula installed under root directory
    {
        log_file = "/var/log/one/sched.log";
        etc_path = "/etc/one/";
    }
    else
    {
        oss << nl << "/var/sched.log";

        log_file = oss.str();

        oss.str("");
        oss << nl << "/etc/";

        etc_path = oss.str();
    }

    SchedulerTemplate conf(etc_path);

    if ( conf.load_configuration() != 0 )
    {
        throw runtime_error("Error reading configuration file.");
    }

    conf.get("ONED_PORT", oned_port);

    oss.str("");
    oss << "http://localhost:" << oned_port << "/RPC2";
    url = oss.str();

    conf.get("SCHED_INTERVAL", timer);

    conf.get("MAX_VM", machines_limit);

    conf.get("MAX_DISPATCH", dispatch_limit);

    conf.get("MAX_HOST", host_dispatch_limit);

    conf.get("LIVE_RESCHEDS", live_rescheds);

    conf.get("HYPERVISOR_MEM", hypervisor_mem);

    // -----------------------------------------------------------
    // Log system & Configuration File
    // -----------------------------------------------------------

    try
    {
        vector<const Attribute *> logs;
        int rc;

        NebulaLog::LogType log_system = NebulaLog::UNDEFINED;
        Log::MessageType   clevel     = Log::ERROR;;

        rc = conf.get("LOG", logs);

        if ( rc != 0 )
        {
            string value;
            int    ilevel;

            const VectorAttribute * log = static_cast<const VectorAttribute *>
                                                          (logs[0]);
            value      = log->vector_value("SYSTEM");
            log_system = NebulaLog::str_to_type(value);

            value  = log->vector_value("DEBUG_LEVEL");
            ilevel = atoi(value.c_str());

            if (0 <= ilevel && ilevel <= 3 )
            {
                clevel = static_cast<Log::MessageType>(ilevel);
            }
        }

        // Start the log system
        if ( log_system != NebulaLog::UNDEFINED )
        {
            NebulaLog::init_log_system(log_system,
                           clevel,
                           log_file.c_str(),
                           ios_base::trunc,
                           "mm_sched");
        }
        else
        {
            throw runtime_error("Unknown LOG_SYSTEM.");
        }

        NebulaLog::log("SCHED", Log::INFO, "Init Scheduler Log system");
    }
    catch(runtime_error &)
    {
        throw;
    }

    oss.str("");

    oss << "Starting Scheduler Daemon" << endl;
    oss << "----------------------------------------\n";
    oss << "     Scheduler Configuration File       \n";
    oss << "----------------------------------------\n";
    oss << conf;
    oss << "----------------------------------------";

    NebulaLog::log("SCHED", Log::INFO, oss);

    // -----------------------------------------------------------
    // XML-RPC Client
    // -----------------------------------------------------------

    try
    {
        client = new Client("",url);
    }
    catch(runtime_error &)
    {
        throw;
    }

    xmlInitParser();

    // -----------------------------------------------------------
    // Pools
    // -----------------------------------------------------------

    hpool  = new HostPoolXML(client, hypervisor_mem);
    clpool = new ClusterPoolXML(client);
    vmpool = new VirtualMachinePoolXML(client,
                                       machines_limit,
                                       (live_rescheds == 1));
    vmapool= new VirtualMachineActionsPoolXML(client, machines_limit);
    dspool = new DatastorePoolXML(client);

    acls   = new AclXML(client);

    // -----------------------------------------------------------
    // Load scheduler policies
    // -----------------------------------------------------------

    register_policies(conf);

    // -----------------------------------------------------------
    // Close stds, we no longer need them
    // -----------------------------------------------------------

    int fd;

    fd = open("/dev/null", O_RDWR);

    dup2(fd,0);
    dup2(fd,1);
    dup2(fd,2);

    close(fd);

    fcntl(0,F_SETFD,0); // Keep them open across exec funcs
    fcntl(1,F_SETFD,0);
    fcntl(2,F_SETFD,0);

    // -----------------------------------------------------------
    // Block all signals before creating any  thread
    // -----------------------------------------------------------

    sigset_t    mask;
    int         signal;

    sigfillset(&mask);

    pthread_sigmask(SIG_BLOCK, &mask, NULL);

    // -----------------------------------------------------------
    // Create the scheduler loop
    // -----------------------------------------------------------

    NebulaLog::log("SCHED",Log::INFO,"Starting scheduler loop...");

    pthread_attr_init (&pattr);
    pthread_attr_setdetachstate (&pattr, PTHREAD_CREATE_JOINABLE);

    rc = pthread_create(&sched_thread,&pattr,scheduler_action_loop,(void *) this);

    if ( rc != 0 )
    {
        NebulaLog::log("SCHED",Log::ERROR,
            "Could not start scheduler loop, exiting");

        return;
    }

    // -----------------------------------------------------------
    // Wait for a SIGTERM or SIGINT signal
    // -----------------------------------------------------------

    sigemptyset(&mask);

    sigaddset(&mask, SIGINT);
    sigaddset(&mask, SIGTERM);

    sigwait(&mask, &signal);

    am.trigger(ActionListener::ACTION_FINALIZE,0); //Cancel sched loop

    pthread_join(sched_thread,0);

    xmlCleanupParser();

    NebulaLog::finalize_log_system();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Scheduler::set_up_pools()
{
    int                             rc;
    ostringstream                   oss;
    map<int,int>::const_iterator    it;
    map<int, int>                   shares;

    //--------------------------------------------------------------------------
    //Cleans the cache and get the pending VMs
    //--------------------------------------------------------------------------

    rc = vmpool->set_up();

    if ( rc != 0 )
    {
        return rc;
    }

    //--------------------------------------------------------------------------
    //Cleans the cache and get the datastores
    //--------------------------------------------------------------------------

    rc = dspool->set_up();

    if ( rc != 0 )
    {
        return rc;
    }

    //--------------------------------------------------------------------------
    //Cleans the cache and get the hosts ids
    //--------------------------------------------------------------------------

    rc = hpool->set_up();

    if ( rc != 0 )
    {
        return rc;
    }

    //--------------------------------------------------------------------------
    //Cleans the cache and get the cluster information
    //--------------------------------------------------------------------------

    rc = clpool->set_up();

    if ( rc != 0 )
    {
        return rc;
    }

    //--------------------------------------------------------------------------
    //Add to each host the corresponding cluster template
    //--------------------------------------------------------------------------

    hpool->merge_clusters(clpool);

    //--------------------------------------------------------------------------
    //Cleans the cache and get the ACLs
    //--------------------------------------------------------------------------

    rc = acls->set_up();

    if ( rc != 0 )
    {
        return rc;
    }

    return 0;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Scheduler::match_schedule()
{
    VirtualMachineXML * vm;

    int vm_memory;
    int vm_cpu;
    int vm_disk;

    int oid;
    int uid;
    int gid;
    int n_hosts;
    int n_matched;
    int n_auth;
    int n_error;

    string reqs;
    string ds_reqs;

    HostXML * host;
    DatastoreXML *ds;

    char *    error;
    bool      matched;

    int       rc;

    map<int, ObjectXML*>::const_iterator  vm_it;
    map<int, ObjectXML*>::const_iterator  h_it;

    vector<SchedulerPolicy *>::iterator it;

    const map<int, ObjectXML*> pending_vms = vmpool->get_objects();
    const map<int, ObjectXML*> hosts       = hpool->get_objects();
    const map<int, ObjectXML*> datastores  = dspool->get_objects();

    for (vm_it=pending_vms.begin(); vm_it != pending_vms.end(); vm_it++)
    {
        vm = static_cast<VirtualMachineXML*>(vm_it->second);

        reqs = vm->get_requirements();

        oid = vm->get_oid();
        uid = vm->get_uid();
        gid = vm->get_gid();

        vm->get_requirements(vm_cpu,vm_memory,vm_disk);

        n_hosts   = 0;
        n_matched = 0;
        n_auth    = 0;
        n_error   = 0;

        // ---------------------------------------------------------------------
        // Match hosts for this VM that:
        //  1. Fulfills ACL
        //  2. Meets user/policy requirements
        //  3. Have enough capacity to host the VM
        // ---------------------------------------------------------------------

        for (h_it=hosts.begin(), matched=false; h_it != hosts.end(); h_it++)
        {
            host = static_cast<HostXML *>(h_it->second);

            // -----------------------------------------------------------------
            // Check if user is authorized
            // -----------------------------------------------------------------

            matched = false;

            if ( uid == 0 || gid == 0 )
            {
                matched = true;
            }
            else
            {
                PoolObjectAuth host_perms;

                host_perms.oid      = host->get_hid();
                host_perms.obj_type = PoolObjectSQL::HOST;

                // Even if the owner is in several groups, this request only
                // uses the VM group ID

                set<int> gids;
                gids.insert(gid);

                matched = acls->authorize(uid,
                                          gids,
                                          host_perms,
                                          AuthRequest::MANAGE);
            }

            if ( matched == false )
            {
                ostringstream oss;

                oss << "VM " << oid << ": Host " << host->get_hid()
                    << " filtered out. User is not authorized to "
                    << AuthRequest::operation_to_str(AuthRequest::MANAGE)
                    << " it.";

                NebulaLog::log("SCHED",Log::DEBUG,oss);
                continue;
            }

            n_auth++;

            // -----------------------------------------------------------------
            // Evaluate VM requirements
            // -----------------------------------------------------------------

            if (!reqs.empty())
            {
                rc = host->eval_bool(reqs,matched,&error);

                if ( rc != 0 )
                {
                    ostringstream oss;
                    ostringstream error_msg;

                    matched = false;
                    n_error++;

                    error_msg << "Error in SCHED_REQUIREMENTS: '" << reqs
                              << "', error: " << error;

                    oss << "VM " << oid << ": " << error_msg.str();

                    NebulaLog::log("SCHED",Log::ERROR,oss);

                    vm->log(error_msg.str());

                    free(error);

                    break;
                }
            }
            else
            {
                matched = true;
            }

            if ( matched == false )
            {
                ostringstream oss;

                oss << "VM " << oid << ": Host " << host->get_hid() <<
                    " filtered out. It does not fulfill SCHED_REQUIREMENTS.";

                NebulaLog::log("SCHED",Log::DEBUG,oss);
                continue;
            }

            n_matched++;

            // -----------------------------------------------------------------
            // Check host capacity
            // -----------------------------------------------------------------
            if (host->test_capacity(vm_cpu,vm_memory,vm_disk) == true)
            {
                vm->add_match_host(host->get_hid());

                n_hosts++;
            }
            else
            {
                ostringstream oss;

                oss << "VM " << oid << ": Host " << host->get_hid()
                    << " filtered out. Not enough capacity.";

                NebulaLog::log("SCHED",Log::DEBUG,oss);
            }
        }

        // ---------------------------------------------------------------------
        // Log scheduling errors to VM user if any
        // ---------------------------------------------------------------------

        if (n_hosts == 0) //No hosts assigned, let's see why
        {
            if (n_error == 0) //No syntax error
            {
                if (hosts.size() == 0)
                {
                    vm->log("No hosts enabled to run VMs");
                }
                else if (n_auth == 0)
                {
                    vm->log("User is not authorized to use any host");
                }
                else if (n_matched == 0)
                {
                    vm->log("No host meets SCHED_REQUIREMENTS");
                }
                else
                {
                    vm->log("No host with enough capacity to deploy the VM");
                }
            }

            vmpool->update(vm);

            continue;
        }

        // ---------------------------------------------------------------------
        // Schedule matched hosts
        // ---------------------------------------------------------------------

        for (it=host_policies.begin() ; it != host_policies.end() ; it++)
        {
            (*it)->schedule(vm);
        }

        vm->sort_match_hosts();

        if (vm->is_resched()) //Do not schedule storage for migrations
        {
            continue;
        }

        // ---------------------------------------------------------------------
        // Match datastores for this VM that:
        //  2. Meets requirements
        //  3. Have enough capacity to host the VM
        // ---------------------------------------------------------------------

        ds_reqs = vm->get_ds_requirements();

        n_hosts   = 0;
        n_matched = 0;
        n_error   = 0;

        for (h_it=datastores.begin(), matched=false; h_it != datastores.end(); h_it++)
        {
            ds = static_cast<DatastoreXML *>(h_it->second);

            // -----------------------------------------------------------------
            // Evaluate VM requirements
            // -----------------------------------------------------------------
            if (!ds_reqs.empty())
            {
                rc = ds->eval_bool(ds_reqs, matched, &error);

                if ( rc != 0 )
                {
                    ostringstream oss;
                    ostringstream error_msg;

                    matched = false;
                    n_error++;

                    error_msg << "Error in SCHED_DS_REQUIREMENTS: '" << ds_reqs
                              << "', error: " << error;

                    oss << "VM " << oid << ": " << error_msg.str();

                    NebulaLog::log("SCHED",Log::ERROR,oss);

                    vm->log(error_msg.str());

                    free(error);

                    break;
                }
            }
            else
            {
                matched = true;
            }

            if ( matched == false )
            {
                ostringstream oss;

                oss << "VM " << oid << ": Datastore " << ds->get_oid() <<
                    " filtered out. It does not fulfill SCHED_DS_REQUIREMENTS.";

                NebulaLog::log("SCHED",Log::DEBUG,oss);
                continue;
            }

            n_matched++;

            // -----------------------------------------------------------------
            // Check datastore capacity
            // -----------------------------------------------------------------

            if (ds->test_capacity(vm_disk))
            {
                vm->add_match_datastore(ds->get_oid());

                n_hosts++;
            }
            else
            {
                ostringstream oss;

                oss << "VM " << oid << ": Datastore " << ds->get_oid()
                    << " filtered out. Not enough capacity.";

                NebulaLog::log("SCHED",Log::DEBUG,oss);
            }
        }

        // ---------------------------------------------------------------------
        // Log scheduling errors to VM user if any
        // ---------------------------------------------------------------------

        if (n_hosts == 0) //No datastores assigned, let's see why
        {
            if (n_error == 0) //No syntax error
            {
                if (datastores.size() == 0)
                {
                    vm->log("No system datastores found to run VMs");
                }
                else if (n_matched == 0)
                {
                    vm->log("No system datastore meets SCHED_DS_REQUIREMENTS");
                }
                else
                {
                    vm->log("No system datastore with enough capacity for the VM");
                }
            }

            vm->clear_match_hosts();

            vmpool->update(vm);

            continue;
        }

        // ---------------------------------------------------------------------
        // Schedule matched datastores
        // ---------------------------------------------------------------------

        for (it=ds_policies.begin() ; it != ds_policies.end() ; it++)
        {
            (*it)->schedule(vm);
        }

        vm->sort_match_datastores();
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Scheduler::dispatch()
{
    HostXML *           host;
    DatastoreXML *      ds;
    VirtualMachineXML * vm;

    ostringstream       oss;

    int cpu, mem, dsk;
    int hid, dsid, cid;

    unsigned int dispatched_vms = 0;

    map<int, unsigned int>  host_vms;
    pair<map<int,unsigned int>::iterator, bool> rc;

    vector<Resource *>::const_reverse_iterator i, j;
    const map<int, ObjectXML*> pending_vms = vmpool->get_objects();

    //--------------------------------------------------------------------------
    // Print the VMs to schedule and the selected hosts for each one
    //--------------------------------------------------------------------------

    oss << "Scheduling Results:" << endl;

    for (map<int, ObjectXML*>::const_iterator vm_it=pending_vms.begin();
        vm_it != pending_vms.end(); vm_it++)
    {
        vm = static_cast<VirtualMachineXML*>(vm_it->second);

        oss << *vm;
    }

    NebulaLog::log("SCHED", Log::INFO, oss);

    //--------------------------------------------------------------------------
    // Dispatch each VM till we reach the dispatch limit
    //--------------------------------------------------------------------------

    for (map<int, ObjectXML*>::const_iterator vm_it=pending_vms.begin();
         vm_it != pending_vms.end() &&
            ( dispatch_limit <= 0 || dispatched_vms < dispatch_limit );
         vm_it++)
    {
        vm = static_cast<VirtualMachineXML*>(vm_it->second);

        vm->get_requirements(cpu,mem,dsk);

        //----------------------------------------------------------------------
        // Get the highest ranked host and best System DS for it
        //----------------------------------------------------------------------
        const vector<Resource *> resources = vm->get_match_hosts();

        for (i = resources.rbegin() ; i != resources.rend() ; i++)
        {
            hid  = (*i)->oid;
            host = hpool->get(hid);

            if ( host == 0 )
            {
                continue;
            }

            cid = host->get_cid();

            //------------------------------------------------------------------
            // Test host capcity
            //------------------------------------------------------------------
            if (host->test_capacity(cpu,mem,dsk) != true)
            {
                continue;
            }

            //------------------------------------------------------------------
            // Test host dispatch limit (init counter if needed)
            //------------------------------------------------------------------
            rc = host_vms.insert(make_pair(hid,0));

            if (rc.first->second >= host_dispatch_limit)
            {
                continue;
            }

            //------------------------------------------------------------------
            // Migrate VM if reschedule VM, skip DS selection
            //------------------------------------------------------------------
            if (vm->is_resched())
            {
                host->add_capacity(cpu,mem,dsk);

                host_vms[hid]++;

                vmpool->dispatch(vm_it->first, hid, -1, true); //migrate VM

                break;
            }

            //------------------------------------------------------------------
            // Get the highest ranked datastore
            //------------------------------------------------------------------
            const vector<Resource *> ds_resources = vm->get_match_datastores();

            dsid = -1;

            for (j = ds_resources.rbegin() ; j != ds_resources.rend() ; j++)
            {
                ds = dspool->get((*j)->oid);

                if ( ds == 0 )
                {
                    continue;
                }

                //--------------------------------------------------------------
                // Test cluster membership for datastore and selected host
                //--------------------------------------------------------------
                if (ds->get_cid() != cid)
                {
                    continue;
                }

                //--------------------------------------------------------------
                // Test datastore capcity
                //--------------------------------------------------------------
                if (ds->test_capacity(dsk) != true)
                {
                    continue;
                }

                //--------------------------------------------------------------
                //Select this DS to dispatch VM
                //--------------------------------------------------------------
                dsid = (*j)->oid;

                break;
            }

            if (dsid == -1)
            {
                ostringstream oss;

                oss << "No suitable System DS found for Host: " << hid
                    << ". Filtering out host.";

                NebulaLog::log("SCHED", Log::INFO, oss);

                continue;
            }

            //------------------------------------------------------------------
            // Dispatch and update host and DS capacity, and dispatch counters
            //------------------------------------------------------------------
            if (vmpool->dispatch(vm_it->first, hid, dsid, false) != 0)
            {
                continue;
            }

            ds->add_capacity(dsk);

            host->add_capacity(cpu,mem,dsk);

            host_vms[hid]++;

            dispatched_vms++;

            break;
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int Scheduler::do_scheduled_actions()
{
    VirtualMachineXML* vm;

    const map<int, ObjectXML*>  vms = vmapool->get_objects();
    map<int, ObjectXML*>::const_iterator vm_it;

    vector<Attribute *> attributes;
    vector<Attribute *>::iterator it;

    VectorAttribute* vatt;

    int action_time;
    int done_time;
    int has_time;
    int has_done;

    string action_st, error_msg;

    time_t the_time = time(0);
    string time_str = one_util::log_time(the_time);

    for (vm_it=vms.begin(); vm_it != vms.end(); vm_it++)
    {
        vm = static_cast<VirtualMachineXML*>(vm_it->second);

        vm->get_actions(attributes);

        // TODO: Sort actions by TIME
        for (it=attributes.begin(); it != attributes.end(); it++)
        {
            vatt = dynamic_cast<VectorAttribute*>(*it);

            if (vatt == 0)
            {
                delete *it;

                continue;
            }

            has_time  = vatt->vector_value("TIME", action_time);
            has_done  = vatt->vector_value("DONE", done_time);
            action_st = vatt->vector_value("ACTION");

            if (has_time == 0 && has_done == -1 && action_time < the_time)
            {
                ostringstream oss;

                int rc = VirtualMachineXML::parse_action_name(action_st);

                oss << "Executing action '" << action_st << "' for VM "
                    << vm->get_oid() << " : ";

                if ( rc != 0 )
                {
                    error_msg = "This action is not supported.";
                }
                else
                {
                    rc = vmapool->action(vm->get_oid(), action_st, error_msg);
                }

                if (rc == 0)
                {
                    vatt->remove("MESSAGE");
                    vatt->replace("DONE", static_cast<int>(the_time));

                    oss << "Success.";
                }
                else
                {
                    ostringstream oss_aux;

                    oss_aux << time_str << " : " << error_msg;

                    vatt->replace("MESSAGE", oss_aux.str());

                    oss << "Failure. " << error_msg;
                }

                NebulaLog::log("VM", Log::INFO, oss);
            }

            vm->set_attribute(vatt);
        }

        vmpool->update(vm);
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Scheduler::do_action(const string &name, void *args)
{
    int rc;

    if (name == ACTION_TIMER)
    {
        rc = vmapool->set_up();

        if ( rc == 0 )
        {
            do_scheduled_actions();
        }

        rc = set_up_pools();

        if ( rc != 0 )
        {
            return;
        }

        match_schedule();

        dispatch();
    }
    else if (name == ACTION_FINALIZE)
    {
        NebulaLog::log("SCHED",Log::INFO,"Stopping the scheduler...");
    }
}
