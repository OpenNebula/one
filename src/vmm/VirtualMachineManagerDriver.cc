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

VirtualMachineManagerDriver::VirtualMachineManagerDriver(
    int                         userid,
    const map<string,string>&   attrs,
    bool                        sudo,
    VirtualMachinePool *        pool):
        Mad(userid,attrs,sudo), driver_conf(true), imported_vm_actions(0),
	 	vmpool(pool)
{
    map<string,string>::const_iterator  it;
    char *          error_msg = 0;
    const char *    cfile;
    string          file;
    int             rc;

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
        vector<string> actions;
        vector<string>::iterator vit;

		string action;
		History::VMAction id;

        actions = one_util::split(it->second, ',');

        for (vit = actions.begin() ; vit != actions.end() ; ++vit)
        {
        	action = one_util::trim(*vit);

			if ( History::action_from_str(action, id) != 0 )
			{
				NebulaLog::log("VMM", Log::ERROR, "Wrong action: " + action);
				continue;
			}

			imported_vm_actions += 1 << static_cast<int>(id);
        }
    }
    else
    {
		NebulaLog::log("VMM", Log::INFO, "Using default imported VMs actions");

		it = attrs.find("NAME");

		if (it != attrs.end())
		{
			if ( it->second == "kvm" )
			{
				imported_vm_actions = 132623768;
			}
			else if ( it->second == "xen3" )
			{
				imported_vm_actions = 132623768;
			}
			else if ( it->second == "xen" )
			{
				imported_vm_actions = 132623768;
			}
			else if ( it->second == "vmware" )
			{
				imported_vm_actions = 132623768;
			}
			else if ( it->second == "vcenter" )
			{
				imported_vm_actions = 134196632;
			}
			else if ( it->second == "ec2" )
			{
				imported_vm_actions = 134196632;
			}
			else if ( it->second == "az" )
			{
				imported_vm_actions = 134196632;
			}
			else if ( it->second == "sl" )
			{
				imported_vm_actions = 134196632;
			}
		}
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineManagerDriver::get_default(
    const char *  name,
    const char *  vname,
    string&       value) const
{
    vector<const Attribute *>   attrs;
    string                      sn = name;

    if ( driver_conf.get(sn,attrs) == 1 )
    {
        const VectorAttribute * vattr;

        vattr = static_cast<const VectorAttribute *>(attrs[0]);

        value = vattr->vector_value(vname);
    }
    else
    {
        value = "";
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool VirtualMachineManagerDriver::get_default(
    const char *  name,
    const char *  vname,
    bool&         value) const
{
    string st;

    get_default(name, vname, st);

    if ( st == "" )
    {
        value = false;
        return false;
    }

    one_util::toupper(st);

    value = ( st == "YES" );

    return true;
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


    os << "Message received: " << message;
    NebulaLog::log("VMM", Log::DEBUG, os);

    // Parse the driver message
    if ( is.good() )
        is >> action >> ws;
    else
        return;

    if ( is.good() )
        is >> result >> ws;
    else
        return;

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
        return;

    // Get the VM from the pool
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

    // Driver Actions
    if ( action == "DEPLOY" )
    {
        Nebula              &ne = Nebula::instance();
        LifeCycleManager *  lcm = ne.get_lcm();

        if (result == "SUCCESS")
        {
            string deploy_id;

            is >> deploy_id;

            vm->set_deploy_id(deploy_id);

            vmpool->update(vm);

            lcm->trigger(LifeCycleManager::DEPLOY_SUCCESS, id);
        }
        else
        {
            log_error(vm,os,is,"Error deploying virtual machine");
            vmpool->update(vm);

            lcm->trigger(LifeCycleManager::DEPLOY_FAILURE, id);
        }
    }
    else if (action == "SHUTDOWN" )
    {
        Nebula              &ne  = Nebula::instance();
        LifeCycleManager    *lcm = ne.get_lcm();

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
        Nebula              &ne  = Nebula::instance();
        LifeCycleManager    *lcm = ne.get_lcm();

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
        Nebula              &ne  = Nebula::instance();
        LifeCycleManager    *lcm = ne.get_lcm();

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
        Nebula              &ne  = Nebula::instance();
        LifeCycleManager    *lcm = ne.get_lcm();

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
        Nebula              &ne  = Nebula::instance();
        LifeCycleManager    *lcm = ne.get_lcm();

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
        Nebula           &ne  = Nebula::instance();
        LifeCycleManager *lcm = ne.get_lcm();

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
        Nebula              &ne  = Nebula::instance();
        LifeCycleManager    *lcm = ne.get_lcm();

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
        Nebula           &ne  = Nebula::instance();
        LifeCycleManager *lcm = ne.get_lcm();

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
        Nebula              &ne  = Nebula::instance();
        LifeCycleManager    *lcm = ne.get_lcm();

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
        Nebula           &ne  = Nebula::instance();
        LifeCycleManager *lcm = ne.get_lcm();

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
        Nebula              &ne  = Nebula::instance();
        LifeCycleManager    *lcm = ne.get_lcm();

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
        Nebula              &ne  = Nebula::instance();
        LifeCycleManager    *lcm = ne.get_lcm();

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
        Nebula           &ne  = Nebula::instance();
        LifeCycleManager *lcm = ne.get_lcm();

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
        Nebula           &ne  = Nebula::instance();
        LifeCycleManager *lcm = ne.get_lcm();

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
        Nebula           &ne  = Nebula::instance();
        LifeCycleManager *lcm = ne.get_lcm();

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
            Nebula            &ne = Nebula::instance();
            LifeCycleManager* lcm = ne.get_lcm();

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
