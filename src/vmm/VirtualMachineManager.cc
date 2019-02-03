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

#include "VirtualMachineManager.h"
#include "NebulaLog.h"
#include "XenDriver.h"
#include "XMLDriver.h"
#include "LibVirtDriver.h"
#include "NebulaUtil.h"

#include "Nebula.h"

#include <time.h>

/* ************************************************************************** */
/* Constructor                                                                */
/* ************************************************************************** */

VirtualMachineManager::VirtualMachineManager(
    time_t                          _timer_period,
    time_t                          _poll_period,
    bool                            _do_vm_poll,
    int                             _vm_limit,
    vector<const VectorAttribute*>&       _mads):
        MadManager(_mads),
        timer_period(_timer_period),
        poll_period(_poll_period),
        do_vm_poll(_do_vm_poll),
        vm_limit(_vm_limit)
{
    Nebula& nd = Nebula::instance();

    vmpool  = nd.get_vmpool();
    hpool   = nd.get_hpool();
    ds_pool = nd.get_dspool();

    am.addListener(this);
};

/* ************************************************************************** */
/* Manager start function                                                     */
/* ************************************************************************** */

extern "C" void * vmm_action_loop(void *arg)
{
    VirtualMachineManager *  vmm;

    if ( arg == 0 )
    {
        return 0;
    }

    vmm = static_cast<VirtualMachineManager *>(arg);

    NebulaLog::log("VMM",Log::INFO,"Virtual Machine Manager started.");

    vmm->am.loop(vmm->timer_period);

    NebulaLog::log("VMM",Log::INFO,"Virtual Machine Manager stopped.");

    return 0;
}

/* -------------------------------------------------------------------------- */

int VirtualMachineManager::start()
{
    int               rc;
    pthread_attr_t    pattr;

    rc = MadManager::start();

    if ( rc != 0 )
    {
        return -1;
    }

    NebulaLog::log("VMM",Log::INFO,"Starting Virtual Machine Manager...");

    pthread_attr_init (&pattr);
    pthread_attr_setdetachstate (&pattr, PTHREAD_CREATE_JOINABLE);

    rc = pthread_create(&vmm_thread,&pattr,vmm_action_loop,(void *) this);

    return rc;
};

/* ************************************************************************** */
/* Manager Action Interface                                                   */
/* ************************************************************************** */

void VirtualMachineManager::user_action(const ActionRequest& ar)
{
    const VMMAction& vmm_ar = static_cast<const VMMAction& >(ar);
    int vid = vmm_ar.vm_id();

    switch (vmm_ar.action())
    {
        case VMMAction::DEPLOY:
            deploy_action(vid);
        break;
        case VMMAction::SAVE:
            save_action(vid);
        break;
        case VMMAction::RESTORE:
            restore_action(vid);
        break;
        case VMMAction::REBOOT:
            reboot_action(vid);
        break;
        case VMMAction::RESET:
            reset_action(vid);
        break;
        case VMMAction::SHUTDOWN:
            shutdown_action(vid);
        break;
        case VMMAction::CANCEL:
            cancel_action(vid);
        break;
        case VMMAction::CANCEL_PREVIOUS:
            cancel_previous_action(vid);
        break;
        case VMMAction::CLEANUP:
            cleanup_action(vid, false);
        break;
        case VMMAction::CLEANUP_BOTH:
            cleanup_action(vid, true);
        break;
        case VMMAction::CLEANUP_PREVIOUS:
            cleanup_previous_action(vid);
        break;
        case VMMAction::MIGRATE:
            migrate_action(vid);
        break;
        case VMMAction::POLL:
            poll_action(vid);
        break;
        case VMMAction::DRIVER_CANCEL:
            driver_cancel_action(vid);
        break;
        case VMMAction::ATTACH:
            attach_action(vid);
        break;
        case VMMAction::DETACH:
            detach_action(vid);
        break;
        case VMMAction::ATTACH_NIC:
            attach_nic_action(vid);
        break;
        case VMMAction::DETACH_NIC:
            detach_nic_action(vid);
        break;
        case VMMAction::SNAPSHOT_CREATE:
            snapshot_create_action(vid);
        break;
        case VMMAction::SNAPSHOT_REVERT:
            snapshot_revert_action(vid);
        break;
        case VMMAction::SNAPSHOT_DELETE:
            snapshot_delete_action(vid);
        break;
        case VMMAction::DISK_SNAPSHOT_CREATE:
            disk_snapshot_create_action(vid);
        break;
        case VMMAction::DISK_RESIZE:
            disk_resize_action(vid);
        break;
    }
}

