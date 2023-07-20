/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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

#include "ImageManager.h"
#include "NebulaLog.h"
#include "ImagePool.h"
#include "SyncRequest.h"
#include "Template.h"
#include "Nebula.h"
#include "DatastorePool.h"
#include "VirtualMachinePool.h"

using namespace std;

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

unique_ptr<Image> ImageManager::acquire_image(int vm_id, int image_id,
        bool attach, string& error)
{
    int     rc;

    auto img = ipool->get(image_id);

    if (!img)
    {
        ostringstream oss;
        oss << "Image with ID: " << image_id  << " does not exist";

        error = oss.str();
        return nullptr;
    }

    rc = acquire_image(vm_id, img.get(), attach, error);

    if ( rc != 0 )
    {
        img.reset();
    }

    return img;
}

/* -------------------------------------------------------------------------- */

unique_ptr<Image> ImageManager::acquire_image(int vm_id, const string& name, int uid,
        bool attach, string& error)
{
    int     rc;

    auto img = ipool->get(name,uid);

    if (!img)
    {
        ostringstream oss;
        oss << "User " << uid << " does not own an image with name: " << name
            << " . Set IMAGE_UNAME or IMAGE_UID of owner in DISK.";

        error = oss.str();
        return nullptr;
    }

    rc = acquire_image(vm_id, img.get(), attach, error);

    if ( rc != 0 )
    {
        img.reset();
    }

    return img;
}

/* -------------------------------------------------------------------------- */

