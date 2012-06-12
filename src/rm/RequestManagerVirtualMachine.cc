/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool RequestManagerVirtualMachine::vm_authorization(
        int                    oid,
        ImageTemplate *        tmpl,
        RequestAttributes&     att,
        PoolObjectAuth *       host_perm,
        PoolObjectAuth *       ds_perm,
        AuthRequest::Operation op)
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

    AuthRequest ar(att.uid, att.gid);

    ar.add_auth(op, vm_perms);

    if (host_perm != 0)
    {
        ar.add_auth(AuthRequest::MANAGE, *host_perm);
    }

    if (tmpl != 0)
    {
        string t_xml;

        ar.add_create_auth(PoolObjectSQL::IMAGE, tmpl->to_xml(t_xml));
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

int RequestManagerVirtualMachine::get_host_information(int hid, 
                                                string& name, 
                                                string& vmm,
                                                string& vnm,
                                                RequestAttributes& att,
                                                PoolObjectAuth&    host_perms)
{
    Nebula&    nd    = Nebula::instance();
    HostPool * hpool = nd.get_hpool();

    Host * host;

    host = hpool->get(hid,true);

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

    host->get_permissions(host_perms);

    host->unlock();

    return 0;
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
                                       const string&    hostname,
                                       const string&    vmm_mad,
                                       const string&    vnm_mad,
                                       RequestAttributes& att)
{
    string  vmdir;
    int     rc;

    VirtualMachinePool * vmpool = static_cast<VirtualMachinePool *>(pool);

    vm->add_history(hid,hostname,vmm_mad,vnm_mad);

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
    string action = xmlrpc_c::value_string(paramList.getString(1));
    int    id     = xmlrpc_c::value_int(paramList.getInt(2));

    int    rc = -4;

    Nebula& nd = Nebula::instance();
    DispatchManager * dm = nd.get_dm();

    AuthRequest::Operation op = auth_op;

    if (action == "resched" || action == "unresched")
    {
        op = AuthRequest::ADMIN;
    }

    if ( vm_authorization(id, 0, att, 0, 0, op) == false )
    {
        return;
    }

    if (action == "shutdown")
    {
        rc = dm->shutdown(id);
    }
    else if (action == "hold")
    {
        rc = dm->hold(id);
    }
    else if (action == "release")
    {
        rc = dm->release(id);
    }
    else if (action == "stop")
    {
        rc = dm->stop(id);
    }
    else if (action == "cancel")
    {
        rc = dm->cancel(id);
    }
    else if (action == "suspend")
    {
        rc = dm->suspend(id);
    }
    else if (action == "resume")
    {
        rc = dm->resume(id);
    }
    else if (action == "restart")
    {
        rc = dm->restart(id);
    }
    else if (action == "finalize")
    {
        rc = dm->finalize(id);
    }
    else if (action == "resubmit")
    {
        rc = dm->resubmit(id);
    }
    else if (action == "reboot")
    {
        rc = dm->reboot(id);
    }
    else if (action == "resched")
    {
        rc = dm->resched(id, true);
    }
    else if (action == "unresched")
    {
        rc = dm->resched(id, false);
    }
    else if (action == "reset")
    {
        rc = dm->reset(id);
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
             failure_response(ACTION,
                     request_error("Wrong state to perform action",""),
                     att);
             break;
        case -3:
            failure_response(ACTION,
                    request_error("Virtual machine action not supported",""),
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

    VirtualMachine * vm;
    PoolObjectAuth host_perms;

    string hostname;
    string vmm_mad;
    string vnm_mad;

    int id  = xmlrpc_c::value_int(paramList.getInt(1));
    int hid = xmlrpc_c::value_int(paramList.getInt(2));

    bool auth = false;

    if (get_host_information(hid,hostname,vmm_mad,vnm_mad,att, host_perms) != 0)
    {
        return;
    }

    auth = vm_authorization(id, 0, att, &host_perms, 0, auth_op);

    if ( auth == false )
    {
        return;
    }

    if ( (vm = get_vm(id, att)) == 0 )
    {
        return;
    }

    if ( vm->get_state() != VirtualMachine::PENDING )
    {
        failure_response(ACTION,
                request_error("Wrong state to perform action",""),
                att);

        vm->unlock();
        return;
    }

    if ( add_history(vm,hid,hostname,vmm_mad,vnm_mad,att) != 0)
    {
        vm->unlock();
        return;
    }

    dm->deploy(vm);

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

    VirtualMachine * vm;
    PoolObjectAuth host_perms;

    string hostname;
    string vmm_mad;
    string vnm_mad;

    int  id   = xmlrpc_c::value_int(paramList.getInt(1));
    int  hid  = xmlrpc_c::value_int(paramList.getInt(2));
    bool live = xmlrpc_c::value_boolean(paramList.getBoolean(3));

    bool auth = false;

    if (get_host_information(hid,hostname,vmm_mad,vnm_mad,att, host_perms) != 0)
    {
        return;
    }

    auth = vm_authorization(id, 0, att, &host_perms, 0, auth_op);

    if ( auth == false )
    {
        return;
    }

    if ( (vm = get_vm(id, att)) == 0 )
    {
        return;
    }

    if((vm->get_state()     != VirtualMachine::ACTIVE)  ||
       (vm->get_lcm_state() != VirtualMachine::RUNNING) ||
       (vm->hasPreviousHistory() && vm->get_previous_reason() == History::NONE))
    {
        failure_response(ACTION,
                request_error("Wrong state to perform action",""),
                att);

        vm->unlock();
        return;
    }

    if ( add_history(vm,hid,hostname,vmm_mad,vnm_mad,att) != 0)
    {
        vm->unlock();
        return;
    }

    if ( live == true )
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

void VirtualMachineSaveDisk::request_execute(xmlrpc_c::paramList const& paramList,
                                             RequestAttributes& att)
{
    Nebula& nd  = Nebula::instance();

    ImagePool *      ipool = nd.get_ipool();
    DatastorePool * dspool = nd.get_dspool();

    int    id       = xmlrpc_c::value_int(paramList.getInt(1));
    int    disk_id  = xmlrpc_c::value_int(paramList.getInt(2));
    string img_name = xmlrpc_c::value_string(paramList.getString(3));
    string img_type = xmlrpc_c::value_string(paramList.getString(4));

    VirtualMachine * vm;
    int              iid;
    int              iid_orig;

    Image         *  img;
    Datastore     *  ds;
    Image::DiskType  ds_disk_type;

    int           rc;
    string        error_str;

    // -------------------------------------------------------------------------
    // Prepare and check the VM/DISK to be saved_as
    // -------------------------------------------------------------------------
    
    if ( (vm = get_vm(id, att)) == 0 )
    {   
        failure_response(NO_EXISTS,
                         get_error(object_name(PoolObjectSQL::VM), id), 
                         att);
        return;
    }

    iid_orig = vm->get_image_from_disk(disk_id, error_str);

    pool->update(vm);

    vm->unlock();

    if ( iid_orig == -1 )
    {
        failure_response(INTERNAL, 
                         request_error("Cannot use selected DISK", error_str),
                         att);
        return;
    }

    // -------------------------------------------------------------------------
    // Get the data of the Image to be saved
    // -------------------------------------------------------------------------

    img = ipool->get(iid_orig, true);

    if ( img == 0 )
    {
        failure_response(NO_EXISTS,
                         get_error(object_name(PoolObjectSQL::IMAGE), iid_orig), 
                         att);
        return;
    }

    int    ds_id   = img->get_ds_id();
    string ds_name = img->get_ds_name();
    int    size    = img->get_size();

    Image::ImageType type = img->get_type();

    img->unlock();

    if ((ds = dspool->get(ds_id, true)) == 0 )
    {
        failure_response(NO_EXISTS,
                get_error(object_name(PoolObjectSQL::DATASTORE), ds_id),
                att);
        return;
    }

    // -------------------------------------------------------------------------
    // Get the data of the DataStore for the new image
    // -------------------------------------------------------------------------
    string         ds_data;
    PoolObjectAuth ds_perms;

    ds->get_permissions(ds_perms);
    ds->to_xml(ds_data);
    
    ds_disk_type = ds->get_disk_type();

    ds->unlock();

    // -------------------------------------------------------------------------
    // Create a template for the new Image
    // -------------------------------------------------------------------------
    ImageTemplate * itemplate = new ImageTemplate;
    Template        img_usage;

    itemplate->add("NAME", img_name);
    itemplate->add("SIZE", size);

    itemplate->add("SAVED_IMAGE_ID",iid_orig);
    itemplate->add("SAVED_DISK_ID",disk_id);
    itemplate->add("SAVED_VM_ID", id);

    if ( img_type.empty() )
    {
        itemplate->add("TYPE", Image::type_to_str(type));
    }
    else
    {
        itemplate->add("TYPE", img_type);
    }

    itemplate->set_saving();

    img_usage.add("SIZE",      size);
    img_usage.add("DATASTORE", ds_id);

    // -------------------------------------------------------------------------
    // Authorize the operation & check quotas
    // -------------------------------------------------------------------------

    if ( vm_authorization(id, itemplate, att, 0, &ds_perms, auth_op) == false )
    {
        delete itemplate;
        return;
    }

    if ( quota_authorization(&img_usage, PoolObjectSQL::IMAGE, att) == false )
    {
        delete itemplate;
        return;   
    }

    // -------------------------------------------------------------------------
    // Create the image
    // -------------------------------------------------------------------------

    rc = ipool->allocate(att.uid, 
                         att.gid, 
                         att.uname, 
                         att.gname, 
                         itemplate,
                         ds_id,
                         ds_name,
                         ds_disk_type,
                         ds_data,
                         &iid,
                         error_str);
    if (rc < 0)
    {
        quota_rollback(&img_usage, PoolObjectSQL::IMAGE, att);

        failure_response(INTERNAL,
                allocate_error(PoolObjectSQL::IMAGE, error_str), att);
        return;
    }

    // Return the new allocated Image ID
    success_response(iid, att);
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

    bool auth = vm_authorization(id, 0, att, 0, 0, auth_op);

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
