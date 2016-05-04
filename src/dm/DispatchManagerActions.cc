/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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
#include "Request.h"

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
    string import_state;

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

    import_state = vm->get_import_state();

    if(import_state == "POWEROFF")
    {
        vm->set_state(VirtualMachine::POWEROFF);
        vm->set_state(VirtualMachine::LCM_INIT);
    }
    else
    {
        vm->set_state(VirtualMachine::ACTIVE);
        vm->set_state(VirtualMachine::RUNNING);
    }

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

void DispatchManager::free_vm_resources(VirtualMachine * vm)
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

int DispatchManager::terminate(
        int     vid,
        bool    hard,
        string& error_str)
{
    int rc = 0;
    ostringstream oss;

    VirtualMachine * vm = vmpool->get(vid,true);

    if ( vm == 0 )
    {
        return -1;
    }

    oss << "Terminating VM " << vid;
    NebulaLog::log("DiM",Log::DEBUG,oss);

    switch (vm->get_state())
    {
        //Hard has no effect, VM is not RUNNING
        case VirtualMachine::SUSPENDED:
        case VirtualMachine::POWEROFF:
        case VirtualMachine::STOPPED:
        case VirtualMachine::UNDEPLOYED:
            lcm->trigger(LifeCycleManager::SHUTDOWN, vid);
            vm->unlock();
            break;

        case VirtualMachine::INIT:
        case VirtualMachine::PENDING:
        case VirtualMachine::HOLD:
        case VirtualMachine::CLONING:
        case VirtualMachine::CLONING_FAILURE:
            free_vm_resources(vm);
            break;

        case VirtualMachine::DONE:
            vm->unlock();
            break;

        case VirtualMachine::ACTIVE:
            switch (vm->get_lcm_state())
            {
                case VirtualMachine::RUNNING:
                case VirtualMachine::UNKNOWN:
                    if (hard)
                    {
                        lcm->trigger(LifeCycleManager::CANCEL,vid);
                    }
                    else
                    {
                        lcm->trigger(LifeCycleManager::SHUTDOWN,vid);
                    }
                    break;

                default:
                    oss.str("");
                    oss << "Could not terminate VM " << vid << ", wrong state.";

                    NebulaLog::log("DiM",Log::ERROR,oss);
                    error_str = oss.str();

                    rc = -2;
                    break;
            }
            vm->unlock();
            break;
    }

    return rc;
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

int DispatchManager::recover(VirtualMachine * vm, bool success, string& error)
{
    int rc = 0;

    switch (vm->get_state())
    {
        case VirtualMachine::CLONING_FAILURE:
            if (success)
            {
                lcm->trigger(LifeCycleManager::DISK_LOCK_SUCCESS,vm->get_oid());
            }
            else
            {
                lcm->trigger(LifeCycleManager::DISK_LOCK_FAILURE,vm->get_oid());
            }
            break;

        case VirtualMachine::ACTIVE:
            lcm->recover(vm, success);
            break;

        default:
            rc    = -1;
            error = "Cannot recover VM operation";
            break;
    }

    vm->unlock();

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::retry(VirtualMachine * vm, string& error)
{
    int rc = 0;

    switch (vm->get_state())
    {
        case VirtualMachine::ACTIVE:
            lcm->retry(vm);
            break;

        default:
            rc    = -1;
            error = "The VM operation cannot be retried";
            break;
    }

    vm->unlock();

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::delete_vm(VirtualMachine * vm, string& error)
{
    ostringstream oss;

    int cpu, mem, disk;
    vector<VectorAttribute *> pci;

    bool is_public_host = false;
    int  host_id = -1;

    if(vm->hasHistory())
    {
        host_id = vm->get_hid();
    }

    int vid = vm->get_oid();

    if(host_id != -1)
    {
        Host * host = hpool->get(host_id,true);

        if ( host == 0 )
        {
            oss << "Error getting host " << host_id;
            error = oss.str();

            vm->unlock();

            return -1;
        }

        is_public_host = host->is_public_cloud();

        host->unlock();
    }

    oss << "Deleting VM " << vm->get_oid();
    NebulaLog::log("DiM",Log::DEBUG,oss);

    switch (vm->get_state())
    {
        case VirtualMachine::SUSPENDED:
        case VirtualMachine::POWEROFF:
            vm->get_requirements(cpu, mem, disk, pci);

            hpool->del_capacity(vm->get_hid(), vid, cpu, mem, disk, pci);

            if (is_public_host)
            {
                vmm->trigger(VirtualMachineManager::CLEANUP, vid);
            }
            else
            {
                tm->trigger(TransferManager::EPILOG_DELETE, vid);
            }

            free_vm_resources(vm);
        break;

        case VirtualMachine::STOPPED:
        case VirtualMachine::UNDEPLOYED:
            if (is_public_host)
            {
                vmm->trigger(VirtualMachineManager::CLEANUP, vid);
            }
            else
            {
                tm->trigger(TransferManager::EPILOG_DELETE, vid);
            }

            free_vm_resources(vm);
        break;

        case VirtualMachine::INIT:
        case VirtualMachine::PENDING:
        case VirtualMachine::HOLD:
        case VirtualMachine::CLONING:
        case VirtualMachine::CLONING_FAILURE:
            free_vm_resources(vm);
        break;

        case VirtualMachine::ACTIVE:
            lcm->trigger(LifeCycleManager::DELETE, vid);
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

int DispatchManager::delete_recreate(VirtualMachine * vm, string& error)
{
    ostringstream oss;

    int rc = 0;

    Template *           vm_quotas = 0;
    map<int, Template *> ds_quotas;

    int vm_uid, vm_gid;

    switch (vm->get_state())
    {
        case VirtualMachine::POWEROFF:
            error = "Cannot delete-recreate a powered off VM. Resume it first";
            NebulaLog::log("DiM", Log::ERROR, error);
            rc = -1;
        break;

        case VirtualMachine::SUSPENDED:
            error = "Cannot delete-recreate a suspended VM. Resume it first";
            NebulaLog::log("DiM", Log::ERROR, error);
            rc = -1;
        break;

        case VirtualMachine::INIT:
        case VirtualMachine::PENDING:
        case VirtualMachine::CLONING:
        case VirtualMachine::CLONING_FAILURE:
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
            lcm->trigger(LifeCycleManager::DELETE_RECREATE, vm->get_oid());
        break;

        case VirtualMachine::DONE:
            error = "Cannot delete-recreate a VM already in DONE state";
            NebulaLog::log("DiM", Log::ERROR, error);
            rc = -1;
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

int DispatchManager::attach(int vid, VirtualMachineTemplate * tmpl, string & err)
{
    ostringstream oss;

    VirtualMachine * vm = vmpool->get(vid, true);

    if ( vm == 0 )
    {
        oss << "Could not attach a new disk to VM " << vid
            << ", VM does not exist" ;
        err = oss.str();

        NebulaLog::log("DiM", Log::ERROR, err);

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
        err = oss.str();

        NebulaLog::log("DiM", Log::ERROR, err);

        vm->unlock();
        return -1;
    }

    vm->set_resched(false);

    if ( vm->set_up_attach_disk(tmpl, err) != 0 )
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

        NebulaLog::log("DiM", Log::ERROR, err);
        return -1;
    }

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

    if (vm->get_state()     == VirtualMachine::ACTIVE &&
        vm->get_lcm_state() == VirtualMachine::RUNNING )
    {
        vm->set_state(VirtualMachine::HOTPLUG_NIC);
    }

    vm->set_resched(false);

    if ( vm->set_up_attach_nic(tmpl, error_str) != 0 )
    {
        if (vm->get_lcm_state() == VirtualMachine::HOTPLUG_NIC)
        {
            vm->set_state(VirtualMachine::RUNNING);
        }

        vmpool->update(vm);

        vm->unlock();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        return -1;
    }

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
        (state !=VirtualMachine::SUSPENDED|| lstate !=VirtualMachine::LCM_INIT))
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

        default: break;
    }

    vmpool->update(vm);

    vm->unlock();

    tm->trigger(TransferManager::SNAPSHOT_REVERT, vid);

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

