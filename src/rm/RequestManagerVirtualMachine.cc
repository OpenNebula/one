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

#include "RequestManagerVirtualMachine.h"
#include "PoolObjectAuth.h"
#include "Nebula.h"
#include "Quotas.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool RequestManagerVirtualMachine::vm_authorization(
        int                     oid,
        ImageTemplate *         tmpl,
        VirtualMachineTemplate* vtmpl,
        RequestAttributes&      att,
        PoolObjectAuth *        host_perm,
        PoolObjectAuth *        ds_perm,
        PoolObjectAuth *        img_perm,
        AuthRequest::Operation  op)
{
    PoolObjectSQL * object;
    PoolObjectAuth vm_perms;

    object = pool->get(oid,true);

    if ( object == 0 )
    {
        att.resp_id = oid;
        failure_response(NO_EXISTS, att);

        return false;
    }

    if ( att.uid == 0 )
    {
        object->unlock();
        return true;
    }

    object->get_permissions(vm_perms);

    object->unlock();

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(op, vm_perms);

    if (host_perm != 0)
    {
        ar.add_auth(AuthRequest::MANAGE, *host_perm);
    }

    if (tmpl != 0)
    {
        string t_xml;

        ar.add_create_auth(att.uid, att.gid, PoolObjectSQL::IMAGE, tmpl->to_xml(t_xml));
    }

    if ( vtmpl != 0 )
    {
        VirtualMachine::set_auth_request(att.uid, ar, vtmpl);
    }

    if ( ds_perm != 0 )
    {
        ar.add_auth(AuthRequest::USE, *ds_perm);
    }

    if ( img_perm != 0 )
    {
        ar.add_auth(AuthRequest::MANAGE, *img_perm);
    }

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;
        failure_response(AUTHORIZATION, att);

        return false;
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool RequestManagerVirtualMachine::quota_resize_authorization(
        int                 oid,
        Template *          deltas,
        RequestAttributes&  att)
{
    PoolObjectAuth      vm_perms;
    VirtualMachine *    vm = Nebula::instance().get_vmpool()->get(oid, true);

    if (vm == 0)
    {
        att.resp_obj = PoolObjectSQL::VM;
        att.resp_id  = oid;
        failure_response(NO_EXISTS, att);
        return false;
    }

    vm->get_permissions(vm_perms);

    vm->unlock();

    return quota_resize_authorization(deltas, att, vm_perms);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool RequestManagerVirtualMachine::quota_resize_authorization(
        Template *          deltas,
        RequestAttributes&  att,
        PoolObjectAuth&     vm_perms)
{
    int rc;

    Nebula&    nd    = Nebula::instance();
    UserPool*  upool = nd.get_upool();
    GroupPool* gpool = nd.get_gpool();

    DefaultQuotas user_dquotas  = nd.get_default_user_quota();
    DefaultQuotas group_dquotas = nd.get_default_group_quota();

    if (vm_perms.uid != UserPool::ONEADMIN_ID)
    {
        User * user  = upool->get(vm_perms.uid, true);

        if ( user != 0 )
        {
            rc = user->quota.quota_update(Quotas::VM, deltas, user_dquotas, att.resp_msg);

            if (rc == false)
            {
                ostringstream oss;

                oss << object_name(PoolObjectSQL::USER) << " [" << vm_perms.uid << "] "
                    << att.resp_msg;

                att.resp_msg = oss.str();

                failure_response(AUTHORIZATION, att);

                user->unlock();

                return false;
            }

            upool->update_quotas(user);

            user->unlock();
        }
    }

    if (vm_perms.gid != GroupPool::ONEADMIN_ID)
    {
        Group * group  = gpool->get(vm_perms.gid, true);

        if ( group != 0 )
        {
            rc = group->quota.quota_update(Quotas::VM, deltas, group_dquotas, att.resp_msg);

            if (rc == false)
            {
                ostringstream oss;
                RequestAttributes att_tmp(vm_perms.uid, -1, att);

                oss << object_name(PoolObjectSQL::GROUP) << " [" << vm_perms.gid << "] "
                    << att.resp_msg;

                att.resp_msg = oss.str();

                failure_response(AUTHORIZATION, att);

                group->unlock();

                quota_rollback(deltas, Quotas::VM, att_tmp);

                return false;
            }

            gpool->update_quotas(group);

            group->unlock();
        }
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int RequestManagerVirtualMachine::get_default_ds_information(
    int cluster_id,
    int& ds_id,
    string& tm_mad,
    RequestAttributes& att)
{
    Nebula& nd = Nebula::instance();

    ClusterPool* clpool = nd.get_clpool();
    Cluster*     cluster;

    bool ds_migr;

    ds_id = -1;

    cluster = clpool->get(cluster_id, true);

    if (cluster == 0)
    {
        att.resp_obj = PoolObjectSQL::CLUSTER;
        att.resp_id  = cluster_id;
        failure_response(NO_EXISTS, att);

        return -1;
    }

    set<int> ds_ids = cluster->get_datastores();

    cluster->unlock();

    ds_id = Cluster::get_default_system_ds(ds_ids);

    if (ds_id == -1)
    {
        ostringstream oss;

        oss << object_name(PoolObjectSQL::CLUSTER) << " [" << cluster_id
            << "] does not have any " << object_name(PoolObjectSQL::DATASTORE)
            << " of type " << Datastore::type_to_str(Datastore::SYSTEM_DS)
            << ".";

        att.resp_msg = oss.str();

        failure_response(ACTION, att);

        return -1;
    }

    set<int> ds_cluster_ids;

    return get_ds_information(ds_id, ds_cluster_ids, tm_mad, att, ds_migr);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int RequestManagerVirtualMachine::get_ds_information(int ds_id,
    set<int>& ds_cluster_ids,
    string& tm_mad,
    RequestAttributes& att,
    bool& ds_migr)
{
    Nebula& nd = Nebula::instance();

    Datastore * ds = nd.get_dspool()->get(ds_id, true);

    ds_cluster_ids.clear();

    if ( ds == 0 )
    {
        att.resp_obj = PoolObjectSQL::DATASTORE;
        att.resp_id  = ds_id;
        failure_response(NO_EXISTS, att);
        return -1;
    }

    if ( ds->get_type() != Datastore::SYSTEM_DS )
    {
        ostringstream oss;

        oss << "Trying to use " << object_name(PoolObjectSQL::DATASTORE)
            << " [" << ds_id << "] to deploy the VM, but it is not of type"
            << " system datastore.";

        att.resp_msg = oss.str();

        failure_response(INTERNAL, att);

        ds->unlock();

        return -1;
    }

    ds_cluster_ids = ds->get_cluster_ids();

    tm_mad = ds->get_tm_mad();

    ds->get_template_attribute("DS_MIGRATE", ds_migr);

    ds->unlock();

    return 0;
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int RequestManagerVirtualMachine::get_host_information(
    int     hid,
    string& name,
    string& vmm,
    int&    cluster_id,
    bool&   is_public_cloud,
    PoolObjectAuth&    host_perms,
    RequestAttributes& att)


{
    Nebula&    nd    = Nebula::instance();
    HostPool * hpool = nd.get_hpool();

    Host *     host  = hpool->get(hid,true);

    if ( host == 0 )
    {
        att.resp_obj = PoolObjectSQL::HOST;
        att.resp_id  = hid;
        failure_response(NO_EXISTS, att);
        return -1;
    }

    if ( host->get_state() == Host::OFFLINE )
    {
        att.resp_msg = "Host is offline, cannot use it to deploy VM";
        failure_response(ACTION, att);

        host->unlock();

        return -1;
    }

    name = host->get_name();
    vmm  = host->get_vmm_mad();

    cluster_id = host->get_cluster_id();

    is_public_cloud = host->is_public_cloud();

    host->get_permissions(host_perms);

    host->unlock();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool RequestManagerVirtualMachine::check_host(
        int hid, bool enforce, VirtualMachine* vm, string& error)
{
    Nebula&    nd    = Nebula::instance();
    HostPool * hpool = nd.get_hpool();

    Host * host;
    bool   test;
    string capacity_error;

    int cpu, mem, disk;
    vector<VectorAttribute *> pci;

    vm->get_requirements(cpu, mem, disk, pci);

    host = hpool->get(hid, true);

    if (host == 0)
    {
        error = "Host no longer exists";
        return false;
    }

    if (enforce)
    {
        test = host->test_capacity(cpu, mem, disk, pci, capacity_error);
    }
    else
    {
        test = host->test_capacity(pci, capacity_error);
    }

    if (!test)
    {
        ostringstream oss;

        oss << object_name(PoolObjectSQL::VM) << " [" << vm->get_oid()
            << "] does not fit in " << object_name(PoolObjectSQL::HOST) << " ["
            << hid << "]. " << capacity_error;

        error = oss.str();
    }

    host->unlock();

    return test;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VirtualMachine * RequestManagerVirtualMachine::get_vm(int id,
                                                      RequestAttributes& att)
{
    VirtualMachine * vm;

    vm = static_cast<VirtualMachine *>(pool->get(id,true));

    if ( vm == 0 )
    {
        att.resp_id = id;
        failure_response(NO_EXISTS, att);
        return 0;
    }

    return vm;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int RequestManagerVirtualMachine::add_history(VirtualMachine * vm,
                                       int              hid,
                                       int              cid,
                                       const string&    hostname,
                                       const string&    vmm_mad,
                                       const string&    tm_mad,
                                       int              ds_id,
                                       RequestAttributes& att)
{
    string  vmdir;

    VirtualMachinePool * vmpool = static_cast<VirtualMachinePool *>(pool);

    vm->add_history(hid, cid, hostname, vmm_mad, tm_mad, ds_id);

    if ( vmpool->update_history(vm) != 0 )
    {
        att.resp_msg = "Cannot update virtual machine history";
        failure_response(INTERNAL, att);

        return -1;
    }

    if ( vmpool->update(vm) != 0 )
    {
        att.resp_msg = "Cannot update virtual machine";
        failure_response(INTERNAL, att);

        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineAction::request_execute(xmlrpc_c::paramList const& paramList,
                                           RequestAttributes& att)
{
    string action_st = xmlrpc_c::value_string(paramList.getString(1));
    int    id        = xmlrpc_c::value_int(paramList.getInt(2));

    int    rc;

    Nebula& nd = Nebula::instance();
    DispatchManager * dm = nd.get_dm();

    ostringstream oss;
    string error;

    AuthRequest::Operation op = auth_op;
    History::VMAction action;

    VirtualMachine * vm;

    // Compatibility with 3.8
    if (action_st == "cancel")
    {
        action_st = "shutdown-hard";
    }
    else if (action_st == "finalize")
    {
        action_st = "delete";
    }
    else if (action_st == "resubmit")
    {
        action_st = "delete-recreate";
    }
    else if (action_st == "reset")
    {
        action_st = "reboot-hard";
    }

    History::action_from_str(action_st, action);

    if (action == History::RESCHED_ACTION || action == History::UNRESCHED_ACTION)
    {
        op = AuthRequest::ADMIN;
    }

    if ( vm_authorization(id, 0, 0, att, 0, 0, 0, op) == false )
    {
        return;
    }

    if ((vm = get_vm(id, att)) == 0)
    {
        return;
    }

    if (vm->is_imported() && !vm->is_imported_action_supported(action))
    {
        att.resp_msg = "Action \"" + action_st + "\" is not supported for imported VMs";
        failure_response(ACTION, att);

        vm->unlock();
        return;
    }

    if (vm->is_vrouter() && !VirtualRouter::is_action_supported(action))
    {
        bool failure = true;

        // Delete operation is allowed for orphan virtual router VMs.
        if (action == History::DELETE_ACTION ||
            action == History::SHUTDOWN_ACTION ||
            action == History::SHUTDOWN_HARD_ACTION)
        {
            VirtualRouterPool* vrpool = Nebula::instance().get_vrouterpool();
            failure = (vrpool->get(vm->get_vrouter_id(), false) != 0);
        }

        if (failure)
        {
            att.resp_msg = "Action \""+action_st+"\" is not supported for "
                "virtual router VMs";
            failure_response(ACTION, att);

            vm->unlock();
            return;
        }
    }

    vm->unlock();

    switch (action)
    {
        case History::SHUTDOWN_ACTION:
            rc = dm->shutdown(id, false, error);
            break;
        case History::HOLD_ACTION:
            rc = dm->hold(id, error);
            break;
        case History::RELEASE_ACTION:
            rc = dm->release(id, error);
            break;
        case History::STOP_ACTION:
            rc = dm->stop(id, error);
            break;
        case History::SHUTDOWN_HARD_ACTION:
            rc = dm->shutdown(id, true, error);
            break;
        case History::SUSPEND_ACTION:
            rc = dm->suspend(id, error);
            break;
        case History::RESUME_ACTION:
            rc = dm->resume(id, error);
            break;
        case History::DELETE_ACTION:
            rc = dm->finalize(id, error);
            break;
        case History::DELETE_RECREATE_ACTION:
            rc = dm->resubmit(id, error);
            break;
        case History::REBOOT_ACTION:
            rc = dm->reboot(id, false, error);
            break;
        case History::RESCHED_ACTION:
            rc = dm->resched(id, true, error);
            break;
        case History::UNRESCHED_ACTION:
            rc = dm->resched(id, false, error);
            break;
        case History::REBOOT_HARD_ACTION:
            rc = dm->reboot(id, true, error);
            break;
        case History::POWEROFF_ACTION:
            rc = dm->poweroff(id, false, error);
            break;
        case History::POWEROFF_HARD_ACTION:
            rc = dm->poweroff(id, true, error);
            break;
        case History::UNDEPLOY_ACTION:
            rc = dm->undeploy(id, false, error);
            break;
        case History::UNDEPLOY_HARD_ACTION:
            rc = dm->undeploy(id, true, error);
            break;
        default:
            rc = -3;
            break;
    }

    switch (rc)
    {
        case 0:
            success_response(id, att);
            break;
        case -1:
            att.resp_id = id;
            failure_response(NO_EXISTS, att);
            break;
        case -2:
            oss << "Error performing action \"" << action_st << "\" on "
                << object_name(auth_object) << " [" << id << "]. " << error;
            att.resp_msg = oss.str();

            failure_response(ACTION, att);
            break;
        case -3:
            oss << "Virtual machine action \"" << action_st << "\" is not supported";
            att.resp_msg = oss.str();

            failure_response(ACTION, att);
            break;
        default:
            att.resp_msg = "Internal error. Action result not defined";
            failure_response(INTERNAL, att);
    }

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 *  Adds extra info to the volatile disks of the given template, ds inherited
 *  attributes and TYPE
 *    @param ds_id datastore id
 *    @param vd vector of DISKS
 *    @return true if there at least one volatile disk was found
 */
static bool set_volatile_disk_info(int ds_id, vector<VectorAttribute *>& vd)
{
    DatastorePool * ds_pool = Nebula::instance().get_dspool();

    bool found = false;

    for(vector<VectorAttribute *>::iterator it = vd.begin(); it!=vd.end(); ++it)
    {
        if ( !VirtualMachine::is_volatile(*it) )
        {
            continue;
        }

        ds_pool->disk_attribute(ds_id, *it);

        found = true;
    }

    return found;
}

static bool set_volatile_disk_info(VirtualMachine *vm, int ds_id)
{
    vector<VectorAttribute *> disks;

    vm->get_template_attribute("DISK", disks);

    bool found = set_volatile_disk_info(ds_id, disks);

    if ( found )
    {
        Nebula::instance().get_vmpool()->update(vm);
    }

    return found;
}


static bool set_volatile_disk_info(VirtualMachine *vm, int ds_id, Template& tmpl)
{
    vector<VectorAttribute *> disks;

    tmpl.get("DISK", disks);

    bool found = set_volatile_disk_info(ds_id, disks);

    if ( found )
    {
        Nebula::instance().get_vmpool()->update(vm);
    }

    return found;
}

/* -------------------------------------------------------------------------- */

int set_vnc_port(VirtualMachine *vm, int cluster_id, RequestAttributes& att)
{
    ClusterPool * cpool = Nebula::instance().get_clpool();

    VectorAttribute * graphics = vm->get_template_attribute("GRAPHICS");

    unsigned int port;
    int rc;

    if (graphics == 0)
    {
        return 0;
    }
    else if (graphics->vector_value("PORT", port) == 0)
    {
        rc = cpool->set_vnc_port(cluster_id, port);

        if ( rc != 0 )
        {
            att.resp_msg = "Requested VNC port already assgined to a VM";
        }
    }
    else
    {
        rc = cpool->get_vnc_port(cluster_id, vm->get_oid(), port);

        if ( rc == 0 )
        {
            graphics->replace("PORT", port);

            Nebula::instance().get_vmpool()->update(vm);
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

void VirtualMachineDeploy::request_execute(xmlrpc_c::paramList const& paramList,
                                           RequestAttributes& att)
{
    Nebula&             nd = Nebula::instance();
    DispatchManager *   dm = nd.get_dm();
    DatastorePool * dspool = nd.get_dspool();

    VirtualMachine * vm;

    string hostname;
    string vmm_mad;
    int    cluster_id;
    bool   is_public_cloud;

    PoolObjectAuth host_perms, ds_perms;
    PoolObjectAuth * auth_ds_perms;

    string tm_mad;

    bool auth = false;

    // ------------------------------------------------------------------------
    // Get request parameters and information about the target host
    // ------------------------------------------------------------------------

    int  id      = xmlrpc_c::value_int(paramList.getInt(1));
    int  hid     = xmlrpc_c::value_int(paramList.getInt(2));
    bool enforce = false;
    int  ds_id   = -1;

    if ( paramList.size() > 3 )
    {
        enforce = xmlrpc_c::value_boolean(paramList.getBoolean(3));
    }

    if ( paramList.size() > 4 )
    {
        ds_id = xmlrpc_c::value_int(paramList.getInt(4));
    }

    if (get_host_information(hid,
                             hostname,
                             vmm_mad,
                             cluster_id,
                             is_public_cloud,
                             host_perms,
                             att) != 0)
    {
        return;
    }

    // ------------------------------------------------------------------------
    // Get information about the system DS to use (tm_mad & permissions)
    // ------------------------------------------------------------------------

    if ((vm = get_vm(id, att)) == 0)
    {
        return;
    }

    if (vm->hasHistory() &&
        (vm->get_action() == History::STOP_ACTION ||
         vm->get_action() == History::UNDEPLOY_ACTION ||
         vm->get_action() == History::UNDEPLOY_HARD_ACTION))
    {
        ds_id = vm->get_ds_id();
    }

    vm->unlock();

    if (is_public_cloud) // Set ds_id to -1 and tm_mad empty(). This is used by
    {                    // by VirtualMachine::get_host_is_cloud()
        ds_id  = -1;
        tm_mad = "";
    }
    else
    {
        if ( ds_id == -1 ) //Use default system DS for cluster
        {
            if (get_default_ds_information(cluster_id, ds_id, tm_mad, att) != 0)
            {
                return;
            }
        }
        else //Get information from user selected system DS
        {
            set<int> ds_cluster_ids;
            bool     ds_migr;

            if (get_ds_information(ds_id,ds_cluster_ids,tm_mad,att,ds_migr) != 0)
            {
                return;
            }

            if (ds_cluster_ids.count(cluster_id) == 0)
            {
                ostringstream oss;

                oss << object_name(PoolObjectSQL::DATASTORE) << " [" << ds_id
                    << "] and " << object_name(PoolObjectSQL::HOST) << " ["
                    << hid << "] are not in the same "
                    << object_name(PoolObjectSQL::CLUSTER) << " [" << cluster_id
                    << "].";

                att.resp_msg = oss.str();

                failure_response(ACTION, att);

                return;
            }
        }
    }

    if (ds_id == -1)
    {
       auth_ds_perms = 0;
    }
    else
    {
        Datastore * ds = dspool->get(ds_id, true);

        if (ds == 0 )
        {
            att.resp_obj = PoolObjectSQL::DATASTORE;
            att.resp_id  = ds_id;
            failure_response(NO_EXISTS, att);

            return;
        }

        ds->get_permissions(ds_perms);

        ds->unlock();

        auth_ds_perms = &ds_perms;
    }

    // ------------------------------------------------------------------------
    // Authorize request
    // ------------------------------------------------------------------------

    auth = vm_authorization(id, 0, 0, att, &host_perms, auth_ds_perms, 0, auth_op);

    if (auth == false)
    {
        return;
    }

    // ------------------------------------------------------------------------
    // Check request consistency:
    // - VM States are right
    // - Host capacity if required
    // ------------------------------------------------------------------------
    if ((vm = get_vm(id, att)) == 0)
    {
        return;
    }

    if (vm->get_state() != VirtualMachine::PENDING &&
        vm->get_state() != VirtualMachine::HOLD &&
        vm->get_state() != VirtualMachine::STOPPED &&
        vm->get_state() != VirtualMachine::UNDEPLOYED)
    {
        att.resp_msg = "Deploy action is not available for state " +
            vm->state_str();

        failure_response(ACTION, att);

        vm->unlock();
        return;
    }

    if (check_host(hid, enforce, vm, att.resp_msg) == false)
    {
        vm->unlock();

        failure_response(ACTION, att);
        return;
    }

    // ------------------------------------------------------------------------
    // Add deployment dependent attributes to VM
    //   - volatile disk (selected system DS driver)
    //   - vnc port (free in the selected cluster)
    // ------------------------------------------------------------------------
    set_volatile_disk_info(vm, ds_id);

    if (set_vnc_port(vm, cluster_id, att) != 0)
    {
        failure_response(ACTION, att);
        vm->unlock();
        return;
    }

    // ------------------------------------------------------------------------
    // Add a new history record
    // ------------------------------------------------------------------------
    if (add_history(vm,
                    hid,
                    cluster_id,
                    hostname,
                    vmm_mad,
                    tm_mad,
                    ds_id,
                    att) != 0)
    {
        vm->unlock();
        return;
    }

    // ------------------------------------------------------------------------
    // deploy the VM
    // ------------------------------------------------------------------------

    if (vm->is_imported())
    {
        dm->import(vm);
    }
    else
    {
        dm->deploy(vm);
    }

    vm->unlock();

    success_response(id, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineMigrate::request_execute(xmlrpc_c::paramList const& paramList,
                                            RequestAttributes& att)
{
    Nebula&             nd = Nebula::instance();
    DispatchManager *   dm = nd.get_dm();
    DatastorePool * dspool = nd.get_dspool();

    VirtualMachine * vm;

    string hostname;
    string vmm_mad;
    int    cluster_id;
    set<int> ds_cluster_ids;
    bool   is_public_cloud;
    PoolObjectAuth host_perms, ds_perms;
    PoolObjectAuth * auth_ds_perms;

    int    c_hid;
    int    c_cluster_id;
    int    c_ds_id;
    string c_tm_mad, tm_mad;
    bool   c_is_public_cloud;

    bool auth = false;

    string error;

    History::VMAction action;

    // ------------------------------------------------------------------------
    // Get request parameters and information about the target host
    // ------------------------------------------------------------------------

    int  id      = xmlrpc_c::value_int(paramList.getInt(1));
    int  hid     = xmlrpc_c::value_int(paramList.getInt(2));
    bool live    = xmlrpc_c::value_boolean(paramList.getBoolean(3));
    bool enforce = false;
    int  ds_id   = -1;

    if ( paramList.size() > 4 )
    {
        enforce = xmlrpc_c::value_boolean(paramList.getBoolean(4));
    }

    if ( paramList.size() > 5 )
    {
        ds_id = xmlrpc_c::value_int(paramList.getInt(5));
    }

    if (get_host_information(hid,
                             hostname,
                             vmm_mad,
                             cluster_id,
                             is_public_cloud,
                             host_perms,
                             att) != 0)
    {
        return;
    }

    if (ds_id == -1)
    {
       auth_ds_perms = 0;
    }
    else
    {
        Datastore * ds = dspool->get(ds_id, true);

        if (ds == 0 )
        {
            att.resp_obj = PoolObjectSQL::DATASTORE;
            att.resp_id  = ds_id;
            failure_response(NO_EXISTS, att);

            return;
        }

        ds->get_permissions(ds_perms);

        ds->unlock();

        auth_ds_perms = &ds_perms;
    }

    // ------------------------------------------------------------------------
    // Authorize request
    // ------------------------------------------------------------------------

    auth = vm_authorization(id, 0, 0, att, &host_perms, auth_ds_perms, 0, auth_op);

    if (auth == false)
    {
        return;
    }

    // ------------------------------------------------------------------------
    // Check request consistency:
    // - VM States are right and there is at least a history record
    // - New host is not the current one
    // - Host capacity if required
    // - New host and current one are in the same cluster
    // - New or old host are not public cloud
    // ------------------------------------------------------------------------

    if ((vm = get_vm(id, att)) == 0)
    {
        return;
    }

    if((vm->hasPreviousHistory() && vm->get_previous_reason()== History::NONE)||
       (vm->get_state() != VirtualMachine::POWEROFF &&
        vm->get_state() != VirtualMachine::SUSPENDED &&
        (vm->get_state() != VirtualMachine::ACTIVE ||
         (vm->get_lcm_state() != VirtualMachine::RUNNING &&
          vm->get_lcm_state() != VirtualMachine::UNKNOWN))))
    {
        att.resp_msg = "Migrate action is not available for state " + vm->state_str();

        failure_response(ACTION, att);

        vm->unlock();
        return;
    }

    if (live)
    {
        action = History::LIVE_MIGRATE_ACTION;
    }
    else
    {
        action = History::MIGRATE_ACTION;
    }

    if (vm->is_imported() && !vm->is_imported_action_supported(action))
    {
        att.resp_msg = "Migration is not supported for imported VMs";
        failure_response(ACTION, att);

        vm->unlock();
        return;
    }

    if (vm->is_vrouter() && !VirtualRouter::is_action_supported(action))
    {
        att.resp_msg = "Migration is not supported for virtual router VMs";
        failure_response(ACTION, att);

        vm->unlock();
        return;
    }

    // Get System DS information from current History record
    c_ds_id  = vm->get_ds_id();
    c_tm_mad = vm->get_tm_mad();

    // Check we are not migrating to the same host and the same system DS
    c_hid = vm->get_hid();

    if (c_hid == hid && (ds_id == -1 || ds_id == c_ds_id))
    {
        ostringstream oss;

        oss << "VM is already running on " << object_name(PoolObjectSQL::HOST)
            << " [" << c_hid << "]";

        att.resp_msg = oss.str();
        failure_response(ACTION, att);

        vm->unlock();
        return;
    }

    // Check the host has enough capacity
    if (check_host(hid, enforce, vm, att.resp_msg) == false)
    {
        vm->unlock();

        failure_response(ACTION, att);
        return;
    }

    vm->unlock();

    // Check we are in the same cluster
    Host * host = nd.get_hpool()->get(c_hid, true);

    if (host == 0)
    {
        att.resp_obj = PoolObjectSQL::HOST;
        att.resp_id  = c_hid;
        failure_response(NO_EXISTS, att);
    }

    c_cluster_id = host->get_cluster_id();

    c_is_public_cloud = host->is_public_cloud();

    host->unlock();

    if ( c_cluster_id != cluster_id )
    {
        ostringstream oss;

        oss << "Cannot migrate to a different cluster. VM running in a host"
            << " in " << object_name(PoolObjectSQL::CLUSTER) << " ["
            << c_cluster_id << "] , and new host is in "
            << object_name(PoolObjectSQL::CLUSTER) << " [" << cluster_id << "]";

        att.resp_msg = oss.str();
        failure_response(ACTION, att);

        return;
    }

    if ( is_public_cloud || c_is_public_cloud )
    {
        att.resp_msg = "Cannot migrate to or from a Public Cloud Host";
        failure_response(ACTION, att);

        return;
    }

    if (ds_id != -1)
    {
        bool ds_migr;

        if ( c_ds_id != ds_id && live )
        {
            att.resp_msg = "A migration to a different system datastore "
                "cannot be performed live.";
            failure_response(ACTION, att);
            return;
        }

        if (get_ds_information(ds_id, ds_cluster_ids, tm_mad, att, ds_migr) != 0)
        {
            return;
        }

        if (!ds_migr)
        {
            att.resp_msg = "System datastore migration not supported by TM driver";
            failure_response(ACTION, att);
            return;
        }

        if (ds_cluster_ids.count(c_cluster_id) == 0)
        {
            ostringstream oss;

            oss << "Cannot migrate to a different cluster. VM running in a host"
                << " in " << object_name(PoolObjectSQL::CLUSTER)
                << " [" << c_cluster_id << "] , and new system datastore is in "
                << object_name(PoolObjectSQL::CLUSTER)
                << " [" << one_util::join(ds_cluster_ids, ',') << "]";

            att.resp_msg = oss.str();
            failure_response(ACTION, att);

            return;
        }

        if (c_tm_mad != tm_mad)
        {
            att.resp_msg = "Cannot migrate to a system datastore with a different TM driver";
            failure_response(ACTION, att);

            return;
        }
    }
    else
    {
        ds_id  = c_ds_id;
        tm_mad = c_tm_mad;
    }

    // ------------------------------------------------------------------------
    // Add a new history record and update volatile DISK attributes
    // ------------------------------------------------------------------------

    if ( (vm = get_vm(id, att)) == 0 )
    {
        return;
    }

    set_volatile_disk_info(vm, ds_id);

    if (add_history(vm,
                    hid,
                    cluster_id,
                    hostname,
                    vmm_mad,
                    tm_mad,
                    ds_id,
                    att) != 0)
    {
        vm->unlock();
        return;
    }

    // ------------------------------------------------------------------------
    // Migrate the VM
    // ------------------------------------------------------------------------

    if (live == true && vm->get_lcm_state() == VirtualMachine::RUNNING )
    {
        dm->live_migrate(vm);
    }
    else
    {
        dm->migrate(vm);
    }

    vm->unlock();

    success_response(id, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineDiskSaveas::request_execute(
        xmlrpc_c::paramList const& paramList, RequestAttributes& att)
{
    Nebula& nd = Nebula::instance();

    ImagePool *     ipool  = nd.get_ipool();
    DatastorePool * dspool = nd.get_dspool();

    int    id       = xmlrpc_c::value_int(paramList.getInt(1));
    int    disk_id  = xmlrpc_c::value_int(paramList.getInt(2));
    string img_name = xmlrpc_c::value_string(paramList.getString(3));
    string img_type = xmlrpc_c::value_string(paramList.getString(4));
    int    snap_id  = xmlrpc_c::value_int(paramList.getInt(5));

    VirtualMachinePool * vmpool = static_cast<VirtualMachinePool *>(pool);

    VirtualMachine * vm;
    Datastore      * ds;
    Image * img;
    int iid;
    int iid_orig;

    string         ds_data;
    PoolObjectAuth ds_perms;
    long long      avail;
    bool           ds_check;

    string driver;
    string target;
    string dev_prefix;

    int       ds_id;
    string    ds_name;
    long long size;

    string iname_orig;
    string iuname_orig;

    Image::ImageType type;
    Image::DiskType  ds_disk_type;

    ImageTemplate * itemplate;
    Template        img_usage;

    int    rc;
    bool   rc_auth;

    // -------------------------------------------------------------------------
    // Prepare and check the VM/DISK to be saved as
    // -------------------------------------------------------------------------
    if ((vm = get_vm(id, att)) == 0)
    {
        return;
    }

    if (vm->set_saveas_state() != 0)
    {
        goto error_state;
    }

    rc = vm->set_saveas_disk(disk_id, snap_id, iid_orig, size, att.resp_msg);

    if (rc == -1)
    {
        goto error_disk;
    }

    vmpool->update(vm);

    vm->unlock();

    // -------------------------------------------------------------------------
    // Get the data of the Image to be saved
    // -------------------------------------------------------------------------
    img = ipool->get(iid_orig, true);

    if ( img == 0 )
    {
        goto error_image;
    }

    ds_id   = img->get_ds_id();
    ds_name = img->get_ds_name();

    type = img->get_type();

    iname_orig  = img->get_name();
    iuname_orig = img->get_uname();

    img->get_template_attribute("DRIVER", driver);
    img->get_template_attribute("TARGET", target);
    img->get_template_attribute("DEV_PREFIX", dev_prefix);

    img->unlock();

    switch (type)
    {
        case Image::OS:
        case Image::DATABLOCK:
        case Image::CDROM:
            break;

        case Image::KERNEL:
        case Image::RAMDISK:
        case Image::CONTEXT:
            goto error_image_type;
    }

    // -------------------------------------------------------------------------
    // Get the data of the DataStore for the new image & size
    // -------------------------------------------------------------------------
    if ((ds = dspool->get(ds_id, true)) == 0 )
    {
        goto error_ds;
    }

    ds->get_permissions(ds_perms);
    ds->to_xml(ds_data);

    ds_check     = ds->get_avail_mb(avail);
    ds_disk_type = ds->get_disk_type();

    ds->unlock();

    if (ds_check && (size > avail))
    {
        goto error_size;
    }

    // -------------------------------------------------------------------------
    // Create a template for the new Image
    // -------------------------------------------------------------------------
    itemplate = new ImageTemplate;

    itemplate->add("NAME", img_name);
    itemplate->add("SIZE", size);

    itemplate->add("SAVED_IMAGE_ID",iid_orig);
    itemplate->add("SAVED_DISK_ID",disk_id);
    itemplate->add("SAVED_VM_ID", id);
    itemplate->set_saving();

    if (img_type.empty())
    {
        itemplate->add("TYPE", Image::type_to_str(type));
    }
    else
    {
        itemplate->add("TYPE", img_type);
    }

    if (!driver.empty())
    {
        itemplate->add("DRIVER", driver);
    }

    if (!target.empty())
    {
        itemplate->add("TARGET", target);
    }

    if (!dev_prefix.empty())
    {
        itemplate->add("DEV_PREFIX", dev_prefix);
    }

    img_usage.add("SIZE",      size);
    img_usage.add("DATASTORE", ds_id);

    // -------------------------------------------------------------------------
    // Authorize the operation & check quotas
    // -------------------------------------------------------------------------
    rc_auth = vm_authorization(id, itemplate, 0, att, 0,&ds_perms,0,auth_op);

    if ( rc_auth == true )
    {
        rc_auth = quota_authorization(&img_usage, Quotas::DATASTORE, att);
    }

    if ( rc_auth == false)
    {
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
                         itemplate,
                         ds_id,
                         ds_name,
                         ds_disk_type,
                         ds_data,
                         Datastore::IMAGE_DS,
                         "",
                         -1,
                         &iid,
                         att.resp_msg);
    if (rc < 0)
    {
        goto error_allocate;
    }

    ds = dspool->get(ds_id, true);

    if (ds == 0)
    {
        goto error_ds_removed;
    }

    ds->add_image(iid);

    dspool->update(ds);

    ds->unlock();

    success_response(iid, att);

    return;

error_state:
    vm->unlock();

    att.resp_msg = "VM has to be RUNNING, POWEROFF or SUSPENDED to save disks.";
    failure_response(INTERNAL, att);
    return;

error_disk:
    vm->clear_saveas_state();

    vm->clear_saveas_disk();

    vm->unlock();
    att.resp_msg ="Cannot use DISK. " + att.resp_msg;
    failure_response(INTERNAL, att);
    return;

error_image:
    att.resp_obj = PoolObjectSQL::IMAGE;
    att.resp_id  = iid_orig;
    failure_response(NO_EXISTS, att);
    goto error_common;

error_image_type:
    att.resp_msg = "Cannot save_as image of type " + Image::type_to_str(type);
    failure_response(INTERNAL, att);
    goto error_common;

error_ds:
error_ds_removed:
    att.resp_obj = PoolObjectSQL::DATASTORE;
    att.resp_id  = ds_id;
    failure_response(NO_EXISTS, att);
    goto error_common;

error_size:
    att.resp_msg = "Not enough space in datastore";
    failure_response(ACTION, att);
    goto error_common;

error_auth:
    delete itemplate;
    goto error_common;

error_allocate:
    quota_rollback(&img_usage, Quotas::DATASTORE, att);
    failure_response(ALLOCATE, att);
    goto error_common;

error_common:
    if ((vm = vmpool->get(id, true)) != 0)
    {
        vm->clear_saveas_state();

        vm->clear_saveas_disk();

        vmpool->update(vm);

        vm->unlock();
    }

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineMonitoring::request_execute(
        xmlrpc_c::paramList const&  paramList,
        RequestAttributes&          att)
{
    int  id = xmlrpc_c::value_int(paramList.getInt(1));
    int  rc;

    ostringstream oss;

    bool auth = vm_authorization(id, 0, 0, att, 0, 0, 0, auth_op);

    if ( auth == false )
    {
        return;
    }

    rc = (static_cast<VirtualMachinePool *>(pool))->dump_monitoring(oss, id);

    if ( rc != 0 )
    {
        att.resp_msg = "Internal error";
        failure_response(INTERNAL, att);
        return;
    }

    success_response(oss.str(), att);

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineAttach::request_execute(xmlrpc_c::paramList const& paramList,
                                            RequestAttributes& att)
{
    Nebula&           nd = Nebula::instance();
    DispatchManager * dm = nd.get_dm();

    VirtualMachineTemplate tmpl;
    PoolObjectAuth         vm_perms;

    VirtualMachine *     vm;

    int    rc;
    bool   volatile_disk;

    int     id       = xmlrpc_c::value_int(paramList.getInt(1));
    string  str_tmpl = xmlrpc_c::value_string(paramList.getString(2));

    // -------------------------------------------------------------------------
    // Parse Disk template
    // -------------------------------------------------------------------------

    rc = tmpl.parse_str_or_xml(str_tmpl, att.resp_msg);

    if ( rc != 0 )
    {
        failure_response(INTERNAL, att);
        return;
    }

    // -------------------------------------------------------------------------
    // Authorize the operation & check quotas
    // -------------------------------------------------------------------------

    if ( vm_authorization(id, 0, &tmpl, att, 0, 0, 0, auth_op) == false )
    {
        return;
    }

    if ((vm = get_vm(id, att)) == 0)
    {
        return;
    }

    vm->get_permissions(vm_perms);

    if ( !vm->hasHistory() )
    {
        att.resp_msg = "VM is not running in any host";
        failure_response(ACTION, att);

        vm->unlock();
        return;
    }

    volatile_disk = set_volatile_disk_info(vm, vm->get_ds_id(), tmpl);

    if (vm->is_vrouter() &&
            !VirtualRouter::is_action_supported(History::DISK_ATTACH_ACTION))
    {
        att.resp_msg = "Action is not supported for virtual router VMs";
        failure_response(ACTION, att);

        vm->unlock();
        return;
    }

    vm->unlock();

    RequestAttributes att_quota(vm_perms.uid, vm_perms.gid, att);

    VirtualMachineTemplate deltas(tmpl);
    VirtualMachine::disk_extended_info(att.uid, &deltas);

    deltas.add("VMS", 0);

    if (quota_resize_authorization(id, &deltas, att_quota) == false)
    {
        return;
    }

    if (volatile_disk == false)
    {
        if ( quota_authorization(&tmpl, Quotas::IMAGE, att_quota) == false )
        {
            quota_rollback(&deltas, Quotas::VM, att_quota);
            return;
        }
    }

    rc = dm->attach(id, &tmpl, att.resp_msg);

    if ( rc != 0 )
    {
        quota_rollback(&deltas, Quotas::VM, att_quota);

        if (volatile_disk == false)
        {
            quota_rollback(&tmpl, Quotas::IMAGE, att_quota);
        }

        failure_response(ACTION, att);
    }
    else
    {
        success_response(id, att);
    }

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineDetach::request_execute(xmlrpc_c::paramList const& paramList,
                                            RequestAttributes& att)
{
    Nebula&             nd = Nebula::instance();
    DispatchManager *   dm = nd.get_dm();
    VirtualMachine *    vm;

    int rc;
    string error_str;

    int     id      = xmlrpc_c::value_int(paramList.getInt(1));
    int     disk_id = xmlrpc_c::value_int(paramList.getInt(2));

    // -------------------------------------------------------------------------
    // Authorize the operation
    // -------------------------------------------------------------------------

    if ( vm_authorization(id, 0, 0, att, 0, 0, 0, auth_op) == false )
    {
        return;
    }

    if ((vm = get_vm(id, att)) == 0)
    {
        return;
    }

    if (vm->is_vrouter() && !VirtualRouter::is_action_supported(History::NIC_DETACH_ACTION))
    {
        att.resp_msg = "Action is not supported for virtual router VMs";
        failure_response(ACTION, att);

        vm->unlock();
        return;
    }

    vm->unlock();

    rc = dm->detach(id, disk_id, att.resp_msg);

    if ( rc != 0 )
    {
        failure_response(ACTION, att);
    }
    else
    {
        success_response(id, att);
    }

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineResize::request_execute(xmlrpc_c::paramList const& paramList,
                                           RequestAttributes& att)
{
    int     id              = xmlrpc_c::value_int(paramList.getInt(1));
    string  str_tmpl        = xmlrpc_c::value_string(paramList.getString(2));
    bool    enforce_param   = xmlrpc_c::value_boolean(paramList.getBoolean(3));

    float ncpu, ocpu, dcpu;
    int   nmemory, omemory, dmemory;
    int   nvcpu, ovcpu;

    Nebula&    nd    = Nebula::instance();
    HostPool * hpool = nd.get_hpool();
    Host *     host;

    Template deltas;
    bool     rc;
    int      ret;
    int      hid = -1;

    PoolObjectAuth vm_perms;

    VirtualMachinePool * vmpool = static_cast<VirtualMachinePool *>(pool);
    VirtualMachine * vm;
    VirtualMachineTemplate tmpl;

    bool enforce = true;

    if (att.uid == UserPool::ONEADMIN_ID || att.gid == GroupPool::ONEADMIN_ID)
    {
        enforce = enforce_param;
    }

    // -------------------------------------------------------------------------
    // Parse template
    // -------------------------------------------------------------------------
    rc = tmpl.parse_str_or_xml(str_tmpl, att.resp_msg);

    if ( rc != 0 )
    {
        failure_response(INTERNAL, att);
        return;
    }

    /* ---------------------------------------------------------------------- */
    /*  Authorize the operation & restricted attributes                       */
    /* ---------------------------------------------------------------------- */
    if ( vm_authorization(id, 0, 0, att, 0, 0, 0, auth_op) == false )
    {
        return;
    }

    if (att.uid != UserPool::ONEADMIN_ID && att.gid!=GroupPool::ONEADMIN_ID)
    {
        string aname;

        if (tmpl.check(aname))
        {
            att.resp_msg = "Template includes a restricted attribute " + aname;
            failure_response(AUTHORIZATION, att);

            return;
        }
    }

    /* ---------------------------------------------------------------------- */
    /*  Get the resize values                                                 */
    /* ---------------------------------------------------------------------- */

    tmpl.get("CPU", ncpu);
    tmpl.get("VCPU", nvcpu);
    tmpl.get("MEMORY", nmemory);

    vm = vmpool->get(id, true);

    if (vm == 0)
    {
        att.resp_id = id;
        failure_response(NO_EXISTS, att);
        return;
    }

    vm->get_permissions(vm_perms);

    vm->get_template_attribute("MEMORY", omemory);
    vm->get_template_attribute("CPU", ocpu);
    vm->get_template_attribute("VCPU", ovcpu);

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
    dmemory = nmemory - omemory;

    deltas.add("MEMORY", dmemory);
    deltas.add("CPU", dcpu);
    deltas.add("VMS", 0);

    switch (vm->get_state())
    {
        case VirtualMachine::POWEROFF: //Only check host capacity in POWEROFF
            if (vm->hasHistory() == true)
            {
                hid = vm->get_hid();
            }
        break;

        case VirtualMachine::INIT:
        case VirtualMachine::PENDING:
        case VirtualMachine::HOLD:
        case VirtualMachine::UNDEPLOYED:
        case VirtualMachine::CLONING:
        break;

        case VirtualMachine::STOPPED:
        case VirtualMachine::DONE:
        case VirtualMachine::SUSPENDED:
        case VirtualMachine::ACTIVE:
            att.resp_msg="Resize action is not available for state "+vm->state_str();
            failure_response(ACTION, att);

            vm->unlock();
            return;
    }

    ret = vm->check_resize(ncpu, nmemory, nvcpu, att.resp_msg);

    vm->unlock();

    if (ret != 0)
    {
        failure_response(INTERNAL, att);
        return;
    }

    /* ---------------------------------------------------------------------- */
    /*  Check quotas                                                          */
    /* ---------------------------------------------------------------------- */

    if (quota_resize_authorization(&deltas, att, vm_perms) == false)
    {
        return;
    }

    RequestAttributes att_rollback(vm_perms.uid, vm_perms.gid, att);

    /* ---------------------------------------------------------------------- */
    /*  Check & update host capacity                                          */
    /* ---------------------------------------------------------------------- */

    if (hid != -1)
    {
        int dcpu_host = (int) (dcpu * 100);//now in 100%
        int dmem_host = dmemory * 1024;    //now in Kilobytes

        vector<VectorAttribute *> empty_pci;

        host = hpool->get(hid, true);

        if (host == 0)
        {
            att.resp_obj = PoolObjectSQL::HOST;
            att.resp_id  = hid;
            failure_response(NO_EXISTS, att);

            quota_rollback(&deltas, Quotas::VM, att_rollback);

            return;
        }

        if ( enforce && host->test_capacity(dcpu_host, dmem_host, 0,
                    empty_pci, att.resp_msg) == false)
        {
            ostringstream oss;

            oss << object_name(PoolObjectSQL::HOST) << " " << hid
                << " does not have enough capacity.";

            att.resp_msg = oss.str();
            failure_response(ACTION, att);

            host->unlock();

            quota_rollback(&deltas, Quotas::VM, att_rollback);

            return;
        }

        host->update_capacity(dcpu_host, dmem_host, 0);

        hpool->update(host);

        host->unlock();
    }

    /* ---------------------------------------------------------------------- */
    /*  Resize the VM                                                         */
    /* ---------------------------------------------------------------------- */

    vm = vmpool->get(id, true);

    if (vm == 0)
    {
        att.resp_msg = id;
        failure_response(NO_EXISTS, att);

        quota_rollback(&deltas, Quotas::VM, att_rollback);

        if (hid != -1)
        {
            host = hpool->get(hid, true);

            if (host != 0)
            {
                host->update_capacity(-dcpu, -dmemory, 0);
                hpool->update(host);

                host->unlock();
            }
        }
        return;
    }

    //Check again state as the VM may transit to active (e.g. scheduled)
    switch (vm->get_state())
    {
        case VirtualMachine::INIT:
        case VirtualMachine::PENDING:
        case VirtualMachine::HOLD:
        case VirtualMachine::POWEROFF:
        case VirtualMachine::UNDEPLOYED:
        case VirtualMachine::CLONING:
            ret = vm->resize(ncpu, nmemory, nvcpu, att.resp_msg);

            if (ret != 0)
            {
                vm->unlock();

                failure_response(INTERNAL, att);
                return;
            }

            vmpool->update(vm);
        break;

        case VirtualMachine::STOPPED:
        case VirtualMachine::DONE:
        case VirtualMachine::SUSPENDED:
        case VirtualMachine::ACTIVE:
            att.resp_msg = "Resize action is not available for state " + vm->state_str();
            failure_response(ACTION, att);

            vm->unlock();

            quota_rollback(&deltas, Quotas::VM, att_rollback);

            if (hid != -1)
            {
                host = hpool->get(hid, true);

                if (host != 0)
                {
                    host->update_capacity(ocpu - ncpu, omemory - nmemory, 0);
                    hpool->update(host);

                    host->unlock();
                }
            }
            return;
    }

    vm->unlock();

    success_response(id, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineSnapshotCreate::request_execute(
        xmlrpc_c::paramList const&  paramList,
        RequestAttributes&          att)
{
    Nebula&           nd = Nebula::instance();
    DispatchManager * dm = nd.get_dm();

    int     rc;
    int     snap_id;

    int     id   = xmlrpc_c::value_int(paramList.getInt(1));
    string  name = xmlrpc_c::value_string(paramList.getString(2));

    // -------------------------------------------------------------------------
    // Authorize the operation
    // -------------------------------------------------------------------------

    if ( vm_authorization(id, 0, 0, att, 0, 0, 0, auth_op) == false )
    {
        return;
    }

    rc = dm->snapshot_create(id, name, snap_id, att.resp_msg);

    if ( rc != 0 )
    {
        failure_response(ACTION, att);
    }
    else
    {
        success_response(snap_id, att);
    }

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineSnapshotRevert::request_execute(
        xmlrpc_c::paramList const&  paramList,
        RequestAttributes&          att)
{
    Nebula&           nd = Nebula::instance();
    DispatchManager * dm = nd.get_dm();

    int    rc;

    int id      = xmlrpc_c::value_int(paramList.getInt(1));
    int snap_id = xmlrpc_c::value_int(paramList.getInt(2));

    // -------------------------------------------------------------------------
    // Authorize the operation
    // -------------------------------------------------------------------------

    if ( vm_authorization(id, 0, 0, att, 0, 0, 0, auth_op) == false )
    {
        return;
    }

    rc = dm->snapshot_revert(id, snap_id, att.resp_msg);

    if ( rc != 0 )
    {
        failure_response(ACTION, att);
    }
    else
    {
        success_response(id, att);
    }

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineSnapshotDelete::request_execute(
        xmlrpc_c::paramList const&  paramList,
        RequestAttributes&          att)
{
    Nebula&           nd = Nebula::instance();
    DispatchManager * dm = nd.get_dm();

    int    rc;

    int id      = xmlrpc_c::value_int(paramList.getInt(1));
    int snap_id = xmlrpc_c::value_int(paramList.getInt(2));

    // -------------------------------------------------------------------------
    // Authorize the operation
    // -------------------------------------------------------------------------

    if ( vm_authorization(id, 0, 0, att, 0, 0, 0, auth_op) == false )
    {
        return;
    }

    rc = dm->snapshot_delete(id, snap_id, att.resp_msg);

    if ( rc != 0 )
    {
        failure_response(ACTION, att);
    }
    else
    {
        success_response(id, att);
    }

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineAttachNic::request_execute(
        xmlrpc_c::paramList const&  paramList,
        RequestAttributes&          att)
{
    VirtualMachine *        vm;
    VirtualMachineTemplate  tmpl;

    int     rc;

    int     id       = xmlrpc_c::value_int(paramList.getInt(1));
    string  str_tmpl = xmlrpc_c::value_string(paramList.getString(2));

    // -------------------------------------------------------------------------
    // Check if the VM is a Virtual Router
    // -------------------------------------------------------------------------
    if ((vm = get_vm(id, att)) == 0)
    {
        return;
    }

    if (vm->is_vrouter() && !VirtualRouter::is_action_supported(History::NIC_ATTACH_ACTION))
    {
        att.resp_msg = "Action is not supported for virtual router VMs";
        failure_response(Request::ACTION, att);

        vm->unlock();
        return;
    }

    vm->unlock();

    // -------------------------------------------------------------------------
    // Parse NIC template
    // -------------------------------------------------------------------------
    rc = tmpl.parse_str_or_xml(str_tmpl, att.resp_msg);

    if ( rc != 0 )
    {
        failure_response(INTERNAL, att);
        return;
    }

    // -------------------------------------------------------------------------
    // Perform the attach
    // -------------------------------------------------------------------------
    ErrorCode ec = attach(id, tmpl, att);

    if ( ec == SUCCESS )
    {
        success_response(id, att);
    }
    else
    {
        failure_response(ec, att);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineAttachNic::attach(int id, VirtualMachineTemplate& tmpl,
        RequestAttributes& att)
{
    Nebula& nd = Nebula::instance();

    DispatchManager *   dm     = nd.get_dm();
    VirtualMachinePool* vmpool = nd.get_vmpool();

    PoolObjectAuth   vm_perms;
    VirtualMachine * vm;

    int    rc;

    // -------------------------------------------------------------------------
    // Authorize the operation, restricted attributes & check quotas
    // -------------------------------------------------------------------------
    vm = vmpool->get(id, true);

    if ( vm == 0 )
    {
        att.resp_id  = id;
        att.resp_obj = PoolObjectSQL::VM;
        return NO_EXISTS;
    }

    vm->get_permissions(vm_perms);

    vm->unlock();

    if ( att.uid != 0 )
    {
        AuthRequest ar(att.uid, att.group_ids);

        ar.add_auth(AuthRequest::MANAGE, vm_perms);

        VirtualMachine::set_auth_request(att.uid, ar, &tmpl);

        if (UserPool::authorize(ar) == -1)
        {
            att.resp_msg = ar.message;
            return AUTHORIZATION;
        }
    }

    RequestAttributes att_quota(vm_perms.uid, vm_perms.gid, att);

    if (att.uid != UserPool::ONEADMIN_ID && att.gid!=GroupPool::ONEADMIN_ID)
    {
        string aname;

        if (tmpl.check(aname))
        {
            att.resp_msg = "NIC includes a restricted attribute " + aname;
            return AUTHORIZATION;
        }
    }

    if (quota_authorization(&tmpl, Quotas::NETWORK, att_quota, att.resp_msg) == false)
    {
        return AUTHORIZATION;
    }

    // -------------------------------------------------------------------------
    // Perform the attach
    // -------------------------------------------------------------------------

    rc = dm->attach_nic(id, &tmpl, att.resp_msg);

    if ( rc != 0 )
    {
        quota_rollback(&tmpl, Quotas::NETWORK, att_quota);
        return ACTION;
    }

    return SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineDetachNic::request_execute(
        xmlrpc_c::paramList const& paramList, RequestAttributes& att)
{
    VirtualMachine * vm;

    int id      = xmlrpc_c::value_int(paramList.getInt(1));
    int nic_id  = xmlrpc_c::value_int(paramList.getInt(2));

    // -------------------------------------------------------------------------
    // Check if the VM is a Virtual Router
    // -------------------------------------------------------------------------

    if ((vm = get_vm(id, att)) == 0)
    {
        return;
    }

    if (vm->is_vrouter() && !VirtualRouter::is_action_supported(History::NIC_DETACH_ACTION))
    {
        att.resp_msg = "Action is not supported for virtual router VMs";
        failure_response(Request::ACTION, att);

        vm->unlock();
        return;
    }

    vm->unlock();

    // -------------------------------------------------------------------------
    // Perform the detach
    // -------------------------------------------------------------------------
    ErrorCode ec = detach(id, nic_id, att);

    if ( ec == SUCCESS )
    {
        success_response(id, att);
    }
    else
    {
        failure_response(ec, att);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VirtualMachineDetachNic::detach(int id, int nic_id,
        RequestAttributes& att)
{
    Nebula&             nd      = Nebula::instance();
    DispatchManager *   dm      = nd.get_dm();
    VirtualMachinePool* vmpool  = nd.get_vmpool();

    PoolObjectAuth      vm_perms;
    VirtualMachine *    vm;

    // -------------------------------------------------------------------------
    // Authorize the operation
    // -------------------------------------------------------------------------
    vm = vmpool->get(id, true);

    if ( vm == 0 )
    {
        return NO_EXISTS;
    }

    vm->get_permissions(vm_perms);

    vm->unlock();

    if ( att.uid != 0 )
    {
        AuthRequest ar(att.uid, att.group_ids);

        ar.add_auth(AuthRequest::MANAGE, vm_perms);

        if (UserPool::authorize(ar) == -1)
        {
            att.resp_msg = ar.message;
            return AUTHORIZATION;
        }
    }

    // -------------------------------------------------------------------------
    // Perform the detach
    // -------------------------------------------------------------------------
    if ( dm->detach_nic(id, nic_id, att.resp_msg) != 0 )
    {
        return ACTION;
    }

    return SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineRecover::request_execute(
        xmlrpc_c::paramList const& paramList, RequestAttributes& att)
{
    int id = xmlrpc_c::value_int(paramList.getInt(1));
    int op = xmlrpc_c::value_int(paramList.getInt(2));

    VirtualMachine * vm;

    Nebula& nd             = Nebula::instance();
    LifeCycleManager*  lcm = nd.get_lcm();

    if ( vm_authorization(id, 0, 0, att, 0, 0, 0, auth_op) == false )
    {
        return;
    }

    if ((vm = get_vm(id, att)) == 0)
    {
        return;
    }

    if(vm->get_state() != VirtualMachine::ACTIVE)
    {
        att.resp_msg = "Recover action is not available for state " + vm->state_str();
        failure_response(ACTION, att);

        vm->unlock();
        return;
    }

    switch (op)
    {
        case 0:
            lcm->recover(vm, false);
            break;
        case 1:
            lcm->recover(vm, true);
            break;
        case 2:
            lcm->retry(vm);
            break;

        default:
            att.resp_msg = "Wrong recovery operation code";
            failure_response(ACTION, att);

            vm->unlock();
            return;
    }

    success_response(id, att);

    vm->unlock();

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachinePoolCalculateShowback::request_execute(
        xmlrpc_c::paramList const& paramList,
        RequestAttributes& att)
{
    int start_month = xmlrpc_c::value_int(paramList.getInt(1));
    int start_year  = xmlrpc_c::value_int(paramList.getInt(2));
    int end_month   = xmlrpc_c::value_int(paramList.getInt(3));
    int end_year    = xmlrpc_c::value_int(paramList.getInt(4));

    ostringstream oss;
    string        where;
    int           rc;

    if ( att.gid != 0 )
    {
        att.resp_msg = "Action reserved for group 0 only";
        failure_response(AUTHORIZATION, att);
        return;
    }

    rc = (static_cast<VirtualMachinePool *>(pool))->calculate_showback(
                    start_month, start_year, end_month, end_year, att.resp_msg);

    if (rc != 0)
    {
        failure_response(AUTHORIZATION, att);
        return;
    }

    success_response("", att);

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineDiskSnapshotCreate::request_execute(
        xmlrpc_c::paramList const&  paramList,
        RequestAttributes&          att)
{
    Nebula&           nd = Nebula::instance();
    DispatchManager * dm = nd.get_dm();

    VirtualMachine * vm;

    PoolObjectAuth   vm_perms;

    const VectorAttribute * disk;
    VectorAttribute * delta_disk = 0;

    Template ds_deltas;
    Template vm_deltas;

    int    rc;
    int    snap_id;

    int    id   = xmlrpc_c::value_int(paramList.getInt(1));
    int    did  = xmlrpc_c::value_int(paramList.getInt(2));
    string name = xmlrpc_c::value_string(paramList.getString(3));

    // ------------------------------------------------------------------------
    // Check request consistency (VM & disk exists, no volatile)
    // ------------------------------------------------------------------------
    if ((vm = get_vm(id, att)) == 0)
    {
        return;
    }

    disk = (const_cast<const VirtualMachine *>(vm))->get_disk(did);

    if (disk == 0)
    {
        att.resp_msg = "VM disk does not exist";
        failure_response(ACTION, att);

        vm->unlock();

        return;
    }

    string disk_size = disk->vector_value("SIZE");
    string ds_id     = disk->vector_value("DATASTORE_ID");
    bool is_volatile = VirtualMachine::is_volatile(disk);
    bool is_system   = VirtualMachine::disk_tm_target(disk) == "SYSTEM";
    bool do_ds_quota = VirtualMachine::is_persistent(disk) || !is_system;

    int img_id = -1;
    disk->vector_value("IMAGE_ID", img_id);

    vm->get_permissions(vm_perms);

    vm->unlock();

    if (is_volatile)
    {
        att.resp_msg = "Cannot make snapshots on volatile disks";
        failure_response(ACTION, att);
        return;
    }

    RequestAttributes ds_att_quota;
    RequestAttributes vm_att_quota;

    //--------------------------- Persistent Images ----------------------------
    if (do_ds_quota)
    {
        PoolObjectAuth img_perms;

        Image* img = ipool->get(img_id, true);

        if (img == 0)
        {
            att.resp_obj = PoolObjectSQL::IMAGE;
            att.resp_id  = img_id;
            failure_response(NO_EXISTS, att);

            return;
        }

        img->get_permissions(img_perms);

        img->unlock();

        if (vm_authorization(id, 0, 0, att, 0, 0, &img_perms, auth_op) == false)
        {
            return;
        }

        ds_att_quota = RequestAttributes(img_perms.uid, img_perms.gid, att);

        ds_deltas.add("DATASTORE", ds_id);
        ds_deltas.add("SIZE", disk_size);
        ds_deltas.add("IMAGES", 0);

        if (!quota_authorization(&ds_deltas, Quotas::DATASTORE, ds_att_quota))
        {
            return;
        }
    }

    //--------------------- Account for System DS storage ----------------------
    if (is_system)
    {
        if ( vm_authorization(id, 0, 0, att, 0, 0, 0, auth_op) == false )
        {
            return;
        }

        vm_att_quota = RequestAttributes(vm_perms.uid, vm_perms.gid, att);

        delta_disk = new VectorAttribute("DISK");
        delta_disk->replace("TYPE", "FS");
        delta_disk->replace("SIZE", disk_size);

        vm_deltas.add("VMS", 0);
        vm_deltas.set(delta_disk);

        if (!quota_resize_authorization(id, &vm_deltas, vm_att_quota))
        {
            if (do_ds_quota)
            {
                quota_rollback(&ds_deltas, Quotas::DATASTORE, ds_att_quota);
            }

            return;
        }
    }

    // ------------------------------------------------------------------------
    // Do the snapshot
    // ------------------------------------------------------------------------
    rc = dm->disk_snapshot_create(id, did, name, snap_id, att.resp_msg);

    if ( rc != 0 )
    {
        if (do_ds_quota)
        {
            quota_rollback(&ds_deltas, Quotas::DATASTORE, ds_att_quota);
        }

        if (is_system)
        {
            quota_rollback(&vm_deltas, Quotas::VM, vm_att_quota);
        }

        failure_response(ACTION, att);
    }
    else
    {
        success_response(snap_id, att);
    }

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineDiskSnapshotRevert::request_execute(
        xmlrpc_c::paramList const&  paramList,
        RequestAttributes&          att)
{
    Nebula&           nd = Nebula::instance();
    DispatchManager * dm = nd.get_dm();

    int    rc;

    int id      = xmlrpc_c::value_int(paramList.getInt(1));
    int did     = xmlrpc_c::value_int(paramList.getInt(2));
    int snap_id = xmlrpc_c::value_int(paramList.getInt(3));

    if ( vm_authorization(id, 0, 0, att, 0, 0, 0, auth_op) == false )
    {
        return;
    }

    rc = dm->disk_snapshot_revert(id, did, snap_id, att.resp_msg);

    if ( rc != 0 )
    {
        failure_response(ACTION, att);
    }
    else
    {
        success_response(id, att);
    }

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineDiskSnapshotDelete::request_execute(
        xmlrpc_c::paramList const&  paramList,
        RequestAttributes&          att)
{
    Nebula&           nd = Nebula::instance();
    DispatchManager * dm = nd.get_dm();
    VirtualMachine *  vm;

    const VectorAttribute * disk;

    int rc;

    int id      = xmlrpc_c::value_int(paramList.getInt(1));
    int did     = xmlrpc_c::value_int(paramList.getInt(2));
    int snap_id = xmlrpc_c::value_int(paramList.getInt(3));

    if ((vm = get_vm(id, att)) == 0)
    {
        return;
    }

    disk = (const_cast<const VirtualMachine *>(vm))->get_disk(did);

    if (disk == 0)
    {
        att.resp_msg = "VM disk does not exist";
        failure_response(ACTION, att);

        vm->unlock();

        return;
    }

    bool persistent  = VirtualMachine::is_persistent(disk);

    int img_id = -1;
    disk->vector_value("IMAGE_ID", img_id);

    vm->unlock();

    if (persistent)
    {
        PoolObjectAuth img_perms;

        Image* img = ipool->get(img_id, true);

        if (img == 0)
        {
            att.resp_obj = PoolObjectSQL::IMAGE;
            att.resp_id  = img_id;
            failure_response(NO_EXISTS, att);

            return;
        }

        img->get_permissions(img_perms);

        img->unlock();

        if (vm_authorization(id, 0, 0, att, 0, 0, &img_perms, auth_op) == false)
        {
            return;
        }
    }
    else if ( vm_authorization(id, 0, 0, att, 0, 0, 0, auth_op) == false )
    {
        return;
    }

    rc = dm->disk_snapshot_delete(id, did, snap_id, att.resp_msg);

    if ( rc != 0 )
    {
        failure_response(ACTION, att);
    }
    else
    {
        success_response(id, att);
    }

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineUpdateConf::request_execute(
        xmlrpc_c::paramList const& paramList, RequestAttributes& att)
{
    int     id       = xmlrpc_c::value_int(paramList.getInt(1));
    string  str_tmpl = xmlrpc_c::value_string(paramList.getString(2));

    VirtualMachine * vm;
    VirtualMachineTemplate tmpl;

    // -------------------------------------------------------------------------
    // Parse template
    // -------------------------------------------------------------------------
    int rc = tmpl.parse_str_or_xml(str_tmpl, att.resp_msg);

    if ( rc != 0 )
    {
        failure_response(INTERNAL, att);
        return;
    }

    /* ---------------------------------------------------------------------- */
    /*  Authorize the operation & restricted attributes                       */
    /* ---------------------------------------------------------------------- */
    if ( vm_authorization(id, 0, 0, att, 0, 0, 0, auth_op) == false )
    {
        return;
    }

    if ( att.uid != UserPool::ONEADMIN_ID && att.gid != GroupPool::ONEADMIN_ID )
    {
        string aname;

        if (tmpl.check(aname))
        {
            att.resp_msg = "Template includes a restricted attribute " + aname;
            failure_response(AUTHORIZATION, att);

            return;
        }
    }

    /* ---------------------------------------------------------------------- */
    /* Update VirtualMachine Configuration                                    */
    /* ---------------------------------------------------------------------- */

    vm = static_cast<VirtualMachinePool *>(pool)->get(id, true);

    if (vm == 0)
    {
        att.resp_id = id;
        failure_response(NO_EXISTS, att);
        return;
    }

    if ( vm->updateconf(tmpl, att.resp_msg) != 0 )
    {
        failure_response(INTERNAL, att);
    }
    else
    {
        success_response(id, att);
    }

    static_cast<VirtualMachinePool *>(pool)->update(vm);

    vm->unlock();
}

