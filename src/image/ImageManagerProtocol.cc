/* -------------------------------------------------------------------------- */
/* Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                */
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
#include "ImagePool.h"
#include "DatastorePool.h"
#include "Quotas.h"
#include "TransferManager.h"
#include "VirtualMachine.h"
#include "VirtualMachinePool.h"
#include "Nebula.h"

/* ************************************************************************** */
/* Driver Protocol Implementation                                             */
/* ************************************************************************** */

void ImageManager::_undefined(unique_ptr<image_msg_t> msg)
{
    NebulaLog::warn("ImM", "Received UNDEFINED msg: " + msg->payload());
}

/* -------------------------------------------------------------------------- */

void ImageManager::_stat(unique_ptr<image_msg_t> msg)
{
    NebulaLog::dddebug("ImM", "_stat: " + msg->payload());

    if (msg->status() == "SUCCESS")
    {
        if (msg->payload().empty())
        {
            notify_request(msg->oid(), false, "Cannot get size from STAT");
        }

        notify_request(msg->oid(), true, msg->payload());
    }
    else
    {
        notify_request(msg->oid(), false, msg->payload());
    }
}

/* -------------------------------------------------------------------------- */

void ImageManager::_cp(unique_ptr<image_msg_t> msg)
{
    NebulaLog::dddebug("ImM", "_cp: " + msg->payload());

    string  source;
    int     ds_id = -1;

    ostringstream oss;
    istringstream is(msg->payload());

    auto image = ipool->get(msg->oid());

    if (image == nullptr)
    {
        if (msg->status() == "SUCCESS")
        {
            is >> source >> ws;

            if (!source.empty())
            {
                oss << "CP operation succeeded but image no longer exists."
                    << " Source image: " << source << ", may be left in datastore";

                NebulaLog::log("ImM", Log::ERROR, oss);
            }
        }

        return;
    }

    ds_id = image->get_ds_id();

    if (msg->status() != "SUCCESS")
    {
       goto error;
    }

    is >> source >> ws;

    if (is.fail())
    {
        goto error;
    }

    image->set_source(source);

    image->set_state_unlock();

    ipool->update(image);

    image->unlock();

    oss << "Image (" << msg->oid() << ") copied and ready to use.";
    NebulaLog::log("ImM", Log::INFO, oss);

    monitor_datastore(ds_id);

    return;

error:
    oss << "Error copying image in the datastore";

    const auto& info = msg->payload();

    if (!info.empty() && (info[0] != '-'))
    {
        oss << ": " << info;
    }

    NebulaLog::log("ImM", Log::ERROR, oss);

    image->set_template_error_message(oss.str());
    image->set_state(Image::ERROR);

    ipool->update(image);

    image->unlock();

    monitor_datastore(ds_id);

    return;
}

/* -------------------------------------------------------------------------- */

void ImageManager::_clone(unique_ptr<image_msg_t> msg)
{
    NebulaLog::dddebug("ImM", "_clone: " + msg->payload());

    int     cloning_id;
    int     ds_id = -1;

    Image * image = ipool->get(msg->oid());

    if (image == nullptr)
    {
        if (msg->status() == "SUCCESS")
        {
            ostringstream oss;

            if (!msg->payload().empty())
            {
                oss << "CLONE operation succeeded but image no longer exists."
                    << " Source image: " << msg->payload()
                    << ", may be left in datastore";

                NebulaLog::log("ImM", Log::ERROR, oss);
            }
        }

        return;
    }

    ds_id      = image->get_ds_id();
    cloning_id = image->get_cloning_id();

    if (msg->status() != "SUCCESS")
    {
       goto error;
    }

    image->set_source(msg->payload());

    image->set_state_unlock();

    image->clear_cloning_id();

    ipool->update(image);

    image->unlock();

    NebulaLog::info("ImM", "Image cloned and ready to use.");

    release_cloning_image(cloning_id, msg->oid());

    monitor_datastore(ds_id);

    return;

error:
    ostringstream oss;

    oss << "Error cloning from Image " << cloning_id;

    const auto& info = msg->payload();

    if (!info.empty() && (info[0] != '-'))
    {
        oss << ": " << info;
    }

    NebulaLog::log("ImM", Log::ERROR, oss);

    image->set_template_error_message(oss.str());
    image->set_state(Image::ERROR);

    image->clear_cloning_id();

    ipool->update(image);

    image->unlock();

    release_cloning_image(cloning_id, msg->oid());
}

