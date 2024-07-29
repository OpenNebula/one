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

#include "VirtualMachineManager.h"
#include "NebulaLog.h"
#include "XenDriver.h"
#include "XMLDriver.h"
#include "LibVirtDriver.h"
#include "NebulaUtil.h"
#include "TransferManager.h"
#include "LifeCycleManager.h"
#include "DatastorePool.h"
#include "VirtualMachinePool.h"

#include "Nebula.h"

using namespace std;

/* ************************************************************************** */
/* Constructor                                                                */
/* ************************************************************************** */

VirtualMachineManager::VirtualMachineManager(
        const string&                   _mad_location):
    DriverManager(_mad_location),
    Listener("Virtual Machine Manager")
{
    Nebula& nd = Nebula::instance();

    vmpool  = nd.get_vmpool();
    hpool   = nd.get_hpool();
    ds_pool = nd.get_dspool();
}

/* ************************************************************************** */
/* Manager start function                                                     */
/* ************************************************************************** */

int VirtualMachineManager::start()
{
    using namespace std::placeholders; // for _1

    register_action(VMManagerMessages::UNDEFINED,
                    &VirtualMachineManager::_undefined);

    register_action(VMManagerMessages::DEPLOY,
                    bind(&VirtualMachineManager::_deploy, this, _1));

    register_action(VMManagerMessages::SHUTDOWN,
                    bind(&VirtualMachineManager::_shutdown, this, _1));

    register_action(VMManagerMessages::RESET,
                    bind(&VirtualMachineManager::_reboot, this, _1));

    register_action(VMManagerMessages::CANCEL,
                    bind(&VirtualMachineManager::_cancel, this, _1));

    register_action(VMManagerMessages::CLEANUP,
                    bind(&VirtualMachineManager::_cleanup, this, _1));

    register_action(VMManagerMessages::CHECKPOINT,
                    bind(&VirtualMachineManager::_checkpoint, this, _1));

    register_action(VMManagerMessages::SAVE,
                    bind(&VirtualMachineManager::_save, this, _1));

    register_action(VMManagerMessages::RESTORE,
                    bind(&VirtualMachineManager::_restore, this, _1));

    register_action(VMManagerMessages::MIGRATE,
                    bind(&VirtualMachineManager::_migrate, this, _1));

    register_action(VMManagerMessages::ATTACHDISK,
                    bind(&VirtualMachineManager::_attachdisk, this, _1));

    register_action(VMManagerMessages::DETACHDISK,
                    bind(&VirtualMachineManager::_detachdisk, this, _1));

    register_action(VMManagerMessages::ATTACHNIC,
                    bind(&VirtualMachineManager::_attachnic, this, _1));

    register_action(VMManagerMessages::DETACHNIC,
                    bind(&VirtualMachineManager::_detachnic, this, _1));

    register_action(VMManagerMessages::SNAPSHOTCREATE,
                    bind(&VirtualMachineManager::_snapshotcreate, this, _1));

    register_action(VMManagerMessages::SNAPSHOTREVERT,
                    bind(&VirtualMachineManager::_snapshotrevert, this, _1));

    register_action(VMManagerMessages::SNAPSHOTDELETE,
                    bind(&VirtualMachineManager::_snapshotdelete, this, _1));

    register_action(VMManagerMessages::DISKSNAPSHOTCREATE,
                    bind(&VirtualMachineManager::_disksnapshotcreate, this, _1));

    register_action(VMManagerMessages::RESIZEDISK,
                    bind(&VirtualMachineManager::_resizedisk, this, _1));

    register_action(VMManagerMessages::UPDATECONF,
                    bind(&VirtualMachineManager::_updateconf, this, _1));

    register_action(VMManagerMessages::UPDATESG,
                    bind(&VirtualMachineManager::_updatesg, this, _1));

    register_action(VMManagerMessages::DRIVER_CANCEL,
                    bind(&VirtualMachineManager::_driver_cancel, this, _1));

    register_action(VMManagerMessages::RESIZE,
                    bind(&VirtualMachineManager::_resize, this, _1));

    register_action(VMManagerMessages::BACKUP,
                    bind(&VirtualMachineManager::_backup, this, _1));

    register_action(VMManagerMessages::LOG,
                    bind(&VirtualMachineManager::_log, this, _1));

    register_action(VMManagerMessages::UPDATENIC,
                    bind(&VirtualMachineManager::_updatenic, this, _1));

    register_action(VMManagerMessages::BACKUPCANCEL,
                    bind(&VirtualMachineManager::_driver_cancel, this, _1));

    string error;
    if ( DriverManager::start(error) != 0 )
    {
        return -1;
    }

    NebulaLog::log("VMM", Log::INFO, "Starting Virtual Machine Manager...");

    Listener::start();

    return 0;
}

/* ************************************************************************** */
/* Manager Actions                                                            */
/* ************************************************************************** */

