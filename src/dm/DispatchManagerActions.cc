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

#include "DispatchManager.h"
#include "NebulaLog.h"

#include "VirtualMachineManager.h"
#include "TransferManager.h"
#include "ImageManager.h"
#include "LifeCycleManager.h"
#include "Quotas.h"
#include "Request.h"
#include "Nebula.h"
#include "ClusterPool.h"
#include "HostPool.h"
#include "VirtualMachinePool.h"
#include "VirtualNetworkPool.h"
#include "VirtualRouterPool.h"
#include "SecurityGroupPool.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::deploy(unique_ptr<VirtualMachine> vm,
                            const RequestAttributes& ra)
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

        vmpool->update(vm.get());

        if ( do_quotas )
        {
            uid = vm->get_uid();
            gid = vm->get_gid();

            vm->get_quota_template(quota_tmpl, true);
        }

        lcm->trigger_deploy(vid);
    }
    else
    {
        goto error;
    }

    vm.reset(); //force unlock of vm mutex

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

    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::import(unique_ptr<VirtualMachine> vm, const RequestAttributes& ra)
{
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
    }
    else
    {
        vm->set_state(VirtualMachine::ACTIVE);
        vm->set_state(VirtualMachine::RUNNING);

        uid = vm->get_uid();
        gid = vm->get_gid();

        vm->get_quota_template(quota_tmpl, true);

        do_quotas = true;
    }

    vm->set_stime(the_time);

    vm->set_prolog_stime(the_time);
    vm->set_prolog_etime(the_time);

    vm->set_running_stime(the_time);

    vmpool->update_history(vm.get());

    vmpool->update(vm.get());

    vm.reset(); //force unlock of vm mutex

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
                lcm->trigger_migrate(vid, ra);
                break;
            case 1:
                lcm->trigger_migrate_poweroff(vid, ra);
                break;
            case 2:
                lcm->trigger_migrate_poweroff_hard(vid, ra);
                break;

            default: /* Defaults to <5.8 behavior */
                lcm->trigger_migrate(vid, ra);
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
        lcm->trigger_live_migrate(vid, ra);
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

void DispatchManager::free_vm_resources(unique_ptr<VirtualMachine> vm,
                                        bool check_images)
{
    vector<Template *> ds_quotas;

    int vmid;
    int uid;
    int gid;
    string deploy_id;
    int vrid = -1;
    unsigned int port;

    auto quota_tmpl = vm->clone_template();

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

    if (vm->hasHistory())
    {
        bool update_history = false;

        if (vm->get_running_stime() != 0 && vm->get_running_etime() == 0)
        {
            update_history = true;
            vm->set_running_etime(time(0));
        }

        if (vm->get_etime() == 0)
        {
            update_history = true;

            vm->set_etime(time(0));
        }

        if (update_history)
        {
            vmpool->update_history(vm.get());
        }
    }

    VectorAttribute * graphics = vm->get_template_attribute("GRAPHICS");

    if ( graphics != nullptr && graphics->vector_value("PORT", port) == 0
            && vm->hasHistory())
    {
        graphics->remove("PORT");
        clpool->release_vnc_port(vm->get_cid(), port);
    }

    vmpool->update(vm.get());

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

    vm.reset(); //force unlock of vm mutex

    Quotas::vm_del(uid, gid, quota_tmpl.get());

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
        if (auto vr = vrouterpool->get(vrid))
        {
            vr->del_vmid(vmid);

            vrouterpool->update(vr.get());
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

    auto vm = vmpool->get(vid);

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
            lcm->trigger_shutdown(vid, false, ra);
            break;

        case VirtualMachine::INIT:
        case VirtualMachine::PENDING:
        case VirtualMachine::HOLD:
        case VirtualMachine::CLONING:
        case VirtualMachine::CLONING_FAILURE:
            free_vm_resources(std::move(vm), true);
            break;

        case VirtualMachine::DONE:
            break;

        case VirtualMachine::ACTIVE:
            switch (vm->get_lcm_state())
            {
                case VirtualMachine::RUNNING:
                case VirtualMachine::UNKNOWN:
                    lcm->trigger_shutdown(vid, hard, ra);
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
                    lcm->trigger_delete(vid, ra);
                    break;

                case VirtualMachine::SHUTDOWN:
                    if (hard)
                    {
                        // Override previous (probably freezed) shutdown action
                        lcm->trigger_shutdown(vid, hard, ra);
                        break;
                    }
                    // else fallthrough to default
                    [[fallthrough]];
                default:
                    oss.str("");
                    oss << "Could not terminate VM " << vid
                        << ", wrong state " << vm->state_str() << ".";

                    NebulaLog::log("DiM",Log::ERROR,oss);
                    error_str = oss.str();

                    rc = -2;
                    break;
            }
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

    auto vm = vmpool->get_ro(vid);

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
            lcm->trigger_undeploy_hard(vid, ra);
        }
        else
        {
            lcm->trigger_undeploy(vid, ra);
        }
    }
    else if ( hard &&
              vm->get_state() == VirtualMachine::ACTIVE &&
              vm->get_lcm_state() == VirtualMachine::SHUTDOWN_UNDEPLOY)
    {
        lcm->trigger_undeploy_hard(vid, ra);
    }
    else
    {
        goto error;
    }

    return 0;

