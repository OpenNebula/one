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

/* ************************************************************************** */
/* Image Pool                                                                 */
/* ************************************************************************** */

#include "ImagePool.h"
#include "Snapshots.h"
#include "AuthManager.h"
#include "Nebula.h"
#include "PoolObjectAuth.h"
#include "ImageManager.h"
#include "VirtualMachineDisk.h"
#include "DatastorePool.h"
#include "HookStateImage.h"
#include "HookManager.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
string ImagePool::_default_type;
string ImagePool::_default_dev_prefix;
string ImagePool::_default_cdrom_dev_prefix;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

ImagePool::ImagePool(
        SqlDB *                          db,
        const string&                    __default_type,
        const string&                    __default_dev_prefix,
        const string&                    __default_cdrom_dev_prefix,
        const vector<const SingleAttribute *>& restricted_attrs,
        const vector<const SingleAttribute *>& encrypted_attrs,
        const vector<const SingleAttribute *>& _inherit_attrs)
    : PoolSQL(db, one_db::image_table)
{
    // Init static defaults
    _default_type       = __default_type;
    _default_dev_prefix = __default_dev_prefix;

    _default_cdrom_dev_prefix = __default_cdrom_dev_prefix;

    // Init inherit attributes
    for (auto sattr : _inherit_attrs)
    {
        inherit_attrs.push_back(sattr->value());
    }

    // Set default type
    if (_default_type != "OS"       &&
        _default_type != "CDROM"    &&
        _default_type != "DATABLOCK" )
    {
        NebulaLog::log("IMG", Log::ERROR, "Bad default for type, setting OS");
        _default_type = "OS";
    }

    ImageTemplate::parse_restricted(restricted_attrs);

    ImageTemplate::parse_encrypted(encrypted_attrs);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImagePool::allocate (
        int                      uid,
        int                      gid,
        const string&            uname,
        const string&            gname,
        int                      umask,
        unique_ptr<ImageTemplate> img_template,
        int                      ds_id,
        const string&            ds_name,
        Image::DiskType          disk_type,
        const string&            ds_data,
        Datastore::DatastoreType ds_type,
        const string&            ds_mad,
        const string&            tm_mad,
        const string&            extra_data,
        int                      cloning_id,
        int *                    oid,
        string&                  error_str)
{
    Nebula&         nd     = Nebula::instance();
    ImageManager *  imagem = nd.get_imagem();

    Image *         img;
    string          name;
    string          type;
    ostringstream   oss;

    int db_oid;
    int rc;

    img = new Image(uid, gid, uname, gname, umask, move(img_template));

    // -------------------------------------------------------------------------
    // Check name & duplicates
    // -------------------------------------------------------------------------
    img->get_template_attribute("NAME", name);

    if ( !PoolObjectSQL::name_is_valid(name, error_str) )
    {
        goto error_name;
    }

    img->get_template_attribute("TYPE", type);

    switch (img->str_to_type(type))
    {
        case Image::OS:
        case Image::DATABLOCK:
        case Image::CDROM:
            if ( ds_type != Datastore::IMAGE_DS  )
            {
                goto error_types_missmatch_file;
            }
            break;

        case Image::KERNEL:
        case Image::RAMDISK:
        case Image::CONTEXT:
            if ( ds_type != Datastore::FILE_DS  )
            {
                goto error_types_missmatch_image;
            }
            break;

        case Image::BACKUP:
            if ( ds_type != Datastore::BACKUP_DS  )
            {
                goto error_types_missmatch_backup;
            }
            break;
    }

    db_oid = exist(name, uid);

    if( db_oid != -1 )
    {
        goto error_duplicated;
    }

    img->ds_name = ds_name;
    img->ds_id   = ds_id;

    img->disk_type = disk_type;

    if ( cloning_id != -1 )
    {
        if (imagem->can_clone_image(cloning_id, oss) == -1)
        {
            error_str = oss.str();
            goto error_clone_state;
        }

        img->set_cloning_id(cloning_id);
    }

    // ---------------------------------------------------------------------
    // Set TM_MAD to infer FSTYPE if needed
    // ---------------------------------------------------------------------
    img->replace_template_attribute("TM_MAD", tm_mad);

    // ---------------------------------------------------------------------
    // Insert the Object in the pool & Register the image in the repository
    // ---------------------------------------------------------------------
    *oid = PoolSQL::allocate(img, error_str);

    if ( *oid != -1 )
    {
        if (cloning_id == -1)
        {
            rc = imagem->register_image(*oid, ds_data, extra_data, error_str);
        }
        else
        {
            rc = imagem->clone_image(*oid, cloning_id, ds_data, extra_data,
                                     error_str);
        }

        if ( rc == -1 )
        {
            if ( auto image = get(*oid) )
            {
                string aux_str;

                drop(image.get(), aux_str);
            }

            *oid = -1;
            return -1;
        }

    }

    return *oid;

error_types_missmatch_file:
    error_str = "Only IMAGES of type KERNEL, RAMDISK and CONTEXT can be"
                " registered in a FILE_DS datastore";
    goto error_common;

error_types_missmatch_image:
    error_str = "IMAGES of type KERNEL, RAMDISK and CONTEXT cannot be registered"
                " in an IMAGE_DS datastore";
    goto error_common;

error_types_missmatch_backup:
    error_str = "IMAGES of type BACKUP can only be registered"
                " in an BACKUP_DS datastore";
    goto error_common;

error_duplicated:
    oss << "NAME is already taken by IMAGE " << db_oid << ".";
    error_str = oss.str();

    goto error_common;

error_name:
error_clone_state:
error_common:
    delete img;
    *oid = -1;

    return *oid;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImagePool::update(PoolObjectSQL * objsql)
{
    Image * image = dynamic_cast<Image *>(objsql);

    if ( image == nullptr )
    {
        return -1;
    }

    if ( HookStateImage::trigger(image) )
    {
        std::string event = HookStateImage::format_message(image);

        Nebula::instance().get_hm()->trigger_send_event(event);
    }

    image->set_prev_state();

    return image->update(db);
}


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImagePool::acquire_disk(int               vm_id,
                            VirtualMachineDisk * disk,
                            int               disk_id,
                            Image::ImageType& img_type,
                            string&           dev_prefix,
                            int               uid,
                            int&              image_id,
                            Snapshots **      snap,
                            bool              attach,
                            string&           error_str)
{
    string  source;
    unique_ptr<Image> img;
    int     rc  = 0;
    int     datastore_id;
    int     iid;

    ostringstream oss;

    Nebula&         nd      = Nebula::instance();
    ImageManager *  imagem  = nd.get_imagem();

    *snap = 0;

    if ( disk->vector_value("IMAGE_ID", iid) == 0 )
    {
        img = imagem->acquire_image(vm_id, iid, attach, error_str);

        if ( img == nullptr )
        {
            return -1;
        }
    }
    else if ( disk->vector_value("IMAGE", source) == 0 )
    {
        int uiid = disk->get_uid(uid);

        if ( uiid == -1)
        {
            oss << "User " << uid << " does not own an image with name: "
                << source << " . Set IMAGE_UNAME or IMAGE_UID of owner in DISK.";
            error_str =  oss.str();

            return -1;
        }

        img = imagem->acquire_image(vm_id, source, uiid, attach, error_str);

        if ( img == nullptr )
        {
            return -1;
        }

        iid = img->get_oid();
    }
    else //Not using the image repository (volatile DISK)
    {
        string type = disk->vector_value("TYPE");

        one_util::toupper(type);

        if ( type != "SWAP" && type != "FS" )
        {
            error_str = "Unknown disk type " + type;
            return -1;
        }

        long long size;

        rc = disk->vector_value("SIZE", size);

        if ( rc != 0 || size <= 0 )
        {
            error_str = "SIZE attribute must be a positive integer value.";
            return -1;
        }

        img_type   = Image::DATABLOCK;
        dev_prefix = disk->vector_value("DEV_PREFIX");

        if ( dev_prefix.empty() ) //DEV_PEFIX not in DISK, get default
        {
            dev_prefix = _default_dev_prefix;

            disk->replace("DEV_PREFIX", dev_prefix);
        }
    }

    if ( img != nullptr )
    {
        DatastorePool * ds_pool = nd.get_dspool();

        long long size = 0;
        bool has_size  = (disk->vector_value("SIZE", size) == 0);

        if (has_size && img->is_persistent() && size != img->get_size())
        {
            oss << "SIZE attribute is not supported for persistent image ["
                << img->get_oid() << "].";
            error_str = oss.str();

            img.reset();

            imagem->release_image(vm_id, iid, false);

            return -1;
        }

        if (has_size && img->get_type() == Image::CDROM && size != img->get_size())
        {
            oss << "SIZE attribute is not supported for CDROM image ["
                << img->get_oid() << "].";
            error_str = oss.str();

            img.reset();

            imagem->release_image(vm_id, iid, false);

            return -1;
        }

        if (has_size && size < img->get_size())
        {
            oss << "SIZE of " << size << "MB is less than the image ["
                << img->get_oid() << "] size of " << img->get_size() << "MB.";
            error_str = oss.str();

            img.reset();

            imagem->release_image(vm_id, iid, false);

            return -1;
        }

        iid = img->get_oid();
        img->disk_attribute(disk, img_type, dev_prefix, inherit_attrs);

        image_id     = img->get_oid();
        datastore_id = img->get_ds_id();

        if (img->snapshots.size() > 0)
        {
            *snap = new Snapshots(img->snapshots);
            (*snap)->set_disk_id(disk_id);
        }

        img.reset();

        if ( ds_pool->disk_attribute(datastore_id, disk) == -1 )
        {
            imagem->release_image(vm_id, iid, false);
            error_str = "Associated datastore for the image does not exist";

            delete *snap;
            *snap = 0;

            return -1;
        }
    }

    disk->replace("DISK_ID", disk_id);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ImagePool::disk_attribute(
        VirtualMachineDisk* disk,
        int                 disk_id,
        int                 uid)
{
    string  source;
    unique_ptr<Image> img;
    int     datastore_id;
    int     iid;

    string           dev_prefix;
    Image::ImageType img_type;

    Nebula&         nd      = Nebula::instance();
    DatastorePool * ds_pool = nd.get_dspool();

    if ( disk->vector_value("IMAGE_ID", iid) == 0 )
    {
        img = get_ro(iid);
    }
    else if ( disk->vector_value("IMAGE", source) == 0 )
    {
        int uiid = disk->get_uid(uid);

        if ( uiid != -1)
        {
            img = get_ro(source, uiid);
        }
    }

    if ( img != nullptr )
    {
        img->disk_attribute(disk, img_type, dev_prefix, inherit_attrs);

        datastore_id = img->get_ds_id();

        img.reset();

        ds_pool->disk_attribute(datastore_id, disk);
    }

    disk->replace("DISK_ID", disk_id);
}

