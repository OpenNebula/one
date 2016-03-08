/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

static double profile(bool start, const string& message="")
{
    static struct timespec estart, eend;
    double t;

    if (start)
    {
        clock_gettime(CLOCK_MONOTONIC, &estart);

        if (!message.empty())
        {
            NebulaLog::log("SCHED", Log::DDEBUG, message);
        }

        return 0;
    }

    clock_gettime(CLOCK_MONOTONIC, &eend);

    t = (eend.tv_sec + (eend.tv_nsec * pow(10,-9))) -
        (estart.tv_sec+(estart.tv_nsec*pow(10,-9)));

    if (!message.empty())
    {
        ostringstream oss;

        oss << message << " Total time: " << one_util::float_to_str(t) << "s";
        NebulaLog::log("SCHED", Log::DDEBUG, oss);
    }

    return t;
}

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

    // -----------------------------------------------------------
    // Log system & Configuration File
    // -----------------------------------------------------------

    try
    {
        NebulaLog::LogType log_system = NebulaLog::UNDEFINED;
        Log::MessageType   clevel     = Log::ERROR;;

        const VectorAttribute * log = conf.get("LOG");

        if ( log != 0 )
        {
            string value;
            int    ilevel;

            value      = log->vector_value("SYSTEM");
            log_system = NebulaLog::str_to_type(value);

            value  = log->vector_value("DEBUG_LEVEL");
            ilevel = atoi(value.c_str());

            if (Log::ERROR <= ilevel && ilevel <= Log::DDDEBUG)
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
        long long message_size;

        conf.get("MESSAGE_SIZE", message_size);

        Client::initialize("", url, message_size);

        oss.str("");

        oss << "XML-RPC client using " << (Client::client())->get_message_size()
            << " bytes for response buffer.\n";

        NebulaLog::log("SCHED", Log::INFO, oss);
    }
    catch(runtime_error &)
    {
        throw;
    }

    xmlInitParser();

    // -------------------------------------------------------------------------
    // Get oned configuration, and init zone_id
    // -------------------------------------------------------------------------

    while (1)
    {
        try
        {
            xmlrpc_c::value result;
            vector<xmlrpc_c::value> values;

            Client * client = Client::client();

            client->call(client->get_endpoint(), "one.system.config", "s",
                    &result, client->get_oneauth().c_str());

            values = xmlrpc_c::value_array(result).vectorValueValue();

            bool   success = xmlrpc_c::value_boolean(values[0]);
            string message = xmlrpc_c::value_string(values[1]);

            if (!success ||(oned_conf.from_xml(message) != 0))
            {
                ostringstream oss;

                oss << "Cannot contact oned, will retry... Error: " << message;

                NebulaLog::log("SCHED", Log::ERROR, oss);
            }

            break;
        }
        catch (exception const& e)
        {
            ostringstream oss;

            oss << "Cannot contact oned, will retry... Error: " << e.what();

            NebulaLog::log("SCHED", Log::ERROR, oss);
        }

        sleep(2);
    }

    NebulaLog::log("SCHED", Log::INFO, "oned successfully contacted.");

    zone_id = 0;

    const VectorAttribute * fed = oned_conf.get("FEDERATION");

    if (fed != 0)
    {
        if (fed->vector_value("ZONE_ID", zone_id) != 0)
        {
            zone_id = 0;
        }
    }

    oss.str("");
    oss << "Configuring scheduler for Zone ID: " << zone_id;

    NebulaLog::log("SCHED", Log::INFO, oss);

    // -------------------------------------------------------------------------
    // Pools
    // -------------------------------------------------------------------------

    hpool  = new HostPoolXML(Client::client());
    upool  = new UserPoolXML(Client::client());
    clpool = new ClusterPoolXML(Client::client());
    vmpool = new VirtualMachinePoolXML(Client::client(), machines_limit,
            live_rescheds==1);

    vmapool = new VirtualMachineActionsPoolXML(Client::client(), machines_limit);

    dspool     = new SystemDatastorePoolXML(Client::client());
    img_dspool = new ImageDatastorePoolXML(Client::client());

    acls = new AclXML(Client::client(), zone_id);

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

    rc = img_dspool->set_up();

    if ( rc != 0 )
    {
        return rc;
    }

    //--------------------------------------------------------------------------
    //Cleans the cache and get the hosts ids
    //--------------------------------------------------------------------------

    rc = upool->set_up();

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
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 *  Match hosts for this VM that:
 *    1. Fulfills ACL
 *    2. Meets user/policy requirements
 *    3. Have enough capacity to host the VM
 *
 *  @param acl pool
 *  @param users the user pool
 *  @param vm the virtual machine
 *  @param vm_memory vm requirement
 *  @param vm_cpu vm requirement
 *  @param vm_pci vm requirement
 *  @param host to evaluate vm assgiment
 *  @param n_auth number of hosts authorized for the user, incremented if needed
 *  @param n_error number of requirement errors, incremented if needed
 *  @param n_fits number of hosts with capacity that fits the VM requirements
 *  @param n_matched number of hosts that fullfil VM sched_requirements
 *  @param error, string describing why the host is not valid
 *  @return true for a positive match
 */
static bool match_host(AclXML * acls, UserPoolXML * upool, VirtualMachineXML* vm,
    int vmem, int vcpu, vector<VectorAttribute *>& vpci, HostXML * host,
    int &n_auth, int& n_error, int &n_fits, int &n_matched, string &error)
{
    // -------------------------------------------------------------------------
    // Filter current Hosts for resched VMs
    // -------------------------------------------------------------------------
    if (vm->is_resched() && vm->get_hid() == host->get_hid())
    {
        error = "VM cannot be migrated to its current Host.";
        return false;
    }

    // -------------------------------------------------------------------------
    // Check that VM can be deployed in local hosts
    // -------------------------------------------------------------------------
    if (vm->is_only_public_cloud() && !host->is_public_cloud())
    {
        error = "VM requires a Public Cloud Host, but it's local.";
        return false;
    }

    // -------------------------------------------------------------------------
    // Check if user is authorized
    // -------------------------------------------------------------------------
    if ( vm->get_uid() != 0 && vm->get_gid() != 0 )
    {
        PoolObjectAuth hperms;

        hperms.oid      = host->get_hid();
        hperms.cid      = host->get_cid();
        hperms.obj_type = PoolObjectSQL::HOST;

        UserXML * user = upool->get(vm->get_uid());

        if (user == 0)
        {
            error = "User does not exists.";
            return false;
        }

        const vector<int> vgids = user->get_gids();

        set<int> gids(vgids.begin(), vgids.end());

        if ( !acls->authorize(vm->get_uid(), gids, hperms, AuthRequest::MANAGE))
        {
            error = "Permission denied.";
            return false;
        }
    }

    n_auth++;

    // -------------------------------------------------------------------------
    // Check host capacity
    // -------------------------------------------------------------------------
    if (host->test_capacity(vcpu, vmem, vpci, error) != true)
    {
        return false;
    }

    n_fits++;

    // -------------------------------------------------------------------------
    // Evaluate VM requirements
    // -------------------------------------------------------------------------
    if (!vm->get_requirements().empty())
    {
        char * estr;
        bool   matched;

        if ( host->eval_bool(vm->get_requirements(), matched, &estr) != 0 )
        {
            ostringstream oss;

            n_error++;

            oss << "Error in SCHED_REQUIREMENTS: '" << vm->get_requirements()
                << "', error: " << estr;

            vm->log(oss.str());

            error = oss.str();

            free(estr);

            return false;
        }

        if (matched == false)
        {
            error = "It does not fulfill SCHED_REQUIREMENTS.";
            return false;
        }
    }

    n_matched++;

    return true;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 *  Match system DS's for this VM that:
 *    1. Meet user/policy requirements
 *    2. Have enough capacity to host the VM
 *
 *  @param acl pool
 *  @param users the user pool
 *  @param vm the virtual machine
 *  @param vdisk vm requirement
 *  @param ds to evaluate vm assgiment
 *  @param n_auth number of ds authorized for the user, incremented if needed
 *  @param n_error number of requirement errors, incremented if needed
 *  @param n_matched number of system ds that fullfil VM sched_requirements
 *  @param n_fits number of system ds with capacity that fits the VM requirements
 *  @param error, string describing why the host is not valid
 *  @return true for a positive match
 */
static bool match_system_ds(AclXML * acls, UserPoolXML * upool,
    VirtualMachineXML* vm, long long vdisk, DatastoreXML * ds, int& n_auth,
    int& n_error, int& n_fits, int &n_matched, string &error)
{
    // -------------------------------------------------------------------------
    // Check if user is authorized
    // -------------------------------------------------------------------------
    if ( vm->get_uid() != 0 && vm->get_gid() != 0 )
    {
        PoolObjectAuth dsperms;

        ds->get_permissions(dsperms);

        UserXML * user = upool->get(vm->get_uid());

        if (user == 0)
        {
            error = "User does not exists.";
            return false;
        }

        const vector<int> vgids = user->get_gids();

        set<int> gids(vgids.begin(), vgids.end());

        if ( !acls->authorize(vm->get_uid(), gids, dsperms, AuthRequest::USE))
        {
            error = "Permission denied.";
            return false;
        }
    }

    n_auth++;

    // -------------------------------------------------------------------------
    // Check datastore capacity for shared systems DS (non-shared will be
    // checked in a per host basis during dispatch). Resume actions do not
    // add to shared system DS usage, and are skipped also
    // -------------------------------------------------------------------------
    if (ds->is_shared() && ds->is_monitored() && !vm->is_resume() &&
        !ds->test_capacity(vdisk, error))
    {
        return false;
    }

    n_fits++;

    // -------------------------------------------------------------------------
    // Evaluate VM requirements
    // -------------------------------------------------------------------------
    if (!vm->get_ds_requirements().empty())
    {
        char * estr;
        bool   matched;

        if ( ds->eval_bool(vm->get_ds_requirements(), matched, &estr) != 0 )
        {
            ostringstream oss;

            n_error++;

            oss << "Error in SCHED_DS_REQUIREMENTS: '"
                << vm->get_ds_requirements() << "', error: " << error;

            vm->log(oss.str());

            free(estr);
        }

        if (matched == false)
        {
            error = "It does not fulfill SCHED_DS_REQUIREMENTS.";
            return false;
        }
    }

    n_matched++;

    return true;
}

/* -------------------------------------------------------------------------- */

static void log_match(int vid, const string& msg)
{
    ostringstream oss;

    oss << "Match-making results for VM " << vid << ":\n\t" << msg << endl;

    NebulaLog::log("SCHED", Log::DEBUG, oss);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Scheduler::match_schedule()
{
    VirtualMachineXML * vm;

    int vm_memory;
    int vm_cpu;
    long long vm_disk;
    vector<VectorAttribute *> vm_pci;

    int n_resources;
    int n_matched;
    int n_auth;
    int n_error;
    int n_fits;

    HostXML * host;
    DatastoreXML *ds;

    string m_error;

    map<int, ObjectXML*>::const_iterator  vm_it;
    map<int, ObjectXML*>::const_iterator  h_it;

    vector<SchedulerPolicy *>::iterator it;

    const map<int, ObjectXML*> pending_vms = vmpool->get_objects();
    const map<int, ObjectXML*> hosts       = hpool->get_objects();
    const map<int, ObjectXML*> datastores  = dspool->get_objects();
    const map<int, ObjectXML*> users       = upool->get_objects();

    double total_match_time = 0;
    double total_rank_time = 0;

    time_t stime = time(0);

    for (vm_it=pending_vms.begin(); vm_it != pending_vms.end(); vm_it++)
    {
        vm = static_cast<VirtualMachineXML*>(vm_it->second);

        vm->get_requirements(vm_cpu, vm_memory, vm_disk, vm_pci);

        n_resources = 0;
        n_fits    = 0;
        n_matched = 0;
        n_auth    = 0;
        n_error   = 0;

        //----------------------------------------------------------------------
        // Test Image Datastore capacity, but not for migrations or resume
        //----------------------------------------------------------------------
        if (!vm->is_resched() && !vm->is_resume())
        {
            if (vm->test_image_datastore_capacity(img_dspool, m_error) == false)
            {
                if (vm->is_public_cloud()) //No capacity needed for public cloud
                {
                    vm->set_only_public_cloud();
                }
                else
                {
                    log_match(vm->get_oid(), "Cannot schedule VM. "+m_error);

                    vm->log("Cannot schedule VM. "+m_error);
                    vmpool->update(vm);

                    continue;
                }
            }
        }

        // ---------------------------------------------------------------------
        // Match hosts for this VM.
        // ---------------------------------------------------------------------
        profile(true);

        for (h_it=hosts.begin(); h_it != hosts.end(); h_it++)
        {
            host = static_cast<HostXML *>(h_it->second);

            if (match_host(acls, upool, vm, vm_memory, vm_cpu, vm_pci, host,
                    n_auth, n_error, n_fits, n_matched, m_error))
            {
                vm->add_match_host(host->get_hid());

                n_resources++;
            }
            else
            {
                if ( n_error > 0 )
                {
                    log_match(vm->get_oid(), "Cannot schedule VM. " + m_error);
                    break;
                }
                else if (NebulaLog::log_level() >= Log::DDEBUG)
                {
                    ostringstream oss;
                    oss << "Host " << host->get_hid() << " discarded for VM "
                        << vm->get_oid() << ". " << m_error;

                    NebulaLog::log("SCHED", Log::DDEBUG, oss);
                }
            }
        }

        total_match_time += profile(false);

        // ---------------------------------------------------------------------
        // Log scheduling errors to VM user if any
        // ---------------------------------------------------------------------

        if (n_resources == 0) //No hosts assigned, let's see why
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
                else if (n_fits == 0)
                {
                    ostringstream oss;

                    oss << "No host with enough capacity to deploy the VM";

                    vm->log(oss.str());
                }
                else if (n_matched == 0)
                {
                    ostringstream oss;

                    oss << "No host meets capacity and SCHED_REQUIREMENTS: "
                        << vm->get_requirements();

                    vm->log(oss.str());
                }
            }

            vmpool->update(vm);

            log_match(vm->get_oid(), "Cannot schedule VM, there is no suitable host.");

            continue;
        }

        // ---------------------------------------------------------------------
        // Schedule matched hosts
        // ---------------------------------------------------------------------
        profile(true);

        for (it=host_policies.begin() ; it != host_policies.end() ; it++)
        {
            (*it)->schedule(vm);
        }

        vm->sort_match_hosts();

        total_rank_time += profile(false);

        if (vm->is_resched())//Will use same system DS for migrations
        {
            vm->add_match_datastore(vm->get_dsid());

            continue;
        }

        // ---------------------------------------------------------------------
        // Match datastores for this VM
        // ---------------------------------------------------------------------

        n_resources = 0;
        n_auth    = 0;
        n_matched = 0;
        n_error   = 0;
        n_fits    = 0;

        for (h_it=datastores.begin(); h_it != datastores.end(); h_it++)
        {
            ds = static_cast<DatastoreXML *>(h_it->second);

            if (match_system_ds(acls, upool, vm, vm_disk, ds, n_auth, n_error,
                        n_fits, n_matched, m_error))
            {
                vm->add_match_datastore(ds->get_oid());

                n_resources++;
            }
            else
            {
                if (n_error > 0)
                {
                    log_match(vm->get_oid(), "Cannot schedule VM. " + m_error);
                    break;
                }
                else if (NebulaLog::log_level() >= Log::DDEBUG)
                {
                    ostringstream oss;
                    oss << "System DS " << ds->get_oid() << " discarded for VM "
                        << vm->get_oid() << ". " << m_error;

                    NebulaLog::log("SCHED", Log::DDEBUG, oss);
                }
            }
        }

        // ---------------------------------------------------------------------
        // Log scheduling errors to VM user if any
        // ---------------------------------------------------------------------

        if (n_resources == 0)
        {
            if (vm->is_public_cloud())//Public clouds don't need a system DS
            {
                vm->set_only_public_cloud();

                continue;
            }
            else//No datastores assigned, let's see why
            {
                if (n_error == 0)//No syntax error
                {
                    if (datastores.size() == 0)
                    {
                        vm->log("No system datastores found to run VMs");
                    }
                    else if (n_auth == 0)
                    {
                        vm->log("User is not authorized to use any system datastore");
                    }
                    else if (n_fits == 0)
                    {
                        ostringstream oss;
                        oss <<  "No system datastore with enough capacity for the VM";

                        vm->log(oss.str());
                    }
                    else if (n_matched == 0)
                    {
                        ostringstream oss;

                        oss << "No system datastore meets capacity "
                            << "and SCHED_DS_REQUIREMENTS: "
                            << vm->get_ds_requirements();

                        vm->log(oss.str());
                    }
                }

                vm->clear_match_hosts();

                vmpool->update(vm);

                log_match(vm->get_oid(), "Cannot schedule VM, there is no suitable "
                    "system ds.");

                continue;
            }
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

    ostringstream oss;

    oss << "Match Making statistics:\n"
        << "\tNumber of VMs: \t\t" << pending_vms.size() << endl
        << "\tTotal time: \t\t" << one_util::float_to_str(time(0) - stime) << "s" << endl
        << "\tTotal Match time: \t" << one_util::float_to_str(total_match_time) << "s" << endl
        << "\tTotal Ranking time: \t" << one_util::float_to_str(total_rank_time) << "s";

    NebulaLog::log("SCHED", Log::DDEBUG, oss);

    if (NebulaLog::log_level() >= Log::DDDEBUG)
    {
        ostringstream oss;

        oss << "Scheduling Results:" << endl;

        for (map<int, ObjectXML*>::const_iterator vm_it=pending_vms.begin();
            vm_it != pending_vms.end(); vm_it++)
        {
            vm = static_cast<VirtualMachineXML*>(vm_it->second);

            oss << *vm;
        }

        NebulaLog::log("SCHED", Log::DDDEBUG, oss);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Scheduler::dispatch()
{
    HostXML *           host;
    DatastoreXML *      ds;
    VirtualMachineXML * vm;

    ostringstream dss;

    int cpu, mem;
    long long dsk;
    vector<VectorAttribute *> pci;

    int hid, dsid, cid;
    bool test_cap_result;

    unsigned int dispatched_vms = 0;

    map<int, unsigned int>  host_vms;
    pair<map<int,unsigned int>::iterator, bool> rc;

    map<int, ObjectXML*>::const_iterator vm_it;

    vector<Resource *>::const_reverse_iterator i, j;

    const map<int, ObjectXML*> pending_vms = vmpool->get_objects();

    dss << "Dispatching VMs to hosts:\n" << "\tVMID\tHost\tSystem DS\n"
        << "\t-------------------------\n";

    //--------------------------------------------------------------------------
    // Dispatch each VM till we reach the dispatch limit
    //--------------------------------------------------------------------------

    for (vm_it = pending_vms.begin();
         vm_it != pending_vms.end() &&
            ( dispatch_limit <= 0 || dispatched_vms < dispatch_limit );
         vm_it++)
    {
        vm = static_cast<VirtualMachineXML*>(vm_it->second);

        const vector<Resource *> resources = vm->get_match_hosts();

        //----------------------------------------------------------------------
        // Test Image Datastore capacity, but not for migrations or resume
        //----------------------------------------------------------------------
        if (!resources.empty() && !vm->is_resched() && !vm->is_resume())
        {
            if (vm->test_image_datastore_capacity(img_dspool) == false)
            {
                if (vm->is_public_cloud())//No capacity needed for public cloud
                {
                    vm->set_only_public_cloud();
                }
                else
                {
                    continue;
                }
            }
        }

        vm->get_requirements(cpu, mem, dsk, pci);

        //----------------------------------------------------------------------
        // Get the highest ranked host and best System DS for it
        //----------------------------------------------------------------------
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
            // Test host capacity
            //------------------------------------------------------------------
            if (host->test_capacity(cpu, mem, pci) != true)
            {
                continue;
            }

            //------------------------------------------------------------------
            // Check that VM can be deployed in local hosts
            //------------------------------------------------------------------
            if (vm->is_only_public_cloud() && !host->is_public_cloud())
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
            // Get the highest ranked datastore
            //------------------------------------------------------------------
            const vector<Resource *> ds_resources = vm->get_match_datastores();

            dsid = -1;

            // Skip the loop for public cloud hosts, they don't need a system DS
            if (host->is_public_cloud())
            {
                j = ds_resources.rend();
            }
            else
            {
                j = ds_resources.rbegin();
            }

            for ( ; j != ds_resources.rend() ; j++)
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
                // Test datastore capacity, but not for migrations
                //--------------------------------------------------------------

                if (!vm->is_resched())
                {
                    if (ds->is_shared() && ds->is_monitored())
                    {
                        // A resume action tests DS capacity only
                        // for non-shared system DS
                        if (vm->is_resume())
                        {
                            test_cap_result = true;
                        }
                        else
                        {
                            test_cap_result = ds->test_capacity(dsk);
                        }
                    }
                    else
                    {
                        test_cap_result = host->test_ds_capacity(ds->get_oid(), dsk);
                    }

                    if (test_cap_result != true)
                    {
                        continue;
                    }
                }

                //--------------------------------------------------------------
                //Select this DS to dispatch VM
                //--------------------------------------------------------------
                dsid = (*j)->oid;

                break;
            }

            if (dsid == -1 && !host->is_public_cloud())//No system DS for this host
            {
                continue;
            }

            //------------------------------------------------------------------
            // Dispatch and update host and DS capacity, and dispatch counters
            //------------------------------------------------------------------
            if (vmpool->dispatch(vm_it->first, hid, dsid, vm->is_resched()) != 0)
            {
                continue;
            }

            dss << "\t" << vm_it->first << "\t" << hid << "\t" << dsid << "\n";

            // DS capacity is only added for new deployments, not for migrations
            // It is also omitted for VMs deployed in public cloud hosts
            if (!vm->is_resched() && !host->is_public_cloud())
            {
                if (ds->is_shared() && ds->is_monitored())
                {
                    // Resumed VMs do not add to shared system DS capacity
                    if (!vm->is_resume())
                    {
                        ds->add_capacity(dsk);
                    }
                }
                else
                {
                    host->add_ds_capacity(ds->get_oid(), dsk);
                }

                vm->add_image_datastore_capacity(img_dspool);
            }

            host->add_capacity(vm->get_oid(), cpu, mem, pci);

            host_vms[hid]++;

            dispatched_vms++;

            break;
        }
    }

    if (vm_it != pending_vms.end())
    {
        dss << endl << "MAX_DISPATCH limit of " << dispatch_limit << " reached, "
            << std::distance(vm_it, pending_vms.end()) << " VMs were not dispatched";
    }

    NebulaLog::log("SCHED", Log::DEBUG, dss);
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
        profile(true);
        rc = vmapool->set_up();
        profile(false,"Getting scheduled actions information.");

        if ( rc == 0 )
        {
            profile(true);
            do_scheduled_actions();
            profile(false,"Executing scheduled actions.");
        }

        profile(true);
        rc = set_up_pools();
        profile(false,"Getting VM and Host information.");

        if ( rc != 0 )
        {
            return;
        }

        match_schedule();

        profile(true);
        dispatch();
        profile(false,"Dispatching VMs to hosts.");
    }
    else if (name == ACTION_FINALIZE)
    {
        NebulaLog::log("SCHED",Log::INFO,"Stopping the scheduler...");
    }
}
