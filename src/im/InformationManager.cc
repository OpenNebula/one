/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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
#include "OpenNebulaMessages.h"
#include "VirtualMachinePool.h"
#include "Nebula.h"
#include "LifeCycleManager.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int InformationManager::start()
{
    std::string error;

    using namespace std::placeholders; // for _1

    register_action(OpenNebulaMessages::UNDEFINED,
            &InformationManager::_undefined);

    register_action(OpenNebulaMessages::HOST_STATE,
            bind(&InformationManager::_host_state, this, _1));

    register_action(OpenNebulaMessages::SYSTEM_HOST,
            bind(&InformationManager::_system_host, this, _1));

    register_action(OpenNebulaMessages::VM_STATE,
            bind(&InformationManager::_vm_state, this, _1));

    int rc = DriverManager::start(error);

    if ( rc != 0 )
    {
        NebulaLog::error("InM", "Error starting Information Manager: " + error);
        return -1;
    }

    NebulaLog::info("InM", "Starting Information Manager...");

    im_thread = std::thread([&] {
        NebulaLog::info("InM", "Information Manager started.");

        am.loop(timer_period);

        NebulaLog::info("InM", "Information Manager stopped.");
    });

    // Send the list of hosts to the driver

    auto * imd = get_driver("monitord");

    if (!imd)
    {
        NebulaLog::error("InM", "Could not find information driver 'monitor'");

        return rc;
    }

    string xml_hosts;
    hpool->dump(xml_hosts, "", "", false);

    Message<OpenNebulaMessages> msg;

    msg.type(OpenNebulaMessages::HOST_LIST);
    msg.payload(xml_hosts);

    imd->write(msg);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void InformationManager::stop_monitor(int hid, const string& name, const string& im_mad)
{
    auto * imd = get_driver("monitord");

    if (!imd)
    {
        NebulaLog::error("InM", "Could not find information driver 'monitor'");

        return;
    }

    Template data;
    data.add("NAME", name);
    data.add("IM_MAD", im_mad);
    string tmp;

    Message<OpenNebulaMessages> msg;

    msg.type(OpenNebulaMessages::STOP_MONITOR);
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
    NebulaLog::log("InM",Log::DEBUG,oss);

    auto imd = get_driver("monitord");

    if (!imd)
    {
        host->error("Cannot find driver: 'monitor'");
        return -1;
    }

    Message<OpenNebulaMessages> msg;

    msg.type(OpenNebulaMessages::START_MONITOR);
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
    Message<OpenNebulaMessages> msg;

    msg.type(OpenNebulaMessages::UPDATE_HOST);
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

    Message<OpenNebulaMessages> msg;

    msg.type(OpenNebulaMessages::DEL_HOST);
    msg.oid(hid);

    imd->write(msg);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void InformationManager::_undefined(unique_ptr<Message<OpenNebulaMessages>> msg)
{
    NebulaLog::warn("InM", "Received undefined message: " + msg->payload());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void InformationManager::_host_state(unique_ptr<Message<OpenNebulaMessages>> msg)
{
    NebulaLog::debug("InM", "Received host_state message: " + msg->payload());

    string str_state = msg->payload();
    Host::HostState new_state;

    if (Host::str_to_state(str_state, new_state) != 0)
    {
        NebulaLog::warn("InM", "Unable to decode host state: " + str_state);
        return;
    }

    Host* host = hpool->get(msg->oid());

    if (host == nullptr)
    {
        return;
    }

    if (host->get_state() == Host::OFFLINE) // Should not receive any info
    {
        host->unlock();

        return;
    }

    if (host->get_state() != new_state)
    {
        host->set_state(new_state);

        if ( new_state == Host::ERROR )
        {
            LifeCycleManager* lcm = Nebula::instance().get_lcm();

            for (const auto& vmid : host->get_vm_ids())
            {
                lcm->trigger(LCMAction::MONITOR_DONE, vmid);
            }
        }

        hpool->update(host);
    }

    host->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void InformationManager::_system_host(unique_ptr<Message<OpenNebulaMessages>> msg)
{
    NebulaLog::debug("InM", "Received SYSTEM_HOST message id: " +
            to_string(msg->oid()));

    Host* host = hpool->get(msg->oid());

    if (host == nullptr)
    {
        return;
    }

    if ( host->get_state() == Host::OFFLINE ) //Should not receive any info
    {
        host->unlock();
        return;
    }

    // -------------------------------------------------------------------------

    char *   error_msg;
    Template tmpl;

    int rc = tmpl.parse(msg->payload(), &error_msg);

    if (rc != 0)
    {
        host->error(string("Error parsing monitoring template: ") + error_msg);

        free(error_msg);

        host->unlock();
        return;
    }

    // -------------------------------------------------------------------------

    host->update_info(tmpl);

    hpool->update(host);

    NebulaLog::debug("InM", "Host " + host->get_name() + " (" +
         to_string(host->get_oid()) + ") successfully monitored.");

    host->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void InformationManager::timer_action(const ActionRequest& ar)
{

}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void InformationManager::_vm_state(unique_ptr<Message<OpenNebulaMessages>> msg)
{
    char *   error_msg;
    Template tmpl;

    int rc = tmpl.parse(msg->payload(), &error_msg);

    if (rc != 0)
    {
        NebulaLog::error("InM", string("Error parsing VM_STATE: ") + error_msg);

        free(error_msg);

        return;
    }

    // Proces the template
    int id;
    string deploy_id;
    string uuid;
    string state_str;

    vector<VectorAttribute*> vms;
    tmpl.get("VM", vms);

    for (const auto& vm_tmpl : vms)
    {
        if (vm_tmpl->vector_value("ID", id) != 0)
        {
            id = -1;
        }

        vm_tmpl->vector_value("DEPLOY_ID", deploy_id);
        vm_tmpl->vector_value("UUID", uuid);
        vm_tmpl->vector_value("STATE", state_str);

        if (id < 0)
        {
            // Check wild VMs
            id = vmpool->get_vmid(uuid);

            if (id < 0)
            {
                // Not imported wild, ignore VM state
                return;
            }
        }

        NebulaLog::debug("InM", "Received VM_STATE for VM id: " +
            to_string(id) + ", state: " + state_str);

        auto* vm = vmpool->get(id);

        if (vm == nullptr)
        {
            NebulaLog::warn("InM", "Unable to find VM, id: " + to_string(id));
            continue;
        }

        if (vm->get_deploy_id() != deploy_id)
        {
            vm->set_deploy_id(deploy_id);
            vmpool->update(vm);
        }

        /* ---------------------------------------------------------------------- */
        /* Process the VM state from the monitoring info                          */
        /* ---------------------------------------------------------------------- */

        LifeCycleManager* lcm = Nebula::instance().get_lcm();

        if (state_str == "RUNNING")
        {
            if ( vm->get_state() == VirtualMachine::POWEROFF ||
                 vm->get_state() == VirtualMachine::SUSPENDED ||
                (vm->get_state() == VirtualMachine::ACTIVE &&
                (  vm->get_lcm_state() == VirtualMachine::UNKNOWN ||
                    vm->get_lcm_state() == VirtualMachine::BOOT ||
                    vm->get_lcm_state() == VirtualMachine::BOOT_POWEROFF ||
                    vm->get_lcm_state() == VirtualMachine::BOOT_UNKNOWN  ||
                    vm->get_lcm_state() == VirtualMachine::BOOT_SUSPENDED ||
                    vm->get_lcm_state() == VirtualMachine::BOOT_STOPPED ||
                    vm->get_lcm_state() == VirtualMachine::BOOT_UNDEPLOY ||
                    vm->get_lcm_state() == VirtualMachine::BOOT_MIGRATE ||
                    vm->get_lcm_state() == VirtualMachine::BOOT_MIGRATE_FAILURE ||
                    vm->get_lcm_state() == VirtualMachine::BOOT_STOPPED_FAILURE ||
                    vm->get_lcm_state() == VirtualMachine::BOOT_UNDEPLOY_FAILURE ||
                    vm->get_lcm_state() == VirtualMachine::BOOT_FAILURE )))
            {
                lcm->trigger(LCMAction::MONITOR_POWERON, vm->get_oid());
            }
        }
        else if (state_str == "FAILURE")
        {
            if ( vm->get_state() == VirtualMachine::ACTIVE &&
                ( vm->get_lcm_state() == VirtualMachine::RUNNING ||
                vm->get_lcm_state() == VirtualMachine::UNKNOWN ))
            {
                vm->log("VMM",Log::INFO,"VM running but monitor state is ERROR.");

                lcm->trigger(LCMAction::MONITOR_DONE, vm->get_oid());
            }
        }
        else if (state_str == "SUSPENDED")
        {
            if ( vm->get_state() == VirtualMachine::ACTIVE &&
                ( vm->get_lcm_state() == VirtualMachine::RUNNING ||
                vm->get_lcm_state() == VirtualMachine::UNKNOWN ))
            {
                vm->log("VMM",Log::INFO, "VM running but monitor state is PAUSED.");

                lcm->trigger(LCMAction::MONITOR_SUSPEND, vm->get_oid());
            }
        }
        else if (state_str == "POWEROFF")
        {
            if ( vm->get_state() == VirtualMachine::ACTIVE &&
                ( vm->get_lcm_state() == VirtualMachine::RUNNING ||
                vm->get_lcm_state() == VirtualMachine::UNKNOWN ||
                vm->get_lcm_state() == VirtualMachine::SHUTDOWN ||
                vm->get_lcm_state() == VirtualMachine::SHUTDOWN_POWEROFF ||
                vm->get_lcm_state() == VirtualMachine::SHUTDOWN_UNDEPLOY ))
            {
                lcm->trigger(LCMAction::MONITOR_POWEROFF, vm->get_oid());
            }
        }

        vm->unlock();
    }

}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

