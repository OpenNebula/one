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

#include <stdexcept>
#include <stdlib.h>

#include <signal.h>
#include <unistd.h>
#include <fcntl.h>
#include <sys/types.h>
#include <pwd.h>

#include <pthread.h>

#include <cmath>
#include <iomanip>

#include "Scheduler.h"
#include "SchedulerTemplate.h"
#include "RankPolicy.h"
#include "NebulaLog.h"
#include "PoolObjectAuth.h"
#include "NebulaUtil.h"
#include "ScheduledAction.h"

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

    sched->am.loop(sched->timer);

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

    conf.get("ONE_XMLRPC", one_xmlrpc);

    conf.get("SCHED_INTERVAL", timer);

    conf.get("MAX_VM", machines_limit);

    conf.get("MAX_DISPATCH", dispatch_limit);

    conf.get("MAX_HOST", host_dispatch_limit);

    conf.get("LIVE_RESCHEDS", live_rescheds);

    conf.get("MEMORY_SYSTEM_DS_SCALE", mem_ds_scale);

    conf.get("DIFFERENT_VNETS", diff_vnets);

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
        long long    message_size;
        unsigned int timeout;

        conf.get("MESSAGE_SIZE", message_size);

        conf.get("TIMEOUT", timeout);

        Client::initialize("", one_xmlrpc, message_size, timeout);

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

            client->call("one.system.config", "", &result);

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
    Client * client = Client::client();

    acls  = new AclXML(client, zone_id);
    upool = new UserPoolXML(client);

    hpool  = new HostPoolXML(client);
    clpool = new ClusterPoolXML(client);

    dspool     = new SystemDatastorePoolXML(client);
    img_dspool = new ImageDatastorePoolXML(client);

    vm_roles_pool = new VirtualMachineRolePoolXML(client, machines_limit);
    vmpool = new VirtualMachinePoolXML(client, machines_limit, live_rescheds==1);

    vnetpool = new VirtualNetworkPoolXML(client);

    vmgpool = new VMGroupPoolXML(client);

    vmapool = new VirtualMachineActionsPoolXML(client, machines_limit);

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

    am.finalize();

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
    //Cleans the cache and get the pools
    //--------------------------------------------------------------------------

    rc = vmpool->set_up();

    if ( rc != 0 )
    {
        return rc;
    }

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

    rc = upool->set_up();

    if ( rc != 0 )
    {
        return rc;
    }

    rc = hpool->set_up();

    if ( rc != 0 )
    {
        return rc;
    }

    rc = clpool->set_up();

    if ( rc != 0 )
    {
        return rc;
    }

    hpool->merge_clusters(clpool);

    rc = acls->set_up();

    if ( rc != 0 )
    {
        return rc;
    }

    rc = vmgpool->set_up();

    if ( rc != 0 )
    {
        return rc;
    }

    rc = vm_roles_pool->set_up();

    if ( rc != 0 )
    {
        return rc;
    }

    rc = vnetpool->set_up();

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

        host->get_permissions(hperms);

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
            error = "It does not fulfill SCHED_REQUIREMENTS: " +
                vm->get_requirements();
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
                << vm->get_ds_requirements() << "', error: " << estr;

            vm->log(oss.str());

            error = oss.str();

            free(estr);

            return false;
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
/* -------------------------------------------------------------------------- */

/**
 *  Match network for this VM that:
 *    1. Meet user/policy requirements
 *    2. Have enough leases to host the VM
 *
 *  @param acl pool
 *  @param users the user pool
 *  @param vm the virtual machine
 *  @param vdisk vm requirement
 *  @param net to evaluate vm assgiment
 *  @param n_auth number of nets authorized for the user, incremented if needed
 *  @param n_error number of requirement errors, incremented if needed
 *  @param n_matched number of networks that fullfil VM sched_requirements
 *  @param n_fits number of networks with leases that fits the VM requirements
 *  @param error, string describing why the host is not valid
 *  @return true for a positive match
 */
