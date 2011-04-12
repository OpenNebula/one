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

#include "RequestManager.h"
#include "NebulaLog.h"

#include "Nebula.h"

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManager::VirtualMachineSaveDisk::execute(
    xmlrpc_c::paramList const& paramList,
    xmlrpc_c::value *   const  retval)
{
    string session;

    int    vm_id;
    int    disk_id;
    int    iid;
    string img_name;

    int    vm_owner;
    string user_name;

    int    rc;
    int    uid;
    string estr;
    char * error_char;
    string error_str;

    const string  method_name = "VirtualMachineSaveDisk";

    VirtualMachine * vm;
    Image *          image;
    ImageTemplate *  img_template;
    User *           user;

    Image *     source_img;
    int         source_img_id;
    bool        source_img_persistent = false;

    vector<xmlrpc_c::value> arrayData;
    xmlrpc_c::value_array * arrayresult;

    ostringstream    oss;

    Nebula&          nd     = Nebula::instance();
    ImageManager *   imagem = nd.get_imagem();

    NebulaLog::log("ReM",Log::DEBUG,"VirtualMachineSaveDisk invoked");

    //Parse Arguments
    session  = xmlrpc_c::value_string(paramList.getString(0));
    vm_id    = xmlrpc_c::value_int(paramList.getInt(1));
    disk_id  = xmlrpc_c::value_int(paramList.getInt(2));
    img_name = xmlrpc_c::value_string(paramList.getString(3));

    //-------------------------------------------------------------------------
    //                       Authenticate the user
    //-------------------------------------------------------------------------
    uid = VirtualMachineSaveDisk::upool->authenticate(session);

    if ( uid == -1 )
    {
        goto error_authenticate;
    }

    user = VirtualMachineSaveDisk::upool->get(uid,true);

    if ( user == 0 )
    {
        goto error_user_get;
    }

    user_name = user->get_name();

    user->unlock();

    //-------------------------------------------------------------------------
    // Check that the image does not exist & prepare the template
    //-------------------------------------------------------------------------
    image = VirtualMachineSaveDisk::ipool->get(img_name,uid,false);

    if ( image != 0 )
    {
        goto error_image_exists;
    }

    oss << "NAME= " << img_name << endl;
    oss << "PUBLIC = NO " << endl;
    oss << "SOURCE = " << Image::generate_source(uid,img_name);

    img_template = new ImageTemplate;

    img_template->parse(oss.str(),&error_char);

    oss.str("");

    //--------------------------------------------------------------------------
    // Get the VM
    //--------------------------------------------------------------------------
    vm = VirtualMachineSaveDisk::vmpool->get(vm_id,true);

    if ( vm == 0 )
    {
        delete img_template;
        goto error_vm_get;
    }

    vm_owner = vm->get_uid();

    vm->unlock();

    //--------------------------------------------------------------------------
    // Authorize the operation
    //--------------------------------------------------------------------------
    if ( uid != 0 )
    {
        AuthRequest ar(uid);
        string t64;

        ar.add_auth(AuthRequest::VM,vm_id,AuthRequest::MANAGE,vm_owner,false);
        ar.add_auth(AuthRequest::IMAGE,
                    img_template->to_xml(t64),
                    AuthRequest::CREATE,
                    uid,
                    false);

        if (UserPool::authorize(ar) == -1)
        {
            goto error_authorize;
        }
    }

    //--------------------------------------------------------------------------
    // Create the image
    //--------------------------------------------------------------------------
    rc = VirtualMachineSaveDisk::ipool->allocate(uid,user_name,img_template,
            &iid,estr);

    if ( rc < 0 )
    {
        goto error_allocate;
    }

    oss << "Image " << img_name << " created to store disk.";

    NebulaLog::log("ReM",Log::INFO,oss);
    oss.str("");

    //--------------------------------------------------------------------------
    // Get the VM
    //--------------------------------------------------------------------------
    vm = VirtualMachineSaveDisk::vmpool->get(vm_id,true);

    if ( vm == 0 )
    {
        goto error_vm_get;
    }

    //--------------------------------------------------------------------------
    // Check if the disk has a persistent source image
    //--------------------------------------------------------------------------
    oss << "/VM/TEMPLATE/DISK[DISK_ID=" << disk_id << "]/IMAGE_ID";
    rc = vm->xpath(source_img_id, oss.str().c_str(), -1);
    oss.str("");

    if( rc == 0 ) //The disk was created from an Image
    {
        source_img = VirtualMachineSaveDisk::ipool->get(source_img_id, true);

        if( source_img != 0 ) //The Image still exists
        {
            source_img_persistent = source_img->isPersistent();
            source_img->unlock();

            if( source_img_persistent )
            {
                goto error_img_persistent;
            }
        }
    }

    //--------------------------------------------------------------------------
    // Store image id to save the disk in the VM template
    //--------------------------------------------------------------------------
    rc = vm->save_disk(disk_id, iid, error_str);

    if ( rc == -1 )
    {
        goto error_vm_get_disk_id;
    }

    VirtualMachineSaveDisk::vmpool->update(vm);

    vm->unlock();

    //--------------------------------------------------------------------------
    // Send results to client
    //--------------------------------------------------------------------------
    arrayData.push_back(xmlrpc_c::value_boolean(true));
    arrayData.push_back(xmlrpc_c::value_int(iid));

    arrayresult = new xmlrpc_c::value_array(arrayData);

    *retval = *arrayresult;

    delete arrayresult;

    return;

error_image_exists:
    oss << action_error(method_name, "CREATE", "IMAGE", -2, 0);
    oss << " Image " << img_name << " already exists in the repository.";
    goto error_common;

error_vm_get:
    oss.str(get_error(method_name, "VM", vm_id));
    goto error_common;

error_img_persistent:
    oss << action_error(method_name, "SAVEDISK", "DISK", disk_id, 0);
    oss << " Source IMAGE " << source_img_id << " is persistent.";
    vm->unlock();
    goto error_common;

error_vm_get_disk_id:
    oss.str(get_error(method_name, "DISK from VM", vm_id));
    oss << " " << error_str;
    oss << " Deleting Image " << img_name;
    imagem->delete_image(iid);
    vm->unlock();
    goto error_common;

error_user_get:
    oss.str(get_error(method_name, "USER", uid));
    goto error_common;

error_authenticate:
    oss.str(authenticate_error(method_name));
    goto error_common;

error_authorize:
    oss.str(authorization_error(method_name, "MANAGE", "VM/IMAGE", uid, vm_id));
    delete img_template;
    goto error_common;

error_allocate:
    oss << action_error(method_name, "CREATE", "IMAGE", -2, 0);
    oss << " " << estr;
    goto error_common;

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

