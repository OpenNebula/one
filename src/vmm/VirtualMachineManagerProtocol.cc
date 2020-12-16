/* -------------------------------------------------------------------------- */
/* Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                */
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

#include "VirtualMachineManager.h"
#include "VirtualMachinePool.h"
#include "SecurityGroupPool.h"
#include "LifeCycleManager.h"
#include "Nebula.h"
#include "NebulaLog.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* Helpers for the protocol function                                          */
/* -------------------------------------------------------------------------- */

static void log_message(vm_msg_t* msg)
{
    ostringstream oss;

    oss << "Message received: ";
    msg->write_to(oss);

    NebulaLog::log("IPM", Log::DEBUG, oss);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineManager::log_error(VirtualMachine* vm,
                                      const string&   payload,
                                      const char *    msg)
{
    ostringstream oss;

    oss << msg;

    if (!payload.empty() && payload[0] != '-')
    {
        oss << ": " << payload;
        vm->set_template_error_message(oss.str());
    }

    vm->log("VMM", Log::ERROR, oss);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineManager::log_error(int           vm_id,
                                      const string& payload,
                                      const char *  msg)
{
    ostringstream oss;

    oss << msg;

    if ( auto vm = vmpool->get(vm_id) )
    {
        if (!payload.empty() && payload[0] != '-')
        {
            oss << ": " << payload;

            vm->set_template_error_message(oss.str());

            vmpool->update(vm.get());
        }

        vm->log("VMM", Log::ERROR, oss);
    }
}

/* -------------------------------------------------------------------------- */

bool VirtualMachineManager::check_vm_state(int vm_id, vm_msg_t* msg)
{
    auto vm = vmpool->get_ro(vm_id);

    if (vm == nullptr)
    {
        return false;
    }

    if (vm->get_lcm_state() == VirtualMachine::LCM_INIT)
    {
        ostringstream oss;
        oss.str("");
        oss << "Ignored: ";
        msg->write_to(oss);
        vm->log("VMM", Log::WARNING, oss);

        return false;
    }

    return true;
}

/* ************************************************************************** */
/* Driver Protocol Interface                                                  */
/* ************************************************************************** */

void VirtualMachineManager::_undefined(unique_ptr<vm_msg_t> msg)
{
    NebulaLog::warn("VMM", "Received UNDEFINED msg: " + msg->payload());
}

/* -------------------------------------------------------------------------- */

void VirtualMachineManager::_deploy(unique_ptr<vm_msg_t> msg)
{
    log_message(msg.get());

    int id = msg->oid();

    if (!check_vm_state(id, msg.get()))
    {
        return;
    }

    void (LifeCycleManager::*action)(int) = &LifeCycleManager::trigger_deploy_success;

    if (msg->status() == "SUCCESS")
    {
        if (auto vm = vmpool->get(id))
        {
            istringstream is(msg->payload());

            string deploy_id;

            is >> deploy_id;

            if (!deploy_id.empty())
            {
                vm->set_deploy_id(deploy_id);
            }
            else
            {
                action = &LifeCycleManager::trigger_deploy_failure;
                log_error(vm.get(), msg->payload(), "Empty deploy ID for virtual machine");
            }

            vmpool->update(vm.get());
        }
    }
    else
    {
        action = &LifeCycleManager::trigger_deploy_failure;
        log_error(id, msg->payload(), "Error deploying virtual machine");
    }

    LifeCycleManager * lcm = Nebula::instance().get_lcm();

    (lcm->*action)(msg->oid());
}

/* -------------------------------------------------------------------------- */

void VirtualMachineManager::_shutdown(unique_ptr<vm_msg_t> msg)
{
    log_message(msg.get());

    int id = msg->oid();
    auto lcm = Nebula::instance().get_lcm();

    if (!check_vm_state(id, msg.get()))
    {
        return;
    }

    if (msg->status() == "SUCCESS")
    {
        lcm->trigger_shutdown_success(id);
    }
    else
    {
        log_error(id, msg->payload(), "Error shutting down VM");

        lcm->trigger_shutdown_failure(msg->oid());
    }
}

/* -------------------------------------------------------------------------- */

void VirtualMachineManager::_reset(unique_ptr<vm_msg_t> msg)
{
    log_message(msg.get());

    int id = msg->oid();

    if (!check_vm_state(id, msg.get()))
    {
        return;
    }

    if (msg->status() == "SUCCESS")
    {
        if (auto vm = vmpool->get_ro(id))
        {
            vm->log("VMM", Log::INFO, "VM successfully rebooted-hard.");
        }
    }
    else
    {
        log_error(id, msg->payload(),
                  "Error rebooting-hard VM, assume it's still running");
    }
}

/* -------------------------------------------------------------------------- */

void VirtualMachineManager::_reboot(unique_ptr<vm_msg_t> msg)
{
    log_message(msg.get());

    int id = msg->oid();

    if (!check_vm_state(id, msg.get()))
    {
        return;
    }

    if (msg->status() == "SUCCESS")
    {
        if ( auto vm = vmpool->get_ro(id) )
        {
            vm->log("VMM", Log::INFO, "VM successfully rebooted.");
        }
    }
    else
    {
        log_error(id, msg->payload(),
                  "Error rebooting VM, assume it's still running");
    }
}

/* -------------------------------------------------------------------------- */

void VirtualMachineManager::_cancel(unique_ptr<vm_msg_t> msg)
{
    log_message(msg.get());

    int id = msg->oid();
    auto lcm = Nebula::instance().get_lcm();

    if (!check_vm_state(id, msg.get()))
    {
        return;
    }

    if (msg->status() == "SUCCESS")
    {
        lcm->trigger_shutdown_success(id);
    }
    else
    {
        log_error(msg->oid(), msg->payload(), "Error canceling VM");

        lcm->trigger_shutdown_failure(id);
    }
}

/* -------------------------------------------------------------------------- */

void VirtualMachineManager::_cleanup(unique_ptr<vm_msg_t> msg)
{
    log_message(msg.get());

    int id = msg->oid();
    auto lcm = Nebula::instance().get_lcm();

    if (!check_vm_state(id, msg.get()))
    {
        return;
    }

    if (msg->status() == "SUCCESS")
    {
        if ( auto vm = vmpool->get_ro(id) )
        {
            vm->log("VMM", Log::INFO, "Host successfully cleaned.");
        }
    }
    else
    {
        log_error(id, msg->payload(), "Error cleaning Host");
    }

    lcm->trigger_cleanup_callback(id);
}

/* -------------------------------------------------------------------------- */

void VirtualMachineManager::_checkpoint(unique_ptr<vm_msg_t> msg)
{
    log_message(msg.get());
}

/* -------------------------------------------------------------------------- */

void VirtualMachineManager::_save(unique_ptr<vm_msg_t> msg)
{
    log_message(msg.get());

    int id = msg->oid();
    auto lcm = Nebula::instance().get_lcm();

    if (!check_vm_state(id, msg.get()))
    {
        return;
    }

    if (msg->status() == "SUCCESS")
    {
        lcm->trigger_save_success(id);
    }
    else
    {
        log_error(id, msg->payload(), "Error saving VM state");

        lcm->trigger_save_failure(id);
    }
}

/* -------------------------------------------------------------------------- */

void VirtualMachineManager::_restore(unique_ptr<vm_msg_t> msg)
{
    log_message(msg.get());

    int id = msg->oid();
    auto lcm = Nebula::instance().get_lcm();

    if (!check_vm_state(id, msg.get()))
    {
        return;
    }

    if (msg->status() == "SUCCESS")
    {
        lcm->trigger_deploy_success(id);
    }
    else
    {
        log_error(id, msg->payload(), "Error restoring VM");

        lcm->trigger_deploy_failure(id);
    }
}

/* -------------------------------------------------------------------------- */

void VirtualMachineManager::_migrate(unique_ptr<vm_msg_t> msg)
{
    log_message(msg.get());

    int id = msg->oid();
    auto lcm = Nebula::instance().get_lcm();

    if (!check_vm_state(id, msg.get()))
    {
        return;
    }

    if (msg->status() == "SUCCESS")
    {
        lcm->trigger_deploy_success(id);
    }
    else
    {
        log_error(msg->oid(), msg->payload(), "Error live migrating VM");

        lcm->trigger_deploy_failure(id);
    }
}

/* -------------------------------------------------------------------------- */

void VirtualMachineManager::_attachdisk(unique_ptr<vm_msg_t> msg)
{
    log_message(msg.get());

    int id = msg->oid();
    auto lcm = Nebula::instance().get_lcm();

    if (!check_vm_state(id, msg.get()))
    {
        return;
    }

    if (msg->status() == "SUCCESS")
    {
        if ( auto vm = vmpool->get_ro(id) )
        {
            vm->log("VMM", Log::INFO, "VM Disk successfully attached.");

            lcm->trigger_attach_success(id);
        }
    }
    else
    {
        log_error(id, msg->payload(), "Error attaching new VM Disk");

        lcm->trigger_attach_failure(id);
    }
}

/* -------------------------------------------------------------------------- */

void VirtualMachineManager::_detachdisk(unique_ptr<vm_msg_t> msg)
{
    log_message(msg.get());

    int id = msg->oid();
    auto lcm = Nebula::instance().get_lcm();

    if (!check_vm_state(id, msg.get()))
    {
        return;
    }

    if (msg->status() == "SUCCESS")
    {
        if ( auto vm = vmpool->get_ro(id) )
        {
            vm->log("VMM",Log::INFO,"VM Disk successfully detached.");

            lcm->trigger_detach_success(id);
        }
    }
    else
    {
        log_error(id, msg->payload(), "Error detaching VM Disk");

        lcm->trigger_detach_failure(id);
    }
}

/* -------------------------------------------------------------------------- */

void VirtualMachineManager::_attachnic(unique_ptr<vm_msg_t> msg)
{
    log_message(msg.get());

    int id = msg->oid();
    auto lcm = Nebula::instance().get_lcm();

    if (!check_vm_state(id, msg.get()))
    {
        return;
    }

    if (msg->status() == "SUCCESS")
    {
        if ( auto vm = vmpool->get_ro(id) )
        {
            vm->log("VMM", Log::INFO, "VM NIC Successfully attached.");

            lcm->trigger_attach_nic_success(id);
        }
    }
    else
    {
        log_error(id, msg->payload(), "Error attaching new VM NIC");

        lcm->trigger_attach_nic_failure(id);
    }
}

/* -------------------------------------------------------------------------- */

void VirtualMachineManager::_detachnic(unique_ptr<vm_msg_t> msg)
{
    log_message(msg.get());

    int id = msg->oid();
    auto lcm = Nebula::instance().get_lcm();

    if (!check_vm_state(id, msg.get()))
    {
        return;
    }

    if (msg->status() == "SUCCESS")
    {
        if ( auto vm = vmpool->get_ro(id) )
        {
            vm->log("VMM",Log::INFO, "VM NIC Successfully detached.");

            lcm->trigger_detach_nic_success(id);
        }
    }
    else
    {
        log_error(id, msg->payload(), "Error detaching VM NIC");

        lcm->trigger_detach_nic_failure(id);
    }
}

/* -------------------------------------------------------------------------- */

void VirtualMachineManager::_snapshotcreate(unique_ptr<vm_msg_t> msg)
{
    log_message(msg.get());

    int id = msg->oid();
    auto lcm = Nebula::instance().get_lcm();

    if (!check_vm_state(id, msg.get()))
    {
        return;
    }

    if (msg->status() == "SUCCESS")
    {
        string hypervisor_id;

        istringstream is(msg->payload());

        is >> hypervisor_id;

        if ( auto vm = vmpool->get(id) )
        {
            vm->update_snapshot_id(hypervisor_id);

            vmpool->update(vm.get());

            vm->log("VMM", Log::INFO, "VM Snapshot successfully created.");

            lcm->trigger_snapshot_create_success(id);
        }
    }
    else
    {
        log_error(msg->oid(), msg->payload(), "Error creating new VM Snapshot");

        lcm->trigger_snapshot_create_failure(id);
    }
}

/* -------------------------------------------------------------------------- */

void VirtualMachineManager::_snapshotrevert(unique_ptr<vm_msg_t> msg)
{
    log_message(msg.get());

    int id = msg->oid();
    auto lcm = Nebula::instance().get_lcm();

    if (!check_vm_state(id, msg.get()))
    {
        return;
    }

    if (msg->status() == "SUCCESS")
    {
        if ( auto vm = vmpool->get_ro(id) )
        {
            vm->log("VMM",Log::INFO,"VM Snapshot successfully reverted.");

            lcm->trigger_snapshot_revert_success(id);
        }
    }
    else
    {
        log_error(id, msg->payload(), "Error reverting VM Snapshot");

        lcm->trigger_snapshot_revert_failure(id);
    }
}

/* -------------------------------------------------------------------------- */

void VirtualMachineManager::_snapshotdelete(unique_ptr<vm_msg_t> msg)
{
    log_message(msg.get());

    int id = msg->oid();
    auto lcm = Nebula::instance().get_lcm();

    if (!check_vm_state(id, msg.get()))
    {
        return;
    }

    if (msg->status() == "SUCCESS")
    {
        if ( auto vm = vmpool->get_ro(id) )
        {
            vm->log("VMM",Log::INFO,"VM Snapshot successfully deleted.");

            lcm->trigger_snapshot_delete_success(id);
        }
    }
    else
    {
        log_error(id, msg->payload(), "Error deleting VM Snapshot");

        lcm->trigger_snapshot_delete_failure(id);
    }
}

/* -------------------------------------------------------------------------- */

void VirtualMachineManager::_disksnapshotcreate(unique_ptr<vm_msg_t> msg)
{
    log_message(msg.get());

    int id = msg->oid();
    auto lcm = Nebula::instance().get_lcm();

    if (!check_vm_state(id, msg.get()))
    {
        return;
    }

    if (msg->status() == "SUCCESS" )
    {
        if ( auto vm = vmpool->get_ro(id) )
        {
            vm->log("VMM", Log::INFO, "VM disk snapshot successfully created.");

            lcm->trigger_disk_snapshot_success(id);
        }
    }
    else
    {
        log_error(id, msg->payload(), "Error creating new disk snapshot");

        lcm->trigger_disk_snapshot_failure(id);
    }
}

/* -------------------------------------------------------------------------- */

void VirtualMachineManager::_disksnapshotrevert(unique_ptr<vm_msg_t> msg)
{
    log_message(msg.get());

    int id = msg->oid();
    auto lcm = Nebula::instance().get_lcm();

    if (!check_vm_state(id, msg.get()))
    {
        return;
    }

    if (msg->status() == "SUCCESS")
    {
        if ( auto vm = vmpool->get_ro(id) )
        {
            vm->log("VMM", Log::INFO, "VM disk state reverted.");

            lcm->trigger_disk_snapshot_success(id);
        }
    }
    else
    {
        log_error(id, msg->payload(), "Error reverting disk snapshot");

        lcm->trigger_disk_snapshot_failure(id);
    }
}

/* -------------------------------------------------------------------------- */

void VirtualMachineManager::_resizedisk(unique_ptr<vm_msg_t> msg)
{
    log_message(msg.get());

    int id = msg->oid();
    auto lcm = Nebula::instance().get_lcm();

    if (!check_vm_state(id, msg.get()))
    {
        return;
    }

    if (msg->status() == "SUCCESS" )
    {
        if ( auto vm = vmpool->get_ro(id) )
        {
            vm->log("VMM", Log::INFO, "VM disk successfully resized");

            lcm->trigger_disk_resize_success(id);
        }
    }
    else
    {
        log_error(id, msg->payload(), "Error resizing disk");

        lcm->trigger_disk_resize_failure(id);
    }
}

/* -------------------------------------------------------------------------- */

void VirtualMachineManager::_updateconf(unique_ptr<vm_msg_t> msg)
{
    log_message(msg.get());

    int id = msg->oid();
    auto lcm = Nebula::instance().get_lcm();

    if (!check_vm_state(id, msg.get()))
    {
        return;
    }

    if (msg->status() == "SUCCESS" )
    {
        if ( auto vm = vmpool->get_ro(id) )
        {
            vm->log("VMM", Log::INFO, "VM update conf succesfull.");

            lcm->trigger_update_conf_success(id);
        }
    }
    else
    {
        log_error(id, msg->payload(), "Error updating conf for VM");

        lcm->trigger_update_conf_failure(id);
    }
}

/* -------------------------------------------------------------------------- */

void VirtualMachineManager::_updatesg(unique_ptr<vm_msg_t> msg)
{
    log_message(msg.get());

    int id = msg->oid();
    auto lcm = Nebula::instance().get_lcm();

    if (!check_vm_state(id, msg.get()))
    {
        return;
    }

    int sgid;

    istringstream is(msg->payload());

    is >> sgid >> ws;

    if (is.fail())
    {
        NebulaLog::log("VMM", Log::ERROR, "Missing or wrong security group"
                " id in driver message");
        return;
    }

    SecurityGroupPool* sgpool = Nebula::instance().get_secgrouppool();

    if (auto sg = sgpool->get(sgid))
    {
        sg->del_updating(id);

        if (msg->status() == "SUCCESS")
        {
            sg->add_vm(id);
        }
        else
        {
            sg->add_error(id);
        }

        sgpool->update(sg.get());
    }

    if (auto vm = vmpool->get(id))
    {
        if (msg->status() == "SUCCESS")
        {
            vm->log("VMM", Log::INFO, "VM security group updated.");
        }
        else
        {
            log_error(vm.get(), msg->payload(), "Error updating security groups.");

            vmpool->update(vm.get());
        }
    }

    lcm->trigger_updatesg(sgid);
    return;
}

/* -------------------------------------------------------------------------- */

void VirtualMachineManager::_driver_cancel(unique_ptr<vm_msg_t> msg)
{
    log_message(msg.get());
}

/* -------------------------------------------------------------------------- */

void VirtualMachineManager::_resize(unique_ptr<vm_msg_t> msg)
{
    log_message(msg.get());

    int id = msg->oid();
    auto lcm = Nebula::instance().get_lcm();

    if (!check_vm_state(id, msg.get()))
    {
        return;
    }

    if (msg->status() == "SUCCESS" )
    {
        if ( auto vm = vmpool->get_ro(id) )
        {
            vm->log("VMM", Log::INFO, "VM hotplug resize successful");

            lcm->trigger_resize_success(id);
        }
    }
    else
    {
        log_error(id, msg->payload(), "Error resizing VM");

        lcm->trigger_resize_failure(id);
    }
}

/* -------------------------------------------------------------------------- */

void VirtualMachineManager::_log(unique_ptr<vm_msg_t> msg)
{
    NebulaLog::log("VMM", log_type(msg->status()[0]), msg->payload());
}

/* -------------------------------------------------------------------------- */