static bool match_network(AclXML * acls, UserPoolXML * upool,
    VirtualMachineXML* vm, int nic_id, VirtualNetworkXML * net, int& n_auth,
    int& n_error, int& n_fits, int &n_matched, string &error)
{
    // -------------------------------------------------------------------------
    // Check if user is authorized
    // -------------------------------------------------------------------------
    if ( vm->get_uid() != 0 && vm->get_gid() != 0 )
    {
        PoolObjectAuth netperms;

        net->get_permissions(netperms);

        UserXML * user = upool->get(vm->get_uid());

        if (user == 0)
        {
            error = "User does not exists.";
            return false;
        }

        const vector<int> vgids = user->get_gids();

        set<int> gids(vgids.begin(), vgids.end());

        if ( !acls->authorize(vm->get_uid(), gids, netperms, AuthRequest::USE))
        {
            error = "Permission denied.";
            return false;
        }
    }

    n_auth++;

    if ( !net->test_leases(error) )
    {
        return false;
    }

    n_fits++;

    // -------------------------------------------------------------------------
    // Evaluate VM requirements for NICS
    // -------------------------------------------------------------------------
    if (!vm->get_nic_requirements(nic_id).empty())
    {
        char * estr;

        bool matched = true;

        if (net->eval_bool(vm->get_nic_requirements(nic_id), matched, &estr) != 0)
        {
            ostringstream oss;

            n_error++;

            oss << "Error in REQUIREMENTS - NIC_ID(" << nic_id <<"): '"
                << vm->get_nic_requirements(nic_id) << "', error: " << estr;

            vm->log(oss.str());

            error = oss.str();

            free(estr);

            return false;
        }

        if (matched == false)
        {
            error = "It does not fulfill NIC REQUIREMENTS.";
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
    VirtualNetworkXML *net;

    string m_error;

    map<int, ObjectXML*>::const_iterator  vm_it;
    map<int, ObjectXML*>::const_iterator  obj_it;

    vector<SchedulerPolicy *>::iterator it;

    const map<int, ObjectXML*> pending_vms = vmpool->get_objects();
    const map<int, ObjectXML*> hosts       = hpool->get_objects();
    const map<int, ObjectXML*> datastores  = dspool->get_objects();
    const map<int, ObjectXML*> users       = upool->get_objects();
    const map<int, ObjectXML*> nets        = vnetpool->get_objects();

    double total_cl_match_time = 0;
    double total_host_match_time = 0;
    double total_host_rank_time = 0;
    double total_ds_match_time = 0;
    double total_ds_rank_time = 0;
    double total_net_match_time = 0;
    double total_net_rank_time = 0;

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
                    log_match(vm->get_oid(), "Cannot schedule VM. "+ m_error);

                    vm->log("Cannot schedule VM. "+ m_error);
                    vmpool->update(vm);

                    continue;
                }
            }
        }

        // ---------------------------------------------------------------------
        // Match hosts for this VM.
        // ---------------------------------------------------------------------
        profile(true);

        for (obj_it=hosts.begin(); obj_it != hosts.end(); obj_it++)
        {
            host = static_cast<HostXML *>(obj_it->second);

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

        total_host_match_time += profile(false);

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

            log_match(vm->get_oid(),
                    "Cannot schedule VM, there is no suitable host.");

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

        total_host_rank_time += profile(false);

        if (vm->is_resched())//Will use same system DS for migrations
        {
            vm->add_match_datastore(vm->get_dsid());

            continue;
        }

        // ---------------------------------------------------------------------
        // Match datastores for this VM
        // ---------------------------------------------------------------------

        profile(true);

        n_resources = 0;
        n_auth    = 0;
        n_matched = 0;
        n_error   = 0;
        n_fits    = 0;

        for (obj_it=datastores.begin(); obj_it != datastores.end(); obj_it++)
        {
            ds = static_cast<DatastoreXML *>(obj_it->second);

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

        total_ds_match_time += profile(false);

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

        profile(true);

        for (it=ds_policies.begin() ; it != ds_policies.end() ; it++)
        {
            (*it)->schedule(vm);
        }

        vm->sort_match_datastores();

        total_ds_rank_time += profile(false);

        // ---------------------------------------------------------------------
        // Match Networks for this VM
        // ---------------------------------------------------------------------

        profile(true);

        set<int>::iterator it_nic;
        set<int> nics_ids = vm->get_nics_ids();

        bool not_matched = false;

        for (it_nic = nics_ids.begin(); it_nic != nics_ids.end(); ++it_nic)
        {
            n_resources = 0;

            n_auth    = 0;
            n_matched = 0;
            n_error   = 0;
            n_fits    = 0;

            int nic_id = *it_nic;

            for (obj_it = nets.begin(); obj_it != nets.end(); ++obj_it)
            {
                net = static_cast<VirtualNetworkXML *>(obj_it->second);

                if (match_network(acls, upool, vm, nic_id, net, n_auth, n_error,
                            n_fits, n_matched, m_error))
                {
                    vm->add_match_network(net->get_oid(), nic_id);

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
                        oss << "Network " << net->get_oid() << " discarded for VM "
                            << vm->get_oid() << " and NIC " << nic_id << ". " << m_error;

                        NebulaLog::log("SCHED", Log::DDEBUG, oss);
                    }
                }
            }

            if (n_resources == 0)
            {
                if (n_error == 0)//No syntax error
                {
                    if (nets.size() == 0)
                    {
                        vm->log("No networks found to run VMs");
                    }
                    else if (n_auth == 0)
                    {
                        vm->log("User is not authorized to use any network");
                    }
                    else if (n_fits == 0)
                    {
                        vm->log("No network with enough capacity for the VM");
                    }
                    else if (n_matched == 0)
                    {
                        ostringstream oss;

                        oss << "No network meet leases "
                            << "and SCHED_NIC_REQUIREMENTS: "
                            << vm->get_nic_requirements(nic_id);

                        vm->log(oss.str());
                    }
                }

                vm->clear_match_hosts();
                vm->clear_match_datastores();

                vmpool->update(vm);

                log_match(vm->get_oid(), "Cannot schedule VM, there is no "
                    "suitable network.");

                break;

                not_matched = true;
            }

            profile(true);

            for (it = nic_policies.begin() ; it != nic_policies.end() ; it++)
            {
                (*it)->schedule(vm->get_nic(nic_id));
            }

            vm->sort_match_networks(nic_id);

            total_net_rank_time += profile(false);
        }

        if ( not_matched )
        {
            continue;
        }

        total_net_match_time += profile(false);
    }

    if (NebulaLog::log_level() >= Log::DDEBUG)
    {
        ostringstream oss;

        oss << "Match Making statistics:\n"
            << "\tNumber of VMs:             "
            << pending_vms.size() << endl
            << "\tTotal time:                "
            << one_util::float_to_str(time(0) - stime)       << "s" << endl
            << "\tTotal Cluster Match time:  "
            << one_util::float_to_str(total_cl_match_time)   << "s" << endl
            << "\tTotal Host Match time:     "
            << one_util::float_to_str(total_host_match_time) << "s" << endl
            << "\tTotal Host Ranking time:   "
            << one_util::float_to_str(total_host_rank_time)  << "s" << endl
            << "\tTotal DS Match time:       "
            << one_util::float_to_str(total_ds_match_time)   << "s" << endl
            << "\tTotal DS Ranking time:     "
            << one_util::float_to_str(total_ds_rank_time)    << "s" << endl
            << "\tTotal Network Match time:  "
            << one_util::float_to_str(total_net_match_time)   << "s" << endl
            << "\tTotal Network Ranking time:"
            << one_util::float_to_str(total_net_rank_time)    << "s" << endl;

        NebulaLog::log("SCHED", Log::DDEBUG, oss);
    }

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
    VirtualNetworkXML * net;
    VirtualMachineXML * vm;

    ostringstream dss;
    string        error;

    int cpu, mem;
    long long dsk;
    vector<VectorAttribute *> pci;

    int hid, dsid, cid, netid;

    unsigned int dispatched_vms = 0;
    bool dispatched, matched;
    char * estr;

    vector<Resource *>::const_reverse_iterator i, j, k, n;

    vector<SchedulerPolicy *>::iterator sp_it;

    ostringstream extra;

    //--------------------------------------------------------------------------
    // Schedule pending VMs according to the VM policies (e.g. User priority)
    //--------------------------------------------------------------------------
    for (sp_it = vm_policies.begin() ; sp_it != vm_policies.end() ; ++sp_it)
    {
        (*sp_it)->schedule(0);
    }

    vmpool->sort_vm_resources();

    const vector<Resource *> vm_rs = vmpool->get_vm_resources();

    //--------------------------------------------------------------------------
    dss << "Dispatching VMs to hosts:\n"
        << "\tVMID\tPriority\tHost\tSystem DS\n"
        << "\t--------------------------------------------------------------\n";
    //--------------------------------------------------------------------------

    //--------------------------------------------------------------------------
    // Dispatch each VM till we reach the dispatch limit
    //--------------------------------------------------------------------------
    for (k = vm_rs.rbegin(); k != vm_rs.rend() &&
            ( dispatch_limit <= 0 || dispatched_vms < dispatch_limit ); ++k)
    {
        dispatched = false;

        vm = vmpool->get((*k)->oid);

        const vector<Resource *> resources = vm->get_match_hosts();

        //----------------------------------------------------------------------
        // Test Image Datastore capacity, but not for migrations or resume
        //----------------------------------------------------------------------
        if (!resources.empty() && !vm->is_resched() && !vm->is_resume())
        {
            if (vm->test_image_datastore_capacity(img_dspool, error) == false)
            {
                if (vm->is_public_cloud())//No capacity needed for public cloud
                {
                    vm->set_only_public_cloud();
                }
                else
                {
                    vm->log("Cannot dispatch VM. " + error);

                    vmpool->update(vm);

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
            // Check host still match requirements with CURRENT_VMS
            //------------------------------------------------------------------
            matched = true;

            if ( one_util::regex_match("CURRENT_VMS",
                        vm->get_requirements().c_str()) == 0 )
            {
                if (host->eval_bool(vm->get_requirements(), matched, &estr)!=0)
                {
                    free(estr);
                    continue;
                }
            }

            if (matched == false)
            {
                std::ostringstream mss;

                mss << "Host " << hid << " no longer meets requirements for VM "
                    << vm->get_oid();

                NebulaLog::log("SCHED", Log::DEBUG, mss);
                continue;
            }

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
            // Test host dispatch limit
            //------------------------------------------------------------------
            if (host->dispatched() >= host_dispatch_limit)
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
                if (!ds->is_in_cluster(cid))
                {
                    continue;
                }

                //--------------------------------------------------------------
                // Test datastore capacity
                //   - Shared DS does not need to check capacity if VM is
                //     migrated or resumed
                //   - Non-shared DS will always check host capacity
                //--------------------------------------------------------------
                bool ds_capacity = false;

                if (ds->is_shared())
                {
                    if (!ds->is_monitored())
                    {
                        ds_capacity = false;
                    }
                    else if (vm->is_resched() || vm->is_resume())
                    {
                        ds_capacity = true;
                    }
                    else
                    {
                        ds_capacity =  ds->test_capacity(dsk);
                    }
                }
                else
                {
                    ds_capacity = host->test_ds_capacity(ds->get_oid(), dsk);
                }

                if (!ds_capacity)
                {
                    continue;
                }

                //--------------------------------------------------------------
                //Select this DS to dispatch VM
                //--------------------------------------------------------------
                dsid = (*j)->oid;

                break;
            }

            if (dsid == -1 && !host->is_public_cloud())
            {
                continue;
            }

             //------------------------------------------------------------------
            // Get the highest ranked network
            //------------------------------------------------------------------
            extra.str("");

            set<int> nics_ids = vm->get_nics_ids();

            map<int, int> matched_networks;

            unsigned int num_matched_networks = 0;

            set<int>::iterator it;

            for(it = nics_ids.begin(); it != nics_ids.end(); ++it)
            {
                int nic_id = *it;

                const vector<Resource *> net_resources = vm->get_match_networks(nic_id);

                netid = -1;

                for (n = net_resources.rbegin() ; n != net_resources.rend(); n++)
                {
                    if ( diff_vnets && matched_networks.find((*n)->oid) != matched_networks.end() )
                    {
                        continue;
                    }

                    net = vnetpool->get((*n)->oid);

                    if ( net == 0 )
                    {
                        continue;
                    }

                    //--------------------------------------------------------------
                    // Test cluster membership for datastore and selected host
                    //--------------------------------------------------------------
                    if (! net->is_in_cluster(cid))
                    {
                        continue;
                    }

                    //--------------------------------------------------------------
                    // Test network leases
                    //--------------------------------------------------------------
                    if ( !net->test_leases() )
                    {
                        continue;
                    }

                    net->add_lease();

                    //--------------------------------------------------------------
                    //Select this DS to dispatch VM
                    //--------------------------------------------------------------
                    netid = (*n)->oid;

                    break;
                }

                if ( netid == -1 )
                {
                    break;
                }

                if ( matched_networks.find(netid) != matched_networks.end() )
                {
                    matched_networks[netid] += 1;
                }
                else
                {
                    matched_networks[netid] = 1;
                }

                num_matched_networks++;

                extra << "NIC=[NIC_ID=\"" << nic_id
                      << "\", NETWORK_MODE=\"auto\" , NETWORK_ID=\"" << netid
                      << "\"]";
            }

            if ( num_matched_networks < nics_ids.size())
            {
                map<int,int>::iterator it;

                for (it = matched_networks.begin(); it != matched_networks.end(); it++)
                {
                    net = vnetpool->get(it->first);

                    net->rollback_leases(it->second);
                }

                continue;
            }

            //------------------------------------------------------------------
            // Dispatch and update host and DS capacity, and dispatch counters
            //------------------------------------------------------------------
            if (vmpool->dispatch((*k)->oid, hid, dsid, vm->is_resched(), extra.str()) != 0)
            {
                map<int,int>::iterator it;

                for ( it = matched_networks.begin(); it != matched_networks.end(); it++)
                {
                    net = vnetpool->get(it->first);

                    net->rollback_leases(it->second);
                }

                continue;
            }

            //------------------------------------------------------------------
            dss << "\t" << (*k)->oid << "\t" << (*k)->priority << "\t\t" << hid
                << "\t" << dsid << "\n";
            //------------------------------------------------------------------

            // DS capacity skip VMs deployed in public cloud hosts
            if (!host->is_public_cloud())
            {
                // ------------ Add system DS usage -------------
                if (ds->is_shared())
                {
                    if (!vm->is_resched() && !vm->is_resume())
                    {
                        ds->add_capacity(dsk);
                    }
                }
                else
                {
                    host->add_ds_capacity(ds->get_oid(), dsk);
                }

                // ---------- Add image DS usage (i.e. clone = self) ----------
                if (!vm->is_resched())
                {
                    vm->add_image_datastore_capacity(img_dspool);
                }
            }

            //------------------------------------------------------------------
            // VM leaders needs to add the select host to the affined VMs
            //------------------------------------------------------------------
            const set<int>& affined_vms = vm->get_affined_vms();

            if ( affined_vms.size() > 0 )
            {
                set<int>::const_iterator it;

                for ( it = affined_vms.begin(); it != affined_vms.end(); ++it )
                {
                    VirtualMachineXML * avm = vmpool->get(*it);

                    if ( avm == 0 )
                    {
                        continue;
                    }

                    avm->add_match_host(hid);
                    avm->add_match_datastore(dsid);
                }
            }

            //------------------------------------------------------------------
            // Update usage and statistics counters
            //------------------------------------------------------------------
            host->add_capacity(vm->get_oid(), cpu, mem, pci);

            dispatched_vms++;

            dispatched = true;

            break;
        }

        if (!dispatched)
        {
            vm->log("Cannot dispatch VM to any Host. Possible reasons: Not "
                "enough capacity in Host or System DS, dispatch limit "
                "reached, or limit of free leases reached.");
            vmpool->update(vm);
        }
    }

    if (k != vm_rs.rend())
    {
        dss << endl << "MAX_DISPATCH limit of " << dispatch_limit << " reached, "
            << std::distance(k, vm_rs.rend())
            << " VMs were not dispatched";
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

    string action_st, error_msg;

    string time_str = one_util::log_time(time(0));

    for (vm_it=vms.begin(); vm_it != vms.end(); vm_it++)
    {
        SchedActions::schedaction_iterator action;

        vm = static_cast<VirtualMachineXML *>(vm_it->second);

        SchedActions * sas = vm->get_actions();

        for ( action = sas->begin(); action != sas->end(); ++action)
        {
            ostringstream oss;

            if (!(*action)->is_due())
            {
                continue;
            }

            action_st = (*action)->vector_value("ACTION");

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

                if (rc == 0)
                {
                    (*action)->remove("MESSAGE");

                    (*action)->replace("DONE", time(0));

                    (*action)->next_action();

                    oss << "Success.";
                }
            }

            if ( rc != 0 )
            {
                ostringstream oss_aux;

                oss_aux << time_str << " : " << error_msg;

                (*action)->replace("MESSAGE", oss_aux.str());

                oss << "Failure. " << error_msg;
            }

            NebulaLog::log("VM", Log::INFO, oss);
        }

        if ( !sas->empty() ) //Do not update VMs without SCHED_ACTION
        {
            vmpool->update(vm);
        }

        delete sas;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Scheduler::do_vm_groups()
{
    map<int, ObjectXML*>::const_iterator it;
    const map<int, ObjectXML*> vmgrps = vmgpool->get_objects();

    ostringstream oss;

    oss << "VM Group Scheduling information\n";

    for (it = vmgrps.begin(); it != vmgrps.end() ; ++it)
    {
        VMGroupXML * grp = static_cast<VMGroupXML*>(it->second);

        oss << setfill('*') << setw(80) << '*' << setfill(' ') << "\n"
            << "SCHEDULING RESULTS FOR VM GROUP " << grp->get_oid() << ", "
            << grp->get_name() <<"\n"
            << setfill('*') << setw(80) << '*' << setfill(' ') << "\n";

        oss << *grp << "\n";

        grp->set_affinity_requirements(vmpool, vm_roles_pool, oss);

        grp->set_antiaffinity_requirements(vmpool, oss);

        grp->set_host_requirements(vmpool, oss);
    }

    NebulaLog::log("VMGRP", Log::DDDEBUG, oss);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Scheduler::timer_action(const ActionRequest& ar)
{
    int rc;

    try
    {
        xmlrpc_c::value result;

        Client::client()->call("one.zone.raftstatus", "", &result);

        vector<xmlrpc_c::value> values =
                        xmlrpc_c::value_array(result).vectorValueValue();

        bool success = xmlrpc_c::value_boolean(values[0]);
        string msg   = xmlrpc_c::value_string(values[1]);

        if ( success )
        {
            int state;

            Template raft(false, '=', "RAFT");

            if ( raft.from_xml(msg) != 0 )
            {
                NebulaLog::log("SCHED", Log::ERROR, "Error parsing oned info");
                return;
            }

           if ( raft.get("STATE", state) == false )
           {
                NebulaLog::log("SCHED", Log::ERROR, "Cannot get oned state");
                return;
           }

           if ( state != 3 && state != 0 )
           {
                NebulaLog::log("SCHED", Log::ERROR, "oned is not leader");
                return;
           }
        }
        else
        {
            NebulaLog::log("SCHED", Log::ERROR, "Cannot contact oned: " + msg);
            return;
        }
    }
    catch (exception const& e)
    {
        ostringstream ess;

        ess << "Cannot contact oned: " << e.what();

        NebulaLog::log("SCHED", Log::ERROR, ess);
        return;
    }

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

    profile(true);
    do_vm_groups();
    profile(false,"Setting VM groups placement constraints.");

    match_schedule();

    profile(true);
    dispatch();
    profile(false,"Dispatching VMs to hosts.");
}
