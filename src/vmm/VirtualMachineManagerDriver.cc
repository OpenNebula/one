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

#include "VirtualMachineManagerDriver.h"
#include "NebulaLog.h"
#include "LifeCycleManager.h"

#include "Nebula.h"
#include "NebulaUtil.h"
#include <sstream>


const string VirtualMachineManagerDriver::imported_actions_default =
    "shutdown, shutdown-hard, hold, release, suspend, resume, delete, reboot, "
    "reboot-hard, resched, unresched, disk-attach, disk-detach, nic-attach, "
    "nic-detach, snap-create, snap-delete";

const string VirtualMachineManagerDriver::imported_actions_default_public =
    "shutdown, shutdown-hard, hold, release, suspend, resume, delete, reboot, "
    "reboot-hard, resched, unresched, disk-attach, disk-detach, nic-attach, "
    "nic-detach, snap-create, snap-delete, poweroff, poweroff-hard";

VirtualMachineManagerDriver::VirtualMachineManagerDriver(
    int                         userid,
    const map<string,string>&   attrs,
    bool                        sudo,
    VirtualMachinePool *        pool):
        Mad(userid,attrs,sudo), driver_conf(true), vmpool(pool)
{
    map<string,string>::const_iterator  it;
    char *          error_msg = 0;
    const char *    cfile;
    string          file;
    int             rc;
    string          action_defaults;

    it = attrs.find("DEFAULT");

    if ( it != attrs.end() )
    {
        if (it->second[0] != '/') //Look in ONE_LOCATION/etc or in "/etc/one"
        {
            Nebula& nd = Nebula::instance();

            file  = nd.get_defaults_location() + it->second;
            cfile = file.c_str();
        }
        else //Absolute Path
        {
            cfile = it->second.c_str();
        }

        rc = driver_conf.parse(cfile, &error_msg);

        if ( rc != 0 )
        {
            ostringstream   oss;

            if ( error_msg != 0 )
            {
                oss << "Error loading driver configuration file " << cfile <<
                    " : " << error_msg;

                free(error_msg);
            }
            else
            {
                oss << "Error loading driver configuration file " << cfile;
            }

            NebulaLog::log("VMM", Log::ERROR, oss);
        }
    }

    it = attrs.find("IMPORTED_VMS_ACTIONS");

    if (it != attrs.end())
    {
        action_defaults = it->second;
    }
    else
    {
		NebulaLog::log("VMM", Log::INFO, "Using default imported VMs actions");

		it = attrs.find("NAME");

		if (it != attrs.end())
		{
			if ( it->second == "kvm" || it->second == "xen" )
			{
				action_defaults = imported_actions_default;
			}
			else if ( it->second == "sl" || it->second == "ec2" ||
			          it->second == "az" || it->second == "vcenter" )
			{
                action_defaults = imported_actions_default_public;
			}
		}
    }

    vector<string> actions;
    vector<string>::iterator vit;

    string action;
    History::VMAction id;

    actions = one_util::split(action_defaults, ',');

    for (vit = actions.begin() ; vit != actions.end() ; ++vit)
    {
        action = one_util::trim(*vit);

        if ( History::action_from_str(action, id) != 0 )
        {
            NebulaLog::log("VMM", Log::ERROR, "Wrong action: " + action);
            continue;
        }

        imported_actions.set(id);
    }
}

/* ************************************************************************** */
/* MAD Interface                                                              */
/* ************************************************************************** */

/* -------------------------------------------------------------------------- */
/* Helpers for the protocol function                                          */
/* -------------------------------------------------------------------------- */

static void log_error(VirtualMachine* vm,
                      ostringstream&  os,
                      istringstream&  is,
                      const char *    msg)
{
    string info;

    getline(is,info);

    os.str("");
    os << msg;

    if (!info.empty() && info[0] != '-')
    {
        os << ": " << info;
        vm->set_template_error_message(os.str());
    }

    vm->log("VMM",Log::ERROR,os);
}

