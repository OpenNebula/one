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

#include "RequestManagerImage.h"
#include "ImageManager.h"
#include "DatastorePool.h"

using namespace std;

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void ImageEnable::request_execute(xmlrpc_c::paramList const& paramList,
                                  RequestAttributes& att)
{
    int     id          = xmlrpc_c::value_int(paramList.getInt(1));
    bool    enable_flag = xmlrpc_c::value_boolean(paramList.getBoolean(2));
    int     rc;

    Nebula&          nd     = Nebula::instance();
    ImageManager *   imagem = nd.get_imagem();

    if ( basic_authorization(id, att) == false )
    {
        return;
    }

    rc = imagem->enable_image(id, enable_flag, att.resp_msg);

    if( rc < 0 )
    {
        if (enable_flag == true)
        {
            att.resp_msg = "Could not enable image: " + att.resp_msg;
        }
        else
        {
            att.resp_msg = "Could not disable image: " + att.resp_msg;
        }

        failure_response(INTERNAL, att);
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

    ErrorCode ec = request_execute(id, persistent_flag, att);

    if ( ec == SUCCESS )
    {
        success_response(id, att);
    }
    else
    {
        failure_response(ec, att);
    }
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

Request::ErrorCode ImagePersistent::request_execute(
        int     id,
        bool    persistent_flag,
        RequestAttributes& att)
{
    int     rc;

    int ds_id;
    int ds_persistent_only;

    Nebula&  nd = Nebula::instance();
    ImagePool *     ipool  = nd.get_ipool();
    DatastorePool * dspool = nd.get_dspool();

    ErrorCode ec;

    ec = basic_authorization(ipool, id, PoolObjectSQL::IMAGE, att);

    if ( ec != SUCCESS)
    {
        return ec;
    }

    if ( auto image = ipool->get_ro(id) )
    {
        ds_id = image->get_ds_id();
    }
    else
    {
        att.resp_id = id;

        return NO_EXISTS;
    }

    if (auto ds = dspool->get_ro(ds_id))
    {
        ds_persistent_only = ds->is_persistent_only();
    }
    else
    {
        att.resp_msg = "Datastore no longer exists.";

        return INTERNAL;
    }

    auto image = ipool->get(id);

    if ( image == nullptr )
    {
        att.resp_id = id;

        return NO_EXISTS;
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
            att.resp_msg = "KERNEL, RAMDISK and CONTEXT must be non-persistent";
            return ACTION;

        case Image::BACKUP:
            att.resp_msg = "BACKUP images must be persistent";
            return ACTION;
    }

    /* Check if datastore allows the operation */
    if ( ds_persistent_only && persistent_flag == false )
    {
        att.resp_msg = "This Datastore only accepts persistent images.";

        return INTERNAL;
    }

    rc = image->persistent(persistent_flag, att.resp_msg);

    if ( rc != 0  )
    {
        if (persistent_flag == true)
        {
            att.resp_msg = "Could not make image persistent: " + att.resp_msg;
        }
        else
        {
            att.resp_msg = "Could not make image non-persistent: " + att.resp_msg;
        }

        return INTERNAL;
    }

    ipool->update(image.get());

    return SUCCESS;
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

    if ( basic_authorization(id, att) == false )
    {
        return;
    }

    auto image = pool->get<Image>(id);

    if ( image == nullptr )
    {
        att.resp_id = id;
        failure_response(NO_EXISTS, att);
        return;
    }

    itype = Image::str_to_type(type);

    switch (image->get_type())
    {
        case Image::OS:
        case Image::DATABLOCK:
        case Image::CDROM:
            if ((itype != Image::OS) && (itype != Image::DATABLOCK)&&
                (itype != Image::CDROM))
            {
                att.resp_msg = "Cannot change image type to an incompatible type"
                               " for the current datastore.";
                failure_response(ACTION, att);

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
                att.resp_msg = "Cannot change image type to an incompatible type"
                               " for the current datastore.";
                failure_response(ACTION, att);

                return;
            }
            break;
        case Image::BACKUP:
            att.resp_msg = "Cannot change type for BACKUP images.";
            failure_response(ACTION, att);

            return;
    }

    rc = image->set_type(type, att.resp_msg);

    if ( rc != 0  )
    {
        failure_response(INTERNAL, att);

        return;
    }

    pool->update(image.get());

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

    int new_id;

    int ds_id = -1;

    if (paramList.size() > 3)
    {
        ds_id = xmlrpc_c::value_int(paramList.getInt(3));
    }

    ErrorCode ec = request_execute(clone_id, name, ds_id, false, new_id, att);

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

Request::ErrorCode ImageClone::request_execute(
        int             clone_id,
        const string&   name,
        int             ds_id,
        bool            persistent,
        int             &new_id,
        RequestAttributes& att)
{
    long long       avail, size;
    int             rc, ds_id_orig;
    string          ds_name, ds_data, ds_mad, tm_mad;
    bool            ds_check;

    Image::DiskType disk_type;
    PoolObjectAuth  perms, ds_perms, ds_perms_orig;

    unique_ptr<ImageTemplate> tmpl;
    Template        img_usage;

    Nebula&  nd = Nebula::instance();

    DatastorePool * dspool = nd.get_dspool();
    ImagePool *     ipool  = nd.get_ipool();

    // ------------------------- Get source Image info -------------------------
    if ( auto img = ipool->get_ro(clone_id) )
    {
        switch (img->get_type())
        {
            case Image::OS:
            case Image::DATABLOCK:
            case Image::CDROM:
                break;

            case Image::KERNEL:
            case Image::RAMDISK:
            case Image::CONTEXT:
            case Image::BACKUP:
                att.resp_msg = "KERNEL, RAMDISK, BACKUP and CONTEXT cannot be cloned.";
                return ACTION;
        }

        const Snapshots& snaps = img->get_snapshots();

        if (snaps.size () > 0)
        {
            att.resp_msg = "Cannot clone images with snapshots";
            return ACTION;
        }

        tmpl = img->clone_template(name);

        img->get_permissions(perms);

        if (ds_id == -1) //Target Datastore not set, use the current one
        {
            ds_id = img->get_ds_id();
        }

        ds_id_orig = img->get_ds_id();

        size = img->get_size();
    }
    else
    {
        att.resp_id = clone_id;
        return NO_EXISTS;
    }

    //--------------------------------------------------------------------------
    // Set image persistent attribute
    //--------------------------------------------------------------------------
    if ( persistent )
    {
        tmpl->replace("PERSISTENT", persistent);
    }
    else //Update from base image
    {
        Image::test_set_persistent(tmpl.get(), att.uid, att.gid, false);
    }

    // ----------------------- Get target Datastore info -----------------------

    if ( auto ds = dspool->get_ro(ds_id) )
    {
        if ( ds->get_type() != Datastore::IMAGE_DS )
        {
            att.resp_msg = "Clone only supported for IMAGE_DS Datastores";

            return ACTION;
        }

        ds->get_permissions(ds_perms);

        disk_type = ds->get_disk_type();

        ds->to_xml(ds_data);

        ds_check = ds->get_avail_mb(avail);
        ds_name  = ds->get_name();
        ds_mad   = ds->get_ds_mad();
        tm_mad   = ds->get_tm_mad();
    }
    else
    {
        att.resp_obj = PoolObjectSQL::DATASTORE;
        att.resp_id  = ds_id;

        return NO_EXISTS;
    }

    if (ds_id != ds_id_orig) //check same DS_MAD
    {
        auto ds = dspool->get_ro(ds_id_orig);

        if (ds == nullptr)
        {
            att.resp_obj = PoolObjectSQL::DATASTORE;
            att.resp_id  = ds_id_orig;

            return NO_EXISTS;
        }

        if (ds->get_type() != Datastore::IMAGE_DS)
        {
            att.resp_msg = "Clone only supported for IMAGE_DS Datastores";

            return ACTION;
        }

        if (ds->get_ds_mad() != ds_mad)
        {
            att.resp_msg = "Clone only supported to same DS_MAD Datastores";

            return ACTION;
        }

        ds->get_permissions(ds_perms_orig);
    }

    // ------------- Set authorization request ---------------------------------

    img_usage.add("DATASTORE", ds_id);
    img_usage.add("SIZE", size);

    if (ds_check && (size > avail))
    {
        att.resp_msg = "Not enough space in datastore";

        return ACTION;
    }

    AuthRequest ar(att.uid, att.group_ids);
    string      tmpl_str;

    // ------------------ Check permissions and ACLs  ----------------------
    // Create image
    // Use original image
    // Use target datastore
    // Use original datastore, if different
    // ---------------------------------------------------------------------
    tmpl->to_xml(tmpl_str);

    ar.add_create_auth(att.uid, att.gid, PoolObjectSQL::IMAGE, tmpl_str);

    ar.add_auth(AuthRequest::USE, perms);

    ar.add_auth(AuthRequest::USE, ds_perms);

    if (ds_id != ds_id_orig)
    {
        ar.add_auth(AuthRequest::USE, ds_perms_orig);
    }

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;

        return AUTHORIZATION;
    }

    // -------------------------- Check Quotas  ----------------------------

    if ( quota_authorization(&img_usage, Quotas::DATASTORE, att,
                             att.resp_msg) == false )
    {
        return AUTHORIZATION;
    }

    rc = ipool->allocate(att.uid,
                         att.gid,
                         att.uname,
                         att.gname,
                         att.umask,
                         move(tmpl),
                         ds_id,
                         ds_name,
                         disk_type,
                         ds_data,
                         Datastore::IMAGE_DS,
                         ds_mad,
                         tm_mad,
                         "",
                         clone_id,
                         &new_id,
                         att.resp_msg);
    if ( rc < 0 )
    {
        quota_rollback(&img_usage, Quotas::DATASTORE, att);

        return ALLOCATE;
    }

    if ( auto ds = dspool->get(ds_id) )  // TODO: error otherwise or leave image in ERROR?
    {
        ds->add_image(new_id);

        dspool->update(ds.get());
    }

    return SUCCESS;
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

    int rc = imagem->delete_snapshot(id, snap_id, att.resp_msg);

    if ( rc < 0 )
    {
        failure_response(ACTION, att);
        return;
    }

    success_response(snap_id, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void ImageSnapshotRevert::request_execute(xmlrpc_c::paramList const& paramList,
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

    int rc = imagem->revert_snapshot(id, snap_id, att.resp_msg);

    if ( rc < 0 )
    {
        failure_response(ACTION, att);
        return;
    }

    success_response(snap_id, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void ImageSnapshotFlatten::request_execute(xmlrpc_c::paramList const& paramList,
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

    int rc = imagem->flatten_snapshot(id, snap_id, att.resp_msg);

    if ( rc < 0 )
    {
        failure_response(ACTION, att);
        return;
    }

    success_response(snap_id, att);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

void ImageRestore::request_execute(xmlrpc_c::paramList const& paramList,
                                   RequestAttributes& att)
{
    int image_id   = xmlrpc_c::value_int(paramList.getInt(1));
    int dst_ds_id  = xmlrpc_c::value_int(paramList.getInt(2));
    string opt_tmp = xmlrpc_c::value_string(paramList.getString(3));

    Nebula& nd = Nebula::instance();

    DatastorePool * dspool = nd.get_dspool();
    ImageManager *  imagem = nd.get_imagem();

    if ( basic_authorization(image_id, att) == false )
    {
        return;
    }

    ErrorCode ec = basic_authorization(dspool, dst_ds_id,
                                       PoolObjectSQL::DATASTORE, att);

    if ( ec != SUCCESS)
    {
        failure_response(ec, att);
        return;
    }

    Template tmpl;
    string   txml;

    int rc = tmpl.parse_str_or_xml(opt_tmp, att.resp_msg);

    if ( rc != 0 )
    {
        failure_response(INTERNAL, att);
        return;
    }

    tmpl.replace("USERNAME", att.uname);

    rc = imagem->restore_image(image_id, dst_ds_id, tmpl.to_xml(txml),
                               att.resp_msg);

    if ( rc < 0 )
    {
        failure_response(ACTION, att);
        return;
    }

    success_response(att.resp_msg, att);
}

