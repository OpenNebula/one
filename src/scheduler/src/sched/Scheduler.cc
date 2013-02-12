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

    //--------------------------------------------------------------------------
    //Get the matching hosts for each VM
    //--------------------------------------------------------------------------

    match();

    return 0;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Scheduler::match()
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

    HostXML * host;
    char *    error;
    bool      matched;

    int       rc;

    map<int, ObjectXML*>::const_iterator  vm_it;
    map<int, ObjectXML*>::const_iterator  h_it;

    const map<int, ObjectXML*> pending_vms = vmpool->get_objects();
    const map<int, ObjectXML*> hosts = hpool->get_objects();

    for (vm_it=pending_vms.begin(); vm_it != pending_vms.end(); vm_it++)
    {
        vm = static_cast<VirtualMachineXML*>(vm_it->second);

        reqs = vm->get_requirements();

        oid  = vm->get_oid();
        uid  = vm->get_uid();
        gid  = vm->get_gid();

        n_hosts   = 0;
        n_matched = 0;
        n_auth    = 0;
        n_error   = 0;

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

                matched = acls->authorize(uid,
                                          gid,
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

            if (reqs != "")
            {
                rc = host->eval_bool(reqs,matched,&error);

                if ( rc != 0 )
                {
                    ostringstream oss;
                    ostringstream error_msg;

                    matched = false;
                    n_error++;

                    error_msg << "Error evaluating SCHED_REQUIREMENTS expression: '"
                            << reqs << "', error: " << error;

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

            vm->get_requirements(vm_cpu,vm_memory,vm_disk);

            if (host->test_capacity(vm_cpu,vm_memory,vm_disk) == true)
            {
                vm->add_host(host->get_hid());

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
                    vm->log("No host meets the SCHED_REQUIREMENTS expression");
                }
                else
                {
                    vm->log("No host with enough capacity to deploy the VM");
                }
            }

            vmpool->update(vm);
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static float sum_operator (float i, float j)
{
    return i+j;
}

/* -------------------------------------------------------------------------- */

int Scheduler::schedule()
{
    vector<SchedulerHostPolicy *>::iterator it;

    VirtualMachineXML * vm;
    ostringstream       oss;

    vector<float>   total;
    vector<float>   policy;

    map<int, ObjectXML*>::const_iterator  vm_it;

    const map<int, ObjectXML*> pending_vms = vmpool->get_objects();

    for (vm_it=pending_vms.begin(); vm_it != pending_vms.end(); vm_it++)
    {
        vm = static_cast<VirtualMachineXML*>(vm_it->second);

        total.clear();

        for ( it=host_policies.begin();it!=host_policies.end();it++)
        {
            policy = (*it)->get(vm);

            if (total.empty() == true)
            {
                total = policy;
            }
            else
            {
                transform(
                    total.begin(),
                    total.end(),
                    policy.begin(),
                    total.begin(),
                    sum_operator);
            }
        }

        vm->set_priorities(total);
    }

    return 0;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Scheduler::dispatch()
{
    VirtualMachineXML * vm;
    ostringstream       oss;

    int             hid;
    int             rc;
    unsigned int    dispatched_vms;

    map<int, ObjectXML*>::const_iterator  vm_it;
    const map<int, ObjectXML*>            pending_vms = vmpool->get_objects();

    map<int, int>  host_vms;

    oss << "Selected hosts:" << endl;

    for (vm_it=pending_vms.begin(); vm_it != pending_vms.end(); vm_it++)
    {
        vm = static_cast<VirtualMachineXML*>(vm_it->second);

        oss << *vm;
    }

    NebulaLog::log("SCHED",Log::INFO,oss);

    dispatched_vms = 0;
    for (vm_it=pending_vms.begin();
         vm_it != pending_vms.end() && ( dispatch_limit <= 0 ||
                                         dispatched_vms < dispatch_limit );
         vm_it++)
    {
        vm = static_cast<VirtualMachineXML*>(vm_it->second);

        rc = vm->get_host(hid,hpool,host_vms,host_dispatch_limit);

        if (rc == 0)
        {
            rc = vmpool->dispatch(vm_it->first, hid, vm->is_resched());

            if (rc == 0 && !vm->is_resched())
            {
                dispatched_vms++;
            }
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

        rc = schedule();

        if ( rc != 0 )
        {
            return;
        }

        dispatch();
    }
    else if (name == ACTION_FINALIZE)
    {
        NebulaLog::log("SCHED",Log::INFO,"Stopping the scheduler...");
    }
}