/* ************************************************************************** */
/* Manager Actions                                                            */
/* ************************************************************************** */

string * VirtualMachineManager::format_message(
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
    int sgid)
{
    ostringstream oss;

    string ds_tmpl = "";
    Datastore * ds = ds_pool->get_ro(ds_id);

    if ( ds != 0 )
    {
        ds->to_xml(ds_tmpl);
        ds->unlock();
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

    oss << tmpl
        << ds_tmpl
        << "</VMM_DRIVER_ACTION_DATA>";

    return one_util::base64_encode(oss.str());
}

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

void VirtualMachineManager::deploy_action(int vid)
{
    VirtualMachine *                    vm;
    const VirtualMachineManagerDriver * vmd;
    int rc;

    ostringstream os;
    string        password;
    string        disk_path;
    string        prolog_cmd;
    string        vm_tmpl;
    string *      drv_msg;

    vm = vmpool->get(vid);

    if (vm == 0)
    {
        return;
    }

    int uid = vm->get_created_by_uid();
    int owner_id = vm->get_uid();

    vm->unlock();

    password = Nebula::instance().get_upool()->get_token_password(uid, owner_id);

    vm = vmpool->get(vid);

    if (vm == 0)
    {
        return;
    }

    if (!vm->hasHistory())
    {
        goto error_history;
    }

    // Get the driver for this VM
    vmd = get(vm->get_vmm_mad());

    if ( vmd == 0 )
    {
        goto error_driver;
    }

    //Generate VM description file
    os << "Generating deployment file: " << vm->get_deployment_file();

    vm->log("VMM", Log::INFO, os);

    os.str("");

    rc = vmd->deployment_description(vm,vm->get_deployment_file());

    if (rc != 0)
    {
        goto error_file;
    }

    if ( do_context_command(vm, password, prolog_cmd, disk_path) == -1 )
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

    vmd->deploy(vid, *drv_msg);

    delete drv_msg;

    vmpool->update(vm);

    vm->unlock();

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
    Nebula              &ne = Nebula::instance();
    LifeCycleManager *  lcm = ne.get_lcm();

    lcm->trigger(LCMAction::DEPLOY_FAILURE, vid);

    vm->log("VMM", Log::ERROR, os);
    vm->unlock();
    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::save_action(
    int vid)
{
    VirtualMachine *                    vm;
    const VirtualMachineManagerDriver * vmd;

    string   hostname, checkpoint_file;
    string   vm_tmpl;
    string * drv_msg;
    int      ds_id;

    ostringstream os;

    // Get the VM from the pool
    vm = vmpool->get(vid);

    if (vm == 0)
    {
        return;
    }

    if (!vm->hasHistory())
    {
        goto error_history;
    }

    // Get the driver for this VM
    vmd = get(vm->get_vmm_mad());

    if ( vmd == 0 )
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

    vmd->save(vid, *drv_msg);

    delete drv_msg;

    vm->unlock();

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
    Nebula              &ne = Nebula::instance();
    LifeCycleManager *  lcm = ne.get_lcm();

    lcm->trigger(LCMAction::SAVE_FAILURE, vid);

    vm->log("VMM", Log::ERROR, os);
    vm->unlock();
    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::shutdown_action(
    int vid)
{
    VirtualMachine *                    vm;
    const VirtualMachineManagerDriver * vmd;

    string        hostname;
    string        vm_tmpl;
    string *      drv_msg;
    ostringstream os;

    int      ds_id;

    // Get the VM from the pool
    vm = vmpool->get(vid);

    if (vm == 0)
    {
        return;
    }

    if (!vm->hasHistory())
    {
        goto error_history;
    }

    // Get the driver for this VM
    vmd = get(vm->get_vmm_mad());

    if ( vmd == 0 )
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

    vmd->shutdown(vid, *drv_msg);

    delete drv_msg;

    vm->unlock();

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
    Nebula              &ne = Nebula::instance();
    LifeCycleManager *  lcm = ne.get_lcm();

    lcm->trigger(LCMAction::SHUTDOWN_FAILURE, vid);

    vm->log("VMM", Log::ERROR, os);
    vm->unlock();
    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::reboot_action(
    int vid)
{
    VirtualMachine *                    vm;
    const VirtualMachineManagerDriver * vmd;

    string        vm_tmpl;
    string *      drv_msg;
    ostringstream os;

    // Get the VM from the pool
    vm = vmpool->get(vid);

    if (vm == 0)
    {
        return;
    }

    if (!vm->hasHistory())
    {
        goto error_history;
    }

    // Get the driver for this VM
    vmd = get(vm->get_vmm_mad());

    if ( vmd == 0 )
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

    vmd->reboot(vid, *drv_msg);

    delete drv_msg;

    vm->unlock();

    return;

error_history:
    os << "reboot_action, VM has no history";
    goto error_common;

error_driver:
    os << "reboot_action, error getting driver " << vm->get_vmm_mad();

error_common:
    vm->log("VMM", Log::ERROR, os);
    vm->unlock();
    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::reset_action(
    int vid)
{
    VirtualMachine *                    vm;
    const VirtualMachineManagerDriver * vmd;

    string        vm_tmpl;
    string *      drv_msg;
    ostringstream os;

    // Get the VM from the pool
    vm = vmpool->get(vid);

    if (vm == 0)
    {
        return;
    }

    if (!vm->hasHistory())
    {
        goto error_history;
    }

    // Get the driver for this VM
    vmd = get(vm->get_vmm_mad());

    if ( vmd == 0 )
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

    vmd->reset(vid, *drv_msg);

    delete drv_msg;

    vm->unlock();

    return;

error_history:
    os << "reset_action, VM has no history";
    goto error_common;

error_driver:
    os << "reset_action, error getting driver " << vm->get_vmm_mad();

error_common:
    vm->log("VMM", Log::ERROR, os);
    vm->unlock();
    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::cancel_action(
    int vid)
{
    VirtualMachine * vm;
    ostringstream    os;

    string   hostname;
    string   vm_tmpl;
    string * drv_msg;
    int ds_id;

    const VirtualMachineManagerDriver *   vmd;

    // Get the VM from the pool
    vm = vmpool->get(vid);

    if (vm == 0)
    {
        return;
    }

    if (!vm->hasHistory())
    {
        goto error_history;
    }

    // Get the driver for this VM
    vmd = get(vm->get_vmm_mad());

    if ( vmd == 0 )
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

    vmd->cancel(vid, *drv_msg);

    delete drv_msg;

    vm->unlock();

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
    Nebula              &ne = Nebula::instance();
    LifeCycleManager *  lcm = ne.get_lcm();

    lcm->trigger(LCMAction::CANCEL_FAILURE, vid);

    vm->log("VMM", Log::ERROR, os);
    vm->unlock();
    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::cancel_previous_action(
    int vid)
{
    VirtualMachine * vm;
    ostringstream    os;

    string   vm_tmpl;
    string * drv_msg;

    const VirtualMachineManagerDriver * vmd;

    // Get the VM from the pool
    vm = vmpool->get(vid);

    if (vm == 0)
    {
        return;
    }

    if (!vm->hasHistory() || !vm->hasPreviousHistory())
    {
        goto error_history;
    }

    // Get the driver for this VM
    vmd = get(vm->get_previous_vmm_mad());

    if ( vmd == 0 )
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

    vmd->cancel(vid, *drv_msg);

    delete drv_msg;

    vm->unlock();

    return;

error_history:
    os << "cancel_previous_action, VM has no history";
    goto error_common;

error_driver:
    os << "cancel_previous_action, error getting driver " << vm->get_vmm_mad();

error_common:
    vm->log("VMM", Log::ERROR, os);
    vm->unlock();
    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::cleanup_action(
    int vid, bool cancel_previous)
{
    VirtualMachine * vm;
    ostringstream    os;

    string   vm_tmpl;
    string * drv_msg;
    string   tm_command = "";

    string m_hostname = "";

    const VirtualMachineManagerDriver *   vmd;

    Nebula& nd = Nebula::instance();

    // Get the VM from the pool
    vm = vmpool->get(vid);

    if (vm == 0)
    {
        return;
    }

    if (!vm->hasHistory())
    {
        goto error_history;
    }

    // Get the driver for this VM
    vmd = get(vm->get_vmm_mad());

    if ( vmd == 0 )
    {
        goto error_driver;
    }

    if ( cancel_previous && vm->hasPreviousHistory() )
    {
        m_hostname = vm->get_previous_hostname();
    }

    if (!vm->get_host_is_cloud())
    {
        if ( nd.get_tm()->epilog_delete_commands(vm, os, false, false) != 0 )
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

    vmd->cleanup(vid, *drv_msg);

    delete drv_msg;

    vm->unlock();

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
    (nd.get_lcm())->trigger(LCMAction::CLEANUP_FAILURE, vid);

    vm->log("VMM", Log::ERROR, os);
    vm->unlock();
    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::cleanup_previous_action(int vid)
{
    VirtualMachine * vm;
    ostringstream    os;

    string   vm_tmpl;
    string * drv_msg;
    string   tm_command = "";

    const VirtualMachineManagerDriver *   vmd;

    Nebula& nd = Nebula::instance();

    // Get the VM from the pool
    vm = vmpool->get(vid);

    if (vm == 0)
    {
        return;
    }

    if (!vm->hasHistory() || !vm->hasPreviousHistory())
    {
        goto error_history;
    }

    // Get the driver for this VM
    vmd = get(vm->get_vmm_mad());

    if ( vmd == 0 )
    {
        goto error_driver;
    }

    if ( nd.get_tm()->epilog_delete_commands(vm, os, false, true) != 0 )
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

    vmd->cleanup(vid, *drv_msg);

    delete drv_msg;

    vm->unlock();

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
    (nd.get_lcm())->trigger(LCMAction::CLEANUP_FAILURE, vid);

    vm->log("VMM", Log::ERROR, os);
    vm->unlock();
    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::migrate_action(
    int vid)
{
    VirtualMachine *                    vm;
    const VirtualMachineManagerDriver * vmd;

    ostringstream os;
    string   vm_tmpl;
    string * drv_msg;

    // Get the VM from the pool
    vm = vmpool->get(vid);

    if (vm == 0)
    {
        return;
    }

    if (!vm->hasHistory())
    {
        goto error_history;
    }

    // Get the driver for this VM
    vmd = get(vm->get_vmm_mad());

    if ( vmd == 0 )
    {
        goto error_driver;
    }

    if (!vm->hasPreviousHistory())
    {
        goto error_previous_history;
    }

    Nebula::instance().get_tm()->migrate_transfer_command(vm, os);

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
        "",
        vm->to_xml(vm_tmpl),
        vm->get_previous_ds_id(),
        -1);

    vmd->migrate(vid, *drv_msg);

    delete drv_msg;

    vm->unlock();

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
    Nebula              &ne = Nebula::instance();
    LifeCycleManager *  lcm = ne.get_lcm();

    lcm->trigger(LCMAction::DEPLOY_FAILURE, vid);

    vm->log("VMM", Log::ERROR, os);
    vm->unlock();
    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::restore_action(
    int vid)
{
    VirtualMachine *                    vm;
    const VirtualMachineManagerDriver * vmd;

    ostringstream os;

    string vm_tmpl;

    string password;
    string prolog_cmd;
    string disk_path;

    string* drv_msg;

    vm = vmpool->get(vid);

    if (vm == 0)
    {
        return;
    }

    int uid = vm->get_created_by_uid();
    int owner_id = vm->get_uid();

    vm->unlock();

    password = Nebula::instance().get_upool()->get_token_password(uid, owner_id);

    vm = vmpool->get(vid);

    if (vm == 0)
    {
        return;
    }

    if (!vm->hasHistory())
    {
        goto error_history;
    }

    vmd = get(vm->get_vmm_mad());

    if ( vmd == 0 )
    {
        goto error_driver;
    }

    if ( do_context_command(vm, password, prolog_cmd, disk_path) == -1 )
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

    vmd->restore(vid, *drv_msg);

    delete drv_msg;

    vmpool->update(vm);

    vm->unlock();

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
    Nebula              &ne = Nebula::instance();
    LifeCycleManager *  lcm = ne.get_lcm();

    lcm->trigger(LCMAction::DEPLOY_FAILURE, vid);

    vm->log("VMM", Log::ERROR, os);
    vm->unlock();
    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::poll_action(
    int vid)
{
    VirtualMachine *                    vm;
    const VirtualMachineManagerDriver * vmd;

    ostringstream os;

    string   vm_tmpl;
    string * drv_msg;

    // Get the VM from the pool
    vm = vmpool->get(vid);

    if (vm == 0)
    {
        return;
    }

    if (!vm->hasHistory())
    {
        goto error_history;
    }

    // Get the driver for this VM
    vmd = get(vm->get_vmm_mad());

    if ( vmd == 0 )
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

    vmd->poll(vid, *drv_msg);

    delete drv_msg;

    vm->unlock();

    return;

error_history:
    os << "poll_action, VM has no history";
    goto error_common;

error_driver:
    os << "poll_action, error getting driver " << vm->get_vmm_mad();

error_common:
    vm->log("VMM", Log::ERROR, os);
    vm->unlock();
    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::driver_cancel_action(
    int vid)
{
    VirtualMachine * vm;
    ostringstream    os;

    const VirtualMachineManagerDriver * vmd;

    // Get the VM from the pool
    vm = vmpool->get(vid);

    if (vm == 0)
    {
        return;
    }

    if (!vm->hasHistory())
    {
        goto error_history;
    }

    // Get the driver for this VM
    vmd = get(vm->get_vmm_mad());

    if ( vmd == 0 )
    {
        goto error_driver;
    }

    // Invoke driver method
    vmd->driver_cancel(vid);

    vm->unlock();
    return;

error_history:
    os << "driver_cacncel_action, VM has no history";
    goto error_common;

error_driver:
    os << "driver_cancel_action, error getting driver " << vm->get_vmm_mad();

error_common:
    vm->log("VMM", Log::ERROR, os);
    vm->unlock();
    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::timer_action(const ActionRequest& ar)
{
    static int mark        = 0;
    static int timer_start = time(0);

    VirtualMachine *      vm;
    vector<int>           oids;
    vector<int>::iterator it;
    int                   rc;
    ostringstream         os;

    time_t thetime = time(0);

    const VirtualMachineManagerDriver * vmd;

    string   vm_tmpl;
    string * drv_msg;

    mark = mark + timer_period;

    if ( mark >= 600 )
    {
        NebulaLog::log("VMM",Log::INFO,"--Mark--");
        mark = 0;
    }

    // Clear the expired monitoring records
    vmpool->clean_expired_monitoring();

    // Skip monitoring the first poll_period to allow the Host monitoring to
    // gather the VM info (or if it is disabled)
    if ( timer_start + poll_period > thetime || !do_vm_poll)
    {
        return;
    }

    // Monitor only VMs that hasn't been monitored for 'poll_period' seconds.
    rc = vmpool->get_running(oids, vm_limit, thetime - poll_period);

    if ( rc != 0 || oids.empty() )
    {
        return;
    }

    for ( it = oids.begin(); it != oids.end(); it++ )
    {
        vm = vmpool->get(*it);

        if ( vm == 0 )
        {
            continue;
        }

        if (!vm->hasHistory())
        {
            os.str("");
            os << "Monitoring VM " << *it << " but it has no history.";
            NebulaLog::log("VMM", Log::ERROR, os);

            vm->unlock();
            continue;
        }

        // Skip monitoring the first poll_period to allow the Host monitoring to
        // gather the VM info
        if (vm->get_running_stime() + poll_period > thetime)
        {
            vm->unlock();
            continue;
        }

        os.str("");

        os << "Monitoring VM " << *it << ".";
        NebulaLog::log("VMM", Log::DEBUG, os);

        vmd = get(vm->get_vmm_mad());

        if ( vmd == 0 )
        {
            vm->unlock();
            continue;
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

        vmd->poll(*it, *drv_msg);

        delete drv_msg;

        vm->set_last_poll(thetime);

        vmpool->update(vm);

        vm->unlock();
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::attach_action(
    int vid)
{
    VirtualMachine *                    vm;
    const VirtualMachineManagerDriver * vmd;

    ostringstream os, error_os;

    string  vm_tmpl;
    string* drv_msg;
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
    vm = vmpool->get(vid);

    if (vm == 0)
    {
        return;
    }

    if (!vm->hasHistory())
    {
        goto error_history;
    }

    // Get the driver for this VM

    vmd = get(vm->get_vmm_mad());

    if ( vmd == 0 )
    {
        goto error_driver;
    }

    disk = vm->get_attach_disk();

    if ( disk == 0 )
    {
        goto error_disk;
    }

    vm_tm_mad = vm->get_tm_mad();

    opennebula_hostname = nd.get_nebula_hostname();

    rc = tm->prolog_transfer_command(
            vm,
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

    tm->epilog_transfer_command(vm, vm->get_hostname(), disk, os);

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

    vmd->attach(vid, *drv_msg);

    delete drv_msg;

    vm->unlock();

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
    Nebula              &ne = Nebula::instance();
    LifeCycleManager *  lcm = ne.get_lcm();

    lcm->trigger(LCMAction::ATTACH_FAILURE, vid);

    vm->log("VMM", Log::ERROR, os);
    vm->unlock();
    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::detach_action(
    int vid)
{
    VirtualMachine *                    vm;
    const VirtualMachineManagerDriver * vmd;

    ostringstream os;
    string        vm_tmpl;
    string *      drv_msg;
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
    vm = vmpool->get(vid);

    if (vm == 0)
    {
        return;
    }

    if (!vm->hasHistory())
    {
        goto error_history;
    }

    // Get the driver for this VM
    vmd = get(vm->get_vmm_mad());

    if ( vmd == 0 )
    {
        goto error_driver;
    }

    disk = vm->get_attach_disk();

    if ( disk == 0 )
    {
        goto error_disk;
    }

    vm_tm_mad = vm->get_tm_mad();
    opennebula_hostname = nd.get_nebula_hostname();

    disk_id = disk->get_disk_id();

    tm->epilog_transfer_command(vm, vm->get_hostname(), disk, os);

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

    vmd->detach(vid, *drv_msg);

    delete drv_msg;

    vm->unlock();

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
    Nebula              &ne = Nebula::instance();
    LifeCycleManager *  lcm = ne.get_lcm();

    lcm->trigger(LCMAction::DETACH_FAILURE, vid);

    vm->log("VMM", Log::ERROR, os);
    vm->unlock();
    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::snapshot_create_action(int vid)
{
    VirtualMachine *                    vm;
    const VirtualMachineManagerDriver * vmd;

    ostringstream os;

    string  vm_tmpl;
    string* drv_msg;

    // Get the VM from the pool
    vm = vmpool->get(vid);

    if (vm == 0)
    {
        return;
    }

    if (!vm->hasHistory())
    {
        goto error_history;
    }

    // Get the driver for this VM
    vmd = get(vm->get_vmm_mad());

    if ( vmd == 0 )
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

    vmd->snapshot_create(vid, *drv_msg);

    delete drv_msg;

    vm->unlock();

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
    Nebula              &ne = Nebula::instance();
    LifeCycleManager *  lcm = ne.get_lcm();

    lcm->trigger(LCMAction::SNAPSHOT_CREATE_FAILURE, vid);

    vm->log("VMM", Log::ERROR, os);
    vm->unlock();
    return;

}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::snapshot_revert_action(int vid)
{
    VirtualMachine *                    vm;
    const VirtualMachineManagerDriver * vmd;

    ostringstream os;

    string  vm_tmpl;
    string* drv_msg;

    // Get the VM from the pool
    vm = vmpool->get(vid);

    if (vm == 0)
    {
        return;
    }

    if (!vm->hasHistory())
    {
        goto error_history;
    }

    // Get the driver for this VM
    vmd = get(vm->get_vmm_mad());

    if ( vmd == 0 )
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

    vmd->snapshot_revert(vid, *drv_msg);

    delete drv_msg;

    vm->unlock();

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
    Nebula              &ne = Nebula::instance();
    LifeCycleManager *  lcm = ne.get_lcm();

    lcm->trigger(LCMAction::SNAPSHOT_REVERT_FAILURE, vid);

    vm->log("VMM", Log::ERROR, os);
    vm->unlock();
    return;

}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::snapshot_delete_action(int vid)
{
    VirtualMachine *                    vm;
    const VirtualMachineManagerDriver * vmd;

    ostringstream os;

    string  vm_tmpl;
    string* drv_msg;

    // Get the VM from the pool
    vm = vmpool->get(vid);

    if (vm == 0)
    {
        return;
    }

    if (!vm->hasHistory())
    {
        goto error_history;
    }

    // Get the driver for this VM
    vmd = get(vm->get_vmm_mad());

    if ( vmd == 0 )
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

    vmd->snapshot_delete(vid, *drv_msg);

    delete drv_msg;

    vm->unlock();

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
    Nebula              &ne = Nebula::instance();
    LifeCycleManager *  lcm = ne.get_lcm();

    lcm->trigger(LCMAction::SNAPSHOT_DELETE_FAILURE, vid);

    vm->log("VMM", Log::ERROR, os);
    vm->unlock();
    return;

}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::disk_snapshot_create_action(int vid)
{
    VirtualMachine *                    vm;
    const VirtualMachineManagerDriver * vmd;

    ostringstream os;

    string  vm_tmpl;
    string* drv_msg;

    string  vm_tm_mad;
    string  snap_cmd;
    string  disk_path;

    string  tm_mad;
    int     ds_id, disk_id, snap_id;

    int rc;

    Nebula& nd           = Nebula::instance();
    TransferManager * tm = nd.get_tm();

    vm = vmpool->get(vid);

    if (vm == 0)
    {
        return;
    }

    if (!vm->hasHistory())
    {
        goto error_history;
    }

    vmd = get(vm->get_vmm_mad());

    if ( vmd == 0 )
    {
        goto error_driver;
    }

    if ( vm->get_snapshot_disk(ds_id, tm_mad, disk_id, snap_id) != 0 )
    {
        goto error_disk;
    }

    rc = tm->snapshot_transfer_command( vm, "SNAP_CREATE", os);

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

    vmd->disk_snapshot_create(vid, *drv_msg);

    vm->unlock();

    delete drv_msg;

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
    Nebula              &ne = Nebula::instance();
    LifeCycleManager *  lcm = ne.get_lcm();

    lcm->trigger(LCMAction::DISK_SNAPSHOT_FAILURE, vid);

    vm->log("VMM", Log::ERROR, os);
    vm->unlock();
    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::disk_resize_action(int vid)
{
    VirtualMachine *                    vm;
    const VirtualMachineManagerDriver * vmd;

    VirtualMachineDisk * disk;

    ostringstream os;

    string  vm_tmpl;
    string* drv_msg;

    string  resize_cmd;
    string  disk_path;

    Nebula& nd           = Nebula::instance();
    TransferManager * tm = nd.get_tm();

    vm = vmpool->get(vid);

    if (vm == 0)
    {
        return;
    }

    if (!vm->hasHistory())
    {
        goto error_history;
    }

    vmd = get(vm->get_vmm_mad());

    if ( vmd == 0 )
    {
        goto error_driver;
    }

    disk = vm->get_resize_disk();

    if ( disk == 0 )
    {
        goto error_disk;
    }

    tm->resize_command(vm, disk, os);

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

    vmd->disk_resize(vid, *drv_msg);

    vm->unlock();

    delete drv_msg;

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
    Nebula              &ne = Nebula::instance();
    LifeCycleManager *  lcm = ne.get_lcm();

    lcm->trigger(LCMAction::DISK_SNAPSHOT_FAILURE, vid);

    vm->log("VMM", Log::ERROR, os);
    vm->unlock();
    return;
}
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::attach_nic_action(
    int vid)
{
    VirtualMachine *                    vm;
    const VirtualMachineManagerDriver * vmd;

    ostringstream os;

    string  vm_tmpl;
    string* drv_msg;
    string  opennebula_hostname;
    string  prolog_cmd;
    string  disk_path;
    string  password;

    // Get the VM from the pool
    vm = vmpool->get(vid);

    if (vm == 0)
    {
        return;
    }

    int uid = vm->get_created_by_uid();
    int owner_id = vm->get_uid();
    vm->unlock();

    password = Nebula::instance().get_upool()->get_token_password(uid, owner_id);

    vm = vmpool->get(vid);

    if (vm == 0)
    {
        return;
    }

    if (!vm->hasHistory())
    {
        goto error_history;
    }

    // Get the driver for this VM
    vmd = get(vm->get_vmm_mad());

    if ( vmd == 0 )
    {
        goto error_driver;
    }

    if ( do_context_command(vm, password, prolog_cmd, disk_path) == -1 )
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

    vmd->attach_nic(vid, *drv_msg);

    delete drv_msg;

    vmpool->update(vm);

    vm->unlock();

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
    Nebula              &ne = Nebula::instance();
    LifeCycleManager *  lcm = ne.get_lcm();

    lcm->trigger(LCMAction::ATTACH_NIC_FAILURE, vid);

    vm->log("VMM", Log::ERROR, os);
    vm->unlock();
    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManager::detach_nic_action(
    int vid)
{
    VirtualMachine *                    vm;
    const VirtualMachineManagerDriver * vmd;

    ostringstream os;
    string        vm_tmpl;
    string *      drv_msg;
    string        error_str;
    string  prolog_cmd;
    string  disk_path;
    string  password;

    // Get the VM from the pool
    vm = vmpool->get(vid);

    if (vm == 0)
    {
        return;
    }

    int uid = vm->get_created_by_uid();
    int owner_id = vm->get_uid();
    vm->unlock();

    password = Nebula::instance().get_upool()->get_token_password(uid, owner_id);

    vm = vmpool->get(vid);

    if (vm == 0)
    {
        return;
    }

    if (!vm->hasHistory())
    {
        goto error_history;
    }

    // Get the driver for this VM
    vmd = get(vm->get_vmm_mad());

    if ( vmd == 0 )
    {
        goto error_driver;
    }

    if ( do_context_command(vm, password, prolog_cmd, disk_path) == -1 )
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

    vmd->detach_nic(vid, *drv_msg);

    delete drv_msg;

    vm->unlock();

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
    Nebula              &ne = Nebula::instance();
    LifeCycleManager *  lcm = ne.get_lcm();

    lcm->trigger(LCMAction::DETACH_NIC_FAILURE, vid);

    vm->log("VMM", Log::ERROR, os);
    vm->unlock();
    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachineManager::updatesg(VirtualMachine * vm, int sgid)
{
    string   vm_tmpl;
    string * drv_msg;

    ostringstream os;

    if (!vm->hasHistory())
    {
        return -1;
    }

    // Get the driver for this VM
    const VirtualMachineManagerDriver * vmd = get(vm->get_vmm_mad());

    if ( vmd == 0 )
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

    vmd->updatesg(vm->get_oid(), *drv_msg);

    delete drv_msg;

    return 0;
}

/* ************************************************************************** */
/* MAD Loading                                                                */
/* ************************************************************************** */

int VirtualMachineManager::load_mads(int uid)
{
    unsigned int                    i;
    ostringstream                   oss;
    const VectorAttribute *         vattr;
    int                             rc;
    string                          name;
    string                          type;
    VirtualMachineManagerDriver *   vmm_driver = 0;

    oss << "Loading Virtual Machine Manager drivers.";

    NebulaLog::log("VMM",Log::INFO,oss);

    for(i=0,oss.str("");i<mad_conf.size();i++,oss.str(""),vmm_driver=0)
    {
        vattr = static_cast<const VectorAttribute *>(mad_conf[i]);

        name  = vattr->vector_value("NAME");
        type  = vattr->vector_value("TYPE");

        transform (type.begin(),type.end(),type.begin(),(int(*)(int))toupper);

        oss << "\tLoading driver: " << name << " (" << type << ")";

        NebulaLog::log("VMM", Log::INFO, oss);

        if ( type == "XEN" )
        {
            vmm_driver = new XenDriver(uid, vattr->value(),(uid != 0),vmpool);
        }
        else if ( type == "KVM" )
        {
            vmm_driver = new LibVirtDriver(uid, vattr->value(),
                                           (uid != 0),vmpool,"kvm");
        }
        else if ( type == "QEMU" )
        {
            vmm_driver = new LibVirtDriver(uid, vattr->value(),
                                           (uid != 0),vmpool,"qemu");
        }
        else if ( type == "XML" )
        {
            vmm_driver = new XMLDriver(uid, vattr->value(),(uid != 0),vmpool);
        }
        else
        {
            oss.str("");
            oss << "\tUnknown driver type: " << type;

            NebulaLog::log("VMM",Log::ERROR,oss);

            continue;
        }

        rc = add(vmm_driver);

        if ( rc == 0 )
        {
            oss.str("");
            oss << "\tDriver " << name << " loaded.";

            NebulaLog::log("VMM",Log::INFO,oss);
        }
        else
        {
            return rc;
        }
    }

    return 0;
}
