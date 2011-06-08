/* -------------------------------------------------------------------------- */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             */
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
#include "Nebula.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool RequestManagerVirtualMachine::vm_authorization(int oid, int hid, ImageTemplate *tmpl)
{
    PoolObjectSQL * object;

    int  ouid;

    if ( uid == 0 )
    {
        return true;
    }

    object = pool->get(oid,true);

    if ( object == 0 )
    {
        failure_response(NO_EXISTS, get_error(object_name(auth_object),oid)); 
        return false;
    }

    ouid = object->get_uid();

    object->unlock();

    AuthRequest ar(uid);

    ar.add_auth(auth_object, oid, auth_op, ouid, false);

    if (hid != -1)
    {
        ar.add_auth(AuthRequest::HOST,hid,AuthRequest::USE,0,false);
    }
    else if (tmpl != 0)
    {
        string t64;

        ar.add_auth(AuthRequest::IMAGE,
                    tmpl->to_xml(t64),
                    AuthRequest::CREATE,
                    uid,
                    false);
    }

    if (UserPool::authorize(ar) == -1)
    {
        failure_response(AUTHORIZATION, authorization_error(ar.message));
        return false;
    }

    return true;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int RequestManagerVirtualMachine::get_host_information(int hid, 
                                                string& name, 
                                                string& vmm, 
                                                string& tm)
{
    Nebula&    nd    = Nebula::instance();
    HostPool * hpool = nd.get_hpool();

    Host * host;

    host = hpool->get(hid,true);

    if ( host == 0 )
    {
        failure_response(NO_EXISTS,
                get_error(object_name(AuthRequest::HOST),hid)); 
        return -1;
    }

    name = host->get_name();
    vmm  = host->get_vmm_mad();
    tm   = host->get_tm_mad();

    host->unlock();

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

VirtualMachine * RequestManagerVirtualMachine::get_vm(int id)
{
    VirtualMachine * vm;

    vm = static_cast<VirtualMachine *>(pool->get(id,true));

    if ( vm == 0 )
    {
        failure_response(NO_EXISTS,get_error(object_name(auth_object),id)); 
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
                                       const string&    tm_mad)
{
    Nebula& nd = Nebula::instance();
    string  vmdir;

    int     rc;

    VirtualMachinePool * vmpool = static_cast<VirtualMachinePool *>(pool);

    nd.get_configuration_attribute("VM_DIR",vmdir);

    vm->add_history(hid,hostname,vmdir,vmm_mad,tm_mad);

    rc = vmpool->update_history(vm);

    if ( rc != 0 )
    {
        failure_response(INTERNAL, 
                request_error("Can not update virtual machine history",""));
        return -1;
    }

    vmpool->update(vm);

    return 0;
}  

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
void VirtualMachineAction::request_execute(xmlrpc_c::paramList const& paramList)
{
    string action = xmlrpc_c::value_string(paramList.getString(1));
    int    id     = xmlrpc_c::value_int(paramList.getInt(2));

    int    rc;

    Nebula& nd = Nebula::instance();
    DispatchManager * dm = nd.get_dm();

    if ( vm_authorization(id,-1,0) == false )
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

    switch (rc)
    { 
        case 0:
            success_response(id);
            break;
        case -1:
            failure_response(NO_EXISTS,get_error(object_name(auth_object),id));
            break;
        case -2:
             failure_response(ACTION,
                     request_error("Worng state to perform action",""));
             break;
        case -3:
            failure_response(ACTION, 
                    request_error("Virtual machine action not supported",""));
            break;
        default:
            failure_response(INTERNAL,
                    request_error("Internal error","Action result not defined"));
    }

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineDeploy::request_execute(xmlrpc_c::paramList const& paramList)
{
    Nebula&             nd = Nebula::instance();
    DispatchManager *   dm = nd.get_dm();

    VirtualMachine * vm;

    string hostname;
    string vmm_mad;
    string tm_mad;

    int id  = xmlrpc_c::value_int(paramList.getInt(1));
    int hid = xmlrpc_c::value_int(paramList.getInt(2));

    if ( vm_authorization(id,hid,0) == false )
    {
        return;
    }

    if (get_host_information(hid,hostname,vmm_mad,tm_mad) != 0)
    {
        return;
    }

    if ( (vm = get_vm(id)) == 0 )
    {
        return;
    }

    if ( vm->get_state() != VirtualMachine::PENDING )
    {
        failure_response(ACTION, 
                request_error("Worng state to perform action",""));

        vm->unlock();
        return;
    }

    if ( add_history(vm,hid,hostname,vmm_mad,tm_mad) != 0)
    {
        vm->unlock();
        return;
    }

    dm->deploy(vm);

    vm->unlock();

    success_response(id);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineMigrate::request_execute(xmlrpc_c::paramList const& paramList)
{
    Nebula&             nd = Nebula::instance();
    DispatchManager *   dm = nd.get_dm();

    VirtualMachine * vm;

    string hostname;
    string vmm_mad;
    string tm_mad;

    int  id   = xmlrpc_c::value_int(paramList.getInt(1));
    int  hid  = xmlrpc_c::value_int(paramList.getInt(2));
    bool live = xmlrpc_c::value_boolean(paramList.getBoolean(3));

    if ( vm_authorization(id,hid,0) == false )
    {
        return;
    }

    if (get_host_information(hid,hostname,vmm_mad,tm_mad) != 0)
    {
        return;
    }

    if ( (vm = get_vm(id)) == 0 )
    {
        return;
    }

    if((vm->get_state()     != VirtualMachine::ACTIVE)  ||
       (vm->get_lcm_state() != VirtualMachine::RUNNING) ||
       (vm->hasPreviousHistory() && vm->get_previous_reason() == History::NONE))
    {
        failure_response(ACTION, 
                request_error("Worng state to perform action",""));

        vm->unlock();
        return;
    }

    if ( add_history(vm,hid,hostname,vmm_mad,tm_mad) != 0)
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

    success_response(id);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void VirtualMachineSaveDisk::request_execute(xmlrpc_c::paramList const& paramList)
{
    Nebula&     nd    = Nebula::instance();
    ImagePool * ipool = nd.get_ipool();

    int    id       = xmlrpc_c::value_int(paramList.getInt(1));
    int    disk_id  = xmlrpc_c::value_int(paramList.getInt(2));
    string img_name = xmlrpc_c::value_string(paramList.getString(3));

    VirtualMachine * vm;
    string           vm_owner;

    int              iid;
    ImageTemplate *  itemplate;

    int           rc;
    ostringstream oss;
    string        error_str;
    char *        error_char;

    // ------------------ Template for the new image ------------------

    oss << "NAME= " << img_name << endl;
    oss << "PUBLIC = NO " << endl;
    oss << "SOURCE = - " << endl;

    itemplate = new ImageTemplate;

    itemplate->parse(oss.str(), &error_char);

    // ------------------ Authorize the operation ------------------

    if ( vm_authorization(id,-1,itemplate) == false )
    {
        return;
    }

    // ------------------ Create the image ------------------

    rc = ipool->allocate(uid, gid, itemplate, &iid,error_str);

    if ( rc < 0 )
    {
        failure_response(INTERNAL,
                allocate_error(AuthRequest::IMAGE,error_str)); 
        return;
    }
 
    // ------------------ Store image id to save the disk ------------------

    if ( (vm = get_vm(id)) == 0 )
    {
        Image * img;

        if ( (img = ipool->get(iid,true)) != 0 )
        {
            string tmp_error;
            ipool->drop(img, tmp_error);
            img->unlock();
        }

        return;
    }

    rc = vm->save_disk(disk_id, iid, error_str);

    if ( rc == 0 )
    {
        pool->update(vm);
    }

    vm->unlock();

    if ( rc == -1 )
    {
        Image * img;

        if ( (img = ipool->get(iid,true)) != 0 )
        {
            string tmp_error;
            ipool->drop(img, tmp_error);
            img->unlock();
        }

        failure_response(INTERNAL, 
                request_error("Can not save_as disk",error_str));
        return;
    }

    // Return the new allocated Image ID
    success_response(iid);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