/* -------------------------------------------------------------------------- */

void ImageManager::_mkfs(unique_ptr<image_msg_t> msg)
{
    NebulaLog::dddebug("ImM", "_mkfs: " + msg->payload());

    int vm_id   = -1;
    int disk_id = -1;

    VirtualMachine * vm = nullptr;

    ostringstream    oss;

    Nebula& nd                  = Nebula::instance();
    VirtualMachinePool * vmpool = nd.get_vmpool();
    TransferManager *  tm       = nd.get_tm();

    Image * image = ipool->get(msg->oid());
    const string& source = msg->payload();

    if (image == nullptr)
    {
        if (msg->status() == "SUCCESS")
        {
            ostringstream oss;

            if (!source.empty())
            {
                oss << "MkFS operation succeeded but image no longer exists."
                    << " Source image: " << source << ", may be left in datastore";

                NebulaLog::log("ImM", Log::ERROR, oss);
            }
        }

        return;
    }
    else if (image->get_state() == Image::DELETE)
    {
        NebulaLog::info("ImM", "Ignoring mkfs callback, image is "
                "being deleted");

        image->unlock();
        return;
    }

    bool is_saving = image->is_saving();
    int  ds_id     = image->get_ds_id();

    if (is_saving)
    {
        image->get_template_attribute("SAVED_DISK_ID", disk_id);
        image->get_template_attribute("SAVED_VM_ID", vm_id);
    }

    if (msg->status() != "SUCCESS")
    {
        goto error_img;
    }

    image->set_source(source);

    if (!is_saving)
    {
        image->set_state_unlock();
    }

    ipool->update(image);

    image->unlock();

    if (!is_saving)
    {
        NebulaLog::info("ImM", "Image created and ready to use");

        monitor_datastore(ds_id);

        return;
    }

    vm = vmpool->get(vm_id);

    if (vm == nullptr)
    {
        goto error_save_get;
    }

    if (vm->set_saveas_disk(disk_id, source, msg->oid()) == -1)
    {
        goto error_save_state;
    }

    tm->trigger(TMAction::SAVEAS_HOT, vm_id);

    vmpool->update(vm);

    vm->unlock();

    monitor_datastore(ds_id);

    return;

error_img:
    oss << "Error creating datablock";
    goto error;

error_save_get:
    oss << "Image created to save as a disk but VM does not exist.";
    goto error_save;

error_save_state:
    vm->unlock();
    oss << "Image created to save as disk but VM is no longer running";

error_save:
    image = ipool->get(msg->oid());

    if (image == nullptr)
    {
        NebulaLog::log("ImM", Log::ERROR, oss);
        return;
    }

error:
    const auto& info = msg->payload();

    if (!info.empty() && (info[0] != '-'))
    {
        oss << ": " << info;
    }

    NebulaLog::log("ImM", Log::ERROR, oss);

    image->set_template_error_message(oss.str());
    image->set_state(Image::ERROR);

    ipool->update(image);

    image->unlock();

    if (is_saving && vm_id != -1)
    {
        if ((vm = vmpool->get(vm_id)) != nullptr)
        {
            vm->clear_saveas_state();

            vm->clear_saveas_disk();

            vmpool->update(vm);

            vm->unlock();
        }
    }

    monitor_datastore(ds_id);

    return;
}

/* -------------------------------------------------------------------------- */