error:
    oss.str("");
    oss << "Could not undeploy VM " << vid
        << ", wrong state " << vm->state_str() << ".";
    NebulaLog::log("DiM",Log::ERROR,oss);

    oss.str("");
    oss << "This action is not available for state " << vm->state_str();
    error_str = oss.str();

    return -2;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::poweroff(int vid, bool hard, const RequestAttributes& ra,
        string& error_str)
{
    ostringstream oss;

    auto vm = vmpool->get_ro(vid);

    if ( vm == nullptr )
    {
        return -1;
    }

    oss << "Powering off VM " << vid;
    NebulaLog::log("DiM",Log::DEBUG,oss);

    auto lcm_state = vm->get_lcm_state();

    if (vm->get_state() == VirtualMachine::ACTIVE &&
        (lcm_state == VirtualMachine::RUNNING ||
         lcm_state == VirtualMachine::UNKNOWN))
    {
        if (hard)
        {
            lcm->trigger_poweroff_hard(vid, ra);
        }
        else
        {
            lcm->trigger_poweroff(vid, ra);
        }
    }
    else if (hard &&
             vm->get_state() == VirtualMachine::ACTIVE &&
             lcm_state == VirtualMachine::SHUTDOWN_POWEROFF )
    {
        lcm->trigger_poweroff_hard(vid, ra);
    }
    else
    {
        goto error;
    }

    return 0;

error:

    oss.str("");
    oss << "Could not power off VM " << vid
        << ", wrong state " << vm->state_str() << ".";
    NebulaLog::log("DiM",Log::ERROR,oss);

    oss.str("");
    oss << "This action is not available for state " << vm->state_str();
    error_str = oss.str();

    return -2;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::hold(int vid, const RequestAttributes& ra,
        string& error_str)
{
    ostringstream oss;

    auto vm = vmpool->get(vid);

    if ( vm == nullptr )
    {
        return -1;
    }

    oss << "Holding VM " << vid;
    NebulaLog::log("DiM",Log::DEBUG,oss);

    if (vm->get_state() == VirtualMachine::PENDING)
    {
        vm->set_state(VirtualMachine::HOLD);

        vmpool->update(vm.get());
    }
    else
    {
        goto error;
    }

    return 0;

error:

    oss.str("");
    oss << "Could not hold VM " << vid
        << ", wrong state " << vm->state_str() << ".";
    NebulaLog::log("DiM",Log::ERROR,oss);

    oss.str("");
    oss << "This action is not available for state " << vm->state_str();
    error_str = oss.str();

    return -2;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::release(int vid, const RequestAttributes& ra,
        string& error_str)
{
    ostringstream oss;

    auto vm = vmpool->get(vid);

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
            vmpool->update(vm.get());

            goto error_requirements;
        }

        vm->set_state(VirtualMachine::PENDING);

        vmpool->update(vm.get());
    }
    else
    {
        goto error_state;
    }

    return 0;

error_requirements:
    oss.str("");
    oss << "Could not release VM " << vid
        << ", error updating requirements. " << error_str;
    NebulaLog::log("DiM",Log::ERROR,oss);

    error_str = oss.str();

    return -2;

error_state:
    oss.str("");
    oss << "Could not release VM " << vid
        << ", wrong state " << vm->state_str() << ".";
    NebulaLog::log("DiM",Log::ERROR,oss);

    oss.str("");
    oss << "This action is not available for state " << vm->state_str();
    error_str = oss.str();

    return -2;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::stop(int vid, const RequestAttributes& ra,
        string& error_str)
{
    ostringstream oss;

    auto vm = vmpool->get_ro(vid);

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
        lcm->trigger_stop(vid, ra);
    }
    else
    {
        goto error;
    }

    return 0;

error:
    oss.str("");
    oss << "Could not stop VM " << vid
        << ", wrong state " << vm->state_str() << ".";
    NebulaLog::log("DiM",Log::ERROR,oss);

    oss.str("");
    oss << "This action is not available for state " << vm->state_str();
    error_str = oss.str();

    return -2;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::suspend(int vid, const RequestAttributes& ra,
        string& error_str)
{
    ostringstream oss;

    auto vm = vmpool->get_ro(vid);

    if ( vm == nullptr )
    {
        return -1;
    }

    oss << "Suspending VM " << vid;
    NebulaLog::log("DiM",Log::DEBUG,oss);

    if (vm->get_state()     == VirtualMachine::ACTIVE &&
        vm->get_lcm_state() == VirtualMachine::RUNNING )
    {
        lcm->trigger_suspend(vid, ra);
    }
    else
    {
        goto error;
    }

    return 0;

error:
    oss.str("");
    oss << "Could not suspend VM " << vid
        << ", wrong state " << vm->state_str() << ".";
    NebulaLog::log("DiM", Log::ERROR, oss);

    oss.str("");
    oss << "This action is not available for state " << vm->state_str();
    error_str = oss.str();

    return -2;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::resume(int vid, const RequestAttributes& ra,
        string& error_str)
{
    ostringstream oss;

    auto vm = vmpool->get(vid);

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
            vmpool->update(vm.get());

            goto error_requirements;
        }

        vm->set_state(VirtualMachine::PENDING);

        vmpool->update(vm.get());
    }
    else if (vm->get_state() == VirtualMachine::SUSPENDED)
    {
        lcm->trigger_restore(vid, ra);
    }
    else if ( vm->get_state() == VirtualMachine::POWEROFF ||
             (vm->get_state() == VirtualMachine::ACTIVE &&
              vm->get_lcm_state() == VirtualMachine::UNKNOWN))
    {
        lcm->trigger_restart(vid, ra);
    }
    else
    {
        goto error_state;
    }

    return 0;

error_requirements:
    oss.str("");
    oss << "Could not resume VM " << vid
        << ", error updating requirements. " << error_str;
    NebulaLog::log("DiM",Log::ERROR,oss);

    error_str = oss.str();

    return -2;

error_state:
    oss.str("");
    oss << "Could not resume VM " << vid
        << ", wrong state " << vm->state_str() << ".";
    NebulaLog::log("DiM",Log::ERROR,oss);

    oss.str("");
    oss << "This action is not available for state " << vm->state_str();
    error_str = oss.str();

    return -2;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::reboot(int vid, bool hard, const RequestAttributes& ra,
        string& error_str)
{
    ostringstream oss;

    auto vm = vmpool->get(vid);

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
            vmm->trigger_reset(vid);
        }
        else
        {
            vmm->trigger_reboot(vid);
        }

        vm->set_resched(false); //Rebooting cancels re-scheduling actions

        vmpool->update(vm.get());
    }
    else
    {
        goto error;
    }

    return 0;

error:
    oss.str("");
    oss << "Could not reboot VM " << vid
        << ", wrong state " << vm->state_str() << ".";
    NebulaLog::log("DiM",Log::ERROR,oss);

    oss.str("");
    oss << "This action is not available for state " << vm->state_str();
    error_str = oss.str();

    return -2;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::resched(int vid, bool do_resched,
        const RequestAttributes& ra, string& error_str)
{
    ostringstream oss;

    auto vm = vmpool->get(vid);

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
                vmpool->update(vm.get());

                goto error_requirements;
            }
        }

        vm->set_resched(do_resched);
        vmpool->update(vm.get());
    }
    else
    {
        goto error_state;
    }

    return 0;

