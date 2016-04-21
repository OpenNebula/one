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

    int    new_id;

    ErrorCode ec = clone(source_id, name, "", new_id, att);

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

Request::ErrorCode RequestManagerClone::clone(
        int             source_id,
        const string    &name,
        const string    &str_uattrs,
        int             &new_id,
        RequestAttributes& att)
{
    int rc;

    PoolObjectAuth  perms;

    Template *      tmpl;
    PoolObjectSQL * source_obj;

    source_obj = pool->get(source_id, true);

    if ( source_obj == 0 )
    {
        att.resp_id = source_id;
        return NO_EXISTS;
    }

    tmpl = clone_template(source_obj);

    source_obj->get_permissions(perms);

    source_obj->unlock();

    ErrorCode ec = merge(tmpl, str_uattrs, att);

    if (ec != SUCCESS)
    {
        delete tmpl;
        return ec;
    }

    tmpl->erase("NAME");
    tmpl->set(new SingleAttribute("NAME",name));

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

void VMTemplateClone::request_execute(
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

    ErrorCode ec = request_execute(source_id, name, recursive, "", new_id, att);

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

Request::ErrorCode VMTemplateClone::request_execute(
                int                 source_id,
                string              name,
                bool                recursive,
                const string        &str_uattrs,
                int                 &new_id,
                RequestAttributes   &att)
{
    VMTemplate *    vmtmpl;
    VMTemplatePool* tpool = static_cast<VMTemplatePool*>(pool);
    ErrorCode       ec;
    ostringstream   oss;

    vector<VectorAttribute *> disks;
    vector<int> new_img_ids;
    vector<int>::iterator i;

    RequestAttributes del_att(att);
    RequestAttributes img_att(att);
    img_att.resp_obj = PoolObjectSQL::IMAGE;

    ec = clone(source_id, name, str_uattrs, new_id, att);

    if ( ec != SUCCESS )
    {
        return ec;
    }

    if (recursive)
    {
        Nebula&    nd    = Nebula::instance();
        ImagePool* ipool = nd.get_ipool();

        int img_id;
        int new_img_id;

        vmtmpl = tpool->get(new_id, true);

        if (vmtmpl == 0)
        {
            att.resp_msg = object_name(PoolObjectSQL::TEMPLATE) +
                " was cloned, but it was deleted before the disks could also be cloned.";

            return ACTION;
        }

        vmtmpl->get_disks(disks);

        vmtmpl->unlock();

        int ndisk = 0;

        for (vector<VectorAttribute*>::iterator it = disks.begin(); it != disks.end(); it++)
        {
            if (ipool->get_image_id(*it, img_id, att.uid) == 0)
            {
                oss.str("");

                oss << name << "-disk-" << ndisk;

                ec = ImageClone::clone_img(img_id, oss.str(), -1, new_img_id, img_att);

                if ( ec == SUCCESS)
                {
                    ec = ImagePersistent::request_execute(new_img_id, true, img_att);

                    if (ec != SUCCESS)
                    {
                        NebulaLog::log("ReM", Log::ERROR, failure_message(ec, img_att));

                        att.resp_msg = "Failure while making the cloned "
                                    "images persistent. "+failure_message(ec, img_att);

                        ImageDelete::delete_img(img_id, img_att);

                        goto error_images;
                    }

                    (*it)->remove("IMAGE");
                    (*it)->remove("IMAGE_UNAME");
                    (*it)->remove("IMAGE_UID");

                    (*it)->replace("IMAGE_ID", new_img_id);

                    new_img_ids.push_back(new_img_id);
                }
                else
                {
                    NebulaLog::log("ReM", Log::ERROR, failure_message(ec, img_att));

                    att.resp_msg = "Failure while cloning the "
                                    "template images. "+failure_message(ec, img_att);

                    goto error_images;
                }
            }

            ndisk++;
        }

        vmtmpl = tpool->get(new_id, true);

        if (vmtmpl == 0)
        {
            att.resp_msg = "The template was cloned, but it was deleted "
                            "before the disks could also be cloned.";

            goto error_template;
        }

        vmtmpl->replace_disks(disks);

        tpool->update(vmtmpl);

        vmtmpl->unlock();
    }

    return SUCCESS;

error_images:
    ec = TemplateDelete::request_execute(new_id, false, del_att);

    if (ec != SUCCESS)
    {
        NebulaLog::log("ReM", Log::ERROR, failure_message(ec, del_att));
    }

    goto error_template;

error_template:

    for (i = new_img_ids.begin(); i != new_img_ids.end(); i++)
    {
        ec = ImageDelete::delete_img(*i, img_att);

        if (ec != SUCCESS)
        {
            NebulaLog::log("ReM", Log::ERROR, failure_message(ec, img_att));
        }
    }

    for (vector<VectorAttribute *>::iterator i = disks.begin() ;
            i != disks.end() ; i++)
    {
        delete *i;
    }

    return ACTION;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode VMTemplateClone::merge(
                Template *      tmpl,
                const string    &str_uattrs,
                RequestAttributes& att)
{
    return VMTemplateInstantiate::merge(tmpl, str_uattrs, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
