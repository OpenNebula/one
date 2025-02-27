/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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

#include "Scheduler.h"
#include "SchedulerTemplate.h"
#include "RankPolicy.h"
#include "NebulaLog.h"
#include "PlanXML.h"
#include "Profiler.h"

#include <stdexcept>
#include <stdlib.h>
#include <iomanip>
#include <iostream>
#include <string>

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

namespace
{
    template<typename T>
    std::shared_ptr<T> initialize_from_xml(ObjectXML& xml_obj, const std::string& xpath)
    {
        std::vector<xmlNodePtr> nodes;

        xml_obj.get_nodes(xpath, nodes);

        if (nodes.empty())
        {
            throw std::invalid_argument("Missing `" + xpath + "` section in scheduler input");
        }

        auto res = std::make_shared<T>(nodes.front());

        res->set_up();

        ObjectXML::free_nodes(nodes);

        return res;
    }

    /* ---------------------------------------------------------------------- */

    void log_message(Log::MessageType message_type, const string& msg)
    {
        std::string message_type_str;

        switch (message_type)
        {
            case Log::ERROR:
                message_type_str = "ERROR: ";
                break;
            case Log::INFO:
                message_type_str = "INFO: ";
                break;
            case Log::WARNING:
                message_type_str = "WARN: ";
                break;
            case Log::DEBUG:
            case Log::DDEBUG:
            case Log::DDDEBUG:
                message_type_str = "DEBUG: ";
                break;
            default:
                message_type_str = "UNKONWN: ";
                break;
        }

        std::cerr << message_type_str + msg << std::endl;

        NebulaLog::log("SCHED", message_type, msg);
    }

    void log_message(int vm_id, Log::MessageType message_type, const string& msg)
    {
        log_message(message_type, std::to_string(vm_id) + " " + msg);
    }

    /* ---------------------------------------------------------------------- */