void ImageManager::_rm(unique_ptr<image_msg_t> msg)
{
    NebulaLog::dddebug("ImM", "_rm: " + msg->payload());

    int ds_id = -1;

    string  tmp_error;
    Image * image;

    ostringstream oss;

    image = ipool->get(msg->oid());

    if (image == nullptr)
    {
        return;
    }

    ds_id  = image->get_ds_id();
    const auto& source = image->get_source();

    int rc = ipool->drop(image, tmp_error);

    image->unlock();

    if (msg->status() != "SUCCESS")
    {
        goto error;
    }
    else if (rc < 0)
    {
        goto error_drop;
    }

    NebulaLog::info("ImM", "Image successfully removed.");

    monitor_datastore(ds_id);

    return;

error_drop:
    oss << "Error removing image from DB: " << tmp_error
        << ". Remove image source " << source << " to completely delete image.";

    NebulaLog::log("ImM", Log::ERROR, oss);
    return;

error:
    oss << "Error removing image from datastore. Manually remove image source "
        << source << " to completely delete the image";

    const auto& info = msg->payload();

    if (!info.empty() && (info[0] != '-'))
    {
        oss << ": " << info;
    }

    NebulaLog::log("ImM", Log::ERROR, oss);

    return;
}

/* -------------------------------------------------------------------------- */

void ImageManager::_monitor(unique_ptr<image_msg_t> msg)
{
    NebulaLog::dddebug("ImM", "_monitor: " + msg->payload());

    ostringstream oss;

    string  dsinfo64 = msg->payload();

    if (dsinfo64.empty())
    {
        oss << "Error monitoring datastore " << msg->oid()
            << ". Bad monitor data: " << dsinfo64;

        NebulaLog::log("ImM", Log::ERROR, oss);
        return;
    }

    unique_ptr<string> dsinfo(one_util::base64_decode(dsinfo64));

    if (dsinfo == nullptr)
    {
        oss << "Error monitoring datastore " << msg->oid()
            << ". Bad monitor data: " << dsinfo64;

        NebulaLog::log("ImM", Log::ERROR, oss);
        return;
    }

    if (msg->status() != "SUCCESS")
    {
        oss << "Error monitoring datastore " << msg->oid() << ": " << dsinfo64;

        if (!(*dsinfo).empty())
        {
            oss << ". Decoded info: " << *dsinfo;
        }

        NebulaLog::log("ImM", Log::ERROR, oss);

        return;
    }

    Template monitor_data;

    char*  error_msg;
    int    rc = monitor_data.parse(*dsinfo, &error_msg);

    if (rc != 0)
    {
        oss << "Error parsing datastore information: " << error_msg
            << ". Monitoring information: " << endl << *dsinfo;

        NebulaLog::log("ImM", Log::ERROR, oss);

        free(error_msg);

        return;
    }

    float  total, free, used;
    string ds_name;

    monitor_data.get("TOTAL_MB", total);
    monitor_data.get("FREE_MB", free);
    monitor_data.get("USED_MB", used);

    Datastore * ds = dspool->get(msg->oid());

    if (ds == nullptr)
    {
        return;
    }

    ds_name = ds->get_name();

    ds->update_monitor(total, free, used);

    dspool->update(ds);

    ds->unlock();

    oss << "Datastore " << ds_name << " (" << msg->oid()
        << ") successfully monitored.";

    NebulaLog::debug("ImM", oss.str());

    return;
}

/* -------------------------------------------------------------------------- */

