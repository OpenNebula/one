/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

    PoolObjectSQL * source_obj = pool->get(source_id, true);

    if ( source_obj == 0 )
    {
        att.resp_id = source_id;
        return NO_EXISTS;
    }

    Template * tmpl = clone_template(source_obj);

    source_obj->get_permissions(perms);

    source_obj->unlock();

    ErrorCode ec = merge(tmpl, s_uattr, att);

    if (ec != SUCCESS)
    {
        delete tmpl;
        return ec;
    }

    tmpl->erase("NAME");
    tmpl->set(new SingleAttribute("NAME", name));

    if ( att.uid != 0 )
    {
        string tmpl_str = "";

        AuthRequest ar(att.uid, att.group_ids);

        ar.add_auth(auth_op, perms); //USE OBJECT

        tmpl->to_xml(tmpl_str);

        ar.add_create_auth(att.uid, att.gid, auth_object, tmpl_str);

        if (UserPool::authorize(ar) == -1)
        {
            att.resp_msg = ar.message;

            delete tmpl;
            return AUTHORIZATION;
        }
    }

    rc = pool_allocate(source_id, tmpl, new_id, att);

    if ( rc < 0 )
    {
        return ALLOCATE;
    }

    return SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VMTemplateClone::clone(int source_id, const string &name,
        int &new_id, bool recursive, const string& s_uattr, RequestAttributes& att)
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
    ImagePersistent img_persistent;

	TemplateDelete tmpl_delete;

    Nebula&         nd    = Nebula::instance();
    ImagePool*      ipool = nd.get_ipool();
    VMTemplatePool* tpool = static_cast<VMTemplatePool*>(pool);

    vector<int> new_ids;

    int ndisk = 0;
    vector<VectorAttribute *> disks;
    vector<VectorAttribute *>::iterator it;

    RequestAttributes del_att(att);
    RequestAttributes img_att(att);
    img_att.resp_obj    = PoolObjectSQL::IMAGE;

    VMTemplate * vmtmpl = tpool->get(new_id, true);

    if (vmtmpl == 0)
    {
        att.resp_msg = "VM template was removed during clone operation";

        return ACTION;
    }

    vmtmpl->clone_disks(disks);

    vmtmpl->unlock();

    for (it = disks.begin(); it != disks.end(); it++)
    {
        int img_id;
        int new_img_id;

        if (ipool->get_image_id(*it, img_id, att.uid) == 0)
        {
            ostringstream oss;

            oss << name << "-disk-" << ndisk;

            ec = img_clone.request_execute(img_id,oss.str(),-1, new_img_id,img_att);

            if ( ec != SUCCESS)
            {
                NebulaLog::log("ReM", Log::ERROR, failure_message(ec, img_att));

                att.resp_msg = "Failed to clone images: " + img_att.resp_msg;

                goto error_images;
            }

            ec = img_persistent.request_execute(new_img_id, true, img_att);

            if (ec != SUCCESS)
            {
                NebulaLog::log("ReM", Log::ERROR, failure_message(ec, img_att));

                img_delete.request_execute(img_id, img_att);

                att.resp_msg = "Failed to clone images: " + img_att.resp_msg;

                goto error_images;
            }

            (*it)->remove("IMAGE");
            (*it)->remove("IMAGE_UNAME");
            (*it)->remove("IMAGE_UID");

            (*it)->replace("IMAGE_ID", new_img_id);

            new_ids.push_back(new_img_id);
        }

        ndisk++;
    }

    vmtmpl = tpool->get(new_id, true);

    if (vmtmpl == 0)
    {
        att.resp_msg = "VM template was removed during clone operation.";

        goto error_template;
    }

    vmtmpl->replace_disks(disks);

    tpool->update(vmtmpl);

    vmtmpl->unlock();

    return SUCCESS;

error_images:
    if (tmpl_delete.request_execute(new_id, false, att) != SUCCESS)
    {
        NebulaLog::log("ReM", Log::ERROR, failure_message(ec, del_att));
    }

    goto error_template;

error_template:
    for (vector<int>::iterator i = new_ids.begin(); i != new_ids.end(); i++)
    {
        if (img_delete.request_execute(*i, img_att) != SUCCESS)
        {
            NebulaLog::log("ReM", Log::ERROR, failure_message(ec, img_att));
        }
    }

    for (it = disks.begin(); it != disks.end() ; it++)
    {
        delete *it;
    }

    return ACTION;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

