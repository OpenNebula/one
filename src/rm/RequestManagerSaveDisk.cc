/* -------------------------------------------------------------------------- */
/* Copyright 2002-2010, OpenNebula Project Leads (OpenNebula.org)             */
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

#include "RequestManager.h"
#include "NebulaLog.h"

#include "Nebula.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManager::VirtualMachineSaveDisk::execute(
    xmlrpc_c::paramList const& paramList,
    xmlrpc_c::value *   const  retval)
{
    string              session;

    int                 vm_id;
    int                 disk_id;
    int                 img_id;

    int                 vm_owner;
    int                 img_owner;
    bool                img_public;

    int                 rc;

    const string  method_name = "VirtualMachineSaveDisk";

    VirtualMachine *    vm;
    Image *             image;

    vector<xmlrpc_c::value> arrayData;
    xmlrpc_c::value_array * arrayresult;

    ostringstream       oss;

    NebulaLog::log("ReM",Log::DEBUG,"VirtualMachineSaveDisk invoked");

    //Parse Arguments

    session = xmlrpc_c::value_string(paramList.getString(0));
    vm_id   = xmlrpc_c::value_int(paramList.getInt(1));
    disk_id = xmlrpc_c::value_int(paramList.getInt(2));
    img_id  = xmlrpc_c::value_int(paramList.getInt(3));

    // Check that the image exists
    image = VirtualMachineSaveDisk::ipool->get(img_id,true);

    if ( image == 0 )
    {
        goto error_image_get;
    }

    img_owner = image->get_uid();
    img_public = image->isPublic();

    image->unlock();

    //Get the VM
    vm = VirtualMachineSaveDisk::vmpool->get(vm_id,true);

    if ( vm == 0 )
    {
        goto error_vm_get;
    }

    //Authenticate the user
    rc = VirtualMachineSaveDisk::upool->authenticate(session);

    if ( rc == -1 )
    {
        goto error_authenticate;
    }

    //Authorize the operation
    if ( rc != 0 ) // rc == 0 means oneadmin
    {
        vm_owner  = vm->get_uid();

        AuthRequest ar(rc);

        ar.add_auth(AuthRequest::VM,vm_id,AuthRequest::MANAGE,vm_owner,false);
        ar.add_auth(AuthRequest::IMAGE,img_id,
                    AuthRequest::MANAGE,img_owner,img_public);

        if (UserPool::authorize(ar) == -1)
        {
            goto error_authorize;
        }
    }

    vm->save_disk(disk_id, img_id);

    VirtualMachineSaveDisk::vmpool->update(vm);

    vm->unlock();

    // Send results to client
    arrayData.push_back(xmlrpc_c::value_boolean(true));

    arrayresult = new xmlrpc_c::value_array(arrayData);

    *retval = *arrayresult;

    delete arrayresult;

    return;

error_image_get:
    oss.str(get_error(method_name, "IMAGE", img_id));
    goto error_common;

error_vm_get:
    oss.str(get_error(method_name, "VM", vm_id));
    goto error_common;

error_authenticate:
    oss.str(authenticate_error(method_name));
    goto error_common_lock;

error_authorize:
    oss.str(authorization_error(method_name, "MANAGE", "VM/IMAGE", rc, vm_id));
    goto error_common_lock;

error_common_lock:
    vm->unlock();

error_common:
    arrayData.push_back(xmlrpc_c::value_boolean(false));
    arrayData.push_back(xmlrpc_c::value_string(oss.str()));

    NebulaLog::log("ReM",Log::ERROR,oss);

    xmlrpc_c::value_array arrayresult_error(arrayData);

    *retval = arrayresult_error;

    return;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

