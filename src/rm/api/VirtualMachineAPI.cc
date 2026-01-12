/* -------------------------------------------------------------------------- */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                */
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

#include "VirtualMachineAPI.h"
#include "RequestLogger.h"
#include "ClusterPool.h"
#include "DatastorePool.h"
#include "HostPool.h"
#include "ImagePool.h"
#include "ScheduledActionPool.h"
#include "DispatchManager.h"
#include "VirtualMachineManager.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* Static methods                                                             */
/* -------------------------------------------------------------------------- */

/**
 *  Adds extra info to the volatile disks of the given template, ds inherited
 *  attributes and TYPE
 *    @param ds_id datastore id
 *    @param vd vector of DISKS
 *    @return true if there at least one volatile disk was found
 */
static bool set_volatile_disk_info(VirtualMachine *vm, int ds_id)
{
    VirtualMachineDisks& disks = vm->get_disks();

    bool found = disks.volatile_info(ds_id);

    if ( found )
    {
        Nebula::instance().get_vmpool()->update(vm);
    }

    return found;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static bool set_volatile_disk_info(int ds_id, Template& tmpl)
{
    VirtualMachineDisks disks(&tmpl, false);

    bool found = disks.volatile_info(ds_id);

    return found;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static int set_vnc_port(VirtualMachine *vm, int cluster_id, RequestAttributes& att)
{
    Nebula& nd = Nebula::instance();
    ClusterPool * cpool = nd.get_clpool();

    VectorAttribute * graphics = vm->get_template_attribute("GRAPHICS");

    unsigned int port;
    int rc;

    if ( !graphics )
    {
        return 0;
    }
    else if ( vm->hasHistory() && vm->get_action() == VMActions::STOP_ACTION )
    {
        return 0;
    }
    else if ( graphics->vector_value("PORT", port) == 0 )
    {
        rc = cpool->set_vnc_port(cluster_id, port);

        if ( rc != 0 )
        {
            att.resp_msg = "Requested VNC port already assigned to a VM";
        }
    }
    else
    {
        rc = cpool->get_vnc_port(cluster_id, vm->get_oid(), port);

        if ( rc == 0 )
        {
            graphics->replace("PORT", port);

            nd.get_vmpool()->update(vm);
        }
        else
        {
            att.resp_msg = "No free VNC ports available in the cluster";
        }
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static int set_migrate_vnc_port(VirtualMachine *vm, int cluster_id, bool keep)
{
    ClusterPool * cpool = Nebula::instance().get_clpool();

    VectorAttribute * graphics = vm->get_template_attribute("GRAPHICS");

    unsigned int previous_port;
    unsigned int port;

    int rc;

    // Do not update VM if no GRAPHICS or GRAPHICS/PORT defined
    if (graphics == nullptr)
    {
        return 0;
    }

    if (graphics->vector_value("PORT", previous_port) != 0)
    {
        return 0;
    }

    //live migrations need to keep VNC port
    if (keep)
    {
        rc = cpool->set_vnc_port(cluster_id, previous_port);

        port = previous_port;
    }
    else
    {
        rc = cpool->get_vnc_port(cluster_id, vm->get_oid(), port);
    }

    if ( rc != 0 )
    {
        return -1;
    }

    graphics->replace("PREVIOUS_PORT", previous_port);
    graphics->replace("PORT", port);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* API                                                                        */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::update(int oid,
                                             const std::string& tmpl,
                                             int update_type,
                                             RequestAttributes& att)
{
    int rc;

    att.set_auth_op(VMActions::UPDATE_ACTION);

    if ( auto ec = basic_authorization(oid, att); ec != Request::SUCCESS )
    {
        return ec;
    }

    if ( update_type < 0 || update_type > 1 )
    {
        att.resp_msg = "Wrong update type";

        return Request::RPC_API;
    }

    auto vm = vmpool->get(oid);

    if ( vm == nullptr )
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    // Apply generic quota deltas
    auto new_tmpl = make_unique<VirtualMachineTemplate>(false, '=', "USER_TEMPLATE");

    if ( new_tmpl->parse_str_or_xml(tmpl, att.resp_msg) != 0 )
    {
        return Request::ACTION;
    }

    if ( update_type == 1 ) //append mode
    {
        auto user_tmpl = vm->clone_user_template();

        user_tmpl->merge(new_tmpl.get());

        new_tmpl.swap(user_tmpl);
    }

    // Compute quota deltas (only generic quota may appear in User template)
    bool do_quotas = false;

    for ( const string& metric : QuotaVirtualMachine::generic_metrics())
    {
        float value_new, value_old;

        bool exists_old = vm->get_user_template_attribute(metric, value_old);
        bool exists_new = new_tmpl->get(metric, value_new);

        if ( exists_old || exists_new )
        {
            float delta = value_new - value_old;

            new_tmpl->replace(metric, delta);

            do_quotas |= delta != 0;
        }
    }

    if (vm->is_running_quota())
    {
        QuotaVirtualMachine::add_running_quota_generic(*new_tmpl);
    }

    RequestAttributes att_quota(att);

    att_quota.uid = vm->get_uid();
    att_quota.gid = vm->get_gid();

    vm.reset();

    if ( do_quotas &&
         !quota_authorization(new_tmpl.get(), Quotas::VM, att_quota, att.resp_msg))
    {
        return Request::ACTION;
    }

    vm = vmpool->get(oid);

    if (update_type == 0)
    {
        rc = vm->replace_template(tmpl, !att.is_admin(), att.resp_msg);
    }
    else //if (update_type == 1)
    {
        rc = vm->append_template(tmpl, !att.is_admin(), att.resp_msg);
    }

    if ( rc != 0 )
    {
        vm.reset();

        if (do_quotas)
        {
            quota_rollback(new_tmpl.get(), Quotas::VIRTUALMACHINE, att_quota);
        }

        att.resp_msg = "Cannot update template. " + att.resp_msg;

        return Request::INTERNAL;
    }

    vmpool->update(vm.get());

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::rename(int oid,
                                             const std::string& new_name,
                                             RequestAttributes& att)
{
    att.set_auth_op(VMActions::RENAME_ACTION);

    return SharedAPI::rename(oid, new_name, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::deploy(int vid,
                                             int hid,
                                             bool enforce,
                                             int ds_id,
                                             const std::string& str_tmpl,
                                             RequestAttributes& att)
{
    Nebula&             nd = Nebula::instance();
    DatastorePool * dspool = nd.get_dspool();

    VirtualMachineTemplate  tmpl;
    VirtualMachineTemplate  quota_tmpl, quota_tmpl_running;

    string hostname;
    string vmm_mad;
    int    cluster_id = -1, old_cid = -1;
    int    uid;
    int    gid;

    PoolObjectAuth host_perms, ds_perms, vm_perms;
    PoolObjectAuth * auth_ds_perms;

    string tm_mad;

    bool check_nic_auto = false;

    if (!str_tmpl.empty())
    {
        check_nic_auto = !str_tmpl.empty();

        int rc = tmpl.parse_str_or_xml(str_tmpl, att.resp_msg);

        if ( rc != 0 )
        {
            return Request::INTERNAL;
        }
    }

    auto ec = get_host_information(hid,
                                   hostname,
                                   vmm_mad,
                                   cluster_id,
                                   host_perms,
                                   att);
    if (ec != Request::SUCCESS)
    {
        return ec;
    }

    // ------------------------------------------------------------------------
    // Get information about the system DS to use (tm_mad & permissions)
    // ------------------------------------------------------------------------
    if (auto vm = vmpool->get_ro(vid))
    {
        if (vm->hasHistory() &&
            (vm->get_action() == VMActions::STOP_ACTION ||
             vm->get_action() == VMActions::UNDEPLOY_ACTION ||
             vm->get_action() == VMActions::UNDEPLOY_HARD_ACTION))
        {
            if (ds_id == -1)
            {
                ds_id = vm->get_ds_id();
            }

            check_nic_auto = false;
        }

        uid = vm->get_uid();
        gid = vm->get_gid();

        vm->get_permissions(vm_perms);

        enforce = enforce || vm->is_pinned();

        vm->get_quota_template(quota_tmpl_running, false, true);

        if (vm->hasHistory())
        {
            old_cid = vm->get_cid();
        }

        if (!vm->hasHistory() || (old_cid != -1 && (old_cid != cluster_id)))
        {
            vm->get_quota_template(quota_tmpl, true, false);
            vm->get_quota_template(quota_tmpl_running, false, true);
        }
    }
    else
    {
        att.resp_id = vid;

        return Request::NO_EXISTS;
    }

    if ( ds_id == -1 ) //Use default system DS for cluster
    {
        ec = get_default_ds_information(cluster_id, ds_id, tm_mad, att);
        if (ec != Request::SUCCESS)
        {
            return ec;
        }
    }
    else //Get information from user selected system DS
    {
        set<int> ds_cluster_ids;
        bool     ds_migr;

        ec = get_ds_information(ds_id, ds_cluster_ids, tm_mad, att, ds_migr);

        if (ec != Request::SUCCESS)
        {
            return ec;
        }

        if (ds_cluster_ids.count(cluster_id) == 0)
        {
            ostringstream oss;

            oss << RequestLogger::object_name(PoolObjectSQL::DATASTORE) << " [" << ds_id
                << "] and " << RequestLogger::object_name(PoolObjectSQL::HOST) << " ["
                << hid << "] are not in the same "
                << RequestLogger::object_name(PoolObjectSQL::CLUSTER) << " [" << cluster_id
                << "].";

            att.resp_msg = oss.str();

            return Request::ACTION;
        }
    }

    if ( ds_id == -1 )
    {
        auth_ds_perms = 0;
    }
    else
    {
        auto ds = dspool->get_ro(ds_id);

        if ( !ds )
        {
            att.resp_obj = PoolObjectSQL::DATASTORE;
            att.resp_id  = ds_id;

            return Request::NO_EXISTS;
        }

        ds->get_permissions(ds_perms);

        auth_ds_perms = &ds_perms;
    }

    // ------------------------------------------------------------------------
    // Authorize request
    // ------------------------------------------------------------------------
    att.set_auth_op(VMActions::DEPLOY_ACTION);

    if ( check_nic_auto ) //Authorize network schedule and quotas
    {
        RequestAttributes att_quota(uid, gid, att);

        if (!att.is_admin())
        {
            string aname;

            if (tmpl.check_restricted(aname))
            {
                att.resp_msg = "NIC includes a restricted attribute " + aname;

                return Request::AUTHORIZATION;
            }
        }

        if (!quota_authorization(&tmpl, Quotas::NETWORK, att_quota, att.resp_msg))
        {
            return Request::AUTHORIZATION;
        }

        ec = vm_authorization(vid, 0, &tmpl, att, &host_perms, auth_ds_perms, 0);
    }
    else
    {
        ec = vm_authorization(vid, 0, 0, att, &host_perms, auth_ds_perms, 0);
    }

    if (ec != Request::SUCCESS)
    {
        return ec;
    }

    // ------------------------------------------------------------------------
    // Check request consistency:
    // - VM States are right
    // - Host capacity if required
    // ------------------------------------------------------------------------
    auto vm = vmpool->get(vid);

    if ( !vm )
    {
        att.resp_id = vid;

        return Request::NO_EXISTS;
    }

    if ( vm->get_state() != VirtualMachine::PENDING &&
         vm->get_state() != VirtualMachine::HOLD &&
         vm->get_state() != VirtualMachine::STOPPED &&
         vm->get_state() != VirtualMachine::UNDEPLOYED )
    {
        att.resp_msg = "Deploy action is not available for state " + vm->state_str();

        return Request::ACTION;
    }

    if ( !check_host(hid, enforce || vm->is_pinned(), vm.get(), att.resp_msg) )
    {
        return Request::ACTION;
    }

    if ( check_nic_auto && vm->get_auto_network_leases(&tmpl, att.resp_msg) != 0 )
    {
        return Request::ACTION;
    }

    if ( vm->check_tm_mad_disks(tm_mad, att.resp_msg) != 0)
    {
        return Request::ACTION;
    }

    if ( vm->check_shareable_disks(vmm_mad, att.resp_msg) != 0)
    {
        return Request::ACTION;
    }

    if ( nd.get_vmm()->validate_template(vmm_mad, vm.get(), hid, cluster_id, att.resp_msg) != 0 )
    {
        return Request::ACTION;
    }

    RequestAttributes att_quota(vm_perms.uid, vm_perms.gid, att);

    bool do_running_quota = vm->get_state() == VirtualMachine::STOPPED ||
                            vm->get_state() == VirtualMachine::UNDEPLOYED;

    // Authorize running quota (global and cluster)
    if (do_running_quota)
    {
        quota_tmpl_running.replace("CLUSTER_ID", cluster_id);

        if ( !quota_authorization(&quota_tmpl_running, Quotas::VM, att_quota, att_quota.resp_msg))
        {
            att.resp_msg = att_quota.resp_msg;

            return Request::AUTHORIZATION;
        }
    }

    // Cluster quotas
    quota_tmpl.replace("CLUSTER_ID", cluster_id);
    quota_tmpl.add("SKIP_GLOBAL_QUOTA", true);
    if (old_cid == -1)
    {
        // Cluster quota on first deploy
        quota_tmpl.merge(&quota_tmpl_running);
        if ( !quota_authorization(&quota_tmpl, Quotas::VM, att_quota, att_quota.resp_msg))
        {
            att.resp_msg = att_quota.resp_msg;

            if (do_running_quota)
            {
                quota_rollback(&quota_tmpl_running, Quotas::VM, att_quota);
            }

            return Request::AUTHORIZATION;
        }
    }
    else if (old_cid != cluster_id)
    {
        // Cluster quota, deploy on different cluster
        if ( !quota_authorization(&quota_tmpl, Quotas::VM, att_quota, att_quota.resp_msg))
        {
            att.resp_msg = att_quota.resp_msg;

            if (do_running_quota)
            {
                quota_rollback(&quota_tmpl_running, Quotas::VM, att_quota);
            }

            return Request::AUTHORIZATION;
        }

        // Remove resources from old cluster
        quota_tmpl.replace("CLUSTER_ID", old_cid);
        Quotas::vm_del(vm_perms.uid, vm_perms.gid, &quota_tmpl);
    }

    // ------------------------------------------------------------------------
    // Add deployment dependent attributes to VM
    //   - volatile disk (selected system DS driver)
    //   - vnc port (free in the selected cluster)
    // ------------------------------------------------------------------------
    set_volatile_disk_info(vm.get(), ds_id);

    if (set_vnc_port(vm.get(), cluster_id, att) != 0)
    {
        if (do_running_quota)
        {
            quota_rollback(&quota_tmpl_running, Quotas::VM, att_quota);
        }

        if (old_cid == -1)
        {
            quota_rollback(&quota_tmpl, Quotas::VM, att_quota);
        }
        else if (old_cid != cluster_id)
        {
            // Remove resources back to old cluster
            quota_tmpl.replace("CLUSTER_ID", old_cid);
            Quotas::vm_add(vm_perms.uid, vm_perms.gid, &quota_tmpl);

            // Remove resources from new cluster
            quota_tmpl.replace("CLUSTER_ID", cluster_id);
            quota_rollback(&quota_tmpl, Quotas::VM, att_quota);
        }

        return Request::ACTION;
    }

    // ------------------------------------------------------------------------
    // Add a new history record
    // ------------------------------------------------------------------------
    if (add_history(vm.get(),
                    hid,
                    cluster_id,
                    hostname,
                    vmm_mad,
                    tm_mad,
                    ds_id,
                    att) != 0)
    {
        return Request::INTERNAL;
    }

    // ------------------------------------------------------------------------
    // deploy the VM (unlocks the vm object)
    // ------------------------------------------------------------------------

    DispatchManager * dm = nd.get_dm();

    dm->deploy(std::move(vm), att);

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::action(int vid,
                                             const std::string& action_str,
                                             RequestAttributes& att)
{
    int    rc;

    ostringstream oss;
    string error;

    VMActions::Action action;

    VirtualMachineTemplate quota_tmpl;
    RequestAttributes& att_aux(att);

    VMActions::action_from_str(action_str, action);

    DispatchManager* dm = Nebula::instance().get_dm();

    // Update the authorization level for the action
    att.set_auth_op(action);

    auto auth = vm_authorization(vid, 0, 0, att, 0, 0, 0);

    if (auth != Request::SUCCESS)
    {
        return auth;
    }

    auto vm = vmpool->get_ro(vid);

    if ( !vm )
    {
        att.resp_id = vid;

        return Request::NO_EXISTS;
    }

    switch (action)
    {
        case VMActions::TERMINATE_ACTION:
            rc = dm->terminate(vid, false, att, error);
            break;
        case VMActions::TERMINATE_HARD_ACTION:
            rc = dm->terminate(vid, true, att, error);
            break;
        case VMActions::HOLD_ACTION:
            rc = dm->hold(vid, att, error);
            break;
        case VMActions::RELEASE_ACTION:
            rc = dm->release(vid, att, error);
            break;
        case VMActions::STOP_ACTION:
            rc = dm->stop(vid, att, error);
            break;
        case VMActions::SUSPEND_ACTION:
            rc = dm->suspend(vid, att, error);
            break;
        case VMActions::RESUME_ACTION:
            vm->get_quota_template(quota_tmpl, false, true);

            att_aux.uid = vm->get_uid();
            att_aux.gid = vm->get_gid();

            if (!quota_authorization(&quota_tmpl, Quotas::VIRTUALMACHINE, att_aux, att.resp_msg))
            {
                return Request::ACTION;
            }

            rc = dm->resume(vid, att, error);

            if (rc < 0)
            {
                quota_rollback(&quota_tmpl, Quotas::VIRTUALMACHINE, att_aux);
            }

            break;
        case VMActions::REBOOT_ACTION:
            rc = dm->reboot(vid, false, att, error);
            break;
        case VMActions::REBOOT_HARD_ACTION:
            rc = dm->reboot(vid, true, att, error);
            break;
        case VMActions::RESCHED_ACTION:
            rc = dm->resched(vid, true, att, error);
            break;
        case VMActions::UNRESCHED_ACTION:
            rc = dm->resched(vid, false, att, error);
            break;
        case VMActions::POWEROFF_ACTION:
            rc = dm->poweroff(vid, false, att, error);
            break;
        case VMActions::POWEROFF_HARD_ACTION:
            rc = dm->poweroff(vid, true, att, error);
            break;
        case VMActions::UNDEPLOY_ACTION:
            rc = dm->undeploy(vid, false, att, error);
            break;
        case VMActions::UNDEPLOY_HARD_ACTION:
            rc = dm->undeploy(vid, true, att, error);
            break;
        default:
            rc = -3;
            break;
    }

    switch (rc)
    {
        case 0:
            return Request::SUCCESS;

        case -1:
            att.resp_id = vid;
            return Request::NO_EXISTS;

        case -2:
            oss << "Error performing action \"" << action_str << "\": " << error;

            att.resp_msg = oss.str();
            return Request::ACTION;

        case -3:
            oss << "Action \"" << action_str << "\" is not supported";

            att.resp_msg = oss.str();
            return Request::ACTION;

        default:
            att.resp_msg = "Internal error. Action result not defined";
            return Request::INTERNAL;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::migrate(int vid,
                                              int hid,
                                              bool live,
                                              bool enforce,
                                              int ds_id,
                                              int poweroff,
                                              RequestAttributes& att)
{
    Nebula& nd = Nebula::instance();

    DatastorePool * dspool = nd.get_dspool();

    string hostname;
    string vmm_mad;
    int    cluster_id;
    set<int> ds_cluster_ids;
    PoolObjectAuth host_perms, ds_perms, vm_perms;
    PoolObjectAuth * auth_ds_perms;
    VirtualMachineTemplate quota_tmpl;

    int    c_hid;
    int    c_cluster_id;
    int    c_ds_id;
    string c_tm_mad, tm_mad;

    set<int> cluster_ids;
    string   error_str;

    bool ds_migr;

    auto ec = get_host_information(hid,
                                   hostname,
                                   vmm_mad,
                                   cluster_id,
                                   host_perms,
                                   att);

    if (ec != Request::SUCCESS)
    {
        return ec;
    }

    if (ds_id == -1)
    {
        auth_ds_perms = 0;
    }
    else
    {
        auto ds = dspool->get_ro(ds_id);

        if (ds == nullptr )
        {
            att.resp_obj = PoolObjectSQL::DATASTORE;
            att.resp_id  = ds_id;

            return Request::NO_EXISTS;
        }

        ds->get_permissions(ds_perms);

        auth_ds_perms = &ds_perms;
    }

    // ------------------------------------------------------------------------
    // Authorize request
    // ------------------------------------------------------------------------
    att.set_auth_op(VMActions::MIGRATE_ACTION);

    ec = vm_authorization(vid, 0, 0, att, &host_perms, auth_ds_perms, 0);

    if (ec != Request::SUCCESS)
    {
        return ec;
    }

    // ------------------------------------------------------------------------
    // Check request consistency:
    // - VM States are right and there is at least a history record
    // - New host is not the current one
    // - Host capacity if required
    // - Compatibility with PCI devices
    // - New host and current one are in the same cluster
    // ------------------------------------------------------------------------
    auto vm = vmpool->get(vid);

    if (vm == nullptr)
    {
        att.resp_id = vid;

        return Request::NO_EXISTS;
    }

    if (vm->is_previous_history_open() ||
        (vm->get_state() != VirtualMachine::POWEROFF &&
         vm->get_state() != VirtualMachine::SUSPENDED &&
         (vm->get_state() != VirtualMachine::ACTIVE ||
          (vm->get_lcm_state() != VirtualMachine::RUNNING &&
           vm->get_lcm_state() != VirtualMachine::UNKNOWN))))
    {
        att.resp_msg = "Migrate action is not available for state " + vm->state_str();

        return Request::ACTION;
    }

    if (live && vm->is_pinned())
    {
        att.resp_msg = "VM with a pinned NUMA topology cannot be live-migrated";

        return Request::ACTION;
    }

    // Get System DS information from current History record
    c_ds_id  = vm->get_ds_id();
    c_tm_mad = vm->get_tm_mad();

    // Check we are not migrating to the same host and the same system DS
    c_hid = vm->get_hid();

    if (c_hid == hid && (ds_id == -1 || ds_id == c_ds_id))
    {
        ostringstream oss;

        oss << "VM is already running on host [" << c_hid << "] and datastore [" << c_ds_id << "]";

        att.resp_msg = oss.str();

        return Request::ACTION;
    }

    // Check the host has enough capacity
    if (check_host(hid, enforce, vm.get(), att.resp_msg) == false)
    {
        return Request::ACTION;
    }

    int rc = vm->automatic_requirements(cluster_ids, error_str);

    if (rc != 0)
    {
        att.resp_msg = error_str;

        return Request::ACTION;
    }

    //Check PCI devices are compatible with migration type
    HostShareCapacity sr;

    vm->get_capacity(sr);

    if ((sr.pci.size() > 0) && (!poweroff &&
                                vm->get_state() != VirtualMachine::POWEROFF))
    {
        ostringstream oss;

        oss << "Cannot migrate VM [" << vid << "], use poweroff or poweroff-hard"
            " flag for migrating a VM with PCI devices";

        att.resp_msg = oss.str();

        return Request::ACTION;
    }

    // Check we are migrating to a compatible cluster
    if (auto host = nd.get_hpool()->get_ro(c_hid))
    {
        c_cluster_id = host->get_cluster_id();
    }
    else
    {
        att.resp_obj = PoolObjectSQL::HOST;
        att.resp_id  = c_hid;

        return Request::NO_EXISTS;
    }

    if (!cluster_ids.empty() && cluster_ids.count(cluster_id) == 0)
    {
        ostringstream oss;

        oss << "Cannot migrate  VM [" << vid << "] to host [" << hid << "]. Host is in cluster ["
            << cluster_id << "], and VM requires to be placed on cluster ["
            << one_util::join(cluster_ids, ',') << "]";

        att.resp_msg = oss.str();

        return Request::ACTION;
    }

    if (ds_id != -1 && c_ds_id != ds_id)
    {
        VirtualMachineManager * vmm = nd.get_vmm();

        const VirtualMachineManagerDriver * vmmd = vmm->get(vmm_mad);

        if ( vmmd == nullptr )
        {
            att.resp_msg = "Cannot find vmm driver: " + vmm_mad;

            return Request::ACTION;
        }

        if (live && !vmmd->is_ds_live_migration())
        {
            att.resp_msg = "A migration to a different system datastore "
                           "cannot be performed live.";

            return Request::ACTION;
        }

        ec = get_ds_information(ds_id, ds_cluster_ids, tm_mad, att, ds_migr);

        if (ec != Request::SUCCESS)
        {
            return ec;
        }

        if (!ds_migr)
        {
            att.resp_msg = "System datastore migration not supported by driver";

            return Request::ACTION;
        }

        if (c_tm_mad != tm_mad)
        {
            att.resp_msg = "Cannot migrate to a system datastore with a different driver";

            return Request::ACTION;
        }
    }
    else
    {
        ds_id  = c_ds_id;

        ec = get_ds_information(ds_id, ds_cluster_ids, tm_mad, att, ds_migr);

        if (ec != Request::SUCCESS)
        {
            return ec;
        }
    }

    if (!ds_cluster_ids.empty() && ds_cluster_ids.count(cluster_id) == 0)
    {
        ostringstream oss;

        oss << "Cannot migrate VM [" << vid << "] to host [" << hid
            << "] and system datastore [" << ds_id << "]. Host is in cluster ["
            << cluster_id << "], and the datastore is in cluster ["
            << one_util::join(ds_cluster_ids, ',') << "]";

        att.resp_msg = oss.str();

        return Request::ACTION;
    }

    // -------------------------------------------------------------------------
    // Request a new VNC port in the new cluster
    // -------------------------------------------------------------------------
    vm->get_permissions(vm_perms);
    RequestAttributes att_quota(vm_perms.uid, vm_perms.gid, att);

    if ( c_cluster_id != cluster_id )
    {
        if ( set_migrate_vnc_port(vm.get(), cluster_id, live) == -1 )
        {
            att.resp_msg = "No free VNC port available in the new cluster";

            return Request::ACTION;
        }

        // Check cluster quotas on new cluster, remove resources from old cluster
        vm->get_quota_template(quota_tmpl, true, vm->is_running_quota());

        quota_tmpl.replace("CLUSTER_ID", cluster_id);
        quota_tmpl.add("SKIP_GLOBAL_QUOTA", true);

        if ( !quota_authorization(&quota_tmpl, Quotas::VM, att_quota, att_quota.resp_msg))
        {
            att.resp_msg = att_quota.resp_msg;
            return Request::AUTHORIZATION;
        }

        quota_tmpl.replace("CLUSTER_ID", c_cluster_id);
        quota_rollback(&quota_tmpl, Quotas::VM, att_quota);
    }

    // ------------------------------------------------------------------------
    // Add a new history record and update volatile DISK attributes
    // ------------------------------------------------------------------------

    set_volatile_disk_info(vm.get(), ds_id);

    //add_history call will also update the vm
    if (add_history(vm.get(),
                    hid,
                    cluster_id,
                    hostname,
                    vmm_mad,
                    tm_mad,
                    ds_id,
                    att) != 0)
    {
        vm.reset();

        // quota rollback
        if (c_cluster_id != cluster_id)
        {
            Quotas::vm_add(vm_perms.uid, vm_perms.gid, &quota_tmpl);

            Quotas::vm_del(vm_perms.uid, vm_perms.gid, &quota_tmpl);
        }

        return Request::INTERNAL;
    }

    // ------------------------------------------------------------------------
    // Migrate the VM
    // ------------------------------------------------------------------------
    DispatchManager* dm = nd.get_dm();

    if (live && vm->get_lcm_state() == VirtualMachine::RUNNING )
    {
        rc = dm->live_migrate(vm.get(), att);
    }
    else
    {
        rc = dm->migrate(vm.get(), poweroff, att);
    }

    if (rc != 0)
    {
        vm.reset();

        // Cluster quota rollback
        if (c_cluster_id != cluster_id)
        {
            Quotas::vm_add(vm_perms.uid, vm_perms.gid, &quota_tmpl);

            Quotas::vm_del(vm_perms.uid, vm_perms.gid, &quota_tmpl);
        }

        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::disk_save_as(int vid,
                                                   int disk_id,
                                                   const std::string& img_name,
                                                   const std::string& img_type,
                                                   int snap_id,
                                                   int& image_id,
                                                   RequestAttributes& att)
{
    Nebula& nd = Nebula::instance();

    ImagePool *     ipool  = nd.get_ipool();
    DatastorePool * dspool = nd.get_dspool();

    int iid_orig;

    string         ds_data;
    PoolObjectAuth ds_perms;
    long long      avail;
    bool           ds_check;

    string ds_mad;
    string tm_mad;

    string target;
    string dev_prefix;

    int       ds_id;
    string    ds_name;
    long long size;

    string iname_orig;
    string iuname_orig;

    Image::ImageType type;
    Image::DiskType  ds_disk_type;

    unique_ptr<ImageTemplate> itemplate;
    Template        img_usage;

    int    rc;
    Request::ErrorCode ec;

    att.resp_id = vid;

    // -------------------------------------------------------------------------
    // Prepare and check the VM/DISK to be saved as
    // -------------------------------------------------------------------------
    if ( auto vm = vmpool->get(vid) )
    {
        if (vm->set_saveas_state() != 0)
        {
            att.resp_msg = "VM has to be RUNNING, POWEROFF or SUSPENDED to save disks.";

            return Request::INTERNAL;
        }

        rc = vm->set_saveas_disk(disk_id, snap_id, iid_orig, size, att.resp_msg);

        if (rc == -1)
        {
            vm->clear_saveas_state();
            vm->clear_saveas_disk();

            att.resp_msg ="Cannot use DISK. " + att.resp_msg;

            return Request::INTERNAL;
        }

        vmpool->update(vm.get());
    }
    else
    {
        return Request::NO_EXISTS;
    }

    // -------------------------------------------------------------------------
    // Get the data of the Image to be saved
    // -------------------------------------------------------------------------
    if ( auto img = ipool->get_ro(iid_orig) )
    {
        ds_id   = img->get_ds_id();
        ds_name = img->get_ds_name();

        type = img->get_type();

        iname_orig  = img->get_name();
        iuname_orig = img->get_uname();

        img->get_template_attribute("TARGET", target);
        img->get_template_attribute("DEV_PREFIX", dev_prefix);
    }
    else
    {
        goto error_image;
    }

    switch (type)
    {
        case Image::OS:
        case Image::DATABLOCK:
        case Image::CDROM:
            break;

        case Image::KERNEL:
        case Image::RAMDISK:
        case Image::CONTEXT:
        case Image::BACKUP:
            goto error_image_type;
    }

    // -------------------------------------------------------------------------
    // Get the data of the DataStore for the new image & size
    // -------------------------------------------------------------------------
    if ( auto ds = dspool->get_ro(ds_id) )
    {
        ds->get_permissions(ds_perms);
        ds->to_xml(ds_data);

        ds_check     = ds->get_avail_mb(avail);
        ds_disk_type = ds->get_disk_type();
        ds_mad       = ds->get_ds_mad();
        tm_mad       = ds->get_tm_mad();
    }
    else
    {
        goto error_ds;
    }


    if (ds_check && (size > avail))
    {
        goto error_size;
    }

    // -------------------------------------------------------------------------
    // Create a template for the new Image
    // -------------------------------------------------------------------------
    itemplate = make_unique<ImageTemplate>();

    itemplate->add("NAME", img_name);
    itemplate->add("SIZE", size);

    itemplate->add("SAVED_IMAGE_ID", iid_orig);
    itemplate->add("SAVED_DISK_ID", disk_id);
    itemplate->add("SAVED_VM_ID", vid);
    itemplate->set_saving();

    if (img_type.empty())
    {
        itemplate->add("TYPE", Image::type_to_str(type));
    }
    else
    {
        itemplate->add("TYPE", img_type);
    }

    if (!target.empty())
    {
        itemplate->add("TARGET", target);
    }

    if (!dev_prefix.empty())
    {
        itemplate->add("DEV_PREFIX", dev_prefix);
    }

    Image::test_set_persistent(itemplate.get(), att.uid, att.gid, false);

    img_usage.add("SIZE",      size);
    img_usage.add("DATASTORE", ds_id);

    // -------------------------------------------------------------------------
    // Authorize the operation & check quotas
    // -------------------------------------------------------------------------
    att.set_auth_op(VMActions::DISK_SAVEAS_ACTION);

    ec = vm_authorization(vid, itemplate.get(), 0, att, 0, &ds_perms, 0);

    if (ec != Request::SUCCESS)
    {
        goto error_auth;
    }

    if ( !quota_authorization(&img_usage, Quotas::DATASTORE, att, att.resp_msg) )
    {
        ec = Request::AUTHORIZATION;
        goto error_auth;
    }

    // -------------------------------------------------------------------------
    // Create the image
    // -------------------------------------------------------------------------
    rc = ipool->allocate(att.uid,
                         att.gid,
                         att.uname,
                         att.gname,
                         att.umask,
                         std::move(itemplate),
                         ds_id,
                         ds_name,
                         ds_disk_type,
                         ds_data,
                         Datastore::IMAGE_DS,
                         ds_mad,
                         tm_mad,
                         "",
                         -1,
                         &image_id,
                         att.resp_msg);
    if (rc < 0)
    {
        goto error_allocate;
    }

    if ( auto ds = dspool->get(ds_id) )
    {
        ds->add_image(image_id);

        dspool->update(ds.get());
    }
    else
    {
        goto error_ds_removed;
    }

    return Request::SUCCESS;

error_image:
    att.resp_obj = PoolObjectSQL::IMAGE;
    att.resp_id  = iid_orig;
    ec = Request::NO_EXISTS;
    goto error_common;

error_image_type:
    att.resp_msg = "Cannot save_as image of type " + Image::type_to_str(type);
    ec = Request::INTERNAL;
    goto error_common;

error_ds:
error_ds_removed:
    att.resp_obj = PoolObjectSQL::DATASTORE;
    att.resp_id  = ds_id;
    ec = Request::NO_EXISTS;
    goto error_common;

error_size:
    att.resp_msg = "Not enough space in datastore";
    ec = Request::ACTION;
    goto error_common;

error_auth:
    goto error_common;

error_allocate:
    att.resp_obj = PoolObjectSQL::IMAGE;
    quota_rollback(&img_usage, Quotas::DATASTORE, att);
    ec = Request::ALLOCATE;
    goto error_common;

error_common:
    if (auto vm = vmpool->get(vid))
    {
        vm->clear_saveas_state();

        vm->clear_saveas_disk();

        vmpool->update(vm.get());
    }

    return ec;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::disk_snapshot_create(int vid,
                                                           int disk_id,
                                                           const std::string& name,
                                                           int& snap_id,
                                                           RequestAttributes& att)
{
    PoolObjectAuth vm_perms;

    VirtualMachineDisk* disk;

    Template ds_deltas;
    Template vm_deltas;

    // ------------------------------------------------------------------------
    // Check request consistency (VM & disk exists, no volatile)
    // ------------------------------------------------------------------------
    bool img_ds_quota, vm_ds_quota;
    bool is_volatile;
    int img_id = -1;

    if (auto vm = vmpool->get_ro(vid))
    {
        auto vm_bck = vm->backups();

        if ( vm_bck.configured() && vm_bck.mode() == Backups::INCREMENT )
        {
            att.resp_msg = "Action \"disk-snapshot-create\" is not compatible with "
                           "incremental backups";

            return Request::ACTION;
        }

        disk = vm->get_disk(disk_id);

        if (disk == nullptr)
        {
            att.resp_msg = "VM disk does not exist";

            return Request::ACTION;
        }

        /* ---------------------------------------------------------------------- */
        /*  Get disk information and quota usage deltas                           */
        /* ---------------------------------------------------------------------- */
        long long ssize;
        disk->vector_value("SIZE", ssize);

        // Snapshot accounts as another disk of same size
        disk->resize_quotas(ssize, ds_deltas, vm_deltas, img_ds_quota, vm_ds_quota);
        if (vm->hasHistory() && !vm_deltas.empty())
        {
            vm_deltas.add("CLUSTER_ID", vm->get_cid());
        }

        is_volatile = disk->is_volatile();

        disk->vector_value("IMAGE_ID", img_id);

        vm->get_permissions(vm_perms);
    }
    else
    {
        att.resp_id = vid;

        return Request::NO_EXISTS;
    }

    if (is_volatile)
    {
        att.resp_msg = "Cannot make snapshots on volatile disks";

        return Request::ACTION;
    }

    /* ---------- Authorization and quota update requests ---------------------- */
    att.set_auth_op(VMActions::DISK_SNAPSHOT_CREATE_ACTION);

    PoolObjectAuth img_perms;

    if (img_ds_quota)
    {
        ImagePool* ipool = Nebula::instance().get_ipool();

        if ( auto img = ipool->get_ro(img_id) )
        {
            img->get_permissions(img_perms);
        }
        else
        {
            att.resp_obj = PoolObjectSQL::IMAGE;
            att.resp_id  = img_id;

            return Request::NO_EXISTS;
        }

        auto auth = vm_authorization(vid, 0, 0, att, 0, 0, &img_perms);

        if ( auth != Request::SUCCESS )
        {
            return auth;
        }
    }
    else
    {
        auto auth = vm_authorization(vid, 0, 0, att, 0, 0, 0);

        if ( auth != Request::SUCCESS )
        {
            return auth;
        }
    }

    RequestAttributes vm_att_quota  = RequestAttributes(vm_perms.uid,
                                                        vm_perms.gid, att);
    RequestAttributes img_att_quota = RequestAttributes(img_perms.uid,
                                                        img_perms.gid, att);

    /* ---------------------------------------------------------------------- */
    /*  Check quotas for the new size in image/system datastoress             */
    /* ---------------------------------------------------------------------- */
    if ( img_ds_quota &&
         !quota_authorization(&ds_deltas, Quotas::DATASTORE, img_att_quota, att.resp_msg) )
    {
        return Request::AUTHORIZATION;
    }

    if ( vm_ds_quota &&
         !quota_authorization(&ds_deltas, Quotas::DATASTORE, vm_att_quota, att.resp_msg) )
    {
        if ( img_ds_quota )
        {
            quota_rollback(&ds_deltas, Quotas::DATASTORE, img_att_quota);
        }

        return Request::AUTHORIZATION;
    }

    if ( !vm_deltas.empty() )
    {
        if (!quota_authorization(&vm_deltas, Quotas::VM, vm_att_quota, att.resp_msg, true))
        {
            if ( img_ds_quota )
            {
                quota_rollback(&ds_deltas, Quotas::DATASTORE, img_att_quota);
            }

            if ( vm_ds_quota )
            {
                quota_rollback(&ds_deltas, Quotas::DATASTORE, vm_att_quota);
            }

            return Request::AUTHORIZATION;
        }
    }

    // ------------------------------------------------------------------------
    // Do the snapshot
    // ------------------------------------------------------------------------
    auto dm = Nebula::instance().get_dm();
    int rc = dm->disk_snapshot_create(vid, disk_id, name, snap_id, att, att.resp_msg);

    if ( rc != 0 )
    {
        if ( img_ds_quota )
        {
            quota_rollback(&ds_deltas, Quotas::DATASTORE, img_att_quota);
        }

        if ( vm_ds_quota )
        {
            quota_rollback(&ds_deltas, Quotas::DATASTORE, vm_att_quota);
        }

        if ( !vm_deltas.empty() )
        {
            quota_rollback(&vm_deltas, Quotas::VM, vm_att_quota);
        }

        return Request::ACTION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::disk_snapshot_delete(int vid,
                                                           int disk_id,
                                                           int snap_id,
                                                           RequestAttributes& att)
{
    Nebula& nd = Nebula::instance();

    const VirtualMachineDisk * disk;

    bool persistent;
    int img_id = -1;

    if (auto vm = vmpool->get_ro(vid))
    {
        disk = vm->get_disk(disk_id);

        if (disk == nullptr)
        {
            att.resp_msg = "VM disk does not exist";

            return Request::ACTION;
        }

        persistent = disk->is_persistent();

        disk->vector_value("IMAGE_ID", img_id);
    }
    else
    {
        att.resp_id = vid;

        return Request::NO_EXISTS;
    }

    // Authorize the request
    att.set_auth_op(VMActions::DISK_SNAPSHOT_DELETE_ACTION);

    if (persistent)
    {
        PoolObjectAuth img_perms;

        auto ipool = nd.get_ipool();
        auto img = ipool->get_ro(img_id);

        if (img == nullptr)
        {
            att.resp_obj = PoolObjectSQL::IMAGE;
            att.resp_id  = img_id;

            return Request::NO_EXISTS;
        }

        img->get_permissions(img_perms);

        auto auth = vm_authorization(vid, 0, 0, att, 0, 0, &img_perms);

        if (auth != Request::SUCCESS)
        {
            return auth;
        }
    }
    else
    {
        auto auth = vm_authorization(vid, 0, 0, att, 0, 0, 0);

        if (auth != Request::SUCCESS)
        {
            return auth;
        }
    }

    auto dm = nd.get_dm();

    int rc = dm->disk_snapshot_delete(vid, disk_id, snap_id, att, att.resp_msg);

    if ( rc != 0 )
    {
        return Request::ACTION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::disk_snapshot_revert(int vid,
                                                           int disk_id,
                                                           int snap_id,
                                                           RequestAttributes& att)
{
    // Authorize the request
    att.set_auth_op(VMActions::DISK_SNAPSHOT_REVERT_ACTION);

    auto auth = vm_authorization(vid, 0, 0, att, 0, 0, 0);

    if (auth != Request::SUCCESS)
    {
        return auth;
    }

    auto dm = Nebula::instance().get_dm();

    int rc = dm->disk_snapshot_revert(vid, disk_id, snap_id, att, att.resp_msg);

    if ( rc != 0 )
    {
        return Request::ACTION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::disk_snapshot_rename(int vid,
                                                           int disk_id,
                                                           int snap_id,
                                                           const std::string& new_name,
                                                           RequestAttributes& att)
{
    // Authorize the request
    att.set_auth_op(VMActions::DISK_SNAPSHOT_RENAME_ACTION);

    if ( auto ec = vm_authorization(vid, 0, 0, att, 0, 0, 0); ec != Request::SUCCESS )
    {
        return ec;
    }

    auto vm = vmpool->get(vid);
    if ( !vm )
    {
        att.resp_id = vid;

        return Request::NO_EXISTS;
    }

    const VirtualMachineDisk* disk = vm->get_disk(disk_id);

    if ( !disk )
    {
        att.resp_msg = "VM disk does not exist";

        return Request::ACTION;
    }

    int rc = vm->rename_disk_snapshot(disk_id, snap_id, new_name, att.resp_msg);

    if ( rc != 0 )
    {
        return Request::ACTION;
    }

    vmpool->update(vm.get());

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::disk_attach(int vid,
                                                  const std::string& str_tmpl,
                                                  RequestAttributes& att)
{
    // -------------------------------------------------------------------------
    // Check if the VM is a Virtual Router
    // -------------------------------------------------------------------------
    if ( auto vm = vmpool->get_ro(vid) )
    {
        if ( !vm->hasHistory() )
        {
            att.resp_msg = "VM is not running in any host";

            return Request::ACTION;
        }

        if (vm->is_vrouter())
        {
            att.resp_msg = "Action is not supported for virtual router VMs";

            return Request::ACTION;
        }
    }
    else
    {
        att.resp_id = vid;
        att.resp_obj = PoolObjectSQL::VM;

        return Request::NO_EXISTS;
    }

    // -------------------------------------------------------------------------
    // Parse disk template
    // -------------------------------------------------------------------------
    PoolObjectAuth vm_perms;

    bool volatile_disk;

    VirtualMachineTemplate  tmpl;

    int rc = tmpl.parse_str_or_xml(str_tmpl, att.resp_msg);

    if ( rc != 0 )
    {
        return Request::INTERNAL;
    }

    VirtualMachineTemplate deltas(tmpl);

    // -------------------------------------------------------------------------
    // Authorize the operation & check quotas
    // -------------------------------------------------------------------------
    att.set_auth_op(VMActions::DISK_ATTACH_ACTION);

    if (auto vm = vmpool->get_ro(vid))
    {
        vm->get_permissions(vm_perms);

        volatile_disk = set_volatile_disk_info(vm->get_ds_id(), tmpl);

        if (vm->hasHistory())
        {
            deltas.add("CLUSTER_ID", vm->get_cid());
        }
    }
    else
    {
        att.resp_id  = vid;
        att.resp_obj = PoolObjectSQL::VM;

        return Request::NO_EXISTS;
    }

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(att.auth_op, vm_perms);

    VirtualMachine::set_auth_request(att.uid, ar, &tmpl, true);

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;
        return Request::AUTHORIZATION;
    }

    if (!att.is_admin())
    {
        string aname;

        if (tmpl.check_restricted(aname))
        {
            att.resp_msg = "DISK includes a restricted attribute " + aname;
            return Request::AUTHORIZATION;
        }
    }

    RequestAttributes att_quota(vm_perms.uid, vm_perms.gid, att);

    VirtualMachineDisks::extended_info(att.uid, &deltas);

    if (!quota_authorization(&deltas, Quotas::VM, att_quota, att.resp_msg, true))
    {
        att.resp_msg = std::move(att_quota.resp_msg);

        return Request::AUTHORIZATION;
    }

    if (!volatile_disk)
    {
        if ( !quota_authorization(&tmpl, Quotas::IMAGE, att_quota, att.resp_msg) )
        {
            quota_rollback(&deltas, Quotas::VM, att_quota);

            return Request::AUTHORIZATION;
        }
    }

    // Datastore quotas
    vector<unique_ptr<Template>> ds_quotas;

    VirtualMachineDisks::image_ds_quotas(&deltas, ds_quotas);

    if ( !ds_quotas.empty() &&
         !quota_authorization(ds_quotas[0].get(), Quotas::DATASTORE, att_quota, att.resp_msg))
    {
        quota_rollback(&deltas, Quotas::VM, att_quota);

        if (!volatile_disk)
        {
            quota_rollback(&tmpl, Quotas::IMAGE, att_quota);
        }

        return Request::AUTHORIZATION;
    }

    // -------------------------------------------------------------------------
    // Perform the attach
    // -------------------------------------------------------------------------

    auto dm = Nebula::instance().get_dm();

    if ( dm->attach(vid, &tmpl, att, att.resp_msg) != 0 )
    {
        quota_rollback(&deltas, Quotas::VM, att_quota);

        if (!volatile_disk)
        {
            quota_rollback(&tmpl, Quotas::IMAGE, att_quota);
        }

        if (!ds_quotas.empty())
        {
            quota_rollback(ds_quotas[0].get(), Quotas::DATASTORE, att_quota);
        }

        return Request::ACTION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::disk_detach(int vid,
                                                  int disk_id,
                                                  RequestAttributes& att)
{
    // -------------------------------------------------------------------------
    // Authorize the operation
    // -------------------------------------------------------------------------
    att.set_auth_op(VMActions::DISK_DETACH_ACTION);

    if ( auto ec = vm_authorization(vid, 0, 0, att, 0, 0, 0); ec != Request::SUCCESS )
    {
        return ec;
    }

    if ( auto vm = vmpool->get_ro(vid) )
    {
        if (vm->is_vrouter())
        {
            att.resp_msg = "Action is not supported for virtual router VMs";

            return Request::ACTION;
        }
    }
    else
    {
        att.resp_id = vid;

        return Request::NO_EXISTS;
    }

    auto dm = Nebula::instance().get_dm();

    int rc = dm->detach(vid, disk_id, att, att.resp_msg);

    if ( rc != 0 )
    {
        return Request::ACTION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::disk_resize(int vid,
                                                  int disk_id,
                                                  const string& size_str,
                                                  RequestAttributes& att)
{
    Nebula& nd = Nebula::instance();

    Template ds_deltas;
    Template vm_deltas;

    PoolObjectAuth   vm_perms;

    long long size, current_size;

    // ------------------------------------------------------------------------
    // Check request consistency (VM & disk exists, size, and no snapshots)
    // ------------------------------------------------------------------------
    if ( !one_util::str_cast(size_str, size) )
    {
        att.resp_msg = "Disk SIZE is not a valid integer";

        return Request::ACTION;
    }

    // -------------------------------------------------------------------------
    // Authorize the operation
    // -------------------------------------------------------------------------
    att.set_auth_op(VMActions::DISK_RESIZE_ACTION);

    if ( auto ec = vm_authorization(vid, 0, 0, att, 0, 0, 0); ec != Request::SUCCESS )
    {
        return ec;
    }

    bool img_ds_quota, vm_ds_quota;
    int img_id = -1;

    if ( auto vm = vmpool->get(vid) )
    {
        VirtualMachineDisk * disk = vm->get_disk(disk_id);

        if ( !disk)
        {
            att.resp_msg = "VM disk does not exist";

            return Request::ACTION;
        }

        disk->vector_value("SIZE", current_size);

        if ( size <= current_size )
        {
            att.resp_msg = "New disk size has to be greater than current one";

            return Request::ACTION;
        }

        /* ------------- Get information about the disk and image --------------- */
        disk->resize_quotas(size - current_size, ds_deltas, vm_deltas, img_ds_quota, vm_ds_quota);
        if (vm->hasHistory() && !vm_deltas.empty())
        {
            vm_deltas.add("CLUSTER_ID", vm->get_cid());
        }

        disk->vector_value("IMAGE_ID", img_id);

        vm->get_permissions(vm_perms);
    }
    else
    {
        att.resp_id = vid;

        return Request::NO_EXISTS;
    }

    /* ---------------------------------------------------------------------- */
    /*  Authorize the request for VM and IMAGE for persistent disks           */
    /* ---------------------------------------------------------------------- */
    PoolObjectAuth img_perms;

    if ( img_ds_quota )
    {
        if ( img_id != -1 )
        {
            auto ipool = nd.get_ipool();
            auto img = ipool->get_ro(img_id);

            if (img == nullptr)
            {
                att.resp_obj = PoolObjectSQL::IMAGE;
                att.resp_id  = img_id;

                return Request::NO_EXISTS;
            }

            img->get_permissions(img_perms);
        }

        if ( auto ec = vm_authorization(vid, 0, 0, att, 0, 0, &img_perms); ec != Request::SUCCESS )
        {
            return ec;
        }
    }

    RequestAttributes img_att_quota = RequestAttributes(img_perms.uid,
                                                        img_perms.gid, att);
    RequestAttributes vm_att_quota  = RequestAttributes(vm_perms.uid,
                                                        vm_perms.gid, att);

    /* ---------------------------------------------------------------------- */
    /*  Check quotas for the new size in image/system datastoress             */
    /* ---------------------------------------------------------------------- */

    if ( img_ds_quota &&
         !quota_authorization(&ds_deltas, Quotas::DATASTORE, img_att_quota, att.resp_msg))
    {
        return Request::AUTHORIZATION;
    }

    if ( vm_ds_quota &&
         !quota_authorization(&ds_deltas, Quotas::DATASTORE, vm_att_quota, att.resp_msg))
    {
        if ( img_ds_quota )
        {
            quota_rollback(&ds_deltas, Quotas::DATASTORE, img_att_quota);
        }

        return Request::AUTHORIZATION;
    }

    if ( !vm_deltas.empty() )
    {
        if (!quota_authorization(&vm_deltas, Quotas::VM, vm_att_quota, vm_att_quota.resp_msg, true))
        {
            if ( img_ds_quota )
            {
                quota_rollback(&ds_deltas, Quotas::DATASTORE, img_att_quota);
            }

            if ( vm_ds_quota )
            {
                quota_rollback(&ds_deltas, Quotas::DATASTORE, vm_att_quota);
            }

            return Request::AUTHORIZATION;
        }
    }

    // ------------------------------------------------------------------------
    // Resize the disk
    // ------------------------------------------------------------------------
    auto dm = nd.get_dm();

    int rc = dm->disk_resize(vid, disk_id, size, att, att.resp_msg);

    if ( rc != 0 )
    {
        if ( img_ds_quota )
        {
            quota_rollback(&ds_deltas, Quotas::DATASTORE, img_att_quota);
        }

        if ( vm_ds_quota )
        {
            quota_rollback(&ds_deltas, Quotas::DATASTORE, vm_att_quota);
        }

        if ( !vm_deltas.empty() )
        {
            quota_rollback(&vm_deltas, Quotas::VM, vm_att_quota);
        }

        return Request::ACTION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::nic_attach(int vid,
                                                 VirtualMachineTemplate& tmpl,
                                                 RequestAttributes& att)
{
    Nebula& nd = Nebula::instance();

    HostPool* hpool = nd.get_hpool();

    PoolObjectAuth vm_perms;

    int hid = -1;
    int cid = -1;

    bool running_quota;

    // -------------------------------------------------------------------------
    // Authorize the operation, restricted attributes & check quotas
    // -------------------------------------------------------------------------
    att.set_auth_op(VMActions::NIC_ATTACH_ACTION);

    VectorAttribute * pci = tmpl.get("PCI");

    if ( pci && pci->vector_value("TYPE") != "NIC" )
    {
        att.resp_msg = "PCI device is not of type NIC";

        return Request::ACTION;
    }

    if (auto vm = vmpool->get_ro(vid))
    {
        vm->get_permissions(vm_perms);

        running_quota = vm->is_running_quota();

        if (vm->hasHistory())
        {
            hid = vm->get_hid();
            cid = vm->get_cid();
        }

        if (pci != nullptr && vm->check_pci_attributes(pci,  att.resp_msg) != 0)
        {
            return Request::ACTION;
        }
    }
    else
    {
        att.resp_id  = vid;
        att.resp_obj = PoolObjectSQL::VM;

        return Request::NO_EXISTS;
    }

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(att.auth_op, vm_perms);

    VirtualMachine::set_auth_request(att.uid, ar, &tmpl, true);

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;

        return Request::AUTHORIZATION;
    }

    RequestAttributes att_quota(vm_perms.uid, vm_perms.gid, att);

    if (!att.is_admin())
    {
        string aname;

        if (tmpl.check_restricted(aname))
        {
            att.resp_msg = "NIC includes a restricted attribute " + aname;

            return Request::AUTHORIZATION;
        }
    }

    if ( !quota_authorization(&tmpl, Quotas::NETWORK, att_quota, att.resp_msg) )
    {
        return Request::AUTHORIZATION;
    }

    Template quota_tmpl;

    if (pci)
    {
        quota_tmpl.add("CLUSTER_ID", cid);
        quota_tmpl.add("PCI_NIC", 1);

        if (running_quota)
        {
            quota_tmpl.add("RUNNING_PCI_NIC", 1);
        }

        if (!quota_authorization(&quota_tmpl, Quotas::VM, att_quota, att.resp_msg))
        {
            quota_rollback(&tmpl, Quotas::NETWORK, att_quota);

            return Request::AUTHORIZATION;
        }
    }

    // -------------------------------------------------------------------------
    // PCI test and set
    // -------------------------------------------------------------------------
    HostShareCapacity sr;

    if ( pci != nullptr && hid != -1 )
    {
        sr.vmid = vid;
        sr.pci.push_back(pci);

        auto host = hpool->get(hid);

        if ( !host )
        {
            att.resp_id  = vid;
            att.resp_obj = PoolObjectSQL::HOST;

            quota_rollback(&tmpl, Quotas::NETWORK, att_quota);

            if (!quota_tmpl.empty())
            {
                quota_rollback(&quota_tmpl, Quotas::VM, att_quota);
            }

            return Request::NO_EXISTS;
        }

        if (!host->add_pci(sr))
        {
            att.resp_msg = "Cannot assign PCI device in host. Check address "
                           "and free devices";

            quota_rollback(&tmpl, Quotas::NETWORK, att_quota);

            if (!quota_tmpl.empty())
            {
                quota_rollback(&quota_tmpl, Quotas::VM, att_quota);
            }

            return Request::ACTION;
        }

        hpool->update(host.get());
    }

    // -------------------------------------------------------------------------
    // Perform the attach
    // -------------------------------------------------------------------------
    auto dm = nd.get_dm();

    int rc = dm->attach_nic(vid, &tmpl, att, att.resp_msg);

    if ( rc != 0 )
    {
        quota_rollback(&tmpl, Quotas::NETWORK, att_quota);

        if ( pci != nullptr && hid != -1 )
        {
            if (auto host = hpool->get(hid))
            {
                host->del_pci(sr);
                hpool->update(host.get());
            }
        }

        return Request::ACTION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::nic_attach(int vid,
                                                 const std::string& str_tmpl,
                                                 RequestAttributes& att)
{
    VirtualMachineTemplate  tmpl;

    // -------------------------------------------------------------------------
    // Check if the VM is a Virtual Router
    // -------------------------------------------------------------------------
    if (auto vm = vmpool->get_ro(vid))
    {
        if (vm->is_vrouter())
        {
            att.resp_msg = "Action is not supported for virtual router VMs";

            return Request::ACTION;
        }
    }
    else
    {
        att.resp_id = vid;

        return Request::NO_EXISTS;
    }

    // -------------------------------------------------------------------------
    // Parse NIC template
    // -------------------------------------------------------------------------
    int rc = tmpl.parse_str_or_xml(str_tmpl, att.resp_msg);

    if ( rc != 0 )
    {
        return Request::INTERNAL;
    }

    return nic_attach(vid, tmpl, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::nic_detach_helper(int vid,
                                                        int nic_id,
                                                        RequestAttributes& att)
{
    // -------------------------------------------------------------------------
    // Authorize the operation
    // -------------------------------------------------------------------------
    att.set_auth_op(VMActions::NIC_DETACH_ACTION);

    if ( auto ec = basic_authorization(vid, att); ec != Request::SUCCESS)
    {
        return ec;
    }

    // -------------------------------------------------------------------------
    // Perform the detach
    // -------------------------------------------------------------------------
    auto dm = Nebula::instance().get_dm();

    if ( dm->detach_nic(vid, nic_id, att, att.resp_msg) != 0 )
    {
        return Request::ACTION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::nic_detach(int vid,
                                                 int nic_id,
                                                 RequestAttributes& att)
{
    // -------------------------------------------------------------------------
    // Authorize the operation
    // -------------------------------------------------------------------------
    if (auto vm = vmpool->get_ro(vid))
    {
        // Check if the VM is a Virtual Router
        if (vm->is_vrouter())
        {
            att.resp_msg = "Action is not supported for virtual router VMs";

            return Request::ACTION;
        }
    }
    else
    {
        att.resp_id = vid;

        return Request::NO_EXISTS;
    }

    return nic_detach_helper(vid, nic_id, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::nic_update(int vid,
                                                 int nic_id,
                                                 const std::string& str_tmpl,
                                                 int append,
                                                 RequestAttributes& att)
{
    VirtualMachineTemplate tmpl;
    PoolObjectAuth vm_perms;

    // -------------------------------------------------------------------------
    // Check if the VM is a Virtual Router
    // -------------------------------------------------------------------------
    if (auto vm = vmpool->get(vid))
    {
        if (vm->is_vrouter())
        {
            att.resp_msg = "Action is not supported for virtual router VMs";

            return Request::ACTION;
        }

        vm->get_permissions(vm_perms);

        auto nic = vm->get_nic(nic_id);

        if (!nic)
        {
            att.resp_msg = "VM " + to_string(vid) + ": NIC " + to_string(nic_id) +
                           " does not exists";

            return Request::ACTION;
        }

        if (nic->is_alias())
        {
            att.resp_msg = "Action not supported for NIC_ALIAS";

            return Request::ACTION;
        }
    }
    else
    {
        att.resp_id = vid;

        return Request::NO_EXISTS;
    }

    // -------------------------------------------------------------------------
    // Parse NIC template
    // -------------------------------------------------------------------------
    int rc = tmpl.parse_str_or_xml(str_tmpl, att.resp_msg);

    if ( rc != 0 )
    {
        return Request::INTERNAL;
    }

    // -------------------------------------------------------------------------
    // Authorize the operation, restricted attributes & check quotas
    // -------------------------------------------------------------------------
    att.set_auth_op(VMActions::NIC_UPDATE_ACTION);

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(att.auth_op, vm_perms);

    VirtualMachine::set_auth_request(att.uid, ar, &tmpl, true);

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;

        return Request::AUTHORIZATION;
    }

    if (!att.is_admin())
    {
        string aname;

        if (tmpl.check_restricted(aname))
        {
            att.resp_msg = "NIC includes a restricted attribute " + aname;

            return Request::AUTHORIZATION;
        }
    }

    // -------------------------------------------------------------------------
    // Perform the update
    // -------------------------------------------------------------------------
    auto dm = Nebula::instance().get_dm();

    rc = dm->update_nic(vid, nic_id, &tmpl, append, att, att.resp_msg);

    if ( rc != 0 )
    {
        return Request::ACTION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::sg_attach(int vid,
                                                int nic_id,
                                                int sg_id,
                                                RequestAttributes& att)
{
    unique_ptr<VirtualMachineNic> nic_tmpl;

    PoolObjectAuth vm_perms;

    // Get VM attributes to authorize operation
    att.set_auth_op(VMActions::SG_ATTACH_ACTION);

    if (auto vm = vmpool->get_ro(vid))
    {
        // Check if we can add the SG
        auto nic = vm->get_nic(nic_id);

        if (!nic)
        {
            ostringstream oss;
            oss << "VM " << vid << " doesn't have NIC id " << nic_id;
            att.resp_msg = oss.str();

            return Request::INTERNAL;
        }

        // Copy VM attributes
        nic_tmpl.reset(new VirtualMachineNic(nic->vector_attribute()->clone(), nic_id));
        nic_tmpl->add_security_group(sg_id);

        vm->get_permissions(vm_perms);
    }
    else
    {
        att.resp_id = vid;

        return Request::NO_EXISTS;
    }

    // Authorize the operation
    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(att.auth_op, vm_perms);

    nic_tmpl->authorize(att.uid, &ar, true);

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;

        return Request::AUTHORIZATION;
    }

    auto dm = Nebula::instance().get_dm();

    int rc = dm->attach_sg(vid, nic_id, sg_id, att, att.resp_msg);

    if ( rc != 0 )
    {
        return Request::ACTION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::sg_detach(int vid,
                                                int nic_id,
                                                int sg_id,
                                                RequestAttributes& att)
{
    att.set_auth_op(VMActions::SG_DETACH_ACTION);

    if ( auto ec = vm_authorization(vid, 0, 0, att, 0, 0, 0); ec != Request::SUCCESS )
    {
        return ec;
    }

    auto dm = Nebula::instance().get_dm();

    auto rc = dm->detach_sg(vid, nic_id, sg_id, att, att.resp_msg);

    if ( rc != 0 )
    {
        return Request::ACTION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::snapshot_create(int vid,
                                                      std::string name,
                                                      int& snap_id,
                                                      RequestAttributes& att)
{
    PoolObjectAuth   vm_perms;

    int     cid = -1;

    VectorAttribute* snap = nullptr;

    // -------------------------------------------------------------------------
    // Authorize the operation
    // -------------------------------------------------------------------------
    att.set_auth_op(VMActions::SNAPSHOT_CREATE_ACTION);

    if ( auto ec = vm_authorization(vid, 0, 0, att, 0, 0, 0); ec != Request::SUCCESS )
    {
        return ec;
    }

    // Check if the action is supported for imported VMs
    if (auto vm = vmpool->get_ro(vid))
    {
        auto vm_bck = vm->backups();

        if ( vm_bck.configured() && vm_bck.mode() == Backups::INCREMENT )
        {
            att.resp_msg = "Action \"snapshot-create\" is not compatible with "
                           "incremental backups";

            return Request::ACTION;
        }

        // get quota deltas
        snap = vm->new_snapshot(name, snap_id);
        snap = snap->clone();

        vm->get_permissions(vm_perms);

        if (vm->hasHistory())
        {
            cid = vm->get_cid();
        }
    }
    else
    {
        att.resp_id = vid;

        return Request::NO_EXISTS;
    }

    Template quota_tmpl;

    quota_tmpl.add("CLUSTER_ID", cid);
    quota_tmpl.set(snap);

    RequestAttributes att_quota(vm_perms.uid, vm_perms.gid, att);

    if ( !quota_authorization(&quota_tmpl, Quotas::VM, att_quota, att.resp_msg) )
    {
        return Request::AUTHORIZATION;
    }

    auto dm = Nebula::instance().get_dm();

    int rc = dm->snapshot_create(vid, name, snap_id, att, att.resp_msg);

    if ( rc != 0 )
    {
        quota_rollback(&quota_tmpl, Quotas::VM, att_quota);

        return Request::ACTION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::snapshot_delete(int vid,
                                                      int snap_id,
                                                      RequestAttributes& att)
{
    // -------------------------------------------------------------------------
    // Authorize the operation
    // -------------------------------------------------------------------------
    att.set_auth_op(VMActions::SNAPSHOT_DELETE_ACTION);

    if ( auto ec = vm_authorization(vid, 0, 0, att, 0, 0, 0); ec != Request::SUCCESS )
    {
        return ec;
    }

    auto dm = Nebula::instance().get_dm();

    int rc = dm->snapshot_delete(vid, snap_id, att, att.resp_msg);

    if ( rc != 0 )
    {
        return Request::ACTION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::snapshot_revert(int vid,
                                                      int snap_id,
                                                      RequestAttributes& att)
{
    // -------------------------------------------------------------------------
    // Authorize the operation
    // -------------------------------------------------------------------------
    att.set_auth_op(VMActions::SNAPSHOT_REVERT_ACTION);

    if ( auto ec = vm_authorization(vid, 0, 0, att, 0, 0, 0); ec != Request::SUCCESS )
    {
        return ec;
    }

    auto dm = Nebula::instance().get_dm();

    int rc = dm->snapshot_revert(vid, snap_id, att, att.resp_msg);

    if ( rc != 0 )
    {
        return Request::ACTION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::resize(int vid,
                                             const std::string& str_tmpl,
                                             bool no_overcommit,
                                             RequestAttributes& att)
{
    float ncpu, ocpu, dcpu;
    long  nmemory, omemory, dmemory;
    int   nvcpu, ovcpu, dvcpu;
    bool  update_running_quota;

    Template deltas;

    PoolObjectAuth vm_perms;

    VirtualMachineTemplate tmpl;

    if ( !att.is_admin() )
    {
        no_overcommit = true;
    }

    // -------------------------------------------------------------------------
    // Parse template
    // -------------------------------------------------------------------------
    if ( tmpl.parse_str_or_xml(str_tmpl, att.resp_msg) != 0 )
    {
        return Request::INTERNAL;
    }

    /* ---------------------------------------------------------------------- */
    /*  Authorize the operation & restricted attributes                       */
    /* ---------------------------------------------------------------------- */
    att.set_auth_op(VMActions::RESIZE_ACTION);

    if ( auto ec = vm_authorization(vid, 0, 0, att, 0, 0, 0); ec != Request::SUCCESS )
    {
        return ec;
    }

    if (!att.is_admin())
    {
        string aname;

        if (tmpl.check_restricted(aname))
        {
            att.resp_msg = "Template includes a restricted attribute " + aname;

            return Request::AUTHORIZATION;
        }
    }

    /* ---------------------------------------------------------------------- */
    /*  Get the resize values                                                 */
    /* ---------------------------------------------------------------------- */

    tmpl.get("CPU", ncpu);
    tmpl.get("VCPU", nvcpu);
    tmpl.get("MEMORY", nmemory);

    if (ncpu < 0)
    {
        att.resp_msg = "CPU must be a positive float or integer value.";

        return Request::INTERNAL;
    }

    if (nmemory < 0)
    {
        att.resp_msg = "MEMORY must be a positive integer value.";

        return Request::INTERNAL;
    }

    if (nvcpu < 0)
    {
        att.resp_msg = "VCPU must be a positive integer value.";

        return Request::INTERNAL;
    }

    /* ---------------------------------------------------------------------- */
    /*  Compute deltas and check quotas                                       */
    /* ---------------------------------------------------------------------- */
    if ( auto vm = vmpool->get_ro(vid) )
    {
        vm->get_permissions(vm_perms);

        vm->get_template_attribute("MEMORY", omemory);
        vm->get_template_attribute("CPU", ocpu);
        vm->get_template_attribute("VCPU", ovcpu);

        if (vm->is_pinned())
        {
            ncpu = nvcpu;
        }

        auto state = vm->get_state();

        if (vm->hasHistory())
        {
            deltas.add("CLUSTER_ID", vm->get_cid());
        }

        update_running_quota = state == VirtualMachine::PENDING ||
                               state == VirtualMachine::HOLD || (state == VirtualMachine::ACTIVE &&
                                                                 vm->get_lcm_state() == VirtualMachine::RUNNING);
    }
    else
    {
        att.resp_id = vid;

        return Request::NO_EXISTS;
    }

    if (nmemory == 0)
    {
        nmemory = omemory;
    }

    if (ncpu == 0)
    {
        ncpu = ocpu;
    }

    if (nvcpu == 0)
    {
        nvcpu = ovcpu;
    }

    dcpu    = ncpu - ocpu;
    dvcpu   = nvcpu - ovcpu;
    dmemory = nmemory - omemory;

    deltas.add("MEMORY", dmemory);
    deltas.add("CPU", dcpu);
    deltas.add("VCPU", dvcpu);

    if (update_running_quota)
    {
        deltas.add("RUNNING_MEMORY", dmemory);
        deltas.add("RUNNING_CPU", dcpu);
        deltas.add("RUNNING_VCPU", dvcpu);
    }

    RequestAttributes att_quota(vm_perms.uid, vm_perms.gid, att);

    if (!quota_authorization(&deltas, Quotas::VM, att_quota, att.resp_msg, true))
    {
        return Request::AUTHORIZATION;
    }

    RequestAttributes att_rollback(vm_perms.uid, vm_perms.gid, att);

    auto dm = Nebula::instance().get_dm();

    if ( dm->resize(vid, ncpu, nvcpu, nmemory, no_overcommit, att, att.resp_msg) == -1 )
    {
        quota_rollback(&deltas, Quotas::VM, att_rollback);

        return Request::ACTION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::update_conf(int vid,
                                                  const std::string& str_tmpl,
                                                  int update_type,
                                                  RequestAttributes& att)
{
    if ( update_type < 0 || update_type > 1 )
    {
        att.resp_msg = "Wrong update type";

        return Request::RPC_API;
    }

    VirtualMachineTemplate tmpl;

    // -------------------------------------------------------------------------
    // Parse template
    // -------------------------------------------------------------------------
    int rc = tmpl.parse_str_or_xml(str_tmpl, att.resp_msg);

    if ( rc != 0 )
    {
        return Request::INTERNAL;
    }

    auto uc_tmpl = tmpl.get_updateconf_template();

    /* ---------------------------------------------------------------------- */
    /*  Authorize the operation & restricted attributes                       */
    /* ---------------------------------------------------------------------- */
    att.set_auth_op(VMActions::UPDATECONF_ACTION);

    if ( auto ec = vm_authorization(vid, 0, 0, att, 0, 0, 0); ec != Request::SUCCESS )
    {
        return ec;
    }

    /* ---------------------------------------------------------------------- */
    /* Update VirtualMachine Configuration                                    */
    /* ---------------------------------------------------------------------- */
    auto vm = vmpool->get(vid);

    if ( !vm )
    {
        att.resp_id = vid;

        return Request::NO_EXISTS;
    }

    if ( !att.is_admin() )
    {
        string aname;

        if ( vm->check_restricted(aname, uc_tmpl.get(), true) )
        {
            att.resp_msg = "Template includes a restricted attribute " + aname;

            return Request::AUTHORIZATION;
        }
    }

    rc = vm->updateconf(uc_tmpl.get(), att.resp_msg, update_type == 1);

    // rc = -1 (error), 0 (context changed), 1 (no context change)
    if ( rc == -1 )
    {
        return Request::INTERNAL;
    }

    /* ---------------------------------------------------------------------- */
    /* Update PORT if a new GRAPHICS section has been added & VM is deployed. */
    /* ---------------------------------------------------------------------- */
    VectorAttribute * graphics = vm->get_template_attribute("GRAPHICS");

    unsigned int port;

    VirtualMachine::VmState  state     = vm->get_state();
    VirtualMachine::LcmState lcm_state = vm->get_lcm_state();

    if (graphics != nullptr && graphics->vector_value("PORT", port) == -1 &&
        (state == VirtualMachine::ACTIVE || state == VirtualMachine::POWEROFF ||
         state == VirtualMachine::SUSPENDED))
    {
        ClusterPool * cpool = Nebula::instance().get_clpool();

        rc = cpool->get_vnc_port(vm->get_cid(), vm->get_oid(), port);

        if ( rc != 0 )
        {
            att.resp_msg = "No free VNC ports available in the cluster";

            return Request::INTERNAL;
        }

        graphics->replace("PORT", port);
    }

    vmpool->update(vm.get());

    // Apply the change for running VM
    if (state == VirtualMachine::VmState::ACTIVE &&
        lcm_state == VirtualMachine::LcmState::RUNNING && rc == 0)
    {
        auto dm = Nebula::instance().get_dm();

        if (dm->live_updateconf(std::move(vm), att, att.resp_msg) != 0)
        {
            return Request::INTERNAL;
        }
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::recover(int vid,
                                              int op,
                                              RequestAttributes& att)
{
    int    rc;
    string error;

    VMActions::Action action;

    switch (op)
    {
        case 0: //recover-failure
        case 1: //recover-success
            action = VMActions::RECOVER_ACTION;
            break;

        case 2: //retry
            action = VMActions::RETRY_ACTION;
            break;

        case 3: //delete
        case 5: //delete-db
            action = VMActions::DELETE_ACTION;
            break;

        case 4: //delete-recreate set same as delete in OpenNebulaTemplate
            action = VMActions::DELETE_RECREATE_ACTION;
            break;

        default:
            att.resp_msg = "Wrong recovery operation code";

            return Request::ACTION;
    }

    att.set_auth_op(action);

    if ( auto ec = vm_authorization(vid, 0, 0, att, 0, 0, 0); ec != Request::SUCCESS )
    {
        return ec;
    }

    auto vm = vmpool->get(vid);

    if ( !vm )
    {
        att.resp_id = vid;

        return Request::NO_EXISTS;
    }

    auto dm = Nebula::instance().get_dm();

    switch (op)
    {
        case 0: //recover-failure
            rc = dm->recover(std::move(vm), false, att, error);
            break;

        case 1: //recover-success
            rc = dm->recover(std::move(vm), true, att, error);
            break;

        case 2: //retry
            rc = dm->retry(std::move(vm), att, error);
            break;

        case 3: //delete
            rc = dm->delete_vm(std::move(vm), att, error);
            break;

        case 4: //delete-recreate
            rc = dm->delete_recreate(std::move(vm), att, error);
            break;
        case 5:
            rc = dm->delete_vm_db(std::move(vm), att, error);
            break;
    }

    if ( rc != 0 )
    {
        att.resp_msg = error;

        return Request::ACTION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::monitoring(int vid,
                                                 string& xml,
                                                 RequestAttributes& att)
{
    att.auth_op = AuthRequest::USE_NO_LCK;
    att.set_auth_op(VMActions::MONITOR_ACTION);

    if ( auto ec = vm_authorization(vid, 0, 0, att, 0, 0, 0); ec != Request::SUCCESS )
    {
        return ec;
    }

    int rc = vmpool->dump_monitoring(xml, vid);

    if ( rc != 0 )
    {
        att.resp_msg = "Internal error";

        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::sched_add(int vid,
                                                const std::string& str_tmpl,
                                                int& sched_id,
                                                RequestAttributes& att)
{
    att.set_auth_op(VMActions::SCHED_ADD_ACTION);

    if ( auto ec = basic_authorization(vid, att); ec != Request::SUCCESS )
    {
        return ec;
    }

    time_t stime;

    if ( auto vm = vmpool->get_ro(vid) )
    {
        stime = vm->get_stime();

        if (vm->get_state() == VirtualMachine::DONE)
        {
            att.resp_id = vid;
            att.resp_msg = "Unable to create Scheduled Action for Virtual Machine "
                           + to_string(vid) + ", it's in DONE state";

            return Request::INTERNAL;
        }
    }
    else
    {
        att.resp_id = vid;

        return Request::NO_EXISTS;
    }

    /* ---------------------------------------------------------------------- */
    /* Parse input template and create ScheduledAction object                 */
    /* ---------------------------------------------------------------------- */
    auto sapool = Nebula::instance().get_sapool();

    auto tmpl = std::make_unique<Template>();

    if (tmpl->parse_str_or_xml(str_tmpl, att.resp_msg) != 0)
    {
        return Request::INTERNAL;
    }

    const VectorAttribute * va = tmpl->get("SCHED_ACTION");

    if ( !va )
    {
        att.resp_msg = "No SCHED_ACTION attribute in template";

        return Request::ACTION;
    }

    sched_id = sapool->allocate(PoolObjectSQL::VM, vid, stime, va, att.resp_msg);

    if ( sched_id < 0 )
    {
        return Request::ACTION;
    }

    /* ---------------------------------------------------------------------- */
    /* Update the VirtualMachine to add the new ScheduledAction               */
    /* ---------------------------------------------------------------------- */
    if (auto vm = vmpool->get(vid))
    {
        vm->sched_actions().add(sched_id);

        vmpool->update(vm.get());
    }
    else
    {
        att.resp_id = vid;

        // VM no longer exists, cleanup the Scheduled Action
        if (auto sa = sapool->get(sched_id))
        {
            string err;
            sapool->drop(sa.get(), err);
        }

        return Request::NO_EXISTS;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::sched_update(int vid,
                                                   int sched_id,
                                                   const std::string& str_tmpl,
                                                   RequestAttributes& att)
{
    att.set_auth_op(VMActions::SCHED_UPDATE_ACTION);

    if ( auto ec = basic_authorization(vid, att); ec != Request::SUCCESS )
    {
        return ec;
    }

    /* ---------------------------------------------------------------------- */
    /* Parse input template and get SCHED_ACTION attribute                    */
    /* ---------------------------------------------------------------------- */
    auto tmpl = std::make_unique<Template>();

    if (tmpl->parse_str_or_xml(str_tmpl, att.resp_msg) != 0)
    {
        return Request::INTERNAL;
    }

    const VectorAttribute * v_sa = tmpl->get("SCHED_ACTION");

    if ( v_sa == nullptr )
    {
        att.resp_msg = "No SCHED_ACTION attribute in template";

        return Request::INTERNAL;
    }

    /* ---------------------------------------------------------------------- */
    /* Check Scheduled Action association                                     */
    /* ---------------------------------------------------------------------- */
    time_t stime;

    if ( auto vm = vmpool->get(vid) )
    {
        stime = vm->get_stime();

        if (!vm->sched_actions().contains(sched_id))
        {
            std::ostringstream oss;
            oss << "SCHED_ACTION with id = " << sched_id << " doesn't exist";

            att.resp_msg = oss.str();

            return Request::INTERNAL;
        }
    }
    else
    {
        att.resp_id = vid;

        return Request::NO_EXISTS;
    }

    /* ---------------------------------------------------------------------- */
    /* Update the ScheduledAction                                             */
    /* ---------------------------------------------------------------------- */
    auto sapool = Nebula::instance().get_sapool();

    if (auto sa = sapool->get(sched_id))
    {
        if (sa->parse(v_sa, stime, att.resp_msg) == -1)
        {
            return Request::INTERNAL;
        }

        sapool->update(sa.get());
    }
    else
    {
        std::ostringstream oss;
        oss << "Unable to get Scheduled Action id = " << sched_id
            << ". It doesn't exist or is malformed.";

        att.resp_msg = oss.str();

        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::sched_delete(int vid,
                                                   int sched_id,
                                                   RequestAttributes& att)
{
    att.set_auth_op(VMActions::SCHED_UPDATE_ACTION);

    if ( auto ec = basic_authorization(vid, att); ec != Request::SUCCESS )
    {
        return ec;
    }

    if ( auto vm = vmpool->get(vid) )
    {
        if ( vm->sched_actions().del(sched_id) == -1 )
        {
            att.resp_obj = PoolObjectSQL::SCHEDULEDACTION;
            att.resp_id  = sched_id;

            return Request::NO_EXISTS;
        }

        vmpool->update(vm.get());
    }
    else
    {
        att.resp_id = vid;

        return Request::NO_EXISTS;
    }

    auto& nd    = Nebula::instance();
    auto sapool = nd.get_sapool();

    if (auto sa = sapool->get(sched_id))
    {
        if (sapool->drop(sa.get(), att.resp_msg) != 0)
        {
            return Request::ACTION;
        }
    }
    else
    {
        att.resp_obj = PoolObjectSQL::SCHEDULEDACTION;
        att.resp_id = sched_id;

        return Request::NO_EXISTS;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::backup(int vid,
                                             int backup_ds_id,
                                             bool reset,
                                             int bj_id,
                                             RequestAttributes& att)
{

    Nebula&        nd = Nebula::instance();
    DatastorePool* dspool = nd.get_dspool();

    PoolObjectAuth vm_perms;
    PoolObjectAuth ds_perms;
    Template       quota_tmpl;

    Backups::Mode mode;
    int li_id;
    int bk_id = -1;
    long long backup_size = 0;

    // ------------------------------------------------------------------------
    // Get VM & Backup Information
    // ------------------------------------------------------------------------
    if ( auto vm = vmpool->get(vid) )
    {
        vm->get_permissions(vm_perms);

        backup_size = vm->backup_size(quota_tmpl);

        mode  = vm->backups().mode();
        li_id = vm->backups().last_increment_id();

        bk_id = vm->backups().incremental_backup_id();

        int vm_bj_id = vm->backups().backup_job_id();

        if ( bj_id == -1 && vm_bj_id != -1)
        {
            att.resp_msg = "Unable to start an individual backup for the Virtual Machine"
                           ", it is part of Backup Job ID " + to_string(bj_id);

            return Request::INTERNAL;
        }
    }
    else
    {
        att.resp_id  = vid;

        return Request::NO_EXISTS;
    }

    // Incremental backups use the current datastore if not resetting the chain
    if ( mode == Backups::INCREMENT && !reset && li_id != -1 )
    {
        ImagePool* ipool = nd.get_ipool();

        if (auto img = ipool->get_ro(bk_id))
        {
            backup_ds_id = img->get_ds_id();
        }
        else
        {
            att.resp_obj = PoolObjectSQL::IMAGE;
            att.resp_id  = bk_id;

            return Request::NO_EXISTS;
        }
    }

    if ( auto ds = dspool->get_ro(backup_ds_id) )
    {
        if (ds->get_type() != Datastore::BACKUP_DS)
        {
            att.resp_msg = "Datastore needs to be of type BACKUP";

            return Request::ACTION;
        }

        long long free_mb;
        bool check_capacity = ds->get_avail_mb(free_mb);

        if (check_capacity && free_mb < backup_size)
        {
            att.resp_msg = "Not enough free space on target datastore";

            return Request::ACTION;
        }

        ds->get_permissions(ds_perms);
    }
    else
    {
        att.resp_obj = PoolObjectSQL::DATASTORE;
        att.resp_id  = backup_ds_id;

        return Request::NO_EXISTS;
    }

    // ------------------------------------------------------------------------
    // Authorize request (VM and Datastore access)
    // ------------------------------------------------------------------------
    att.auth_op = AuthRequest::ADMIN;
    att.set_auth_op(VMActions::BACKUP_ACTION);

    if ( auto ec = vm_authorization(vid, 0, 0, att, 0, &ds_perms, 0); ec != Request::SUCCESS)
    {
        return ec;
    }

    // -------------------------------------------------------------------------
    // Check backup datastore quotas (size or number of backups)
    //
    // Reserves maximal possible quota size for the backup, the value is updated
    // after backup success notification from driver
    // -------------------------------------------------------------------------
    quota_tmpl.add("DATASTORE", backup_ds_id);

    if ( mode == Backups::FULL || li_id == -1 || reset )
    {
        quota_tmpl.add("IMAGES", 1);
    }
    else
    {
        quota_tmpl.add("IMAGES", 0);
    }


    RequestAttributes att_quota(vm_perms.uid, vm_perms.gid, att);

    if ( !quota_authorization(&quota_tmpl, Quotas::DATASTORE, att_quota, att.resp_msg) )
    {
        return Request::AUTHORIZATION;
    }

    // ------------------------------------------------------------------------
    // Create backup
    // ------------------------------------------------------------------------
    auto dm = nd.get_dm();

    if (dm->backup(vid, backup_ds_id, reset, att, att.resp_msg) < 0)
    {
        quota_rollback(&quota_tmpl, Quotas::DATASTORE, att_quota);

        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::backup_cancel(int vid,
                                     RequestAttributes& att)
{
    // Authorize request (VM access)
    att.auth_op = AuthRequest::ADMIN;
    att.set_auth_op(VMActions::BACKUP_CANCEL_ACTION);

    if ( auto ec = vm_authorization(vid, 0, 0, att, 0, 0, 0); ec != Request::SUCCESS )
    {
        return ec;
    }

    // Cancel the backup, VM state is checked in DM
    auto dm = Nebula::instance().get_dm();

    if (dm->backup_cancel(vid, att, att.resp_msg) != 0)
    {
        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::restore(int vid,
                               int image_id,
                               int increment_id,
                               int disk_id,
                               RequestAttributes& att)
{
    Nebula& nd = Nebula::instance();
    ImagePool *ipool  = nd.get_ipool();

    // Authorize request
    att.auth_op = AuthRequest::ADMIN;
    att.set_auth_op(VMActions::RESTORE_ACTION);

    PoolObjectAuth vm_perms, img_perms;

    if (auto vm = vmpool->get_ro(vid))
    {
        vm->get_permissions(vm_perms);

        if (disk_id != -1 && !vm->get_disk(disk_id))
        {
            att.resp_msg = "VM disk does not exist";

            return Request::ACTION;
        }
    }
    else
    {
        att.resp_id = vid;

        return Request::NO_EXISTS;
    }

    if (auto img = ipool->get_ro(image_id))
    {
        if (img->get_type() != Image::BACKUP)
        {
            att.resp_msg = "Image has to be of type BACKUP";

            return Request::ACTION;
        }

        if (increment_id > img->last_increment_id())
        {
            att.resp_msg = "Wrong increment";

            return Request::ACTION;
        }

        img->get_permissions(img_perms);
    }
    else
    {
        att.resp_obj = PoolObjectSQL::IMAGE;
        att.resp_id  = image_id;

        return Request::NO_EXISTS;
    }

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(att.auth_op, vm_perms);
    ar.add_auth(AuthRequest::USE, img_perms);

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;

        return Request::AUTHORIZATION;
    }

    auto dm = nd.get_dm();

    if (dm->restore(vid, image_id, increment_id, disk_id, att, att.resp_msg) != 0)
    {
        return Request::ACTION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::pci_attach(int vid,
                                                 const std::string& str_tmpl,
                                                 RequestAttributes& att)
{
    att.set_auth_op(VMActions::PCI_ATTACH_ACTION);

        // -------------------------------------------------------------------------
    // Parse PCI template and check PCI attributes
    // -------------------------------------------------------------------------
    VirtualMachineTemplate  tmpl;

    int cid = -1;

    int rc = tmpl.parse_str_or_xml(str_tmpl, att.resp_msg);

    if ( rc != 0 )
    {
        return Request::INTERNAL;
    }

    VectorAttribute * pci = tmpl.get("PCI");

    if ( pci == nullptr )
    {
        att.resp_msg = "PCI attribute not found";

        return Request::ACTION;
    }
    else if ( pci->vector_value("TYPE") == "NIC" )
    {
        att.resp_msg = "Use one.vm.attachnic to attach this PCI device";

        return Request::ACTION;
    }
    else if ( VirtualMachine::check_pci_attributes(pci, att.resp_msg) != 0)
    {
        return Request::ACTION;
    }

    // -------------------------------------------------------------------------
    // Authorize the operation, restricted attributes
    // -------------------------------------------------------------------------
    if ( auto ec = vm_authorization(vid, 0, 0, att, 0, 0, 0); ec != Request::SUCCESS )
    {
        return ec;
    }

    if (!att.is_admin())
    {
        string aname;

        if (tmpl.check_restricted(aname))
        {
            att.resp_msg = "PCI includes a restricted attribute " + aname;

            return Request::AUTHORIZATION;
        }
    }

    PoolObjectAuth vm_perms;

    if (auto vm = pool->get_ro<VirtualMachine>(vid))
    {
        vm->get_permissions(vm_perms);

        if (vm->hasHistory())
        {
            cid = vm->get_cid();
        }
    }
    else
    {
        att.resp_id = vid;

        return Request::NO_EXISTS;
    }

    RequestAttributes att_quota(vm_perms.uid, vm_perms.gid, att);

    Template quota_tmpl;
    quota_tmpl.add("CLUSTER_ID", cid);
    quota_tmpl.add("PCI_DEV", 1);

    if (!quota_authorization(&quota_tmpl, Quotas::VM, att_quota, att.resp_msg))
    {
        return Request::AUTHORIZATION;
    }

    // -------------------------------------------------------------------------
    // Perform the attach
    // -------------------------------------------------------------------------
    auto dm = Nebula::instance().get_dm();
    rc = dm->attach_pci(vid, pci, att, att.resp_msg);

    if ( rc != 0 )
    {
        quota_rollback(&quota_tmpl, Quotas::VM, att_quota);

        return Request::ACTION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::pci_detach(int vid,
                                                int pci_id,
                                                RequestAttributes& att)
{
    // -------------------------------------------------------------------------
    // Authorize the operation, restricted attributes
    // -------------------------------------------------------------------------
    att.set_auth_op(VMActions::PCI_DETACH_ACTION);

    if (auto ec = vm_authorization(vid, 0, 0, att, 0, 0, 0); ec != Request::SUCCESS)
    {
        return ec;
    }

    // -------------------------------------------------------------------------
    // Perform the detach
    // -------------------------------------------------------------------------
    auto dm = Nebula::instance().get_dm();

    int rc = dm->detach_pci(vid, pci_id, att, att.resp_msg);

    if ( rc != 0 )
    {
        return Request::ACTION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::exec(int vid,
                                           const std::string& cmd,
                                           const std::string& cmd_stdin,
                                           RequestAttributes& att)
{
    Nebula&           nd = Nebula::instance();
    DispatchManager * dm = nd.get_dm();

    int rc = dm->exec(vid, cmd, cmd_stdin, att, att.resp_msg);

    if ( rc != 0 )
    {
        return Request::ACTION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::exec_retry(int vid, RequestAttributes& att)
{
    auto vm = vmpool->get_ro(vid);

    if (!vm) {
        att.resp_id = vid;

        return Request::NO_EXISTS;
    }

    string cmd       = vm->get_vm_exec_command();
    string cmd_stdin = vm->get_vm_exec_stdin();

    Nebula&           nd = Nebula::instance();
    DispatchManager * dm = nd.get_dm();

    int rc = dm->exec(vid, cmd, cmd_stdin, att, att.resp_msg);

    if ( rc != 0 )
    {
        return Request::ACTION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::exec_cancel(int vid, RequestAttributes& att)
{
    Nebula&           nd = Nebula::instance();
    DispatchManager * dm = nd.get_dm();

    int rc = dm->exec_cancel(vid, att, att.resp_msg);

    if ( rc != 0 )
    {
        return Request::ACTION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::vm_authorization(int                     oid,
                                                       ImageTemplate *         tmpl,
                                                       VirtualMachineTemplate* vtmpl,
                                                       RequestAttributes&      att,
                                                       PoolObjectAuth *        host_perm,
                                                       PoolObjectAuth *        ds_perm,
                                                       PoolObjectAuth *        img_perm)
{
    PoolObjectAuth vm_perms;

    if (auto object = vmpool->get_ro(oid))
    {
        object->get_permissions(vm_perms);
    }
    else
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(att.auth_op, vm_perms);

    if (host_perm != nullptr)
    {
        ar.add_auth(AuthRequest::MANAGE, *host_perm);
    }

    if (tmpl != nullptr)
    {
        string t_xml;

        ar.add_create_auth(att.uid, att.gid, PoolObjectSQL::IMAGE,
                           tmpl->to_xml(t_xml));
    }

    if ( vtmpl != nullptr )
    {
        VirtualMachine::set_auth_request(att.uid, ar, vtmpl, true);
    }

    if ( ds_perm != nullptr )
    {
        ar.add_auth(AuthRequest::USE, *ds_perm);
    }

    if ( img_perm != nullptr )
    {
        ar.add_auth(AuthRequest::MANAGE, *img_perm);
    }

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;

        return Request::AUTHORIZATION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::get_host_information(int     hid,
                                                           string& name,
                                                           string& vmm,
                                                           int&    cluster_id,
                                                           PoolObjectAuth&    host_perms,
                                                           RequestAttributes& att)
{
    HostPool * hpool = Nebula::instance().get_hpool();
    auto       host  = hpool->get_ro(hid);

    if ( !host )
    {
        att.resp_obj = PoolObjectSQL::HOST;
        att.resp_id  = hid;

        return Request::NO_EXISTS;
    }

    if ( host->get_state() == Host::OFFLINE )
    {
        att.resp_msg = "Host is offline, cannot use it to deploy VM";

        return Request::ACTION;
    }

    name = host->get_name();
    vmm  = host->get_vmm_mad();

    cluster_id = host->get_cluster_id();

    host->get_permissions(host_perms);

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::get_ds_information(int ds_id,
                                                         set<int>& ds_cluster_ids,
                                                         string& tm_mad,
                                                         RequestAttributes& att,
                                                         bool& ds_migr)
{
    auto ds = Nebula::instance().get_dspool()->get_ro(ds_id);

    ds_cluster_ids.clear();

    if ( ds == nullptr )
    {
        att.resp_obj = PoolObjectSQL::DATASTORE;
        att.resp_id  = ds_id;

        return Request::NO_EXISTS;
    }

    if ( ds->get_type() != Datastore::SYSTEM_DS )
    {
        ostringstream oss;

        oss << "Trying to use " << RequestLogger::object_name(PoolObjectSQL::DATASTORE)
            << " [" << ds_id << "] to deploy the VM, but it is not of type"
            << " system datastore.";

        att.resp_msg = oss.str();

        return Request::INTERNAL;
    }

    ds_cluster_ids = ds->get_cluster_ids();

    tm_mad = ds->get_tm_mad();

    ds->get_template_attribute("DS_MIGRATE", ds_migr);

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAPI::get_default_ds_information(int cluster_id,
                                                                 int& ds_id,
                                                                 string& tm_mad,
                                                                 RequestAttributes& att)
{
    ClusterPool* clpool = Nebula::instance().get_clpool();

    bool ds_migr;

    set<int> ds_ids;

    ds_id = -1;

    if ( auto cluster = clpool->get_ro(cluster_id) )
    {
        ds_ids = cluster->get_datastore_ids();

        ds_id = Cluster::get_default_system_ds(ds_ids);
    }
    else
    {
        att.resp_obj = PoolObjectSQL::CLUSTER;
        att.resp_id  = cluster_id;

        return Request::NO_EXISTS;
    }

    if ( ds_id == -1 )
    {
        ostringstream oss;

        oss << RequestLogger::object_name(PoolObjectSQL::CLUSTER) << " [" << cluster_id
            << "] does not have any " << RequestLogger::object_name(PoolObjectSQL::DATASTORE)
            << " of type " << Datastore::type_to_str(Datastore::SYSTEM_DS)
            << ".";

        att.resp_msg = oss.str();

        return Request::ACTION;
    }

    set<int> ds_cluster_ids;

    return get_ds_information(ds_id, ds_cluster_ids, tm_mad, att, ds_migr);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool VirtualMachineAPI::check_host(int hid,
                                   bool enforce,
                                   VirtualMachine* vm,
                                   string& error)
{
    HostPool * hpool = Nebula::instance().get_hpool();

    bool   test = true;
    string capacity_error;

    HostShareCapacity sr;

    vm->get_capacity(sr);

    auto host = hpool->get_ro(hid);

    if ( !host )
    {
        error = "Host no longer exists";
        return false;
    }

    if ( enforce )
    {
        test = host->test_capacity(sr, capacity_error, enforce);
    }

    if (enforce && !test)
    {
        ostringstream oss;

        oss << RequestLogger::object_name(PoolObjectSQL::VM) << " [" << vm->get_oid()
            << "] does not fit in " << RequestLogger::object_name(PoolObjectSQL::HOST) << " ["
            << hid << "]. " << capacity_error;

        error = oss.str();
    }

    return test;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int VirtualMachineAPI::add_history(VirtualMachine * vm,
                                   int              hid,
                                   int              cid,
                                   const string&    hostname,
                                   const string&    vmm_mad,
                                   const string&    tm_mad,
                                   int              ds_id,
                                   RequestAttributes& att)
{
    vm->add_history(hid, cid, hostname, vmm_mad, tm_mad, ds_id);

    if ( vmpool->insert_history(vm) != 0 )
    {
        att.resp_msg = "Cannot update virtual machine history";

        return -1;
    }

    if ( vmpool->update(vm) != 0 )
    {
        att.resp_msg = "Cannot update virtual machine";

        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAllocateAPI::allocate(const std::string& str_tmpl,
                                                       bool hold,
                                                       int& oid,
                                                       RequestAttributes& att)
{
    on_hold = hold;

    return SharedAPI::allocate(str_tmpl, ClusterPool::NONE_CLUSTER_ID, oid, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAllocateAPI::pool_allocate(std::unique_ptr<Template> tmpl,
                                                            int& id,
                                                            RequestAttributes& att)
{
    auto sapool = Nebula::instance().get_sapool();

    std::vector<int> sa_ids;

    bool sa_error = false;

    time_t stime  = time(0);

    /* ---------------------------------------------------------------------- */
    /* Save SCHED_ACTION attributes for allocation                            */
    /* ---------------------------------------------------------------------- */
    std::vector<unique_ptr<VectorAttribute>> sas;

    tmpl->remove("SCHED_ACTION", sas);

    /* ---------------------------------------------------------------------- */
    /* Allocate VirtualMachine object                                         */
    /* ---------------------------------------------------------------------- */
    VirtualMachineTemplate tmpl_back(*tmpl);

    auto tmpl_ptr = static_cast<VirtualMachineTemplate*>(tmpl.release());

    unique_ptr<VirtualMachineTemplate> ttmpl(tmpl_ptr);

    int rc = vmpool->allocate(att.uid, att.gid, att.uname, att.gname, att.umask,
                              std::move(ttmpl), &id, att.resp_msg, on_hold);

    if ( rc < 0 )
    {
        goto error_drop_vm;
    }

    /* ---------------------------------------------------------------------- */
    /* Create ScheduleAction and associate to the VM                          */
    /* ---------------------------------------------------------------------- */
    for (const auto& sa : sas)
    {
        int sa_id = sapool->allocate(PoolObjectSQL::VM, id, stime, sa.get(), att.resp_msg);

        if (sa_id < 0)
        {
            sa_error = true;
            break;
        }

        sa_ids.push_back(sa_id);
    }

    /* ---------------------------------------------------------------------- */
    /* Error creating a SCHED_ACTION rollback created objects                 */
    /* ---------------------------------------------------------------------- */
    if (sa_error)
    {
        sapool->drop_sched_actions(sa_ids);

        goto error_drop_vm;
    }

    /* ---------------------------------------------------------------------- */
    /* Associate SCHED_ACTIONS to the VM                                      */
    /* ---------------------------------------------------------------------- */
    if ( auto vm = vmpool->get(id) )
    {
        for (const auto sa_id: sa_ids)
        {
            vm->sched_actions().add(sa_id);
        }

        vmpool->update(vm.get());
    }
    else
    {
        att.resp_msg = "VM deleted while setting up SCHED_ACTION";

        sapool->drop_sched_actions(sa_ids);

        return Request::INTERNAL;
    }

    return Request::SUCCESS;

error_drop_vm:
    vector<unique_ptr<Template>> ds_quotas;

    tmpl_back.update_quota_attributes();

    QuotaVirtualMachine::add_running_quota_generic(tmpl_back);

    quota_rollback(&tmpl_back, Quotas::VIRTUALMACHINE, att);

    VirtualMachineDisks::extended_info(att.uid, &tmpl_back);

    VirtualMachineDisks::image_ds_quotas(&tmpl_back, ds_quotas);

    for (auto& quota : ds_quotas)
    {
        quota_rollback(quota.get(), Quotas::DATASTORE, att);
    }

    return Request::INTERNAL;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAllocateAPI::allocate_authorization(Template *tmpl,
                                                                     RequestAttributes&  att,
                                                                     PoolObjectAuth *cluster_perms)
{
    AuthRequest ar(att.uid, att.group_ids);
    string      t64;
    string      aname;

    VirtualMachineTemplate * ttmpl = static_cast<VirtualMachineTemplate *>(tmpl);

    // ------------ Check template for restricted attributes -------------------

    if (!att.is_admin())
    {
        if (ttmpl->check_restricted(aname))
        {
            att.resp_msg = "VM Template includes a restricted attribute "+aname;

            return Request::AUTHORIZATION;
        }
    }

    // ------------------ Authorize VM create operation ------------------------

    ar.add_create_auth(att.uid, att.gid, request.auth_object(), tmpl->to_xml(t64));

    VirtualMachine::set_auth_request(att.uid, ar, ttmpl, true);

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;

        return Request::AUTHORIZATION;
    }

    // ---------------------- Check Quotas & Topology --------------------------

    if (VirtualMachine::parse_topology(ttmpl, att.resp_msg) != 0)
    {
        return Request::ALLOCATE;
    }

    VirtualMachineTemplate aux_tmpl(*ttmpl);

    VirtualMachineDisks::extended_info(att.uid, &aux_tmpl);

    aux_tmpl.update_quota_attributes();

    QuotaVirtualMachine::add_running_quota_generic(aux_tmpl);

    if ( !quota_authorization(&aux_tmpl, Quotas::VIRTUALMACHINE, att, att.resp_msg) )
    {
        return Request::AUTHORIZATION;
    }

    vector<unique_ptr<Template>> ds_quotas;
    vector<unique_ptr<Template>> applied;

    bool ds_quota_auth = true;

    VirtualMachineDisks::image_ds_quotas(&aux_tmpl, ds_quotas);

    for (auto& quota : ds_quotas)
    {
        if ( !quota_authorization(quota.get(), Quotas::DATASTORE, att, att.resp_msg) )
        {
            ds_quota_auth = false;
        }
        else
        {
            applied.push_back(move(quota));
        }
    }

    if ( ds_quota_auth == false )
    {
        quota_rollback(&aux_tmpl, Quotas::VIRTUALMACHINE, att);

        for (auto& quota : applied)
        {
            quota_rollback(quota.get(), Quotas::DATASTORE, att);
        }
    }

    return ds_quota_auth ? Request::SUCCESS : Request::AUTHORIZATION;
}