void ImageManager::_snap_delete(unique_ptr<image_msg_t> msg)
{
    NebulaLog::dddebug("ImM", "_snap_delete: " + msg->payload());

    long long   snap_size;
    int         ds_id, uid, gid;

    Image * image = ipool->get(msg->oid());

    if (image == nullptr)
    {
        return;
    }

    image->set_state_unlock();

    int snap_id = image->get_target_snapshot();

    if (snap_id == -1)
    {
        NebulaLog::error("ImM", "No target snapshot in callback");

        ipool->update(image);

        image->unlock();
        return;
    }

    if (msg->status() == "SUCCESS")
    {
        ds_id     = image->get_ds_id();
        uid       = image->get_uid();
        gid       = image->get_gid();
        snap_size = (image->get_snapshots()).get_snapshot_size(snap_id);

        image->delete_snapshot(snap_id);
    }
    else
    {
        ostringstream oss;

        oss << "Error removing snapshot " << snap_id
            << " from image " << msg->oid();

        const auto& info = msg->payload();

        if (!info.empty() && (info[0] != '-'))
        {
            oss << ": " << info;
        }

        image->set_template_error_message(oss.str());

        NebulaLog::log("ImM", Log::ERROR, oss);
    }

    image->clear_target_snapshot();

    ipool->update(image);

    image->unlock();

    if (msg->status() == "SUCCESS")
    {
        Template quotas;

        quotas.add("DATASTORE", ds_id);
        quotas.add("SIZE", snap_size);
        quotas.add("IMAGES", 0);

        Quotas::ds_del(uid, gid, &quotas);
    }
}

/* -------------------------------------------------------------------------- */

void ImageManager::_snap_revert(unique_ptr<image_msg_t> msg)
{
    NebulaLog::dddebug("ImM", "_snap_revert: " + msg->payload());

    Image * image = ipool->get(msg->oid());

    if (image == nullptr)
    {
        return;
    }

    int snap_id = image->get_target_snapshot();

    image->set_state_unlock();

    if (snap_id == -1)
    {
        NebulaLog::error("ImM", "No target snapshot in callback");

        ipool->update(image);

        image->unlock();
        return;
    }

    if (msg->status() == "SUCCESS")
    {
        image->revert_snapshot(snap_id);
    }
    else
    {
        ostringstream oss;
        oss << "Error reverting image " << msg->oid()
            << " to snapshot " << snap_id;

        const auto& info = msg->payload();

        if (!info.empty() && (info[0] != '-'))
        {
            oss << ": " << info;
        }

        image->set_template_error_message(oss.str());

        NebulaLog::log("ImM", Log::ERROR, oss);
    }

    image->clear_target_snapshot();

    ipool->update(image);

    image->unlock();
}

/* -------------------------------------------------------------------------- */

void ImageManager::_snap_flatten(unique_ptr<image_msg_t> msg)
{
    NebulaLog::dddebug("ImM", "_snap_flatten: " + msg->payload());

    long long   snap_size;
    int         ds_id, uid, gid;

    Image * image = ipool->get(msg->oid());

    if (image == nullptr)
    {
        return;
    }

    if (msg->status() == "SUCCESS")
    {
        ds_id     = image->get_ds_id();
        uid       = image->get_uid();
        gid       = image->get_gid();
        snap_size = (image->get_snapshots()).get_total_size();

        image->clear_snapshots();
    }
    else
    {
        ostringstream oss;
        oss << "Error flattening image snapshot";

        const auto& info = msg->payload();

        if (!info.empty() && (info[0] != '-'))
        {
            oss << ": " << info;
        }

        image->set_template_error_message(oss.str());

        NebulaLog::log("ImM", Log::ERROR, oss);
    }

    image->set_state_unlock();

    image->clear_target_snapshot();

    ipool->update(image);

    image->unlock();

    if (msg->status() == "SUCCESS")
    {
        Template quotas;

        quotas.add("DATASTORE", ds_id);
        quotas.add("SIZE", snap_size);
        quotas.add("IMAGES", 0);

        Quotas::ds_del(uid, gid, &quotas);
    }
}

/* -------------------------------------------------------------------------- */

void ImageManager::_log(unique_ptr<image_msg_t> msg)
{
    NebulaLog::log("ImM", log_type(msg->status()[0]), msg->payload());
}
