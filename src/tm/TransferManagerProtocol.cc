/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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

#include "TransferManager.h"
#include "LifeCycleManager.h"
#include "VirtualMachinePool.h"
#include "Nebula.h"
#include "NebulaLog.h"

using namespace std;

/* ************************************************************************** */
/* Driver Protocol Implementation                                             */
/* ************************************************************************** */

void TransferManager::_undefined(unique_ptr<transfer_msg_t> msg)
{
    NebulaLog::warn("TrM", "Received UNDEFINED msg: " + msg->payload());
}

/* -------------------------------------------------------------------------- */

void TransferManager::_transfer(unique_ptr<transfer_msg_t> msg)
{
    string msg_str;

    msg->write_to(msg_str);
    NebulaLog::debug("TrM", "Message received: " + msg_str);

    ostringstream oss;

    LifeCycleManager * lcm = Nebula::instance().get_lcm();

    int id = msg->oid();

    // Get the VM from the pool
    auto vm = vmpool->get(id);

    if (vm == nullptr)
    {
        return;
    }

    if (vm->get_lcm_state() == VirtualMachine::LCM_INIT)
    {
        oss.str("");
        oss << "Ignored: " << msg_str;
        vm->log("TrM", Log::WARNING, oss);

        return;
    }

    if (msg->status() == "SUCCESS")
    {
        switch (vm->get_lcm_state())
        {
            case VirtualMachine::PROLOG:
            case VirtualMachine::PROLOG_MIGRATE:
            case VirtualMachine::PROLOG_RESUME:
            case VirtualMachine::PROLOG_UNDEPLOY:
            case VirtualMachine::PROLOG_MIGRATE_POWEROFF:
            case VirtualMachine::PROLOG_MIGRATE_SUSPEND:
            case VirtualMachine::PROLOG_MIGRATE_UNKNOWN:
                lcm->trigger_prolog_success(id);
                break;

            case VirtualMachine::EPILOG:
            case VirtualMachine::EPILOG_STOP:
            case VirtualMachine::EPILOG_UNDEPLOY:
            case VirtualMachine::CLEANUP_RESUBMIT:
                lcm->trigger_epilog_success(id);
                break;

            case VirtualMachine::HOTPLUG_SAVEAS:
            case VirtualMachine::HOTPLUG_SAVEAS_POWEROFF:
            case VirtualMachine::HOTPLUG_SAVEAS_SUSPENDED:
            case VirtualMachine::HOTPLUG_SAVEAS_UNDEPLOYED:
            case VirtualMachine::HOTPLUG_SAVEAS_STOPPED:
                lcm->trigger_saveas_success(id);
                break;

            case VirtualMachine::HOTPLUG_PROLOG_POWEROFF:
                lcm->trigger_attach_success(id);
                break;

            case VirtualMachine::HOTPLUG_EPILOG_POWEROFF:
                lcm->trigger_detach_success(id);
                break;

            case VirtualMachine::DISK_SNAPSHOT_POWEROFF:
            case VirtualMachine::DISK_SNAPSHOT_REVERT_POWEROFF:
            case VirtualMachine::DISK_SNAPSHOT_DELETE_POWEROFF:
            case VirtualMachine::DISK_SNAPSHOT_SUSPENDED:
            case VirtualMachine::DISK_SNAPSHOT_DELETE_SUSPENDED:
            case VirtualMachine::DISK_SNAPSHOT_DELETE:
                lcm->trigger_disk_snapshot_success(id);
                break;

            case VirtualMachine::DISK_RESIZE_POWEROFF:
            case VirtualMachine::DISK_RESIZE_UNDEPLOYED:
                lcm->trigger_disk_resize_success(id);
                break;

            default:
                goto error_state;
        }
    }
    else
    {
        const string& info = msg->payload();

        oss.str("");
        oss << "Error executing image transfer script";

        if (!info.empty() && info[0] != '-')
        {
            oss << ": " << info;

            vm->set_template_error_message(oss.str());
            vmpool->update(vm.get());
        }

        vm->log("TrM", Log::ERROR, oss);

        switch (vm->get_lcm_state())
        {
            case VirtualMachine::PROLOG:
            case VirtualMachine::PROLOG_MIGRATE:
            case VirtualMachine::PROLOG_RESUME:
            case VirtualMachine::PROLOG_UNDEPLOY:
            case VirtualMachine::PROLOG_MIGRATE_POWEROFF:
            case VirtualMachine::PROLOG_MIGRATE_SUSPEND:
            case VirtualMachine::PROLOG_MIGRATE_UNKNOWN:
                lcm->trigger_prolog_failure(id);
                break;

            case VirtualMachine::EPILOG:
            case VirtualMachine::EPILOG_STOP:
            case VirtualMachine::EPILOG_UNDEPLOY:
            case VirtualMachine::CLEANUP_RESUBMIT:
                lcm->trigger_epilog_failure(id);
                break;

            case VirtualMachine::HOTPLUG_SAVEAS:
            case VirtualMachine::HOTPLUG_SAVEAS_POWEROFF:
            case VirtualMachine::HOTPLUG_SAVEAS_SUSPENDED:
            case VirtualMachine::HOTPLUG_SAVEAS_UNDEPLOYED:
            case VirtualMachine::HOTPLUG_SAVEAS_STOPPED:
                lcm->trigger_saveas_failure(id);
                break;

            case VirtualMachine::HOTPLUG_PROLOG_POWEROFF:
                lcm->trigger_attach_failure(id);
                break;

            case VirtualMachine::HOTPLUG_EPILOG_POWEROFF:
                lcm->trigger_detach_failure(id);
                break;

            case VirtualMachine::DISK_SNAPSHOT_POWEROFF:
            case VirtualMachine::DISK_SNAPSHOT_REVERT_POWEROFF:
            case VirtualMachine::DISK_SNAPSHOT_DELETE_POWEROFF:
            case VirtualMachine::DISK_SNAPSHOT_SUSPENDED:
            case VirtualMachine::DISK_SNAPSHOT_DELETE_SUSPENDED:
            case VirtualMachine::DISK_SNAPSHOT_DELETE:
                lcm->trigger_disk_snapshot_failure(id);
                break;

            case VirtualMachine::DISK_RESIZE_POWEROFF:
            case VirtualMachine::DISK_RESIZE_UNDEPLOYED:
                lcm->trigger_disk_resize_failure(id);
                break;

            default:
                goto error_state;
        }
    }

    return;

error_state:
    oss.str("");
    oss << "Wrong state in TrM answer for VM " << id;

    vm->log("TrM", Log::ERROR, oss);

    return;
}

/* -------------------------------------------------------------------------- */

void TransferManager::_log(unique_ptr<transfer_msg_t> msg)
{
    if (msg->oid() < 0)
    {
        NebulaLog::log("TrM", log_type(msg->status()[0]), msg->payload());
    }
    else
    {
        auto vm = Nebula::instance().get_vmpool()->get_ro(msg->oid());
        vm->log("TrM", log_type(msg->status()[0]), msg->payload());
    }
}
