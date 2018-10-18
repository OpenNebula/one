/* -------------------------------------------------------------------------- */
/* Copyright 2002-2018, OpenNebula Project, OpenNebula Systems                */
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


/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

Image * ImageManager::acquire_image(int vm_id, int image_id, bool attach,
        string& error)
{
    Image * img;
    int     rc;

    img = ipool->get(image_id);

    if ( img == 0 )
    {
        ostringstream oss;
        oss << "Image with ID: " << image_id  << " does not exist";

        error = oss.str();
        return 0;
    }

    rc = acquire_image(vm_id, img, attach, error);

    if ( rc != 0 )
    {
        img->unlock();
        img = 0;
    }

    return img;
}

/* -------------------------------------------------------------------------- */

Image * ImageManager::acquire_image(int vm_id, const string& name, int uid,
        bool attach, string& error)
{
    Image * img;
    int     rc;

    img = ipool->get(name,uid);

    if ( img == 0 )
    {
        ostringstream oss;
        oss << "User " << uid << " does not own an image with name: " << name
            << " . Set IMAGE_UNAME or IMAGE_UID of owner in DISK.";

        error = oss.str();
        return 0;
    }

    rc = acquire_image(vm_id, img, attach, error);

    if ( rc != 0 )
    {
        img->unlock();
        img = 0;
    }

    return img;
}

/* -------------------------------------------------------------------------- */