error_requirements:
    oss.str("");
    oss << "Could not set rescheduling flag for VM " << vid
        << ", error updating requirements. " << error_str;
    NebulaLog::log("DiM",Log::ERROR,oss);

    error_str = oss.str();

    return -2;

error_state:
    oss.str("");
    oss << "Could not set rescheduling flag for VM " << vid
        << ", wrong state " << vm->state_str() << ".";
    NebulaLog::log("DiM",Log::ERROR,oss);

    oss.str("");
    oss << "This action is not available for state " << vm->state_str();
    error_str = oss.str();

    return -2;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::recover(unique_ptr<VirtualMachine> vm, bool success,
         const RequestAttributes& ra, string& error_str)
{
    int rc = 0;
    int vid = vm->get_oid();

    switch (vm->get_state())
    {
        case VirtualMachine::CLONING_FAILURE:
            if (success)
            {
                lcm->trigger_disk_lock_success(vid);
            }
            else
            {
                lcm->trigger_disk_lock_failure(vid);
            }
            break;

        case VirtualMachine::ACTIVE:
            lcm->recover(vm.get(), success, ra);
            break;

        default:
            rc    = -1;

            ostringstream oss;
            oss << "Could not perform a recover operation on VM " << vm->get_oid()
                << ", wrong state " << vm->state_str() << ".";
            error_str = oss.str();

            break;
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::retry(unique_ptr<VirtualMachine> vm,
        const RequestAttributes& ra,
        string& error_str)
{
    int rc = 0;

    switch (vm->get_state())
    {
        case VirtualMachine::ACTIVE:
            lcm->retry(vm.get());
            break;

        default:
            rc    = -1;

            ostringstream oss;
            oss << "Could not perform a retry on VM " << vm->get_oid()
                << ", wrong state " << vm->state_str() << ".";
            error_str = oss.str();

            break;
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::delete_vm(unique_ptr<VirtualMachine> vm,
        const RequestAttributes& ra,
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
        if (auto host = hpool->get_ro(host_id))
        {
            is_public_host = host->is_public_cloud();
        }
        else
        {
            oss << "Error getting host " << host_id;
            error = oss.str();

            return -1;
        }
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
                vmm->trigger_cleanup(vid, false);
            }
            else
            {
                tm->trigger_epilog_delete(vm.get());
            }

            free_vm_resources(std::move(vm), true);
        break;

        case VirtualMachine::STOPPED:
        case VirtualMachine::UNDEPLOYED:
            if (is_public_host)
            {
                vmm->trigger_cleanup(vid, false);
            }
            else
            {
                tm->trigger_epilog_delete(vm.get());
            }

            free_vm_resources(std::move(vm), true);
        break;

        case VirtualMachine::INIT:
        case VirtualMachine::PENDING:
        case VirtualMachine::HOLD:
        case VirtualMachine::CLONING:
        case VirtualMachine::CLONING_FAILURE:
            free_vm_resources(std::move(vm), true);
        break;

        case VirtualMachine::ACTIVE:
            lcm->trigger_delete(vid, ra);
        break;

        case VirtualMachine::DONE:
        break;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::delete_vm(int vid, const RequestAttributes& ra,
        std::string& error_str)
{
    auto vm = vmpool->get(vid);

    if ( vm == nullptr )
    {
        error_str = "Virtual machine does not exist";
        return -1;
    }

    return delete_vm(std::move(vm), ra, error_str);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::delete_recreate(unique_ptr<VirtualMachine> vm,
        const RequestAttributes& ra, string& error)
{
    int rc = 0;

    Template vm_quotas_snp;

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

            vm->delete_non_persistent_disk_snapshots(vm_quotas_snp,
                    ds_quotas_snp);

            do_quotas = true;

            [[fallthrough]];

        case VirtualMachine::HOLD:
            if (vm->hasHistory())
            {
                vm->set_action(VMActions::DELETE_RECREATE_ACTION, ra.uid, ra.gid,
                        ra.req_id);
                vmpool->update_history(vm.get());
            }

            // Automatic requirements are not recalculated on purpose

            vm->set_state(VirtualMachine::LCM_INIT);
            vm->set_state(VirtualMachine::PENDING);

            vmpool->update(vm.get());

            if ( do_quotas )
            {
                vm->get_quota_template(quota_tmpl, true);
            }
        break;

        case VirtualMachine::ACTIVE: //Cleanup VM resources before PENDING
            lcm->trigger_delete_recreate(vm->get_oid(), ra);
        break;

        case VirtualMachine::DONE:
            error = "Cannot delete-recreate a VM already in DONE state";
            NebulaLog::log("DiM", Log::ERROR, error);
            rc = -1;
        break;
    }

    vm.reset(); //force unlock of vm mutex

    if ( !ds_quotas_snp.empty() )
    {
        Quotas::ds_del_recreate(vm_uid, vm_gid, ds_quotas_snp);
    }

    if ( !vm_quotas_snp.empty() )
    {
        Quotas::vm_del(vm_uid, vm_gid, &vm_quotas_snp);
    }

    if ( do_quotas )
    {
        Quotas::vm_check(vm_uid, vm_gid, &quota_tmpl, error);
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::delete_vm_db(unique_ptr<VirtualMachine> vm,
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

            [[fallthrough]];

        case VirtualMachine::STOPPED:
        case VirtualMachine::UNDEPLOYED:
        case VirtualMachine::INIT:
        case VirtualMachine::PENDING:
        case VirtualMachine::HOLD:
        case VirtualMachine::CLONING:
        case VirtualMachine::CLONING_FAILURE:
            free_vm_resources(std::move(vm), false);
        break;

        case VirtualMachine::DONE:
        break;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void DispatchManager::close_cp_history(VirtualMachinePool *vmpool,
        VirtualMachine *vm,
        VMActions::Action action,
        const RequestAttributes& ra)
{
    time_t the_time = time(0);
    bool set_retime = false;

    if (vm->get_running_etime() == 0)
    {
        vm->set_running_etime(the_time);
    }
    else
    {
        set_retime = true;
    }

    vm->set_etime(the_time);

    VMActions::Action current = vm->get_action();

    vm->set_action(action, ra.uid, ra.gid, ra.req_id);

    vmpool->update_history(vm);

    vm->cp_history();

    vm->set_internal_action(current);

    vm->set_stime(the_time);

    vm->set_running_stime(the_time);

    if (set_retime) //Keep VM not running
    {
        vm->set_running_etime(the_time);
    }

    vmpool->insert_history(vm);
}

/* -------------------------------------------------------------------------- */

int DispatchManager::attach(int vid, VirtualMachineTemplate * tmpl,
        const RequestAttributes& ra, string & err)
{
    ostringstream oss;

    auto vm = vmpool->get(vid);

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

        vmpool->update(vm.get());

        NebulaLog::log("DiM", Log::ERROR, err);
        return -1;
    }

    close_cp_history(vmpool, vm.get(), VMActions::DISK_ATTACH_ACTION, ra);

    if ( vm->get_lcm_state() == VirtualMachine::HOTPLUG )
    {
        vmm->trigger_attach(vid);
    }
    else
    {
        tm->trigger_prolog_attach(vm.get());
    }

    vmpool->update(vm.get());

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::detach(int vid, int disk_id, const RequestAttributes& ra,
        string&  error_str)
{
    ostringstream oss;

    auto vm = vmpool->get(vid);

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

        return -1;
    }

    if ( vm->set_attach_disk(disk_id) == -1 )
    {
        oss << "Could not detach disk with DISK_ID " << disk_id
            << ", it does not exist.";
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        return -1;
    }

    vm->set_resched(false);

    vm->set_vm_info();

    close_cp_history(vmpool, vm.get(), VMActions::DISK_DETACH_ACTION, ra);

    if ( vm->get_state() == VirtualMachine::ACTIVE &&
         vm->get_lcm_state() == VirtualMachine::RUNNING )
    {
        vm->set_state(VirtualMachine::HOTPLUG);

        vmm->trigger_detach(vid);
    }
    else
    {
        vm->set_state(VirtualMachine::ACTIVE);
        vm->set_state(VirtualMachine::HOTPLUG_EPILOG_POWEROFF);

        tm->trigger_epilog_detach(vm.get());
    }

    vmpool->update(vm.get());

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::snapshot_create(int vid, string& name, int& snap_id,
        const RequestAttributes& ra, string& error_str)
{
    ostringstream oss;

    auto vm = vmpool->get(vid);

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

        return -1;
    }

    vm->set_state(VirtualMachine::HOTPLUG_SNAPSHOT);

    vm->set_resched(false);

    vm->new_snapshot(name, snap_id);

    vmpool->update(vm.get());

    vmm->trigger_snapshot_create(vid);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::snapshot_revert(int vid, int snap_id,
        const RequestAttributes& ra, string& error_str)
{
    ostringstream oss;

    int rc;

    auto vm = vmpool->get(vid);

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

        return -1;
    }

    rc = vm->set_revert_snapshot(snap_id);

    if ( rc == -1 )
    {
        oss << "Could not revert VM " << vid << " to snapshot " << snap_id
            << ", it does not exist.";
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        return -1;
    }

    vm->set_state(VirtualMachine::HOTPLUG_SNAPSHOT);

    vm->set_resched(false);

    vmpool->update(vm.get());

    vmm->trigger_snapshot_revert(vid);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::snapshot_delete(int vid, int snap_id,
        const RequestAttributes& ra,string& error_str)
{
    ostringstream oss;

    int rc;

    auto vm = vmpool->get(vid);

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

        return -1;
    }

    rc = vm->set_delete_snapshot(snap_id);

    if ( rc == -1 )
    {
        oss << "Could not delete snapshot " << snap_id << " for VM " << vid
            << ", it does not exist.";
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        return -1;
    }

    vm->set_state(VirtualMachine::HOTPLUG_SNAPSHOT);

    vm->set_resched(false);

    vmpool->update(vm.get());

    vmm->trigger_snapshot_delete(vid);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::attach_nic(int vid, VirtualMachineTemplate* tmpl,
        const RequestAttributes& ra, string& error_str)
{
    ostringstream oss;

    auto vm = vmpool->get(vid);

    if ( vm == nullptr )
    {
        oss << "Could not add a new NIC to VM " << vid
            << ", VM does not exist";
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        return -1;
    }

    VirtualMachine::VmState  state     = vm->get_state();
    VirtualMachine::LcmState lcm_state = vm->get_lcm_state();

    bool is_running = state == VirtualMachine::ACTIVE &&
        lcm_state == VirtualMachine::RUNNING;

    bool is_poweroff = state == VirtualMachine::POWEROFF &&
        lcm_state == VirtualMachine::LCM_INIT;

    if (!is_running && !is_poweroff)
    {
        oss << "Could not add a new NIC to VM " << vid << ", wrong state "
            << vm->state_str() << ".";
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        return -1;
    }

    bool cold_attach = false;

    if ( vm->hasHistory() )
    {
        cold_attach = vmm->is_cold_nic_attach(vm->get_vmm_mad());
    }

    if (is_running)
    {
        vm->set_state(VirtualMachine::ACTIVE);
        vm->set_state(VirtualMachine::HOTPLUG_NIC);
    }
    else if (cold_attach && is_poweroff)
    {
        vm->set_state(VirtualMachine::ACTIVE);
        vm->set_state(VirtualMachine::HOTPLUG_NIC_POWEROFF);
    }
    //else POWEROFF && !cold_attach

    vm->set_resched(false);

    if ( vm->set_up_attach_nic(tmpl, error_str) != 0 )
    {
        if (vm->get_lcm_state() == VirtualMachine::HOTPLUG_NIC)
        {
            vm->set_state(VirtualMachine::ACTIVE);
            vm->set_state(VirtualMachine::RUNNING);
        }
        else if (vm->get_lcm_state() == VirtualMachine::HOTPLUG_NIC_POWEROFF)
        {
            vm->set_state(VirtualMachine::POWEROFF);
            vm->set_state(VirtualMachine::LCM_INIT);
        }
        //else POWEROFF / LCM_INIT

        vmpool->update(vm.get());

        NebulaLog::log("DiM", Log::ERROR, error_str);

        return -1;
    }

    VMActions::Action action;

    if ( tmpl->get("NIC") != 0 )
    {
        action = VMActions::NIC_ATTACH_ACTION;
    }
    else
    {
        action = VMActions::ALIAS_ATTACH_ACTION;
    }

    vm->set_vm_info();

    close_cp_history(vmpool, vm.get(), action, ra);

    if (vm->get_state() == VirtualMachine::ACTIVE)
    {
        vmm->trigger_attach_nic(vid);
    }
    else
    {
        vm->log("DiM", Log::INFO, "VM NIC Successfully attached.");

        vm->clear_attach_nic();

        vmpool->update_search(vm.get());

        time_t the_time = time(0);

        vm->set_running_etime(the_time);

        vmpool->update_history(vm.get());
    }

    vmpool->update(vm.get());

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::detach_nic(int vid, int nic_id, const RequestAttributes& ra,
        string&  error_str)
{
    ostringstream oss;

    auto vm = vmpool->get(vid);

    if ( vm == nullptr )
    {
        oss << "VirtualMachine " << vid << " no longer exists";
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);
        return -1;
    }

    VirtualMachine::VmState  state     = vm->get_state();
    VirtualMachine::LcmState lcm_state = vm->get_lcm_state();

    bool is_running = state == VirtualMachine::ACTIVE &&
        lcm_state == VirtualMachine::RUNNING;

    bool is_poweroff = state == VirtualMachine::POWEROFF &&
        lcm_state == VirtualMachine::LCM_INIT;

    if (!is_running && !is_poweroff)
    {
        oss << "Could not detach NIC from VM " << vid << ", wrong state "
            << vm->state_str() << ".";
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        return -1;
    }

    if ( vm->set_detach_nic(nic_id) == -1 )
    {
        oss << "Could not detach NIC with NIC_ID " << nic_id
            << ", it does not exist.";
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        return -1;
    }

    VMActions::Action action;

    if ( !vm->get_nic(nic_id)->is_alias() )
    {
        action = VMActions::NIC_DETACH_ACTION;
    }
    else
    {
        action = VMActions::ALIAS_DETACH_ACTION;
    }

    vm->set_vm_info();

    close_cp_history(vmpool, vm.get(), action, ra);

    bool cold_attach = false;

    if ( vm->hasHistory() )
    {
        cold_attach = vmm->is_cold_nic_attach(vm->get_vmm_mad());
    }

    if (is_running || (cold_attach && is_poweroff))
    {
        vm->set_state(VirtualMachine::ACTIVE);

        if ( is_running )
        {
            vm->set_state(VirtualMachine::HOTPLUG_NIC);
        }
        else
        {
            vm->set_state(VirtualMachine::HOTPLUG_NIC_POWEROFF);
        }

        vm->set_resched(false);

        vmpool->update(vm.get());

        vmm->trigger_detach_nic(vid);
    }
    else
    {
        vm->log("DiM", Log::INFO, "VM NIC Successfully detached.");

        vmpool->update(vm.get());

        vmpool->update_search(vm.get());

        vmpool->delete_attach_nic(std::move(vm));
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::update_nic(int vid, int nic_id, VirtualMachineTemplate* tmpl,
        bool append, const RequestAttributes& ra, std::string& error_str)
{
    ostringstream oss;
    oss << "Error updating NIC (" << nic_id << ") for VM " << vid << ": ";

    auto vm = vmpool->get(vid);

    if ( !vm )
    {
        oss << "VM does not exist";
        error_str = oss.str();

        NebulaLog::error("DiM", error_str);

        return -1;
    }

    VirtualMachineNic *nic = vm->get_nic(nic_id);

    if ( !nic )
    {
        oss << "NIC does not exist";
        error_str = oss.str();

        NebulaLog::error("DiM", error_str);

        return -1;
    }

    VirtualMachine::VmState  state     = vm->get_state();
    VirtualMachine::LcmState lcm_state = vm->get_lcm_state();

    bool is_update = false;

    if (state == VirtualMachine::ACTIVE)
    {
        if (lcm_state == VirtualMachine::RUNNING)
        {
            is_update = true;
        }
        else
        {
            oss << "Wrong state " << vm->state_str();
            error_str = oss.str();

            NebulaLog::error("DiM", error_str);

            return -1;
        }
    }

    // Get new nic from the template
    auto nic_va = tmpl->get("NIC");

    if (!nic_va)
    {
        oss << "Wrong NIC definition, attribute is missing";
        error_str = oss.str();

        return -1;
    }

    VectorAttribute* va;

    if (append)
    {
        va = nic->vector_attribute()->clone();

        va->merge(nic_va, true);
    }
    else
    {
        va = nic_va;
    }

    VirtualMachineNic new_nic(va, nic_id);

    auto rc = vm->nic_update(nic_id, &new_nic, is_update);

    if (is_update && rc > 0)
    {
        int net_id = -1;

        vm->set_state(VirtualMachine::HOTPLUG_NIC);

        vm->set_vm_info();

        close_cp_history(vmpool, vm.get(), VMActions::NIC_UPDATE_ACTION, ra);

        nic->vector_value("NETWORK_ID", net_id);

        vmm->updatenic(vm.get(), net_id);
    }

    if (append)
    {
        delete va;
    }

    vmpool->update(vm.get());

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::recover_nic(int vid, int nic_id, int network_id,
        string& error_str)
{
    ostringstream oss;
    oss << "Error recovering NIC (" << nic_id << ") for VM " << vid << ": ";

    if (auto vn = vnpool->get(network_id))
    {
        vn->clear_update_vm(vid);
        vn->add_updating(vid);

        vnpool->update(vn.get());
    }

    auto vm = vmpool->get_ro(vid);

    if (!vm)
    {
        oss << "VM does not exist";
        error_str = oss.str();

        NebulaLog::error("DiM", error_str);

        return -1;
    }

    VirtualMachineNic *nic = vm->get_nic(nic_id);

    if ( !nic )
    {
        oss << "NIC does not exist";
        error_str = oss.str();

        NebulaLog::error("DiM", error_str);

        return -1;
    }

    VirtualMachine::VmState  state     = vm->get_state();
    VirtualMachine::LcmState lcm_state = vm->get_lcm_state();

    if (state == VirtualMachine::ACTIVE &&
        (lcm_state == VirtualMachine::BOOT ||
         lcm_state == VirtualMachine::BOOT_MIGRATE ||
         lcm_state == VirtualMachine::BOOT_SUSPENDED ||
         lcm_state == VirtualMachine::BOOT_STOPPED ||
         lcm_state == VirtualMachine::BOOT_UNDEPLOY ||
         lcm_state == VirtualMachine::BOOT_POWEROFF ||
         lcm_state == VirtualMachine::BOOT_UNKNOWN ||
         lcm_state == VirtualMachine::BOOT_FAILURE ||
         lcm_state == VirtualMachine::BOOT_MIGRATE_FAILURE ||
         lcm_state == VirtualMachine::BOOT_UNDEPLOY_FAILURE ||
         lcm_state == VirtualMachine::BOOT_STOPPED_FAILURE ||
         lcm_state == VirtualMachine::MIGRATE ||
         lcm_state == VirtualMachine::HOTPLUG_NIC ||
         lcm_state == VirtualMachine::HOTPLUG_NIC_POWEROFF ||
         lcm_state == VirtualMachine::UNKNOWN ))
    {
        oss << "VM in wrong state " << vm->state_str();
        error_str = oss.str();

        NebulaLog::error("DiM", error_str);

        return -1;
    }
    else if (state == VirtualMachine::ACTIVE &&
        (lcm_state == VirtualMachine::RUNNING ||
         lcm_state == VirtualMachine::HOTPLUG ||
         lcm_state == VirtualMachine::HOTPLUG_SNAPSHOT ||
         lcm_state == VirtualMachine::HOTPLUG_SAVEAS ||
         lcm_state == VirtualMachine::HOTPLUG_RESIZE ||
         lcm_state == VirtualMachine::DISK_SNAPSHOT ||
         lcm_state == VirtualMachine::DISK_SNAPSHOT_DELETE ||
         lcm_state == VirtualMachine::DISK_RESIZE))
    {
        vmm->updatenic(vm.get(), network_id);
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::disk_snapshot_create(int vid, int did, const string& name,
        int& snap_id, const RequestAttributes& ra, string& error_str)
{
    ostringstream oss;

    auto vm = vmpool->get(vid);

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

        return -1;
    }

    // Set the VM info in the history before the snapshot is added to VM
    vm->set_vm_info();

    snap_id = vm->new_disk_snapshot(did, name, error_str);

    if (snap_id == -1)
    {
        return -1;
    }

    switch (state)
    {
        case VirtualMachine::POWEROFF:
            vm->set_state(VirtualMachine::ACTIVE);
            vm->set_state(VirtualMachine::DISK_SNAPSHOT_POWEROFF);

            tm->trigger_snapshot_create(vid);
            break;

        case VirtualMachine::SUSPENDED:
            vm->set_state(VirtualMachine::ACTIVE);
            vm->set_state(VirtualMachine::DISK_SNAPSHOT_SUSPENDED);

            tm->trigger_snapshot_create(vid);
            break;

        case VirtualMachine::ACTIVE:
            vm->set_state(VirtualMachine::ACTIVE);
            vm->set_state(VirtualMachine::DISK_SNAPSHOT);

            vmm->trigger_disk_snapshot_create(vid);
            break;

        default: break;
    }

    close_cp_history(vmpool, vm.get(), VMActions::DISK_SNAPSHOT_CREATE_ACTION, ra);

    vmpool->update(vm.get());

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::disk_snapshot_revert(int vid, int did, int snap_id,
        const RequestAttributes& ra, string& error_str)
{
    ostringstream oss;

    auto vm = vmpool->get(vid);

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

    if (state != VirtualMachine::POWEROFF || lstate != VirtualMachine::LCM_INIT)
    {
        oss << "Could not revert to disk snapshot for VM " << vid
            << ", wrong state " << vm->state_str() << ".";
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        return -1;
    }

    const Snapshots * snaps = vm->get_disk_snapshots(did, error_str);

    if (snaps == nullptr)
    {
        return -1;
    }

    if (vm->set_snapshot_disk(did, snap_id) == -1)
    {
        oss << "Disk id (" << did << ") or snapshot id ("
            << snap_id << ") is not valid.";

        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);
        return -1;
    }

    vm->set_vm_info();

    close_cp_history(vmpool, vm.get(), VMActions::DISK_SNAPSHOT_REVERT_ACTION, ra);

    vm->set_state(VirtualMachine::ACTIVE);
    vm->set_state(VirtualMachine::DISK_SNAPSHOT_REVERT_POWEROFF);

    vmpool->update(vm.get());

    tm->trigger_snapshot_revert(vid);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::disk_snapshot_delete(int vid, int did, int snap_id,
        const RequestAttributes& ra, string& error_str)
{

    auto vm = vmpool->get(vid);

    if ( vm == nullptr )
    {
        ostringstream oss;

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
        ostringstream oss;

        oss << "Could not delete disk snapshot from VM " << vid
            << ", wrong state " << vm->state_str() << ".";
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        return -1;
    }

    const Snapshots * snaps = vm->get_disk_snapshots(did, error_str);

    if (snaps == nullptr)
    {
        return -1;
    }

    const VirtualMachineDisk * disk = vm->get_disk(did);

    if (disk == nullptr)
    {
        return -1;
    }

    if (!snaps->test_delete(snap_id, disk->is_persistent(), error_str))
    {
        return -1;
    }

    if (vm->set_snapshot_disk(did, snap_id) == -1)
    {
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

    close_cp_history(vmpool, vm.get(), VMActions::DISK_SNAPSHOT_DELETE_ACTION, ra);

    tm->trigger_snapshot_delete(vid);

    vmpool->update(vm.get());

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::disk_resize(int vid, int did, long long new_size,
        const RequestAttributes& ra, string& error_str)
{
    ostringstream oss;

    auto vm = vmpool->get(vid);

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

        return -1;
    }

    // Set the VM info in the history before the disk is resized
    vm->set_vm_info();

    int rc = vm->set_up_resize_disk(did, new_size, error_str);

    if (rc == -1)
    {
        return -1;
    }

    switch (state)
    {
        case VirtualMachine::POWEROFF:
            vm->set_state(VirtualMachine::ACTIVE);
            vm->set_state(VirtualMachine::DISK_RESIZE_POWEROFF);

            tm->trigger_resize(vid);
            break;

        case VirtualMachine::UNDEPLOYED:
            vm->set_state(VirtualMachine::ACTIVE);
            vm->set_state(VirtualMachine::DISK_RESIZE_UNDEPLOYED);

            tm->trigger_resize(vid);
            break;

        case VirtualMachine::ACTIVE:
            vm->set_state(VirtualMachine::ACTIVE);
            vm->set_state(VirtualMachine::DISK_RESIZE);

            vmm->trigger_disk_resize(vid);
            break;

        default: break;
    }

    close_cp_history(vmpool, vm.get(), VMActions::DISK_RESIZE_ACTION, ra);

    vmpool->update(vm.get());
    vmpool->update_search(vm.get());

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::live_updateconf(std::unique_ptr<VirtualMachine> vm,
        const RequestAttributes& ra, string& error_str)
{
    ostringstream oss;

    VirtualMachine::VmState  state  = vm->get_state();
    VirtualMachine::LcmState lstate = vm->get_lcm_state();

    // Allowed only for state ACTIVE and RUNNING
    if (state != VirtualMachine::ACTIVE || lstate != VirtualMachine::RUNNING)
    {
        oss << "Could not perform live updateconf for " << vm->get_oid()
            << ", wrong state " << vm->state_str() << ".";
        error_str = oss.str();

        NebulaLog::log("DiM", Log::ERROR, error_str);

        return -1;
    }

    // Set VM state
    vm->set_state(VirtualMachine::HOTPLUG);
    vm->set_resched(false);

    // Trigger UPDATE CONF action
    vmm->trigger_update_conf(vm->get_oid());

    vmpool->update(vm.get());
    vmpool->update_search(vm.get());

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::attach_sg(int vid, int nicid, int sgid,
        const RequestAttributes& ra, string& error_str)
{
    ostringstream oss;

    bool is_update = false;

    // -------------------------------------------------------------------------
    // Check action consistency:
    // - Object exists VM, NIC and SG
    // - State is compatible with operation
    // -------------------------------------------------------------------------
    if ( sgpool->exist(sgid) < 0 )
    {
        oss << "Could not attach SG " << sgid << " to VM, SG does not exist";
        error_str = oss.str();

        return -1;
    }

    if ( auto vm = vmpool->get(vid) )
    {
        VirtualMachine::LcmState lstate = vm->get_lcm_state();

        switch (lstate)
        {
            //Cannnot update VM, SG rules being updated/created
            case VirtualMachine::BOOT:
            case VirtualMachine::BOOT_MIGRATE:
            case VirtualMachine::BOOT_SUSPENDED:
            case VirtualMachine::BOOT_STOPPED:
            case VirtualMachine::BOOT_UNDEPLOY:
            case VirtualMachine::BOOT_POWEROFF:
            case VirtualMachine::BOOT_UNKNOWN:
            case VirtualMachine::BOOT_FAILURE:
            case VirtualMachine::BOOT_MIGRATE_FAILURE:
            case VirtualMachine::BOOT_UNDEPLOY_FAILURE:
            case VirtualMachine::BOOT_STOPPED_FAILURE:
            case VirtualMachine::MIGRATE:
            case VirtualMachine::HOTPLUG_NIC:
            case VirtualMachine::HOTPLUG_NIC_POWEROFF:
            case VirtualMachine::UNKNOWN:
                oss << "VM " << vid << " is in wrong state " << vm->state_str();
                error_str = oss.str();

                return -1;

            //Update SG rules at host
            case VirtualMachine::RUNNING:
            case VirtualMachine::HOTPLUG:
            case VirtualMachine::HOTPLUG_SNAPSHOT:
            case VirtualMachine::HOTPLUG_SAVEAS:
            case VirtualMachine::HOTPLUG_RESIZE:
            case VirtualMachine::DISK_SNAPSHOT:
            case VirtualMachine::DISK_SNAPSHOT_DELETE:
            case VirtualMachine::DISK_RESIZE:
                is_update = true;
                break;

            default:
                break;
        }

        auto nic = vm->get_nic(nicid);

        if ( nic == nullptr )
        {
            oss << "VM " << vid << " doesn't have NIC id " << nicid;
            error_str = oss.str();

            return -1;
        }

        set<int> sgs;
        nic->get_security_groups(sgs);

        if (sgs.find(sgid) != sgs.end())
        {
            oss << "VM " << vid << " SG " << sgid << " already in NIC " << nicid;
            error_str = oss.str();

            return -1;
        }

        // ----------------------------------------------------------------------
        // Update VM data
        // - NIC to include new SG
        // - Template to include new SG rules (note can be there already)
        // ----------------------------------------------------------------------
        vector<VectorAttribute *> sg_rules;

        sgpool->get_security_group_rules(-1, sgid, sg_rules);

        nic->add_security_group(sgid);

        vm->remove_security_group(sgid); //duplicates

        vm->add_template_attribute(sg_rules);

        vmpool->update(vm.get());

        if ( is_update )
        {
            vmm->updatesg(vm.get(), sgid);
        }
    }
    else
    {
        oss << "Could not attach SG to VM " << vid << ", VM does not exist";
        error_str = oss.str();

        return -1;
    }

    if (auto sg = sgpool->get(sgid))
    {
        sg->del_vm(vid);

        if ( is_update )
        {
            sg->add_updating(vid);
        }
        else
        {
            sg->add_vm(vid);
        }

        sgpool->update(sg.get());
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::detach_sg(int vid, int nicid, int sgid,
        const RequestAttributes& ra, string& error_str)
{
    ostringstream oss;

    bool is_update = false;

    vector<VectorAttribute *> sg_rules;

    // -------------------------------------------------------------------------
    // Check action consistency:
    // - Object exists VM, NIC and SG
    // - State is compatible with operation
    // -------------------------------------------------------------------------
    if ( auto vm = vmpool->get(vid) )
    {
        VirtualMachine::LcmState lstate = vm->get_lcm_state();

        switch (lstate)
        {
            //Cannnot update VM, SG rules being updated/created
            case VirtualMachine::BOOT:
            case VirtualMachine::BOOT_MIGRATE:
            case VirtualMachine::BOOT_SUSPENDED:
            case VirtualMachine::BOOT_STOPPED:
            case VirtualMachine::BOOT_UNDEPLOY:
            case VirtualMachine::BOOT_POWEROFF:
            case VirtualMachine::BOOT_UNKNOWN:
            case VirtualMachine::BOOT_FAILURE:
            case VirtualMachine::BOOT_MIGRATE_FAILURE:
            case VirtualMachine::BOOT_UNDEPLOY_FAILURE:
            case VirtualMachine::BOOT_STOPPED_FAILURE:
            case VirtualMachine::MIGRATE:
            case VirtualMachine::HOTPLUG_NIC:
            case VirtualMachine::HOTPLUG_NIC_POWEROFF:
            case VirtualMachine::UNKNOWN:
                oss << "VM " << vid << " is in wrong state " << vm->state_str();
                error_str = oss.str();

                return -1;

            //Update SG rules at host
            case VirtualMachine::RUNNING:
            case VirtualMachine::HOTPLUG:
            case VirtualMachine::HOTPLUG_SNAPSHOT:
            case VirtualMachine::HOTPLUG_SAVEAS:
            case VirtualMachine::HOTPLUG_RESIZE:
            case VirtualMachine::DISK_SNAPSHOT:
            case VirtualMachine::DISK_SNAPSHOT_DELETE:
            case VirtualMachine::DISK_RESIZE:
                is_update = true;
                break;

            default:
                break;
        }

        auto nic = vm->get_nic(nicid);

        if ( nic == nullptr )
        {
            oss << "VM " << vid << " doesn't have NIC id " << nicid;
            error_str = oss.str();

            return -1;
        }

        set<int> sgs;
        nic->get_security_groups(sgs);

        if (sgs.find(sgid) == sgs.end())
        {
            oss << "VM " << vid << " NIC " << nicid << " doesn't contain SG " << sgid;
            error_str = oss.str();

            return -1;
        }

        // ----------------------------------------------------------------------
        // Update VM data
        // - NIC to remove SG
        // - Template with remaining SG rules (could be empty)
        // ----------------------------------------------------------------------
        nic->remove_security_group(sgid);

        vm->remove_security_group(sgid);

        sgs.clear();
        vm->get_security_groups(sgs);

        if (sgs.find(sgid) != sgs.end())
        {
            sgpool->get_security_group_rules(-1, sgid, sg_rules);

            vm->add_template_attribute(sg_rules);
        }

        vmpool->update(vm.get());

        if ( is_update )
        {
            vmm->updatesg(vm.get(), sgid);
        }
    }
    else
    {
        oss << "Could not attach SG to VM " << vid << ", VM does not exist";
        error_str = oss.str();

        return -1;
    }

    if (auto sg = sgpool->get(sgid))
    {
        sg->del_vm(vid);

        if (!sg_rules.empty())
        {
            // The SG is in other NIC, keep the VM in the SG list
            if ( is_update )
            {
                sg->add_updating(vid);
            }
            else
            {
                sg->add_vm(vid);
            }
        }

        sgpool->update(sg.get());
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::backup(int vid, int backup_ds_id, bool reset,
        const RequestAttributes& ra, string& error_str)
{
    ostringstream oss;

    auto vm = vmpool->get(vid);

    if ( vm == nullptr )
    {
        oss << "Could not create a new backup for VM " << vid
            << ", VM does not exist";
        error_str = oss.str();

        return -1;
    }

    // -------------------------------------------------------------------------
    // Set BACKUP state
    // -------------------------------------------------------------------------
    VirtualMachine::VmState state = vm->get_state();

    if ( vm->backups().active_flatten() )
    {
        oss << "Could not create a new backup for VM " << vid
            << ", consolidating backup increments";
        error_str = oss.str();

        return -1;
    }

    switch (state)
    {
        case VirtualMachine::ACTIVE:
            if (vm->get_lcm_state() != VirtualMachine::RUNNING)
            {
                oss << "Could not create a new backup for VM " << vid
                    << ", wrong state " << vm->state_str() << ".";
                error_str = oss.str();

                return -1;
            }

            vm->set_state(VirtualMachine::BACKUP);
            break;

        case VirtualMachine::POWEROFF:
            vm->set_state(VirtualMachine::ACTIVE);
            vm->set_state(VirtualMachine::BACKUP_POWEROFF);
            break;

        default:
            oss << "Could not create a new backup for VM " << vid
                << ", wrong state " << vm->state_str() << ".";

            error_str = oss.str();
            return -1;
    }

    vm->backups().last_datastore_id(backup_ds_id);

    if (reset)
    {
        vm->backups().last_increment_id(-1);
        vm->backups().incremental_backup_id(-1);
    }

    vmm->trigger_backup(vid);

    vm->set_resched(false);

    vm->set_vm_info();

    close_cp_history(vmpool, vm.get(), VMActions::BACKUP_ACTION, ra);

    vmpool->update(vm.get());

    vm.reset();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int DispatchManager::backup_cancel(int vid,
        const RequestAttributes& ra, string& error_str)
{
    ostringstream oss;

    VirtualMachine::LcmState state;

    if ( auto vm = vmpool->get(vid) )
    {
        state = vm->get_lcm_state();
    }
    else
    {
        oss << "Could not cancel backup for VM " << vid
            << ", VM does not exist";
        error_str = oss.str();

        return -1;
    }

    // Check backup state
    if (state != VirtualMachine::BACKUP &&
        state != VirtualMachine::BACKUP_POWEROFF)
    {
        oss << "Could not cancel backup for VM " << vid
            << ", no backup in progress";
        error_str = oss.str();

        return -1;
    }

    vmm->trigger_backup_cancel(vid);

    return 0;
}