int ImageManager::acquire_image(int vm_id, Image *img, bool attach, string& error)
{
    int rc = 0;

    bool   shareable;
    string persistent_type;

    ostringstream oss;

    switch(img->get_type())
    {
        case Image::OS:
        case Image::DATABLOCK:
        case Image::CDROM:
            break;

        case Image::KERNEL:
        case Image::RAMDISK:
        case Image::CONTEXT:
        case Image::BACKUP:
            oss << "Image " << img->get_oid() << " (" << img->get_name() << ") "
                << "of type " << Image::type_to_str(img->get_type())
                << " cannot be used as DISK.";

            error = oss.str();
            return -1;
    }

    img->get_template_attribute("PERSISTENT_TYPE", persistent_type);

    shareable = one_util::icasecmp(persistent_type, "SHAREABLE");

    switch (img->get_state())
    {
        case Image::READY:
            img->inc_running(vm_id);

            if ( img->is_persistent() )
            {
                img->set_state(Image::USED_PERS);
            }
            else
            {
                img->set_state(Image::USED);
            }

            ipool->update(img);
        break;

        case Image::LOCKED:
            if (attach)
            {
                oss << "Cannot acquire image " << img->get_oid()
                    << ", it is locked";

                error = oss.str();
                rc    = -1;
            }
            else
            {
                img->inc_running(vm_id);

                if ( img->is_persistent() )
                {
                    img->set_state(Image::LOCKED_USED_PERS);
                }
                else
                {
                    img->set_state(Image::LOCKED_USED);
                }

                ipool->update(img);
            }
        break;

        case Image::USED_PERS:
            if (!shareable)
            {
                oss << "Cannot acquire image " << img->get_oid()
                    << ", it is persistent and already in use";

                error = oss.str();
                rc    = -1;
                break;
            }
            // Fallthrough
        case Image::USED:
            img->inc_running(vm_id);
            ipool->update(img);
        break;

        case Image::LOCKED_USED_PERS:
            if (!shareable)
            {
                oss << "Cannot acquire image " << img->get_oid()
                    << ", it is persistent and already in use";

                error = oss.str();
                rc    = -1;
                break;
            }
            // Fallthrough
        case Image::LOCKED_USED:
            if (attach)
            {
                oss << "Cannot acquire image " << img->get_oid()
                    << ", it is locked";

                error = oss.str();
                rc    = -1;
            }
            else
            {
                img->inc_running(vm_id);
                ipool->update(img);
            }
        break;

        case Image::INIT:
        case Image::DISABLED:
        case Image::ERROR:
        case Image::DELETE:
        case Image::CLONE:
           oss << "Cannot acquire image " << img->get_oid()
               <<", it is in state: " << Image::state_to_str(img->get_state());

           error = oss.str();
           rc    = -1;
        break;
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ImageManager::release_image(int vm_id, int iid, bool failed)
{
    ostringstream oss;

    auto img = ipool->get(iid);

    if (!img)
    {
        return;
    }

    switch(img->get_type())
    {
        case Image::OS:
        case Image::DATABLOCK:
        case Image::CDROM:
            break;

        case Image::KERNEL:
        case Image::RAMDISK:
        case Image::CONTEXT:
        case Image::BACKUP:
            NebulaLog::log("ImM", Log::ERROR, "Trying to release a KERNEL, "
                "RAMDISK, BACKUP or CONTEXT image");
            return;
    }

    switch (img->get_state())
    {
        case Image::USED_PERS:
            {
                int num_vms = img->dec_running(vm_id);

                if (failed)
                {
                    img->set_state(Image::ERROR);
                }
                else if (num_vms == 0)
                {
                    img->set_state(Image::READY);
                }

                ipool->update(img.get());
            }
        break;

        case Image::LOCKED_USED_PERS:
            {
                int num_vms = img->dec_running(vm_id);

                if (failed)
                {
                    img->set_state(Image::ERROR);
                }
                else if (num_vms == 0)
                {
                    img->set_state(Image::LOCKED);
                }

                ipool->update(img.get());
            }
        break;

        case Image::USED:
            if ( img->dec_running(vm_id) == 0  && img->get_cloning() == 0 )
            {
                img->set_state(Image::READY);
            }

            ipool->update(img.get());
        break;

        case Image::LOCKED_USED:
            if ( img->dec_running(vm_id) == 0  && img->get_cloning() == 0 )
            {
                img->set_state(Image::LOCKED);
            }

            ipool->update(img.get());
        break;

        case Image::LOCKED:
            oss << "Releasing image in wrong state: "
                << Image::state_to_str(img->get_state());

            NebulaLog::log("ImM", Log::ERROR, oss.str());
        break;

        case Image::CLONE:
        case Image::DELETE:
        case Image::INIT:
        case Image::DISABLED:
        case Image::READY:
        case Image::ERROR:
           oss << "Releasing image in wrong state: "
               << Image::state_to_str(img->get_state());

           NebulaLog::log("ImM", Log::ERROR, oss.str());
        break;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ImageManager::release_cloning_resource(
        int iid, PoolObjectSQL::ObjectType ot, int clone_oid)
{
    auto img = ipool->get(iid);

    if (!img)
    {
        return;
    }

    switch(img->get_type())
    {
        case Image::OS:
        case Image::DATABLOCK:
        case Image::CDROM:
            break;

        case Image::KERNEL:
        case Image::RAMDISK:
        case Image::CONTEXT:
        case Image::BACKUP:
            NebulaLog::log("ImM", Log::ERROR, "Trying to release a cloning "
                "KERNEL, RAMDISK, BACKUP or CONTEXT image");
            return;
    }

    switch (img->get_state())
    {
        case Image::USED:
        case Image::CLONE:
            if (img->dec_cloning(ot, clone_oid) == 0  && img->get_running() == 0)
            {
                img->set_state(Image::READY);
            }

            ipool->update(img.get());
            break;

        case Image::DELETE:
        case Image::INIT:
        case Image::DISABLED:
        case Image::READY:
        case Image::ERROR:
        case Image::USED_PERS:
        case Image::LOCKED:
        case Image::LOCKED_USED:
        case Image::LOCKED_USED_PERS:
            NebulaLog::log("ImM", Log::ERROR, "Release cloning image"
                " in wrong state");
            break;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImageManager::enable_image(int iid, bool to_enable, string& error_str)
{
    int rc = 0;

    ostringstream oss;

    auto img = ipool->get(iid);

    if (!img)
    {
        return -1;
    }

    if ( img->get_type() == Image::BACKUP )
    {
        error_str = "Backup images cannot be enabled or disabled.";
        return -1;
    }

    if ( to_enable == true )
    {
        switch (img->get_state())
        {
            case Image::DISABLED:
                img->set_state(Image::READY);
                ipool->update(img.get());
            break;
            case Image::ERROR:
                img->set_state_unlock();
                ipool->update(img.get());
            break;
            case Image::READY:
            break;
            default:
                oss << "Image cannot be in state "
                    << Image::state_to_str(img->get_state()) << ".";
                error_str = oss.str();

                rc = -1;
            break;
        }
    }
    else
    {
        switch (img->get_state())
        {
            case Image::READY:
            case Image::ERROR:
                img->set_state(Image::DISABLED);
                ipool->update(img.get());
            break;
            case Image::DISABLED:
            break;
            default:
                oss << "Image cannot be in state "
                    << Image::state_to_str(img->get_state()) << ".";
                error_str = oss.str();

                rc = -1;
            break;
        }
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImageManager::delete_image(int iid, string& error_str)
{
    string   source;
    string   img_tmpl;
    string   ds_data;

    int ds_id;
    int cloning_id = -1;
    int vm_saving_id = -1;

    bool cforget;

    ostringstream oss;

    if (auto img = ipool->get_ro(iid))
    {
        ds_id = img->get_ds_id();
    }
    else
    {
        error_str = "Image does not exist";
        return -1;
    }

    if (auto ds = dspool->get_ro(ds_id))
    {
        ds->decrypt();

        ds->to_xml(ds_data);

        cforget = ds->is_concurrent_forget();
    }
    else
    {
       error_str = "Datastore no longer exists cannot remove image";
       return -1;
    }

    auto img = ipool->get(iid);

    if (!img)
    {
        error_str = "Image does not exist";
        return -1;
    }

    // Check associted VM state for backups. Note VM can no longer exist
    // Fai if VM is in BACKUP and INCREMENT mode or FULL with no CONCURRENT_FORGET
    if ( img->get_type() == Image::BACKUP )
    {
        auto ids   = img->get_running_ids();
        auto first = ids.cbegin();

        if (first != ids.cend())
        {
            VirtualMachinePool* vmpool = Nebula::instance().get_vmpool();

            if (auto vm = vmpool->get_ro(*first))
            {
                auto lstate = vm->get_lcm_state();
                auto bmode  = vm->backups().mode();

                if (vm->backups().active_flatten() ||
                     ((lstate == VirtualMachine::BACKUP ||
                        lstate == VirtualMachine::BACKUP_POWEROFF) &&
                        (bmode == Backups::INCREMENT || !cforget)))
                {
                    error_str = "Active backup on the associated VM. Wait till "
                        "it finish to delete the backup Image";
                    return -1;
                }
            }
        }
    }

    switch (img->get_state())
    {
        case Image::READY:
            if ( img->get_running() != 0 && img->get_type() != Image::BACKUP)
            {
                oss << "There are " << img->get_running() << " VMs using it.";
                error_str = oss.str();

                return -1; //Cannot remove images in use
            }
        break;

        case Image::CLONE:
            oss << "There are " << img->get_cloning() << " active clone operations.";
            error_str = oss.str();

            return -1; //Cannot remove images in use

        case Image::USED:
        case Image::USED_PERS:
        case Image::LOCKED_USED:
        case Image::LOCKED_USED_PERS:
            oss << "There are " << img->get_running() << " VMs using it.";
            error_str = oss.str();

            return -1; //Cannot remove images in use

        case Image::INIT:
        case Image::DISABLED:
        case Image::ERROR:
        case Image::DELETE:
        break;

        case Image::LOCKED:
            cloning_id = img->get_cloning_id();

            if ( img->is_saving() )
            {
                img->get_template_attribute("SAVED_VM_ID", vm_saving_id);
            }
        break;

    }

    /* ------------------- Send RM operation request to the DS -------------- */

    const auto* imd = get();

    if ( imd == nullptr )
    {
        error_str = "Error getting ImageManagerDriver";

        return -1;
    }

    source  = img->get_source();

    if (source.empty())
    {
        string err_str;
        int    rc;

        rc = ipool->drop(img.get(), err_str);

        if ( rc < 0 )
        {
            NebulaLog::log("ImM",Log::ERROR,
                "Image could not be removed from DB");

            return -1;
        }

        int uid = img->get_uid();
        int gid = img->get_gid();
        long long size = img->get_size() + img->get_snapshots().total_size();

        img.reset();

        Quotas::ds_del(uid, gid, ds_id, size);

        // Remove Image reference from Datastore
        if ( auto ds = dspool->get(ds_id) )
        {
            ds->del_image(iid);
            dspool->update(ds.get());
        }
    }
    else
    {
        string drv_msg(format_message(img->to_xml(img_tmpl), ds_data, ""));

        image_msg_t msg(ImageManagerMessages::RM, "", iid, drv_msg);

        imd->write(msg);

        img->set_state(Image::DELETE);

        img->clear_cloning_id();

        ipool->update(img.get());

        img.reset();
    }

    /* --------------- Update cloning image if needed ----------------------- */

    if ( cloning_id != -1 )
    {
        release_cloning_image(cloning_id, iid);
    }

    /* --------------- Release VM in hotplug -------------------------------- */

    // This is only needed if the image is deleted before the mkfs action
    // is completed

    if ( vm_saving_id != -1 )
    {
        VirtualMachinePool* vmpool = Nebula::instance().get_vmpool();

        if (auto vm = vmpool->get(vm_saving_id))
        {
            vm->clear_saveas_state();

            vm->clear_saveas_disk();

            vmpool->update(vm.get());
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImageManager::can_clone_image(int cloning_id, ostringstream&  oss_error)
{
    auto img = ipool->get_ro(cloning_id);

    if (!img)
    {
        oss_error << "Cannot clone image, it does not exist";
        return -1;
    }

    if (img->get_type() == Image::BACKUP)
    {
        oss_error << "Cannoe clone backup images";
        return -1;
    }

    Image::ImageState state = img->get_state();

    switch(state)
    {
        case Image::USED_PERS:
        case Image::INIT:
        case Image::DISABLED:
        case Image::ERROR:
        case Image::DELETE:
        case Image::LOCKED:
        case Image::LOCKED_USED:
        case Image::LOCKED_USED_PERS:
            oss_error << "Cannot clone image in state: "
                << Image::state_to_str(state);

            return -1;
        break;

        case Image::CLONE:
        case Image::READY:
        case Image::USED:
        default:
            return 0;
        break;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImageManager::set_clone_state(
        PoolObjectSQL::ObjectType ot, int new_id, int cloning_id, string& error)
{
    int  rc  = 0;
    auto img = ipool->get(cloning_id);

    if (!img)
    {
        error = "Cannot clone image, it does not exist";
        return -1;
    }

    if (img->get_type() == Image::BACKUP)
    {
        error = "Cannoe clone backup images";
        return -1;
    }

    switch(img->get_state())
    {
        case Image::READY:
            img->inc_cloning(ot, new_id);

            if (img->is_persistent())
            {
                img->set_state(Image::CLONE);
            }
            else
            {
                img->set_state(Image::USED);
            }

            ipool->update(img.get());
            break;

        case Image::USED:
        case Image::CLONE:
            img->inc_cloning(ot, new_id);
            ipool->update(img.get());
            break;

        case Image::USED_PERS:
        case Image::INIT:
        case Image::DISABLED:
        case Image::ERROR:
        case Image::DELETE:
        case Image::LOCKED:
        case Image::LOCKED_USED:
        case Image::LOCKED_USED_PERS:
            error = "Cannot clone image in current state";
            rc    = -1;
            break;
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImageManager::clone_image(int   new_id,
                              int   cloning_id,
                              const string& ds_data,
                              const string& extra_data,
                              string& error)
{
    const auto* imd = get();

    ostringstream oss;

    string  path;
    string  img_tmpl;

    if ( imd == nullptr )
    {
        error = "Could not get datastore driver";

        NebulaLog::log("ImM", Log::ERROR, error);
        return -1;
    }

    if ( set_img_clone_state(new_id, cloning_id, error) == -1 )
    {
        return -1;
    }

    auto img = ipool->get_ro(new_id);

    if (img == nullptr)
    {
        release_cloning_image(cloning_id, new_id);

        error = "Target image deleted during cloning operation";
        return -1;
    }

    string drv_msg(format_message(img->to_xml(img_tmpl), ds_data, extra_data));

    image_msg_t msg(ImageManagerMessages::CLONE, "", img->get_oid(), drv_msg);

    imd->write(msg);

    oss << "Cloning image " << img->get_path()
        <<" to repository as image "<<img->get_oid();

    NebulaLog::log("ImM", Log::INFO, oss);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImageManager::register_image(int iid,
                                 const string& ds_data,
                                 const string& extra_data,
                                 string& error)
{
    const auto* imd = get();

    ostringstream oss;

    if ( imd == nullptr )
    {
        error = "Could not get datastore driver";
        NebulaLog::log("ImM",Log::ERROR, error);
        return -1;
    }

    auto img = ipool->get(iid);

    if (!img)
    {
        error = "Image deleted during register operation";
        return -1;
    }

    string img_tmpl;
    string path = img->get_path();

    string drv_msg(format_message(img->to_xml(img_tmpl), ds_data, extra_data));

    if ( path.empty() ) //NO PATH
    {
        string source = img->get_source();

        if ( !source.empty() ) //Source in Template
        {
            img->set_state_unlock();
            ipool->update(img.get());

            oss << "Using source " << source
                << " from template for image " << img->get_name();
        }
        else if ( img->is_saving() || img->get_type() == Image::DATABLOCK
                || img->get_type() == Image::OS)
        {
            image_msg_t msg(ImageManagerMessages::MKFS, "", img->get_oid(), drv_msg);
            imd->write(msg);

            oss << "Creating disk at " << source << " of "<<  img->get_size()
                << "Mb (format: " <<  img->get_format() << ")";
        }
    }
    else //PATH -> COPY TO REPOSITORY AS SOURCE
    {
        image_msg_t msg(ImageManagerMessages::CP, "", img->get_oid(), drv_msg);
        imd->write(msg);

        oss << "Copying " << path <<" to repository for image "<<img->get_oid();
    }

    NebulaLog::log("ImM",Log::INFO,oss);

    return 0;
}
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImageManager::stat_image(Template*     img_tmpl,
                             const string& ds_data,
                             string&       res)
{
    const auto* imd = get();

    string  type_att;

    ostringstream  img_data;

    int rc = 0;

    if ( imd == nullptr )
    {
        res = "Could not get datastore driver";
        NebulaLog::log("ImM",Log::ERROR, res);
        return -1;
    }

    img_tmpl->get("TYPE", type_att);

    switch (Image::str_to_type(type_att))
    {
        case Image::BACKUP:
            if ( img_tmpl->get("SIZE", res) )
            {
                return 0;
            }

            res = "";

            return -1;

        case Image::CDROM:
        case Image::KERNEL:
        case Image::RAMDISK:
        case Image::CONTEXT:
            img_tmpl->get("SOURCE", res);

            if (!res.empty())
            {
                long long size_l;

                if (!img_tmpl->get("SIZE", size_l))
                {
                    res = "Wrong number or missing SIZE attribute.";
                    return -1;
                }

                img_tmpl->get("SIZE", res);

                return 0;
            }

            img_tmpl->get("PATH", res);

            if (res.empty())
            {
                res = "Either PATH or SOURCE are required for " + type_att;
                return -1;
            }

            img_data << "<IMAGE><PATH>"
                     << one_util::xml_escape(res)
                     << "</PATH></IMAGE>";
            break;

        case Image::OS:
        case Image::DATABLOCK:
            img_tmpl->get("SOURCE", res);

            if (!res.empty()) //SOURCE in Image
            {
                long long size_l;

                if (!img_tmpl->get("SIZE", size_l))
                {
                    res = "Wrong number or missing SIZE attribute.";
                    return -1;
                }

                img_tmpl->get("SIZE", res);

                return 0;
            }

            img_tmpl->get("PATH", res);

            if (res.empty())//no PATH, created using mkfs
            {
                long long size_l;

                if (!img_tmpl->get("SIZE", size_l))
                {
                    res = "Wrong number or missing SIZE attribute.";
                    return -1;
                }

                img_tmpl->get("SIZE", res);

                return 0;
            }
            else
            {
                img_data << "<IMAGE><PATH>"
                         << one_util::xml_escape(res)
                         << "</PATH></IMAGE>";
            }
            break;
    }

    SyncRequest sr;

    add_request(&sr);

    string drv_msg(format_message(img_data.str(), ds_data, ""));

    image_msg_t msg(ImageManagerMessages::STAT, "", sr.id, drv_msg);
    imd->write(msg);

    sr.wait();

    res = sr.message;

    if ( sr.result != true )
    {
        rc = -1;
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string ImageManager::format_message(
    const string& img_data,
    const string& ds_data,
    const string& extra_data)
{
    ostringstream oss;

    oss << "<DS_DRIVER_ACTION_DATA>"
        << img_data
        << ds_data
        << extra_data
        << "</DS_DRIVER_ACTION_DATA>";

    string base64;
    ssl_util::base64_encode(oss.str(), base64);

    return base64;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ImageManager::set_image_snapshots(int iid, const Snapshots& s)
{
    auto img = ipool->get(iid);

    if (!img)
    {
        return;
    }

    switch(img->get_type())
    {
        case Image::OS:
        case Image::DATABLOCK:
            break;

        case Image::KERNEL:
        case Image::RAMDISK:
        case Image::CONTEXT:
        case Image::CDROM:
        case Image::BACKUP:
            return;
    }

    if (img->get_state() != Image::USED_PERS)
    {
        return;
    }

    if (s.empty())
    {
        img->clear_snapshots();
    }
    else
    {
        img->set_snapshots(s);
    }

    ipool->update(img.get());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ImageManager::clear_image_snapshots(int iid)
{
    Snapshots _snaps(-1, Snapshots::DENY);

    set_image_snapshots(iid, _snaps);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ImageManager::set_image_size(int iid, long long size)
{
    auto img = ipool->get(iid);

    if (!img)
    {
        return;
    }

    switch(img->get_type())
    {
        case Image::OS:
        case Image::DATABLOCK:
            break;

        case Image::KERNEL:
        case Image::RAMDISK:
        case Image::CONTEXT:
        case Image::CDROM:
        case Image::BACKUP:
            return;
    }

    if (img->get_state() != Image::USED_PERS)
    {
        return;
    }

    img->set_size(size);

    ipool->update(img.get());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImageManager::delete_snapshot(int iid, int sid, string& error)
{
    const auto* imd = get();

    if ( imd == nullptr )
    {
        error = "Could not get datastore driver";
        NebulaLog::log("ImM",Log::ERROR, error);

        return -1;
    }

    int ds_id;

    if ( auto img = ipool->get_ro(iid) )
    {
        ds_id = img->get_ds_id();
    }
    else
    {
        error = "Image does not exist";
        return -1;
    }

    string ds_data;

    if (auto ds = dspool->get_ro(ds_id))
    {
        ds->decrypt();

        ds->to_xml(ds_data);
    }
    else
    {
       error = "Datastore no longer exists";
       return -1;
    }

    /* ---------------------------------------------------------------------- */
    /*  Check action consistency:                                             */
    /*    state is READY                                                      */
    /*    snapshot can be deleted (not active, no childs, exists)             */
    /* ---------------------------------------------------------------------- */
    auto img = ipool->get(iid);

    if ( img == nullptr )
    {
        error = "Image does not exist";
        return -1;
    }

    if ( img->get_type() != Image::OS && img->get_type() != Image::DATABLOCK )
    {
        error = "IMAGES of type KERNEL, RAMDISK, BACKUP and CONTEXT does not "
                "have snapshots.";
        return -1;
    }

    if (img->get_state() != Image::READY)
    {
        error = "Cannot delete snapshot in state " + Image::state_to_str(img->get_state());
        return -1;
    }

    const Snapshots& snaps = img->get_snapshots();

    if (!snaps.test_delete_image(sid, error))
    {
        return -1;
    }

    /* ---------------------------------------------------------------------- */
    /*  Format message and send action to driver                              */
    /* ---------------------------------------------------------------------- */
    img->set_target_snapshot(sid);

    string img_tmpl;
    string drv_msg(format_message(img->to_xml(img_tmpl), ds_data, ""));

    image_msg_t msg(ImageManagerMessages::SNAP_DELETE, "", iid, drv_msg);

    imd->write(msg);

    img->set_state(Image::LOCKED);

    ipool->update(img.get());

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImageManager::revert_snapshot(int iid, int sid, string& error)
{
    const auto* imd = get();

    if ( imd == nullptr )
    {
        error = "Could not get datastore driver";
        NebulaLog::log("ImM",Log::ERROR, error);

        return -1;
    }

    int ds_id;

    if ( auto img = ipool->get_ro(iid) )
    {
        ds_id = img->get_ds_id();
    }
    else
    {
        error = "Image does not exist";
        return -1;
    }

    string ds_data;

    if (auto ds = dspool->get_ro(ds_id))
    {
        ds->decrypt();

        ds->to_xml(ds_data);
    }
    else
    {
       error = "Datastore no longer exists";
       return -1;
    }

    /* ---------------------------------------------------------------------- */
    /*  Check action consistency:                                             */
    /*    state is READY                                                      */
    /*    snapshot exists                                                     */
    /*    snapshot is not the active one                                      */
    /* ---------------------------------------------------------------------- */
    auto img = ipool->get(iid);

    if ( img == nullptr )
    {
        error = "Image does not exist";
        return -1;
    }

    if ( img->get_type() != Image::OS && img->get_type() != Image::DATABLOCK )
    {
        error = "IMAGES of type KERNEL, RAMDISK, BACKUP and CONTEXT does not "
                "have snapshots.";
        return -1;
    }

    if (img->get_state() != Image::READY)
    {
        error = "Cannot revert to snapshot in state " + Image::state_to_str(img->get_state());
        return -1;
    }

    const Snapshots& snaps = img->get_snapshots();

    if (!snaps.exists(sid))
    {
        error = "Snapshot does not exist";

        return -1;
    }

    /* ---------------------------------------------------------------------- */
    /*  Format message and send action to driver                              */
    /* ---------------------------------------------------------------------- */
    img->set_target_snapshot(sid);

    string   img_tmpl;
    string drv_msg(format_message(img->to_xml(img_tmpl), ds_data, ""));

    image_msg_t msg(ImageManagerMessages::SNAP_REVERT, "", iid, drv_msg);

    imd->write(msg);

    img->set_state(Image::LOCKED);

    ipool->update(img.get());

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImageManager::flatten_snapshot(int iid, int sid, string& error)
{
    const auto* imd = get();

    if ( imd == nullptr )
    {
        error = "Could not get datastore driver";
        NebulaLog::log("ImM",Log::ERROR, error);

        return -1;
    }

    int ds_id;

    if ( auto img = ipool->get_ro(iid) )
    {
        ds_id = img->get_ds_id();
    }
    else
    {
        error = "Image does not exist";
        return -1;
    }

    string ds_data;

    if (auto ds = dspool->get_ro(ds_id))
    {
        ds->decrypt();

        ds->to_xml(ds_data);
    }
    else
    {
       error = "Datastore no longer exists";
       return -1;
    }

    /* ---------------------------------------------------------------------- */
    /*  Check action consistency:                                             */
    /*    state is READY                                                      */
    /*    snapshot exists                                                     */
    /* ---------------------------------------------------------------------- */

    auto img = ipool->get(iid);

    if ( img == nullptr )
    {
        error = "Image does not exist";
        return -1;
    }

    if ( img->get_type() != Image::OS && img->get_type() != Image::DATABLOCK )
    {
        error = "IMAGES of type KERNEL, RAMDISK, BACKUP and CONTEXT does not "
                "have snapshots.";
        return -1;
    }

    if (img->get_state() != Image::READY)
    {
        error = "Cannot flatten snapshot in state " + Image::state_to_str(img->get_state());
        return -1;
    }

    const Snapshots& snaps = img->get_snapshots();

    if (!snaps.exists(sid))
    {
        error = "Snapshot does not exist";

        return -1;
    }

    /* ---------------------------------------------------------------------- */
    /*  Format message and send action to driver                              */
    /* ---------------------------------------------------------------------- */

    img->set_target_snapshot(sid);

    string   img_tmpl;
    string   drv_msg(format_message(img->to_xml(img_tmpl), ds_data, ""));

    image_msg_t msg(ImageManagerMessages::SNAP_FLATTEN, "", iid, drv_msg);

    imd->write(msg);

    img->set_state(Image::LOCKED);

    ipool->update(img.get());

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImageManager::flatten_increments(int iid, int ds_id, const string& edata, string& error)
{
    const auto* imd = get();

    if ( imd == nullptr )
    {
        error = "Could not get datastore driver";
        return -1;
    }

    string ds_data;

    if (auto ds = dspool->get_ro(ds_id))
    {
        ds->decrypt();

        ds->to_xml(ds_data);
    }
    else
    {
       error = "Datastore no longer exists";
       return -1;
    }

    auto img = ipool->get(iid);

    if ( img == nullptr )
    {
        error = "Image does not exist";
        return -1;
    }

    if ( img->get_type() != Image::BACKUP )
    {
        error = "Image is not of type BACKUP";
        return -1;
    }

    if (img->get_state() != Image::READY)
    {
        error = "Cannot flatten increments in state " + Image::state_to_str(img->get_state());
        return -1;
    }

    /* ---------------------------------------------------------------------- */
    /*  Format message and send action to driver                              */
    /* ---------------------------------------------------------------------- */
    string img_tmpl;
    string drv_msg(format_message(img->to_xml(img_tmpl), ds_data, edata));

    image_msg_t msg(ImageManagerMessages::INCREMENT_FLATTEN, "", iid, drv_msg);

    imd->write(msg);

    img->set_state(Image::LOCKED);

    ipool->update(img.get());

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
int ImageManager::restore_image(int iid, int dst_ds_id, const std::string& txml,
    std::string& result)
{
    const auto* imd = get();
    std::string image_data, ds_data;

    int ds_id;

    if ( imd == nullptr )
    {
        result = "Could not get datastore driver";

        NebulaLog::log("ImM", Log::ERROR, result);
        return -1;
    }

    if (auto img = ipool->get_ro(iid))
    {
        img->to_xml(image_data);

        if ( img->get_type() != Image::BACKUP )
        {
            result = "Can only restore images of type BACKUP";
            return -1;
        }

        ds_id = img->get_ds_id();
    }
    else
    {
        result = "Image does not exist";
        return -1;
    }

    if (auto ds = dspool->get_ro(ds_id))
    {
        ds->decrypt();

        ds->to_xml(ds_data);
    }
    else
    {
       result = "Datastore does not exist";
       return -1;
    }

    if (auto ds = dspool->get_ro(dst_ds_id))
    {
        if ( ds->get_type() != Datastore:: IMAGE_DS )
        {
            result = "Destination can be only an image datastore";
            return -1;
        }
    }
    else
    {
       result = "Destination datastore does not exist";
       return -1;
    }

    ostringstream oss;

    oss << "<DESTINATION_DS_ID>" << dst_ds_id << "</DESTINATION_DS_ID>"
        << txml;

    SyncRequest sr;

    add_request(&sr);

    string drv_msg(format_message(image_data, ds_data, oss.str()));

    image_msg_t msg(ImageManagerMessages::RESTORE, "", sr.id, drv_msg);

    imd->write(msg);

    sr.wait(180);

    result = sr.message;

    return sr.result ? 0 : -1;
}
