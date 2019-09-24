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

#include "DispatchManager.h"
#include "NebulaLog.h"

#include "VirtualMachineManager.h"
#include "TransferManager.h"
#include "ImageManager.h"
#include "Quotas.h"
#include "Request.h"
#include "Nebula.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::deploy(VirtualMachine * vm, const RequestAttributes& ra)
{
    ostringstream oss;
    int vid;
    int uid;
    int gid;

    string error;

    VirtualMachineTemplate quota_tmpl;
    bool do_quotas = false;

    if ( vm == nullptr )
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
        do_quotas = vm->get_state() == VirtualMachine::STOPPED ||
             vm->get_state() == VirtualMachine::UNDEPLOYED;

        vm->set_state(VirtualMachine::ACTIVE);

        vmpool->update(vm);

        if ( do_quotas )
        {
            uid = vm->get_uid();
            gid = vm->get_gid();

            get_quota_template(vm, quota_tmpl, true);
        }

        lcm->trigger(LCMAction::DEPLOY, vid, ra);
    }
    else
    {
        goto error;
    }

    vm->unlock();

    if ( do_quotas )
    {
        Quotas::vm_check(uid, gid, &quota_tmpl, error);
    }

    return 0;

error:
    oss.str("");
    oss << "Could not deploy VM " << vid
        << ", wrong state " << vm->state_str() << ".";
    NebulaLog::log("DiM",Log::ERROR,oss);

    vm->unlock();

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::import(VirtualMachine * vm, const RequestAttributes& ra)
{
    ostringstream oss;
    string import_state;

    int uid;
    int gid;

    VirtualMachineTemplate quota_tmpl;
    bool do_quotas = false;

    string error;

    if ( vm == nullptr )
    {
        return -1;
    }

    if ( vm->get_state() != VirtualMachine::PENDING &&
         vm->get_state() != VirtualMachine::HOLD )
    {
        return -1;
    }

    time_t the_time = time(0);
    HostShareCapacity sr;

    vm->get_capacity(sr);

    hpool->add_capacity(vm->get_hid(), sr);

    import_state = vm->get_import_state();

    if (import_state == "POWEROFF")
    {
        vm->set_state(VirtualMachine::POWEROFF);
        vm->set_state(VirtualMachine::LCM_INIT);

        //Close this History Record
        vm->set_etime(the_time);
        vm->set_running_etime(the_time);
    }
    else
    {
        vm->set_state(VirtualMachine::ACTIVE);
        vm->set_state(VirtualMachine::RUNNING);

        uid = vm->get_uid();
        gid = vm->get_gid();

        get_quota_template(vm, quota_tmpl, true);

        do_quotas = true;
    }

    vm->set_stime(the_time);

    vm->set_prolog_stime(the_time);
    vm->set_prolog_etime(the_time);

    vm->set_running_stime(the_time);

    vm->set_last_poll(0);

    vmpool->update_history(vm);

    vmpool->update(vm);

    vm->unlock();

    if ( do_quotas )
    {
        Quotas::vm_check(uid, gid, &quota_tmpl, error);
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::migrate(VirtualMachine * vm, int poff_migrate,
        const RequestAttributes& ra)
{
    ostringstream oss;
    int           vid;

    if ( vm == nullptr )
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
        switch (poff_migrate) {
            case 0:
                lcm->trigger(LCMAction::MIGRATE, vid, ra);
                break;
            case 1:
                lcm->trigger(LCMAction::POFF_MIGRATE, vid, ra);
                break;
            case 2:
                lcm->trigger(LCMAction::POFF_HARD_MIGRATE, vid, ra);
                break;

            default: /* Defaults to <5.8 behavior */
                lcm->trigger(LCMAction::MIGRATE, vid, ra);
                break;
        }
    }
    else
    {
        goto error;
    }

    return 0;

error:
    oss.str("");
    oss << "Could not migrate VM " << vid
        << ", wrong state " << vm->state_str() << ".";
    NebulaLog::log("DiM",Log::ERROR,oss);

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::live_migrate(VirtualMachine * vm,
        const RequestAttributes& ra)
{
    ostringstream oss;
    int           vid;

    if ( vm == nullptr )
    {
        return -1;
    }

    vid = vm->get_oid();

    oss << "Live-migrating VM " << vid;
    NebulaLog::log("DiM",Log::DEBUG,oss);

    if (vm->get_state()     == VirtualMachine::ACTIVE &&
        vm->get_lcm_state() == VirtualMachine::RUNNING )
    {
        lcm->trigger(LCMAction::LIVE_MIGRATE, vid, ra);
    }
    else
    {
        goto error;
    }

    return 0;

error:
    oss.str("");
    oss << "Could not live-migrate VM " << vid
        << ", wrong state " << vm->state_str() << ".";
    NebulaLog::log("DiM",Log::ERROR,oss);

    return -1;
}

/* ************************************************************************** */
/* ************************************************************************** */

void DispatchManager::free_vm_resources(VirtualMachine * vm, bool check_images)
{
    vector<Template *> ds_quotas;

    Template * quota_tmpl;

    int vmid;
    int uid;
    int gid;
    string deploy_id;
    int vrid = -1;
    unsigned int port;

    quota_tmpl = vm->clone_template();

    if ( (vm->get_state() == VirtualMachine::ACTIVE) ||
         (vm->get_state() == VirtualMachine::PENDING) ||
         (vm->get_state() == VirtualMachine::HOLD) )
    {
        std::string memory, cpu;

        quota_tmpl->get("MEMORY", memory);
        quota_tmpl->get("CPU", cpu);

        quota_tmpl->add("RUNNING_MEMORY", memory);
        quota_tmpl->add("RUNNING_CPU", cpu);
        quota_tmpl->add("RUNNING_VMS", 1);
    }

    quota_tmpl->add("VMS", 1);

    vm->release_network_leases();

    vm->release_vmgroup();

    vm->release_disk_images(ds_quotas, check_images);

    vm->set_state(VirtualMachine::DONE);

    vm->set_state(VirtualMachine::LCM_INIT);

    vm->set_exit_time(time(0));

    VectorAttribute * graphics = vm->get_template_attribute("GRAPHICS");

    if ( graphics != nullptr && graphics->vector_value("PORT", port) == 0
            && vm->hasHistory())
    {
        graphics->remove("PORT");
        clpool->release_vnc_port(vm->get_cid(), port);
    }

    vmpool->update(vm);

    vmid = vm->get_oid();
    uid  = vm->get_uid();
    gid  = vm->get_gid();

    if (vm->is_imported())
    {
        deploy_id = vm->get_deploy_id();
    }

    if (vm->is_vrouter())
    {
        vrid = vm->get_vrouter_id();
    }

    vm->unlock();

    Quotas::vm_del(uid, gid, quota_tmpl);

    delete quota_tmpl;

    if ( !ds_quotas.empty() )
    {
        Quotas::ds_del(uid, gid, ds_quotas);
    }

    if (!deploy_id.empty())
    {
        vmpool->drop_index(deploy_id);
    }

    if (vrid != -1)
    {
        VirtualRouter* vr = vrouterpool->get(vrid);

        if (vr != nullptr)
        {
            vr->del_vmid(vmid);

            vrouterpool->update(vr);

            vr->unlock();
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::terminate(int vid, bool hard, const RequestAttributes& ra,
        string& error_str)
{
    int rc = 0;
    ostringstream oss;

    VirtualMachine * vm = vmpool->get(vid);

    if ( vm == nullptr )
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
            lcm->trigger(LCMAction::SHUTDOWN, vid, ra);
            vm->unlock();
            break;

        case VirtualMachine::INIT:
        case VirtualMachine::PENDING:
        case VirtualMachine::HOLD:
        case VirtualMachine::CLONING:
        case VirtualMachine::CLONING_FAILURE:
            free_vm_resources(vm, true);
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
                        lcm->trigger(LCMAction::CANCEL, vid, ra);
                    }
                    else
                    {
                        lcm->trigger(LCMAction::SHUTDOWN, vid, ra);
                    }
                    break;

                case VirtualMachine::BOOT_FAILURE:
                case VirtualMachine::BOOT_MIGRATE_FAILURE:
                case VirtualMachine::PROLOG_MIGRATE_FAILURE:
                case VirtualMachine::PROLOG_FAILURE:
                case VirtualMachine::EPILOG_FAILURE:
                case VirtualMachine::EPILOG_STOP_FAILURE:
                case VirtualMachine::EPILOG_UNDEPLOY_FAILURE:
                case VirtualMachine::PROLOG_MIGRATE_POWEROFF_FAILURE:
                case VirtualMachine::PROLOG_MIGRATE_SUSPEND_FAILURE:
                case VirtualMachine::BOOT_UNDEPLOY_FAILURE:
                case VirtualMachine::BOOT_STOPPED_FAILURE:
                case VirtualMachine::PROLOG_RESUME_FAILURE:
                case VirtualMachine::PROLOG_UNDEPLOY_FAILURE:
                case VirtualMachine::PROLOG_MIGRATE_UNKNOWN_FAILURE:
                    lcm->trigger(LCMAction::DELETE, vid, ra);
                    break;

                default:
                    oss.str("");
                    oss << "Could not terminate VM " << vid
                        << ", wrong state " << vm->state_str() << ".";

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

int DispatchManager::undeploy(int vid, bool hard, const RequestAttributes& ra,
        string& error_str)
{
    ostringstream oss;

    VirtualMachine * vm = vmpool->get_ro(vid);

    if ( vm == nullptr )
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
            lcm->trigger(LCMAction::UNDEPLOY_HARD, vid, ra);
        }
        else
        {
            lcm->trigger(LCMAction::UNDEPLOY, vid, ra);
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
    oss << "Could not undeploy VM " << vid
        << ", wrong state " << vm->state_str() << ".";
    NebulaLog::log("DiM",Log::ERROR,oss);

    oss.str("");
    oss << "This action is not available for state " << vm->state_str();
    error_str = oss.str();

    vm->unlock();
    return -2;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::poweroff(int vid, bool hard, const RequestAttributes& ra,
        string& error_str)
{
    ostringstream oss;

    VirtualMachine * vm = vmpool->get_ro(vid);

    if ( vm == nullptr )
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
            lcm->trigger(LCMAction::POWEROFF_HARD, vid, ra);
        }
        else
        {
            lcm->trigger(LCMAction::POWEROFF, vid, ra);
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
    oss << "Could not power off VM " << vid
        << ", wrong state " << vm->state_str() << ".";
    NebulaLog::log("DiM",Log::ERROR,oss);

    oss.str("");
    oss << "This action is not available for state " << vm->state_str();
    error_str = oss.str();

    vm->unlock();
    return -2;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::hold(int vid, const RequestAttributes& ra,
        string& error_str)
{
    ostringstream oss;

    VirtualMachine * vm = vmpool->get(vid);

    if ( vm == nullptr )
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
    oss << "Could not hold VM " << vid
        << ", wrong state " << vm->state_str() << ".";
    NebulaLog::log("DiM",Log::ERROR,oss);

    oss.str("");
    oss << "This action is not available for state " << vm->state_str();
    error_str = oss.str();

    vm->unlock();
    return -2;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::release(int vid, const RequestAttributes& ra,
        string& error_str)
{
    ostringstream oss;

    VirtualMachine * vm = vmpool->get(vid);

    if ( vm == nullptr )
    {
        return -1;
    }

    oss << "Releasing VM " << vid;
    NebulaLog::log("DiM",Log::DEBUG,oss);

    if (vm->get_state() == VirtualMachine::HOLD)
    {
        set<int> cluster_ids;
        int rc = vm->automatic_requirements(cluster_ids, error_str);

        if (rc != 0)
        {
            vmpool->update(vm);

            goto error_requirements;
        }

        vm->set_state(VirtualMachine::PENDING);

        vmpool->update(vm);
    }
    else
    {
        goto error_state;
    }

    vm->unlock();

    return 0;

error_requirements:
    oss.str("");
    oss << "Could not release VM " << vid
        << ", error updating requirements. " << error_str;
    NebulaLog::log("DiM",Log::ERROR,oss);

    error_str = oss.str();

    vm->unlock();
    return -2;

error_state:
    oss.str("");
    oss << "Could not release VM " << vid
        << ", wrong state " << vm->state_str() << ".";
    NebulaLog::log("DiM",Log::ERROR,oss);

    oss.str("");
    oss << "This action is not available for state " << vm->state_str();
    error_str = oss.str();

    vm->unlock();
    return -2;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::stop(int vid, const RequestAttributes& ra,
        string& error_str)
{
    ostringstream oss;

    VirtualMachine * vm = vmpool->get_ro(vid);

    if ( vm == nullptr )
    {
        return -1;
    }

    oss << "Stopping VM " << vid;
    NebulaLog::log("DiM",Log::DEBUG,oss);

    if (vm->get_state()        == VirtualMachine::SUSPENDED ||
        (vm->get_state()       == VirtualMachine::ACTIVE &&
         vm->get_lcm_state() == VirtualMachine::RUNNING ))
    {
        lcm->trigger(LCMAction::STOP, vid, ra);
    }
    else
    {
        goto error;
    }

    vm->unlock();

    return 0;

error:
    oss.str("");
    oss << "Could not stop VM " << vid
        << ", wrong state " << vm->state_str() << ".";
    NebulaLog::log("DiM",Log::ERROR,oss);

    oss.str("");
    oss << "This action is not available for state " << vm->state_str();
    error_str = oss.str();

    vm->unlock();
    return -2;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::suspend(int vid, const RequestAttributes& ra,
        string& error_str)
{
    ostringstream oss;

    VirtualMachine * vm = vmpool->get_ro(vid);

    if ( vm == nullptr )
    {
        return -1;
    }

    oss << "Suspending VM " << vid;
    NebulaLog::log("DiM",Log::DEBUG,oss);

    if (vm->get_state()     == VirtualMachine::ACTIVE &&
        vm->get_lcm_state() == VirtualMachine::RUNNING )
    {
        lcm->trigger(LCMAction::SUSPEND, vid, ra);
    }
    else
    {
        goto error;
    }

    vm->unlock();

    return 0;

error:
    oss.str("");
    oss << "Could not suspend VM " << vid
        << ", wrong state " << vm->state_str() << ".";
    NebulaLog::log("DiM", Log::ERROR, oss);

    oss.str("");
    oss << "This action is not available for state " << vm->state_str();
    error_str = oss.str();

    vm->unlock();
    return -2;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::resume(int vid, const RequestAttributes& ra,
        string& error_str)
{
    ostringstream oss;

    VirtualMachine * vm = vmpool->get(vid);

    if ( vm == nullptr )
    {
        return -1;
    }

    oss << "Resuming VM " << vid;
    NebulaLog::log("DiM",Log::DEBUG,oss);

    if (vm->get_state() == VirtualMachine::STOPPED ||
        vm->get_state() == VirtualMachine::UNDEPLOYED )
    {
        set<int> cluster_ids;
        int rc = vm->automatic_requirements(cluster_ids, error_str);

        if (rc != 0)
        {
            vmpool->update(vm);

            goto error_requirements;
        }

        vm->set_state(VirtualMachine::PENDING);

        vmpool->update(vm);
    }
    else if (vm->get_state() == VirtualMachine::SUSPENDED)
    {
        lcm->trigger(LCMAction::RESTORE, vid, ra);
    }
    else if ( vm->get_state() == VirtualMachine::POWEROFF ||
             (vm->get_state() == VirtualMachine::ACTIVE &&
              vm->get_lcm_state() == VirtualMachine::UNKNOWN))
    {
        lcm->trigger(LCMAction::RESTART, vid, ra);
    }
    else
    {
        goto error_state;
    }

    vm->unlock();

    return 0;

error_requirements:
    oss.str("");
    oss << "Could not resume VM " << vid
        << ", error updating requirements. " << error_str;
    NebulaLog::log("DiM",Log::ERROR,oss);

    error_str = oss.str();

    vm->unlock();
    return -2;

error_state:
    oss.str("");
    oss << "Could not resume VM " << vid
        << ", wrong state " << vm->state_str() << ".";
    NebulaLog::log("DiM",Log::ERROR,oss);

    oss.str("");
    oss << "This action is not available for state " << vm->state_str();
    error_str = oss.str();

    vm->unlock();
    return -2;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::reboot(int vid, bool hard, const RequestAttributes& ra,
        string& error_str)
{
    ostringstream oss;

    VirtualMachine * vm = vmpool->get(vid);

    if ( vm == nullptr )
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
            vmm->trigger(VMMAction::RESET, vid);
        }
        else
        {
            vmm->trigger(VMMAction::REBOOT, vid);
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
    oss << "Could not reboot VM " << vid
        << ", wrong state " << vm->state_str() << ".";
    NebulaLog::log("DiM",Log::ERROR,oss);

    oss.str("");
    oss << "This action is not available for state " << vm->state_str();
    error_str = oss.str();

    vm->unlock();

    return -2;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::resched(int vid, bool do_resched,
        const RequestAttributes& ra, string& error_str)
{
    ostringstream oss;

    VirtualMachine * vm = vmpool->get(vid);

    if ( vm == nullptr )
    {
        return -1;
    }

    oss << "Setting rescheduling flag on VM " << vid;
    NebulaLog::log("DiM",Log::DEBUG,oss);

    if (vm->get_state()     == VirtualMachine::POWEROFF ||
        (vm->get_state()     == VirtualMachine::ACTIVE &&
         (vm->get_lcm_state() == VirtualMachine::RUNNING ||
          vm->get_lcm_state() == VirtualMachine::UNKNOWN)))
    {
        if (do_resched)
        {
            set<int> cluster_ids;
            int rc = vm->automatic_requirements(cluster_ids, error_str);

            if (rc != 0)
            {
                vmpool->update(vm);

                goto error_requirements;
            }
        }

        vm->set_resched(do_resched);
        vmpool->update(vm);
    }
    else
    {
        goto error_state;
    }

    vm->unlock();

    return 0;

error_requirements:
    oss.str("");
    oss << "Could not set rescheduling flag for VM " << vid
        << ", error updating requirements. " << error_str;
    NebulaLog::log("DiM",Log::ERROR,oss);

    error_str = oss.str();

    vm->unlock();
    return -2;

error_state:
    oss.str("");
    oss << "Could not set rescheduling flag for VM " << vid
        << ", wrong state " << vm->state_str() << ".";
    NebulaLog::log("DiM",Log::ERROR,oss);

    oss.str("");
    oss << "This action is not available for state " << vm->state_str();
    error_str = oss.str();

    vm->unlock();

    return -2;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::recover(VirtualMachine * vm, bool success,
         const RequestAttributes& ra, string& error_str)
{
    int rc = 0;
    int vid = vm->get_oid();

    switch (vm->get_state())
    {
        case VirtualMachine::CLONING_FAILURE:
            if (success)
            {
                lcm->trigger(LCMAction::DISK_LOCK_SUCCESS, vid, ra);
            }
            else
            {
                lcm->trigger(LCMAction::DISK_LOCK_FAILURE, vid, ra);
            }
            break;

        case VirtualMachine::ACTIVE:
            lcm->recover(vm, success, ra);
            break;

        default:
            rc    = -1;

            ostringstream oss;
            oss << "Could not perform a recover operation on VM " << vm->get_oid()
                << ", wrong state " << vm->state_str() << ".";
            error_str = oss.str();

            break;
    }

    vm->unlock();

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::retry(VirtualMachine * vm,  const RequestAttributes& ra,
        string& error_str)
{
    int rc = 0;

    switch (vm->get_state())
    {
        case VirtualMachine::ACTIVE:
            lcm->retry(vm);
            break;

        default:
            rc    = -1;

            ostringstream oss;
            oss << "Could not perform a retry on VM " << vm->get_oid()
                << ", wrong state " << vm->state_str() << ".";
            error_str = oss.str();

            break;
    }

    vm->unlock();

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::delete_vm(VirtualMachine * vm, const RequestAttributes& ra,
        string& error)
{
    ostringstream oss;

    HostShareCapacity sr;

    bool is_public_host = false;
    int  host_id = -1;

    if (vm->hasHistory())
    {
        host_id = vm->get_hid();
    }

    int vid = vm->get_oid();

    if (host_id != -1)
    {
        Host * host = hpool->get_ro(host_id);

        if ( host == nullptr )
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
            vm->get_capacity(sr);

            hpool->del_capacity(vm->get_hid(), sr);

            if (is_public_host)
            {
                vmm->trigger(VMMAction::CLEANUP, vid);
            }
            else
            {
                tm->trigger(TMAction::EPILOG_DELETE, vid);
            }

            free_vm_resources(vm, true);
        break;

        case VirtualMachine::STOPPED:
        case VirtualMachine::UNDEPLOYED:
            if (is_public_host)
            {
                vmm->trigger(VMMAction::CLEANUP, vid);
            }
            else
            {
                tm->trigger(TMAction::EPILOG_DELETE, vid);
            }

            free_vm_resources(vm, true);
        break;

        case VirtualMachine::INIT:
        case VirtualMachine::PENDING:
        case VirtualMachine::HOLD:
        case VirtualMachine::CLONING:
        case VirtualMachine::CLONING_FAILURE:
            free_vm_resources(vm, true);
        break;

        case VirtualMachine::ACTIVE:
            lcm->trigger(LCMAction::DELETE, vid, ra);
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

int DispatchManager::delete_recreate(VirtualMachine * vm,
        const RequestAttributes& ra, string& error)
{
    ostringstream oss;

    int rc = 0;

    Template * vm_quotas_snp = nullptr;

    VirtualMachineTemplate quota_tmpl;
    bool do_quotas = false;

    vector<Template *> ds_quotas_snp;

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

            vm->delete_non_persistent_disk_snapshots(&vm_quotas_snp,
                    ds_quotas_snp);

            do_quotas = true;

        case VirtualMachine::HOLD:
            if (vm->hasHistory())
            {
                vm->set_action(VMActions::DELETE_RECREATE_ACTION, ra.uid, ra.gid,
                        ra.req_id);
                vmpool->update_history(vm);
            }

            // Automatic requirements are not recalculated on purpose

            vm->set_state(VirtualMachine::LCM_INIT);
            vm->set_state(VirtualMachine::PENDING);

            vmpool->update(vm);

            if ( do_quotas )
            {
                get_quota_template(vm, quota_tmpl, true);
            }
        break;

        case VirtualMachine::ACTIVE: //Cleanup VM resources before PENDING
            lcm->trigger(LCMAction::DELETE_RECREATE, vm->get_oid(), ra);
        break;

        case VirtualMachine::DONE:
            error = "Cannot delete-recreate a VM already in DONE state";
            NebulaLog::log("DiM", Log::ERROR, error);
            rc = -1;
        break;
    }

    vm->unlock();

    if ( !ds_quotas_snp.empty() )
    {
        Quotas::ds_del_recreate(vm_uid, vm_gid, ds_quotas_snp);
    }

    if ( vm_quotas_snp != nullptr )
    {
        Quotas::vm_del(vm_uid, vm_gid, vm_quotas_snp);

        delete vm_quotas_snp;
    }

    if ( do_quotas )
    {
        Quotas::vm_check(vm_uid, vm_gid, &quota_tmpl, error);
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::delete_vm_db(VirtualMachine * vm,
            const RequestAttributes& ra, string& error_str)
{
    HostShareCapacity sr;

    ostringstream oss;
    oss << "Deleting VM from DB " << vm->get_oid();

    NebulaLog::log("DiM",Log::DEBUG,oss);

    switch (vm->get_state())
    {
        case VirtualMachine::SUSPENDED:
        case VirtualMachine::POWEROFF:
        case VirtualMachine::ACTIVE:
            vm->get_capacity(sr);

            hpool->del_capacity(vm->get_hid(), sr);

        case VirtualMachine::STOPPED:
        case VirtualMachine::UNDEPLOYED:
        case VirtualMachine::INIT:
        case VirtualMachine::PENDING:
        case VirtualMachine::HOLD:
        case VirtualMachine::CLONING:
        case VirtualMachine::CLONING_FAILURE:
            free_vm_resources(vm, false);
        break;

        case VirtualMachine::DONE:
            vm->unlock();
        break;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::attach(int vid, VirtualMachineTemplate * tmpl,
        const RequestAttributes& ra, string & err)
{
    ostringstream oss;

    VirtualMachine * vm = vmpool->get(vid);

    if ( vm == nullptr )
    {
        oss << "Could not attach a new disk to VM " << vid
            << ", VM does not exist";
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

        vm->set_action(VMActions::DISK_ATTACH_ACTION, ra.uid, ra.gid, ra.req_id);

        vmpool->update_history(vm);

        // Open a new history record

        vm->cp_history();

        vm->set_stime(the_time);

        vm->set_running_stime(the_time);

        vmpool->insert_history(vm);

        //-----------------------------------------------

        vmm->trigger(VMMAction::ATTACH, vid);
    }
    else
    {
        tm->trigger(TMAction::PROLOG_ATTACH, vid);
    }

    vmpool->update(vm);

    vm->unlock();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::detach(int vid, int disk_id, const RequestAttributes& ra,
        string&  error_str)
{
    ostringstream oss;

    VirtualMachine * vm = vmpool->get(vid);

    if ( vm == nullptr )
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

        vm->set_action(VMActions::DISK_DETACH_ACTION, ra.uid, ra.gid, ra.req_id);

        vmpool->update_history(vm);

        // Open a new history record

        vm->cp_history();

        vm->set_stime(the_time);

        vm->set_running_stime(the_time);

        vmpool->insert_history(vm);

        //---------------------------------------------------

        vm->set_state(VirtualMachine::HOTPLUG);

        vmm->trigger(VMMAction::DETACH, vid);
    }
    else
    {
        vm->set_state(VirtualMachine::ACTIVE);
        vm->set_state(VirtualMachine::HOTPLUG_EPILOG_POWEROFF);

        tm->trigger(TMAction::EPILOG_DETACH, vid);
    }

    vmpool->update(vm);

    vm->unlock();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::snapshot_create(int vid, string& name, int& snap_id,
        const RequestAttributes& ra, string& error_str)
{
    ostringstream oss;

    VirtualMachine * vm = vmpool->get(vid);

    if ( vm == nullptr )
    {
        oss << "Could not create a new snapshot for VM " << vid
            << ", VM does not exist";
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

    vmm->trigger(VMMAction::SNAPSHOT_CREATE, vid);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::snapshot_revert(int vid, int snap_id,
        const RequestAttributes& ra, string& error_str)
{
    ostringstream oss;

    int rc;

    VirtualMachine * vm = vmpool->get(vid);

    if ( vm == nullptr )
    {
        oss << "Could not revert VM " << vid << " to snapshot " << snap_id
            << ", VM does not exist";
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

    rc = vm->set_revert_snapshot(snap_id);

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

    vmm->trigger(VMMAction::SNAPSHOT_REVERT, vid);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::snapshot_delete(int vid, int snap_id,
        const RequestAttributes& ra,string& error_str)
{
    ostringstream oss;

    int rc;

    VirtualMachine * vm = vmpool->get(vid);

    if ( vm == nullptr )
    {
        oss << "Could not delete snapshot " << snap_id << " for VM " << vid
            << ", VM does not exist";
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        return -1;
    }

    bool is_keep_snapshots = false;

    if ( vm->hasHistory() )
    {
        is_keep_snapshots = vmm->is_keep_snapshots(vm->get_vmm_mad());
    }

    if ( (vm->get_state() != VirtualMachine::ACTIVE ||
                vm->get_lcm_state() != VirtualMachine::RUNNING) &&
         (!is_keep_snapshots ||
                vm->get_state() != VirtualMachine::POWEROFF) )
    {
        oss << "Could not delete snapshot " << snap_id << " for VM " << vid
            << ", wrong state " << vm->state_str() << ".";
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        vm->unlock();
        return -1;
    }

    rc = vm->set_delete_snapshot(snap_id);

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

    vmm->trigger(VMMAction::SNAPSHOT_DELETE, vid);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::attach_nic(int vid, VirtualMachineTemplate* tmpl,
        const RequestAttributes& ra, string& error_str)
{
    ostringstream oss;

    VirtualMachine * vm = vmpool->get(vid);

    if ( vm == nullptr )
    {
        oss << "Could not add a new NIC to VM " << vid
            << ", VM does not exist";
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

        if ( tmpl->get("NIC") != 0 )
        {
            vm->set_action(VMActions::NIC_ATTACH_ACTION, ra.uid, ra.gid, ra.req_id);
        }
        else
        {
            vm->set_action(VMActions::ALIAS_ATTACH_ACTION, ra.uid, ra.gid, ra.req_id);
        }

        vmpool->update_history(vm);

        // Open a new history record

        vm->cp_history();

        vm->set_stime(the_time);

        vm->set_running_stime(the_time);

        vmpool->insert_history(vm);

        //-----------------------------------------------

        vmm->trigger(VMMAction::ATTACH_NIC, vid);
    }
    else
    {
        vm->log("DiM", Log::INFO, "VM NIC Successfully attached.");
        vm->clear_attach_nic();
        vmpool->update_search(vm);
    }

    vmpool->update(vm);

    vm->unlock();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::detach_nic(int vid, int nic_id,const RequestAttributes& ra,
        string&  error_str)
{
    ostringstream oss;
    string        tmp_error;

    VirtualMachine * vm = vmpool->get(vid);

    if ( vm == nullptr )
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

        if ( !vm->get_nic(nic_id)->is_alias() )
        {
            vm->set_action(VMActions::NIC_DETACH_ACTION, ra.uid, ra.gid, ra.req_id);
        }
        else
        {
            vm->set_action(VMActions::ALIAS_DETACH_ACTION, ra.uid, ra.gid, ra.req_id);
        }

        vmpool->update_history(vm);

        // Open a new history record

        vm->cp_history();

        vm->set_stime(the_time);

        vm->set_running_stime(the_time);

        vmpool->insert_history(vm);

        vm->set_state(VirtualMachine::HOTPLUG_NIC);

        vm->set_resched(false);

        vmpool->update(vm);

        vm->unlock();

        //---------------------------------------------------

        vmm->trigger(VMMAction::DETACH_NIC, vid);
    }
    else
    {
        vm->log("DiM", Log::INFO, "VM NIC Successfully detached.");

        vmpool->update(vm);

        vmpool->update_search(vm);

        vm->unlock();

        vmpool->delete_attach_nic(vid);
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::disk_snapshot_create(int vid, int did, const string& name,
        int& snap_id, const RequestAttributes& ra, string& error_str)
{
    ostringstream oss;
    time_t        the_time;

    VirtualMachine * vm = vmpool->get(vid);

    if ( vm == nullptr )
    {
        oss << "Could not create a new disk snapshot for VM " << vid
            << ", VM does not exist";
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

    switch (state)
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

    switch (state)
    {
        case VirtualMachine::POWEROFF:
        case VirtualMachine::SUSPENDED:
            tm->trigger(TMAction::SNAPSHOT_CREATE, vid);
            break;

        case VirtualMachine::ACTIVE:
            the_time = time(0);

            // Close current history record

            vm->set_running_etime(the_time);

            vm->set_etime(the_time);

            vm->set_action(VMActions::DISK_SNAPSHOT_CREATE_ACTION, ra.uid, ra.gid,
                    ra.req_id);

            vmpool->update_history(vm);

            // Open a new history record

            vm->cp_history();

            vm->set_stime(the_time);

            vm->set_running_stime(the_time);

            vmpool->insert_history(vm);

            vmm->trigger(VMMAction::DISK_SNAPSHOT_CREATE, vid);
            break;

        default: break;
    }

    vmpool->update(vm);

    vm->unlock();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::disk_snapshot_revert(int vid, int did, int snap_id,
        const RequestAttributes& ra, string& error_str)
{
    ostringstream oss;

    VirtualMachine * vm = vmpool->get(vid);

    if ( vm == nullptr )
    {
        oss << "Could not revert to disk snapshot for VM " << vid
            << ", VM does not exist";
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

    if (snaps == nullptr)
    {
        vm->unlock();
        return -1;
    }

    if (vm->set_snapshot_disk(did, snap_id) == -1)
    {
        oss << "Disk id (" << did << ") or snapshot id ("
            << snap_id << ") is not invalid.";

        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);
        vm->unlock();
        return -1;
    }

    switch (state)
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

    tm->trigger(TMAction::SNAPSHOT_REVERT, vid);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::disk_snapshot_delete(int vid, int did, int snap_id,
        const RequestAttributes& ra, string& error_str)
{
    ostringstream oss;
    time_t        the_time;

    VirtualMachine * vm = vmpool->get(vid);

    if ( vm == nullptr )
    {
        oss << "Could not delete disk snapshot from VM " << vid
            << ", VM does not exist";
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

    if (snaps == nullptr)
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

    switch (state)
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

    switch (state)
    {
        case VirtualMachine::ACTIVE:
            the_time = time(0);

            // Close current history record

            vm->set_running_etime(the_time);

            vm->set_etime(the_time);

            vm->set_action(VMActions::DISK_SNAPSHOT_DELETE_ACTION, ra.uid, ra.gid,
                    ra.req_id);

            vmpool->update_history(vm);

            // Open a new history record

            vm->cp_history();

            vm->set_stime(the_time);

            vm->set_running_stime(the_time);

            vmpool->insert_history(vm);

        case VirtualMachine::POWEROFF:
        case VirtualMachine::SUSPENDED:
            tm->trigger(TMAction::SNAPSHOT_DELETE, vid);
            break;

        default: break;
    }

    vmpool->update(vm);

    vm->unlock();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::disk_resize(int vid, int did, long long new_size,
        const RequestAttributes& ra, string& error_str)
{
    ostringstream oss;
    time_t        the_time;

    VirtualMachine * vm = vmpool->get(vid);

    if ( vm == nullptr )
    {
        oss << "Could not resize disk for VM " << vid << ", VM does not exist";
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);
        return -1;
    }

    VirtualMachine::VmState  state  = vm->get_state();
    VirtualMachine::LcmState lstate = vm->get_lcm_state();

    if ((state!=VirtualMachine::POWEROFF  || lstate!=VirtualMachine::LCM_INIT)&&
        (state!=VirtualMachine::UNDEPLOYED|| lstate!=VirtualMachine::LCM_INIT)&&
        (state!=VirtualMachine::ACTIVE    || lstate!=VirtualMachine::RUNNING))
    {
        oss << "Could not resize disk for VM " << vid << ", wrong state "
            << vm->state_str() << ".";
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        vm->unlock();

        return -1;
    }

    // Set the VM info in the history before the disk is resized
    vm->set_vm_info();

    int rc = vm->set_up_resize_disk(did, new_size, error_str);

    if (rc == -1)
    {
        vm->unlock();
        return -1;
    }

    switch (state)
    {
        case VirtualMachine::POWEROFF:
            vm->set_state(VirtualMachine::ACTIVE);
            vm->set_state(VirtualMachine::DISK_RESIZE_POWEROFF);
            break;

        case VirtualMachine::UNDEPLOYED:
            vm->set_state(VirtualMachine::ACTIVE);
            vm->set_state(VirtualMachine::DISK_RESIZE_UNDEPLOYED);
            break;

        case VirtualMachine::ACTIVE:
            vm->set_state(VirtualMachine::ACTIVE);
            vm->set_state(VirtualMachine::DISK_RESIZE);
            break;

        default: break;
    }

    switch (state)
    {
        case VirtualMachine::POWEROFF:
        case VirtualMachine::UNDEPLOYED:
            tm->trigger(TMAction::RESIZE, vid);
            break;

        case VirtualMachine::ACTIVE:
            the_time = time(0);

            // Close current history record

            vm->set_running_etime(the_time);

            vm->set_etime(the_time);

            vm->set_action(VMActions::DISK_RESIZE_ACTION, ra.uid, ra.gid,
                    ra.req_id);

            vmpool->update_history(vm);

            // Open a new history record

            vm->cp_history();

            vm->set_stime(the_time);

            vm->set_running_stime(the_time);

            vmpool->insert_history(vm);

            vmm->trigger(VMMAction::DISK_RESIZE, vid);
            break;

        default: break;
    }

    vmpool->update(vm);
    vmpool->update_search(vm);

    vm->unlock();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::live_updateconf(int vid, const RequestAttributes& ra, string& error_str)
{
    ostringstream oss;

    VirtualMachine * vm = vmpool->get(vid);

    VirtualMachine::VmState  state  = vm->get_state();
    VirtualMachine::LcmState lstate = vm->get_lcm_state();

    // Allowed only for state ACTIVE and RUNNING
    if (state != VirtualMachine::ACTIVE || lstate != VirtualMachine::RUNNING)
    {
        oss << "Could not perform live updateconf for " << vid << ", wrong state "
            << vm->state_str() << ".";
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        vm->unlock();

        return -1;
    }

    // Set VM state
    vm->set_state(VirtualMachine::HOTPLUG);
    vm->set_resched(false);

    // Trigger UPDATE CONF action
    vmm->trigger(VMMAction::UPDATE_CONF, vid);

    vmpool->update(vm);
    vmpool->update_search(vm);

    vm->unlock();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
