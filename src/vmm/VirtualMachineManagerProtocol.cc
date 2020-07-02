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

    auto vm = vmpool->get(vm_id);

    if (!payload.empty() && payload[0] != '-')
    {
        oss << ": " << payload;
        vm->set_template_error_message(oss.str());
        vmpool->update(vm);
    }

    vm->log("VMM", Log::ERROR, oss);

    vm->unlock();
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

        vm->unlock();

        return false;
    }

    vm->unlock();

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

    LCMAction::Actions action = LCMAction::DEPLOY_SUCCESS;

    if (msg->status() == "SUCCESS")
    {
        auto vm = vmpool->get(id);

        istringstream is(msg->payload());

        string deploy_id;

        is >> deploy_id;

        if (!deploy_id.empty())
        {
            vm->set_deploy_id(deploy_id);
        }
        else
        {
            action = LCMAction::DEPLOY_FAILURE;
            log_error(vm, msg->payload(), "Empty deploy ID for virtual machine");
        }

        vmpool->update(vm);

        vm->unlock();
    }
    else
    {
        action = LCMAction::DEPLOY_FAILURE;
        log_error(id, msg->payload(), "Error deploying virtual machine");
    }

    LifeCycleManager * lcm = Nebula::instance().get_lcm();

    lcm->trigger(action, msg->oid());
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
        lcm->trigger(LCMAction::SHUTDOWN_SUCCESS, id);
    }
    else
    {
        log_error(id, msg->payload(), "Error shutting down VM");

        lcm->trigger(LCMAction::SHUTDOWN_FAILURE, msg->oid());
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
        auto vm = vmpool->get_ro(id);
        vm->log("VMM", Log::INFO, "VM successfully rebooted-hard.");
        vm->unlock();
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
        auto vm = vmpool->get_ro(id);
        vm->log("VMM", Log::INFO, "VM successfully rebooted.");
        vm->unlock();
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
        lcm->trigger(LCMAction::CANCEL_SUCCESS, id);
    }
    else
    {
        log_error(msg->oid(), msg->payload(), "Error canceling VM");

        lcm->trigger(LCMAction::CANCEL_FAILURE, id);
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
        auto vm = vmpool->get_ro(id);

        vm->log("VMM", Log::INFO, "Host successfully cleaned.");

        vm->unlock();

        lcm->trigger(LCMAction::CLEANUP_SUCCESS, id);
    }
    else
    {
        log_error(id, msg->payload(), "Error cleaning Host");

        lcm->trigger(LCMAction::CLEANUP_FAILURE, id);
    }
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
        lcm->trigger(LCMAction::SAVE_SUCCESS, id);
    }
    else
    {
        log_error(id, msg->payload(), "Error saving VM state");

        lcm->trigger(LCMAction::SAVE_FAILURE, id);
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
        lcm->trigger(LCMAction::DEPLOY_SUCCESS, id);
    }
    else
    {
        log_error(id, msg->payload(), "Error restoring VM");

        lcm->trigger(LCMAction::DEPLOY_FAILURE, id);
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
        lcm->trigger(LCMAction::DEPLOY_SUCCESS, id);
    }
    else
    {
        log_error(msg->oid(), msg->payload(), "Error live migrating VM");

        lcm->trigger(LCMAction::DEPLOY_FAILURE, id);
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
        auto vm = vmpool->get_ro(id);

        vm->log("VMM", Log::INFO, "VM Disk successfully attached.");

        vm->unlock();

        lcm->trigger(LCMAction::ATTACH_SUCCESS, id);
    }
    else
    {
        log_error(id, msg->payload(), "Error attaching new VM Disk");

        lcm->trigger(LCMAction::ATTACH_FAILURE, id);
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
        auto vm = vmpool->get_ro(id);

        vm->log("VMM",Log::INFO,"VM Disk successfully detached.");

        vm->unlock();

        lcm->trigger(LCMAction::DETACH_SUCCESS, id);
    }
    else
    {
        log_error(id, msg->payload(), "Error detaching VM Disk");

        lcm->trigger(LCMAction::DETACH_FAILURE, id);
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
        auto vm = vmpool->get_ro(id);

        vm->log("VMM", Log::INFO, "VM NIC Successfully attached.");

        vm->unlock();

        lcm->trigger(LCMAction::ATTACH_NIC_SUCCESS, id);
    }
    else
    {
        log_error(id, msg->payload(), "Error attaching new VM NIC");

        lcm->trigger(LCMAction::ATTACH_NIC_FAILURE, id);
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
        auto vm = vmpool->get_ro(id);

        vm->log("VMM",Log::INFO, "VM NIC Successfully detached.");

        vm->unlock();

        lcm->trigger(LCMAction::DETACH_NIC_SUCCESS, id);
    }
    else
    {
        log_error(id, msg->payload(), "Error detaching VM NIC");

        lcm->trigger(LCMAction::DETACH_NIC_FAILURE, id);
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

        auto vm = vmpool->get(id);
        vm->update_snapshot_id(hypervisor_id);

        vmpool->update(vm);

        vm->log("VMM", Log::INFO, "VM Snapshot successfully created.");

        vm->unlock();

        lcm->trigger(LCMAction::SNAPSHOT_CREATE_SUCCESS, id);
    }
    else
    {
        log_error(msg->oid(), msg->payload(), "Error creating new VM Snapshot");

        lcm->trigger(LCMAction::SNAPSHOT_CREATE_FAILURE, id);
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
        auto vm = vmpool->get_ro(id);

        vm->log("VMM",Log::INFO,"VM Snapshot successfully reverted.");

        vm->unlock();

        lcm->trigger(LCMAction::SNAPSHOT_REVERT_SUCCESS, id);
    }
    else
    {
        log_error(id, msg->payload(), "Error reverting VM Snapshot");

        lcm->trigger(LCMAction::SNAPSHOT_REVERT_FAILURE, id);
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
        auto vm = vmpool->get_ro(id);

        vm->log("VMM",Log::INFO,"VM Snapshot successfully deleted.");

        vm->unlock();

        lcm->trigger(LCMAction::SNAPSHOT_DELETE_SUCCESS, id);
    }
    else
    {
        log_error(id, msg->payload(), "Error deleting VM Snapshot");

        lcm->trigger(LCMAction::SNAPSHOT_DELETE_FAILURE, id);
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
        auto vm = vmpool->get_ro(id);

        vm->log("VMM", Log::INFO, "VM disk snapshot successfully created.");

        vm->unlock();

        lcm->trigger(LCMAction::DISK_SNAPSHOT_SUCCESS, id);
    }
    else
    {
        log_error(id, msg->payload(), "Error creating new disk snapshot");

        lcm->trigger(LCMAction::DISK_SNAPSHOT_FAILURE, id);
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
        auto vm = vmpool->get_ro(id);

        vm->log("VMM", Log::INFO, "VM disk state reverted.");

        vm->unlock();

        lcm->trigger(LCMAction::DISK_SNAPSHOT_SUCCESS, id);
    }
    else
    {
        log_error(id, msg->payload(), "Error reverting disk snapshot");

        lcm->trigger(LCMAction::DISK_SNAPSHOT_FAILURE, id);
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
        auto vm = vmpool->get_ro(id);

        vm->log("VMM", Log::INFO, "VM disk successfully resized");

        vm->unlock();

        lcm->trigger(LCMAction::DISK_RESIZE_SUCCESS, id);
    }
    else
    {
        log_error(id, msg->payload(), "Error resizing disk");

        lcm->trigger(LCMAction::DISK_RESIZE_FAILURE, id);
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
        auto vm = vmpool->get_ro(id);

        vm->log("VMM", Log::INFO, "VM update conf succesfull.");

        vm->unlock();

        lcm->trigger(LCMAction::UPDATE_CONF_SUCCESS, id);
    }
    else
    {
        log_error(id, msg->payload(), "Error updating conf for VM");

        lcm->trigger(LCMAction::UPDATE_CONF_FAILURE, id);
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
    SecurityGroup*     sg     = sgpool->get(sgid);

    if (sg != nullptr)
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

        sgpool->update(sg);

        sg->unlock();
    }

    auto vm = vmpool->get(id);

    if (vm != nullptr)
    {
        if (msg->status() == "SUCCESS")
        {
            vm->log("VMM", Log::INFO, "VM security group updated.");
        }
        else
        {
            log_error(vm, msg->payload(), "Error updating security groups.");

            vmpool->update(vm);
        }

        vm->unlock();
    }

    lcm->trigger(LCMAction::UPDATESG, sgid);
    return;
}

/* -------------------------------------------------------------------------- */

void VirtualMachineManager::_driver_cancel(unique_ptr<vm_msg_t> msg)
{
    log_message(msg.get());
}

/* -------------------------------------------------------------------------- */

void VirtualMachineManager::_log(unique_ptr<vm_msg_t> msg)
{
    NebulaLog::log("VMM", log_type(msg->status()[0]), msg->payload());
}

/* -------------------------------------------------------------------------- */