    std::string ids_to_string(const std::vector<int>& ids)
    {
        if (ids.empty()) {
            return "";
        }

        std::ostringstream oss;

        oss << ids[0];

        for (size_t i = 1; i < ids.size(); ++i)
        {
            oss << "," << ids[i];
        }

        return oss.str();
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

SchedulerTemplate Scheduler::parse_config()
{
    const char* nl = getenv("ONE_LOCATION");

    std::string log_file = "/var/log/one/rank_sched.log";
    std::string etc_path = "/etc/one/";

    if (nl) //OpenNebula is not installed under root directory
    {
        log_file = std::string(nl) + "/var/rank_sched.log";

        etc_path = std::string(nl) + "/etc/";
    }

    SchedulerTemplate conf(etc_path);

    if ( conf.load_configuration() != 0 )
    {
        throw runtime_error("Error reading configuration file.");
    }

    conf.get("MEMORY_SYSTEM_DS_SCALE", mem_ds_scale);

    conf.get("DIFFERENT_VNETS", diff_vnets);

    // -----------------------------------------------------------
    // Log system & Configuration File
    // -----------------------------------------------------------

    const VectorAttribute * log = conf.get("LOG");

    if ( log == nullptr )
    {
        throw runtime_error("Config doesn't contain 'LOG' section");
    }

    auto value = log->vector_value("SYSTEM");
    const auto log_system = NebulaLog::str_to_type(value);

    if (log_system == NebulaLog::UNDEFINED)
    {
        throw runtime_error("Config contains unknown LOG_SYSTEM.");
    }

    value = log->vector_value("DEBUG_LEVEL");

    const auto ilevel = std::stoi(value);

    Log::MessageType clevel = Log::ERROR;

    if (Log::ERROR <= ilevel && ilevel <= Log::DDDEBUG)
    {
        clevel = static_cast<Log::MessageType>(ilevel);
    }

    NebulaLog::init_log_system(log_system,
                               clevel,
                               log_file.c_str(),
                               ios_base::ate,
                               "place");

    NebulaLog::log("SCHED", Log::INFO, "Init Scheduler Log system");

    std::ostringstream oss;

    oss << "Starting Rank Scheduler" << std::endl;
    oss << "----------------------------------------\n";
    oss << "     Scheduler Configuration File       \n";
    oss << "----------------------------------------\n";
    oss << conf;
    oss << "----------------------------------------";

    NebulaLog::log("SCHED", Log::INFO, oss);

    return conf;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Scheduler::setup_pools(const std::string& input_xml)
{
    auto xml_obj = ObjectXML(input_xml);

    std::vector<xmlNodePtr> nodes;

    xml_obj.get_nodes("/SCHEDULER_DRIVER_ACTION/VM_POOL", nodes);

    if (nodes.empty())
    {
        throw std::invalid_argument("Missing `/SCHEDULER_DRIVER_ACTION/VM_POOL` section in scheduler input");
    }

    std::vector<xmlNodePtr> req_nodes;
    xml_obj.get_nodes("/SCHEDULER_DRIVER_ACTION/REQUIREMENTS", req_nodes);

    if (req_nodes.empty())
    {
        throw std::invalid_argument("Missing `/SCHEDULER_DRIVER_ACTION/REQUIREMENTS` section in scheduler input");
    }

    vmpool = std::make_shared<VirtualMachinePoolXML>(nodes.front(),
                                                     req_nodes.front());

    vmpool->set_up();

    vm_roles_pool = std::make_shared<VirtualMachineRolePoolXML>(nodes.front(),
                                                                req_nodes.front());
    vm_roles_pool->set_up();

    ObjectXML::free_nodes(nodes);

    ObjectXML::free_nodes(req_nodes);

    hpool      = initialize_from_xml<HostPoolXML>(xml_obj,
                                                  "/SCHEDULER_DRIVER_ACTION/HOST_POOL");
    dspool     = initialize_from_xml<SystemDatastorePoolXML>(xml_obj,
                                                             "/SCHEDULER_DRIVER_ACTION/DATASTORE_POOL");
    img_dspool = initialize_from_xml<ImageDatastorePoolXML>(xml_obj,
                                                            "/SCHEDULER_DRIVER_ACTION/DATASTORE_POOL");
    vnetpool   = initialize_from_xml<VirtualNetworkPoolXML>(xml_obj,
                                                            "/SCHEDULER_DRIVER_ACTION/VNET_POOL");
    vmgpool    = initialize_from_xml<VMGroupPoolXML>(xml_obj,
                                                     "/SCHEDULER_DRIVER_ACTION/VM_GROUP_POOL");
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Scheduler::start(const std::string& xml_input)
{
    auto conf = parse_config();

    xmlInitParser();

    {
        Profiler p("", "Parsing XML scheduler input.");
        setup_pools(xml_input);
    }

    NebulaLog::log("SCHED", Log::INFO, "Trying to register policies");

    register_policies(conf);

    {
        Profiler p("", "Setting VM groups placement constraints.");
        do_vm_groups();
    }

    {
        Profiler p("", "Match scheduled resources, sort by priorities.");
        match_schedule();
    }

    {
        Profiler p("", "Dispatching VMs to hosts.");
        dispatch();
    }

    xmlCleanupParser();

    NebulaLog::finalize_log_system();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/**
 *  Match hosts for this VM that:
 *    1. Fulfills ACL
 *    2. Meets user/policy requirements
 *    3. Have enough capacity to host the VM
 *
 *  @param vm the virtual machine
 *  @param sr share capacity request
 *  @param host to evaluate vm assgiment
 *  @param n_fits number of hosts with capacity that fits the VM requirements
 *  @param n_matched number of hosts that fullfil VM sched_requirements
 *  @return true for a positive match
 */
static bool match_host(VirtualMachineXML* vm, HostShareCapacity &sr, HostXML * host,
                       int& n_match, int& n_fits, std::string& error)
{
    // -------------------------------------------------------------------------
    // Check host capacity
    // -------------------------------------------------------------------------
    if (host->test_capacity(sr, error) != true)
    {
        return false;
    }

    n_fits++;

    // -------------------------------------------------------------------------
    // Evaluate VM requirements. This needs to be re-evaluated to check
    // affinity constraints
    // -------------------------------------------------------------------------
    if (!vm->get_requirements().empty())
    {
        char * estr;
        bool   matched;

        if ( host->eval_bool(vm->get_requirements(), matched, &estr) != 0 )
        {
            //There should not be any parsing errors at this point
            free(estr);
            return false;
        }

        if (matched == false)
        {
            error = "Host does not fulfill affinity constraints: "
                    + vm->get_requirements();
            return false;
        }
    }

    n_match++;

    return true;
};
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 *  Match system DS's for this VM that:
 *    1. Meet user/policy requirements
 *    2. Have enough capacity to host the VM
 *
 *  @param vm the virtual machine
 *  @param vdisk vm requirement
 *  @param ds to evaluate vm assgiment
 *  @param n_matched number of system ds that fullfil VM sched_requirements
 *  @param n_fits number of system ds with capacity that fits the VM requirements
 *  @return true for a positive match
 */
static bool match_system_ds(VirtualMachineXML* vm, long long vdisk, DatastoreXML * ds,
                            string &error)
{
    // -------------------------------------------------------------------------
    // Check datastore capacity for shared systems DS (non-shared will be
    // checked in a per host basis during dispatch). Resume/Resched actions don't
    // add to shared system DS usage, and are skipped also
    // -------------------------------------------------------------------------
    if (ds->is_shared() && !vm->is_resched() && !vm->is_resume() )
    {
        if (!ds->is_monitored())
        {
            error = "Not monitored.";
            return false;
        }
        else if (!ds->test_capacity(vdisk, error))
        {
            error = "Not enough capacity.";
            return false;
        }
    }

    return true;
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Scheduler::match_schedule()
{
    const map<int, ObjectXML*> pending_vms = vmpool->get_objects();
    const map<int, ObjectXML*> hosts       = hpool->get_objects();
    const map<int, ObjectXML*> datastores  = dspool->get_objects();
    const map<int, ObjectXML*> nets        = vnetpool->get_objects();

    double total_host_match_time = 0;
    double total_host_rank_time  = 0;
    double total_ds_match_time   = 0;
    double total_ds_rank_time    = 0;
    double total_net_match_time  = 0;
    double total_net_rank_time   = 0;

    if (hosts.size() == 0)
    {
        NebulaLog::log("SCHED", Log::ERROR, "No hosts available to run VMs");
        return;
    }

    if (datastores.size() == 0)
    {
        NebulaLog::log("SCHED", Log::ERROR, "No system datastores available to run VMs");
        return;
    }

    Profiler total_stopwatch;

    for (auto vm_it=pending_vms.begin(); vm_it != pending_vms.end(); vm_it++)
    {
        auto vm = static_cast<VirtualMachineXML*>(vm_it->second);

        HostShareCapacity sr;

        vm->get_capacity(sr);

        //----------------------------------------------------------------------
        // Test Image Datastore capacity, but not for migrations or resume
        //----------------------------------------------------------------------
        if (!vm->is_resched() && !vm->is_resume())
        {
            std::string error;

            if (vm->test_image_datastore_capacity(img_dspool, error) == false)
            {
                log_message(vm->get_oid(), Log::ERROR, "Cannot schedule VM. " + error);

                vmpool->remove_vm_resources(vm->get_oid());

                continue;
            }
        }

        // ---------------------------------------------------------------------
        // Match hosts for this VM.
        // ---------------------------------------------------------------------
        Profiler p_host;

        const auto& prereq_host_ids = vm->get_prereq_host_ids();

        int n_match = 0;
        int n_fits  = 0;

        for (auto req_id : prereq_host_ids)
        {
            auto iter = hosts.find(req_id);

            if (iter == hosts.end())
            {
                NebulaLog::log("SCHED", Log::ERROR,
                               "Required host is not present in host pool");
                continue;
            }

            auto host = static_cast<HostXML *>(iter->second);

            std::string error;

            if (match_host(vm, sr, host, n_match, n_fits, error))
            {
                vm->add_match_host(host->get_hid());
            }
            else if (NebulaLog::log_level() >= Log::DDEBUG)
            {
                ostringstream oss;

                oss << "Host " << host->get_hid() << " discarded for VM "
                    << vm->get_oid() << ". " << error;

                NebulaLog::log("SCHED", Log::DDEBUG, oss.str());
            }
        }

        total_host_match_time += p_host.get_elapsed_time();

        // ---------------------------------------------------------------------
        // Log scheduling errors to VM user if any
        // ---------------------------------------------------------------------
        if (n_fits == 0 || n_match == 0) //No hosts assigned, log reason
        {
            std::ostringstream oss;

            oss << "Cannot allocate VM. ";

            if (n_fits == 0)
            {
                oss << "Not enough capacity in hosts ";
            }
            else
            {
                oss << "Affinity constraints cannot be met in hosts ";
            }

            oss << ids_to_string(prereq_host_ids);

            log_message(vm->get_oid(), Log::ERROR, oss.str());

            vmpool->remove_vm_resources(vm->get_oid());

            continue;
        }

        // ---------------------------------------------------------------------
        // Schedule matched hosts
        // ---------------------------------------------------------------------
        Profiler p_host_rank;

        for (auto sp : host_policies)
        {
            sp->schedule(vm);
        }

        vm->sort_match_hosts();

        total_host_rank_time += p_host_rank.get_elapsed_time();

        if (vm->is_resched())//Will use same system DS for migrations
        {
            vm->add_match_datastore(vm->get_dsid());

            continue;
        }

        // ---------------------------------------------------------------------
        // Match datastores for this VM
        // ---------------------------------------------------------------------
        Profiler p_ds;

        const auto& prereq_ds_ids = vm->get_prereq_ds_ids();

        bool matched_ds = false;

        for (auto req_id : prereq_ds_ids)
        {
            auto iter = datastores.find(req_id);

            if (iter == datastores.end())
            {
                NebulaLog::log("SCHED", Log::ERROR,
                               "Required datastore is not present in datastore pool");
                continue;
            }

            auto ds = static_cast<DatastoreXML *>(iter->second);

            std::string error;

            if (match_system_ds(vm, sr.disk, ds, error))
            {
                vm->add_match_datastore(ds->get_oid());

                matched_ds = true;
            }
            else if (NebulaLog::log_level() >= Log::DDEBUG)
            {
                ostringstream oss;

                oss << "System DS " << ds->get_oid() << " discarded for VM "
                    << vm->get_oid() << ". " << error;

                NebulaLog::log("SCHED", Log::DDEBUG, oss.str());
            }
        }

        total_ds_match_time += p_ds.get_elapsed_time();

        // ---------------------------------------------------------------------
        // Log scheduling errors to VM user if any
        // ---------------------------------------------------------------------
        if (!matched_ds)
        {
            log_message(vm->get_oid(), Log::ERROR,
                        "Cannot allocate VM. Not enough enough space in datastores "
                        + ids_to_string(prereq_ds_ids));

            vm->clear_match_hosts();

            vmpool->remove_vm_resources(vm->get_oid());

            continue;
        }

        // ---------------------------------------------------------------------
        // Schedule matched datastores
        // ---------------------------------------------------------------------
        Profiler p_ds_rank;

        for (auto sp : ds_policies)
        {
            sp->schedule(vm);
        }

        vm->sort_match_datastores();

        total_ds_rank_time += p_ds_rank.get_elapsed_time();

        // ---------------------------------------------------------------------
        // Match Networks for this VM
        // ---------------------------------------------------------------------
        Profiler p_net;

        const set<int>& nics_ids = vm->get_nics_ids();
        const auto& prerequied_nics = vm->get_prereq_nics();

        for (const auto& [nic_id, vnet_ids] : prerequied_nics)
        {
            if (nics_ids.find(nic_id) == nics_ids.end())
            {
                NebulaLog::log("SCHED", Log::ERROR, "Required nic is not present");
                continue;
            }

            bool matched_vnet = false;

            for (auto vnet_id : vnet_ids)
            {
                auto iter = nets.find(vnet_id);

                if (iter == nets.end())
                {
                    NebulaLog::log("SCHED", Log::ERROR, "Required virtual network is not present");
                    continue;
                }

                auto net = static_cast<VirtualNetworkXML *>(iter->second);

                std::string error;

                if ( net->test_leases(error) )
                {
                    vm->add_match_network(net->get_oid(), nic_id);

                    matched_vnet = true;
                }
                else if (NebulaLog::log_level() >= Log::DDEBUG)
                {
                    ostringstream oss;

                    oss << "Network " << net->get_oid() << " discarded for VM "
                        << vm->get_oid() << " and NIC " << nic_id << ". " << error;

                    NebulaLog::log("SCHED", Log::DDEBUG, oss.str());
                }
            }

            if (!matched_vnet)
            {
                log_message(vm->get_oid(), Log::MessageType::ERROR,
                            "Cannot schedule VM, no leases available in network "
                            + ids_to_string(vnet_ids));

                vm->clear_match_hosts();
                vm->clear_match_datastores();
                vm->clear_match_networks();

                vmpool->remove_vm_resources(vm->get_oid());

                break;
            }

            Profiler p_net_rank;

            for (auto sp : nic_policies)
            {
                sp->schedule(vm->get_nic(nic_id));
            }

            vm->sort_match_networks(nic_id);

            total_net_rank_time += p_net_rank.get_elapsed_time();
        }

        total_net_match_time += p_net.get_elapsed_time();
    }

    // -------------------------------------------------------------------------
    // Log debug messages
    // -------------------------------------------------------------------------
    if (NebulaLog::log_level() >= Log::DDEBUG)
    {
        ostringstream oss;

        oss << "Match Making statistics:\n"
            << "\tNumber of VMs:             "
            << pending_vms.size() << endl
            << "\tTotal time:                "
            << one_util::float_to_str(total_stopwatch.get_elapsed_time()) << "s" << endl
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

        if (NebulaLog::log_level() >= Log::DDDEBUG)
        {
            oss.clear();
            oss.str("");

            oss << "Scheduling Results:" << endl;

            for (auto vm_it=pending_vms.begin();
                 vm_it != pending_vms.end(); vm_it++)
            {
                auto vm = static_cast<VirtualMachineXML*>(vm_it->second);

                oss << *vm;
            }

            NebulaLog::log("SCHED", Log::DDDEBUG, oss);
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Scheduler::dispatch()
{
    PlanXML plan;

    //--------------------------------------------------------------------------
    // Schedule pending VMs according to the VM policies (e.g. User priority)
    //--------------------------------------------------------------------------
    for (auto sp : vm_policies)
    {
        sp->schedule(0);
    }

    vmpool->sort_vm_resources();

    const vector<Resource *>& vm_rs = vmpool->get_vm_resources();

    std::ostringstream dss;
    //--------------------------------------------------------------------------
    dss << "Dispatching VMs to hosts:\n"
        << "\tVMID\tPriority\tHost\tSystem DS\n"
        << "\t--------------------------------------------------------------\n";
    //--------------------------------------------------------------------------

    //--------------------------------------------------------------------------
    // Dispatch each VM
    //--------------------------------------------------------------------------
    for (auto k = vm_rs.rbegin(); k != vm_rs.rend(); ++k)
    {
        bool dispatched = false;

        auto vm = vmpool->get((*k)->oid);

        const vector<Resource *> resources = vm->get_match_hosts();

        //----------------------------------------------------------------------
        // Test Image Datastore capacity, but not for migrations or resume
        //----------------------------------------------------------------------
        if (!resources.empty() && !vm->is_resched() && !vm->is_resume())
        {
            std::string error;

            if (vm->test_image_datastore_capacity(img_dspool, error) == false)
            {
                log_message(vm->get_oid(), Log::ERROR, "Cannot dispatch VM. " + error);
                continue;
            }
        }

        HostShareCapacity sr;

        vm->get_capacity(sr);

        //----------------------------------------------------------------------
        // Get the highest ranked host and best System DS for it
        //----------------------------------------------------------------------
        for (auto i = resources.rbegin() ; i != resources.rend(); ++i)
        {
            int  hid  = (*i)->oid;
            auto host = hpool->get(hid);

            if ( host == nullptr )
            {
                continue;
            }

            auto cid = host->get_cid();

            //------------------------------------------------------------------
            // Check host still match requirements with CURRENT_VMS
            //------------------------------------------------------------------
            if ( one_util::regex_match("CURRENT_VMS",
                                       vm->get_requirements().c_str()) == 0 )
            {
                char * estr;
                bool matched = true;

                if (host->eval_bool(vm->get_requirements(), matched, &estr)!=0)
                {
                    free(estr);
                    continue;
                }

                if (matched == false)
                {
                    std::ostringstream oss;

                    oss << "Host " << hid << " no longer meets requirements for VM "
                        << vm->get_oid();

                    NebulaLog::log("SCHED", Log::DDEBUG, oss.str());
                    continue;
                }
            }

            //------------------------------------------------------------------
            // Test host capacity
            //------------------------------------------------------------------
            std::string error;

            if (host->test_capacity(sr, error) != true)
            {
                continue;
            }

            //------------------------------------------------------------------
            // Get the highest ranked datastore
            //------------------------------------------------------------------
            const vector<Resource *> ds_resources = vm->get_match_datastores();

            int dsid = -1;

            DatastoreXML* ds = nullptr;

            for (auto j = ds_resources.rbegin() ; j != ds_resources.rend(); ++j)
            {
                ds = dspool->get((*j)->oid);

                if ( ds == nullptr )
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
                        ds_capacity =  ds->test_capacity(sr.disk);
                    }
                }
                else
                {
                    ds_capacity = host->test_ds_capacity(ds->get_oid(), sr.disk);
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

            if (dsid == -1)
            {
                continue;
            }

            //------------------------------------------------------------------
            // Get the highest ranked network
            //------------------------------------------------------------------
            const set<int>& nics_ids = vm->get_nics_ids();

            std::vector<std::pair<int, int>> matched_networks;
            map<int, int> matched_networks_counter;

            unsigned int num_matched_networks = 0;

            for(auto nic_id : nics_ids)
            {
                const vector<Resource *>& net_resources = vm->get_match_networks(nic_id);

                auto netid = -1;

                for (auto n = net_resources.rbegin(); n != net_resources.rend(); ++n)
                {
                    if ( diff_vnets && matched_networks_counter.find((*n)->oid) != matched_networks_counter.end() )
                    {
                        continue;
                    }

                    auto net = vnetpool->get((*n)->oid);

                    if ( net == nullptr )
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

                matched_networks.emplace_back(nic_id, netid);

                if ( matched_networks_counter.find(netid) != matched_networks_counter.end() )
                {
                    matched_networks_counter[netid] += 1;
                }
                else
                {
                    matched_networks_counter[netid] = 1;
                }

                num_matched_networks++;
            }

            if (!vm->is_resched() && num_matched_networks < nics_ids.size())
            {
                for (auto it = matched_networks_counter.begin(); it != matched_networks_counter.end(); it++)
                {
                    auto net = vnetpool->get(it->first);

                    net->rollback_leases(it->second);
                }

                continue;
            }

            //------------------------------------------------------------------
            // Create dispatch action for plan, and update host and DS capacity
            //------------------------------------------------------------------
            ActionXML action = plan.add_action((*k)->oid, hid, dsid);

            if (vm->is_resched())
            {
                action.migrate();
            }
            else
            {
                action.deploy();

                for (const auto& [nic_id, vnet_id] : matched_networks)
                {
                    action.add_nic(nic_id, vnet_id);
                }
            }

            dss << "\t" << (*k)->oid << "\t" << (*k)->priority << "\t\t" << hid
                << "\t" << dsid << "\n";

            // ------------ Add system DS usage -------------
            if (ds->is_shared())
            {
                if (!vm->is_resched() && !vm->is_resume())
                {
                    ds->add_capacity(sr.disk);
                }
            }
            else
            {
                host->add_ds_capacity(ds->get_oid(), sr.disk);
            }

            // ---------- Add image DS usage (i.e. clone = self) ----------
            if (!vm->is_resched())
            {
                vm->add_image_datastore_capacity(img_dspool);
            }

            //------------------------------------------------------------------
            // VM leaders needs to add the select host to the affined VMs
            //------------------------------------------------------------------
            const set<int>& affined_vms = vm->get_affined_vms();

            if ( affined_vms.size() > 0 )
            {
                for ( auto vm_id : affined_vms )
                {
                    VirtualMachineXML* avm = vmpool->get(vm_id);

                    if ( avm == nullptr )
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
            host->add_capacity(sr);

            dispatched = true;

            break;
        }

        if (!dispatched)
        {
            log_message(vm->get_oid(), Log::MessageType::ERROR,
                        "Cannot dispatch VM to any Host. Possible reasons: Not "
                        "enough capacity in Host or System DS, dispatch limit "
                        "reached, or limit of free leases reached.");
        }
    }

    plan.write();

    NebulaLog::log("SCHED", Log::DEBUG, dss);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void Scheduler::do_vm_groups()
{
    const auto vmgrps = vmgpool->get_objects();

    ostringstream oss;

    oss << "VM Group Scheduling information\n";

    for (auto it = vmgrps.begin(); it != vmgrps.end() ; ++it)
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