int VirtualMachineManager::validate_raw(const Template * vmt, string& error_str)
{
    const VectorAttribute * raw = vmt->get("RAW");

    if (raw == nullptr)
    {
        return 0;
    }

    bool validate;
    raw->vector_value("VALIDATE", validate, true);

    if (!validate)
    {
        return 0;
    }

    string value = raw->vector_value("TYPE");
    one_util::tolower(value);

    const VirtualMachineManagerDriver * vmd = get(value);

    if ( vmd == nullptr )
    {
        error_str = "Invalid RAW section: unsupported TYPE";
        return -1;
    }

    value = raw->vector_value("DATA");


    return vmd->validate_raw(value, error_str);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachineManager::validate_template(const string& vmm_mad,
                                             const VirtualMachine* vm,
                                             int hid, int cluster_id,
                                             string& error)
{
    const VirtualMachineManagerDriver * vmmd = get(vmm_mad);

    if ( vmmd == nullptr )
    {
        error = "Cannot find vmm driver: " + vmm_mad;

        return -1;
    }

    return vmmd->validate_template(vm, hid, cluster_id, error);
}

/* ------------------------------------------------------------------------ */
/* ------------------------------------------------------------------------ */

string VirtualMachineManager::format_message(
        const string& hostname,
        const string& m_hostname,
        const string& domain,
        const string& ldfile,
        const string& rdfile,
        const string& cfile,
        const string& tm_command,
        const string& tm_command_rollback,
        const string& disk_target_path,
        const string& tmpl,
        int ds_id,
        int sgid,
        int nicid)
{
    ostringstream oss;

    string ds_tmpl = "";

    if ( auto ds = ds_pool->get_ro(ds_id) )
    {
        ds->decrypt();

        ds->to_xml(ds_tmpl);
    }

    oss << "<VMM_DRIVER_ACTION_DATA>"
        <<   "<HOST>"    << hostname << "</HOST>";

    if (!m_hostname.empty())
    {
        oss << "<MIGR_HOST>" << m_hostname << "</MIGR_HOST>";
    }
    else
    {
        oss << "<MIGR_HOST/>";
    }

    if (!domain.empty())
    {
        oss << "<DEPLOY_ID>" << domain << "</DEPLOY_ID>";
    }
    else
    {
        oss << "<DEPLOY_ID/>";
    }

    if (!ldfile.empty())
    {
        oss << "<LOCAL_DEPLOYMENT_FILE>" << ldfile << "</LOCAL_DEPLOYMENT_FILE>";
        oss << "<REMOTE_DEPLOYMENT_FILE>" << rdfile << "</REMOTE_DEPLOYMENT_FILE>";
    }
    else
    {
        oss << "<LOCAL_DEPLOYMENT_FILE/>";
        oss << "<REMOTE_DEPLOYMENT_FILE/>";
    }

    if (!cfile.empty())
    {
        oss << "<CHECKPOINT_FILE>" << cfile << "</CHECKPOINT_FILE>";
    }
    else
    {
        oss << "<CHECKPOINT_FILE/>";
    }

    if ( !tm_command.empty() )
    {
        oss << "<TM_COMMAND>" << one_util::escape_xml(tm_command) << "</TM_COMMAND>";
    }
    else
    {
        oss << "<TM_COMMAND/>";
    }

    if (!tm_command_rollback.empty())
    {
        oss << "<TM_COMMAND_ROLLBACK>" << one_util::escape_xml(tm_command_rollback)
            << "</TM_COMMAND_ROLLBACK>";
    }
    else
    {
        oss << "<TM_COMMAND_ROLLBACK/>";
    }

    if ( !disk_target_path.empty() )
    {
        oss << "<DISK_TARGET_PATH>"<< disk_target_path << "</DISK_TARGET_PATH>";
    }
    else
    {
        oss << "<DISK_TARGET_PATH/>";
    }

    if ( sgid != -1 )
    {
        oss << "<SECURITY_GROUP_ID>" << sgid << "</SECURITY_GROUP_ID>";
    }

    if ( nicid != -1 )
    {
        oss << "<VIRTUAL_NETWORK_ID>" << nicid << "</VIRTUAL_NETWORK_ID>";
    }

    oss << tmpl
        << ds_tmpl
        << "</VMM_DRIVER_ACTION_DATA>";


    string base64;
    ssl_util::base64_encode(oss.str(), base64);

    return base64;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static int do_context_command(VirtualMachine * vm, const string& password,
                              string& prolog_cmd, string& disk_path)
{
    prolog_cmd = "";
    disk_path  = "";

    if (vm->get_host_is_cloud())
    {
        return 0;
    }

    ostringstream os;

    Nebula&           nd = Nebula::instance();
    TransferManager * tm = nd.get_tm();

    string vm_tm_mad = vm->get_tm_mad();
    int    disk_id;

    int rc = tm->prolog_context_command(vm, password, vm_tm_mad, disk_id, os);

    if ( rc == -1 )
    {
        auto vmpool = Nebula::instance().get_vmpool();
        vmpool->update(vm);

        return -1;
    }
    else if ( rc == 1 )
    {
        prolog_cmd = os.str();

        os.str("");

        os << vm->get_system_dir() << "/disk." << disk_id;

        disk_path = os.str();
    } //else rc == 0 VM has no context

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::trigger_deploy(int vid)
{
    trigger([this, vid]
    {
        const VirtualMachineManagerDriver * vmd;
        int rc;

        ostringstream os;
        string        password;
        string        disk_path;
        string        prolog_cmd;
        string        vm_tmpl;
        string        drv_msg;

        int uid;
        int owner_id;

        if ( auto vm = vmpool->get(vid) )
        {
            uid = vm->get_created_by_uid();
            owner_id = vm->get_uid();
        }
        else
        {
            return;
        }

        password = Nebula::instance().get_upool()->get_token_password(uid, owner_id);

        auto vm = vmpool->get(vid);

        if (vm == nullptr)
        {
            return;
        }

        if (!vm->hasHistory())
        {
            goto error_history;
        }

        // Get the driver for this VM
        vmd = get(vm->get_vmm_mad());

        if ( vmd == nullptr )
        {
            goto error_driver;
        }

        //Generate VM description file
        os << "Generating deployment file: " << vm->get_deployment_file();

        vm->log("VMM", Log::INFO, os);

        os.str("");

        rc = vmd->deployment_description(vm.get(), vm->get_deployment_file());

        if (rc != 0)
        {
            goto error_file;
        }

        if ( do_context_command(vm.get(), password, prolog_cmd, disk_path) == -1 )
        {
            goto error_no_tm_command;
        }

        // Invoke driver method
        drv_msg = format_message(
                vm->get_hostname(),
                "",
                "",
                vm->get_deployment_file(),
                vm->get_remote_deployment_file(),
                "",
                prolog_cmd,
                "",
                disk_path,
                vm->to_xml(vm_tmpl),
                vm->get_ds_id(),
                -1);

        vmd->deploy(vid, drv_msg);

        vmpool->update(vm.get());

        return;

error_history:
        os << "deploy_action, VM has no history";
        goto error_common;

error_driver:
        os << "deploy_action, error getting driver " << vm->get_vmm_mad();
        goto error_common;

error_file:
        os << "deploy_action, error generating deployment file: "
           << vm->get_deployment_file();
        goto error_common;

error_no_tm_command:
        os << "Cannot set context disk to update it for VM " << vm->get_oid();

error_common:
        LifeCycleManager *  lcm = Nebula::instance().get_lcm();

        lcm->trigger_deploy_failure(vid);

        vm->log("VMM", Log::ERROR, os);
        return;
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::trigger_save(int vid)
{
    trigger([this, vid]
    {
        const VirtualMachineManagerDriver * vmd;

        string   hostname, checkpoint_file;
        string   vm_tmpl;
        string   drv_msg;
        int      ds_id;

        ostringstream os;

        // Get the VM from the pool
        auto vm = vmpool->get(vid);

        if (vm == nullptr)
        {
            return;
        }

        if (!vm->hasHistory())
        {
            goto error_history;
        }

        // Get the driver for this VM
        vmd = get(vm->get_vmm_mad());

        if ( vmd == nullptr )
        {
            goto error_driver;
        }

        // Use previous host if it is a migration
        if ( vm->get_lcm_state() == VirtualMachine::SAVE_MIGRATE )
        {
            if (!vm->hasPreviousHistory())
            {
                goto error_previous_history;
            }

            hostname        = vm->get_previous_hostname();
            checkpoint_file = vm->get_previous_checkpoint_file();
            ds_id           = vm->get_previous_ds_id();
        }
        else
        {
            hostname        = vm->get_hostname();
            checkpoint_file = vm->get_checkpoint_file();
            ds_id           = vm->get_ds_id();
        }

        // Invoke driver method
        drv_msg = format_message(
                          hostname,
                          "",
                          vm->get_deploy_id(),
                          "",
                          "",
                          checkpoint_file,
                          "",
                          "",
                          "",
                          vm->to_xml(vm_tmpl),
                          ds_id,
                          -1);

        vmd->save(vid, drv_msg);

        return;

error_history:
        os << "save_action, VM has no history";
        goto error_common;

error_driver:
        os << "save_action, error getting driver " << vm->get_vmm_mad();
        goto error_common;

error_previous_history:
        os << "save_action, VM has no previous history";

error_common:
        LifeCycleManager *  lcm = Nebula::instance().get_lcm();

        lcm->trigger_save_failure(vid);

        vm->log("VMM", Log::ERROR, os);
        return;
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::trigger_shutdown(int vid)
{
    trigger([this, vid]
    {
        const VirtualMachineManagerDriver * vmd;

        string        hostname;
        string        vm_tmpl;
        string        drv_msg;
        ostringstream os;

        int      ds_id;

        // Get the VM from the pool
        auto vm = vmpool->get(vid);

        if (vm == nullptr)
        {
            return;
        }

        if (!vm->hasHistory())
        {
            goto error_history;
        }

        // Get the driver for this VM
        vmd = get(vm->get_vmm_mad());

        if ( vmd == nullptr )
        {
            goto error_driver;
        }

        // Use previous host if it is a migration
        if ( vm->get_lcm_state() == VirtualMachine::SAVE_MIGRATE )
        {
            if (!vm->hasPreviousHistory())
            {
                goto error_previous_history;
            }

            hostname        = vm->get_previous_hostname();
            ds_id           = vm->get_previous_ds_id();
        }
        else
        {
            hostname        = vm->get_hostname();
            ds_id           = vm->get_ds_id();
        }

        // Invoke driver method
        drv_msg = format_message(
                          hostname,
                          "",
                          vm->get_deploy_id(),
                          "",
                          "",
                          "",
                          "",
                          "",
                          "",
                          vm->to_xml(vm_tmpl),
                          ds_id,
                          -1);

        vmd->shutdown(vid, drv_msg);

        return;

error_history:
        os << "shutdown_action, VM has no history";
        goto error_common;

error_previous_history:
        os << "save_action, VM has no previous history";
        goto error_common;

error_driver:
        os << "shutdown_action, error getting driver " << vm->get_vmm_mad();

error_common:
        LifeCycleManager *  lcm = Nebula::instance().get_lcm();

        lcm->trigger_shutdown_failure(vid);

        vm->log("VMM", Log::ERROR, os);
        return;
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::trigger_reboot(int vid)
{
    trigger([this, vid]
    {
        const VirtualMachineManagerDriver * vmd;

        string        vm_tmpl;
        string        drv_msg;
        ostringstream os;

        // Get the VM from the pool
        auto vm = vmpool->get(vid);

        if (vm == nullptr)
        {
            return;
        }

        if (!vm->hasHistory())
        {
            goto error_history;
        }

        // Get the driver for this VM
        vmd = get(vm->get_vmm_mad());

        if ( vmd == nullptr )
        {
            goto error_driver;
        }

        // Invoke driver method
        drv_msg = format_message(
                vm->get_hostname(),
                "",
                vm->get_deploy_id(),
                "",
                "",
                "",
                "",
                "",
                "",
                vm->to_xml(vm_tmpl),
                vm->get_ds_id(),
                -1);

        vmd->reboot(vid, drv_msg);

        return;

error_history:
        os << "reboot_action, VM has no history";
        goto error_common;

error_driver:
        os << "reboot_action, error getting driver " << vm->get_vmm_mad();

error_common:
        vm->log("VMM", Log::ERROR, os);
        return;
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::trigger_reset(int vid)
{
    trigger([this, vid]
    {
        const VirtualMachineManagerDriver * vmd;

        string        vm_tmpl;
        string        drv_msg;
        ostringstream os;

        // Get the VM from the pool
        auto vm = vmpool->get(vid);

        if (vm == nullptr)
        {
            return;
        }

        if (!vm->hasHistory())
        {
            goto error_history;
        }

        // Get the driver for this VM
        vmd = get(vm->get_vmm_mad());

        if ( vmd == nullptr )
        {
            goto error_driver;
        }

        // Invoke driver method
        drv_msg = format_message(
                vm->get_hostname(),
                "",
                vm->get_deploy_id(),
                "",
                "",
                "",
                "",
                "",
                "",
                vm->to_xml(vm_tmpl),
                vm->get_ds_id(),
                -1);

        vmd->reset(vid, drv_msg);

        return;

error_history:
        os << "reset_action, VM has no history";
        goto error_common;

error_driver:
        os << "reset_action, error getting driver " << vm->get_vmm_mad();

error_common:
        vm->log("VMM", Log::ERROR, os);
        return;
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::trigger_cancel(int vid)
{
    trigger([this, vid]
    {
        ostringstream    os;

        string   hostname;
        string   vm_tmpl;
        string   drv_msg;
        int ds_id;

        const VirtualMachineManagerDriver *   vmd;

        // Get the VM from the pool
        auto vm = vmpool->get(vid);

        if (vm == nullptr)
        {
            return;
        }

        if (!vm->hasHistory())
        {
            goto error_history;
        }

        // Get the driver for this VM
        vmd = get(vm->get_vmm_mad());

        if ( vmd == nullptr )
        {
            goto error_driver;
        }

        // Use previous host if it is a migration
        if ( vm->get_lcm_state() == VirtualMachine::SAVE_MIGRATE )
        {
            if (!vm->hasPreviousHistory())
            {
                goto error_previous_history;
            }

            hostname        = vm->get_previous_hostname();
            ds_id           = vm->get_previous_ds_id();
        }
        else
        {
            hostname        = vm->get_hostname();
            ds_id           = vm->get_ds_id();
        }

        // Invoke driver method
        drv_msg = format_message(
                          hostname,
                          "",
                          vm->get_deploy_id(),
                          "",
                          "",
                          "",
                          "",
                          "",
                          "",
                          vm->to_xml(vm_tmpl),
                          ds_id,
                          -1);

        vmd->cancel(vid, drv_msg);

        return;

error_history:
        os << "cancel_action, VM has no history";
        goto error_common;

error_previous_history:
        os << "save_action, VM has no previous history";
        goto error_common;

error_driver:
        os << "cancel_action, error getting driver " << vm->get_vmm_mad();

error_common://LCMAction::cancel_failure_action will check state
        LifeCycleManager *  lcm = Nebula::instance().get_lcm();

        lcm->trigger_shutdown_failure(vid);

        vm->log("VMM", Log::ERROR, os);
        return;
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::trigger_cancel_previous(int vid)
{
    trigger([this, vid]
    {
        ostringstream    os;

        string   vm_tmpl;
        string   drv_msg;

        const VirtualMachineManagerDriver * vmd;

        // Get the VM from the pool
        auto vm = vmpool->get(vid);

        if (vm == nullptr)
        {
            return;
        }

        if (!vm->hasHistory() || !vm->hasPreviousHistory())
        {
            goto error_history;
        }

        // Get the driver for this VM
        vmd = get(vm->get_previous_vmm_mad());

        if ( vmd == nullptr )
        {
            goto error_driver;
        }

        // Invoke driver method
        drv_msg = format_message(
                vm->get_previous_hostname(),
                "",
                vm->get_deploy_id(),
                "",
                "",
                "",
                "",
                "",
                "",
                vm->to_xml(vm_tmpl),
                vm->get_ds_id(),
                -1);

        vmd->cancel(vid, drv_msg);

        return;

error_history:
        os << "cancel_previous_action, VM has no history";
        goto error_common;

error_driver:
        os << "cancel_previous_action, error getting driver " << vm->get_vmm_mad();

error_common:
        vm->log("VMM", Log::ERROR, os);
        return;
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::trigger_cleanup(int vid, bool cancel_previous)
{
    trigger([this, vid, cancel_previous]
    {
        ostringstream    os;

        string   vm_tmpl;
        string   drv_msg;
        string   tm_command = "";

        string m_hostname = "";

        const VirtualMachineManagerDriver *   vmd;

        Nebula& nd = Nebula::instance();

        // Get the VM from the pool
        auto vm = vmpool->get(vid);

        if (vm == nullptr)
        {
            return;
        }

        if (!vm->hasHistory())
        {
            goto error_history;
        }

        // Get the driver for this VM
        vmd = get(vm->get_vmm_mad());

        if ( vmd == nullptr )
        {
            goto error_driver;
        }

        if ( cancel_previous && vm->hasPreviousHistory() )
        {
            m_hostname = vm->get_previous_hostname();
        }

        if (!vm->get_host_is_cloud())
        {
            if ( nd.get_tm()->epilog_delete_commands(vm.get(), os, false, false) != 0 )
            {
                goto error_epligo_command;
            }

            tm_command = os.str();
        }

        // Invoke driver method
        drv_msg = format_message(
                          vm->get_hostname(),
                          m_hostname,
                          vm->get_deploy_id(),
                          "",
                          "",
                          "",
                          tm_command,
                          "",
                          "",
                          vm->to_xml(vm_tmpl),
                          vm->get_ds_id(),
                          -1);

        vmd->cleanup(vid, drv_msg);

        return;

error_history:
        os << "cleanup_action, VM has no history";
        goto error_common;

error_driver:
        os << "cleanup_action, error getting driver " << vm->get_vmm_mad();
        goto error_common;

error_epligo_command:
        os << "cleanup_action canceled";

error_common:
        nd.get_lcm()->trigger_cleanup_callback(vid);

        vm->log("VMM", Log::ERROR, os);
        return;
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::trigger_cleanup_previous(int vid)
{
    trigger([this, vid]
    {
        ostringstream    os;

        string   vm_tmpl;
        string   drv_msg;
        string   tm_command = "";

        const VirtualMachineManagerDriver *   vmd;

        Nebula& nd = Nebula::instance();

        // Get the VM from the pool
        auto vm = vmpool->get(vid);

        if (vm == nullptr)
        {
            return;
        }

        if (!vm->hasHistory() || !vm->hasPreviousHistory())
        {
            goto error_history;
        }

        // Get the driver for this VM
        vmd = get(vm->get_vmm_mad());

        if ( vmd == nullptr )
        {
            goto error_driver;
        }

        if ( nd.get_tm()->epilog_delete_commands(vm.get(), os, false, true) != 0 )
        {
            goto error_epilog_command;
        }

        tm_command = os.str();

        // Invoke driver method
        drv_msg = format_message(
                vm->get_previous_hostname(),
                "",
                vm->get_deploy_id(),
                "",
                "",
                "",
                tm_command,
                "",
                "",
                vm->to_xml(vm_tmpl),
                vm->get_ds_id(),
                -1);

        vmd->cleanup(vid, drv_msg);

        return;

error_history:
        os << "cleanup_previous_action, VM has no history";
        goto error_common;

error_driver:
        os << "cleanup_previous_action, error getting driver " << vm->get_vmm_mad();
        goto error_common;

error_epilog_command:
        os << "cleanup_action canceled";

error_common:
        nd.get_lcm()->trigger_cleanup_callback(vid);

        vm->log("VMM", Log::ERROR, os);
        return;
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::trigger_migrate(int vid)
{
    trigger([this, vid]
    {
        const VirtualMachineManagerDriver * vmd;

        ostringstream os;
        string   vm_tmpl;
        string   drv_msg;

        // Get the VM from the pool
        auto vm = vmpool->get(vid);

        if (vm == nullptr)
        {
            return;
        }

        if (!vm->hasHistory())
        {
            goto error_history;
        }

        // Get the driver for this VM
        vmd = get(vm->get_vmm_mad());

        if ( vmd == nullptr )
        {
            goto error_driver;
        }

        if (!vm->hasPreviousHistory())
        {
            goto error_previous_history;
        }

        Nebula::instance().get_tm()->migrate_transfer_command(vm.get(), os);

        // Invoke driver method
        drv_msg = format_message(
                vm->get_previous_hostname(),
                vm->get_hostname(),
                vm->get_deploy_id(),
                "",
                "",
                "",
                os.str(),
                "",
                vm->get_system_dir(),
                vm->to_xml(vm_tmpl),
                vm->get_previous_ds_id(),
                -1);

        vmd->migrate(vid, drv_msg);

        return;

error_history:
        os << "migrate_action, VM has no history";
        goto error_common;

error_driver:
        os << "migrate_action, error getting driver " << vm->get_vmm_mad();
        goto error_common;

error_previous_history:
        os << "migrate_action, error VM has no previous history";

error_common:
        LifeCycleManager *  lcm = Nebula::instance().get_lcm();

        lcm->trigger_deploy_failure(vid);

        vm->log("VMM", Log::ERROR, os);
        return;
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::trigger_restore(int vid)
{
    trigger([this, vid]
    {
        const VirtualMachineManagerDriver * vmd;

        ostringstream os;

        string vm_tmpl;

        string password;
        string prolog_cmd;
        string disk_path;

        string drv_msg;

        int uid;
        int owner_id;

        if ( auto vm = vmpool->get(vid) )
        {
            uid = vm->get_created_by_uid();
            owner_id = vm->get_uid();
        }
        else
        {
            return;
        }

        password = Nebula::instance().get_upool()->get_token_password(uid, owner_id);

        auto vm = vmpool->get(vid);

        if (vm == nullptr)
        {
            return;
        }

        if (!vm->hasHistory())
        {
            goto error_history;
        }

        vmd = get(vm->get_vmm_mad());

        if ( vmd == nullptr )
        {
            goto error_driver;
        }

        if ( do_context_command(vm.get(), password, prolog_cmd, disk_path) == -1 )
        {
            goto error_no_tm_command;
        }

        // Invoke driver method
        drv_msg = format_message(
                vm->get_hostname(),
                "",
                vm->get_deploy_id(),
                "",
                "",
                vm->get_checkpoint_file(),
                prolog_cmd,
                "",
                disk_path,
                vm->to_xml(vm_tmpl),
                vm->get_ds_id(),
                -1);

        vmd->restore(vid, drv_msg);

        vmpool->update(vm.get());

        return;

error_history:
        os << "restore_action, VM has no history";
        goto error_common;

error_no_tm_command:
        os << "Cannot set context disk to update it for VM " << vm->get_oid();
        goto error_common;

error_driver:
        os << "restore_action, error getting driver " << vm->get_vmm_mad();

error_common:
        LifeCycleManager *  lcm = Nebula::instance().get_lcm();

        lcm->trigger_deploy_failure(vid);

        vm->log("VMM", Log::ERROR, os);
        return;
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::trigger_driver_cancel(int vid)
{
    trigger([this, vid]
    {
        ostringstream    os;

        const VirtualMachineManagerDriver * vmd;

        // Get the VM from the pool
        auto vm = vmpool->get(vid);

        if (vm == nullptr)
        {
            return;
        }

        if (!vm->hasHistory())
        {
            goto error_history;
        }

        // Get the driver for this VM
        vmd = get(vm->get_vmm_mad());

        if ( vmd == nullptr )
        {
            goto error_driver;
        }

        // Invoke driver method
        vmd->driver_cancel(vid);

        return;

error_history:
        os << "driver_cancel_action, VM has no history";
        goto error_common;

error_driver:
        os << "driver_cancel_action, error getting driver " << vm->get_vmm_mad();

error_common:
        vm->log("VMM", Log::ERROR, os);
        return;
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::trigger_attach(int vid)
{
    trigger([this, vid]
    {
        const VirtualMachineManagerDriver * vmd;

        ostringstream os, error_os;

        string  vm_tmpl;
        string  drv_msg;
        string  tm_command;
        string  vm_tm_mad;
        string  opennebula_hostname;
        string  prolog_cmd;
        string  epilog_cmd;
        string  disk_path;

        const VirtualMachineDisk * disk;
        int disk_id;
        int rc;

        Nebula& nd           = Nebula::instance();
        TransferManager * tm = nd.get_tm();

        // Get the VM from the pool
        auto vm = vmpool->get(vid);

        if (vm == nullptr)
        {
            return;
        }

        if (!vm->hasHistory())
        {
            goto error_history;
        }

        // Get the driver for this VM

        vmd = get(vm->get_vmm_mad());

        if ( vmd == nullptr )
        {
            goto error_driver;
        }

        disk = vm->get_attach_disk();

        if ( disk == nullptr )
        {
            goto error_disk;
        }

        vm_tm_mad = vm->get_tm_mad();

        opennebula_hostname = nd.get_nebula_hostname();

        rc = tm->prolog_transfer_command(
                vm.get(),
                disk,
                vm_tm_mad,
                opennebula_hostname,
                os,
                error_os);

        prolog_cmd = os.str();

        if ( prolog_cmd.empty() || rc != 0 )
        {
            goto error_no_tm_command;
        }

        os.str("");

        tm->epilog_transfer_command(vm.get(), vm->get_hostname(), disk, os);

        epilog_cmd = os.str();

        os.str("");

        disk_id = disk->get_disk_id();

        os << vm->get_system_dir() << "/disk." << disk_id;

        disk_path = os.str();

        // Invoke driver method
        drv_msg = format_message(
                vm->get_hostname(),
                "",
                vm->get_deploy_id(),
                "",
                "",
                "",
                prolog_cmd,
                epilog_cmd,
                disk_path,
                vm->to_xml(vm_tmpl),
                vm->get_ds_id(),
                -1);

        vmd->attach(vid, drv_msg);

        return;

error_disk:
        os.str("");
        os << "attach_action, could not find disk to attach";
        goto error_common;

error_history:
        os.str("");
        os << "attach_action, VM has no history";
        goto error_common;

error_driver:
        os.str("");
        os << "attach_action, error getting driver " << vm->get_vmm_mad();
        goto error_common;

error_no_tm_command:
        os.str("");
        os << "Cannot set disk to attach it to VM: " << error_os.str();
        goto error_common;

error_common:
        LifeCycleManager *  lcm = Nebula::instance().get_lcm();

        lcm->trigger_attach_failure(vid);

        vm->log("VMM", Log::ERROR, os);
        return;
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::trigger_detach(int vid)
{
    trigger([this, vid]
    {
        const VirtualMachineManagerDriver * vmd;

        ostringstream os;
        string        vm_tmpl;
        string        drv_msg;
        string        tm_command;
        string        vm_tm_mad;
        string        opennebula_hostname;
        string        epilog_cmd;
        string        disk_path;
        string        error_str;

        const VirtualMachineDisk * disk;
        int disk_id;

        Nebula&           nd = Nebula::instance();
        TransferManager * tm = nd.get_tm();

        // Get the VM from the pool
        auto vm = vmpool->get(vid);

        if (vm == nullptr)
        {
            return;
        }

        if (!vm->hasHistory())
        {
            goto error_history;
        }

        // Get the driver for this VM
        vmd = get(vm->get_vmm_mad());

        if ( vmd == nullptr )
        {
            goto error_driver;
        }

        disk = vm->get_attach_disk();

        if ( disk == nullptr )
        {
            goto error_disk;
        }

        vm_tm_mad = vm->get_tm_mad();
        opennebula_hostname = nd.get_nebula_hostname();

        disk_id = disk->get_disk_id();

        tm->epilog_transfer_command(vm.get(), vm->get_hostname(), disk, os);

        epilog_cmd = os.str();

        os.str("");
        os << vm->get_system_dir() << "/disk." << disk_id;

        disk_path = os.str();

        // Invoke driver method
        drv_msg = format_message(
                vm->get_hostname(),
                "",
                vm->get_deploy_id(),
                "",
                "",
                "",
                epilog_cmd,
                "",
                disk_path,
                vm->to_xml(vm_tmpl),
                vm->get_ds_id(),
                -1);

        vmd->detach(vid, drv_msg);

        return;

error_disk:
        os.str("");
        os << "detach_action, could not find disk to detach";
        goto error_common;

error_history:
        os.str("");
        os << "detach_action, VM has no history";
        goto error_common;

error_driver:
        os.str("");
        os << "detach_action, error getting driver " << vm->get_vmm_mad();
        goto error_common;

error_common:
        LifeCycleManager *  lcm = Nebula::instance().get_lcm();

        lcm->trigger_detach_failure(vid);

        vm->log("VMM", Log::ERROR, os);
        return;
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::trigger_snapshot_create(int vid)
{
    trigger([this, vid]
    {
        const VirtualMachineManagerDriver * vmd;

        ostringstream os;

        string  vm_tmpl;
        string  drv_msg;

        // Get the VM from the pool
        auto vm = vmpool->get(vid);

        if (vm == nullptr)
        {
            return;
        }

        if (!vm->hasHistory())
        {
            goto error_history;
        }

        // Get the driver for this VM
        vmd = get(vm->get_vmm_mad());

        if ( vmd == nullptr )
        {
            goto error_driver;
        }

        drv_msg = format_message(
                vm->get_hostname(),
                "",
                vm->get_deploy_id(),
                "",
                "",
                "",
                "",
                "",
                "",
                vm->to_xml(vm_tmpl),
                vm->get_ds_id(),
                -1);

        vmd->snapshot_create(vid, drv_msg);

        return;

error_history:
        os.str("");
        os << "snapshot_create_action, VM has no history";
        goto error_common;

error_driver:
        os.str("");
        os << "snapshot_create_action, error getting driver " << vm->get_vmm_mad();
        goto error_common;

error_common:
        LifeCycleManager *  lcm = Nebula::instance().get_lcm();

        lcm->trigger_snapshot_create_failure(vid);

        vm->log("VMM", Log::ERROR, os);
        return;
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::trigger_snapshot_revert(int vid)
{
    trigger([this, vid]
    {
        const VirtualMachineManagerDriver * vmd;

        ostringstream os;

        string  vm_tmpl;
        string  drv_msg;

        // Get the VM from the pool
        auto vm = vmpool->get(vid);

        if (vm == nullptr)
        {
            return;
        }

        if (!vm->hasHistory())
        {
            goto error_history;
        }

        // Get the driver for this VM
        vmd = get(vm->get_vmm_mad());

        if ( vmd == nullptr )
        {
            goto error_driver;
        }

        drv_msg = format_message(
                vm->get_hostname(),
                "",
                vm->get_deploy_id(),
                "",
                "",
                "",
                "",
                "",
                "",
                vm->to_xml(vm_tmpl),
                vm->get_ds_id(),
                -1);

        vmd->snapshot_revert(vid, drv_msg);

        return;

error_history:
        os.str("");
        os << "snapshot_revert_action, VM has no history";
        goto error_common;

error_driver:
        os.str("");
        os << "snapshot_revert_action, error getting driver " << vm->get_vmm_mad();
        goto error_common;

error_common:
        LifeCycleManager *  lcm = Nebula::instance().get_lcm();

        lcm->trigger_snapshot_revert_failure(vid);

        vm->log("VMM", Log::ERROR, os);
        return;
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::trigger_snapshot_delete(int vid)
{
    trigger([this, vid]
    {
        const VirtualMachineManagerDriver * vmd;

        ostringstream os;

        string  vm_tmpl;
        string  drv_msg;

        // Get the VM from the pool
        auto vm = vmpool->get(vid);

        if (vm == nullptr)
        {
            return;
        }

        if (!vm->hasHistory())
        {
            goto error_history;
        }

        // Get the driver for this VM
        vmd = get(vm->get_vmm_mad());

        if ( vmd == nullptr )
        {
            goto error_driver;
        }

        drv_msg = format_message(
                vm->get_hostname(),
                "",
                vm->get_deploy_id(),
                "",
                "",
                "",
                "",
                "",
                "",
                vm->to_xml(vm_tmpl),
                vm->get_ds_id(),
                -1);

        vmd->snapshot_delete(vid, drv_msg);

        return;

error_history:
        os.str("");
        os << "snapshot_delete_action, VM has no history";
        goto error_common;

error_driver:
        os.str("");
        os << "snapshot_delete_action, error getting driver " << vm->get_vmm_mad();
        goto error_common;

error_common:
        LifeCycleManager *  lcm = Nebula::instance().get_lcm();

        lcm->trigger_snapshot_delete_failure(vid);

        vm->log("VMM", Log::ERROR, os);
        return;
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::trigger_disk_snapshot_create(int vid)
{
    trigger([this, vid]
    {
        const VirtualMachineManagerDriver * vmd;

        ostringstream os;

        string  vm_tmpl;
        string  drv_msg;

        string  vm_tm_mad;
        string  snap_cmd;
        string  disk_path;

        string  tm_mad;
        int     ds_id, disk_id, snap_id;

        int rc;

        Nebula& nd           = Nebula::instance();
        TransferManager * tm = nd.get_tm();

        auto vm = vmpool->get(vid);

        if (vm == nullptr)
        {
            return;
        }

        if (!vm->hasHistory())
        {
            goto error_history;
        }

        vmd = get(vm->get_vmm_mad());

        if ( vmd == nullptr )
        {
            goto error_driver;
        }

        if ( vm->get_snapshot_disk(ds_id, tm_mad, disk_id, snap_id) != 0 )
        {
            goto error_disk;
        }

        rc = tm->snapshot_transfer_command(vm.get(), "SNAP_CREATE", os);

        snap_cmd = os.str();

        os.str("");

        if ( snap_cmd.empty() || rc != 0 )
        {
            goto error_no_tm_command;
        }

        os << vm->get_system_dir() << "/disk." << disk_id;

        disk_path = os.str();

        // Invoke driver method
        drv_msg = format_message(
                vm->get_hostname(),
                "",
                vm->get_deploy_id(),
                "",
                "",
                vm->get_checkpoint_file(),
                snap_cmd,
                "",
                disk_path,
                vm->to_xml(vm_tmpl),
                vm->get_ds_id(),
                -1);

        vmd->disk_snapshot_create(vid, drv_msg);

        return;

error_disk:
        os << "disk_snapshot_create, could not find disk to take snapshot";
        goto error_common;

error_history:
        os << "disk_snapshot_create, VM has no history";
        goto error_common;

error_driver:
        os << "disk_snapshot_create, error getting driver " << vm->get_vmm_mad();
        goto error_common;

error_no_tm_command:
        os << "Cannot set disk for snapshot.";
        goto error_common;

error_common:
        LifeCycleManager *  lcm = Nebula::instance().get_lcm();

        lcm->trigger_disk_snapshot_failure(vid);

        vm->log("VMM", Log::ERROR, os);
        return;
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::trigger_disk_resize(int vid)
{
    trigger([this, vid]
    {
        const VirtualMachineManagerDriver * vmd;

        VirtualMachineDisk * disk;

        ostringstream os;

        string  vm_tmpl;
        string  drv_msg;

        string  resize_cmd;
        string  disk_path;

        Nebula& nd           = Nebula::instance();
        TransferManager * tm = nd.get_tm();

        auto vm = vmpool->get(vid);

        if (vm == nullptr)
        {
            return;
        }

        if (!vm->hasHistory())
        {
            goto error_history;
        }

        vmd = get(vm->get_vmm_mad());

        if ( vmd == nullptr )
        {
            goto error_driver;
        }

        disk = vm->get_resize_disk();

        if ( disk == nullptr )
        {
            goto error_disk;
        }

        tm->resize_command(vm.get(), disk, os);

        resize_cmd = os.str();

        os.str("");

        if ( resize_cmd.empty() )
        {
            goto error_no_tm_command;
        }

        os << vm->get_system_dir() << "/disk." << disk->get_disk_id();

        disk_path = os.str();

        // Invoke driver method
        drv_msg = format_message(
                vm->get_hostname(),
                "",
                vm->get_deploy_id(),
                "",
                "",
                "",
                resize_cmd,
                "",
                disk_path,
                vm->to_xml(vm_tmpl),
                vm->get_ds_id(),
                -1);

        vmd->disk_resize(vid, drv_msg);

        return;

error_disk:
        os << "disk_snapshot_create, could not find disk to take snapshot";
        goto error_common;

error_history:
        os << "disk_snapshot_create, VM has no history";
        goto error_common;

error_driver:
        os << "disk_snapshot_create, error getting driver " << vm->get_vmm_mad();
        goto error_common;

error_no_tm_command:
        os << "Cannot set disk for snapshot.";
        goto error_common;

error_common:
        LifeCycleManager *  lcm = Nebula::instance().get_lcm();

        lcm->trigger_disk_snapshot_failure(vid);

        vm->log("VMM", Log::ERROR, os);
        return;
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::trigger_update_conf(int vid)
{
    trigger([this, vid]
    {
        ostringstream os;

        string  vm_tmpl;
        string  drv_msg;

        string  password;
        string  prolog_cmd;
        string  resize_cmd;
        string  disk_path;

        auto vm = vmpool->get(vid);
        const VirtualMachineManagerDriver * vmd;

        int uid, owner_id;

        if (vm == nullptr)
        {
            return;
        }

        if (!vm->hasHistory())
        {
            os << "update_conf_action, VM has no history";
            goto error;
        }

        vmd = get(vm->get_vmm_mad());

        if ( vmd == nullptr )
        {
            os << "update_conf_action, error getting driver " << vm->get_vmm_mad();
            goto error;
        }

        uid = vm->get_created_by_uid();
        owner_id = vm->get_uid();

        password = Nebula::instance().get_upool()->get_token_password(uid, owner_id);
        if ( do_context_command(vm.get(), password, prolog_cmd, disk_path) == -1 )
        {
            os << "Cannot set context disk to update it for VM " << vm->get_oid();
            goto error;
        }

        // Invoke driver method
        drv_msg = format_message(
                vm->get_hostname(),
                "",
                vm->get_deploy_id(),
                "",
                "",
                "",
                prolog_cmd,
                "",
                disk_path,
                vm->to_xml(vm_tmpl),
                vm->get_ds_id(),
                -1);

        vmd->update_conf(vid, drv_msg);

        return;

error:
        LifeCycleManager *  lcm = Nebula::instance().get_lcm();

        lcm->trigger_update_conf_failure(vid);

        vm->log("VMM", Log::ERROR, os);
        return;
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::trigger_attach_nic(int vid)
{
    trigger([this, vid]
    {
        const VirtualMachineManagerDriver * vmd;

        ostringstream os;

        string  vm_tmpl;
        string  drv_msg;
        string  opennebula_hostname;
        string  prolog_cmd;
        string  disk_path;
        string  password;

        int uid;
        int owner_id;

        // Get the VM from the pool
        if ( auto vm = vmpool->get(vid) )
        {
            uid = vm->get_created_by_uid();
            owner_id = vm->get_uid();
        }
        else
        {
            return;
        }

        password = Nebula::instance().get_upool()->get_token_password(uid, owner_id);

        auto vm = vmpool->get(vid);

        if (vm == nullptr)
        {
            return;
        }

        if (!vm->hasHistory())
        {
            goto error_history;
        }

        // Get the driver for this VM
        vmd = get(vm->get_vmm_mad());

        if ( vmd == nullptr )
        {
            goto error_driver;
        }

        if ( do_context_command(vm.get(), password, prolog_cmd, disk_path) == -1 )
        {
            goto error_no_tm_command;
        }

        // Invoke driver method
        drv_msg = format_message(
                vm->get_hostname(),
                "",
                vm->get_deploy_id(),
                "",
                "",
                "",
                prolog_cmd,
                "",
                disk_path,
                vm->to_xml(vm_tmpl),
                vm->get_ds_id(),
                -1);

        vmd->attach_nic(vid, drv_msg);

        vmpool->update(vm.get());

        return;

error_history:
        os.str("");
        os << "attach_nic_action, VM has no history";
        goto error_common;

error_driver:
        os.str("");
        os << "attach_nic_action, error getting driver " << vm->get_vmm_mad();
        goto error_common;

error_no_tm_command:
        os.str("");
        os << "Cannot set context disk to update it for VM " << vm->get_oid();
        goto error_common;

error_common:
        LifeCycleManager *  lcm = Nebula::instance().get_lcm();

        lcm->trigger_attach_nic_failure(vid);

        vm->log("VMM", Log::ERROR, os);
        return;
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::trigger_detach_nic(int vid)
{
    trigger([this, vid]
    {
        const VirtualMachineManagerDriver * vmd;

        ostringstream os;
        string        vm_tmpl;
        string        drv_msg;
        string        error_str;
        string  prolog_cmd;
        string  disk_path;
        string  password;

        int uid;
        int owner_id;

        // Get the VM from the pool
        if ( auto vm = vmpool->get(vid) )
        {
            uid = vm->get_created_by_uid();
            owner_id = vm->get_uid();
        }
        else
        {
            return;
        }

        password = Nebula::instance().get_upool()->get_token_password(uid, owner_id);

        auto vm = vmpool->get(vid);

        if (vm == nullptr)
        {
            return;
        }

        if (!vm->hasHistory())
        {
            goto error_history;
        }

        // Get the driver for this VM
        vmd = get(vm->get_vmm_mad());

        if ( vmd == nullptr )
        {
            goto error_driver;
        }

        if ( do_context_command(vm.get(), password, prolog_cmd, disk_path) == -1 )
        {
            goto error_no_tm_command;
        }

        // Invoke driver method
        drv_msg = format_message(
                vm->get_hostname(),
                "",
                vm->get_deploy_id(),
                "",
                "",
                "",
                prolog_cmd,
                "",
                disk_path,
                vm->to_xml(vm_tmpl),
                vm->get_ds_id(),
                -1);

        vmd->detach_nic(vid, drv_msg);

        return;

error_history:
        os.str("");
        os << "detach_nic_action, VM has no history";
        goto error_common;

error_driver:
        os.str("");
        os << "detach_nic_action, error getting driver " << vm->get_vmm_mad();
        goto error_common;

error_no_tm_command:
        os.str("");
        os << "Cannot set context disk to update it for VM " << vm->get_oid();
        goto error_common;

error_common:
        LifeCycleManager *  lcm = Nebula::instance().get_lcm();

        lcm->trigger_detach_nic_failure(vid);

        vm->log("VMM", Log::ERROR, os);
        return;
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachineManager::updatesg(VirtualMachine * vm, int sgid)
{
    string   vm_tmpl;
    string   drv_msg;

    if (!vm->hasHistory())
    {
        return -1;
    }

    // Get the driver for this VM
    const VirtualMachineManagerDriver * vmd = get(vm->get_vmm_mad());

    if ( vmd == nullptr )
    {
        return -1;
    }

    // Invoke driver method
    drv_msg = format_message(
                      vm->get_hostname(),
                      "",
                      vm->get_deploy_id(),
                      "",
                      "",
                      "",
                      "",
                      "",
                      "",
                      vm->to_xml(vm_tmpl),
                      vm->get_ds_id(),
                      sgid);

    vmd->updatesg(vm->get_oid(), drv_msg);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachineManager::updatenic(VirtualMachine * vm, int vnid)
{
    string   vm_tmpl;
    string   drv_msg;

    if (!vm->hasHistory())
    {
        return -1;
    }

    // Get the driver for this VM
    const VirtualMachineManagerDriver * vmd = get(vm->get_vmm_mad());

    if ( vmd == nullptr )
    {
        return -1;
    }

    // Invoke driver method
    drv_msg = format_message(
                      vm->get_hostname(),
                      "",
                      vm->get_deploy_id(),
                      "",
                      "",
                      "",
                      "",
                      "",
                      "",
                      vm->to_xml(vm_tmpl),
                      vm->get_ds_id(),
                      -1,
                      vnid);

    vmd->updatenic(vm->get_oid(), drv_msg);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::trigger_resize(int vid)
{
    trigger([this, vid]
    {
        const VirtualMachineManagerDriver * vmd;

        string        vm_tmpl;
        string        drv_msg;
        ostringstream os;

        // Get the VM from the pool
        auto vm = vmpool->get(vid);

        if (vm == nullptr)
        {
            return;
        }

        if (!vm->hasHistory())
        {
            goto error_history;
        }

        // Get the driver for this VM
        vmd = get(vm->get_vmm_mad());

        if ( vmd == nullptr )
        {
            goto error_driver;
        }

        // Invoke driver method
        drv_msg = format_message(
                vm->get_hostname(),
                "",
                vm->get_deploy_id(),
                "",
                "",
                "",
                "",
                "",
                "",
                vm->to_xml(vm_tmpl),
                vm->get_ds_id(),
                -1);

        vmd->write_drv(VMManagerMessages::RESIZE, vid, drv_msg);

        return;

error_history:
        os << "trigger_resize, VM has no history";
        goto error_common;

error_driver:
        os << "trigger_resize, error getting driver " << vm->get_vmm_mad();

error_common:
        vm->log("VMM", Log::ERROR, os);
        return;
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::trigger_backup(int vid)
{
    trigger([this, vid]
    {
        const VirtualMachineManagerDriver * vmd;

        ostringstream os, xfr;

        string  vm_tmpl;
        string  drv_msg;

        Nebula&           nd = Nebula::instance();
        TransferManager * tm = nd.get_tm();
        int ds_backup_id;

        // Get the VM from the pool
        auto vm = vmpool->get(vid);

        if (vm == nullptr)
        {
            return;
        }

        if (!vm->hasHistory())
        {
            goto error_history;
        }

        // Generate Backup commands for VM disks
        if ( tm->backup_transfer_commands(vm.get(), xfr) == -1 )
        {
            return;
        }

        // Get the driver for this VM
        vmd = get(vm->get_vmm_mad());

        if ( vmd == nullptr )
        {
            goto error_driver;
        }

        ds_backup_id = vm->backups().last_datastore_id();

        if ( ds_pool->exist(ds_backup_id) == -1 )
        {
            goto error_ds;
        }

        drv_msg = format_message(
                vm->get_hostname(),
                "",
                vm->get_deploy_id(),
                "",
                "",
                "",
                xfr.str(),
                "",
                "",
                vm->to_xml(vm_tmpl),
                ds_backup_id,
                -1);

        vmd->backup(vid, drv_msg);

        return;

error_history:
        os.str("");
        os << "backup, VM has no history";
        goto error_common;

error_driver:
        os.str("");
        os << "backup, error getting driver " << vm->get_vmm_mad();
        goto error_common;

error_ds:
        os.str("");
        os << "backup, backup datastore " << ds_backup_id
           << " does not exist";
        goto error_common;

error_common:
        LifeCycleManager *  lcm = Nebula::instance().get_lcm();

        lcm->trigger_backup_failure(vid);

        vm->log("VMM", Log::ERROR, os);
        return;
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::trigger_backup_cancel(int vid)
{
    trigger([this, vid]
    {
        const VirtualMachineManagerDriver * vmd;

        ostringstream os, xfr;

        string  vm_tmpl;
        string  drv_msg;

        Nebula&           nd = Nebula::instance();
        TransferManager * tm = nd.get_tm();
        int ds_backup_id;

        // Get the VM from the pool
        auto vm = vmpool->get(vid);

        if (vm == nullptr)
        {
            return;
        }

        if (!vm->hasHistory())
        {
            goto error_history;
        }

        // Generate backup cancel command
        if (tm->backup_cancel_transfer_commands(vm.get(), xfr) == -1)
        {
            return;
        }

        // Get the driver for this VM
        vmd = get(vm->get_vmm_mad());

        if (vmd == nullptr)
        {
            goto error_driver;
        }

        ds_backup_id = vm->backups().last_datastore_id();

        if (ds_pool->exist(ds_backup_id) == -1)
        {
            goto error_ds;
        }

        drv_msg = format_message(
                vm->get_hostname(),
                "",
                vm->get_deploy_id(),
                "",
                "",
                "",
                xfr.str(),
                "",
                "",
                vm->to_xml(vm_tmpl),
                ds_backup_id,
                -1);

        vmd->backup_cancel(vid, drv_msg);

        return;

error_history:
        os.str("");
        os << "backup cancel, VM has no history";
        goto error_common;

error_driver:
        os.str("");
        os << "backup cancel, error getting driver " << vm->get_vmm_mad();
        goto error_common;

error_ds:
        os.str("");
        os << "backup cancel, backup datastore " << ds_backup_id
           << " does not exist";
        goto error_common;

error_common:
        vm->log("VMM", Log::ERROR, os);
        return;
    });
}

/* ************************************************************************** */
/* MAD Loading                                                                */
/* ************************************************************************** */

int VirtualMachineManager::load_drivers(const vector<const VectorAttribute*>& _mads)
{
    int           rc;
    const string& mad_location = Nebula::instance().get_mad_location();

    NebulaLog::info("VMM", "Loading Virtual Machine Manager drivers.");

    for (auto vattr : _mads)
    {
        ostringstream                   oss;
        VirtualMachineManagerDriver *   vmm_driver = nullptr;

        const string& name = vattr->vector_value("NAME");
        string type  = vattr->vector_value("TYPE");

        one_util::toupper(type);

        oss << "\tLoading driver: " << name << " (" << type << ")";

        NebulaLog::log("VMM", Log::INFO, oss);

        if ( type == "XEN" )
        {
            vmm_driver = new XenDriver(mad_location, vattr->value());
        }
        else if ( type == "KVM" )
        {
            vmm_driver = new LibVirtDriver(mad_location, vattr->value(), "kvm");
        }
        else if ( type == "QEMU" )
        {
            vmm_driver = new LibVirtDriver(mad_location, vattr->value(), "qemu");
        }
        else if ( type == "XML" )
        {
            vmm_driver = new XMLDriver(mad_location, vattr->value());
        }
        else
        {
            oss.str("");
            oss << "\tUnknown driver type: " << type;

            NebulaLog::log("VMM", Log::ERROR, oss);

            continue;
        }

        rc = add(name, unique_ptr<VirtualMachineManagerDriver>(vmm_driver));

        if ( rc != 0 )
        {
            return rc;
        }

        oss.str("");
        oss << "\tDriver " << name << " loaded.";

        NebulaLog::log("VMM", Log::INFO, oss);
    }

    return 0;
}
