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

#include "RequestManagerImage.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void ImageEnable::request_execute(xmlrpc_c::paramList const& paramList,
                                  RequestAttributes& att)
{
    int     id          = xmlrpc_c::value_int(paramList.getInt(1));
    bool    enable_flag = xmlrpc_c::value_boolean(paramList.getBoolean(2));
    int     rc;

    string err_msg;

    Nebula&          nd     = Nebula::instance();
    ImageManager *   imagem = nd.get_imagem();

    if ( basic_authorization(id, att) == false )
    {
        return;
    }

    rc = imagem->enable_image(id,enable_flag, err_msg);

    if( rc < 0 )
    {
        if (enable_flag == true)
        {
            err_msg = "Could not enable image: " + err_msg;
        }
        else
        {
            err_msg = "Could not disable image: " + err_msg;
        }

        failure_response(INTERNAL, request_error(err_msg,""), att);
        return;
    }

    success_response(id, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void ImagePersistent::request_execute(xmlrpc_c::paramList const& paramList,
                                      RequestAttributes& att)
{
    int     id              = xmlrpc_c::value_int(paramList.getInt(1));
    bool    persistent_flag = xmlrpc_c::value_boolean(paramList.getBoolean(2));
    int     rc;

    Image * image;
    string  err_msg;

    if ( basic_authorization(id, att) == false )
    {
        return;
    }

    image = static_cast<Image *>(pool->get(id,true));

    if ( image == 0 )
    {
        failure_response(NO_EXISTS,
                get_error(object_name(auth_object),id),
                att);

        return;
    }

    switch (image->get_type())
    {
        case Image::OS:
        case Image::DATABLOCK:
        case Image::CDROM:
        break;

        case Image::KERNEL:
        case Image::RAMDISK:
        case Image::CONTEXT:
            failure_response(ACTION,
                request_error("KERNEL, RAMDISK and CONTEXT files must be "
                "non-persistent",""), att);
            image->unlock();
        return;
    }

    rc = image->persistent(persistent_flag, err_msg);

    if ( rc != 0  )
    {
        if (persistent_flag == true)
        {
            err_msg = "Could not make image persistent: " + err_msg;
        }
        else
        {
            err_msg = "Could not make image non-persistent: " + err_msg;
        }

        failure_response(INTERNAL,request_error(err_msg,""), att);

        image->unlock();
        return;
    }

    pool->update(image);

    image->unlock();

    success_response(id, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void ImageChangeType::request_execute(xmlrpc_c::paramList const& paramList,
                                      RequestAttributes& att)
{
    int     id   = xmlrpc_c::value_int(paramList.getInt(1));
    string  type = xmlrpc_c::value_string(paramList.getString(2));
    int     rc;

    Image::ImageType itype;

    Image * image;
    string  err_msg;

    if ( basic_authorization(id, att) == false )
    {
        return;
    }

    image = static_cast<Image *>(pool->get(id,true));

    if ( image == 0 )
    {
        failure_response(NO_EXISTS,
                get_error(object_name(auth_object),id),
                att);

        return;
    }

    itype = Image::str_to_type(type);

    switch (image->get_type())
    {
        case Image::OS:
        case Image::DATABLOCK:
        case Image::CDROM:
            if ((itype != Image::OS) &&
                (itype != Image::DATABLOCK)&&
                (itype != Image::CDROM) )
            {
                failure_response(ACTION,
                    request_error("Cannot change image type to an incompatible"
                        " type for the current datastore.",""),
                    att);

                image->unlock();
                return;
            }
        break;

        case Image::KERNEL:
        case Image::RAMDISK:
        case Image::CONTEXT:
            if ((itype != Image::KERNEL) &&
                (itype != Image::RAMDISK)&&
                (itype != Image::CONTEXT) )
            {
                failure_response(ACTION,
                    request_error("Cannot change image type to an incompatible"
                        " type for the current datastore.",""),
                    att);

                image->unlock();
                return;
            }
        break;
    }

    rc = image->set_type(type, err_msg);

    if ( rc != 0  )
    {
        failure_response(INTERNAL,request_error(err_msg,""), att);

        image->unlock();
        return;
    }

    pool->update(image);

    image->unlock();

    success_response(id, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ImageClone::request_execute(
        xmlrpc_c::paramList const&  paramList,
        RequestAttributes&          att)
{
    int    clone_id = xmlrpc_c::value_int(paramList.getInt(1));
    string name     = xmlrpc_c::value_string(paramList.getString(2));

    long long       avail, size;
    int             rc, new_id, ds_id_orig, ds_id = -1;
    string          error_str, ds_name, ds_data, ds_mad;
    bool            ds_check;

    Image::DiskType disk_type;
    PoolObjectAuth  perms, ds_perms, ds_perms_orig;

    ImageTemplate * tmpl;
    Template        img_usage;
    Image *         img;
    Datastore *     ds;

    Nebula&  nd = Nebula::instance();

    DatastorePool * dspool = nd.get_dspool();
    ImagePool *     ipool  = static_cast<ImagePool *>(pool);

    if (paramList.size() > 3)
    {
        ds_id = xmlrpc_c::value_int(paramList.getInt(3));
    }

    // ------------------------- Get source Image info -------------------------

    img = ipool->get(clone_id, true);

    if ( img == 0 )
    {
        failure_response(NO_EXISTS,
                get_error(object_name(auth_object), clone_id),
                att);

        return;
    }

    switch (img->get_type())
    {
        case Image::OS:
        case Image::DATABLOCK:
        case Image::CDROM:
        break;

        case Image::KERNEL:
        case Image::RAMDISK:
        case Image::CONTEXT:
            failure_response(ACTION,
                allocate_error("KERNEL, RAMDISK and CONTEXT files cannot be "
                    "cloned."), att);
            img->unlock();
        return;
    }

    const Snapshots& snaps = img->get_snapshots();

    if (snaps.size () > 0)
    {
        failure_response(ACTION,
                request_error("Cannot clone images with snapshots",""), att);
        img->unlock();
        return;
    }

    tmpl = img->clone_template(name);

    img->get_permissions(perms);

    if (ds_id == -1) //Target Datastore not set, use the current one
    {
        ds_id = img->get_ds_id();
    }

    ds_id_orig = img->get_ds_id();

    size = img->get_size();

    img->unlock();

    // ----------------------- Get target Datastore info -----------------------

    ds = dspool->get(ds_id, true);

    if ( ds == 0 )
    {
        failure_response(NO_EXISTS,
                get_error(object_name(PoolObjectSQL::DATASTORE), ds_id),
                att);

        delete tmpl;
        return;
    }

    if ( ds->get_type() != Datastore::IMAGE_DS )
    {
        failure_response(ACTION,
            request_error("Clone only supported for IMAGE_DS Datastores",""),att);

        ds->unlock();

        delete tmpl;
        return;
    }

    ds->get_permissions(ds_perms);

    disk_type = ds->get_disk_type();

    ds->to_xml(ds_data);

    ds_check = ds->get_avail_mb(avail);
    ds_name  = ds->get_name();
    ds_mad   = ds->get_ds_mad();

    ds->unlock();

    if (ds_id != ds_id_orig) //check same DS_MAD
    {
        ds = dspool->get(ds_id_orig, true);

        if (ds == 0)
        {
            failure_response(NO_EXISTS,
                get_error(object_name(PoolObjectSQL::DATASTORE),ds_id_orig),att);

            delete tmpl;
            return;
        }

        if (ds->get_type() != Datastore::IMAGE_DS)
        {
            failure_response(ACTION, request_error(
                "Clone only supported for IMAGE_DS Datastores",""), att);

            ds->unlock();

            delete tmpl;
            return;
        }

        if (ds->get_ds_mad() != ds_mad)
        {
            failure_response(ACTION, request_error(
                "Clone only supported to same DS_MAD Datastores",""), att);

            ds->unlock();

            delete tmpl;
            return;
        }

        ds->get_permissions(ds_perms_orig);

        ds->unlock();
    }

    // ------------- Set authorization request ---------------------------------

    img_usage.add("DATASTORE", ds_id);
    img_usage.add("SIZE", size);

    if (ds_check && (size > avail))
    {
        failure_response(ACTION,
            request_error("Not enough space in datastore",""), att);

        delete tmpl;
        return;
    }

    if ( att.uid != 0 )
    {
        AuthRequest ar(att.uid, att.group_ids);
        string      tmpl_str;

        // ------------------ Check permissions and ACLs  ----------------------

        tmpl->to_xml(tmpl_str);

        ar.add_create_auth(att.uid, att.gid, auth_object, tmpl_str); // CREATE IMAGE

        ar.add_auth(AuthRequest::USE, ds_perms); // USE DATASTORE

        if (ds_id != ds_id_orig) // USE (original) DATASTORE
        {
            ar.add_auth(AuthRequest::USE, ds_perms_orig); // USE DATASTORE
        }

        if (UserPool::authorize(ar) == -1)
        {
            failure_response(AUTHORIZATION,
                    authorization_error(ar.message, att),
                    att);

            delete tmpl;
            return;
        }

        // -------------------------- Check Quotas  ----------------------------

        if ( quota_authorization(&img_usage, Quotas::DATASTORE, att) == false )
        {
            delete tmpl;
            return;
        }
    }

    rc = ipool->allocate(att.uid,
                         att.gid,
                         att.uname,
                         att.gname,
                         att.umask,
                         tmpl,
                         ds_id,
                         ds_name,
                         disk_type,
                         ds_data,
                         Datastore::IMAGE_DS,
                         clone_id,
                         &new_id,
                         error_str);
    if ( rc < 0 )
    {
        quota_rollback(&img_usage, Quotas::DATASTORE, att);

        failure_response(INTERNAL, allocate_error(error_str), att);
        return;
    }

    ds = dspool->get(ds_id, true);

    if ( ds != 0 )  // TODO: error otherwise or leave image in ERROR?
    {
        ds->add_image(new_id);

        dspool->update(ds);

        ds->unlock();
    }

    success_response(new_id, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void ImageSnapshotDelete::request_execute(xmlrpc_c::paramList const& paramList,
                                  RequestAttributes& att)
{
    int id      = xmlrpc_c::value_int(paramList.getInt(1));
    int snap_id = xmlrpc_c::value_int(paramList.getInt(2));

    Nebula&        nd     = Nebula::instance();
    ImageManager * imagem = nd.get_imagem();

    if ( basic_authorization(id, att) == false )
    {
        return;
    }

    string err_msg;
    int    rc = imagem->delete_snapshot(id, snap_id, err_msg);

    if ( rc < 0 )
    {
        failure_response(ACTION, request_error(err_msg, ""), att);
        return;
    }

    success_response(id, att);
}

