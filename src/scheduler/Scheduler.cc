/* -------------------------------------------------------------------------- */
/* Copyright 2002-2008, Distributed Systems Architecture Group, Universidad   */
/* Complutense de Madrid (dsa-research.org)                                   */
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

#include <pthread.h>

#include <cmath>

#include "Scheduler.h"
#include "RankPolicy.h"

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

    Scheduler::log("SCHED",Log::INFO,"Scheduler loop started.");
    
    sched->am.loop(sched->timer,0);

    Scheduler::log("SCHED",Log::INFO,"Scheduler loop stopped.");
    
    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Scheduler::start()
{
    int             rc;

    string          nebula_location;
    const char *    nl;

    pthread_attr_t    pattr;

    nl = getenv("ONE_LOCATION");

    if (nl == 0)
    {
        throw runtime_error("Environment variable ONE_LOCATION not defined");
    }

    nebula_location = nl;

    // -----------------------------------------------------------
    // Log system
    // -----------------------------------------------------------

    try
    {
        string log_fname;

        log_fname = nebula_location + "/var/sched.log";

        Scheduler::log("SCHED",
                        Log::INFO,
                        "Init Scheduler Log system",
                        log_fname.c_str());
    }
    catch(runtime_error &)
    {
        throw;
    }

    // -----------------------------------------------------------
    // Pools
    // -----------------------------------------------------------

    try
    {
        string db_name = nebula_location + "/var/one.db";
        
        db = new SqliteDB(db_name,Scheduler::log);
    }
    catch (exception&)
    {
        throw;
    }

    try
    {
        string db_name = nebula_location + "/var/one.db";
        
        hpool  = new SchedulerHostPool(db);
        vmpool = new SchedulerVirtualMachinePool(db);
    }
    catch (exception&)
    {
        throw;
    }

    // -----------------------------------------------------------
    // Load scheduler policies
    // -----------------------------------------------------------

    register_policies();

    // -----------------------------------------------------------
    // Close stds, we no longer need them
    // -----------------------------------------------------------

    int fd;

    fd = open("/dev/null", O_RDWR|O_CREAT);

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

    Scheduler::log("SCHED",Log::INFO,"Starting scheduler loop...");
    
    pthread_attr_init (&pattr);
    pthread_attr_setdetachstate (&pattr, PTHREAD_CREATE_JOINABLE);

    rc = pthread_create(&sched_thread,&pattr,scheduler_action_loop,(void *) this);

    if ( rc != 0 )
    {
        Scheduler::log("SCHED",Log::ERROR,
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
    //Cleans the cache and get the hosts ids
    //--------------------------------------------------------------------------

    rc = hpool->set_up();

    if ( rc != 0 )
    {
        return rc;
    }

    //--------------------------------------------------------------------------
    //Cleans the cache and get the pending VMs
    //--------------------------------------------------------------------------

    rc = vmpool->set_up();

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
    SchedulerVirtualMachine *   vm;
    int                         vm_memory;
    int                         vm_cpu;
    int                         vm_disk;
    string                      reqs;

    SchedulerHost * host;
    int             host_memory;
    int             host_cpu;
    char *          error;
    bool            matched;

    int             rc;

    for (unsigned int i= 0; i < vmpool->pending_vms.size(); i++)
    {
        vm = vmpool->get(vmpool->pending_vms[i],false);

        if ( vm == 0 )
        {
            continue;
        }

        vm->get_template_attribute("REQUIREMENTS",reqs);

        for (unsigned int j=0;j<hpool->hids.size();j++)
        {
            host = hpool->get(hpool->hids[j],false);

            if ( host == 0 )
            {
                continue;
            }

            // -----------------------------------------------------------------
            // Evaluate VM requirements
            // -----------------------------------------------------------------

            if (reqs != "")
            {
                rc = host->match(reqs,matched,&error);

                if ( rc != 0 )
                {
                    ostringstream oss;

                    matched = false;

                    oss << "Error evaluating expresion: " << reqs
                    << ", error: " << error;
                    Scheduler::log("HOST",Log::ERROR,oss);

                    free(error);
                }
            }
            else
            {
                matched = true;
            }

            if ( matched == false )
            {
                continue;
            }

            // -----------------------------------------------------------------
            // Check host capacity
            // -----------------------------------------------------------------

            vm->get_requirements(vm_cpu,vm_memory,vm_disk);

            host->get_capacity(host_cpu, host_memory, threshold);

            if ((vm_memory <= host_memory) && (vm_cpu <= host_cpu))
            {
                if (host->test_vm(vm_cpu,vm_memory,vm_disk) == true)
                {
                	vm->add_host(host->get_hid());
                }
            }
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
    vector<int>::iterator                   jt;
    vector<int>::iterator                   kt;
    SchedulerVirtualMachine *               vm;

    ostringstream                   oss;

    vector<float>   total;
    vector<float>   policy;

    for (jt=vmpool->pending_vms.begin();jt!=vmpool->pending_vms.end();jt++)
    {
        vm = vmpool->get(*jt,false);
        
        if ( vm == 0 )
        {
            oss << "Can not get VM id=" <<  *jt;
            Scheduler::log("HOST",Log::ERROR,oss);
            continue;
        }

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
    vector<int>::iterator   it;

    SchedulerVirtualMachine *   vm;
    ostringstream               oss;

    int hid;
    int rc;

    oss << "Select hosts" << endl;
    oss << "\tPRI\tHID\tHSID" << endl;
    oss << "\t-------------------" << endl;

    for (it=vmpool->pending_vms.begin();it!=vmpool->pending_vms.end();it++)
    {
        vm = vmpool->get(*it,false);
        
        if ( vm != 0 )
        {
        	oss << "Virtual Machine: " << vm->get_oid() << "\n" << *vm << endl;
        }
    }

    Scheduler::log("SCHED",Log::INFO,oss);

    for (it=vmpool->pending_vms.begin();it!=vmpool->pending_vms.end();it++)
    {
        vm = vmpool->get(*it,false);

        if ( vm == 0 )
        {
            continue;
        }

        rc = vm->get_host(hid,hpool);

        if (rc == 0)
        {
            xmlrpc_c::value             deploy_result;
            
            oss.str("");
            oss << "Dispatching virtual machine " << vm->get_oid()
            	<< " to HID: " << hid;
            
            Scheduler::log("SCHED",Log::INFO,oss);

            // Tell ONE about the decision

            try
            {
                xmlrpc_client.call(
                    one_url,
                    "one.vmdeploy",
                    "sii",
                    &deploy_result,
                    "session",
                    vm->get_oid(),
                    hid);
            }
            catch (exception &e)
            {
                oss.str("");
                oss << "Exception raised: " << e.what() << '\n';

                Scheduler::log("SCHED",Log::ERROR,oss);
                break;
            }

            // See how ONE handled the deployment

            xmlrpc_c::value_array         result(deploy_result);
            vector<xmlrpc_c::value> const param_array(result.vectorValueValue());
            xmlrpc_c::value_boolean const result_correct(param_array[0]);

            if ( static_cast<bool>(result_correct) != true )
            {
                xmlrpc_c::value_string const info(param_array[1]);

                oss.str("");
                oss << "Error deploying virtual machine " << vm->get_oid()
                << " to HID: " << hid
                << ". Reason: " << static_cast<string>(info);

                Scheduler::log("SCHED",Log::ERROR,oss);
            }
        }
    }
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */


void Scheduler::do_action(const string &name, void *args)
{
    int rc;

    if (name == ACTION_TIMER)
    {
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
        Scheduler::log("SCHED",Log::INFO,"Stopping the scheduler...");
    }
}
