/* -------------------------------------------------------------------------- */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                */
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

#include "ImageAPI.h"
#include "Nebula.h"
#include "DatastorePool.h"
#include "MarketPlacePool.h"
#include "MarketPlaceAppPool.h"
#include "ImageManager.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode ImageAPI::del_image(int oid,
                                       bool force,
                                       RequestAttributes& att)
{
    auto img = ipool->get(oid);

    if ( !img )
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    if (img->is_locked())
    {
        att.auth_op = AuthRequest::ADMIN;

        if (!force)
        {
            att.resp_id = oid;
            att.resp_msg = "Image locked, use --force flag to remove the image. "
                           "Force delete may leave some files on Datastore";

            return Request::INTERNAL;
        }
    }

    if (force)
    {
        img->replace_template_attribute("FORCE_DELETE", true);

        ipool->update(img.get());
    }

    //Save body before deleting for hooks.
    img->to_xml(att.extra_xml);

    img.reset();

    return delete_object(oid, false, att);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode ImageAPI::clone(int source_id,
                                   const std::string& name,
                                   int ds_id,
                                   bool persistent,
                                   int &new_id,
                                   RequestAttributes& att)
{
    long long       avail, size;
    int             ds_id_orig;
    string          ds_name, ds_data, ds_mad, tm_mad;
    bool            ds_check;

    Image::DiskType disk_type;
    PoolObjectAuth  perms, ds_perms, ds_perms_orig;

    unique_ptr<ImageTemplate> tmpl;
    Template        img_usage;

    DatastorePool*  dspool = Nebula::instance().get_dspool();

    att.auth_op = AuthRequest::USE;

    // ------------------------- Get source Image info -------------------------
    if ( auto img = ipool->get_ro(source_id) )
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
            case Image::FILESYSTEM:
                string type = img->type_to_str(img->get_type());
                att.resp_msg = type + " images cannot be cloned.";

                return Request::ACTION;
        }

        const Snapshots& snaps = img->get_snapshots();

        if (snaps.size () > 0)
        {
            att.resp_msg = "Cannot clone images with snapshots";

            return Request::ACTION;
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
        att.resp_id = source_id;

        return Request::NO_EXISTS;
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

            return Request::ACTION;
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

        return Request::NO_EXISTS;
    }

    if (ds_id != ds_id_orig) //check same DS_MAD
    {
        auto ds = dspool->get_ro(ds_id_orig);

        if (ds == nullptr)
        {
            att.resp_obj = PoolObjectSQL::DATASTORE;
            att.resp_id  = ds_id_orig;

            return Request::NO_EXISTS;
        }

        if (ds->get_type() != Datastore::IMAGE_DS)
        {
            att.resp_msg = "Clone only supported for IMAGE_DS Datastores";

            return Request::ACTION;
        }

        if (ds->get_ds_mad() != ds_mad)
        {
            att.resp_msg = "Clone only supported to same DS_MAD Datastores";

            return Request::ACTION;
        }

        ds->get_permissions(ds_perms_orig);
    }

    // ------------- Set authorization request ---------------------------------

    img_usage.add("DATASTORE", ds_id);
    img_usage.add("SIZE", size);

    if (ds_check && (size > avail))
    {
        att.resp_msg = "Not enough space in datastore";

        return Request::ACTION;
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

        return Request::AUTHORIZATION;
    }

    // -------------------------- Check Quotas  ----------------------------

    if ( !quota_authorization(&img_usage, Quotas::DATASTORE, att, att.resp_msg) )
    {
        return Request::AUTHORIZATION;
    }

    int rc = ipool->allocate(att.uid,
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
                             source_id,
                             &new_id,
                             att.resp_msg);

    if ( rc < 0 )
    {
        quota_rollback(&img_usage, Quotas::DATASTORE, att);

        return Request::ALLOCATE;
    }

    if ( auto ds = dspool->get(ds_id) )  // TODO: error otherwise or leave image in ERROR?
    {
        ds->add_image(new_id);

        dspool->update(ds.get());
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode ImageAPI::enable(int oid,
                                    bool enable_flag,
                                    RequestAttributes& att)
{
    ImageManager* imagem = Nebula::instance().get_imagem();

    if ( auto ec = basic_authorization(oid, att); ec != Request::SUCCESS )
    {
        return ec;
    }

    int rc = imagem->enable_image(oid, enable_flag, att.resp_msg);

    if( rc < 0 )
    {
        if (enable_flag)
        {
            att.resp_msg = "Could not enable image: " + att.resp_msg;
        }
        else
        {
            att.resp_msg = "Could not disable image: " + att.resp_msg;
        }

        return Request::INTERNAL;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode ImageAPI::persistent(int oid,
                                        bool persistent_flag,
                                        RequestAttributes& att)
{
    int ds_id;
    int ds_persistent_only;

    DatastorePool * dspool = Nebula::instance().get_dspool();

    if ( auto ec = basic_authorization(ipool, oid, PoolObjectSQL::IMAGE, att); ec != Request::SUCCESS)
    {
        return ec;
    }

    if ( auto image = ipool->get_ro(oid) )
    {
        ds_id = image->get_ds_id();

        if (persistent_flag == image->is_persistent())
        {
            return Request::SUCCESS;
        }
    }
    else
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    if (auto ds = dspool->get_ro(ds_id))
    {
        ds_persistent_only = ds->is_persistent_only();


        const string& ds_mad = ds->get_ds_mad();

        if ( one_util::icasecmp(ds_mad, "lvm") )
        {
            att.resp_msg = "lvm datastores doesn't support change of image persistency.";

            return Request::INTERNAL;
        }
    }
    else
    {
        att.resp_msg = "Datastore no longer exists.";

        return Request::INTERNAL;
    }

    auto image = ipool->get(oid);

    if ( !image )
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
    }

    switch (image->get_type())
    {
        case Image::OS:
        case Image::DATABLOCK:
        case Image::CDROM:
        case Image::FILESYSTEM:
            break;

        case Image::KERNEL:
        case Image::RAMDISK:
        case Image::CONTEXT:
            att.resp_msg = "KERNEL, RAMDISK and CONTEXT must be non-persistent";
            return Request::ACTION;

        case Image::BACKUP:
            att.resp_msg = "BACKUP images must be persistent";
            return Request::ACTION;
    }

    /* Check if datastore allows the operation */
    if ( ds_persistent_only && persistent_flag == false )
    {
        att.resp_msg = "This Datastore only accepts persistent images.";

        return Request::INTERNAL;
    }

    int rc = image->persistent(persistent_flag, att.resp_msg);

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

        return Request::INTERNAL;
    }

    ipool->update(image.get());

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode ImageAPI::change_type(int oid,
                                         string type,
                                         RequestAttributes& att)

{
    Image::ImageType itype;

    if ( auto ec = basic_authorization(oid, att); ec != Request::SUCCESS )
    {
        return ec;
    }

    auto image = ipool->get(oid);

    if ( !image )
    {
        att.resp_id = oid;

        return Request::NO_EXISTS;
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

                return Request::ACTION;
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

                return Request::ACTION;
            }
            break;
        case Image::BACKUP:
        case Image::FILESYSTEM:
            string ctype = image->type_to_str(image->get_type());
            att.resp_msg = "Cannot change type for" + ctype + " images.";

            return Request::ACTION;
    }

    int rc = image->set_type(type, att.resp_msg);

    if ( rc != 0  )
    {
        return Request::INTERNAL;
    }

    ipool->update(image.get());

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode ImageAPI::snapshot_delete(int oid,
                                             int snap_id,
                                             RequestAttributes& att)
{
    ImageManager* imagem = Nebula::instance().get_imagem();

    if ( auto ec = basic_authorization(oid, att); ec != Request::SUCCESS )
    {
        return ec;
    }

    int rc = imagem->delete_snapshot(oid, snap_id, att.resp_msg);

    if ( rc < 0 )
    {
        return Request::ACTION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode ImageAPI::snapshot_revert(int oid,
                                             int snap_id,
                                             RequestAttributes& att)
{
    ImageManager* imagem = Nebula::instance().get_imagem();

    if ( auto ec = basic_authorization(oid, att); ec != Request::SUCCESS )
    {
        return ec;
    }

    int rc = imagem->revert_snapshot(oid, snap_id, att.resp_msg);

    if ( rc < 0 )
    {
        return Request::ACTION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode ImageAPI::snapshot_flatten(int oid,
                                              int snap_id,
                                              RequestAttributes& att)
{
    ImageManager* imagem = Nebula::instance().get_imagem();

    if ( auto ec = basic_authorization(oid, att); ec != Request::SUCCESS )
    {
        return ec;
    }

    int rc = imagem->flatten_snapshot(oid, snap_id, att.resp_msg);

    if ( rc < 0 )
    {
        return Request::ACTION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Request::ErrorCode ImageAPI::restore(int oid,
                                     int ds_id,
                                     const std::string& opt_tmpl,
                                     RequestAttributes& att)
{
    Nebula& nd = Nebula::instance();

    DatastorePool * dspool = nd.get_dspool();
    ImageManager *  imagem = nd.get_imagem();

    att.auth_op = AuthRequest::USE;

    if ( auto ec = basic_authorization(oid, att); ec != Request::SUCCESS )
    {
        return Request::SUCCESS;
    }

    if ( auto ec = basic_authorization(dspool, ds_id, PoolObjectSQL::DATASTORE, att);
         ec != Request::SUCCESS)
    {
        return ec;
    }

    Template tmpl;
    string   txml;

    int rc = tmpl.parse_str_or_xml(opt_tmpl, att.resp_msg);

    if ( rc != 0 )
    {
        return Request::INTERNAL;
    }

    tmpl.replace("USERNAME", att.uname);

    rc = imagem->restore_image(oid, ds_id, tmpl.to_xml(txml), att.resp_msg);

    if ( rc < 0 )
    {
        return Request::ACTION;
    }

    return Request::SUCCESS;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImageAPI::drop(std::unique_ptr<PoolObjectSQL> object,
                    bool recursive,
                    RequestAttributes& att)
{
    Nebula&        nd     = Nebula::instance();
    ImageManager * imagem = nd.get_imagem();

    int oid = object->get_oid();

    object.reset();

    return imagem->delete_image(oid, att.resp_msg);
}

/* ------------------------------------------------------------------------- */
/* ------------------------------------------------------------------------- */

Request::ErrorCode ImageAllocateAPI::allocate(const std::string& str_tmpl,
                                              int ds_id,
                                              bool skip_capacity_check,
                                              int& oid,
                                              RequestAttributes& att)
{
    long long     size_mb;

    string size_str;
    string ds_data;
    string ds_driver;
    string ds_name;
    string ds_mad;
    string tm_mad;

    bool ds_persistent_only;
    bool ds_check;

    Datastore::DatastoreType ds_type;

    PoolObjectAuth ds_perms;

    if (skip_capacity_check && !att.is_admin())
    {
        skip_capacity_check = false;
    }

    Nebula& nd = Nebula::instance();

    DatastorePool * dspool = nd.get_dspool();
    ImageManager *  imagem = nd.get_imagem();

    MarketPlacePool *     marketpool = nd.get_marketpool();
    MarketPlaceAppPool *  apppool    = nd.get_apppool();

    Template img_usage;

    Image::DiskType ds_disk_type;

    int app_id;
    int market_id;

    long long avail;

    string extra_data = "";

    // ------------------------- Parse image template --------------------------

    auto tmpl = make_unique<ImageTemplate>();

    int rc = tmpl->parse_str_or_xml(str_tmpl, att.resp_msg);

    if ( rc != 0 )
    {
        return Request::INTERNAL;
    }

    // ------------------------- Check Datastore exists ------------------------
    if ( auto ds = dspool->get_ro(ds_id) )
    {
        ds_type = ds->get_type();

        if ( ds_type == Datastore::SYSTEM_DS || ds_type == Datastore::BACKUP_DS)
        {
            att.resp_msg = "New images can only be allocated in a files or image datastore.";

            return Request::ALLOCATE;
        }

        ds->get_permissions(ds_perms);

        ds_check = ds->get_avail_mb(avail) && !skip_capacity_check;
        ds_name = ds->get_name();
        ds_mad  = ds->get_ds_mad();
        tm_mad  = ds->get_tm_mad();

        ds_disk_type       = ds->get_disk_type();
        ds_persistent_only = ds->is_persistent_only();

        ds->get_template_attribute("DRIVER", ds_driver);

        ds->decrypt();

        ds->to_xml(ds_data);
    }
    else
    {
        att.resp_id  = ds_id;
        att.resp_obj = PoolObjectSQL::DATASTORE;

        return Request::NO_EXISTS;
    }


    // --------------- Get the SIZE for the Image, (DS driver) -----------------

    if ( tmpl->get("FROM_APP", app_id) )
    {
        // This image comes from a MarketPlaceApp. Get the Market info and
        // the size.
        if ( auto app = apppool->get_ro(app_id) )
        {
            app->to_template(tmpl.get());

            size_mb   = app->get_size();
            market_id = app->get_market_id();
        }
        else
        {
            att.resp_msg = "Cannot determine image SIZE.";

            return Request::INTERNAL;
        }

        if ( auto market = marketpool->get_ro(market_id) )
        {
            market->to_xml(extra_data);

            size_str = to_string(size_mb);

            //Do not use DRIVER from APP but from Datastore
            if (!ds_driver.empty() )
            {
                tmpl->erase("DRIVER");
            }
        }
        else
        {
            att.resp_msg = "Could not get the appliance's market.";

            return Request::INTERNAL;
        }
    }
    else
    {
        if ( tmpl->get("FROM_BACKUP_DS", app_id) )
        {
            string bck_ds_data;

            if ( auto ds = dspool->get_ro(app_id) )
            {
                ds->decrypt();

                ds->to_xml(bck_ds_data);
            }
            else
            {
                att.resp_msg = "Could not get associated backup datastore.";

                return Request::INTERNAL;
            }

            rc = imagem->stat_image(tmpl.get(), bck_ds_data, size_str);
        }
        else
        {
            rc = imagem->stat_image(tmpl.get(), ds_data, size_str);
        }

        if ( rc == -1 )
        {
            att.resp_msg = "Cannot parse image SIZE: " + size_str;

            return Request::INTERNAL;
        }

        istringstream iss;

        iss.str(size_str);
        iss >> size_mb;

        if ( iss.fail() )
        {
            att.resp_msg = "Cannot parse image SIZE: " + size_str;

            return Request::INTERNAL;
        }
    }

    if (ds_check && (size_mb > avail))
    {
        att.resp_msg = "Not enough space in datastore";

        return Request::ACTION;
    }

    tmpl->erase("SIZE");
    tmpl->add("SIZE", size_str);

    // ------------- Set authorization request for non-oneadmin's --------------

    img_usage.add("DATASTORE", ds_id);
    img_usage.add("SIZE", size_str);

    AuthRequest ar(att.uid, att.group_ids);
    string  tmpl_str;
    string  aname;

    // ------------ Check template for restricted attributes  --------------

    if (!att.is_admin())
    {
        if (tmpl->check_restricted(aname))
        {
            att.resp_msg = "Template includes a restricted attribute "+aname;

            return Request::AUTHORIZATION;
        }
    }

    // ------------------ Check permissions and ACLs  ----------------------
    tmpl->to_xml(tmpl_str);

    ar.add_create_auth(att.uid, att.gid, request.auth_object(), tmpl_str);

    ar.add_auth(AuthRequest::USE, ds_perms); // USE DATASTORE

    if (UserPool::authorize(ar) == -1)
    {
        att.resp_msg = ar.message;

        return Request::AUTHORIZATION;
    }

    // -------------------------- Check Quotas  ----------------------------

    if ( !quota_authorization(&img_usage, Quotas::DATASTORE, att, att.resp_msg) )
    {
        return Request::AUTHORIZATION;
    }

    // ------------------------- Check persistent only -------------------------

    bool persistent_attr = Image::test_set_persistent(tmpl.get(), att.uid, att.gid, true);

    if ( ds_persistent_only && !persistent_attr )
    {
        att.resp_msg = "This Datastore only accepts persistent images.";

        return Request::ALLOCATE;
    }

    // ------------------------- Allocate --------------------------------------

    rc = ipool->allocate(att.uid,
                         att.gid,
                         att.uname,
                         att.gname,
                         att.umask,
                         move(tmpl),
                         ds_id,
                         ds_name,
                         ds_disk_type,
                         ds_data,
                         ds_type,
                         ds_mad,
                         tm_mad,
                         extra_data,
                         -1,
                         &oid,
                         att.resp_msg);
    if ( rc < 0 )
    {
        quota_rollback(&img_usage, Quotas::DATASTORE, att);

        return Request::ALLOCATE;
    }

    if ( auto ds = dspool->get(ds_id) )  // TODO: error otherwise or leave image in ERROR?
    {
        ds->add_image(oid);

        dspool->update(ds.get());
    }

    // Take image body for Hooks
    if (auto img = ipool->get(oid))
    {
        img->to_xml(att.extra_xml);
    }

    att.resp_id = oid;

    return Request::SUCCESS;
}
