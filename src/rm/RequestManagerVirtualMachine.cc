/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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
        AuthRequest::Operation  op)
{
    PoolObjectSQL * object;
    PoolObjectAuth vm_perms;

    object = pool->get(oid,true);

    if ( object == 0 )
    {
        failure_response(NO_EXISTS,
                get_error(object_name(auth_object),oid),
                att);

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

    if (UserPool::authorize(ar) == -1)
    {
        failure_response(AUTHORIZATION,
                authorization_error(ar.message, att),
                att);

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
        failure_response(NO_EXISTS,
                get_error(object_name(PoolObjectSQL::VM),oid),
                att);

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

    string   error_str;

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
            rc = user->quota.quota_update(Quotas::VM, deltas, user_dquotas, error_str);

            if (rc == false)
            {
                ostringstream oss;

                oss << object_name(PoolObjectSQL::USER)
                    << " [" << vm_perms.uid << "] "
                    << error_str;

                failure_response(AUTHORIZATION,
                        request_error(oss.str(), ""),
                        att);

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
            rc = group->quota.quota_update(Quotas::VM, deltas, group_dquotas, error_str);

            if (rc == false)
            {
                ostringstream oss;
                RequestAttributes att_tmp(vm_perms.uid, -1, att);

                oss << object_name(PoolObjectSQL::GROUP)
                    << " [" << vm_perms.gid << "] "
                    << error_str;

                failure_response(AUTHORIZATION,
                                 request_error(oss.str(), ""),
                                 att);

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

    ClusterPool*    clpool = nd.get_clpool();
    Cluster*        cluster;

    ds_id = -1;

    if (cluster_id == ClusterPool::NONE_CLUSTER_ID)
    {
        ds_id = DatastorePool::SYSTEM_DS_ID;
    }
    else
    {
        cluster = clpool->get(cluster_id, true);

        if (cluster == 0)
        {
            failure_response(NO_EXISTS,
                get_error(object_name(PoolObjectSQL::CLUSTER), cluster_id),
                att);

            return -1;
        }

        set<int> ds_ids = cluster->get_datastores();

        cluster->unlock();

        ds_id = Cluster::get_default_system_ds(ds_ids);

        if (ds_id == -1)
        {
            ostringstream oss;

            oss << object_name(PoolObjectSQL::CLUSTER)
                << " [" << cluster_id << "] does not have any "
                << object_name(PoolObjectSQL::DATASTORE) << " of type "
                << Datastore::type_to_str(Datastore::SYSTEM_DS) << ".";

            failure_response(ACTION, request_error(oss.str(),""), att);

            return -1;
        }
    }

    return get_ds_information(ds_id, cluster_id, tm_mad, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int RequestManagerVirtualMachine::get_ds_information(int ds_id,
    int& ds_cluster_id,
    string& tm_mad,
    RequestAttributes& att)
{
    Nebula& nd = Nebula::instance();

    Datastore * ds = nd.get_dspool()->get(ds_id, true);

    ds_cluster_id = -1;

    if ( ds == 0 )
    {
        failure_response(NO_EXISTS,
            get_error(object_name(PoolObjectSQL::DATASTORE), ds_id),
            att);

        return -1;
    }

    if ( ds->get_type() != Datastore::SYSTEM_DS )
    {
        ostringstream oss;

        oss << "Trying to use " << object_name(PoolObjectSQL::DATASTORE)
            << " [" << ds_id << "] to deploy the VM, but it is not of type"
            << " system datastore.";

        failure_response(INTERNAL, request_error(oss.str(),""), att);

        ds->unlock();

        return -1;
    }

    ds_cluster_id = ds->get_cluster_id();

    tm_mad = ds->get_tm_mad();

    ds->unlock();

    return 0;
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int RequestManagerVirtualMachine::get_host_information(
    int     hid,
    string& name,
    string& vmm,
    string& vnm,
    int&    cluster_id,
    string& ds_location,
    bool&   is_public_cloud,
    PoolObjectAuth&    host_perms,
    RequestAttributes& att)


{
    Nebula&    nd    = Nebula::instance();
    HostPool * hpool = nd.get_hpool();

    Host *     host  = hpool->get(hid,true);

    if ( host == 0 )
    {
        failure_response(NO_EXISTS,
                get_error(object_name(PoolObjectSQL::HOST),hid),
                att);

        return -1;
    }

    name = host->get_name();
    vmm  = host->get_vmm_mad();
    vnm  = host->get_vnm_mad();

    cluster_id = host->get_cluster_id();

    is_public_cloud = host->is_public_cloud();

    host->get_permissions(host_perms);

    host->unlock();

    if (nd.get_ds_location(cluster_id, ds_location) == -1)
    {
        failure_response(NO_EXISTS,
            get_error(object_name(PoolObjectSQL::CLUSTER),cluster_id),
            att);

        return -1;
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool RequestManagerVirtualMachine::check_host(int     hid,
                                              int     cpu,
                                              int     mem,
                                              int     disk,
                                              string& error)
{
    Nebula&    nd    = Nebula::instance();
    HostPool * hpool = nd.get_hpool();

    Host * host;
    bool   test;

    host = hpool->get(hid, true);

    if (host == 0)
    {
        error = "Host no longer exists";
        return false;
    }

    test = host->test_capacity(cpu, mem, disk);

    if (!test)
    {
        ostringstream oss;

        oss << object_name(PoolObjectSQL::HOST)
            << " " << hid << " does not have enough capacity.";

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
        failure_response(NO_EXISTS,get_error(object_name(auth_object),id), att);
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
                                       const string&    vnm_mad,
                                       const string&    tm_mad,
                                       const string&    ds_location,
                                       int              ds_id,
                                       RequestAttributes& att)
{
    string  vmdir;
    int     rc;

    VirtualMachinePool * vmpool = static_cast<VirtualMachinePool *>(pool);

    vm->add_history(hid, cid, hostname, vmm_mad, vnm_mad, tm_mad, ds_location, ds_id);

    rc = vmpool->update_history(vm);

    if ( rc != 0 )
    {
        failure_response(INTERNAL,
                request_error("Cannot update virtual machine history",""),
                att);

        return -1;
    }

    vmpool->update(vm);

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

    if ( vm_authorization(id, 0, 0, att, 0, 0, op) == false )
    {
        return;
    }

    if ((vm = get_vm(id, att)) == 0)
    {
        return;
    }

    if (vm->is_imported() && (
        action == History::DELETE_RECREATE_ACTION ||
        action == History::UNDEPLOY_ACTION ||
        action == History::UNDEPLOY_HARD_ACTION ||
        action == History::STOP_ACTION))
    {
        oss << "Action \"" << action_st << "\" is not supported for imported VMs";

        failure_response(ACTION,
                request_error(oss.str(),""),
                att);

        vm->unlock();
        return;
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
            failure_response(NO_EXISTS,
                    get_error(object_name(auth_object),id),
                    att);
            break;
        case -2:
            oss << "Error performing action \"" << action_st << "\" on "
                << object_name(auth_object) << " [" << id << "]";

            failure_response(ACTION,
                    request_error(oss.str(),error),
                    att);
             break;
        case -3:
            oss << "Virtual machine action \"" << action_st
                << "\" is not supported";

            failure_response(ACTION,
                    request_error(oss.str(),""),
                    att);
            break;
        default:
            failure_response(INTERNAL,
                    request_error("Internal error","Action result not defined"),
                    att);
    }

    return;
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
    string vnm_mad;
    int    cluster_id;
    string ds_location;
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
                             vnm_mad,
                             cluster_id,
                             ds_location,
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
            int ds_cluster_id;

            if (get_ds_information(ds_id, ds_cluster_id, tm_mad, att) != 0)
            {
                return;
            }

            if (ds_cluster_id != cluster_id)
            {
                ostringstream oss;

                oss << object_name(PoolObjectSQL::DATASTORE)
                    << " [" << ds_id << "] and " << object_name(PoolObjectSQL::HOST)
                    << " [" << hid <<"] are not in the same cluster.";

                failure_response(ACTION, request_error(oss.str(),""), att);

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
            failure_response(NO_EXISTS,
                get_error(object_name(PoolObjectSQL::DATASTORE), ds_id),
                att);

            return;
        }

        ds->get_permissions(ds_perms);

        ds->unlock();

        auth_ds_perms = &ds_perms;
    }

    // ------------------------------------------------------------------------
    // Authorize request
    // ------------------------------------------------------------------------

    auth = vm_authorization(id, 0, 0, att, &host_perms, auth_ds_perms, auth_op);

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
        ostringstream oss;

        oss << "Deploy action is not available for state " << vm->state_str();

        failure_response(ACTION,
                request_error(oss.str(),""),
                att);

        vm->unlock();
        return;
    }

    if (enforce)
    {
        int    cpu, mem, disk;
        string error;

        vm->get_requirements(cpu, mem, disk);

        vm->unlock();

        if (check_host(hid, cpu, mem, disk, error) == false)
        {
            failure_response(ACTION, request_error(error,""), att);
            return;
        }

        if ((vm = get_vm(id, att)) == 0)
        {
            return;
        }
    }

    // ------------------------------------------------------------------------
    // Add a new history record and deploy the VM
    // ------------------------------------------------------------------------

    if (add_history(vm,
                    hid,
                    cluster_id,
                    hostname,
                    vmm_mad,
                    vnm_mad,
                    tm_mad,
                    ds_location,
                    ds_id,
                    att) != 0)
    {
        vm->unlock();
        return;
    }

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
    string vnm_mad;
    int    cluster_id, ds_cluster_id;
    string ds_location;
    bool   is_public_cloud;
    PoolObjectAuth host_perms, ds_perms;
    PoolObjectAuth * auth_ds_perms;

    int    c_hid;
    int    c_cluster_id;
    int    c_ds_id;
    string c_tm_mad, tm_mad;
    bool   c_is_public_cloud;

    bool auth = false;

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
                             vnm_mad,
                             cluster_id,
                             ds_location,
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
            failure_response(NO_EXISTS,
                get_error(object_name(PoolObjectSQL::DATASTORE), ds_id),
                att);

            return;
        }

        ds->get_permissions(ds_perms);

        ds->unlock();

        auth_ds_perms = &ds_perms;
    }

    // ------------------------------------------------------------------------
    // Authorize request
    // ------------------------------------------------------------------------

    auth = vm_authorization(id, 0, 0, att, &host_perms, auth_ds_perms, auth_op);

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
        ostringstream oss;

        oss << "Migrate action is not available for state " << vm->state_str();

        failure_response(ACTION,
                request_error(oss.str(),""),
                att);

        vm->unlock();
        return;
    }

    if (vm->is_imported())
    {
        failure_response(ACTION,
                request_error("Migration is not supported for imported VMs",""),
                att);

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

        oss << "VM is already running on "
            << object_name(PoolObjectSQL::HOST) << " [" << c_hid << "]";

        failure_response(ACTION,
                request_error(oss.str(),""),
                att);

        vm->unlock();
        return;
    }

    // Check the host has enough capacity
    if (enforce)
    {
        int    cpu, mem, disk;
        string error;

        vm->get_requirements(cpu, mem, disk);

        vm->unlock();

        if (check_host(hid, cpu, mem, disk, error) == false)
        {
            failure_response(ACTION, request_error(error,""), att);
            return;
        }
    }
    else
    {
        vm->unlock();
    }

    // Check we are in the same cluster
    Host * host = nd.get_hpool()->get(c_hid, true);

    if (host == 0)
    {
        failure_response(NO_EXISTS,
                get_error(object_name(PoolObjectSQL::HOST), c_hid),
                att);
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

        failure_response(ACTION,
                request_error(oss.str(),""),
                att);

        return;
    }

    if ( is_public_cloud || c_is_public_cloud )
    {
        failure_response(ACTION,
                request_error("Cannot migrate to or from a Public Cloud Host",""),
                att);

        return;
    }

    if (ds_id != -1)
    {
        if ( c_ds_id != ds_id && live )
        {
            failure_response(ACTION,
                    request_error(
                            "A migration to a different system datastore "
                            "cannot be performed live.",""),
                    att);

            return;
        }

        if (get_ds_information(ds_id, ds_cluster_id, tm_mad, att) != 0)
        {
            return;
        }

        if (c_cluster_id != ds_cluster_id)
        {
            ostringstream oss;

            oss << "Cannot migrate to a different cluster. VM running in a host"
                << " in " << object_name(PoolObjectSQL::CLUSTER) << " ["
                << c_cluster_id << "] , and new system datastore is in "
                << object_name(PoolObjectSQL::CLUSTER) << " [" << ds_cluster_id << "]";

            failure_response(ACTION, request_error(oss.str(),""), att);

            return;
        }

        if (c_tm_mad != tm_mad)
        {
            ostringstream oss;

            oss << "Cannot migrate to a system datastore with a different TM driver";

            failure_response(ACTION, request_error(oss.str(),""), att);

            return;
        }
    }
    else
    {
        ds_id  = c_ds_id;
        tm_mad = c_tm_mad;
    }

    // ------------------------------------------------------------------------
    // Add a new history record and migrate the VM
    // ------------------------------------------------------------------------

    if ( (vm = get_vm(id, att)) == 0 )
    {
        return;
    }

    if (add_history(vm,
                    hid,
                    cluster_id,
                    hostname,
                    vmm_mad,
                    vnm_mad,
                    tm_mad,
                    ds_location,
                    ds_id,
                    att) != 0)
    {
        vm->unlock();
        return;
    }

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
    string error;

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

    iid_orig = vm->set_saveas_disk(disk_id, snap_id, error);

    if (iid_orig == -1)
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

    size = img->get_size();
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
    rc_auth = vm_authorization(id, itemplate, 0, att, 0,&ds_perms,auth_op);

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
                         -1,
                         &iid,
                         error);
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

    failure_response(INTERNAL,request_error("VM has to be RUNNING, POWEROFF or "
        "SUSPENDED to save disks.",""), att);
    return;

error_disk:
    vm->clear_saveas_state();

    vm->clear_saveas_disk();

    vm->unlock();

    failure_response(INTERNAL,request_error("Cannot use DISK", error), att);
    return;

error_image:
    failure_response(NO_EXISTS, get_error(object_name(PoolObjectSQL::IMAGE),
        iid_orig), att);
    goto error_common;

error_image_type:
    failure_response(INTERNAL, request_error("Cannot save_as image of type " +
        Image::type_to_str(type), ""), att);
    goto error_common;

error_ds:
    failure_response(NO_EXISTS, get_error(object_name(PoolObjectSQL::DATASTORE),
        ds_id), att);
    goto error_common;

error_size:
    failure_response(ACTION, "Not enough space in datastore", att);
    goto error_common;

error_auth:
    delete itemplate;
    goto error_common;

error_allocate:
    quota_rollback(&img_usage, Quotas::DATASTORE, att);
    failure_response(INTERNAL, allocate_error(PoolObjectSQL::IMAGE, error),att);
    goto error_common;

error_ds_removed:
    failure_response(NO_EXISTS,get_error(object_name(PoolObjectSQL::DATASTORE),
        ds_id), att);
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

    bool auth = vm_authorization(id, 0, 0, att, 0, 0, auth_op);

    if ( auth == false )
    {
        return;
    }

    rc = (static_cast<VirtualMachinePool *>(pool))->dump_monitoring(oss, id);

    if ( rc != 0 )
    {
        failure_response(INTERNAL,request_error("Internal Error",""), att);
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

    VirtualMachineTemplate * tmpl = new VirtualMachineTemplate();
    VirtualMachineTemplate * deltas = 0;
    PoolObjectAuth           vm_perms;

    VirtualMachinePool * vmpool = static_cast<VirtualMachinePool *>(pool);
    VirtualMachine *     vm;

    int    rc;
    string error_str;
    bool   volatile_disk;

    int     id       = xmlrpc_c::value_int(paramList.getInt(1));
    string  str_tmpl = xmlrpc_c::value_string(paramList.getString(2));

    // -------------------------------------------------------------------------
    // Parse Disk template
    // -------------------------------------------------------------------------

    rc = tmpl->parse_str_or_xml(str_tmpl, error_str);

    if ( rc != 0 )
    {
        failure_response(INTERNAL, error_str, att);
        delete tmpl;

        return;
    }

    // -------------------------------------------------------------------------
    // Authorize the operation & check quotas
    // -------------------------------------------------------------------------

    if ( vm_authorization(id, 0, tmpl, att, 0, 0, auth_op) == false )
    {
        delete tmpl;
        return;
    }

    vm = vmpool->get(id, true);

    if (vm == 0)
    {
        failure_response(NO_EXISTS,
                get_error(object_name(PoolObjectSQL::VM),id),
                att);
        return;
    }

    vm->get_permissions(vm_perms);

    vm->unlock();

    RequestAttributes att_quota(vm_perms.uid, vm_perms.gid, att);

    volatile_disk = VirtualMachine::is_volatile(tmpl);

    if ( volatile_disk )
    {
        deltas = new VirtualMachineTemplate(*tmpl);

        deltas->add("VMS", 0);

        if (quota_resize_authorization(id, deltas, att_quota) == false)
        {
            delete tmpl;
            delete deltas;

            return;
        }
    }
    else
    {
        if ( quota_authorization(tmpl, Quotas::IMAGE, att_quota) == false )
        {
            delete tmpl;
            return;
        }
    }

    rc = dm->attach(id, tmpl, error_str);

    if ( rc != 0 )
    {
        if ( volatile_disk )
        {
            quota_rollback(deltas, Quotas::VM, att_quota);
        }
        else
        {
            quota_rollback(tmpl, Quotas::IMAGE, att_quota);
        }

        failure_response(ACTION,
                request_error(error_str, ""),
                att);
    }
    else
    {
        success_response(id, att);
    }

    delete tmpl;
    delete deltas;

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineDetach::request_execute(xmlrpc_c::paramList const& paramList,
                                            RequestAttributes& att)
{
    Nebula&             nd = Nebula::instance();
    DispatchManager *   dm = nd.get_dm();

    int rc;
    string error_str;

    int     id      = xmlrpc_c::value_int(paramList.getInt(1));
    int     disk_id = xmlrpc_c::value_int(paramList.getInt(2));

    // -------------------------------------------------------------------------
    // Authorize the operation
    // -------------------------------------------------------------------------

    if ( vm_authorization(id, 0, 0, att, 0, 0, auth_op) == false )
    {
        return;
    }

    rc = dm->detach(id, disk_id, error_str);

    if ( rc != 0 )
    {
        failure_response(ACTION,
                request_error(error_str, ""),
                att);
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
    string   error_str;
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

    rc = tmpl.parse_str_or_xml(str_tmpl, error_str);

    if ( rc != 0 )
    {
        failure_response(INTERNAL, error_str, att);
        return;
    }

    /* ---------------------------------------------------------------------- */
    /*  Authorize the operation & restricted attributes                       */
    /* ---------------------------------------------------------------------- */

    if ( vm_authorization(id, 0, 0, att, 0, 0, auth_op) == false )
    {
        return;
    }

    if (att.uid != UserPool::ONEADMIN_ID && att.gid!=GroupPool::ONEADMIN_ID)
    {
        string aname;

        if (tmpl.check(aname))
        {
            ostringstream oss;

            oss << "Template includes a restricted attribute " << aname;

            failure_response(AUTHORIZATION,
                    authorization_error(oss.str(), att),
                    att);
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
        failure_response(NO_EXISTS,
                get_error(object_name(PoolObjectSQL::VM),id),
                att);
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
        break;

        case VirtualMachine::STOPPED:
        case VirtualMachine::DONE:
        case VirtualMachine::SUSPENDED:
        case VirtualMachine::ACTIVE:
            ostringstream oss;

            oss << "Resize action is not available for state " << vm->state_str();

            failure_response(ACTION,
                     request_error(oss.str(),""),
                     att);

            vm->unlock();
            return;
    }

    ret = vm->check_resize(ncpu, nmemory, nvcpu, error_str);

    vm->unlock();

    if (ret != 0)
    {
        failure_response(INTERNAL,
                request_error("Could resize the VM", error_str),
                att);
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

        host = hpool->get(hid, true);

        if (host == 0)
        {
            failure_response(NO_EXISTS,
                get_error(object_name(PoolObjectSQL::HOST),hid),
                att);

            quota_rollback(&deltas, Quotas::VM, att_rollback);

            return;
        }

        if ( enforce && host->test_capacity(dcpu_host, dmem_host, 0) == false)
        {
            ostringstream oss;

            oss << object_name(PoolObjectSQL::HOST)
                << " " << hid << " does not have enough capacity.";

            failure_response(ACTION, request_error(oss.str(),""), att);

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
        failure_response(NO_EXISTS,
                get_error(object_name(PoolObjectSQL::VM),id),
                att);

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
            ret = vm->resize(ncpu, nmemory, nvcpu, error_str);

            if (ret != 0)
            {
                vm->unlock();

                failure_response(INTERNAL,
                        request_error("Could not resize the VM", error_str),
                        att);
                return;
            }

            vmpool->update(vm);
        break;

        case VirtualMachine::STOPPED:
        case VirtualMachine::DONE:
        case VirtualMachine::SUSPENDED:
        case VirtualMachine::ACTIVE:
            ostringstream oss;

            oss << "Resize action is not available for state " << vm->state_str();

            failure_response(ACTION,
                     request_error(oss.str(),""),
                     att);

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
    string  error_str;

    int     id   = xmlrpc_c::value_int(paramList.getInt(1));
    string  name = xmlrpc_c::value_string(paramList.getString(2));

    // -------------------------------------------------------------------------
    // Authorize the operation
    // -------------------------------------------------------------------------

    if ( vm_authorization(id, 0, 0, att, 0, 0, auth_op) == false )
    {
        return;
    }

    rc = dm->snapshot_create(id, name, snap_id, error_str);

    if ( rc != 0 )
    {
        failure_response(ACTION,
                request_error(error_str, ""),
                att);
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
    string error_str;

    int id      = xmlrpc_c::value_int(paramList.getInt(1));
    int snap_id = xmlrpc_c::value_int(paramList.getInt(2));

    // -------------------------------------------------------------------------
    // Authorize the operation
    // -------------------------------------------------------------------------

    if ( vm_authorization(id, 0, 0, att, 0, 0, auth_op) == false )
    {
        return;
    }

    rc = dm->snapshot_revert(id, snap_id, error_str);

    if ( rc != 0 )
    {
        failure_response(ACTION,
                request_error(error_str, ""),
                att);
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
    string error_str;

    int id      = xmlrpc_c::value_int(paramList.getInt(1));
    int snap_id = xmlrpc_c::value_int(paramList.getInt(2));

    // -------------------------------------------------------------------------
    // Authorize the operation
    // -------------------------------------------------------------------------

    if ( vm_authorization(id, 0, 0, att, 0, 0, auth_op) == false )
    {
        return;
    }

    rc = dm->snapshot_delete(id, snap_id, error_str);

    if ( rc != 0 )
    {
        failure_response(ACTION,
                request_error(error_str, ""),
                att);
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
    Nebula&           nd = Nebula::instance();
    DispatchManager * dm = nd.get_dm();

    VirtualMachineTemplate tmpl;

    PoolObjectAuth       vm_perms;
    VirtualMachinePool * vmpool = static_cast<VirtualMachinePool *>(pool);
    VirtualMachine *     vm;

    int    rc;
    string error_str;

    int     id       = xmlrpc_c::value_int(paramList.getInt(1));
    string  str_tmpl = xmlrpc_c::value_string(paramList.getString(2));

    // -------------------------------------------------------------------------
    // Parse NIC template
    // -------------------------------------------------------------------------

    rc = tmpl.parse_str_or_xml(str_tmpl, error_str);

    if ( rc != 0 )
    {
        failure_response(INTERNAL, error_str, att);
        return;
    }

    // -------------------------------------------------------------------------
    // Authorize the operation, restricted attributes & check quotas
    // -------------------------------------------------------------------------

    if ( vm_authorization(id, 0, &tmpl, att, 0, 0, auth_op) == false )
    {
        return;
    }

    vm = vmpool->get(id, true);

    if (vm == 0)
    {
        failure_response(NO_EXISTS,
                get_error(object_name(PoolObjectSQL::VM),id),
                att);
        return;
    }

    vm->get_permissions(vm_perms);

    vm->unlock();

    RequestAttributes att_quota(vm_perms.uid, vm_perms.gid, att);

    if (att.uid != UserPool::ONEADMIN_ID && att.gid!=GroupPool::ONEADMIN_ID)
    {
        string aname;

        if (tmpl.check(aname))
        {
            ostringstream oss;

            oss << "NIC includes a restricted attribute " << aname;

            failure_response(AUTHORIZATION,
                    authorization_error(oss.str(), att),
                    att);
            return;
        }
    }

    if ( quota_authorization(&tmpl, Quotas::NETWORK, att_quota) == false )
    {
        return;
    }

    rc = dm->attach_nic(id, &tmpl, error_str);

    if ( rc != 0 )
    {
        quota_rollback(&tmpl, Quotas::NETWORK, att_quota);

        failure_response(ACTION,
                request_error(error_str, ""),
                att);
    }
    else
    {
        success_response(id, att);
    }

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineDetachNic::request_execute(
        xmlrpc_c::paramList const&  paramList,
        RequestAttributes&          att)
{
    Nebula&             nd = Nebula::instance();
    DispatchManager *   dm = nd.get_dm();

    int rc;
    string error_str;

    int id      = xmlrpc_c::value_int(paramList.getInt(1));
    int nic_id  = xmlrpc_c::value_int(paramList.getInt(2));

    // -------------------------------------------------------------------------
    // Authorize the operation
    // -------------------------------------------------------------------------

    if ( vm_authorization(id, 0, 0, att, 0, 0, auth_op) == false )
    {
        return;
    }

    rc = dm->detach_nic(id, nic_id, error_str);

    if ( rc != 0 )
    {
        failure_response(ACTION,
                request_error(error_str, ""),
                att);
    }
    else
    {
        success_response(id, att);
    }

    return;
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

    if ( vm_authorization(id, 0, 0, att, 0, 0, auth_op) == false )
    {
        return;
    }

    if ((vm = get_vm(id, att)) == 0)
    {
        return;
    }

    if(vm->get_state() != VirtualMachine::ACTIVE)
    {
        ostringstream oss;

        oss << "Recover action is not available for state " << vm->state_str();

        failure_response(ACTION,
                request_error(oss.str(),""),
                att);

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
            failure_response(ACTION,
                request_error("Wrong recovery operation code",""),
                att);

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
    string        error_str;

    if ( att.gid != 0 )
    {
        failure_response(AUTHORIZATION,
                         authorization_error("Action reserved for group 0 only", att),
                         att);
        return;
    }

    rc = (static_cast<VirtualMachinePool *>(pool))->calculate_showback(
                    start_month, start_year, end_month, end_year, error_str);

    if (rc != 0)
    {
        failure_response(AUTHORIZATION,
                         request_error(error_str, ""),
                         att);
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

    Template deltas;

    int    rc;
    int    snap_id;
    string error_str;

    int    id   = xmlrpc_c::value_int(paramList.getInt(1));
    int    did  = xmlrpc_c::value_int(paramList.getInt(2));
    string name = xmlrpc_c::value_string(paramList.getString(3));

    if ( vm_authorization(id, 0, 0, att, 0, 0, auth_op) == false )
    {
        return;
    }

    // ------------------------------------------------------------------------
    // Check quotas for the new snapshot
    // ------------------------------------------------------------------------
    if ((vm = get_vm(id, att)) == 0)
    {
        return;
    }

    disk = (const_cast<const VirtualMachine *>(vm))->get_disk(did);

    if (disk == 0)
    {
        failure_response(ACTION, request_error("VM disk does not exist", ""), att);

        vm->unlock();

        return;
    }

    string disk_size = disk->vector_value("SIZE");
    string ds_id     = disk->vector_value("DATASTORE_ID");
    bool persistent  = VirtualMachine::is_persistent(disk);
    bool is_volatile = VirtualMachine::is_volatile(disk);

    vm->get_permissions(vm_perms);

    vm->unlock();

    RequestAttributes att_quota(vm_perms.uid, vm_perms.gid, att);

    if (is_volatile)
    {
        failure_response(ACTION, request_error("Cannot make snapshots on "
                    "volatile disks",""), att);
        return;
    }
    else if (persistent)
    {
        deltas.add("DATASTORE", ds_id);
        deltas.add("SIZE", disk_size);
        deltas.add("IMAGES", 0);

        if (!quota_authorization(&deltas, Quotas::DATASTORE, att_quota))
        {
            return;
        }
    }
    else
    {
        delta_disk = new VectorAttribute("DISK");
        delta_disk->replace("TYPE", "FS");
        delta_disk->replace("SIZE", disk_size);

        deltas.add("VMS", 0);
        deltas.set(delta_disk);

        if (!quota_resize_authorization(id, &deltas, att_quota))
        {
            return;
        }
    }

    // ------------------------------------------------------------------------
    // Do the snapshot
    // ------------------------------------------------------------------------
    rc = dm->disk_snapshot_create(id, did, name, snap_id, error_str);

    if ( rc != 0 )
    {
        if (persistent)
        {
            quota_rollback(&deltas, Quotas::DATASTORE, att_quota);
        }
        else
        {
            quota_rollback(&deltas, Quotas::VM, att_quota);
        }

        failure_response(ACTION, request_error(error_str, ""), att);
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
    string error_str;

    int id      = xmlrpc_c::value_int(paramList.getInt(1));
    int did     = xmlrpc_c::value_int(paramList.getInt(2));
    int snap_id = xmlrpc_c::value_int(paramList.getInt(3));

    if ( vm_authorization(id, 0, 0, att, 0, 0, auth_op) == false )
    {
        return;
    }

    rc = dm->disk_snapshot_revert(id, did, snap_id, error_str);

    if ( rc != 0 )
    {
        failure_response(ACTION,
                request_error(error_str, ""),
                att);
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

    int    rc;
    string error_str;

    int id      = xmlrpc_c::value_int(paramList.getInt(1));
    int did     = xmlrpc_c::value_int(paramList.getInt(2));
    int snap_id = xmlrpc_c::value_int(paramList.getInt(3));

    if ( vm_authorization(id, 0, 0, att, 0, 0, auth_op) == false )
    {
        return;
    }

    rc = dm->disk_snapshot_delete(id, did, snap_id, error_str);

    if ( rc != 0 )
    {
        failure_response(ACTION,
                request_error(error_str, ""),
                att);
    }
    else
    {
        success_response(id, att);
    }

    return;
}

