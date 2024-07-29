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

#include "InformationManager.h"
#include "HostPool.h"
#include "VirtualMachinePool.h"
#include "Nebula.h"
#include "LifeCycleManager.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int InformationManager::start()
{
    std::string error;

    using namespace std::placeholders; // for _1

    NebulaLog::info("InM", "Starting Information Manager...");

    register_action(InformationManagerMessages::UNDEFINED,
                    &InformationManager::_undefined);

    register_action(InformationManagerMessages::HOST_STATE,
                    bind(&InformationManager::_host_state, this, _1));

    register_action(InformationManagerMessages::HOST_SYSTEM,
                    bind(&InformationManager::_host_system, this, _1));

    register_action(InformationManagerMessages::VM_STATE,
                    bind(&InformationManager::_vm_state, this, _1));

    int rc = DriverManager::start(error);

    if ( rc != 0 )
    {
        NebulaLog::error("InM", "Error starting Information Manager: " + error);
        return -1;
    }

    auto rftm = Nebula::instance().get_raftm();
    raft_status(rftm->get_state());

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void InformationManager::stop_monitor(int hid, const string& name, const string& im_mad)
{
    auto * imd = get_driver("monitord");

    if (!imd)
    {
        NebulaLog::error("InM", "Could not find information driver 'monitord'");

        return;
    }

    Template data;
    data.add("NAME", name);
    data.add("IM_MAD", im_mad);
    string tmp;

    im_msg_t msg;

    msg.type(InformationManagerMessages::STOP_MONITOR);
    msg.oid(hid);
    msg.payload(data.to_xml(tmp));

    imd->write(msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int InformationManager::start_monitor(Host * host, bool update_remotes)
{
    ostringstream oss;

    oss << "Monitoring host "<< host->get_name()<< " ("<< host->get_oid()<< ")";
    NebulaLog::log("InM", Log::DEBUG, oss);

    auto imd = get_driver("monitord");

    if (!imd)
    {
        host->error("Cannot find driver: 'monitord'");
        return -1;
    }

    im_msg_t msg;

    msg.type(InformationManagerMessages::START_MONITOR);
    msg.oid(host->get_oid());
    msg.payload(to_string(update_remotes));

    imd->write(msg);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void InformationManager::update_host(Host *host)
{
    auto imd = get_driver("monitord");

    if (!imd)
    {
        return;
    }

    string tmp;
    im_msg_t msg;

    msg.type(InformationManagerMessages::UPDATE_HOST);
    msg.oid(host->get_oid());
    msg.payload(host->to_xml(tmp));

    imd->write(msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void InformationManager::delete_host(int hid)
{
    auto imd = get_driver("monitord");

    if (!imd)
    {
        return;
    }

    im_msg_t msg;

    msg.type(InformationManagerMessages::DEL_HOST);
    msg.oid(hid);

    imd->write(msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void InformationManager::raft_status(RaftManager::State state)
{
    auto imd = get_driver("monitord");

    if (!imd)
    {
        NebulaLog::error("InM", "Could not find information driver 'monitord'");

        return;
    }

    if (state == RaftManager::SOLO || state == RaftManager::LEADER)
    {
        // Send host pool to Monitor Daemon
        string xml_hosts;

        hpool->dump(xml_hosts, "", 0, -1, false);

        im_msg_t msg;

        msg.type(InformationManagerMessages::HOST_LIST);
        msg.payload(xml_hosts);

        imd->write(msg);
    }

    im_msg_t msg;

    msg.type(InformationManagerMessages::RAFT_STATUS);
    msg.payload(RaftManager::state_to_str(state));

    imd->write(msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void InformationManager::_undefined(unique_ptr<im_msg_t> msg)
{
    NebulaLog::warn("InM", "Received undefined message: " + msg->payload() +
                    "from host: " + to_string(msg->oid()));
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* HOST_STATE - <state_str> <optional_desciption>                             */

void InformationManager::_host_state(unique_ptr<im_msg_t> msg)
{
    NebulaLog::ddebug("InM", "HOST_STATE update from host: " +
                      to_string(msg->oid()) + ". Host information: " + msg->payload());

    string str_state;
    string err_message;

    istringstream is(msg->payload());

    is >> str_state >> ws;

    if (is.good())
    {
        getline(is, err_message);
    }

    Host::HostState new_state;

    if (Host::str_to_state(str_state, new_state) != 0)
    {
        NebulaLog::warn("InM", "Unable to decode host state: " + str_state);
        return;
    }

    auto host = hpool->get(msg->oid());

    if (host == nullptr)
    {
        return;
    }

    if (host->get_state() == Host::OFFLINE) // Should not receive any info
    {
        return;
    }

    if (host->get_state() != new_state)
    {
        if ( new_state == Host::ERROR )
        {
            host->error(err_message);

            LifeCycleManager* lcm = Nebula::instance().get_lcm();

            for (const auto& vmid : host->get_vm_ids())
            {
                lcm->trigger_monitor_done(vmid);
            }
        }
        else
        {
            host->set_state(new_state);
        }

        hpool->update(host.get());
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void InformationManager::_host_system(unique_ptr<im_msg_t> msg)
{
    NebulaLog::ddebug("InM", "HOST_SYSTEM update from host: " +
                      to_string(msg->oid()) + ". Host information: " + msg->payload());

    char *   error_msg;
    Template tmpl;

    int rc = tmpl.parse(msg->payload(), &error_msg);

    if (rc != 0)
    {
        ostringstream oss;
        oss << "Error parsing monitoring template for host " << msg->oid()
            << "\nMessage: " << msg->payload()
            << "Error: " << error_msg;
        NebulaLog::error("InM", oss.str());

        free(error_msg);
        return;
    }

    // -------------------------------------------------------------------------

    auto host = hpool->get(msg->oid());

    if (host == nullptr)
    {
        return;
    }

    if ( host->get_state() == Host::OFFLINE ) //Should not receive any info
    {
        return;
    }

    // -------------------------------------------------------------------------

    host->update_info(tmpl);

    hpool->update(host.get());

    NebulaLog::debug("InM", "Host " + host->get_name() + " (" +
                     to_string(host->get_oid()) + ") successfully monitored.");
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static void test_and_trigger(const string& state_str, VirtualMachine * vm)
{
    auto state = vm->get_state();
    auto lcm_state = vm->get_lcm_state();
    auto lcm = Nebula::instance().get_lcm();

    if (state_str == "RUNNING")
    {
        if (state == VirtualMachine::POWEROFF ||
            state == VirtualMachine::SUSPENDED ||
            (state == VirtualMachine::ACTIVE &&
             (lcm_state == VirtualMachine::UNKNOWN ||
              lcm_state == VirtualMachine::BOOT ||
              lcm_state == VirtualMachine::BOOT_POWEROFF ||
              lcm_state == VirtualMachine::BOOT_UNKNOWN  ||
              lcm_state == VirtualMachine::BOOT_SUSPENDED ||
              lcm_state == VirtualMachine::BOOT_STOPPED ||
              lcm_state == VirtualMachine::BOOT_UNDEPLOY ||
              lcm_state == VirtualMachine::BOOT_MIGRATE ||
              lcm_state == VirtualMachine::BOOT_MIGRATE_FAILURE ||
              lcm_state == VirtualMachine::BOOT_STOPPED_FAILURE ||
              lcm_state == VirtualMachine::BOOT_UNDEPLOY_FAILURE ||
              lcm_state == VirtualMachine::BOOT_FAILURE)))
        {
            lcm->trigger_monitor_poweron(vm->get_oid());
            return;
        }
    }
    else if (state_str == "FAILURE")
    {
        if (state == VirtualMachine::ACTIVE &&
            (lcm_state == VirtualMachine::RUNNING ||
             lcm_state == VirtualMachine::UNKNOWN))
        {
            lcm->trigger_monitor_done(vm->get_oid());

            vm->log("VMM", Log::INFO,
                    "VM running but monitor state is ERROR.");

            return;
        }
    }
    else if (state_str == "SUSPENDED")
    {
        if (state == VirtualMachine::ACTIVE &&
            (lcm_state == VirtualMachine::RUNNING ||
             lcm_state == VirtualMachine::UNKNOWN))
        {
            lcm->trigger_monitor_suspend(vm->get_oid());

            vm->log("VMM", Log::INFO,
                    "VM running but monitor state is PAUSED.");

            return;
        }
    }
    else if (state_str == "POWEROFF")
    {
        if (state == VirtualMachine::ACTIVE &&
            (lcm_state == VirtualMachine::RUNNING ||
             lcm_state == VirtualMachine::UNKNOWN ||
             lcm_state == VirtualMachine::SHUTDOWN ||
             lcm_state == VirtualMachine::SHUTDOWN_POWEROFF ||
             lcm_state == VirtualMachine::SHUTDOWN_UNDEPLOY))
        {
            lcm->trigger_monitor_poweroff(vm->get_oid());
            return;
        }
    }
}


void InformationManager::_vm_state(unique_ptr<im_msg_t> msg)
{
    LifeCycleManager* lcm = Nebula::instance().get_lcm();

    char *   error_msg;
    Template tmpl;

    int rc = tmpl.parse(msg->payload(), &error_msg);

    if (rc != 0)
    {
        NebulaLog::error("InM", string("Error parsing VM_STATE: ") + error_msg);
        NebulaLog::error("InM", "Received message was: " + msg->payload());

        free(error_msg);

        return;
    }

    /* ---------------------------------------------------------------------- */
    /* Proces the template & VM state from the monitoring info                */
    /* ---------------------------------------------------------------------- */
    int id;

    string deploy_id;
    string state_str;

    vector<VectorAttribute*> vms;
    tmpl.get("VM", vms);

    set<int> hv_ids;

    for (const auto& vm_tmpl : vms)
    {
        if (vm_tmpl->vector_value("ID", id) != 0)
        {
            id = -1;
        }

        vm_tmpl->vector_value("DEPLOY_ID", deploy_id);
        vm_tmpl->vector_value("STATE", state_str);

        if (id < 0)
        {
            // Check wild VMs
            id = vmpool->get_vmid(deploy_id);

            if (id < 0)
            {
                // Not imported wild, ignore VM state
                continue;
            }
        }

        hv_ids.insert(id);

        NebulaLog::debug("InM", "VM_STATE update from host: " +
                         to_string(msg->oid()) + ". VM id: " + to_string(id) + ", state: " +
                         state_str);

        auto vm = vmpool->get(id);

        if (vm == nullptr)
        {
            NebulaLog::warn("InM", "Unable to find VM, id: " + to_string(id));
            continue;
        }

        if (!vm->hasHistory() || vm->get_hid() != msg->oid())
        {
            //VM is not running in this host anymore, ignore
            continue;
        }

        if (vm->get_deploy_id() != deploy_id)
        {
            vm->set_deploy_id(deploy_id);
            vmpool->update(vm.get());
        }

        // Update monitoring date in history record
        vm->set_vm_info();

        vmpool->update_history(vm.get());

        /* ------------------------------------------------------------------ */
        /* Apply state changes                                                */
        /* ------------------------------------------------------------------ */
        test_and_trigger(state_str, vm.get());
    }

    /* ---------------------------------------------------------------------- */
    /* Process sync state messages for missing VMs and Zombies                */
    /* ---------------------------------------------------------------------- */
    bool   sync_state    = false;
    string missing_state = "POWEROFF";

    if (!(tmpl.get("SYNC_STATE", sync_state) && sync_state))
    {
        return;
    }

    if (!tmpl.get("MISSING_STATE", missing_state))
    {
        return;
    }

    auto host = hpool->get(msg->oid());

    if (host == nullptr)
    {
        return;
    }

    const set<int>& host_ids = host->get_vm_ids();
    set<int> missing;
    set<int> zombies;

    set_difference(host_ids.begin(), host_ids.end(), hv_ids.begin(),
                   hv_ids.end(), inserter(missing, missing.begin()));

    set_difference(hv_ids.begin(), hv_ids.end(), host_ids.begin(),
                   host_ids.end(), inserter(zombies, zombies.begin()));

    host->update_zombies(zombies);

    hpool->update(host.get());

    host.reset();

    for (auto& it : missing)
    {
        auto vm = vmpool->get(it);

        if (vm == nullptr)
        {
            continue;
        }

        if (!vm->hasHistory() || (vm->get_hid() != msg->oid()))
        {
            continue;
        }

        if (vm->get_state() != VirtualMachine::ACTIVE || (
                    vm->get_lcm_state() != VirtualMachine::UNKNOWN &&
                    vm->get_lcm_state() != VirtualMachine::RUNNING &&
                    vm->get_lcm_state() != VirtualMachine::SHUTDOWN &&
                    vm->get_lcm_state() != VirtualMachine::SHUTDOWN_POWEROFF &&
                    vm->get_lcm_state() != VirtualMachine::SHUTDOWN_UNDEPLOY))
        {
            continue;
        }

        NebulaLog::debug("InM", "VM_STATE update from host: " +
                         to_string(msg->oid()) + ". VM id: " + to_string(vm->get_oid()) +
                         ", state: " + missing_state);

        if (missing_state == "UNKNOWN")
        {
            lcm->trigger_monitor_done(vm->get_oid());
        }
        else
        {
            lcm->trigger_monitor_poweroff(vm->get_oid());
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