int ImageManager::acquire_image(int vm_id, Image *img, bool attach, string& error)
{
    int rc = 0;

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
            oss << "Image " << img->get_oid() << " (" << img->get_name() << ") "
                << "of type " << Image::type_to_str(img->get_type())
                << " cannot be used as DISK.";

            error = oss.str();
            return -1;
    }

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
        case Image::LOCKED_USED_PERS:
            oss << "Cannot acquire image " << img->get_oid()
                << ", it is persistent and already in use";

            error = oss.str();
            rc    = -1;
        break;

        case Image::USED:
            img->inc_running(vm_id);
            ipool->update(img);
        break;

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

    Image * img = ipool->get(iid);

    if ( img == 0 )
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
            NebulaLog::log("ImM", Log::ERROR, "Trying to release a KERNEL, "
                "RAMDISK or CONTEXT image");
            img->unlock();
            return;
    }

    switch (img->get_state())
    {
        case Image::USED_PERS:
            img->dec_running(vm_id);

            if (failed == true)
            {
                img->set_state(Image::ERROR);
            }
            else
            {
                img->set_state(Image::READY);
            }

            ipool->update(img);

            img->unlock();
        break;

        case Image::LOCKED_USED_PERS:
            img->dec_running(vm_id);

            if (failed == true)
            {
                img->set_state(Image::ERROR);
            }
            else
            {
                img->set_state(Image::LOCKED);
            }

            ipool->update(img);

            img->unlock();
        break;

        case Image::USED:
            if ( img->dec_running(vm_id) == 0  && img->get_cloning() == 0 )
            {
                img->set_state(Image::READY);
            }

            ipool->update(img);

            img->unlock();
        break;

        case Image::LOCKED_USED:
            if ( img->dec_running(vm_id) == 0  && img->get_cloning() == 0 )
            {
                img->set_state(Image::LOCKED);
            }

            ipool->update(img);

            img->unlock();
        break;

        case Image::LOCKED:
            oss << "Releasing image in wrong state: "
                << Image::state_to_str(img->get_state());

            NebulaLog::log("ImM", Log::ERROR, oss.str());

            img->unlock();
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

           img->unlock();
        break;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ImageManager::release_cloning_resource(
        int iid, PoolObjectSQL::ObjectType ot, int clone_oid)
{
    Image * img = ipool->get(iid);

    if ( img == 0 )
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
            NebulaLog::log("ImM", Log::ERROR, "Trying to release a cloning "
                "KERNEL, RAMDISK or CONTEXT image");
            img->unlock();
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

            ipool->update(img);
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

    img->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImageManager::enable_image(int iid, bool to_enable, string& error_str)
{
    int rc = 0;
    Image * img;

    ostringstream oss;

    img = ipool->get(iid);

    if ( img == 0 )
    {
        return -1;
    }

    if ( to_enable == true )
    {
        switch (img->get_state())
        {
            case Image::DISABLED:
                img->set_state(Image::READY);
                ipool->update(img);
            break;
            case Image::ERROR:
                img->set_state_unlock();
                ipool->update(img);
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
                ipool->update(img);
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

    img->unlock();

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImageManager::delete_image(int iid, string& error_str)
{
    Image *     img;
    Datastore * ds;

    string   source;
    string   img_tmpl;
    string * drv_msg;
    string   ds_data;

    long long size;
    int ds_id;

    int uid;
    int gid;
    int cloning_id = -1;
    int vm_saving_id = -1;

    ostringstream oss;

    img = ipool->get_ro(iid);

    if ( img == 0 )
    {
        error_str = "Image does not exist";
        return -1;
    }

    ds_id = img->get_ds_id();

    img->unlock();

    ds = dspool->get_ro(ds_id);

    if ( ds == 0 )
    {
       error_str = "Datastore no longer exists cannot remove image";
       return -1;
    }

    ds->to_xml(ds_data);

    ds->unlock();

    img = ipool->get(iid);

    if ( img == 0 )
    {
        error_str = "Image does not exist";
        return -1;
    }

    switch(img->get_state())
    {
        case Image::READY:
            if ( img->get_running() != 0 )
            {
                oss << "There are " << img->get_running() << " VMs using it.";
                error_str = oss.str();

                img->unlock();
                return -1; //Cannot remove images in use
            }
        break;

        case Image::CLONE:
            oss << "There are " << img->get_cloning() << " active clone operations.";
            error_str = oss.str();

            img->unlock();
            return -1; //Cannot remove images in use
        break;

        case Image::USED:
        case Image::USED_PERS:
        case Image::LOCKED_USED:
        case Image::LOCKED_USED_PERS:
            oss << "There are " << img->get_running() << " VMs using it.";
            error_str = oss.str();

            img->unlock();
            return -1; //Cannot remove images in use
        break;

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

    const ImageManagerDriver* imd = get();

    if ( imd == 0 )
    {
        error_str = "Error getting ImageManagerDriver";

        img->unlock();
        return -1;
    }

    drv_msg = format_message(img->to_xml(img_tmpl), ds_data, "");
    source  = img->get_source();
    size    = img->get_size();
    ds_id   = img->get_ds_id();
    uid     = img->get_uid();
    gid     = img->get_gid();

    if (source.empty())
    {
        string err_str;
        int    rc;

        rc = ipool->drop(img, err_str);

        if ( rc < 0 )
        {
            NebulaLog::log("ImM",Log::ERROR,
                "Image could not be removed from DB");
        }
    }
    else
    {
        imd->rm(img->get_oid(), *drv_msg);
        img->set_state(Image::DELETE);

        img->clear_cloning_id();

        ipool->update(img);
    }

    long long snap_size = (img->get_snapshots()).get_total_size();

    img->unlock();

    delete drv_msg;

    /* -------------------- Update Group & User quota counters -------------- */

    Template img_usage;

    img_usage.add("DATASTORE", ds_id);
    img_usage.add("SIZE", size + snap_size);

    Quotas::ds_del(uid, gid, &img_usage);

    /* --------------- Update cloning image if needed ----------------------- */

    if ( cloning_id != -1 )
    {
        release_cloning_image(cloning_id, iid);
    }

    ds = dspool->get(ds_id);

    if ( ds != 0 )
    {
        ds->del_image(iid);
        dspool->update(ds);

        ds->unlock();
    }

    /* --------------- Release VM in hotplug -------------------------------- */

    // This is only needed if the image is deleted before the mkfs action
    // is completed

    if ( vm_saving_id != -1 )
    {
        VirtualMachine*     vm;
        VirtualMachinePool* vmpool = Nebula::instance().get_vmpool();

        if ((vm = vmpool->get(vm_saving_id)) != 0)
        {
            vm->clear_saveas_state();

            vm->clear_saveas_disk();

            vmpool->update(vm);

            vm->unlock();
        }
    }

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImageManager::can_clone_image(int cloning_id, ostringstream&  oss_error)
{
    Image *       img;

    img = ipool->get_ro(cloning_id);

    if (img == 0)
    {
        oss_error << "Cannot clone image, it does not exist";
        return -1;
    }

    Image::ImageState state = img->get_state();

    img->unlock();

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
    int     rc  = 0;
    Image * img = ipool->get(cloning_id);

    if (img == 0)
    {
        error = "Cannot clone image, it does not exist";
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

            ipool->update(img);
            break;

        case Image::USED:
        case Image::CLONE:
            img->inc_cloning(ot, new_id);
            ipool->update(img);
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

    img->unlock();

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
    const ImageManagerDriver* imd = get();

    ostringstream oss;
    Image *       img;

    string  path;
    string  img_tmpl;
    string* drv_msg;

    if ( imd == 0 )
    {
        error = "Could not get datastore driver";

        NebulaLog::log("ImM", Log::ERROR, error);
        return -1;
    }

    if ( set_img_clone_state(new_id, cloning_id, error) == -1 )
    {
        return -1;
    }

    img = ipool->get_ro(new_id);

    if (img == 0)
    {
        release_cloning_image(cloning_id, new_id);

        error = "Target image deleted during cloning operation";
        return -1;
    }

    drv_msg = format_message(img->to_xml(img_tmpl), ds_data, extra_data);

    imd->clone(img->get_oid(), *drv_msg);

    oss << "Cloning image " << img->get_path()
        <<" to repository as image "<<img->get_oid();

    NebulaLog::log("ImM", Log::INFO, oss);

    img->unlock();

    delete drv_msg;

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImageManager::register_image(int iid,
                                 const string& ds_data,
                                 const string& extra_data,
                                 string& error)
{
    const ImageManagerDriver* imd = get();

    ostringstream oss;
    Image *       img;

    string        path;
    string        img_tmpl;
    string *      drv_msg;


    if ( imd == 0 )
    {
        error = "Could not get datastore driver";
        NebulaLog::log("ImM",Log::ERROR, error);
        return -1;
    }

    img = ipool->get(iid);

    if (img == 0)
    {
        error = "Image deleted during copy operation";
        return -1;
    }

    drv_msg = format_message(img->to_xml(img_tmpl), ds_data, extra_data);
    path    = img->get_path();

    if ( path.empty() == true ) //NO PATH
    {
        string source = img->get_source();

        if ( !source.empty() ) //Source in Template
        {
            img->set_state_unlock();
            ipool->update(img);

            oss << "Using source " << source
                << " from template for image " << img->get_name();
        }
        else if ( img->is_saving() || img->get_type() == Image::DATABLOCK 
                || img->get_type() == Image::OS)
        {
            imd->mkfs(img->get_oid(), *drv_msg);

            oss << "Creating disk at " << source << " of "<<  img->get_size()
                << "Mb (type: " <<  img->get_fstype() << ")";
        }
    }
    else //PATH -> COPY TO REPOSITORY AS SOURCE
    {
        imd->cp(img->get_oid(), *drv_msg);
        oss << "Copying " << path <<" to repository for image "<<img->get_oid();
    }

    NebulaLog::log("ImM",Log::INFO,oss);

    img->unlock();

    delete drv_msg;

    return 0;
}
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImageManager::stat_image(Template*     img_tmpl,
                             const string& ds_data,
                             string&       res)
{
    const ImageManagerDriver* imd = get();

    string* drv_msg;
    string  type_att;

    ostringstream  img_data;

    SyncRequest sr;

    int rc = 0;

    if ( imd == 0 )
    {
        res = "Could not get datastore driver";
        NebulaLog::log("ImM",Log::ERROR, res);
        return -1;
    }

    img_tmpl->get("TYPE", type_att);

    switch (Image::str_to_type(type_att))
    {
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

        case Image::DATABLOCK:
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

    add_request(&sr);

    drv_msg = format_message(img_data.str(), ds_data, "");

    imd->stat(sr.id, *drv_msg);

    sr.wait();

    delete drv_msg;

    res = sr.message;

    if ( sr.result != true )
    {
        rc = -1;
    }

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string * ImageManager::format_message(
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

    return one_util::base64_encode(oss.str());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ImageManager::set_image_snapshots(int iid, const Snapshots& s)
{
    Image * img = ipool->get(iid);

    if ( img == 0 )
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
            img->unlock();
            return;
    }

    if (img->get_state() != Image::USED_PERS)
    {
        img->unlock();
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

    ipool->update(img);

    img->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ImageManager::clear_image_snapshots(int iid)
{
    Snapshots _snaps(-1, false);

    set_image_snapshots(iid, _snaps);
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void ImageManager::set_image_size(int iid, long long size)
{
    Image * img = ipool->get(iid);

    if ( img == 0 )
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
            img->unlock();
            return;
    }

    if (img->get_state() != Image::USED_PERS)
    {
        img->unlock();
        return;
    }

    img->set_size(size);

    ipool->update(img);

    img->unlock();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImageManager::delete_snapshot(int iid, int sid, string& error)
{
    const ImageManagerDriver* imd = get();

    if ( imd == 0 )
    {
        error = "Could not get datastore driver";
        NebulaLog::log("ImM",Log::ERROR, error);

        return -1;
    }

    Image * img = ipool->get_ro(iid);

    if ( img == 0 )
    {
        error = "Image does not exist";
        return -1;
    }

    /* ---------------------------------------------------------------------- */
    /*  Get DS data for driver                                                */
    /* ---------------------------------------------------------------------- */
    int ds_id = img->get_ds_id();

    img->unlock();

    string ds_data;

    Datastore * ds = dspool->get_ro(ds_id);

    if ( ds == 0 )
    {
       error = "Datastore no longer exists";
       return -1;
    }

    ds->to_xml(ds_data);

    ds->unlock();

    /* ---------------------------------------------------------------------- */
    /*  Check action consistency:                                             */
    /*    state is READY                                                      */
    /*    snapshot can be deleted (not active, no childs, exists)             */
    /* ---------------------------------------------------------------------- */
    img = ipool->get(iid);

    if ( img == 0 )
    {
        error = "Image does not exist";
        return -1;
    }

    if (img->get_state() != Image::READY)
    {
        error = "Cannot delete snapshot in state " + Image::state_to_str(img->get_state());
        img->unlock();
        return -1;
    }

    const Snapshots& snaps = img->get_snapshots();

    if (!snaps.test_delete(sid, error))
    {
        img->unlock();
        return -1;
    }

    /* ---------------------------------------------------------------------- */
    /*  Format message and send action to driver                              */
    /* ---------------------------------------------------------------------- */
    img->set_target_snapshot(sid);

    string img_tmpl;
    string * drv_msg = format_message(img->to_xml(img_tmpl), ds_data, "");

    imd->snapshot_delete(iid, *drv_msg);

    img->set_state(Image::LOCKED);

    ipool->update(img);

    img->unlock();

    delete drv_msg;

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImageManager::revert_snapshot(int iid, int sid, string& error)
{
    const ImageManagerDriver* imd = get();

    if ( imd == 0 )
    {
        error = "Could not get datastore driver";
        NebulaLog::log("ImM",Log::ERROR, error);

        return -1;
    }

    Image * img = ipool->get_ro(iid);

    if ( img == 0 )
    {
        error = "Image does not exist";
        return -1;
    }

    /* ---------------------------------------------------------------------- */
    /*  Get DS data for driver                                                */
    /* ---------------------------------------------------------------------- */
    int ds_id = img->get_ds_id();

    img->unlock();

    string ds_data;

    Datastore * ds = dspool->get_ro(ds_id);

    if ( ds == 0 )
    {
       error = "Datastore no longer exists";
       return -1;
    }

    ds->to_xml(ds_data);

    ds->unlock();

    /* ---------------------------------------------------------------------- */
    /*  Check action consistency:                                             */
    /*    state is READY                                                      */
    /*    snapshot exists                                                     */
    /*    snapshot is not the active one                                      */
    /* ---------------------------------------------------------------------- */
    img = ipool->get(iid);

    if ( img == 0 )
    {
        error = "Image does not exist";
        return -1;
    }

    if (img->get_state() != Image::READY)
    {
        error = "Cannot revert to snapshot in state " + Image::state_to_str(img->get_state());
        img->unlock();
        return -1;
    }

    const Snapshots& snaps = img->get_snapshots();

    if (!snaps.exists(sid))
    {
        error = "Snapshot does not exist";

        img->unlock();
        return -1;
    }

    if (snaps.get_active_id() == sid)
    {
        error = "Snapshot is already the active one";

        img->unlock();
        return -1;
    }

    /* ---------------------------------------------------------------------- */
    /*  Format message and send action to driver                              */
    /* ---------------------------------------------------------------------- */
    img->set_target_snapshot(sid);

    string   img_tmpl;
    string * drv_msg = format_message(img->to_xml(img_tmpl), ds_data, "");

    imd->snapshot_revert(iid, *drv_msg);

    img->set_state(Image::LOCKED);

    ipool->update(img);

    img->unlock();

    delete drv_msg;

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int ImageManager::flatten_snapshot(int iid, int sid, string& error)
{
    const ImageManagerDriver* imd = get();

    if ( imd == 0 )
    {
        error = "Could not get datastore driver";
        NebulaLog::log("ImM",Log::ERROR, error);

        return -1;
    }

    Image * img = ipool->get_ro(iid);

    if ( img == 0 )
    {
        error = "Image does not exist";
        return -1;
    }

    /* ---------------------------------------------------------------------- */
    /*  Get DS data for driver                                                */
    /* ---------------------------------------------------------------------- */
    int ds_id = img->get_ds_id();

    img->unlock();

    string ds_data;

    Datastore * ds = dspool->get_ro(ds_id);

    if ( ds == 0 )
    {
       error = "Datastore no longer exists";
       return -1;
    }

    ds->to_xml(ds_data);

    ds->unlock();

    /* ---------------------------------------------------------------------- */
    /*  Check action consistency:                                             */
    /*    state is READY                                                      */
    /*    snapshot exists                                                     */
    /* ---------------------------------------------------------------------- */

    img = ipool->get(iid);

    if ( img == 0 )
    {
        error = "Image does not exist";
        return -1;
    }

    if (img->get_state() != Image::READY)
    {
        error = "Cannot flatten snapshot in state " + Image::state_to_str(img->get_state());
        img->unlock();
        return -1;
    }

    const Snapshots& snaps = img->get_snapshots();

    if (!snaps.exists(sid))
    {
        error = "Snapshot does not exist";

        img->unlock();
        return -1;
    }

    /* ---------------------------------------------------------------------- */
    /*  Format message and send action to driver                              */
    /* ---------------------------------------------------------------------- */

    img->set_target_snapshot(sid);

    string   img_tmpl;
    string * drv_msg = format_message(img->to_xml(img_tmpl), ds_data, "");

    imd->snapshot_flatten(iid, *drv_msg);

    img->set_state(Image::LOCKED);

    ipool->update(img);

    img->unlock();

    delete drv_msg;

    return 0;
}

