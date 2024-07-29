/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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

#include "RequestManagerClone.h"
#include "RequestManagerImage.h"
#include "RequestManagerDelete.h"
#include "RequestManagerVMTemplate.h"
#include "PoolObjectAuth.h"
#include "Nebula.h"
#include "VirtualMachineDisk.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void RequestManagerClone::request_execute(
        xmlrpc_c::paramList const&  paramList,
        RequestAttributes&          att)
{
    int    source_id = xmlrpc_c::value_int(paramList.getInt(1));
    string name      = xmlrpc_c::value_string(paramList.getString(2));
    bool   recursive = false;

    if (paramList.size() > 3)
    {
        recursive = xmlrpc_c::value_boolean(paramList.getBoolean(3));
    }

    int new_id;

    ErrorCode ec = clone(source_id, name, new_id, recursive, "", att);

    if ( ec == SUCCESS )
    {
        success_response(new_id, att);
    }
    else
    {
        failure_response(ec, att);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode RequestManagerClone::clone(int source_id, const string &name,
                                              int &new_id, bool recursive, const string& s_uattr, RequestAttributes& att)
{
    int rc;
    PoolObjectAuth perms;

    unique_ptr<Template> tmpl;

    if ( auto source_obj = pool->get_ro<PoolObjectSQL>(source_id) )
    {
        tmpl = clone_template(source_obj.get());

        source_obj->get_permissions(perms);
    }
    else
    {
        att.resp_id = source_id;
        return NO_EXISTS;
    }

    ErrorCode ec = merge(tmpl.get(), s_uattr, att);

    if (ec != SUCCESS)
    {
        return ec;
    }

    tmpl->erase("NAME");
    tmpl->set(new SingleAttribute("NAME", name));

    string tmpl_str = "";

    AuthRequest ar(att.uid, att.group_ids);

    ar.add_auth(att.auth_op, perms); //USE OBJECT

    tmpl->to_xml(tmpl_str);

    ar.add_create_auth(att.uid, att.gid, auth_object, tmpl_str);

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;

        return AUTHORIZATION;
    }

    rc = pool_allocate(source_id, move(tmpl), new_id, att);

    if ( rc < 0 )
    {
        return ALLOCATE;
    }

    return SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

const std::vector<const char*> VMTemplateClone::REMOVE_DISK_ATTRS =
{
    "IMAGE", "IMAGE_UNAME", "IMAGE_UID", "OPENNEBULA_MANAGED"
};

Request::ErrorCode VMTemplateClone::clone(int source_id, const string &name,
                                          int &new_id, bool recursive, const string& s_uattr, bool persistent,
                                          RequestAttributes& att)
{
    // -------------------------------------------------------------------------
    // Clone the VMTemplate
    // -------------------------------------------------------------------------
    ErrorCode ec;

    ec = RequestManagerClone::clone(source_id, name, new_id, false, s_uattr, att);

    if ( ec != SUCCESS )
    {
        return ec;
    }
    else if ( !recursive )
    {
        return SUCCESS;
    }

    // -------------------------------------------------------------------------
    // Clone the template images when recursive flag is set
    // -------------------------------------------------------------------------
    ImageDelete     img_delete;
    ImageClone      img_clone;

    TemplateDelete tmpl_delete;

    VMTemplatePool* tpool = static_cast<VMTemplatePool*>(pool);

    vector<int> new_ids;

    int ndisk = 0;
    vector<VectorAttribute *> vdisks;

    VirtualMachineDisks disks(false);

    RequestAttributes del_att(att);
    RequestAttributes img_att(att);
    img_att.resp_obj    = PoolObjectSQL::IMAGE;

    if ( auto vmtmpl = tpool->get_ro(new_id) )
    {
        vmtmpl->clone_disks(vdisks);
    }
    else
    {
        att.resp_msg = "VM template was removed during clone operation";

        return ACTION;
    }

    disks.init(vdisks, false);

    for ( auto disk : disks )
    {
        int img_id;
        int new_img_id;

        if ( disk->get_image_id(img_id, att.uid) == 0)
        {
            ostringstream oss;

            oss << name << "-disk-" << ndisk;

            ec = img_clone.request_execute(img_id, oss.str(), -1,
                                           persistent, new_img_id, img_att);

            if ( ec != SUCCESS)
            {
                NebulaLog::log("ReM", Log::ERROR, failure_message(ec, img_att));

                att.resp_msg = "Failed to clone images: " + img_att.resp_msg;

                goto error_images;
            }

            for (auto attr : REMOVE_DISK_ATTRS)
            {
                disk->remove(attr);
            }

            disk->replace("IMAGE_ID", new_img_id);

            new_ids.push_back(new_img_id);
        }

        ndisk++;
    }

    if ( auto vmtmpl = tpool->get(new_id) )
    {
        vmtmpl->replace_disks(vdisks);

        tpool->update(vmtmpl.get());
    }
    else
    {
        att.resp_msg = "VM template was removed during clone operation.";

        goto error_template;
    }


    return SUCCESS;

error_images:
    if (tmpl_delete.request_execute(new_id, false, att) != SUCCESS)
    {
        NebulaLog::log("ReM", Log::ERROR, failure_message(ec, del_att));
    }

    goto error_template;

error_template:
    for (auto id : new_ids)
    {
        if (img_delete.request_execute(id, img_att) != SUCCESS)
        {
            NebulaLog::log("ReM", Log::ERROR, failure_message(ec, img_att));
        }
    }

    for (auto disk : vdisks)
    {
        delete disk;
    }

    return ACTION;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