/* -------------------------------------------------------------------------- */

static void log_monitor_error(VirtualMachine* vm,
                      ostringstream&  os,
                      istringstream&  is,
                      const char *    msg)
{
    string info;

    getline(is,info);

    os.str("");
    os << msg;

    if (!info.empty() && info[0] != '-')
    {
        os << ": " << info;
        vm->set_template_monitor_error(os.str());
    }

    vm->log("VMM",Log::ERROR,os);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManagerDriver::protocol(const string& message) const
{
    istringstream is(message);
    ostringstream os;

    string action;
    string result;

    int              id;
    VirtualMachine * vm;

    Nebula              &ne = Nebula::instance();
    LifeCycleManager *  lcm = ne.get_lcm();

    os << "Message received: " << message;
    NebulaLog::log("VMM", Log::DEBUG, os);

    // -------------------------------------------------------------------------
    // Parse the driver message: action, result and VM id
    // -------------------------------------------------------------------------
    if ( is.good() )
    {
        is >> action >> ws;
    }
    else
    {
        return;
    }

    if ( is.good() )
    {
        is >> result >> ws;
    }
    else
    {
        return;
    }

    if ( is.good() )
    {
        is >> id >> ws;

        if ( is.fail() )
        {
            if ( action == "LOG" )
            {
                string info;

                is.clear();
                getline(is,info);
                NebulaLog::log("VMM", log_type(result[0]), info.c_str());
            }

            return;
        }
    }
    else
    {
        return;
    }

    // -------------------------------------------------------------------------
    // VMM actions not associated to a single VM: UPDATESG
    // -------------------------------------------------------------------------
    if ( action == "UPDATESG" )
    {
        int sgid;

        is >> sgid >> ws;

        if ( is.fail() )
        {
            NebulaLog::log("VMM", Log::ERROR, "Missing or wrong security group"
                    " id in driver message");
            return;
        }

        SecurityGroupPool* sgpool = ne.get_secgrouppool();
        SecurityGroup*     sg     = sgpool->get(sgid, true);

        if ( sg != 0 )
        {
            sg->del_updating(id);

            if ( result == "SUCCESS" )
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

        vm = vmpool->get(id,true);

        if ( vm != 0 )
        {
            if ( result == "SUCCESS" )
            {
                vm->log("VMM", Log::INFO, "VM security group updated.");
            }
            else
            {
                log_error(vm, os, is, "Error updating security groups.");

                vmpool->update(vm);
            }

            vm->unlock();
        }

        lcm->trigger(LifeCycleManager::UPDATESG, sgid);
        return;
    }

    // -------------------------------------------------------------------------
    // VMM actions associated to a single VM
    // -------------------------------------------------------------------------
    vm = vmpool->get(id,true);

    if ( vm == 0 )
    {
        return;
    }

    if ( vm->get_lcm_state() == VirtualMachine::LCM_INIT )
    {
        os.str("");
        os << "Ignored: " << message;
        vm->log("VMM",Log::WARNING,os);

        vm->unlock();
        return;
    }

    if ( action == "DEPLOY" )
    {
        LifeCycleManager::Actions action = LifeCycleManager::DEPLOY_SUCCESS;

        if (result == "SUCCESS")
        {
            string deploy_id;

            is >> deploy_id;

            if ( !deploy_id.empty() )
            {
                vm->set_deploy_id(deploy_id);
            }
            else
            {
                action = LifeCycleManager::DEPLOY_FAILURE;
                log_error(vm,os,is,"Empty deploy ID for virtual machine");
            }
        }
        else
        {
            action = LifeCycleManager::DEPLOY_FAILURE;
            log_error(vm,os,is,"Error deploying virtual machine");
        }

        vmpool->update(vm);

        lcm->trigger(action, id);
    }
    else if (action == "SHUTDOWN" )
    {
        if (result == "SUCCESS")
        {
            lcm->trigger(LifeCycleManager::SHUTDOWN_SUCCESS, id);
        }
        else
        {
            log_error(vm,os,is,"Error shutting down VM");
            vmpool->update(vm);

            lcm->trigger(LifeCycleManager::SHUTDOWN_FAILURE, id);
        }
    }
    else if ( action == "CANCEL" )
    {
        if (result == "SUCCESS")
        {
            lcm->trigger(LifeCycleManager::CANCEL_SUCCESS, id);
        }
        else
        {
            log_error(vm,os,is,"Error canceling VM");
            vmpool->update(vm);

            lcm->trigger(LifeCycleManager::CANCEL_FAILURE, id);
        }
    }
    else if ( action == "SAVE" )
    {
        if (result == "SUCCESS")
        {
            lcm->trigger(LifeCycleManager::SAVE_SUCCESS, id);
        }
        else
        {
            log_error(vm,os,is,"Error saving VM state");
            vmpool->update(vm);

            lcm->trigger(LifeCycleManager::SAVE_FAILURE, id);
        }
    }
    else if ( action == "RESTORE" )
    {
        if (result == "SUCCESS")
        {
            lcm->trigger(LifeCycleManager::DEPLOY_SUCCESS, id);
        }
        else
        {
            log_error(vm,os,is,"Error restoring VM");
            vmpool->update(vm);

            lcm->trigger(LifeCycleManager::DEPLOY_FAILURE, id);
        }
    }
    else if ( action == "MIGRATE" )
    {
        if (result == "SUCCESS")
        {
            lcm->trigger(LifeCycleManager::DEPLOY_SUCCESS, id);
        }
        else
        {
            log_error(vm, os, is, "Error live migrating VM");
            vmpool->update(vm);

            lcm->trigger(LifeCycleManager::DEPLOY_FAILURE, id);
        }
    }
    else if ( action == "REBOOT" )
    {
        if (result == "SUCCESS")
        {
            vm->log("VMM",Log::INFO,"VM successfully rebooted.");
        }
        else
        {
            log_error(vm,os,is,"Error rebooting VM, assume it's still running");
            vmpool->update(vm);
        }
    }
    else if ( action == "RESET" )
    {
        if (result == "SUCCESS")
        {
            vm->log("VMM",Log::INFO,"VM successfully rebooted-hard.");
        }
        else
        {
            log_error(vm,os,is,"Error rebooting-hard VM, assume it's still running");
            vmpool->update(vm);
        }
    }
    else if ( action == "ATTACHDISK" )
    {
        if ( result == "SUCCESS" )
        {
            vm->log("VMM", Log::INFO, "VM Disk successfully attached.");

            lcm->trigger(LifeCycleManager::ATTACH_SUCCESS, id);
        }
        else
        {
            log_error(vm, os, is, "Error attaching new VM Disk");
            vmpool->update(vm);

            lcm->trigger(LifeCycleManager::ATTACH_FAILURE, id);
        }
    }
    else if ( action == "DETACHDISK" )
    {
        if ( result == "SUCCESS" )
        {
            vm->log("VMM",Log::INFO,"VM Disk successfully detached.");

            lcm->trigger(LifeCycleManager::DETACH_SUCCESS, id);
        }
        else
        {
            log_error(vm,os,is,"Error detaching VM Disk");
            vmpool->update(vm);

            lcm->trigger(LifeCycleManager::DETACH_FAILURE, id);
        }
    }
    else if ( action == "ATTACHNIC" )
    {
        if ( result == "SUCCESS" )
        {
            vm->log("VMM", Log::INFO, "VM NIC Successfully attached.");

            lcm->trigger(LifeCycleManager::ATTACH_NIC_SUCCESS, id);
        }
        else
        {
            log_error(vm, os, is, "Error attaching new VM NIC");
            vmpool->update(vm);

            lcm->trigger(LifeCycleManager::ATTACH_NIC_FAILURE, id);
        }
    }
    else if ( action == "DETACHNIC" )
    {
        if ( result == "SUCCESS" )
        {
            vm->log("VMM",Log::INFO, "VM NIC Successfully detached.");

            lcm->trigger(LifeCycleManager::DETACH_NIC_SUCCESS, id);
        }
        else
        {
            log_error(vm,os,is,"Error detaching VM NIC");
            vmpool->update(vm);

            lcm->trigger(LifeCycleManager::DETACH_NIC_FAILURE, id);
        }
    }
    else if ( action == "SNAPSHOTCREATE" )
    {
        if ( result == "SUCCESS" )
        {
            string hypervisor_id;

            is >> hypervisor_id;

            vm->update_snapshot_id(hypervisor_id);

            vmpool->update(vm);

            vm->log("VMM", Log::INFO, "VM Snapshot successfully created.");

            lcm->trigger(LifeCycleManager::SNAPSHOT_CREATE_SUCCESS, id);
        }
        else
        {
            log_error(vm, os, is, "Error creating new VM Snapshot");
            vmpool->update(vm);

            lcm->trigger(LifeCycleManager::SNAPSHOT_CREATE_FAILURE, id);
        }
    }
    else if ( action == "SNAPSHOTREVERT" )
    {
        if ( result == "SUCCESS" )
        {
            vm->log("VMM",Log::INFO,"VM Snapshot successfully reverted.");

            lcm->trigger(LifeCycleManager::SNAPSHOT_REVERT_SUCCESS, id);
        }
        else
        {
            log_error(vm,os,is,"Error reverting VM Snapshot");
            vmpool->update(vm);

            lcm->trigger(LifeCycleManager::SNAPSHOT_REVERT_FAILURE, id);
        }
    }
    else if ( action == "SNAPSHOTDELETE" )
    {
        if ( result == "SUCCESS" )
        {
            vm->log("VMM",Log::INFO,"VM Snapshot successfully deleted.");

            lcm->trigger(LifeCycleManager::SNAPSHOT_DELETE_SUCCESS, id);
        }
        else
        {
            log_error(vm,os,is,"Error deleting VM Snapshot");
            vmpool->update(vm);

            lcm->trigger(LifeCycleManager::SNAPSHOT_DELETE_FAILURE, id);
        }
    }
    else if ( action == "DISKSNAPSHOTCREATE" )
    {
        if ( result == "SUCCESS" )
        {
            vm->log("VMM", Log::INFO, "VM disk snapshot successfully created.");

            lcm->trigger(LifeCycleManager::DISK_SNAPSHOT_SUCCESS, id);
        }
        else
        {
            log_error(vm, os, is, "Error creating new disk snapshot");
            vmpool->update(vm);

            lcm->trigger(LifeCycleManager::DISK_SNAPSHOT_FAILURE, id);
        }
    }
    else if ( action == "DISKSNAPSHOTREVERT" )
    {
        if ( result == "SUCCESS" )
        {
            vm->log("VMM", Log::INFO, "VM disk state reverted.");

            lcm->trigger(LifeCycleManager::DISK_SNAPSHOT_SUCCESS, id);
        }
        else
        {
            log_error(vm, os, is, "Error reverting disk snapshot");
            vmpool->update(vm);

            lcm->trigger(LifeCycleManager::DISK_SNAPSHOT_FAILURE, id);
        }
    }
    else if ( action == "CLEANUP" )
    {
        if ( result == "SUCCESS" )
        {
            vm->log("VMM", Log::INFO, "Host successfully cleaned.");

            lcm->trigger(LifeCycleManager::CLEANUP_SUCCESS, id);
        }
        else
        {
            log_error(vm, os, is, "Error cleaning Host");
            vmpool->update(vm);

            lcm->trigger(LifeCycleManager::CLEANUP_FAILURE, id);
        }
    }
    else if ( action == "POLL" )
    {
        if (result == "SUCCESS")
        {
            string monitor_str;
            getline(is, monitor_str);

            process_poll(vm, monitor_str);
        }
        else
        {
            log_monitor_error(vm, os, is, "Error monitoring VM");

            lcm->trigger(LifeCycleManager::MONITOR_DONE, vm->get_oid());
        }
    }
    else if (action == "LOG")
    {
        string info;

        getline(is,info);
        vm->log("VMM",log_type(result[0]),info.c_str());
    }

    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManagerDriver::process_poll(
        int id,
        const string &monitor_str)
{
    // Get the VM from the pool
    VirtualMachine* vm = Nebula::instance().get_vmpool()->get(id,true);

    if ( vm == 0 )
    {
        return;
    }

    process_poll(vm, monitor_str);

    vm->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManagerDriver::process_poll(
        VirtualMachine* vm,
        const string&   monitor_str)
{
    char state;

    Nebula &ne = Nebula::instance();

    LifeCycleManager* lcm      = ne.get_lcm();
    VirtualMachinePool* vmpool = ne.get_vmpool();

    /* ---------------------------------------------------------------------- */
    /* Update VM info only for VMs in ACTIVE                                  */
    /* ---------------------------------------------------------------------- */

    if (vm->get_state() == VirtualMachine::ACTIVE)
    {
        if (vm->update_info(monitor_str) == 0)
        {
            vmpool->update_history(vm);

            vmpool->update_monitoring(vm);
        }

        vmpool->update(vm);

        VirtualMachineMonitorInfo &minfo = vm->get_info();

        state = minfo.remove_state();
    }
    else
    {
        VirtualMachineMonitorInfo minfo;
        string error;

        if (minfo.update(monitor_str, error) != 0)
        {
            ostringstream oss;

            oss << "Ignoring monitoring information, error:" << error
                << ". Monitor information was: " << monitor_str;

            NebulaLog::log("VMM", Log::ERROR, oss);

            return;
        };

        state = minfo.remove_state();
    }

    /* ---------------------------------------------------------------------- */
    /* Process the VM state from the monitoring info                          */
    /* ---------------------------------------------------------------------- */

    switch (state)
    {
        case 'a': // Active

            if ( vm->get_state() == VirtualMachine::POWEROFF ||
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
                lcm->trigger(LifeCycleManager::MONITOR_POWERON, vm->get_oid());
            }

            break;

        case 'p': // It's paused
            if ( vm->get_state() == VirtualMachine::ACTIVE &&
                ( vm->get_lcm_state() == VirtualMachine::RUNNING ||
                  vm->get_lcm_state() == VirtualMachine::UNKNOWN ))
            {
                vm->log("VMM",Log::INFO, "VM running but monitor state is PAUSED.");

                lcm->trigger(LifeCycleManager::MONITOR_SUSPEND, vm->get_oid());
            }
            break;

        case 'e': //Failed
            if ( vm->get_state() == VirtualMachine::ACTIVE &&
                 vm->get_lcm_state() == VirtualMachine::RUNNING )
            {
                vm->log("VMM",Log::INFO,"VM running but monitor state is ERROR.");

                lcm->trigger(LifeCycleManager::MONITOR_DONE, vm->get_oid());
            }
            break;

        case 'd': //The VM was powered-off
            if ( vm->get_state() == VirtualMachine::ACTIVE &&
                ( vm->get_lcm_state() == VirtualMachine::RUNNING ||
                  vm->get_lcm_state() == VirtualMachine::SHUTDOWN ||
                  vm->get_lcm_state() == VirtualMachine::SHUTDOWN_POWEROFF ||
                  vm->get_lcm_state() == VirtualMachine::SHUTDOWN_UNDEPLOY ))
            {
                lcm->trigger(LifeCycleManager::MONITOR_POWEROFF, vm->get_oid());
            }
            break;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManagerDriver::recover()
{
    NebulaLog::log("VMM",Log::INFO,"Recovering VMM drivers");
}
