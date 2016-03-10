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

#include "DispatchManager.h"
#include "NebulaLog.h"

#include "VirtualMachineManager.h"
#include "TransferManager.h"
#include "ImageManager.h"
#include "Quotas.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::deploy (
    VirtualMachine *    vm)
{
    ostringstream oss;
    int           vid;

    if ( vm == 0 )
    {
        return -1;
    }

    vid = vm->get_oid();

    oss << "Deploying VM " << vid;
    NebulaLog::log("DiM",Log::DEBUG,oss);

    if ( vm->get_state() == VirtualMachine::PENDING ||
         vm->get_state() == VirtualMachine::HOLD ||
         vm->get_state() == VirtualMachine::STOPPED ||
         vm->get_state() == VirtualMachine::UNDEPLOYED )
    {
        vm->set_state(VirtualMachine::ACTIVE);

        vmpool->update(vm);

        lcm->trigger(LifeCycleManager::DEPLOY,vid);
    }
    else
    {
        goto error;
    }

    vm->unlock();

    return 0;

error:

    oss.str("");
    oss << "Could not deploy VM " << vid << ", wrong state.";
    NebulaLog::log("DiM",Log::ERROR,oss);

    vm->unlock();
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::import (
    VirtualMachine *    vm)
{
    ostringstream oss;

    if ( vm == 0 )
    {
        return -1;
    }

    if ( vm->get_state() != VirtualMachine::PENDING &&
         vm->get_state() != VirtualMachine::HOLD )
    {
        return -1;
    }

    time_t the_time = time(0);
    int    cpu, mem, disk;
    vector<VectorAttribute *> pci;

    vm->get_requirements(cpu, mem, disk, pci);

    hpool->add_capacity(vm->get_hid(), vm->get_oid(), cpu, mem, disk, pci);

    vm->set_state(VirtualMachine::ACTIVE);

    vm->set_state(VirtualMachine::RUNNING);

    vmpool->update(vm);

    vm->set_stime(the_time);

    vm->set_prolog_stime(the_time);
    vm->set_prolog_etime(the_time);

    vm->set_running_stime(the_time);

    vm->set_last_poll(0);

    vmpool->update_history(vm);

    vm->unlock();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::migrate(
    VirtualMachine *    vm)
{
    ostringstream oss;
    int           vid;

    if ( vm == 0 )
    {
        return -1;
    }

    vid = vm->get_oid();

    oss << "Migrating VM " << vid;
    NebulaLog::log("DiM",Log::DEBUG,oss);

    if ((vm->get_state()     == VirtualMachine::ACTIVE &&
         (vm->get_lcm_state() == VirtualMachine::RUNNING ||
          vm->get_lcm_state() == VirtualMachine::UNKNOWN )) ||
         vm->get_state() == VirtualMachine::POWEROFF ||
         vm->get_state() == VirtualMachine::SUSPENDED)
    {
        lcm->trigger(LifeCycleManager::MIGRATE,vid);
    }
    else
    {
        goto error;
    }

    vm->unlock();

    return 0;

error:
    oss.str("");
    oss << "Could not migrate VM " << vid << ", wrong state.";
    NebulaLog::log("DiM",Log::ERROR,oss);

    vm->unlock();
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::live_migrate(
    VirtualMachine *    vm)
{
    ostringstream oss;
    int           vid;

    if ( vm == 0 )
    {
        return -1;
    }

    vid = vm->get_oid();

    oss << "Live-migrating VM " << vid;
    NebulaLog::log("DiM",Log::DEBUG,oss);

    if (vm->get_state()     == VirtualMachine::ACTIVE &&
        vm->get_lcm_state() == VirtualMachine::RUNNING )
    {
        lcm->trigger(LifeCycleManager::LIVE_MIGRATE,vid);
    }
    else
    {
        goto error;
    }

    vm->unlock();

    return 0;

error:
    oss.str("");
    oss << "Could not live-migrate VM " << vid << ", wrong state.";
    NebulaLog::log("DiM",Log::ERROR,oss);

    vm->unlock();
    return -1;
}

/* ************************************************************************** */
/* ************************************************************************** */

int DispatchManager::shutdown (
        int     vid,
        bool    hard,
        string& error_str)
{
    ostringstream oss;

    VirtualMachine * vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return -1;
    }

    oss << "Shutting down VM " << vid;
    NebulaLog::log("DiM",Log::DEBUG,oss);

    if (vm->get_state()     == VirtualMachine::POWEROFF ||
        vm->get_state()     == VirtualMachine::SUSPENDED ||
       (vm->get_state()     == VirtualMachine::ACTIVE &&
        (vm->get_lcm_state() == VirtualMachine::RUNNING ||
         vm->get_lcm_state() == VirtualMachine::UNKNOWN)))
    {
        if (hard)
        {
            lcm->trigger(LifeCycleManager::CANCEL,vid);
        }
        else
        {
            lcm->trigger(LifeCycleManager::SHUTDOWN,vid);
        }
    }
    else
    {
        goto error;
    }

    vm->unlock();

    return 0;

error:
    oss.str("");
    oss << "Could not shutdown VM " << vid << ", wrong state.";
    NebulaLog::log("DiM",Log::ERROR,oss);

    oss.str("");
    oss << "This action is not available for state " << vm->state_str();
    error_str = oss.str();

    vm->unlock();
    return -2;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::undeploy(
    int     vid,
    bool    hard,
    string& error_str)
{
    ostringstream oss;

    VirtualMachine * vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return -1;
    }

    oss << "Undeploying VM " << vid;
    NebulaLog::log("DiM",Log::DEBUG,oss);

    if ( vm->get_state()       == VirtualMachine::POWEROFF ||
         (vm->get_state()       == VirtualMachine::ACTIVE &&
           (vm->get_lcm_state() == VirtualMachine::RUNNING ||
            vm->get_lcm_state() == VirtualMachine::UNKNOWN)))
    {
        if (hard)
        {
            lcm->trigger(LifeCycleManager::UNDEPLOY_HARD,vid);
        }
        else
        {
            lcm->trigger(LifeCycleManager::UNDEPLOY,vid);
        }
    }
    else
    {
        goto error;
    }

    vm->unlock();

    return 0;

error:
    oss.str("");
    oss << "Could not undeploy VM " << vid << ", wrong state.";
    NebulaLog::log("DiM",Log::ERROR,oss);

    oss.str("");
    oss << "This action is not available for state " << vm->state_str();
    error_str = oss.str();

    vm->unlock();
    return -2;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::poweroff (
    int     vid,
    bool    hard,
    string& error_str)
{
    ostringstream oss;

    VirtualMachine * vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return -1;
    }

    oss << "Powering off VM " << vid;
    NebulaLog::log("DiM",Log::DEBUG,oss);

    if (vm->get_state()     == VirtualMachine::ACTIVE &&
        (vm->get_lcm_state() == VirtualMachine::RUNNING ||
         vm->get_lcm_state() == VirtualMachine::UNKNOWN))
    {
        if (hard)
        {
            lcm->trigger(LifeCycleManager::POWEROFF_HARD,vid);
        }
        else
        {
            lcm->trigger(LifeCycleManager::POWEROFF,vid);
        }
    }
    else
    {
        goto error;
    }

    vm->unlock();

    return 0;

error:

    oss.str("");
    oss << "Could not power off VM " << vid << ", wrong state.";
    NebulaLog::log("DiM",Log::ERROR,oss);

    oss.str("");
    oss << "This action is not available for state " << vm->state_str();
    error_str = oss.str();

    vm->unlock();
    return -2;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::hold(
    int     vid,
    string& error_str)
{
    ostringstream oss;

    VirtualMachine * vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return -1;
    }

    oss << "Holding VM " << vid;
    NebulaLog::log("DiM",Log::DEBUG,oss);

    if (vm->get_state() == VirtualMachine::PENDING)
    {
        vm->set_state(VirtualMachine::HOLD);

        vmpool->update(vm);
    }
    else
    {
        goto error;
    }

    vm->unlock();

    return 0;

error:

    oss.str("");
    oss << "Could not hold VM " << vid << ", wrong state.";
    NebulaLog::log("DiM",Log::ERROR,oss);

    oss.str("");
    oss << "This action is not available for state " << vm->state_str();
    error_str = oss.str();

    vm->unlock();
    return -2;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::release(
    int     vid,
    string& error_str)
{
    ostringstream oss;

    VirtualMachine * vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return -1;
    }

    oss << "Releasing VM " << vid;
    NebulaLog::log("DiM",Log::DEBUG,oss);

    if (vm->get_state() == VirtualMachine::HOLD)
    {
        vm->set_state(VirtualMachine::PENDING);

        vmpool->update(vm);
    }
    else
    {
        goto error;
    }

    vm->unlock();

    return 0;

error:
    oss.str("");
    oss << "Could not release VM " << vid << ", wrong state.";
    NebulaLog::log("DiM",Log::ERROR,oss);

    oss.str("");
    oss << "This action is not available for state " << vm->state_str();
    error_str = oss.str();

    vm->unlock();
    return -2;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::stop(
    int     vid,
    string& error_str)
{
    ostringstream oss;

    VirtualMachine * vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return -1;
    }

    oss << "Stopping VM " << vid;
    NebulaLog::log("DiM",Log::DEBUG,oss);

    if (vm->get_state()        == VirtualMachine::SUSPENDED ||
        (vm->get_state()       == VirtualMachine::ACTIVE &&
         vm->get_lcm_state() == VirtualMachine::RUNNING ))
    {
        lcm->trigger(LifeCycleManager::STOP,vid);
    }
    else
    {
        goto error;
    }

    vm->unlock();

    return 0;

error:
    oss.str("");
    oss << "Could not stop VM " << vid << ", wrong state.";
    NebulaLog::log("DiM",Log::ERROR,oss);

    oss.str("");
    oss << "This action is not available for state " << vm->state_str();
    error_str = oss.str();

    vm->unlock();
    return -2;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::suspend(
    int     vid,
    string& error_str)
{
    ostringstream oss;

    VirtualMachine * vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return -1;
    }

    oss << "Suspending VM " << vid;
    NebulaLog::log("DiM",Log::DEBUG,oss);

    if (vm->get_state()     == VirtualMachine::ACTIVE &&
        vm->get_lcm_state() == VirtualMachine::RUNNING )
    {
        lcm->trigger(LifeCycleManager::SUSPEND,vid);
    }
    else
    {
        goto error;
    }

    vm->unlock();

    return 0;

error:
    oss.str("");
    oss << "Could not suspend VM " << vid << ", wrong state.";
    NebulaLog::log("DiM",Log::ERROR,oss);

    oss.str("");
    oss << "This action is not available for state " << vm->state_str();
    error_str = oss.str();

    vm->unlock();
    return -2;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::resume(
    int     vid,
    string& error_str)
{
    ostringstream oss;

    VirtualMachine * vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return -1;
    }

    oss << "Resuming VM " << vid;
    NebulaLog::log("DiM",Log::DEBUG,oss);

    if (vm->get_state() == VirtualMachine::STOPPED ||
        vm->get_state() == VirtualMachine::UNDEPLOYED )
    {
        vm->set_state(VirtualMachine::PENDING);

        vmpool->update(vm);
    }
    else if (vm->get_state() == VirtualMachine::SUSPENDED)
    {
        lcm->trigger(LifeCycleManager::RESTORE,vid);
    }
    else if ( vm->get_state() == VirtualMachine::POWEROFF ||
             (vm->get_state() == VirtualMachine::ACTIVE &&
              vm->get_lcm_state() == VirtualMachine::UNKNOWN))
    {
        lcm->trigger(LifeCycleManager::RESTART,vid);
    }
    else
    {
        goto error;
    }

    vm->unlock();

    return 0;

error:
    oss.str("");
    oss << "Could not resume VM " << vid << ", wrong state.";
    NebulaLog::log("DiM",Log::ERROR,oss);

    oss.str("");
    oss << "This action is not available for state " << vm->state_str();
    error_str = oss.str();

    vm->unlock();
    return -2;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::reboot(
    int     vid,
    bool    hard,
    string& error_str)
{
    ostringstream oss;

    VirtualMachine * vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return -1;
    }

    oss << "Rebooting VM " << vid;
    NebulaLog::log("DiM",Log::DEBUG,oss);

    if (vm->get_state()     == VirtualMachine::ACTIVE &&
        vm->get_lcm_state() == VirtualMachine::RUNNING )
    {
        if (hard)
        {
            vmm->trigger(VirtualMachineManager::RESET,vid);
        }
        else
        {
            vmm->trigger(VirtualMachineManager::REBOOT,vid);
        }

        vm->set_resched(false); //Rebooting cancels re-scheduling actions

        vmpool->update(vm);
    }
    else
    {
        goto error;
    }

    vm->unlock();

    return 0;

error:
    oss.str("");
    oss << "Could not reboot VM " << vid << ", wrong state.";
    NebulaLog::log("DiM",Log::ERROR,oss);

    oss.str("");
    oss << "This action is not available for state " << vm->state_str();
    error_str = oss.str();

    vm->unlock();

    return -2;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::resched(
    int     vid,
    bool    do_resched,
    string& error_str)
{
    ostringstream oss;

    VirtualMachine * vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return -1;
    }

    oss << "Setting rescheduling flag on VM " << vid;
    NebulaLog::log("DiM",Log::DEBUG,oss);

    if (vm->get_state()     == VirtualMachine::ACTIVE &&
        (vm->get_lcm_state() == VirtualMachine::RUNNING ||
         vm->get_lcm_state() == VirtualMachine::UNKNOWN))
    {
        vm->set_resched(do_resched);
        vmpool->update(vm);
    }
    else
    {
        goto error;
    }

    vm->unlock();

    return 0;

error:
    oss.str("");
    oss << "Could not set rescheduling flag for VM " << vid << ", wrong state.";
    NebulaLog::log("DiM",Log::ERROR,oss);

    oss.str("");
    oss << "This action is not available for state " << vm->state_str();
    error_str = oss.str();

    vm->unlock();

    return -2;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void DispatchManager::finalize_cleanup(VirtualMachine * vm)
{
    Template *    tmpl;

    int uid;
    int gid;

    vm->release_network_leases();
    vm->release_disk_images();

    vm->set_exit_time(time(0));

    vm->set_state(VirtualMachine::LCM_INIT);
    vm->set_state(VirtualMachine::DONE);
    vmpool->update(vm);

    uid  = vm->get_uid();
    gid  = vm->get_gid();
    tmpl = vm->clone_template();

    vm->unlock();

    Quotas::vm_del(uid, gid, tmpl);

    delete tmpl;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::finalize(
    int     vid,
    string& error_str)
{
    VirtualMachine * vm;
    Host * host;
    ostringstream oss;

    vector<VectorAttribute *> pci;

    VirtualMachine::VmState state;
    bool is_public_host = false;
    int  host_id = -1;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return -1;
    }

    if(vm->hasHistory())
    {
        host_id = vm->get_hid();
    }

    vm->unlock();

    if(host_id != -1)
    {
        host = hpool->get(host_id,true);

        if ( host == 0 )
        {
            oss << "Error getting host " << host_id;
            error_str = oss.str();

            return -1;
        }

        is_public_host = host->is_public_cloud();

        host->unlock();
    }

    vm = vmpool->get(vid,true);

    state = vm->get_state();

    oss << "Finalizing VM " << vid;
    NebulaLog::log("DiM",Log::DEBUG,oss);

    switch (state)
    {
        case VirtualMachine::SUSPENDED:
        case VirtualMachine::POWEROFF:
            int cpu, mem, disk;

            vm->get_requirements(cpu, mem, disk, pci);
            hpool->del_capacity(vm->get_hid(),vm->get_oid(),cpu,mem,disk,pci);

            if (is_public_host)
            {
                vmm->trigger(VirtualMachineManager::CLEANUP,vid);
            }
            else
            {
                tm->trigger(TransferManager::EPILOG_DELETE,vid);
            }

            finalize_cleanup(vm);
        break;

        case VirtualMachine::STOPPED:
        case VirtualMachine::UNDEPLOYED:
            if (is_public_host)
            {
                vmm->trigger(VirtualMachineManager::CLEANUP,vid);
            }
            else
            {
                tm->trigger(TransferManager::EPILOG_DELETE,vid);
            }

            finalize_cleanup(vm);
        break;

        case VirtualMachine::INIT:
        case VirtualMachine::PENDING:
        case VirtualMachine::HOLD:
            finalize_cleanup(vm);
        break;

        case VirtualMachine::ACTIVE:
            lcm->trigger(LifeCycleManager::DELETE,vid);
            vm->unlock();
        break;

        case VirtualMachine::DONE:
            vm->unlock();
        break;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::resubmit(
    int     vid,
    string& error_str)
{
    VirtualMachine * vm;
    ostringstream    oss;
    int              rc = 0;

    Template *           vm_quotas = 0;
    map<int, Template *> ds_quotas;

    int vm_uid, vm_gid;

    vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return -1;
    }

    switch (vm->get_state())
    {
        case VirtualMachine::POWEROFF:
            error_str = "Cannot delete-recreate a powered off VM. Resume it first";
            NebulaLog::log("DiM",Log::ERROR,error_str);
            rc = -2;
        break;

        case VirtualMachine::SUSPENDED:
            error_str = "Cannot delete-recreate a suspended VM. Resume it first";
            NebulaLog::log("DiM",Log::ERROR,error_str);
            rc = -2;
        break;

        case VirtualMachine::INIT:
        case VirtualMachine::PENDING:
        break;

        case VirtualMachine::STOPPED:
        case VirtualMachine::UNDEPLOYED:
            vm_uid = vm->get_uid();
            vm_gid = vm->get_gid();

            vm->delete_non_persistent_disk_snapshots(&vm_quotas, ds_quotas);

        case VirtualMachine::HOLD:
            if (vm->hasHistory())
            {
                vm->set_action(History::DELETE_RECREATE_ACTION);
                vmpool->update_history(vm);
            }

            vm->set_state(VirtualMachine::LCM_INIT);
            vm->set_state(VirtualMachine::PENDING);

            vmpool->update(vm);
        break;

        case VirtualMachine::ACTIVE: //Cleanup VM resources before PENDING
            lcm->trigger(LifeCycleManager::CLEAN, vid);
        break;

        case VirtualMachine::DONE:
            error_str = "Cannot delete-recreate a VM already in DONE state";
            NebulaLog::log("DiM",Log::ERROR,error_str);
            rc = -2;
        break;
    }

    vm->unlock();

    if ( !ds_quotas.empty() )
    {
        Quotas::ds_del(ds_quotas);
    }

    if ( vm_quotas != 0 )
    {
        Quotas::vm_del(vm_uid, vm_gid, vm_quotas);

        delete vm_quotas;
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::attach(int vid,
                            VirtualMachineTemplate * tmpl,
                            string &                 error_str)
{
    ostringstream oss;

    int max_disk_id;
    int uid;
    int oid;
    int image_id;
    int image_cluster_id;

    set<string>       used_targets;
    VectorAttribute * disk;
    Snapshots *       snap;

    VirtualMachine * vm = vmpool->get(vid, true);

    if ( vm == 0 )
    {
        oss << "Could not attach a new disk to VM " << vid
            << ", VM does not exist" ;
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        return -1;
    }

    if ( vm->get_state()     == VirtualMachine::ACTIVE &&
         vm->get_lcm_state() == VirtualMachine::RUNNING )
    {
        vm->set_state(VirtualMachine::HOTPLUG);
    }
    else if ( vm->get_state() == VirtualMachine::POWEROFF )
    {
        vm->set_state(VirtualMachine::ACTIVE);
        vm->set_state(VirtualMachine::HOTPLUG_PROLOG_POWEROFF);
    }
    else
    {
        oss << "Could not attach a new disk to VM " << vid << ", wrong state "
            << vm->state_str() << ".";
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        vm->unlock();
        return -1;
    }

    vm->get_disk_info(max_disk_id, used_targets);

    vm->set_resched(false);

    uid = vm->get_uid();
    oid = vm->get_oid();

    vmpool->update(vm);

    vm->unlock();

    disk = VirtualMachine::set_up_attach_disk(oid,
                                              tmpl,
                                              used_targets,
                                              max_disk_id,
                                              uid,
                                              image_id,
                                              &snap,
                                              error_str);
    vm = vmpool->get(vid, true);

    if ( vm == 0 )
    {
		if ( disk != 0 )
		{
			imagem->release_image(oid, image_id, false);

			delete snap;
			delete disk;
		}

        error_str = "VM does not exist after setting its state to HOTPLUG.";

        NebulaLog::log("DiM", Log::ERROR, error_str);
        return -1;
    }

    if ( disk == 0 )
    {
        if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG )
        {
            vm->set_state(VirtualMachine::RUNNING);
        }
        else
        {
            vm->set_state(VirtualMachine::LCM_INIT);
            vm->set_state(VirtualMachine::POWEROFF);
        }

        vmpool->update(vm);

        vm->unlock();

        NebulaLog::log("DiM", Log::ERROR, error_str);
        return -1;
    }

    // TODO: change to CLUSTER_IDS

    // Check that we don't have a cluster incompatibility.
    if (disk->vector_value("CLUSTER_ID", image_cluster_id) == 0)
    {
      if (vm->get_cid() != image_cluster_id)
      {
          imagem->release_image(oid, image_id, false);

          delete snap;
          delete disk;

          if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG )
          {
              vm->set_state(VirtualMachine::RUNNING);
          }
          else
          {
              vm->set_state(VirtualMachine::LCM_INIT);
              vm->set_state(VirtualMachine::POWEROFF);
          }

          vmpool->update(vm);

          vm->unlock();

          error_str = "Could not attach disk because of cluster incompatibility.";

          NebulaLog::log("DiM", Log::ERROR, error_str);
          return -1;
      }
    }

    // Set the VM info in the history before the disk is attached to the
    // VM template
    vm->set_vm_info();

    vm->set_attach_disk(disk, snap);

    if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG )
    {
        time_t the_time = time(0);

        // Close current history record

        vm->set_running_etime(the_time);

        vm->set_etime(the_time);

        vm->set_action(History::DISK_ATTACH_ACTION);
        vm->set_reason(History::USER);

        vmpool->update_history(vm);

        // Open a new history record

        vm->cp_history();

        vm->set_stime(the_time);

        vm->set_running_stime(the_time);

        vmpool->update_history(vm);

        //-----------------------------------------------

        vmm->trigger(VirtualMachineManager::ATTACH,vid);
    }
    else
    {
        tm->trigger(TransferManager::PROLOG_ATTACH, vid);
    }

    vmpool->update(vm);

    vm->unlock();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::detach(
    int      vid,
    int      disk_id,
    string&  error_str)
{
    ostringstream oss;

    VirtualMachine * vm = vmpool->get(vid, true);

    if ( vm == 0 )
    {
        oss << "VirtualMachine " << vid << " no longer exists";
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);
        return -1;
    }

    if (( vm->get_state()     != VirtualMachine::ACTIVE ||
          vm->get_lcm_state() != VirtualMachine::RUNNING ) &&
        vm->get_state()       != VirtualMachine::POWEROFF)
    {
        oss << "Could not detach disk from VM " << vid << ", wrong state "
            << vm->state_str() << ".";
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        vm->unlock();
        return -1;
    }

    if ( vm->set_attach_disk(disk_id) == -1 )
    {
        oss << "Could not detach disk with DISK_ID " << disk_id
            << ", it does not exist.";
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        vm->unlock();
        return -1;
    }

    vm->set_resched(false);

    if ( vm->get_state() == VirtualMachine::ACTIVE &&
         vm->get_lcm_state() == VirtualMachine::RUNNING )
    {
        time_t the_time = time(0);

        // Close current history record

        vm->set_vm_info();

        vm->set_running_etime(the_time);

        vm->set_etime(the_time);

        vm->set_action(History::DISK_DETACH_ACTION);
        vm->set_reason(History::USER);

        vmpool->update_history(vm);

        // Open a new history record

        vm->cp_history();

        vm->set_stime(the_time);

        vm->set_running_stime(the_time);

        vmpool->update_history(vm);

        //---------------------------------------------------

        vm->set_state(VirtualMachine::HOTPLUG);

        vmm->trigger(VirtualMachineManager::DETACH,vid);
    }
    else
    {
        vm->set_state(VirtualMachine::ACTIVE);
        vm->set_state(VirtualMachine::HOTPLUG_EPILOG_POWEROFF);

        tm->trigger(TransferManager::EPILOG_DETACH, vid);
    }

    vmpool->update(vm);

    vm->unlock();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::snapshot_create(
    int     vid,
    string& name,
    int&    snap_id,
    string& error_str)
{
    ostringstream oss;

    VirtualMachine * vm = vmpool->get(vid, true);

    if ( vm == 0 )
    {
        oss << "Could not create a new snapshot for VM " << vid
            << ", VM does not exist" ;
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        return -1;
    }

    if ( vm->get_state()     != VirtualMachine::ACTIVE ||
         vm->get_lcm_state() != VirtualMachine::RUNNING )
    {
        oss << "Could not create a new snapshot for VM " << vid
            << ", wrong state " << vm->state_str() << ".";
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        vm->unlock();
        return -1;
    }

    vm->set_state(VirtualMachine::HOTPLUG_SNAPSHOT);

    vm->set_resched(false);

    vm->new_snapshot(name, snap_id);

    vmpool->update(vm);

    vm->unlock();

    vmm->trigger(VirtualMachineManager::SNAPSHOT_CREATE,vid);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::snapshot_revert(
    int         vid,
    int         snap_id,
    string&     error_str)
{
    ostringstream oss;

    int rc;

    VirtualMachine * vm = vmpool->get(vid, true);

    if ( vm == 0 )
    {
        oss << "Could not revert VM " << vid << " to snapshot " << snap_id
            << ", VM does not exist" ;
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        return -1;
    }

    if ( vm->get_state()     != VirtualMachine::ACTIVE ||
         vm->get_lcm_state() != VirtualMachine::RUNNING )
    {
        oss << "Could not revert VM " << vid << " to snapshot " << snap_id
            << ", wrong state " << vm->state_str() << ".";
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        vm->unlock();
        return -1;
    }


    rc = vm->set_active_snapshot(snap_id);

    if ( rc == -1 )
    {
        oss << "Could not revert VM " << vid << " to snapshot " << snap_id
            << ", it does not exist.";
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        vm->unlock();
        return -1;
    }

    vm->set_state(VirtualMachine::HOTPLUG_SNAPSHOT);

    vm->set_resched(false);

    vmpool->update(vm);

    vm->unlock();

    vmm->trigger(VirtualMachineManager::SNAPSHOT_REVERT,vid);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::snapshot_delete(
    int         vid,
    int         snap_id,
    string&     error_str)
{
    ostringstream oss;

    int rc;

    VirtualMachine * vm = vmpool->get(vid, true);

    if ( vm == 0 )
    {
        oss << "Could not delete snapshot " << snap_id << " for VM " << vid
            << ", VM does not exist" ;
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        return -1;
    }

    if ( vm->get_state()     != VirtualMachine::ACTIVE ||
         vm->get_lcm_state() != VirtualMachine::RUNNING )
    {
        oss << "Could not delete snapshot " << snap_id << " for VM " << vid
            << ", wrong state " << vm->state_str() << ".";
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        vm->unlock();
        return -1;
    }

    rc = vm->set_active_snapshot(snap_id);

    if ( rc == -1 )
    {
        oss << "Could not delete snapshot " << snap_id << " for VM " << vid
            << ", it does not exist.";
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        vm->unlock();
        return -1;
    }

    vm->set_state(VirtualMachine::HOTPLUG_SNAPSHOT);

    vm->set_resched(false);

    vmpool->update(vm);

    vm->unlock();

    vmm->trigger(VirtualMachineManager::SNAPSHOT_DELETE,vid);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::attach_nic(
        int                     vid,
        VirtualMachineTemplate* tmpl,
        string &                error_str)
{
    ostringstream oss;

    int max_nic_id;
    int uid;
    int oid;
    int rc;
    string tmp_error;

    set<int> vm_sgs;

    VectorAttribute *        nic;
    vector<VectorAttribute*> sg_rules;

    VirtualMachine * vm = vmpool->get(vid, true);

    if ( vm == 0 )
    {
        oss << "Could not add a new NIC to VM " << vid
            << ", VM does not exist" ;
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        return -1;
    }

    if (( vm->get_state()     != VirtualMachine::ACTIVE ||
          vm->get_lcm_state() != VirtualMachine::RUNNING ) &&
        vm->get_state()       != VirtualMachine::POWEROFF )
    {
        oss << "Could not add a new NIC to VM " << vid << ", wrong state "
            << vm->state_str() << ".";
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        vm->unlock();
        return -1;
    }

    nic = vm->get_attach_nic_info(tmpl, max_nic_id, error_str);

    if ( nic == 0 )
    {
        vm->unlock();

        NebulaLog::log("DiM", Log::ERROR, error_str);
        return -1;
    }

    vm->get_security_groups(vm_sgs);

    if (vm->get_state()     == VirtualMachine::ACTIVE &&
        vm->get_lcm_state() == VirtualMachine::RUNNING )
    {
        vm->set_state(VirtualMachine::HOTPLUG_NIC);
    }

    vm->set_resched(false);

    uid  = vm->get_uid();
    oid  = vm->get_oid();

    vmpool->update(vm);

    vm->unlock();

    rc = VirtualMachine::set_up_attach_nic(oid,
                                    vm_sgs,
                                    nic,
                                    sg_rules,
                                    max_nic_id,
                                    uid,
                                    error_str);
    vm = vmpool->get(vid, true);

    if ( vm == 0 )
    {
        if ( rc == 0 )
        {
            VirtualMachine::release_network_leases(nic, vid);

            vector<VectorAttribute*>::iterator it;
            for(it = sg_rules.begin(); it != sg_rules.end(); it++)
            {
                delete *it;
            }
        }

        delete nic;

        oss << "Could not attach a new NIC to VM " << vid
            << ", VM does not exist after setting its state to HOTPLUG." ;
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        return -1;
    }

    if ( rc != 0 )
    {
        delete nic;

        vector<VectorAttribute*>::iterator it;
        for(it = sg_rules.begin(); it != sg_rules.end(); it++)
        {
            delete *it;
        }

        if (vm->get_lcm_state() == VirtualMachine::HOTPLUG_NIC)
        {
            vm->set_state(VirtualMachine::RUNNING);
        }

        vmpool->update(vm);

        vm->unlock();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        return -1;
    }

    // Set the VM info in the history before the nic is attached to the
    // VM template
    vm->set_vm_info();

    vm->set_attach_nic(nic, sg_rules);

    if (vm->get_lcm_state() == VirtualMachine::HOTPLUG_NIC)
    {
        time_t the_time = time(0);

        // Close current history record

        vm->set_running_etime(the_time);

        vm->set_etime(the_time);

        vm->set_action(History::NIC_ATTACH_ACTION);
        vm->set_reason(History::USER);

        vmpool->update_history(vm);

        // Open a new history record

        vm->cp_history();

        vm->set_stime(the_time);

        vm->set_running_stime(the_time);

        vmpool->update_history(vm);

        //-----------------------------------------------

        vmm->trigger(VirtualMachineManager::ATTACH_NIC,vid);
    }
    else
    {
        vm->log("DiM", Log::INFO, "VM NIC Successfully attached.");

        vm->attach_nic_success();
    }

    vmpool->update(vm);

    vm->unlock();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::detach_nic(
    int      vid,
    int      nic_id,
    string&  error_str)
{
    ostringstream oss;
    string        tmp_error;

    VirtualMachine * vm = vmpool->get(vid, true);

    if ( vm == 0 )
    {
        oss << "VirtualMachine " << vid << " no longer exists";
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);
        return -1;
    }

    if (( vm->get_state()     != VirtualMachine::ACTIVE ||
          vm->get_lcm_state() != VirtualMachine::RUNNING ) &&
        vm->get_state()       != VirtualMachine::POWEROFF )
    {
        oss << "Could not detach NIC from VM " << vid << ", wrong state "
            << vm->state_str() << ".";
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        vm->unlock();
        return -1;
    }

    if ( vm->set_detach_nic(nic_id) == -1 )
    {
        oss << "Could not detach NIC with NIC_ID " << nic_id
            << ", it does not exist.";
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        vm->unlock();
        return -1;
    }

    if (vm->get_state()     == VirtualMachine::ACTIVE &&
        vm->get_lcm_state() == VirtualMachine::RUNNING )
    {
        time_t the_time = time(0);

        // Close current history record

        vm->set_vm_info();

        vm->set_running_etime(the_time);

        vm->set_etime(the_time);

        vm->set_action(History::NIC_DETACH_ACTION);
        vm->set_reason(History::USER);

        vmpool->update_history(vm);

        // Open a new history record

        vm->cp_history();

        vm->set_stime(the_time);

        vm->set_running_stime(the_time);

        vmpool->update_history(vm);

        vm->set_state(VirtualMachine::HOTPLUG_NIC);

        vm->set_resched(false);

        vmpool->update(vm);

        vm->unlock();

        //---------------------------------------------------

        vmm->trigger(VirtualMachineManager::DETACH_NIC,vid);
    }
    else
    {
        vmpool->update(vm);

        vm->unlock();

        vmpool->detach_nic_success(vid);

        vm->log("DiM", Log::INFO, "VM NIC Successfully detached.");
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::disk_snapshot_create(
        int           vid,
        int           did,
        const string& name,
        int&          snap_id,
        string&       error_str)
{
    ostringstream oss;
    time_t        the_time;

    VirtualMachine * vm = vmpool->get(vid, true);

    if ( vm == 0 )
    {
        oss << "Could not create a new disk snapshot for VM " << vid
            << ", VM does not exist" ;
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        return -1;
    }

    VirtualMachine::VmState  state  = vm->get_state();
    VirtualMachine::LcmState lstate = vm->get_lcm_state();

    if ((state !=VirtualMachine::POWEROFF || lstate !=VirtualMachine::LCM_INIT)&&
        (state !=VirtualMachine::SUSPENDED|| lstate !=VirtualMachine::LCM_INIT)&&
        (state !=VirtualMachine::ACTIVE   || lstate !=VirtualMachine::RUNNING))
    {
        oss << "Could not create a new snapshot for VM " << vid
            << ", wrong state " << vm->state_str() << ".";
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        vm->unlock();

        return -1;
    }

    // Set the VM info in the history before the snapshot is added to VM
    vm->set_vm_info();

    snap_id = vm->new_disk_snapshot(did, name, error_str);

    if (snap_id == -1)
    {
        vm->unlock();
        return -1;
    }

    switch(state)
    {
        case VirtualMachine::POWEROFF:
            vm->set_state(VirtualMachine::ACTIVE);
            vm->set_state(VirtualMachine::DISK_SNAPSHOT_POWEROFF);
            break;

        case VirtualMachine::SUSPENDED:
            vm->set_state(VirtualMachine::ACTIVE);
            vm->set_state(VirtualMachine::DISK_SNAPSHOT_SUSPENDED);
            break;

        case VirtualMachine::ACTIVE:
            vm->set_state(VirtualMachine::ACTIVE);
            vm->set_state(VirtualMachine::DISK_SNAPSHOT);
            break;

        default: break;
    }

    vmpool->update(vm);

    vm->unlock();

    switch(state)
    {
        case VirtualMachine::POWEROFF:
        case VirtualMachine::SUSPENDED:
            tm->trigger(TransferManager::SNAPSHOT_CREATE,vid);
            break;

        case VirtualMachine::ACTIVE:
            the_time = time(0);

            // Close current history record

            vm->set_running_etime(the_time);

            vm->set_etime(the_time);

            vm->set_action(History::DISK_SNAPSHOT_CREATE_ACTION);
            vm->set_reason(History::USER);

            vmpool->update_history(vm);

            // Open a new history record

            vm->cp_history();

            vm->set_stime(the_time);

            vm->set_running_stime(the_time);

            vmpool->update_history(vm);

            vmm->trigger(VirtualMachineManager::DISK_SNAPSHOT_CREATE, vid);
            break;

        default: break;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::disk_snapshot_revert(
        int           vid,
        int           did,
        int           snap_id,
        string&       error_str)
{
    ostringstream oss;

    VirtualMachine * vm = vmpool->get(vid, true);

    if ( vm == 0 )
    {
        oss << "Could not revert to disk snapshot for VM " << vid
            << ", VM does not exist" ;
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        return -1;
    }

    VirtualMachine::VmState  state  = vm->get_state();
    VirtualMachine::LcmState lstate = vm->get_lcm_state();

    if ((state !=VirtualMachine::POWEROFF || lstate !=VirtualMachine::LCM_INIT)&&
        (state !=VirtualMachine::SUSPENDED|| lstate !=VirtualMachine::LCM_INIT)&&
        (state !=VirtualMachine::ACTIVE   || lstate !=VirtualMachine::RUNNING))
    {
        oss << "Could not revert to disk snapshot for VM " << vid
            << ", wrong state " << vm->state_str() << ".";
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        vm->unlock();
        return -1;
    }

    const Snapshots * snaps = vm->get_disk_snapshots(did, error_str);

    if (snaps == 0)
    {
        vm->unlock();
        return -1;
    }

    if (vm->set_snapshot_disk(did, snap_id) == -1)
    {
        vm->unlock();
        return -1;
    }

    switch(state)
    {
        case VirtualMachine::POWEROFF:
            vm->set_state(VirtualMachine::ACTIVE);
            vm->set_state(VirtualMachine::DISK_SNAPSHOT_REVERT_POWEROFF);
            break;

        case VirtualMachine::SUSPENDED:
            vm->set_state(VirtualMachine::ACTIVE);
            vm->set_state(VirtualMachine::DISK_SNAPSHOT_REVERT_SUSPENDED);
            break;

        case VirtualMachine::ACTIVE:
            vm->set_state(VirtualMachine::ACTIVE);
            vm->set_state(VirtualMachine::DISK_SNAPSHOT_REVERT);
            break;

        default: break;
    }

    vmpool->update(vm);

    vm->unlock();

    switch(state)
    {
        case VirtualMachine::POWEROFF:
        case VirtualMachine::SUSPENDED:
            tm->trigger(TransferManager::SNAPSHOT_REVERT, vid);
            break;

        case VirtualMachine::ACTIVE:
            vmm->trigger(VirtualMachineManager::DISK_SNAPSHOT_REVERT, vid);
            break;

        default: break;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::disk_snapshot_delete(
        int           vid,
        int           did,
        int           snap_id,
        string&       error_str)
{
    ostringstream oss;
    time_t        the_time;

    VirtualMachine * vm = vmpool->get(vid, true);

    if ( vm == 0 )
    {
        oss << "Could not delete disk snapshot from VM " << vid
            << ", VM does not exist" ;
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        return -1;
    }

    VirtualMachine::VmState  state  = vm->get_state();
    VirtualMachine::LcmState lstate = vm->get_lcm_state();

    if ((state !=VirtualMachine::POWEROFF || lstate !=VirtualMachine::LCM_INIT)&&
        (state !=VirtualMachine::SUSPENDED|| lstate !=VirtualMachine::LCM_INIT)&&
        (state !=VirtualMachine::ACTIVE   || lstate !=VirtualMachine::RUNNING))
    {
        oss << "Could not delete disk snapshot from VM " << vid
            << ", wrong state " << vm->state_str() << ".";
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        vm->unlock();
        return -1;
    }

    const Snapshots * snaps = vm->get_disk_snapshots(did, error_str);

    if (snaps == 0)
    {
        vm->unlock();
        return -1;
    }

    if (!snaps->test_delete(snap_id, error_str))
    {
        vm->unlock();
        return -1;
    }

    if (vm->set_snapshot_disk(did, snap_id) == -1)
    {
        vm->unlock();
        return -1;
    }

    // Set the VM info in the history before the snapshot is removed from the VM
    vm->set_vm_info();

    switch(state)
    {
        case VirtualMachine::POWEROFF:
            vm->set_state(VirtualMachine::ACTIVE);
            vm->set_state(VirtualMachine::DISK_SNAPSHOT_DELETE_POWEROFF);
            break;

        case VirtualMachine::SUSPENDED:
            vm->set_state(VirtualMachine::ACTIVE);
            vm->set_state(VirtualMachine::DISK_SNAPSHOT_DELETE_SUSPENDED);
            break;

        case VirtualMachine::ACTIVE:
            vm->set_state(VirtualMachine::ACTIVE);
            vm->set_state(VirtualMachine::DISK_SNAPSHOT_DELETE);
            break;

        default: break;
    }

    vmpool->update(vm);

    vm->unlock();

    switch(state)
    {
        case VirtualMachine::ACTIVE:
            the_time = time(0);

            // Close current history record

            vm->set_running_etime(the_time);

            vm->set_etime(the_time);

            vm->set_action(History::DISK_SNAPSHOT_DELETE_ACTION);
            vm->set_reason(History::USER);

            vmpool->update_history(vm);

            // Open a new history record

            vm->cp_history();

            vm->set_stime(the_time);

            vm->set_running_stime(the_time);

            vmpool->update_history(vm);

        case VirtualMachine::POWEROFF:
        case VirtualMachine::SUSPENDED:
            tm->trigger(TransferManager::SNAPSHOT_DELETE, vid);
            break;

        default: break;
    }

    return 0;
}

